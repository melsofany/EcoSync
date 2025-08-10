import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { ArrowLeft, FileText, ShoppingCart, Download } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ItemData {
  id: string;
  itemNumber: string;
  description: string;
  partNumber?: string;
  pricingRequests: Array<{
    quotationId: string;
    requestNumber: string;
    clientName?: string;
    quantity: number;
    unitPrice: number;
    supplierQuoteDate?: string;
    currency?: string;
  }>;
  purchaseOrders: Array<{
    poId: string;
    poNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: string;
    orderDate?: string;
    currency?: string;
  }>;
}

export default function ItemDataSheet() {
  const { itemId } = useParams();

  const { data: itemData, isLoading } = useQuery<ItemData>({
    queryKey: ['/api/items', itemId, 'comprehensive-data'],
    enabled: !!itemId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-gray-500">لم يتم العثور على بيانات البند</p>
        </div>
      </div>
    );
  }

  const exportToCSV = () => {
    // تحضير بيانات طلبات التسعير للتصدير
    const pricingData = itemData.pricingRequests?.map(req => [
      'طلب تسعير',
      req.requestNumber,
      req.clientName || 'غير محدد',
      req.quantity,
      req.unitPrice,
      req.unitPrice * req.quantity,
      req.currency || 'EGP',
      req.supplierQuoteDate || ''
    ]);

    // تحضير بيانات أوامر الشراء للتصدير
    const poData = itemData.purchaseOrders?.map(po => [
      'أمر شراء',
      po.poNumber,
      'مورد',
      po.quantity,
      po.unitPrice,
      po.totalPrice,
      po.currency || 'EGP',
      po.orderDate || ''
    ]);

    // دمج البيانات
    const allData = [
      ['نوع العملية', 'رقم المرجع', 'العميل/المورد', 'الكمية', 'سعر الوحدة', 'الإجمالي', 'العملة', 'التاريخ'],
      ...(pricingData || []),
      ...(poData || [])
    ];

    // تحويل لـ CSV
    const csvContent = allData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${itemData.itemNumber}_data.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/items">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع للبنود
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            بيانات البند {itemData.itemNumber}
          </h1>
          <p className="text-gray-600 mt-1">{itemData.description}</p>
          {itemData.partNumber && (
            <p className="text-sm text-gray-500">رقم القطعة: {itemData.partNumber}</p>
          )}
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">طلبات التسعير</p>
                <p className="text-2xl font-bold">{itemData.pricingRequests?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">أوامر الشراء</p>
                <p className="text-2xl font-bold">{itemData.purchaseOrders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">إجمالي الكمية المطلوبة</p>
              <p className="text-2xl font-bold">
                {itemData.pricingRequests?.reduce((sum, req) => sum + req.quantity, 0) || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">إجمالي الكمية المشتراة</p>
              <p className="text-2xl font-bold">
                {itemData.purchaseOrders?.reduce((sum, po) => sum + po.quantity, 0) || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول البيانات الموحد - شبيه بالإكسل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            بيانات البند الكاملة - {itemData.itemNumber}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            📊 البيانات الحقيقية: {itemData.pricingRequests?.length || 0} طلب تسعير + {itemData.purchaseOrders?.length || 0} أمر شراء
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-right border font-bold">النوع</TableHead>
                  <TableHead className="text-right border font-bold">رقم المرجع</TableHead>
                  <TableHead className="text-right border font-bold">العميل/المورد</TableHead>
                  <TableHead className="text-right border font-bold">الكمية</TableHead>
                  <TableHead className="text-right border font-bold">سعر الوحدة (جنيه)</TableHead>
                  <TableHead className="text-right border font-bold">الإجمالي (جنيه)</TableHead>
                  <TableHead className="text-right border font-bold">الحالة</TableHead>
                  <TableHead className="text-right border font-bold">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* طلبات التسعير */}
                {itemData.pricingRequests?.map((req, index) => (
                  <TableRow key={`rfq-${index}`} className="hover:bg-blue-50 border-b">
                    <TableCell className="border bg-blue-50">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        📋 طلب تسعير
                      </Badge>
                    </TableCell>
                    <TableCell className="border font-mono text-blue-600 font-semibold">
                      {req.requestNumber}
                    </TableCell>
                    <TableCell className="border">{req.clientName || 'عميل غير محدد'}</TableCell>
                    <TableCell className="border text-center font-semibold">{req.quantity}</TableCell>
                    <TableCell className="border text-left font-mono">
                      {req.unitPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="border text-left font-mono font-bold text-blue-700">
                      {(req.unitPrice * req.quantity).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="border">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        في الانتظار
                      </Badge>
                    </TableCell>
                    <TableCell className="border text-sm">
                      {req.supplierQuoteDate ? new Date(req.supplierQuoteDate).toLocaleDateString('ar-EG') : '2025-08-10'}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* أوامر الشراء */}
                {itemData.purchaseOrders?.map((po, index) => (
                  <TableRow key={`po-${index}`} className="hover:bg-green-50 border-b">
                    <TableCell className="border bg-green-50">
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        🛒 أمر شراء
                      </Badge>
                    </TableCell>
                    <TableCell className="border font-mono text-green-600 font-semibold">
                      {po.poNumber}
                    </TableCell>
                    <TableCell className="border">مورد معتمد</TableCell>
                    <TableCell className="border text-center font-semibold">{po.quantity}</TableCell>
                    <TableCell className="border text-left font-mono">
                      {po.unitPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="border text-left font-mono font-bold text-green-700">
                      {po.totalPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="border">
                      <Badge variant="default" className="bg-green-600 text-white">
                        {po.status === 'delivered' ? '✅ تم التسليم' : po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="border text-sm">
                      {po.orderDate ? new Date(po.orderDate).toLocaleDateString('ar-EG') : '2025-08-03'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* ملخص إجمالي */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <h4 className="font-bold text-lg mb-4 text-center">📊 ملخص إجمالي للبند {itemData.itemNumber}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-100 p-3 rounded">
                <p className="text-sm text-blue-600">طلبات التسعير</p>
                <p className="text-2xl font-bold text-blue-800">{itemData.pricingRequests?.length || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded">
                <p className="text-sm text-green-600">أوامر الشراء</p>
                <p className="text-2xl font-bold text-green-800">{itemData.purchaseOrders?.length || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <p className="text-sm text-yellow-600">إجمالي الكمية المطلوبة</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {itemData.pricingRequests?.reduce((sum, req) => sum + req.quantity, 0) || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded">
                <p className="text-sm text-purple-600">إجمالي الكمية المشتراة</p>
                <p className="text-2xl font-bold text-purple-800">
                  {itemData.purchaseOrders?.reduce((sum, po) => sum + po.quantity, 0) || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-lg">
                <span className="font-bold">إجمالي القيمة المشتراة: </span>
                <span className="text-2xl font-bold text-green-700">
                  {(itemData.purchaseOrders?.reduce((sum, po) => sum + po.totalPrice, 0) || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}