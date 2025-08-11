import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Eye, Download, AlertCircle } from 'lucide-react';

interface ColumnData {
  name: string;
  arabicName: string;
  processedRows: number;
  totalRows: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  sampleData: any[];
}

interface RecoveryProgress {
  currentColumn: string;
  totalColumns: number;
  completedColumns: number;
  totalRows: number;
  processedRows: number;
  estimatedTimeRemaining: string;
  status: 'initializing' | 'processing' | 'completed' | 'error';
}

export default function DataRecoveryPage() {
  const [progress, setProgress] = useState<RecoveryProgress>({
    currentColumn: 'A',
    totalColumns: 13,
    completedColumns: 0,
    totalRows: 5449,
    processedRows: 0,
    estimatedTimeRemaining: 'حساب الوقت...',
    status: 'initializing'
  });

  const [columns, setColumns] = useState<ColumnData[]>([
    { name: 'A', arabicName: 'وحدة القياس (UOM)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'B', arabicName: 'رقم البند (LINE_ITEM)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'C', arabicName: 'رقم القطعة (PART_NO)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'D', arabicName: 'الوصف (DESCRIPTION)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'E', arabicName: 'رقم طلب التسعير (RFQ_NUMBER)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'F', arabicName: 'تاريخ الطلب (REQUEST_DATE)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'G', arabicName: 'الكمية (QUANTITY)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'H', arabicName: 'السعر (PRICE)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'I', arabicName: 'تاريخ الاستجابة (RESPONSE_DATE)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'J', arabicName: 'رقم أمر الشراء (PO_NUMBER)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'K', arabicName: 'تاريخ أمر الشراء (PO_DATE)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'L', arabicName: 'كمية أمر الشراء (PO_QUANTITY)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] },
    { name: 'M', arabicName: 'سعر أمر الشراء (PO_PRICE)', processedRows: 0, totalRows: 5449, status: 'pending', sampleData: [] }
  ]);

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'processing': return 'جاري المعالجة';
      case 'error': return 'خطأ';
      default: return 'في الانتظار';
    }
  };

  const startRecovery = async () => {
    setIsProcessing(true);
    setProgress(prev => ({ ...prev, status: 'processing' }));

    try {
      const response = await fetch('/api/data-recovery/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalRows: 5449 })
      });

      if (!response.ok) {
        throw new Error('فشل في بدء عملية الاسترداد');
      }

      // Start monitoring progress
      monitorProgress();
    } catch (error) {
      console.error('Error starting recovery:', error);
      setProgress(prev => ({ ...prev, status: 'error' }));
      setIsProcessing(false);
    }
  };

  const monitorProgress = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/data-recovery/progress');
        const data = await response.json();

        setProgress(data.progress);
        setColumns(data.columns);
        setPreviewData(data.preview || []);

        if (data.progress.status === 'completed' || data.progress.status === 'error') {
          clearInterval(interval);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error monitoring progress:', error);
      }
    }, 2000);
  };

  const overallProgress = ((progress.completedColumns / progress.totalColumns) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6 rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">استرداد البيانات من الصور</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            disabled={previewData.length === 0}
          >
            <Eye className="w-4 h-4 ml-2" />
            {showPreview ? 'إخفاء المعاينة' : 'عرض المعاينة'}
          </Button>
          <Button
            onClick={startRecovery}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                جاري المعالجة
              </>
            ) : (
              'بدء الاسترداد'
            )}
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>التقدم العام</span>
            <Badge variant={progress.status === 'completed' ? 'default' : 'secondary'}>
              {progress.status === 'processing' ? 'جاري المعالجة' : 
               progress.status === 'completed' ? 'مكتمل' :
               progress.status === 'error' ? 'خطأ' : 'جاهز للبدء'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>الأعمدة المكتملة: {progress.completedColumns} من {progress.totalColumns}</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-800">العمود الحالي</div>
              <div className="text-lg font-bold text-blue-900">{progress.currentColumn}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-800">الصفوف المعالجة</div>
              <div className="text-lg font-bold text-green-900">
                {progress.processedRows.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="font-medium text-purple-800">إجمالي الصفوف</div>
              <div className="text-lg font-bold text-purple-900">
                {progress.totalRows.toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="font-medium text-orange-800">الوقت المتبقي</div>
              <div className="text-lg font-bold text-orange-900">
                {progress.estimatedTimeRemaining}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Columns Progress */}
      <Card>
        <CardHeader>
          <CardTitle>تقدم الأعمدة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns.map((column) => (
              <div key={column.name} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">عمود {column.name}</div>
                  <Badge className={getStatusColor(column.status)}>
                    {getStatusText(column.status)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">{column.arabicName}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{column.processedRows} من {column.totalRows}</span>
                    <span>{Math.round((column.processedRows / column.totalRows) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(column.processedRows / column.totalRows) * 100} 
                    className="h-1" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="w-5 h-5 ml-2" />
                معاينة البيانات المستردة - جدول شامل
              </div>
              <Badge variant="outline">
                {previewData.length.toLocaleString()} صف مُحمّل
              </Badge>
            </CardTitle>
            <CardDescription>
              عرض البيانات المستردة من جميع الأعمدة الـ 13 (A-M) في تخطيط جدول واضح
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <div className="min-w-[1400px]">
                <table className="w-full text-xs border-collapse border border-gray-300 bg-white">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-2 py-3 text-right font-bold text-gray-700 min-w-[50px] bg-gray-100">
                        الصف
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-blue-700 min-w-[80px]">
                        A<br/>
                        <span className="text-xs font-normal">وحدة القياس</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-blue-700 min-w-[80px]">
                        B<br/>
                        <span className="text-xs font-normal">رقم البند</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-blue-700 min-w-[120px]">
                        C<br/>
                        <span className="text-xs font-normal">رقم القطعة</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-blue-700 min-w-[150px]">
                        D<br/>
                        <span className="text-xs font-normal">الوصف</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-green-700 min-w-[100px]">
                        E<br/>
                        <span className="text-xs font-normal">رقم RFQ</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-green-700 min-w-[100px]">
                        F<br/>
                        <span className="text-xs font-normal">تاريخ الطلب</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-center font-semibold text-green-700 min-w-[80px]">
                        G<br/>
                        <span className="text-xs font-normal">الكمية</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-center font-semibold text-green-700 min-w-[80px]">
                        H<br/>
                        <span className="text-xs font-normal">السعر</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-orange-700 min-w-[100px]">
                        I<br/>
                        <span className="text-xs font-normal">تاريخ الرد</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-purple-700 min-w-[120px]">
                        J<br/>
                        <span className="text-xs font-normal">رقم PO</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-right font-semibold text-purple-700 min-w-[100px]">
                        K<br/>
                        <span className="text-xs font-normal">تاريخ PO</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-center font-semibold text-purple-700 min-w-[80px]">
                        L<br/>
                        <span className="text-xs font-normal">كمية PO</span>
                      </th>
                      <th className="border border-gray-300 px-2 py-3 text-center font-semibold text-purple-700 min-w-[80px]">
                        M<br/>
                        <span className="text-xs font-normal">سعر PO</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 50).map((row, index) => (
                      <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="border border-gray-300 px-2 py-2 font-bold text-blue-600 text-center bg-gray-50">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <span className={row.A ? 'text-gray-800 font-medium' : 'text-gray-400 italic text-xs'}>
                            {row.A || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          <span className={row.B ? 'text-gray-800 font-semibold' : 'text-gray-400 italic text-xs'}>
                            {row.B || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <span 
                            className={row.C ? 'text-gray-800 font-mono text-xs bg-blue-50 px-1 rounded' : 'text-gray-400 italic text-xs'} 
                            title={row.C}
                          >
                            {row.C ? String(row.C).substring(0, 15) + (String(row.C).length > 15 ? '...' : '') : 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <span 
                            className={row.D ? 'text-gray-800 text-xs' : 'text-gray-400 italic text-xs'} 
                            title={row.D}
                          >
                            {row.D ? String(row.D).substring(0, 25) + (String(row.D).length > 25 ? '...' : '') : 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <span className={row.E ? 'text-green-700 font-bold bg-green-50 px-2 py-1 rounded text-xs' : 'text-gray-400 italic text-xs'}>
                            {row.E || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          <span className={row.F ? 'text-gray-800' : 'text-gray-400 italic'}>
                            {row.F || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          <span className={row.G ? 'text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded text-xs' : 'text-gray-400 italic text-xs'}>
                            {row.G || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          <span className={row.H ? 'text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs' : 'text-gray-400 italic text-xs'}>
                            {row.H ? `${row.H}` : 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          <span className={row.I ? 'text-gray-800' : 'text-gray-400 italic'}>
                            {row.I || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <span className={row.J ? 'text-purple-700 font-mono text-xs bg-purple-50 px-1 rounded' : 'text-gray-400 italic text-xs'}>
                            {row.J || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          <span className={row.K ? 'text-gray-800' : 'text-gray-400 italic'}>
                            {row.K || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          <span className={row.L ? 'text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded text-xs' : 'text-gray-400 italic text-xs'}>
                            {row.L || 'فارغ'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          <span className={row.M ? 'text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded text-xs' : 'text-gray-400 italic text-xs'}>
                            {row.M ? `${row.M}` : 'فارغ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {previewData.length > 50 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-sm text-blue-800 font-medium">
                      📊 عرض أول 50 صف من إجمالي {previewData.length.toLocaleString()} صف مسترجع
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      البيانات الكاملة تحتوي على {(previewData.length * 13).toLocaleString()} خلية بيانات
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}