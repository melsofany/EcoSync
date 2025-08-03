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
  const [showPricingForm, setShowPricingForm] = useState(false);

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
            <label className="text-sm font-medium">رقم الطلب:</label>
            <p className="text-sm">
              {item.requestNumber || "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">المورد:</label>
            <p className="text-sm">{item.supplierName || "غير محدد"}</p>
          </div>
          <div>
            <label className="text-sm font-medium">الكمية:</label>
            <p className="text-sm">{item.quantity}</p>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => setShowPricingForm(!showPricingForm)}
            variant={showPricingForm ? "secondary" : "default"}
            size="sm"
          >
            {showPricingForm ? "إخفاء النموذج" : "إضافة تسعير للعميل"}
          </Button>
        </div>
        
        {showPricingForm && (
          <div className="mt-4">
            <CustomerPricingForm 
              item={item} 
              onSuccess={() => setShowPricingForm(false)} 
            />
          </div>
        )}
      </div>

      {/* Current item information */}
      <div className="mt-4">
        <h5 className="font-semibold mb-2 flex items-center gap-2">
          معلومات البند
        </h5>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">البند:</span>
              <p className="font-bold">{item.description}</p>
            </div>
            <div>
              <span className="font-medium">K-ID:</span>
              <p className="font-bold text-blue-600">{item.kItemId}</p>
            </div>
            <div>
              <span className="font-medium">رقم البند:</span>
              <p className="font-bold">{item.itemNumber}</p>
            </div>
            <div>
              <span className="font-medium">الوحدة:</span>
              <p className="font-bold">{item.unit}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified inline customer pricing form
function CustomerPricingForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    sellingPrice: "",
    quantity: item.quantity?.toString() || "1",
    notes: "",
  });
  const [profitMargin, setProfitMargin] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const costPrice = Number(item.supplierPrice || 0);

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
    
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال سعر بيع صالح",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/customer-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          quotationId: item.quotationId,
          costPrice: costPrice,
          profitMargin: profitMargin / 100,
          sellingPrice: Number(formData.sellingPrice),
          quantity: Number(formData.quantity),
          totalAmount: totalAmount,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create customer pricing");
      }

      toast({
        title: "تم بنجاح",
        description: "تم حفظ تسعير العميل بنجاح",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/items-ready-for-customer-pricing"] });
      onSuccess();
    } catch (error) {
      console.error("Error creating customer pricing:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ التسعير",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg border">
      <h4 className="font-semibold">إضافة تسعير العميل</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">سعر التكلفة (المورد)</label>
          <Input
            type="text"
            value={formatCurrency(costPrice)}
            disabled
            className="bg-gray-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium">سعر البيع للعميل *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) => setFormData(prev => ({...prev, sellingPrice: e.target.value}))}
            placeholder="أدخل سعر البيع"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">الكمية</label>
          <Input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({...prev, quantity: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">هامش الربح</label>
          <Input
            type="text"
            value={`${profitMargin.toFixed(2)}%`}
            disabled
            className="bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">المبلغ الإجمالي</label>
        <Input
          type="text"
          value={formatCurrency(totalAmount)}
          disabled
          className="bg-gray-100 font-semibold"
        />
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