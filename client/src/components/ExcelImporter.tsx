import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileSpreadsheet, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  X,
  Database,
  Download
} from "lucide-react";

interface PreviewData {
  rowIndex: number;
  clientName: string;
  requestNumber: string;
  customRequestNumber: string;
  requestDate: string;
  expiryDate: string;
  quantity: number;
  priceToClient: number;
  description: string;
  partNumber: string;
  lineItem: string;
  unit: string;
  lineNumber: number;
  status: string;
  excelData: any;
}

interface ExcelImporterProps {
  onImportComplete?: () => void;
}

export function ExcelImporter({ onImportComplete }: ExcelImporterProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const previewMutation = useMutation({
    mutationFn: async (excelData: any[]) => {
      const response = await apiRequest("POST", "/api/import/quotations/preview", {
        excelData
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data.previewData);
      setMapping(data.mapping);
      setShowPreview(true);
      toast({
        title: "تم تحليل الملف بنجاح",
        description: `تم العثور على ${data.totalRows} سجل للمعاينة`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحليل الملف",
        description: error.message || "تأكد من أن الملف بالصيغة الصحيحة",
        variant: "destructive",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (previewData: PreviewData[]) => {
      const response = await apiRequest("POST", "/api/import/quotations/confirm", {
        previewData
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم استيراد البيانات بنجاح",
        description: `تم استيراد ${data.imported} سجل بنجاح${data.errors > 0 ? `, ${data.errors} أخطاء` : ''}`,
      });
      setShowPreview(false);
      setPreviewData([]);
      setSelectedFile(null);
      onImportComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في استيراد البيانات",
        description: error.message || "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          previewMutation.mutate(jsonData);
        } catch (error) {
          toast({
            title: "خطأ في قراءة الملف",
            description: "تأكد من أن الملف بصيغة Excel صحيحة",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      toast({
        title: "خطأ في معالجة الملف",
        description: "حدث خطأ أثناء معالجة ملف Excel",
        variant: "destructive",
      });
    }
  };

  const handleConfirmImport = () => {
    confirmMutation.mutate(previewData);
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPreviewData([]);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <FileSpreadsheet className="h-5 w-5" />
            <span>استيراد طلبات التسعير من Excel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Eye className="h-4 w-4" />
              <span>{previewMutation.isPending ? "جاري التحليل..." : "معاينة"}</span>
            </Button>
          </div>

          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              <strong>تنسيق ملف Excel المدعوم:</strong>
              <br />Line No | UOM | LINE ITEM | PART NO | Description | Source File | Request Date | Quantity | <strong>السعر (العمود I اختياري)</strong> | Response Date | العميل | Done
              <br /><strong>السعر:</strong> إذا كان متوفر في العمود I، يُقرأ تلقائياً. إذا لم يكن متوفر، يُحدد لاحقاً في نظام التسعير
              <br /><em>البيانات المُستوردة: رقم البند، رقم القطعة، التوصيف، الكمية، العميل، التواريخ</em>
              <br /><strong>ملاحظة:</strong> معرف P- يتم توليده تلقائياً بعد معالجة البيانات
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Database className="h-5 w-5" />
                <span>معاينة البيانات المستوردة</span>
              </div>
              <Badge variant="secondary">
                {previewData.length} سجل
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                تحقق من صحة البيانات أدناه قبل التأكيد. البيانات معروضة تحت أسماء أعمدة قاعدة البيانات الفعلية.
              </AlertDescription>
            </Alert>

            {/* Column Mapping Display */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">ربط أعمدة Excel بقاعدة البيانات:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(mapping).map(([excelCol, dbCol]) => (
                  <div key={excelCol} className="text-sm flex items-center bg-white p-2 rounded border">
                    <span className="font-bold text-white bg-blue-600 px-2 py-1 rounded text-xs min-w-[24px] text-center">{excelCol}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-gray-700 text-xs">{dbCol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right">الصف</th>
                    <th className="px-3 py-2 text-right">اسم العميل</th>
                    <th className="px-3 py-2 text-right">رقم الطلب</th>
                    <th className="px-3 py-2 text-right">تاريخ الطلب</th>
                    <th className="px-3 py-2 text-right">تاريخ انتهاء العرض</th>
                    <th className="px-3 py-2 text-right">التوصيف</th>
                    <th className="px-3 py-2 text-right">رقم القطعة</th>
                    <th className="px-3 py-2 text-right">رقم البند</th>
                    <th className="px-3 py-2 text-right">الكمية</th>
                    <th className="px-3 py-2 text-right">السعر</th>
                    <th className="px-3 py-2 text-right">وحدة القياس</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{row.rowIndex}</td>
                      <td className="px-3 py-2">{row.clientName}</td>
                      <td className="px-3 py-2 font-mono text-blue-600" dir="ltr">
                        {row.customRequestNumber}
                      </td>
                      <td className="px-3 py-2" dir="ltr">{row.requestDate}</td>
                      <td className="px-3 py-2" dir="ltr">{row.expiryDate}</td>
                      <td className="px-3 py-2 max-w-xs truncate" title={row.description}>
                        {row.description}
                      </td>
                      <td className="px-3 py-2 font-mono text-blue-600" dir="ltr">
                        {row.partNumber}
                      </td>
                      <td className="px-3 py-2 font-mono text-blue-600" dir="ltr">
                        {row.lineItem}
                      </td>
                      <td className="px-3 py-2">{row.quantity}</td>
                      <td className="px-3 py-2 font-semibold text-green-600">
                        {row.priceToClient > 0 ? `${row.priceToClient?.toLocaleString()} EGP` : 'غير محدد'}
                      </td>
                      <td className="px-3 py-2">{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <div className="p-3 text-center text-gray-500 text-sm border-t">
                  ... و {previewData.length - 10} سجل إضافي
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={confirmMutation.isPending}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={confirmMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 ml-2" />
                {confirmMutation.isPending ? "جاري الاستيراد..." : "تأكيد الاستيراد"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}