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
import { useToast } from "@/hooks/use-toast";

// Component to show detailed pricing info for an item
function ItemDetailedPricing({ item }: { item: any }) {
  const [detailedPricing, setDetailedPricing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);

  // State for comprehensive data
  const [comprehensiveData, setComprehensiveData] = useState<any[]>([]);

  // Fetch detailed pricing when component mounts
  React.useEffect(() => {
    const fetchDetailedPricing = async () => {
      if (!item?.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/items/${item.id}/detailed-pricing`);
        const data = await response.json();
        setDetailedPricing(data);

        // Also fetch comprehensive data
        const comprehensiveResponse = await fetch(`/api/items/${item.id}/comprehensive-data`);
        const comprehensiveResult = await comprehensiveResponse.json();
        setComprehensiveData(comprehensiveResult);
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
      {/* معلومات البند الأساسية */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" />
          تفاصيل البند
        </h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <label className="font-medium">معرف البند:</label>
            <p className="text-blue-600">{item.itemNumber}</p>
          </div>
          <div>
            <label className="font-medium">LINE ITEM:</label>
            <p className="text-blue-600">{item.lineItem || "غير محدد"}</p>
          </div>
          <div>
            <label className="font-medium">PART NO:</label>
            <p className="text-blue-600">{item.partNumber || "غير محدد"}</p>
          </div>
          <div>
            <label className="font-medium">الوحدة:</label>
            <p className="text-blue-600">{item.unit}</p>
          </div>
        </div>
      </div>

      {/* معلومات طلب التسعير */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          معلومات طلب التسعير (RFQ)
        </h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <label className="font-medium">رقم طلب التسعير:</label>
            <p className="text-yellow-700 font-bold">{item.requestNumber}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ الطلب:</label>
            <p className="text-yellow-700">{item.requestDate || "تاريخ غير محدد"}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ انتهاء العرض:</label>
            <p className="text-yellow-700">{item.expiryDate || "تاريخ غير محدد"}</p>
          </div>
          <div>
            <label className="font-medium">الكمية المطلوبة:</label>
            <p className="text-yellow-700 font-bold">{item.quantity}</p>
          </div>
        </div>
      </div>

      {/* Basic supplier pricing info - show data from item passed as prop */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
            <label className="text-sm font-medium">المورد:</label>
            <p className="text-sm">{item.supplierName || "غير محدد"}</p>
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

      {/* إحصائيات سريعة */}
      {comprehensiveData && comprehensiveData.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-3 text-blue-800">ملخص إحصائيات البند المطابق</h4>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <label className="font-medium text-gray-600">إجمالي السجلات:</label>
              <p className="text-purple-700 font-bold text-lg">{comprehensiveData.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <label className="font-medium text-gray-600">إجمالي الكمية:</label>
              <p className="text-green-700 font-bold text-lg">
                {comprehensiveData.reduce((sum, row) => sum + (Number(row.rfq_qty) || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <label className="font-medium text-gray-600">طلبات مع أسعار:</label>
              <p className="text-orange-700 font-bold text-lg">
                {comprehensiveData.filter(row => Number(row.customer_price) > 0).length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <label className="font-medium text-gray-600">أوامر الشراء:</label>
              <p className="text-red-700 font-bold text-lg">
                {comprehensiveData.filter(row => row.po_number && row.po_number !== '').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* جدول البيانات المرتبطة مشابه للإكسيل */}
      <div className="bg-white rounded-lg border shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            جدول البيانات التفصيلية للبند - مطابق لنموذج Excel
          </h4>
          <p className="text-blue-100 text-sm mt-1">
            عرض دقيق للبيانات المطابقة لـ LINE ITEM: {item.lineItem} و PART NO: {item.partNumber}
            {comprehensiveData && ` (${comprehensiveData.length} سجل)`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-gray-400 p-2 text-center font-bold">TOTAL PO</th>
                <th className="border border-gray-400 p-2 text-center font-bold">PRICE/PO</th>
                <th className="border border-gray-400 p-2 text-center font-bold">Quantity/PO</th>
                <th className="border border-gray-400 p-2 text-center font-bold">DATE/PO</th>
                <th className="border border-gray-400 p-2 text-center font-bold">PO</th>
                <th className="border border-gray-400 p-2 text-center font-bold">Category</th>
                <th className="border border-gray-400 p-2 text-center font-bold">RES.DATE</th>
                <th className="border border-gray-400 p-2 text-center font-bold">PRICE/RFQ</th>
                <th className="border border-gray-400 p-2 text-center font-bold">QTY</th>
                <th className="border border-gray-400 p-2 text-center font-bold">DATE/RFQ</th>
                <th className="border border-gray-400 p-2 text-center font-bold">RFQ</th>
                <th className="border border-gray-400 p-2 text-center font-bold">DESCRIPTION</th>
                <th className="border border-gray-400 p-2 text-center font-bold">PART NO</th>
                <th className="border border-gray-400 p-2 text-center font-bold">LINE ITEM</th>
                <th className="border border-gray-400 p-2 text-center font-bold">UOM</th>
              </tr>
            </thead>
            <tbody>
              {/* عرض البيانات الشاملة من قاعدة البيانات */}
              {comprehensiveData && comprehensiveData.length > 0 ? (
                comprehensiveData.map((row: any, index: number) => (
                  <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${row.po_number ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500'}`}>
                    <td className="border border-gray-300 p-2 text-center font-bold text-green-700">
                      {row.po_total ? formatCurrency(Number(row.po_total)) : "-"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-bold text-green-700">
                      {row.po_price ? formatCurrency(Number(row.po_price)) : "-"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-green-700 font-semibold">{row.po_quantity || "-"}</td>
                    <td className="border border-gray-300 p-2 text-center text-green-700">
                      {row.po_date ? row.po_date.split('T')[0] : "-"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-bold text-blue-700">
                      {row.po_number || "-"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-semibold">{row.category || "ELEC"}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {row.res_date ? row.res_date.split('T')[0] : "-"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-bold text-red-600">
                      {row.customer_price ? formatCurrency(Number(row.customer_price)) : formatCurrency(Number(item.supplierPrice || 0))}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-semibold">{row.rfq_qty || item.quantity}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {row.rfq_date ? row.rfq_date.split('T')[0] : "-"}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-bold text-purple-700">
                      {row.rfq_number || item.requestNumber}
                    </td>
                    <td className="border border-gray-300 p-2 text-left max-w-xs truncate font-medium" title={row.description}>
                      {row.description || item.description}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-semibold text-blue-600">{row.part_no || item.partNumber || "-"}</td>
                    <td className="border border-gray-300 p-2 text-center font-bold text-blue-800">{row.line_item || item.lineItem}</td>
                    <td className="border border-gray-300 p-2 text-center">{row.uom || item.unit}</td>
                  </tr>
                ))
              ) : (
                /* صف RFQ الأساسي إذا لم توجد بيانات شاملة */
                <tr className="hover:bg-gray-50 bg-yellow-50">
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-center">{item.category || "ELEC"}</td>
                  <td className="border p-2 text-center">{item.expiryDate?.split('T')[0] || "-"}</td>
                  <td className="border p-2 text-center font-bold text-red-600">
                    {formatCurrency(Number(item.supplierPrice || 0))}
                  </td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-center">{item.requestDate?.split('T')[0] || "-"}</td>
                  <td className="border p-2 text-center font-bold text-purple-600">{item.requestNumber}</td>
                  <td className="border p-2 text-right max-w-xs truncate" title={item.description}>
                    {item.description}
                  </td>
                  <td className="border p-2 text-center">{item.partNumber || "-"}</td>
                  <td className="border p-2 text-center text-blue-600">{item.lineItem}</td>
                  <td className="border p-2 text-center">{item.unit}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* إضافة معلومات إضافية أسفل الجدول */}
        {comprehensiveData && comprehensiveData.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-b-lg border-t">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex gap-6">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  طلبات التسعير (RFQ)
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  أوامر الشراء (PO)
                </span>
              </div>
              <div className="text-gray-700 font-medium">
                إجمالي السجلات: {comprehensiveData.length} سجل
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ملخص سريع للبيانات */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">ملخص البيانات المرتبطة</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium">عدد عروض الموردين</p>
            <p className="text-2xl font-bold text-blue-600">
              {detailedPricing?.supplierPricings?.length || 1}
            </p>
          </div>
          <div className="text-center">
            <p className="font-medium">عدد أوامر الشراء</p>
            <p className="text-2xl font-bold text-purple-600">
              {detailedPricing?.purchaseOrders?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="font-medium">عدد تسعيرات العملاء</p>
            <p className="text-2xl font-bold text-green-600">
              {detailedPricing?.customerPricings?.length || 0}
            </p>
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
        title: "تم إضافة تسعير العميل بنجاح",
        description: `نسبة الربح: ${profitMargin.toFixed(2)}%`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/items-ready-for-customer-pricing"] });
      onSuccess();
      setFormData({ sellingPrice: "", quantity: item.quantity?.toString() || "1", notes: "" });
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة التسعير",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
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

      <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
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
                return (
                  <Collapsible
                    key={item.id}
                    open={isOpen}
                    onOpenChange={() => toggleItem(item.id)}
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
                      <ItemDetailedPricing item={item} />
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}