// حل بديل: مُستورد سريع بدون تعقيد
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Upload, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import * as XLSX from 'xlsx';

interface QuickImporterProps {
  onImportComplete?: () => void;
}

export function QuickImporter({ onImportComplete }: QuickImporterProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [mappingInfo, setMappingInfo] = useState<any>(null);

  // المعاينة التلقائية
  const previewMutation = useMutation({
    mutationFn: async (excelData: any[]) => {
      const response = await apiRequest("POST", "/api/import/quotations/auto", { excelData });
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data.previewData || []);
      setMappingInfo(data);
      setShowPreview(true);
      toast({
        title: "تم تحليل الملف",
        description: `تم العثور على ${data.totalRows} سجل صالح للاستيراد`,
        variant: data.confidence > 70 ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحليل",
        description: error.message || "حدث خطأ أثناء تحليل الملف",
        variant: "destructive",
      });
    },
  });

  // الاستيراد النهائي
  const finalImportMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await apiRequest("POST", "/api/import/quotations/confirm", { quotationData: data });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الاستيراد بنجاح!",
        description: `تم حفظ ${data.imported} سجل في قاعدة البيانات`,
      });
      setShowPreview(false);
      setPreviewData([]);
      setSelectedFile(null);
      if (onImportComplete) {
        onImportComplete();
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowPreview(false);
      setPreviewData([]);
      setMappingInfo(null);
    }
  };

  const handlePreview = async () => {
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

      previewMutation.mutate(jsonData);
      
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
              onClick={handlePreview}
              disabled={!selectedFile || previewMutation.isPending}
              className="flex items-center space-x-2 space-x-reverse bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="h-4 w-4" />
              <span>
                {previewMutation.isPending ? "جاري التحليل..." : "معاينة البيانات"}
              </span>
            </Button>
          </div>

          {previewMutation.isPending && (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                جاري تحليل الملف وإجراء المطابقة التلقائية للأعمدة...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* معاينة البيانات */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>معاينة البيانات قبل الاستيراد</span>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => finalImportMutation.mutate(previewData)}
                  disabled={finalImportMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 ml-1" />
                  {finalImportMutation.isPending ? "جاري الحفظ..." : "تأكيد الاستيراد"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{previewData.length}</div>
                  <div className="text-sm text-gray-600">سجل جاهز للاستيراد</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{mappingInfo?.confidence || 0}%</div>
                  <div className="text-sm text-gray-600">دقة المطابقة</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(mappingInfo?.mapping || {}).length}
                  </div>
                  <div className="text-sm text-gray-600">عمود تم مطابقته</div>
                </div>
              </div>

              {/* تفاصيل المطابقة */}
              {mappingInfo?.mapping && (
                <div>
                  <h4 className="font-semibold mb-2">مطابقة الأعمدة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(mappingInfo.mapping).map(([field, column]: [string, any]) => (
                      <div key={field} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium">{getFieldLabel(field)}</span>
                        <span className="text-blue-600">"{column}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* جدول المعاينة */}
              <div>
                <h4 className="font-semibold mb-2">معاينة جميع البيانات ({previewData.length} سجل):</h4>
                <div 
                  className="overflow-x-auto overflow-y-auto max-h-[600px] border rounded-lg shadow-lg bg-white"
                  style={{
                    scrollbarWidth: 'auto',
                    scrollbarColor: '#3b82f6 #e5e7eb'
                  }}
                >
                  <table className="w-full text-sm border-collapse border border-gray-300 min-w-[1400px]">

                    <thead>
                      <tr className="bg-gray-100 sticky top-0">
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[60px]">الصف</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[120px]">رقم الطلب</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[100px]">العميل</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[180px]">رقم البند</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[120px]">رقم القطعة</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[300px]">التوصيف</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[80px]">الكمية</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[80px]">السعر</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[100px]">تاريخ الطلب</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold min-w-[110px]">انتهاء العرض</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors duration-150`}>
                          <td className="border border-gray-300 p-3 text-center font-medium">{row.rowIndex}</td>
                          <td className="border border-gray-300 p-3 font-mono text-indigo-600 text-sm">
                            {row.requestNumber || row.customRequestNumber || 'غير محدد'}
                          </td>
                          <td className="border border-gray-300 p-3 font-medium text-purple-700">{row.clientName}</td>
                          <td className="border border-gray-300 p-3 font-mono text-blue-600 text-xs">{row.lineItem}</td>
                          <td className="border border-gray-300 p-3 font-mono text-gray-700">{row.partNumber}</td>
                          <td className="border border-gray-300 p-3 min-w-[300px]">
                            <div className="whitespace-normal break-words text-sm leading-relaxed">
                              <strong className="text-gray-800">{row.description}</strong>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-center font-semibold text-green-600">{row.quantity}</td>
                          <td className="border border-gray-300 p-3 text-center font-semibold text-orange-600">{row.unitPrice}</td>
                          <td className="border border-gray-300 p-3 text-sm text-gray-600">{row.requestDate}</td>
                          <td className="border border-gray-300 p-3 text-sm text-red-600 font-medium">{row.expiryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* شريط معلومات التمرير */}
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded flex justify-between items-center">
                  <span>📊 عدد السجلات المعروضة: {previewData.length}</span>
                  <span>↔️ استخدم المسطرة الأفقية لعرض جميع الأعمدة | ↕️ المسطرة الرأسية لعرض جميع السجلات</span>
                </div>
              </div>

              {mappingInfo?.confidence >= 80 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ جودة عالية!</strong> تم تحليل الملف ومطابقة الأعمدة بدقة عالية.
                    راجع البيانات أعلاه واضغط "تأكيد الاستيراد" للحفظ في قاعدة البيانات.
                  </AlertDescription>
                </Alert>
              )}

              {mappingInfo?.confidence < 80 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>تحذير:</strong> دقة المطابقة أقل من المتوقع ({mappingInfo?.confidence}%).
                    راجع البيانات بعناية قبل التأكيد.
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