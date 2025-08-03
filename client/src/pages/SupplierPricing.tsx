import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, History, FileText, AlertCircle, Clock, Package, Eye } from "lucide-react";
import NewSupplierPricingModal from "@/components/modals/NewSupplierPricingModal";

export default function SupplierPricing() {
  const [isNewPricingModalOpen, setIsNewPricingModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [showPricingHistory, setShowPricingHistory] = useState(false);
  const [showItemsList, setShowItemsList] = useState(true);

  // Fetch items requiring pricing
  const { data: itemsRequiringPricing = [], isLoading: itemsLoading } = useQuery<any[]>({
    queryKey: ["/api/items-requiring-pricing"],
  });

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
    return new Date(dateString).toLocaleDateString('ar-EG');
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
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsRequiringPricing.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemNumber}</TableCell>
                      <TableCell className="font-mono text-blue-600 text-sm">
                        {item.lineItem || "غير محدد"}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.category || "غير محدد"}</TableCell>
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
    </div>
  );
}