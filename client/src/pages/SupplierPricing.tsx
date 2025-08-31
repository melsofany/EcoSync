import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, History, FileText, AlertCircle, Clock, Package, Eye, Trash2 } from "lucide-react";
import NewSupplierPricingModal from "@/components/modals/NewSupplierPricingModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SupplierPricing() {
  const { toast } = useToast();
  const [isNewPricingModalOpen, setIsNewPricingModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [showPricingHistory, setShowPricingHistory] = useState(false);
  const [showItemsList, setShowItemsList] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Mutation to clear all supplier pricing data
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/supplier-pricing/clear-all', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في حذف البيانات');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الحذف بنجاح",
        description: data.message || `تم حذف ${data.deletedCount} بند من تسعير الموردين`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items-requiring-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-pricing"] });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف البيانات",
      });
    }
  });

  // Fetch items requiring pricing
  const { data: rawItemsRequiringPricing = [], isLoading: itemsLoading } = useQuery<any[]>({
    queryKey: ["/api/items-requiring-pricing"],
  });

  // دالة لحساب الأيام المتبقية
  const getDaysRemaining = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // دالة لحصول على لون البادج حسب الأيام المتبقية
  const getExpiryBadgeColor = (daysRemaining: number | null) => {
    if (daysRemaining === null) return "secondary";
    if (daysRemaining < 0) return "destructive"; // منتهي
    if (daysRemaining <= 3) return "destructive"; // خطر
    if (daysRemaining <= 7) return "default"; // تحذير
    return "secondary"; // آمن
  };

  // ترتيب البنود: الأقرب للانتهاء أولاً
  const itemsRequiringPricing = Array.isArray(rawItemsRequiringPricing) 
    ? rawItemsRequiringPricing.sort((a: any, b: any) => {
        const aDays = getDaysRemaining(a.expiryDate);
        const bDays = getDaysRemaining(b.expiryDate);
        
        // البنود بدون تاريخ انتهاء في النهاية
        if (aDays === null && bDays === null) return 0;
        if (aDays === null) return 1;
        if (bDays === null) return -1;
        
        // ترتيب تصاعدي حسب الأيام المتبقية
        return aDays - bDays;
      })
    : [];

  // Fetch all suppliers
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  // Fetch pricing history for selected item
  const { data: pricingHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/pricing-history", selectedItem?.id],
    enabled: !!selectedItem?.id,
  });

  // Fetch historical pricing data from Excel sheets
  const { data: historicalPricing = [] } = useQuery<any[]>({
    queryKey: ["/api/items", selectedItem?.id, "historical-pricing"],
    enabled: !!selectedItem?.id,
  });



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "غير محدد";
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${day}/${month}`;
  };

  const formatCurrency = (amount: string, currency: string = "EGP") => {
    return `${parseFloat(amount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ${currency}`;
  };

  const handleViewPricingHistory = (item: any) => {
    setSelectedItem(item);
    setShowPricingHistory(true);
    setShowItemsList(false);
  };

  const handleAddPricing = (item?: any) => {
    setSelectedItemId(item?.id || "");
    setIsNewPricingModalOpen(true);
  };

  const getPOStatusBadge = (pricing: any) => {
    if (pricing.purchaseOrderId) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <FileText className="h-3 w-3 ml-1" />
          صدر أمر شراء
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
        <AlertCircle className="h-3 w-3 ml-1" />
        لم يصدر أمر شراء
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة أسعار الموردين</h1>
          <p className="text-muted-foreground">
            إدارة أسعار الموردين وتتبع تاريخ الأسعار وأوامر الشراء
          </p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          {!showItemsList && (
            <Button variant="outline" onClick={() => {
              setShowItemsList(true);
              setShowPricingHistory(false);
              setSelectedItem(null);
            }}>
              العودة للقائمة
            </Button>
          )}
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
            className="ml-2"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف جميع البيانات
          </Button>
          <Button onClick={() => handleAddPricing()}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة سعر جديد
          </Button>
        </div>
      </div>

      {showItemsList && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 ml-2" />
              البنود التي تحتاج للتسعير ({itemsRequiringPricing.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              مرتبة حسب الأقرب للانتهاء - الطلبات العاجلة أولاً
            </p>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : itemsRequiringPricing.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد بنود تحتاج للتسعير حالياً
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الصنف</TableHead>
                    <TableHead>LINE ITEM</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الأيام المتبقية</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsRequiringPricing.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemNumber}</TableCell>
                      <TableCell className="font-mono text-blue-600 text-sm" dir="ltr">
                        {item.lineItem || "غير محدد"}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.category || "غير محدد"}</TableCell>
                      <TableCell>
                        {(() => {
                          const daysRemaining = getDaysRemaining(item.expiryDate);
                          return (
                            <Badge variant={getExpiryBadgeColor(daysRemaining)} className="gap-1">
                              <Clock className="h-3 w-3" />
                              {daysRemaining === null ? "بدون تاريخ" :
                               daysRemaining < 0 ? `منتهي منذ ${Math.abs(daysRemaining)} يوم` :
                               daysRemaining === 0 ? "ينتهي اليوم" :
                               daysRemaining === 1 ? "ينتهي غداً" :
                               `${daysRemaining} يوم متبقي`}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPricingHistory(item)}
                          >
                            <History className="h-4 w-4 ml-1" />
                            تاريخ الأسعار
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddPricing(item)}
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            إضافة سعر
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {showPricingHistory && selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 ml-2" />
              تاريخ أسعار الصنف: {selectedItem.itemNumber}
            </CardTitle>
            <p className="text-sm text-gray-600">{selectedItem.description}</p>
          </CardHeader>
          <CardContent>
            {pricingHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد أسعار محفوظة لهذا الصنف
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المورد</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>تاريخ ورود السعر</TableHead>
                    <TableHead>فترة الصلاحية</TableHead>
                    <TableHead>شروط الدفع</TableHead>
                    <TableHead>اسم الموظف</TableHead>
                    <TableHead>حالة أمر الشراء</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingHistory.map((pricing: any) => (
                    <TableRow key={pricing.id}>
                      <TableCell className="font-medium">
                        {suppliers.find((s: any) => s.id === pricing.supplierId)?.name || "غير محدد"}
                      </TableCell>
                      <TableCell>{formatCurrency(pricing.unitPrice, pricing.currency)}</TableCell>
                      <TableCell>{formatDate(pricing.priceReceivedDate)}</TableCell>
                      <TableCell>
                        {pricing.validityPeriod ? `${pricing.validityPeriod} يوم` : "غير محدد"}
                      </TableCell>
                      <TableCell>{pricing.paymentTerms || "غير محدد"}</TableCell>
                      <TableCell>{pricing.employeeName || "غير محدد"}</TableCell>
                      <TableCell>{getPOStatusBadge(pricing)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={pricing.status === "active" ? "default" : "secondary"}
                          className={pricing.status === "active" ? "bg-green-100 text-green-800" : ""}
                        >
                          {pricing.status === "active" ? "نشط" : 
                           pricing.status === "expired" ? "منتهي الصلاحية" : "متقادم"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical Pricing from Excel Sheets */}
      {showPricingHistory && selectedItem && historicalPricing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 ml-2" />
              البيانات التاريخية من الشيت للصنف: {selectedItem.kItemId}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {selectedItem.description} - LINE ITEM: <span className="text-blue-600 font-mono">{selectedItem.lineItem}</span>
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">سعر الوحدة</TableHead>
                  <TableHead className="text-right">المجموع</TableHead>
                  <TableHead className="text-right">تاريخ الطلب</TableHead>
                  <TableHead className="text-right">المصدر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalPricing.map((pricing: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {pricing.requestNumber || 'غير محدد'}
                    </TableCell>
                    <TableCell>{pricing.clientName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(pricing.quantity).toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(pricing.unitPrice, pricing.currency)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(pricing.totalPrice, pricing.currency)}
                    </TableCell>
                    <TableCell>{formatDate(pricing.requestDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {pricing.sourceType === 'quotation' ? 'طلب تسعير' : 'أمر شراء'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* New Supplier Pricing Modal */}
      <NewSupplierPricingModal
        isOpen={isNewPricingModalOpen}
        onClose={() => setIsNewPricingModalOpen(false)}
        selectedItemId={selectedItemId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف جميع البيانات</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف جميع بيانات تسعير الموردين من النظام؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات نهائياً من صفحة تسعير الموردين في Google Sheets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearAllMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف جميع البيانات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}