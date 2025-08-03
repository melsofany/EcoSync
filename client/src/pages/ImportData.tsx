import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ImportResult {
  success: boolean;
  stats: {
    items: number;
    quotations: number;
    quotation_items: number;
    purchase_orders: number;
    purchase_order_items: number;
  };
}

export default function ImportData() {
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: async (): Promise<ImportResult> => {
      const response = await fetch('/api/import-data', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setResult(data);
    },
    onError: (error) => {
      console.error('Import failed:', error);
    }
  });

  const handleImport = () => {
    setResult(null);
    importMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">استيراد البيانات من Excel</h1>
        <p className="text-muted-foreground">
          استيراد البيانات المحضرة من ملف Excel إلى قاعدة البيانات
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            استيراد البيانات
          </CardTitle>
          <CardDescription>
            سيتم استيراد البيانات التالية:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>البنود والأجزاء</li>
              <li>طلبات التسعير</li>
              <li>بنود طلبات التسعير</li>
              <li>أوامر الشراء</li>
              <li>بنود أوامر الشراء</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleImport} 
            disabled={importMutation.isPending}
            className="w-full"
            size="lg"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الاستيراد...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                بدء الاستيراد
              </>
            )}
          </Button>

          {importMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                خطأ في الاستيراد: {importMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className={result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                {result.success ? (
                  <div className="space-y-2">
                    <p className="font-semibold">تم الاستيراد بنجاح! 🎉</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>البنود: {result.stats.items}</div>
                      <div>طلبات التسعير: {result.stats.quotations}</div>
                      <div>بنود طلبات التسعير: {result.stats.quotation_items}</div>
                      <div>أوامر الشراء: {result.stats.purchase_orders}</div>
                      <div>بنود أوامر الشراء: {result.stats.purchase_order_items}</div>
                    </div>
                  </div>
                ) : (
                  "فشل في الاستيراد. يرجى المحاولة مرة أخرى."
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-semibold">البيانات المستوردة:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>تم استخراج 2767 سجل صالح من ملف Excel</li>
              <li>البيانات مقروءة من الصف 13 كما هو محدد</li>
              <li>يتم ربط البنود بطلبات التسعير وأوامر الشراء</li>
              <li>أسعار العملاء محسوبة من متوسط أسعار طلبات التسعير</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">تنبيهات:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>العملية تستغرق عدة دقائق حسب حجم البيانات</li>
              <li>لا تغلق الصفحة أثناء عملية الاستيراد</li>
              <li>يُنصح بعمل نسخة احتياطية قبل الاستيراد</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}