import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Database, CheckCircle, XCircle } from "lucide-react";

export default function ImportDataSimple() {
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    try {
      setImportStatus('importing');
      setMessage('جاري استيراد البيانات...');

      const response = await fetch('/api/import-data', {
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
        setMessage(`تم استيراد ${result.importedItems || 0} بند بنجاح من أصل ${result.totalItems || 0} بند في الملف`);
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
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                جاهز لاستيراد البيانات من ملف Excel. اضغط على الزر أدناه للبدء.
              </AlertDescription>
            </Alert>
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
          >
            <Upload className="h-4 w-4" />
            {importStatus === 'importing' ? 'جاري الاستيراد...' : 'بدء الاستيراد'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}