import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye, Printer, Truck, Clock, CheckCircle, DollarSign, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NewPurchaseOrderModal from "@/components/modals/NewPurchaseOrderModal";
import EditPurchaseOrderModal from "@/components/modals/EditPurchaseOrderModal";
import EditPOItemsModal from "@/components/modals/EditPOItemsModal";

export default function PurchaseOrders() {
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<any>(null);
  const [isEditItemsModalOpen, setIsEditItemsModalOpen] = useState(false);
  const [editingItemsPO, setEditingItemsPO] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: quotations } = useQuery({
    queryKey: ["/api/quotations"],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
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
    return quotation?.customRequestNumber || quotation?.requestNumber || "غير محدد";
  };

  // Get purchase order items
  const { data: poItems } = useQuery({
    queryKey: ["/api/purchase-orders", selectedPO?.id, "items"],
    enabled: !!selectedPO?.id,
  });

  // Delete purchase order mutation
  const deletePOMutation = useMutation({
    mutationFn: async (poId: string) => {
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ أثناء حذف أمر الشراء");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حذف أمر الشراء",
        description: "تم حذف أمر الشراء بنجاح من النظام",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف أمر الشراء",
        variant: "destructive",
      });
    }
  });

  // Handle editing purchase order
  const handleEditPO = (po: any) => {
    setEditingPO(po);
    setIsEditModalOpen(true);
  };

  // Handle deleting purchase order
  const handleDeletePO = (po: any) => {
    if (window.confirm(`هل أنت متأكد من حذف أمر الشراء رقم ${po.poNumber}؟`)) {
      deletePOMutation.mutate(po.id);
    }
  };

  // Handle viewing purchase order details
  const handleViewDetails = (po: any) => {
    setSelectedPO(po);
    setIsDetailsModalOpen(true);
  };

  // Handle printing purchase order
  const handlePrint = (po: any) => {
    // Create a simple print view
    const printContent = `
      <div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #1e40af;">أمر شراء رقم: ${po.poNumber}</h1>
        <div style="margin: 20px 0; border: 1px solid #ccc; padding: 15px;">
          <h2>تفاصيل الأمر</h2>
          <p><strong>رقم الطلب:</strong> ${getQuotationNumber(po.quotationId)}</p>
          <p><strong>تاريخ الأمر:</strong> ${formatDate(po.poDate)}</p>
          <p><strong>القيمة الإجمالية:</strong> ${formatCurrency(po.totalValue)}</p>
          <p><strong>الحالة:</strong> ${po.status}</p>
          <p><strong>حالة التسليم:</strong> ${po.deliveryStatus ? 'تم التسليم' : 'لم يتم التسليم'}</p>
        </div>
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>قرطبة للتوريدات</p>
          <p>تم الطباعة في: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Handle status update for tracking
  const updateStatusMutation = useMutation({
    mutationFn: async ({ poId, status }: { poId: string; status: string }) => {
      const response = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة أمر الشراء",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    },
  });

  const handleEditPOItems = (po: any) => {
    setEditingItemsPO(po);
    setIsEditItemsModalOpen(true);
  };

  // Calculate statistics
  const pendingPOs = purchaseOrders?.filter((po: any) => po.status === "pending").length || 0;
  const confirmedPOs = purchaseOrders?.filter((po: any) => po.status === "confirmed").length || 0;
  const totalValue = purchaseOrders?.reduce((sum: number, po: any) => sum + (Number(po.totalValue) || 0), 0) || 0;
  
  // Check if current user is manager
  const isManager = currentUser?.role === 'manager';

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
      <div className={`grid grid-cols-1 ${isManager ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
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

        {/* Total Value Card - Only for managers */}
        {isManager && (
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
        )}
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
                  {isManager && <TableHead className="text-right">القيمة</TableHead>}
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">حالة التسليم</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!purchaseOrders || purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 7 : 6} className="text-center py-8 text-gray-500">
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
                      {isManager && (
                        <TableCell className="font-medium">
                          {formatCurrency(po.totalValue)}
                        </TableCell>
                      )}
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="عرض التفاصيل"
                            onClick={() => handleViewDetails(po)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="طباعة"
                            onClick={() => handlePrint(po)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="تعديل البنود والكميات" 
                            className="text-purple-600 hover:text-purple-800"
                            onClick={() => handleEditPOItems(po)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="تحرير"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEditPO(po)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="حذف"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeletePO(po)}
                            disabled={deletePOMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <EditPurchaseOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        purchaseOrder={editingPO}
      />

      {/* Purchase Order Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل أمر الشراء رقم: {selectedPO?.poNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">رقم الطلب</label>
                  <p className="text-blue-600 font-medium">{getQuotationNumber(selectedPO.quotationId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">تاريخ الأمر</label>
                  <p>{formatDate(selectedPO.poDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">القيمة الإجمالية</label>
                  <p className="font-bold text-green-600">{formatCurrency(selectedPO.totalValue)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">الحالة</label>
                  <div>{getStatusBadge(selectedPO.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">حالة التسليم</label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`w-2 h-2 rounded-full ${selectedPO.deliveryStatus ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                    <span>{selectedPO.deliveryStatus ? 'تم التسليم' : 'لم يتم التسليم'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">حالة الفاتورة</label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`w-2 h-2 rounded-full ${selectedPO.invoiceIssued ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                    <span>{selectedPO.invoiceIssued ? 'تم إصدار الفاتورة' : 'لم يتم إصدار الفاتورة'}</span>
                  </div>
                </div>
              </div>
              
              {/* Purchase Order Items */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">أصناف أمر الشراء</h3>
                {poItems && poItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-right">رقم الصنف</TableHead>
                          <TableHead className="text-right">LINE ITEM</TableHead>
                          <TableHead className="text-right">الوصف</TableHead>
                          <TableHead className="text-right">PART NO</TableHead>
                          <TableHead className="text-right">الكمية</TableHead>
                          <TableHead className="text-right">سعر الوحدة</TableHead>
                          <TableHead className="text-right">المجموع</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poItems.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="text-sm font-medium">
                              {item.itemNumber || 'غير محدد'}
                            </TableCell>
                            <TableCell className="text-sm font-mono text-blue-600 font-semibold" dir="ltr">
                              {item.lineItem || 'غير محدد'}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm">
                                {item.description?.split('\n').map((line: string, lineIndex: number) => (
                                  <div key={lineIndex} className="mb-1">
                                    {line.trim()}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-mono text-gray-700">
                              {item.partNo || 'غير محدد'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {Number(item.quantity).toLocaleString('ar-EG')}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="bg-gray-50 px-4 py-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">إجمالي أمر الشراء:</span>
                        <span className="font-bold text-xl text-green-600">
                          {formatCurrency(selectedPO.totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد أصناف لهذا الأمر
                  </div>
                )}
              </div>

              {selectedPO.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ملاحظات</label>
                  <p className="bg-gray-50 p-2 rounded text-sm">{selectedPO.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handlePrint(selectedPO)} variant="outline">
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
                <Button onClick={() => setIsDetailsModalOpen(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit PO Items Modal */}
      {isEditItemsModalOpen && editingItemsPO && (
        <EditPOItemsModal
          isOpen={isEditItemsModalOpen}
          onClose={() => {
            setIsEditItemsModalOpen(false);
            setEditingItemsPO(null);
          }}
          purchaseOrder={editingItemsPO}
        />
      )}
    </div>
  );
}
