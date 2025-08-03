// حل بديل: مُستورد سريع بدون تعقيد
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Upload, CheckCircle } from "lucide-react";
import * as XLSX from 'xlsx';

interface QuickImporterProps {
  onImportComplete?: () => void;
}

export function QuickImporter({ onImportComplete }: QuickImporterProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);

  // الاستيراد التلقائي السريع
  const quickImportMutation = useMutation({
    mutationFn: async (excelData: any[]) => {
      const response = await apiRequest("POST", "/api/import/quotations/auto", { excelData });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "🚀 تم الاستيراد التلقائي!",
        description: `تم معالجة ${data.totalRows} سجل بثقة ${data.confidence}%`,
        variant: data.confidence > 70 ? "default" : "destructive"
      });
      
      if (onImportComplete && data.totalRows > 0) {
        onImportComplete();
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
    }
  };

  const handleQuickImport = async () => {
    if (!selectedFile) return;

    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        toast({
          title: "ملف فارغ",
          description: "الملف لا يحتوي على بيانات صالحة",
          variant: "destructive",
        });
        return;
      }

      quickImportMutation.mutate(jsonData);
      
    } catch (error) {
      toast({
        title: "خطأ في قراءة الملف",
        description: "تأكد من أن الملف بتنسيق Excel صحيح",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Zap className="h-5 w-5 text-green-600" />
            <span>الاستيراد التلقائي السريع</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>🚀 الحل الجديد:</strong> استيراد تلقائي ذكي يتعرف على أعمدة Excel تلقائياً
              <br />✅ <strong>لا يحتاج إعداد:</strong> يحلل الملف ويستورد البيانات مباشرة
              <br />🤖 <strong>ذكي:</strong> يطابق الأعمدة تلقائياً (LINE ITEM، PART NO، العميل، إلخ)
              <br />⚡ <strong>سريع:</strong> خطوة واحدة فقط - اختر الملف واضغط استيراد
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-4 space-x-reverse">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <Button
              onClick={handleQuickImport}
              disabled={!selectedFile || quickImportMutation.isPending}
              className="flex items-center space-x-2 space-x-reverse bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4" />
              <span>
                {quickImportMutation.isPending ? "جاري الاستيراد..." : "🚀 استيراد تلقائي"}
              </span>
            </Button>
          </div>

          {quickImportMutation.isPending && (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                جاري تحليل الملف وإجراء المطابقة التلقائية للأعمدة...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* عرض النتائج */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج الاستيراد التلقائي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.totalRows}</div>
                  <div className="text-sm text-gray-600">سجل تم استيراده</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.confidence}%</div>
                  <div className="text-sm text-gray-600">دقة المطابقة</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.mappingResult?.suggestions?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">عمود تم مطابقته</div>
                </div>
              </div>

              {/* تفاصيل المطابقة */}
              {results.mappingResult?.suggestions && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">تفاصيل المطابقة التلقائية:</h4>
                  <div className="space-y-2">
                    {results.mappingResult.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{getFieldLabel(suggestion.field)}</span>
                        <span className="text-blue-600">"{suggestion.column}"</span>
                        <span className="text-green-600">{suggestion.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.confidence >= 80 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ نجح الاستيراد التلقائي!</strong> تم تحليل الملف ومطابقة الأعمدة بدقة عالية.
                    البيانات جاهزة للاستخدام في النظام.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// دالة مساعدة لترجمة أسماء الحقول
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    lineItem: 'رقم البند',
    partNumber: 'رقم القطعة',
    description: 'التوصيف',
    quantity: 'الكمية',
    unit: 'وحدة القياس',
    requestDate: 'تاريخ الطلب',
    expiryDate: 'تاريخ انتهاء العرض',
    clientName: 'اسم العميل',
    rfqNumber: 'رقم الطلب',
    unitPrice: 'سعر الوحدة'
  };
  return labels[field] || field;
}