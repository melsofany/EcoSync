import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Search, 
  Merge, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Settings,
  FileText,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UnificationGroup {
  masterItemId: string;
  duplicateItemIds: string[];
  confidence: number;
  reason: string;
  unifiedPartNumber?: string;
  unifiedDescription: string;
}

interface UnificationResult {
  totalItemsAnalyzed: number;
  unificationGroups: UnificationGroup[];
  itemsUnified: number;
  confidence: number;
}

interface DuplicateAnalysis {
  totalDuplicatesFound: number;
  duplicateGroups: any[];
  recommendations: string[];
}

export default function ItemUnification() {
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [unificationInProgress, setUnificationInProgress] = useState(false);
  const { toast } = useToast();

  // تحليل التكرارات
  const analyzeDuplicatesMutation = useMutation({
    mutationFn: async (criteria: any): Promise<DuplicateAnalysis> => {
      const response = await fetch('/api/analyze-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria)
      });
      if (!response.ok) throw new Error('Failed to analyze duplicates');
      return response.json();
    },
    onSuccess: (data: DuplicateAnalysis) => {
      setAnalysisComplete(true);
      toast({
        title: "تم تحليل البنود",
        description: `تم العثور على ${data.totalDuplicatesFound} بند مكرر`
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحليل",
        description: error.message || "حدث خطأ أثناء تحليل البنود",
        variant: "destructive"
      });
    }
  });

  // توحيد البنود بالذكاء الاصطناعي
  const unifyItemsMutation = useMutation({
    mutationFn: async (options: { limit?: number } = {}): Promise<UnificationResult> => {
      const response = await fetch('/api/unify-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (!response.ok) throw new Error('Failed to unify items');
      return response.json();
    },
    onMutate: () => {
      setUnificationInProgress(true);
    },
    onSuccess: (data: UnificationResult) => {
      setUnificationInProgress(false);
      toast({
        title: "تم توحيد البنود بنجاح",
        description: `تم توحيد ${data.itemsUnified} بند من أصل ${data.totalItemsAnalyzed} بند تم تحليله`
      });
    },
    onError: (error: any) => {
      setUnificationInProgress(false);
      toast({
        title: "خطأ في التوحيد",
        description: error.message || "حدث خطأ أثناء توحيد البنود",
        variant: "destructive"
      });
    }
  });

  const handleAnalyzeDuplicates = () => {
    analyzeDuplicatesMutation.mutate({
      partNumberSimilarity: true,
      descriptionSimilarity: true,
      brandMatching: true
    });
  };

  const handleUnifyItems = (limit = 50) => {
    unifyItemsMutation.mutate({ limit });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">توحيد البنود بالذكاء الاصطناعي</h1>
          <p className="text-gray-600">استخدام DeepSeek AI لتحليل وتوحيد البنود المتشابهة</p>
        </div>
      </div>

      {/* معلومات النظام */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          يستخدم هذا النظام الذكاء الاصطناعي لتحليل البنود ومطابقة التوصيف ورقم القطعة (Part Number) لتوحيد البنود المتكررة وتحسين جودة البيانات.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تحليل التكرارات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              تحليل البنود المكررة
            </CardTitle>
            <CardDescription>
              تحليل سريع للعثور على البنود المتكررة في النظام
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleAnalyzeDuplicates}
              disabled={analyzeDuplicatesMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {analyzeDuplicatesMutation.isPending ? (
                <>جاري التحليل...</>
              ) : (
                <>
                  <Search className="h-4 w-4 ml-2" />
                  تحليل التكرارات
                </>
              )}
            </Button>

            {analyzeDuplicatesMutation.data && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>البنود المكررة:</span>
                  <Badge variant="secondary">
                    {analyzeDuplicatesMutation.data.totalDuplicatesFound}
                  </Badge>
                </div>
                
                {analyzeDuplicatesMutation.data.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* توحيد تلقائي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5" />
              توحيد تلقائي بالذكاء الاصطناعي
            </CardTitle>
            <CardDescription>
              توحيد البنود المتشابهة باستخدام DeepSeek AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleUnifyItems(25)}
                disabled={unificationInProgress}
                variant="outline"
                size="sm"
              >
                توحيد 25 بند
              </Button>
              <Button 
                onClick={() => handleUnifyItems(50)}
                disabled={unificationInProgress}
                variant="outline"
                size="sm"
              >
                توحيد 50 بند
              </Button>
            </div>

            <Button 
              onClick={() => handleUnifyItems(100)}
              disabled={unificationInProgress}
              className="w-full"
            >
              {unificationInProgress ? (
                <>جاري التوحيد...</>
              ) : (
                <>
                  <Bot className="h-4 w-4 ml-2" />
                  توحيد شامل (100 بند)
                </>
              )}
            </Button>

            {unificationInProgress && (
              <div className="space-y-2">
                <Progress value={60} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  جاري تحليل البنود بالذكاء الاصطناعي...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نتائج التوحيد */}
      {unifyItemsMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              نتائج التوحيد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">
                  {unifyItemsMutation.data.totalItemsAnalyzed}
                </div>
                <div className="text-sm text-blue-600">بند تم تحليله</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Merge className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">
                  {unifyItemsMutation.data.itemsUnified}
                </div>
                <div className="text-sm text-green-600">بند تم توحيده</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Bot className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">
                  {unifyItemsMutation.data.confidence}%
                </div>
                <div className="text-sm text-purple-600">دقة التحليل</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <FileText className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">
                  {unifyItemsMutation.data.unificationGroups.length}
                </div>
                <div className="text-sm text-orange-600">مجموعة توحيد</div>
              </div>
            </div>

            {unifyItemsMutation.data.unificationGroups.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h3 className="font-semibold">تفاصيل التوحيد:</h3>
                {unifyItemsMutation.data.unificationGroups.map((group, index) => (
                  <Alert key={index}>
                    <Merge className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">{group.reason}</div>
                        <div className="text-sm text-gray-600">
                          تم توحيد {group.duplicateItemIds.length} بند - دقة: {group.confidence}%
                        </div>
                        <div className="text-sm">
                          التوصيف الموحد: {group.unifiedDescription}
                        </div>
                        {group.unifiedPartNumber && (
                          <div className="text-sm">
                            رقم القطعة الموحد: <code className="bg-gray-100 px-1 rounded">{group.unifiedPartNumber}</code>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* تحذيرات هامة */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>تحذير:</strong> عملية التوحيد لا يمكن التراجع عنها. تأكد من نسخ احتياطية قبل التوحيد الشامل.
          البنود التي يتم دمجها ستفقد معرفاتها الأصلية وستتم إعادة توجيه جميع المراجع للبند الرئيسي.
        </AlertDescription>
      </Alert>
    </div>
  );
}