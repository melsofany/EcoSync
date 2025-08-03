import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Database, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ImportData() {
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: () => apiRequest('/api/import-data', {
      method: 'POST',
      body: JSON.stringify({})
    }),
    onMutate: () => {
      setImportStatus('importing');
      setImportResult(null);
      toast({
        title: "بدء الاستيراد",
        description: "جاري استيراد البيانات من ملف Excel...",
      });
    },
    onSuccess: (data) => {
      setImportStatus('success');
      setImportResult(data);
      toast({
        title: "تم الاستيراد بنجاح",
        description: `تم استيراد ${data.importedItems || 0} بند بنجاح`,
      });
    },
    onError: (error: any) => {
      setImportStatus('error');
      setImportResult(error);
      toast({
        title: "خطأ في الاستيراد",
        description: "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    }
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">استيراد البيانات</h1>
          <p className="text-muted-foreground mt-2">
            استيراد البيانات من ملف Excel إلى النظام
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Import Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              حالة الاستيراد
            </CardTitle>
            <CardDescription>
              استيراد البيانات من ملف DP DEV_1754181634716.xlsx
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importStatus === 'idle' && (
              <Alert>
                <Upload className="h-4 w-4" />
                <AlertDescription>
                  جاهز لاستيراد البيانات من ملف Excel. سيتم استيراد أول 50 بند كعينة تجريبية.
                </AlertDescription>
              </Alert>
            )}

            {importStatus === 'importing' && (
              <div className="space-y-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    جاري استيراد البيانات... يرجى الانتظار
                  </AlertDescription>
                </Alert>
                <Progress className="w-full" />
              </div>
            )}

            {importStatus === 'success' && importResult && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  تم الاستيراد بنجاح! تم استيراد {importResult.importedItems} بند من أصل {importResult.totalItems} بند في الملف.
                  تم إنشاء {importResult.suppliersCreated} مورد جديد.
                </AlertDescription>
              </Alert>
            )}

            {importStatus === 'error' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  حدث خطأ أثناء الاستيراد. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={handleImport} 
                disabled={importStatus === 'importing'}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {importStatus === 'importing' ? 'جاري الاستيراد...' : 'بدء الاستيراد'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الملف</CardTitle>
            <CardDescription>
              تفاصيل الملف المراد استيراده
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">اسم الملف</h4>
                <p className="text-sm text-muted-foreground">DP DEV_1754181634716.xlsx</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">نوع البيانات</h4>
                <p className="text-sm text-muted-foreground">بيانات البنود والموردين وطلبات الأسعار</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">عدد البنود المتوقع</h4>
                <Badge variant="outline">11,000+ بند</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">الحالة</h4>
                <Badge variant={importStatus === 'success' ? 'default' : 'secondary'}>
                  {importStatus === 'idle' && 'جاهز للاستيراد'}
                  {importStatus === 'importing' && 'جاري الاستيراد'}
                  {importStatus === 'success' && 'تم الاستيراد'}
                  {importStatus === 'error' && 'خطأ في الاستيراد'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>معاينة البيانات</CardTitle>
            <CardDescription>
              الحقول التي سيتم استيرادها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                'رقم تسلسلي',
                'وصف البند',
                'رقم القطعة',
                'رقم الخط',
                'وحدة القياس',
                'الفئة',
                'رقم RFQ',
                'الكمية',
                'سعر RFQ',
                'رقم PO',
                'تاريخ RFQ',
                'حالة الطلب',
                'المشتري',
                'ملاحظات'
              ].map((field) => (
                <Badge key={field} variant="outline" className="justify-center">
                  {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Results */}
        {importResult && importStatus === 'success' && (
          <Card>
            <CardHeader>
              <CardTitle>نتائج الاستيراد</CardTitle>
              <CardDescription>
                إحصائيات عملية الاستيراد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.importedItems}
                  </div>
                  <div className="text-sm text-green-700">بند مستورد</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.suppliersCreated}
                  </div>
                  <div className="text-sm text-blue-700">مورد جديد</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {importResult.totalItems}
                  </div>
                  <div className="text-sm text-orange-700">إجمالي البنود في الملف</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}