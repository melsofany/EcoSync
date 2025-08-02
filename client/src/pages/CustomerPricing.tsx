import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Eye, Clock, Package, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function CustomerPricing() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get items ready for customer pricing
  const { data: itemsReadyForPricing = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/items-ready-for-customer-pricing"],
  });

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const showItemDetails = async (item: any) => {
    // Fetch detailed pricing info
    const response = await fetch(`/api/items/${item.item.id}/detailed-pricing`);
    const detailedPricing = await response.json();
    setSelectedItem({ ...item, detailedPricing });
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل البنود...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تسعير العملاء</h1>
          <p className="text-muted-foreground">
            المرحلة الثانية - البنود الجاهزة لتسعير العملاء
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            {itemsReadyForPricing.length} بند جاهز للتسعير
          </Badge>
        </div>
      </div>

      {itemsReadyForPricing.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد بنود جاهزة للتسعير</h3>
            <p className="text-muted-foreground">
              جميع البنود إما لم يتم تسعيرها من الموردين أو تم تسعيرها للعملاء بالفعل
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>البنود الجاهزة للتسعير</CardTitle>
            <CardDescription>
              انقر على أي بند لعرض تفاصيل أسعار الموردين وتاريخ التسعير
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {itemsReadyForPricing.map((item: any) => (
                <Collapsible key={item.item.id} open={openItems.has(item.item.id)}>
                  <CollapsibleTrigger asChild>
                    <div
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleItem(item.item.id)}
                    >
                      <div className="flex items-center gap-3">
                        {openItems.has(item.item.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <h3 className="font-semibold">{item.item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            رقم البند: {item.item.itemNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          في انتظار التسعير
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            showItemDetails(item);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          عرض التفاصيل
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">سعر المورد:</label>
                          <p className="font-semibold">
                            {formatCurrency(Number(item.supplierPricing?.unitPrice || 0))}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">تاريخ ورود السعر:</label>
                          <p className="text-sm">
                            {item.supplierPricing?.priceReceivedDate &&
                              format(
                                new Date(item.supplierPricing.priceReceivedDate),
                                "dd/MM/yyyy",
                                { locale: ar }
                              )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">اسم المورد:</label>
                          <p className="text-sm">{item.supplierPricing?.supplier?.name || "غير محدد"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">شروط الدفع:</label>
                          <p className="text-sm">{item.supplierPricing?.paymentTerms || "غير محدد"}</p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal for detailed pricing information */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل تسعير البند: {selectedItem?.item?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Supplier Pricing History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">تاريخ أسعار الموردين</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المورد</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>تاريخ الورود</TableHead>
                      <TableHead>أمر الشراء</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItem.detailedPricing?.supplierPricings?.map((pricing: any) => (
                      <TableRow key={pricing.id}>
                        <TableCell>{pricing.supplier?.name || "غير محدد"}</TableCell>
                        <TableCell>{formatCurrency(Number(pricing.unitPrice))}</TableCell>
                        <TableCell>
                          {format(new Date(pricing.priceReceivedDate), "dd/MM/yyyy", { locale: ar })}
                        </TableCell>
                        <TableCell>
                          {pricing.purchaseOrderId ? (
                            <Badge variant="outline">موجود</Badge>
                          ) : (
                            <Badge variant="secondary">غير موجود</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pricing.status === "active" ? "default" : "secondary"}>
                            {pricing.status === "active" ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pricing History */}
              {selectedItem.detailedPricing?.pricingHistory?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">سجل تغييرات الأسعار</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نوع السعر</TableHead>
                        <TableHead>السعر القديم</TableHead>
                        <TableHead>السعر الجديد</TableHead>
                        <TableHead>سبب التغيير</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItem.detailedPricing.pricingHistory.map((history: any) => (
                        <TableRow key={history.id}>
                          <TableCell>
                            {history.priceType === "supplier" ? "مورد" : "عميل"}
                          </TableCell>
                          <TableCell>
                            {history.oldPrice ? formatCurrency(Number(history.oldPrice)) : "-"}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(history.newPrice))}</TableCell>
                          <TableCell>{history.changeReason || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(history.createdAt), "dd/MM/yyyy HH:mm", { locale: ar })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}