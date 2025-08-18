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
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DollarSign, ChevronDown, ChevronRight, Clock, Package, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

// Component to show detailed pricing info for an item
function ItemDetailedPricing({ item }: { item: any }) {
  const [detailedPricing, setDetailedPricing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);

  // Fetch comprehensive data using AI matching
  React.useEffect(() => {
    const fetchPricingData = async () => {
      if (!item?.id) {
        console.log('No item ID provided');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch comprehensive data with AI matching for all related items
        const comprehensiveResponse = await fetch(`/api/items/${item.id}/comprehensive-data`);
        
        if (!comprehensiveResponse.ok) {
          console.error(`❌ خطأ في API: ${comprehensiveResponse.status}`);
          return;
        }
        
        const comprehensiveData = await comprehensiveResponse.json();
        console.log(`📊 البيانات المستلمة من API:`, comprehensiveData);
        console.log(`🎯 LINE ITEM من API:`, comprehensiveData?.lineItem);
        
        setDetailedPricing(comprehensiveData);
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

      {/* RFQ Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" />
          معلومات طلب التسعير (RFQ)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">رقم طلب التسعير:</label>
            <p className="font-semibold text-blue-600">
              {item.requestNumber || item.systemRequestNumber || "غير محدد"}
            </p>
            {item.requestNumber && item.systemRequestNumber && item.requestNumber !== item.systemRequestNumber && (
              <p className="text-xs text-gray-500 mt-1">رقم النظام: {item.systemRequestNumber}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">تاريخ الطلب:</label>
            <p className="text-sm">
              {item.requestDate ? (() => {
                const date = new Date(item.requestDate);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                return `${year}/${day}/${month}`;
              })() : "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">تاريخ انتهاء العرض:</label>
            <p className="text-sm">
              {item.expiryDate ? (() => {
                const date = new Date(item.expiryDate);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                return `${year}/${day}/${month}`;
              })() : "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">الكمية المطلوبة:</label>
            <p className="font-semibold text-green-600">{item.quantity || 1}</p>
          </div>
        </div>
      </div>

      {/* معلومات البند الأساسية من API */}
      {detailedPricing && typeof detailedPricing === 'object' && !Array.isArray(detailedPricing) && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            تفاصيل البند الأساسية - مباشر من Google Sheets
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">معرف البند:</label>
              <p className="font-semibold text-blue-600">{detailedPricing.itemNumber || detailedPricing.itemId || "غير محدد"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">🎯 LINE ITEM:</label>
              <p className="font-mono text-purple-600 bg-purple-100 px-3 py-2 rounded-lg border-2 border-purple-300">
                <strong>
                  {detailedPricing?.lineItem && detailedPricing.lineItem.trim() !== '' 
                    ? detailedPricing.lineItem 
                    : "غير محدد"}
                </strong>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">رقم القطعة:</label>
              <p className="font-semibold text-green-600">{detailedPricing.partNumber || "غير محدد"}</p>
            </div>
            <div className="col-span-3">
              <label className="text-sm font-medium">الوصف:</label>
              <p className="text-sm">{detailedPricing.description || "غير محدد"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">الكمية:</label>
              <p className="font-semibold">{detailedPricing.quantity || "1"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">الوحدة:</label>
              <p className="font-semibold">{detailedPricing.uom || "EACH"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">رقم RFQ:</label>
              <p className="font-mono text-blue-600">{detailedPricing.rfqNumber || "غير محدد"}</p>
            </div>
          </div>
          
          {/* عرض البيانات الخام للتشخيص */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
            <h5 className="font-semibold text-blue-800 mb-2">تشخيص البيانات:</h5>
            <div className="text-sm space-y-1">
              <p><strong>نوع البيانات:</strong> {typeof detailedPricing}</p>
              <p><strong>هل البيانات array؟</strong> {Array.isArray(detailedPricing) ? 'نعم' : 'لا'}</p>
              <p><strong>LINE ITEM الخام:</strong> "{detailedPricing?.lineItem}"</p>
              <p><strong>طول LINE ITEM:</strong> {detailedPricing?.lineItem?.length || 0}</p>
              <p><strong>keys المتاحة:</strong> {Object.keys(detailedPricing || {}).join(', ')}</p>
            </div>
            <details className="mt-2">
              <summary className="text-sm text-gray-600 cursor-pointer">عرض البيانات الخام كاملة</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(detailedPricing, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* جدول البيانات التفصيلية للبند */}
      {detailedPricing && Array.isArray(detailedPricing) && detailedPricing.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            السجلات التفصيلية للبند {item.partNumber}
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            عرض تاريخ البند: {item.partNumber} - إجمالي ({detailedPricing?.length || 0} سجل من طلبات التسعير وأوامر الشراء
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> هذا الجدول يعرض جميع السجلات التاريخية للبند بما في ذلك تواريخ الطلبات وأوامر الشراء كما كانت في الشيت الأصلي
            </p>
          </div>
          
          <div className="overflow-auto max-h-96 border border-gray-300" style={{scrollbarWidth: 'thin'}}>
            <table className="w-full min-w-max text-xs border-collapse border border-gray-300">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">TOTAL PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">PRICE/PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[70px]">Quantity/PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">DATE/PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[100px]">PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[70px]">Category</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">RES.DATE</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">PRICE/RFQ</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[50px]">QTY</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">DATE/RFQ</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[120px]">RFQ</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[300px] max-w-[400px]">DESCRIPTION</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[120px]">PART NO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[100px]">LINE ITEM</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[60px]">UOM</th>
                </tr>
              </thead>
              <tbody>
                {detailedPricing
                  .map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 text-right">{record.po_total || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.po_price ? formatCurrency(parseFloat(record.po_price)) : '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.po_quantity || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.po_date ? (() => {
                      const date = new Date(record.po_date);
                      const year = date.getFullYear();
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const day = date.getDate().toString().padStart(2, '0');
                      return `${year}/${day}/${month}`;
                    })() : '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.po_number || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.category}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.res_date ? (() => {
                      const date = new Date(record.res_date);
                      const year = date.getFullYear();
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const day = date.getDate().toString().padStart(2, '0');
                      return `${year}/${day}/${month}`;
                    })() : '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.rfq_price ? formatCurrency(parseFloat(record.rfq_price)) : '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.rfq_quantity || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.rfq_date ? (() => {
                      const date = new Date(record.rfq_date);
                      const year = date.getFullYear();
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const day = date.getDate().toString().padStart(2, '0');
                      return `${year}/${day}/${month}`;
                    })() : '-'}</td>
                    <td className="border border-gray-300 p-2 text-right text-blue-600 font-medium">{record.rfq_number || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right break-words" style={{wordWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.4'}}>
                      <div className="max-w-[400px]" title={record.description}>
                        {record.description}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-purple-600 font-medium break-words">
                      <div className="max-w-[120px]" title={record.partNumber || record.part_number}>
                        {record.partNumber || record.part_number || '-'}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-mono text-blue-600">{record.lineItem || record.line_item || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.uom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <h5 className="font-medium text-blue-800">طلبات التسعير (RFQ)</h5>
              <p className="text-lg font-bold text-blue-600">
                {detailedPricing.filter((r: any) => r.rfq_number).length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h5 className="font-medium text-green-800">أوامر الشراء (PO)</h5>
              <p className="text-lg font-bold text-green-600">
                {detailedPricing.filter((r: any) => r.po_number).length}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">
            إجمالي السجلات: {detailedPricing.length} سجل
          </p>
        </div>
      )}

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

                return (
                  <Collapsible
                    key={item.id}
                    open={isOpen}
                    onOpenChange={() => {

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
                              معرف البند: {item.itemNumber || "غير محدد"} | رقم القطعة: {item.partNumber || "غير محدد"} | الوحدة: {item.uom || "غير محدد"}
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