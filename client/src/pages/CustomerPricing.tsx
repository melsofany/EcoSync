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

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

// Component to show detailed pricing info for an item
function ItemDetailedPricing({ item }: { item: any }) {
  const [detailedPricing, setDetailedPricing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);

  // Fetch only detailed pricing data when component mounts
  React.useEffect(() => {
    const fetchPricingData = async () => {
      if (!item?.id) {
        console.log('No item ID provided');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch detailed pricing only
        const detailedResponse = await fetch(`/api/items/${item.id}/detailed-pricing`);
        const detailedData = await detailedResponse.json();
        setDetailedPricing(detailedData);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricingData();
  }, [item?.id]);

  if (isLoading) {
    return <div className="bg-muted/30 rounded-lg p-4 text-center">جاري تحميل التفاصيل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Basic supplier pricing info - show data from item passed as prop */}
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
              {item.requestNumber ? `طلب رقم: ${item.requestNumber}` : "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">المورد:</label>
            <p className="text-sm">{item.supplierName || "غير محدد"}</p>
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

  const itemsArray = Array.isArray(itemsNeedingPricing) ? itemsNeedingPricing : [];

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

      {!itemsArray || itemsArray.length === 0 ? (
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
                البنود التي تحتاج تسعير للعملاء ({itemsArray.length})
              </CardTitle>
              <CardDescription>
                اضغط على أي بند لعرض تفاصيله وإضافة تسعير العميل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {itemsArray.map((item: any) => {
                const isOpen = openItems.has(item.id);
                console.log('Rendering item:', item.id, 'isOpen:', isOpen);
                return (
                  <Collapsible
                    key={item.id}
                    open={isOpen}
                    onOpenChange={() => {
                      console.log('Toggle item clicked:', item.id);
                      toggleItem(item.id);
                    }}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-lg border transition-colors">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          {isOpen ? (
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
                      {console.log('Rendering ItemDetailedPricing for item:', item.id)}
                      <ItemDetailedPricing item={item} />
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>

          {/* Force show ItemDetailedPricing for debugging */}
          {itemsArray.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">DEBUG: Force Show Item Details</CardTitle>
                <p className="text-sm text-red-600">
                  هذا القسم يعرض تفاصيل البند مباشرة لاختبار البيانات التاريخية من Excel
                </p>
              </CardHeader>
              <CardContent>
                <ItemDetailedPricing item={itemsArray[0]} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}