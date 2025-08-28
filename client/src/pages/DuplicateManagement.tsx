import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Zap,
  BarChart3,
  Shield,
  GitMerge,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UnificationStats {
  totalItems: number;
  uniqueProducts: number;
  estimatedDuplicates: number;
  potentialSavings: number;
}

interface DuplicateCheckResult {
  shouldBlock: boolean;
  existingItem?: {
    itemNumber: string;
    partNumber: string;
    description: string;
  };
  confidence: number;
  reason: string;
  suggestedAction: string;
}

interface UnificationResult {
  success: boolean;
  processedGroups: number;
  updatedRows: number;
  unifiedItems: Array<{
    masterId: string;
    duplicateIds: string[];
    productKey: string;
  }>;
}

export default function DuplicateManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUnifying, setIsUnifying] = useState(false);
  const [testItem, setTestItem] = useState({
    partNumber: '',
    description: '',
    lineItem: '',
    category: 'general'
  });
  const [checkResult, setCheckResult] = useState<DuplicateCheckResult | null>(null);

  // جلب إحصائيات التوحيد
  const { data: stats, isLoading: statsLoading } = useQuery<{ success: boolean; stats: UnificationStats }>({
    queryKey: ['/api/unification-stats'],
    refetchInterval: 30000 // تحديث كل 30 ثانية
  });

  // تطبيق التوحيد
  const unifyMutation = useMutation({
    mutationFn: () => apiRequest('/api/apply-unification', 'POST', {}),
    onSuccess: (data: UnificationResult) => {
      if (data.success) {
        toast({
          title: "✅ نجح التوحيد",
          description: `تم توحيد ${data.processedGroups} مجموعة وتحديث ${data.updatedRows} صف`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/unification-stats'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ فشل التوحيد",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsUnifying(false);
    }
  });

  // فحص تكرار بند جديد
  const checkDuplicateMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest('/api/check-duplicate', 'POST', { itemData }),
    onSuccess: (data: DuplicateCheckResult) => {
      setCheckResult(data);
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ في الفحص",
        description: error.message || "فشل فحص التكرار",
        variant: "destructive"
      });
    }
  });

  const handleUnify = () => {
    setIsUnifying(true);
    unifyMutation.mutate();
  };

  const handleCheckDuplicate = () => {
    if (!testItem.partNumber && !testItem.description) {
      toast({
        title: "⚠️ بيانات ناقصة",
        description: "يجب إدخال رقم القطعة أو الوصف على الأقل",
        variant: "destructive"
      });
      return;
    }

    checkDuplicateMutation.mutate(testItem);
  };

  const duplicateRisk = stats?.stats ? 
    (stats.stats.estimatedDuplicates / stats.stats.totalItems * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة التكرارات والتوحيد</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            نظام متقدم لمنع التكرارات وتوحيد المعرفات للمنتجات المتشابهة
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/unification-stats'] })}
            variant="outline"
            size="sm"
            data-testid="button-refresh-stats"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي البنود</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-items">
              {statsLoading ? '...' : stats?.stats.totalItems.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">منتجات فريدة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-unique-products">
              {statsLoading ? '...' : stats?.stats.uniqueProducts.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تكرارات محتملة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-estimated-duplicates">
              {statsLoading ? '...' : stats?.stats.estimatedDuplicates.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {duplicateRisk.toFixed(1)}% من إجمالي البنود
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">توفير محتمل</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-potential-savings">
              {statsLoading ? '...' : stats?.stats.potentialSavings.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-600 mt-1">مجموعات للدمج</p>
          </CardContent>
        </Card>
      </div>

      {/* مؤشر المخاطر */}
      {stats?.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              مؤشر مخاطر التكرار
            </CardTitle>
            <CardDescription>
              تقييم مستوى التكرارات في النظام وتأثيرها على الكفاءة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>مستوى المخاطر</span>
                <span className="font-medium">{duplicateRisk.toFixed(1)}%</span>
              </div>
              <Progress 
                value={duplicateRisk} 
                className="h-2"
                data-testid="progress-duplicate-risk"
              />
            </div>
            
            <Alert className={`${duplicateRisk > 15 ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 
              duplicateRisk > 8 ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' : 
              'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {duplicateRisk > 15 ? '🚨 مستوى تكرار عالي - يحتاج تدخل فوري' :
                 duplicateRisk > 8 ? '⚠️ مستوى تكرار متوسط - ينصح بالتوحيد' :
                 '✅ مستوى تكرار منخفض - النظام في حالة جيدة'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="unify" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unify" data-testid="tab-unify">
            <GitMerge className="h-4 w-4 ml-2" />
            تطبيق التوحيد
          </TabsTrigger>
          <TabsTrigger value="test" data-testid="tab-test">
            <Eye className="h-4 w-4 ml-2" />
            فحص التكرار
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تطبيق التوحيد على البيانات الموجودة</CardTitle>
              <CardDescription>
                تطبيق خوارزمية التوحيد المتقدمة على جميع البيانات الموجودة في Google Sheets 
                لحل التكرارات وتوحيد المعرفات للمنتجات المتشابهة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.stats && stats.stats.estimatedDuplicates > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    تم العثور على {stats.stats.estimatedDuplicates.toLocaleString()} تكرار محتمل في {stats.stats.potentialSavings} مجموعة. 
                    التوحيد سيحدث البيانات في Google Sheets مباشرة.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-4">
                <Button
                  onClick={handleUnify}
                  disabled={isUnifying || unifyMutation.isPending || !stats?.stats.estimatedDuplicates}
                  size="lg"
                  className="w-full"
                  data-testid="button-apply-unification"
                >
                  {isUnifying || unifyMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                      جاري التوحيد...
                    </>
                  ) : (
                    <>
                      <GitMerge className="h-4 w-4 ml-2" />
                      تطبيق التوحيد الآن
                    </>
                  )}
                </Button>

                {!stats?.stats.estimatedDuplicates && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ لا توجد تكرارات محتملة في النظام حالياً. البيانات منظمة بشكل جيد!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>فحص بند جديد للتكرار</CardTitle>
              <CardDescription>
                اختبر ما إذا كان بند جديد مكرر لمنتج موجود في النظام قبل إضافته
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partNumber">رقم القطعة</Label>
                  <Input
                    id="partNumber"
                    value={testItem.partNumber}
                    onChange={(e) => setTestItem({ ...testItem, partNumber: e.target.value })}
                    placeholder="مثال: LC1D 32M7"
                    data-testid="input-part-number"
                  />
                </div>
                <div>
                  <Label htmlFor="lineItem">LINE ITEM</Label>
                  <Input
                    id="lineItem"
                    value={testItem.lineItem}
                    onChange={(e) => setTestItem({ ...testItem, lineItem: e.target.value })}
                    placeholder="مثال: 1531.032.GENRAL.7513"
                    data-testid="input-line-item"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف المنتج</Label>
                <Textarea
                  id="description"
                  value={testItem.description}
                  onChange={(e) => setTestItem({ ...testItem, description: e.target.value })}
                  placeholder="مثال: SCHNEIDER CONTACTOR FRANCE TELEMECANIQUE 220V 50/60HZ ITH 50A - 15 KW - 400V"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <Button
                onClick={handleCheckDuplicate}
                disabled={checkDuplicateMutation.isPending}
                className="w-full"
                data-testid="button-check-duplicate"
              >
                {checkDuplicateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                    جاري الفحص...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 ml-2" />
                    فحص التكرار
                  </>
                )}
              </Button>

              {checkResult && (
                <Card className={`${checkResult.shouldBlock ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 
                  'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {checkResult.shouldBlock ? (
                        <>
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          تكرار محتمل
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          منتج فريد
                        </>
                      )}
                      <Badge variant={checkResult.shouldBlock ? "destructive" : "secondary"}>
                        {(checkResult.confidence * 100).toFixed(1)}% ثقة
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3" data-testid="card-check-result">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>السبب:</strong> {checkResult.reason}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>الإجراء المقترح:</strong> {checkResult.suggestedAction}
                    </p>
                    
                    {checkResult.existingItem && (
                      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">البند الموجود المطابق:</h4>
                        <div className="space-y-1 text-xs">
                          <p><strong>معرف البند:</strong> {checkResult.existingItem.itemNumber}</p>
                          <p><strong>رقم القطعة:</strong> {checkResult.existingItem.partNumber}</p>
                          <p><strong>الوصف:</strong> {checkResult.existingItem.description.substring(0, 100)}...</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}