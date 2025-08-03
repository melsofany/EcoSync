import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, Clock, Package, AlertCircle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// Component to show detailed pricing info for an item
function ItemDetailedPricing({ item }: { item: any }) {
  const [detailedPricing, setDetailedPricing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);

  // Fetch detailed pricing when component mounts
  React.useEffect(() => {
    const fetchDetailedPricing = async () => {
      if (!item?.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/items/${item.id}/detailed-pricing`);
        const data = await response.json();
        setDetailedPricing(data);
      } catch (error) {
        console.error('Error fetching detailed pricing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailedPricing();
  }, [item?.id]);

  if (isLoading) {
    return <div className="bg-muted/30 rounded-lg p-4 text-center">جاري تحميل التفاصيل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Basic supplier pricing info */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          معلومات التسعير الحالي
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">سعر المورد:</label>
            <p className="font-semibold text-green-600">
              {formatCurrency(Number(item.supplierPrice || 0))}
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
            <label className="text-sm font-medium">المورد:</label>
            <p className="text-sm">{item.supplierPricing?.supplier?.name || "غير محدد"}</p>
          </div>
          <div>
            <label className="text-sm font-medium">حالة أمر الشراء:</label>
            <Badge variant={item.supplierPricing?.purchaseOrderId ? "default" : "secondary"}>
              {item.supplierPricing?.purchaseOrderId ? "صدر أمر شراء" : "لم يصدر أمر شراء"}
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => setShowPricingForm(!showPricingForm)}
            variant={showPricingForm ? "secondary" : "default"}
            size="sm"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            {showPricingForm ? "إخفاء نموذج التسعير" : "إضافة تسعير للعميل"}
          </Button>
        </div>
      </div>

      {/* Customer pricing form */}
      {showPricingForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <CustomerPricingForm item={item} onSuccess={() => setShowPricingForm(false)} />
        </div>
      )}

      {/* Comprehensive pricing table like the image */}
      {detailedPricing && (
        <div className="bg-white rounded-lg border p-4 mt-4">
          <h4 className="font-semibold mb-4">جدول التسعير المتكامل</h4>
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-blue-100">
                  <TableHead className="text-center font-bold text-black border">PROCESS NO</TableHead>
                  <TableHead className="text-center font-bold text-black border">QUANTITY</TableHead>
                  <TableHead className="text-center font-bold text-black border">DATE/PO</TableHead>
                  <TableHead className="text-center font-bold text-black border">PO</TableHead>
                  <TableHead className="text-center font-bold text-black border">Category</TableHead>
                  <TableHead className="text-center font-bold text-black border">REQ_DATE</TableHead>
                  <TableHead className="text-center font-bold text-black border">PRICE/DATE</TableHead>
                  <TableHead className="text-center font-bold text-black border">QTY</TableHead>
                  <TableHead className="text-center font-bold text-black border">DATE</TableHead>
                  <TableHead className="text-center font-bold text-black border">SPR</TableHead>
                  <TableHead className="text-center font-bold text-black border">DESCRIPTION</TableHead>
                  <TableHead className="text-center font-bold text-black border">PART NO</TableHead>
                  <TableHead className="text-center font-bold text-black border">UNE ITEM</TableHead>
                  <TableHead className="text-center font-bold text-black border">UOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Supplier pricing entries */}
                {detailedPricing?.supplierPricings && detailedPricing.supplierPricings.map((pricing: any, index: number) => (
                  <TableRow key={`supplier-${pricing.id}`} className="hover:bg-gray-50 border-b">
                    <TableCell className="text-center border font-bold">10500</TableCell>
                    <TableCell className="text-center border">{pricing.minimumOrderQuantity || 1}</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(pricing.priceReceivedDate), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border">
                      {pricing.purchaseOrderId ? pricing.purchaseOrderId.slice(-8) : ""}
                    </TableCell>
                    <TableCell className="text-center border font-bold">HEAT</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(pricing.priceReceivedDate), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border font-bold">
                      {formatCurrency(Number(pricing.unitPrice))}
                    </TableCell>
                    <TableCell className="text-center border">{pricing.minimumOrderQuantity || 1}</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(pricing.createdAt), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border font-bold">
                      {pricing.status === "active" ? "28R000244" : "INACTIVE"}
                    </TableCell>
                    <TableCell className="text-left border px-2 text-xs max-w-xs">
                      <div className="break-words">
                        {item.item?.description?.toUpperCase() || "EGG PIN - ( 11.3473.338 ) HOT PLATE ( EGG ) ST AT FRAME NEW MODEL FROM 2007"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center border font-bold">
                      {item.item?.itemNumber || "11.3473.338"}
                    </TableCell>
                    <TableCell className="text-center border font-bold text-xs">
                      1631.003 GENERAL 7902
                    </TableCell>
                    <TableCell className="text-center border font-bold">Each</TableCell>
                  </TableRow>
                ))}
                
                {/* Customer pricing entries */}
                {detailedPricing?.customerPricings && detailedPricing.customerPricings.map((pricing: any) => (
                  <TableRow key={`customer-${pricing.id}`} className="hover:bg-blue-50 bg-blue-25 border-b">
                    <TableCell className="text-center border font-bold">10500</TableCell>
                    <TableCell className="text-center border">{pricing.quantity}</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(pricing.createdAt), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border">
                      {pricing.quotationId ? pricing.quotationId.slice(-8) : ""}
                    </TableCell>
                    <TableCell className="text-center border font-bold">HEAT</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(pricing.createdAt), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border font-bold">
                      {formatCurrency(Number(pricing.sellingPrice))}
                    </TableCell>
                    <TableCell className="text-center border">{pricing.quantity}</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(pricing.createdAt), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border font-bold">
                      28R000244
                    </TableCell>
                    <TableCell className="text-left border px-2 text-xs max-w-xs">
                      <div className="break-words">
                        {item.item?.description?.toUpperCase() || "EGG PIN - ( 11.3473.338 ) HOT PLATE ( EGG ) ST AT FRAME NEW MODEL FROM 2007"} - CUSTOMER PRICING
                      </div>
                    </TableCell>
                    <TableCell className="text-center border font-bold">
                      {item.item?.itemNumber || "11.3473.338"}
                    </TableCell>
                    <TableCell className="text-center border font-bold text-xs">
                      1631.003 GENERAL 7902
                    </TableCell>
                    <TableCell className="text-center border font-bold">Each</TableCell>
                  </TableRow>
                ))}
                
                {/* If no data, show item basic info */}
                {(!detailedPricing?.supplierPricings || detailedPricing.supplierPricings.length === 0) && 
                 (!detailedPricing?.customerPricings || detailedPricing.customerPricings.length === 0) && (
                  <TableRow className="border-b">
                    <TableCell className="text-center border font-bold">10500</TableCell>
                    <TableCell className="text-center border">1</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border"></TableCell>
                    <TableCell className="text-center border font-bold">HEAT</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border font-bold">-</TableCell>
                    <TableCell className="text-center border">1</TableCell>
                    <TableCell className="text-center border">
                      {format(new Date(), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center border font-bold">28R000244</TableCell>
                    <TableCell className="text-left border px-2 text-xs max-w-xs">
                      <div className="break-words">
                        {item.item?.description?.toUpperCase() || "EGG PIN - ( 11.3473.338 ) HOT PLATE ( EGG ) ST AT FRAME NEW MODEL FROM 2007"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center border font-bold">
                      {item.item?.itemNumber || "11.3473.338"}
                    </TableCell>
                    <TableCell className="text-center border font-bold text-xs">
                      1631.003 GENERAL 7902
                    </TableCell>
                    <TableCell className="text-center border font-bold">Each</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary section */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">إجمالي عروض الموردين:</span>
                <p className="text-blue-600 font-bold">
                  {detailedPricing.supplierPricings?.length || 0}
                </p>
              </div>
              <div>
                <span className="font-medium">إجمالي تسعير العملاء:</span>
                <p className="text-green-600 font-bold">
                  {detailedPricing.customerPricings?.length || 0}
                </p>
              </div>
              <div>
                <span className="font-medium">آخر سعر مورد:</span>
                <p className="text-blue-600 font-bold">
                  {detailedPricing.supplierPricings?.length > 0 
                    ? formatCurrency(Number(detailedPricing.supplierPricings[0].unitPrice))
                    : "-"}
                </p>
              </div>
              <div>
                <span className="font-medium">آخر سعر عميل:</span>
                <p className="text-green-600 font-bold">
                  {detailedPricing.customerPricings?.length > 0 
                    ? formatCurrency(Number(detailedPricing.customerPricings[0].sellingPrice))
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified inline customer pricing form
function CustomerPricingForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    sellingPrice: "",
    quantity: "1",
    notes: "",
  });
  const [profitMargin, setProfitMargin] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const costPrice = Number(item.supplierPricing?.unitPrice || 0);

  // Calculate profit margin and total
  React.useEffect(() => {
    const sellingPrice = Number(formData.sellingPrice) || 0;
    const quantity = Number(formData.quantity) || 1;

    if (costPrice > 0 && sellingPrice > 0) {
      const margin = ((sellingPrice - costPrice) / costPrice) * 100;
      setProfitMargin(Number(margin.toFixed(2)));
    } else {
      setProfitMargin(0);
    }

    setTotalAmount(sellingPrice * quantity);
  }, [formData.sellingPrice, formData.quantity, costPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/customer-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId: null, // لا نربط بعرض سعر محدد
          itemId: item.item.id,
          supplierPricingId: item.supplierPricing?.id,
          costPrice: costPrice,
          sellingPrice: Number(formData.sellingPrice),
          quantity: Number(formData.quantity),
          profitMargin,
          totalAmount,
          notes: formData.notes,
          currency: "EGP",
          createdBy: "current-user-id", // سيتم تحديده لاحقاً من auth context
        }),
      });

      if (!response.ok) throw new Error("فشل في حفظ التسعير");

      toast({
        title: "تم إضافة تسعير العميل بنجاح",
        description: `نسبة الربح: ${profitMargin.toFixed(2)}%`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/items-ready-for-customer-pricing"] });
      onSuccess();
      setFormData({ sellingPrice: "", quantity: "1", notes: "" });
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة التسعير",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-semibold">إضافة تسعير جديد للعميل</h4>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">سعر التكلفة</label>
          <Input value={formatCurrency(costPrice)} disabled className="bg-gray-100" />
        </div>
        <div>
          <label className="text-sm font-medium">سعر البيع *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) => setFormData(prev => ({...prev, sellingPrice: e.target.value}))}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">الكمية *</label>
          <Input
            type="number"
            step="1"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({...prev, quantity: e.target.value}))}
            required
          />
        </div>
      </div>

      {/* Profit calculation display */}
      <div className="bg-white border rounded-lg p-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">نسبة الربح:</span>
            <p className={`text-lg font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(2)}%
            </p>
          </div>
          <div>
            <span className="font-medium">إجمالي المبلغ:</span>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div>
            <span className="font-medium">صافي الربح:</span>
            <p className={`text-lg font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency((Number(formData.sellingPrice) - costPrice) * Number(formData.quantity))}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">ملاحظات</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
          placeholder="أضف ملاحظات حول التسعير..."
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          حفظ التسعير
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

export default function CustomerPricing() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const { data: itemsNeedingPricing = [], isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">تسعير العملاء</h1>
        <p className="text-muted-foreground">
          هنا يمكنك تسعير البنود للعملاء بناءً على أسعار الموردين
        </p>
      </div>

      {!itemsNeedingPricing || itemsNeedingPricing.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد بنود تحتاج تسعير</h3>
            <p className="text-muted-foreground">
              جميع البنود التي لها أسعار موردين تم تسعيرها للعملاء
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                البنود التي تحتاج تسعير للعملاء ({itemsNeedingPricing.length})
              </CardTitle>
              <CardDescription>
                اضغط على أي بند لعرض تفاصيله وإضافة تسعير العميل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {itemsNeedingPricing.map((item: any) => (
                <Collapsible
                  key={item.id}
                  open={openItems.has(item.id)}
                  onOpenChange={() => toggleItem(item.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-lg border transition-colors">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {openItems.has(item.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="text-right">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.kItemId} | رقم البند: {item.itemNumber} | الوحدة: {item.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          في انتظار التسعير
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <ItemDetailedPricing item={item} />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}