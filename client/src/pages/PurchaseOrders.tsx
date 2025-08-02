import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Printer, Truck, Clock, CheckCircle, DollarSign } from "lucide-react";
import { Link } from "wouter";
import NewPurchaseOrderModal from "@/components/modals/NewPurchaseOrderModal";

export default function PurchaseOrders() {
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: quotations } = useQuery({
    queryKey: ["/api/quotations"],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "في الانتظار", variant: "secondary" as const },
      confirmed: { label: "مؤكد", variant: "default" as const },
      delivered: { label: "تم التسليم", variant: "default" as const },
      invoiced: { label: "تم إصدار الفاتورة", variant: "default" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge 
        variant={config.variant} 
        className={
          status === "confirmed" || status === "delivered" || status === "invoiced" ? "bg-green-100 text-green-800 hover:bg-green-100" :
          status === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""
        }
      >
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return "غير محدد";
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getQuotationNumber = (quotationId: string) => {
    const quotation = quotations?.find((q: any) => q.id === quotationId);
    return quotation?.requestNumber || "غير محدد";
  };

  // Calculate statistics
  const pendingPOs = purchaseOrders?.filter((po: any) => po.status === "pending").length || 0;
  const confirmedPOs = purchaseOrders?.filter((po: any) => po.status === "confirmed").length || 0;
  const totalValue = purchaseOrders?.reduce((sum: number, po: any) => sum + (Number(po.totalValue) || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full loading-spinner mx-auto mb-2"></div>
          <p className="text-gray-600">جاري تحميل أوامر الشراء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة أوامر الشراء</h2>
          <p className="text-gray-600">إنشاء ومتابعة أوامر الشراء المرتبطة بطلبات التسعير</p>
        </div>
        <div className="flex gap-2">
          <Link href="/create-purchase-order">
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء أمر شراء
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsNewPOModalOpen(true)}>
            أمر شراء (مُبسط)
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">أوامر في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPOs}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">أوامر مؤكدة</p>
                <p className="text-2xl font-bold text-green-600">{confirmedPOs}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي القيمة</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الأمر</TableHead>
                  <TableHead className="text-right">رقم طلب التسعير</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">حالة التسليم</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!purchaseOrders || purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد أوامر شراء
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po: any) => (
                    <TableRow key={po.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell className="text-blue-600">
                        {getQuotationNumber(po.quotationId)}
                      </TableCell>
                      <TableCell>{formatDate(po.poDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(po.totalValue)}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className={`w-2 h-2 rounded-full ${po.deliveryStatus ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                          <span className="text-sm">
                            {po.deliveryStatus ? 'تم التسليم' : 'لم يتم التسليم'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button variant="ghost" size="sm" title="عرض التفاصيل">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="طباعة">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="تتبع الطلب" className="text-purple-600 hover:text-purple-800">
                            <Truck className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {purchaseOrders && purchaseOrders.length > 0 && (
            <div className="border-t px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                عرض <span className="font-medium">1</span> إلى{" "}
                <span className="font-medium">{Math.min(10, purchaseOrders.length)}</span> من{" "}
                <span className="font-medium">{purchaseOrders.length}</span> أمر
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button variant="outline" size="sm">السابق</Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">التالي</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <NewPurchaseOrderModal
        isOpen={isNewPOModalOpen}
        onClose={() => setIsNewPOModalOpen(false)}
      />
    </div>
  );
}
