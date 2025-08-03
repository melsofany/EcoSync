import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Database, CheckCircle, XCircle, Brain, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ImportDataSimple() {
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [importType, setImportType] = useState<'simple' | 'comprehensive'>('comprehensive');

  const handleImport = async () => {
    try {
      setImportStatus('importing');
      if (importType === 'comprehensive') {
        setMessage('جاري الاستيراد الشامل مع تحليل الذكاء الاصطناعي...');
      } else {
        setMessage('جاري استيراد البيانات...');
      }

      const endpoint = importType === 'comprehensive' ? '/api/import-comprehensive' : '/api/import-data';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('فشل في استيراد البيانات');
      }

      const result = await response.json();
      
      if (result.success) {
        setImportStatus('success');
        if (importType === 'comprehensive') {
          setMessage(`تم الاستيراد الشامل بنجاح!\n- الأصناف الفريدة: ${result.uniqueItemsImported || 0}\n- التكرارات المكتشفة: ${result.duplicatesDetected || 0}\n- الموردين: ${result.suppliersCreated || 0}`);
        } else {
          setMessage(`تم استيراد ${result.importedItems || 0} بند بنجاح من أصل ${result.totalItems || 0} بند في الملف`);
        }
      } else {
        setImportStatus('error');
        setMessage('حدث خطأ أثناء الاستيراد: ' + (result.error || 'خطأ غير معروف'));
      }
    } catch (error: any) {
      setImportStatus('error');
      setMessage('خطأ في الاتصال: ' + error.message);
    }
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            استيراد البيانات
          </CardTitle>
          <CardDescription>
            استيراد البيانات من ملف DP DEV_1754181634716.xlsx
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importStatus === 'idle' && (
            <div className="space-y-4">
              <Alert>
                <Upload className="h-4 w-4" />
                <AlertDescription>
                  جاهز لاستيراد البيانات من ملف Excel. اختر نوع الاستيراد أدناه.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع الاستيراد:</label>
                <Select value={importType} onValueChange={(value: 'simple' | 'comprehensive') => setImportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        استيراد شامل مع الذكاء الاصطناعي
                      </div>
                    </SelectItem>
                    <SelectItem value="simple">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        استيراد سريع (عينة)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {importType === 'comprehensive' && (
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                    <strong>الاستيراد الشامل مع الذكاء الاصطناعي:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• استيراد جميع الأصناف (~4,900 صنف)</li>
                      <li>• تحليل وإزالة التكرارات بالذكاء الاصطناعي</li>
                      <li>• إنشاء الموردين وطلبات الأسعار</li>
                      <li>• قد يستغرق 10-15 دقيقة</li>
                    </ul>
                  </div>
                )}
                
                {importType === 'simple' && (
                  <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-lg">
                    <strong>الاستيراد السريع:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• استيراد عينة من البيانات للاختبار</li>
                      <li>• سريع ومباشر</li>
                      <li>• مناسب للتجربة</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {importStatus === 'importing' && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                جاري استيراد البيانات... يرجى الانتظار
              </AlertDescription>
            </Alert>
          )}

          {importStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {importStatus === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleImport} 
            disabled={importStatus === 'importing'}
            className="flex items-center gap-2"
            size="lg"
          >
            {importType === 'comprehensive' ? <Brain className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {importStatus === 'importing' 
              ? (importType === 'comprehensive' ? 'جاري التحليل والاستيراد...' : 'جاري الاستيراد...') 
              : (importType === 'comprehensive' ? 'بدء الاستيراد الشامل' : 'بدء الاستيراد السريع')
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}