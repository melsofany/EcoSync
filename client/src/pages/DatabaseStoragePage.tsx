import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Save, CheckCircle, AlertCircle, BarChart3, FileText, Link2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DatabaseStats {
  totalRecords: number;
  linkedRecords: number;
  completeFlowRecords: number;
  linkingRate: string;
}

interface RecoveredDataRecord {
  id: string;
  rowNumber: number;
  uom?: string;
  lineItem?: string;
  partNo?: string;
  description?: string;
  rfqNumber?: string;
  rfqDate?: string;
  rfqQuantity?: string;
  rfqPrice?: string;
  rfqResponseDate?: string;
  poNumber?: string;
  poDate?: string;
  poQuantity?: string;
  poPrice?: string;
  isLinked: boolean;
  hasCompleteFlow: boolean;
  sourceFile: string;
  importedAt: string;
  importedBy?: string;
}

export default function DatabaseStoragePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [saveResult, setSaveResult] = useState<any>(null);
  const queryClient = useQueryClient();

  // جلب إحصائيات قاعدة البيانات
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/database/stats'],
    queryFn: async (): Promise<DatabaseStats> => {
      return apiRequest('/api/database/stats');
    }
  });

  // جلب البيانات المحفوظة
  const { data: savedDataResponse, isLoading: dataLoading } = useQuery({
    queryKey: ['/api/database/saved-data'],
    queryFn: async () => {
      return apiRequest('/api/database/saved-data?page=1&limit=20');
    }
  });

  // حفظ البيانات في قاعدة البيانات
  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/database/save', 'POST');
    },
    onSuccess: (data) => {
      setSaveResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/database/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/database/saved-data'] });
    },
    onError: (error) => {
      console.error('خطأ في حفظ البيانات:', error);
    }
  });

  const handleSaveToDatabase = async () => {
    setIsLoading(true);
    try {
      await saveMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">حفظ البيانات في قاعدة البيانات</h1>
          <p className="text-gray-600">استرداد وحفظ البيانات المعالجة من Excel في قاعدة البيانات</p>
        </div>
      </div>

      {/* زر الحفظ الرئيسي */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Save className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">حفظ البيانات المستردة</h3>
              <p className="text-gray-600">
                حفظ جميع البيانات المعالجة من ملف Excel الأخير في قاعدة البيانات
              </p>
            </div>
            <Button 
              onClick={handleSaveToDatabase}
              disabled={isLoading || saveMutation.isPending}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading || saveMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  حفظ في قاعدة البيانات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نتيجة الحفظ */}
      {saveResult && (
        <Alert className={saveResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-center gap-2">
            {saveResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={saveResult.success ? "text-green-800" : "text-red-800"}>
              {saveResult.message}
              {saveResult.stats && (
                <div className="mt-2 text-sm">
                  تم حفظ {saveResult.stats.totalRecords} سجل | 
                  مربوطة: {saveResult.stats.linkedRecords} | 
                  دورة كاملة: {saveResult.stats.completeFlowRecords}
                </div>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* الإحصائيات والبيانات */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            البيانات المحفوظة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {statsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-gray-600 mt-2">جاري تحميل الإحصائيات...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي السجلات</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalRecords?.toLocaleString() || '0'}</p>
                    </div>
                    <Database className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">السجلات المربوطة</p>
                      <p className="text-2xl font-bold text-green-600">{stats?.linkedRecords?.toLocaleString() || '0'}</p>
                    </div>
                    <Link2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">دورة كاملة</p>
                      <p className="text-2xl font-bold text-purple-600">{stats?.completeFlowRecords?.toLocaleString() || '0'}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">معدل الربط</p>
                      <p className="text-2xl font-bold text-orange-600">{stats?.linkingRate || '0%'}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Database className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات محفوظة</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    لم يتم حفظ أي بيانات في قاعدة البيانات بعد
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {dataLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-gray-600 mt-2">جاري تحميل البيانات...</p>
            </div>
          ) : savedDataResponse && savedDataResponse.data && savedDataResponse.data.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>البيانات المحفوظة</CardTitle>
                <CardDescription>
                  عرض أول 20 سجل من البيانات المحفوظة في قاعدة البيانات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الصف</TableHead>
                        <TableHead className="text-right">رقم البند</TableHead>
                        <TableHead className="text-right">رقم القطعة</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">RFQ</TableHead>
                        <TableHead className="text-right">PO</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedDataResponse.data.map((record: RecoveredDataRecord) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.rowNumber}</TableCell>
                          <TableCell>
                            <span className="font-mono text-blue-600">{record.lineItem || 'فارغ'}</span>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">{record.partNo || 'فارغ'}</TableCell>
                          <TableCell className="max-w-48 truncate">{record.description || 'فارغ'}</TableCell>
                          <TableCell>
                            <span className="font-mono text-green-600">{record.rfqNumber || 'فارغ'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-purple-600">{record.poNumber || 'فارغ'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {record.isLinked && (
                                <Badge variant="secondary" className="text-xs">مربوط</Badge>
                              )}
                              {record.hasCompleteFlow && (
                                <Badge variant="default" className="text-xs">دورة كاملة</Badge>
                              )}
                              {!record.isLinked && !record.hasCompleteFlow && (
                                <Badge variant="outline" className="text-xs">منفصل</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {savedDataResponse && savedDataResponse.pagination && (
                  <div className="mt-4 text-sm text-gray-600 text-center">
                    عرض {savedDataResponse.data?.length || 0} من أصل {savedDataResponse.pagination.total?.toLocaleString() || 0} سجل
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات محفوظة</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    لم يتم حفظ أي بيانات في قاعدة البيانات بعد
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}