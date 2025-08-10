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
    const pricingData = itemData.pricingRequests.map(req => [
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
    const poData = itemData.purchaseOrders.map(po => [
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
      ...pricingData,
      ...poData
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
                <p className="text-2xl font-bold">{itemData.pricingRequests.length}</p>
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
                <p className="text-2xl font-bold">{itemData.purchaseOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">إجمالي الكمية المطلوبة</p>
              <p className="text-2xl font-bold">
                {itemData.pricingRequests.reduce((sum, req) => sum + req.quantity, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">إجمالي الكمية المشتراة</p>
              <p className="text-2xl font-bold">
                {itemData.purchaseOrders.reduce((sum, po) => sum + po.quantity, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول طلبات التسعير */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            طلبات التسعير ({itemData.pricingRequests.length} سجل)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">سعر الوحدة</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">العملة</TableHead>
                  <TableHead className="text-right">تاريخ التسعير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemData.pricingRequests.map((req, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-blue-600">
                      {req.requestNumber}
                    </TableCell>
                    <TableCell>{req.clientName || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{req.quantity}</TableCell>
                    <TableCell className="text-left font-mono">
                      {req.unitPrice.toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell className="text-left font-mono font-semibold">
                      {(req.unitPrice * req.quantity).toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.currency || 'EGP'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {req.supplierQuoteDate ? new Date(req.supplierQuoteDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* جدول أوامر الشراء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            أوامر الشراء ({itemData.purchaseOrders.length} سجل)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الأمر</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">سعر الوحدة</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">العملة</TableHead>
                  <TableHead className="text-right">تاريخ الأمر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemData.purchaseOrders.map((po, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-green-600">
                      {po.poNumber}
                    </TableCell>
                    <TableCell className="text-center">{po.quantity}</TableCell>
                    <TableCell className="text-left font-mono">
                      {po.unitPrice.toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell className="text-left font-mono font-semibold">
                      {po.totalPrice.toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={po.status === 'delivered' ? 'default' : 'secondary'}
                        className={po.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {po.status === 'delivered' ? 'تم التسليم' : po.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{po.currency || 'EGP'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {po.orderDate ? new Date(po.orderDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}