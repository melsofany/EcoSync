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
import { ChevronDown, ChevronRight, Clock, Package, AlertCircle, DollarSign, Calculator } from "lucide-react";
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
        const response = await fetch(`/api/items/${item.id}/detailed-pricing`, {
          credentials: 'include'
        });
        const data = await response.json();
        setDetailedPricing(data);

        // Also fetch comprehensive data with cache busting
        const comprehensiveResponse = await fetch(`/api/items/${item.id}/comprehensive-data?t=${Date.now()}`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const comprehensiveResult = await comprehensiveResponse.json();
        console.log('Comprehensive data received:', comprehensiveResult);
        console.log('allDataRows:', comprehensiveResult.allDataRows);
        
        // Check if allDataRows exists, otherwise use single row
        if (comprehensiveResult.allDataRows && comprehensiveResult.allDataRows.length > 0) {
          console.log('Setting comprehensiveData with allDataRows, count:', comprehensiveResult.allDataRows.length);
          setComprehensiveData(comprehensiveResult.allDataRows);
        } else if (comprehensiveResult.lineItem) {
          // Single row backwards compatibility
          console.log('Setting comprehensiveData with single row');
          setComprehensiveData([comprehensiveResult]);
        } else {
          console.log('No data found, setting empty array');
          setComprehensiveData([]);
        }
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
          <div className="text-center">
            <label className="font-medium block">LINE ITEM:</label>
            <p className="text-purple-700 font-mono font-bold" dir="ltr">
              {comprehensiveData?.lineItem || item.lineItem || ""}
            </p>
          </div>
          <div>
            <label className="font-medium">PART NO:</label>
            <p className="text-blue-600">{comprehensiveData?.partNumber || item.partNumber || ""}</p>
          </div>
          <div>
            <label className="font-medium">الوحدة:</label>
            <p className="text-blue-600">{comprehensiveData?.uom || item.uom || item.unit || "EACH"}</p>
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
            <p className="text-yellow-700 font-bold">{comprehensiveData?.rfqNumber || item.requestNumber || ""}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ الطلب:</label>
            <p className="text-yellow-700">{comprehensiveData?.requestDate || item.requestDate || ""}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ انتهاء العرض:</label>
            <p className="text-yellow-700">{comprehensiveData?.expiryDate || item.expiryDate || ""}</p>
          </div>
          <div>
            <label className="font-medium">الكمية المطلوبة:</label>
            <p className="text-yellow-700 font-bold">{comprehensiveData?.quantity || item.quantity || ""}</p>
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
              {formatCurrency(Number(comprehensiveData?.supplierUnitPrice || item.supplierPrice || 0))}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">المورد:</label>
            <p className="text-sm">{comprehensiveData?.supplierName || item.supplierName || ""}</p>
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
              item={{
                ...item,
                supplierPrice: comprehensiveData?.supplierUnitPrice || item.supplierPrice
              }} 
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

      {/* جدول بيانات بتصميم حديث */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
          <h4 className="font-semibold text-white text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            جدول البيانات التفصيلية للبند
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800 sticky left-0 bg-gray-50 z-10">معرف البند</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">UOM</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">LINE ITEM</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">PART NO</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">DESCRIPTION</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">RFQ</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">DATE/RFQ</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">QTY</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">PRICE RFQ</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">RES. DATE</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">PO</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">DATE/PO</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">Quantity/PO</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">PRICE/PO</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">TOTAL PO</th>
                <th className="border-b-2 border-r border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">العميل</th>
                <th className="border-b-2 border-gray-300 px-2 py-3 text-center font-semibold text-gray-800">الموظف المسؤول</th>
              </tr>
            </thead>
            <tbody>
              {/* عرض البيانات الشاملة من قاعدة البيانات */}
              {comprehensiveData && comprehensiveData.length > 0 ? (
                comprehensiveData.map((row: any, index: number) => (
                  <tr key={index} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-semibold text-blue-700 sticky left-0 bg-white z-10">
                      {item.itemNumber || "P-0000016"}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center text-gray-700">{row.uom || item.uom || item.unit || "EACH"}</td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-medium text-blue-600">{row.line_item || item.lineItem || ""}</td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center text-gray-700">{row.part_no || item.partNumber || "-"}</td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-right text-gray-900" title={row.description}>
                      {row.description || item.description}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-medium text-purple-600">
                      {row.rfq_number || item.requestNumber}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center text-gray-700">
                      {row.rfq_date ? row.rfq_date.split('T')[0] : "-"}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-semibold text-gray-900">{row.rfq_qty || item.quantity}</td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-bold text-green-600">
                      {row.customer_price ? formatCurrency(Number(row.customer_price)) : formatCurrency(Number(item.supplierPrice || 0))}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center text-gray-700">
                      {row.res_date ? row.res_date.split('T')[0] : "-"}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-medium text-blue-600">
                      {row.po_number || "-"}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center text-gray-700">
                      {row.po_date ? row.po_date.split('T')[0] : "-"}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center text-gray-900">{row.po_quantity || "-"}</td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-semibold text-gray-900">
                      {row.po_price ? formatCurrency(Number(row.po_price)) : "-"}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-bold text-green-700">
                      {row.po_total ? formatCurrency(Number(row.po_total)) : "-"}
                    </td>
                    <td className="border-b border-r border-gray-200 px-2 py-2 text-center text-gray-800 font-medium">{row.client_name || item.clientName || "-"}</td>
                    <td className="border-b border-gray-200 px-2 py-2 text-center text-gray-800">{row.employee_name || item.employeeName || "-"}</td>
                  </tr>
                ))
              ) : (
                /* صف RFQ الأساسي إذا لم توجد بيانات شاملة */
                <tr className="hover:bg-blue-50 transition-colors bg-white">
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-semibold text-blue-700 sticky left-0 bg-white z-10">
                    {item.itemNumber || "P-0000016"}
                  </td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">{item.uom || item.unit || "EACH"}</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-medium text-blue-600">{item.lineItem || ""}</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">{item.partNumber || "-"}</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-right" title={item.description}>
                    {item.description}
                  </td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-medium text-purple-600">{item.requestNumber}</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">{item.requestDate?.split('T')[0] || "-"}</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-semibold">{item.quantity}</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-bold text-green-600">
                    {formatCurrency(Number(item.supplierPrice || 0))}
                  </td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">{item.expiryDate?.split('T')[0] || "-"}</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">-</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">-</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">-</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">-</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center">-</td>
                  <td className="border-b border-r border-gray-200 px-2 py-2 text-center font-medium">{item.clientName || "-"}</td>
                  <td className="border-b border-gray-200 px-2 py-2 text-center">{item.employeeName || "-"}</td>
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
    supplierPrice: item.supplierPrice?.toString() || "",
    sellingPrice: "",
    quantity: item.quantity?.toString() || "1",
    notes: "",
  });
  const [profitMargin, setProfitMargin] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate profit margin and total based on updated supplier price
  React.useEffect(() => {
    const supplierPrice = Number(formData.supplierPrice) || Number(item.supplierPrice || 0);
    const sellingPrice = Number(formData.sellingPrice) || 0;
    const quantity = Number(formData.quantity) || 1;

    if (supplierPrice > 0 && sellingPrice > 0) {
      const margin = ((sellingPrice - supplierPrice) / supplierPrice) * 100;
      setProfitMargin(Number(margin.toFixed(2)));
    } else {
      setProfitMargin(0);
    }

    setTotalAmount(sellingPrice * quantity);
  }, [formData.supplierPrice, formData.sellingPrice, formData.quantity, item.supplierPrice]);

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
        credentials: 'include',
        body: JSON.stringify({
          itemId: item.id,
          quotationId: item.quotationId,
          costPrice: Number(formData.supplierPrice) || Number(item.supplierPrice || 0),
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
      setFormData({ 
        supplierPrice: item.supplierPrice?.toString() || "",
        sellingPrice: "", 
        quantity: item.quantity?.toString() || "1", 
        notes: "" 
      });
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
          <label className="text-sm font-medium text-blue-700 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            سعر المورد (التكلفة) *
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.supplierPrice || ""}
            onChange={(e) => setFormData(prev => ({...prev, supplierPrice: e.target.value}))}
            placeholder="0.00"
            className="border-blue-300 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">السعر الأساسي من المورد</p>
        </div>
        <div>
          <label className="text-sm font-medium text-green-700 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            سعر البيع للعميل *
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) => setFormData(prev => ({...prev, sellingPrice: e.target.value}))}
            placeholder="0.00"
            className="border-green-300 focus:border-green-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">السعر النهائي للعميل</p>
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
            className="border-purple-300 focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">عدد الوحدات المطلوبة</p>
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
            {formatCurrency((Number(formData.sellingPrice) - (Number(formData.supplierPrice) || Number(item.supplierPrice || 0))) * Number(formData.quantity))}
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
  const itemsArray = Array.isArray(itemsNeedingPricing) 
    ? itemsNeedingPricing.sort((a: any, b: any) => {
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
                مرتبة حسب الأقرب للانتهاء - اضغط على أي بند لعرض تفاصيله وإضافة تسعير العميل
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
                          {(() => {
                            const daysRemaining = getDaysRemaining(item.expiryDate);
                            return (
                              <div className="flex gap-2">
                                <Badge variant={getExpiryBadgeColor(daysRemaining)} className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  {daysRemaining === null ? "بدون تاريخ انتهاء" :
                                   daysRemaining < 0 ? `منتهي منذ ${Math.abs(daysRemaining)} يوم` :
                                   daysRemaining === 0 ? "ينتهي اليوم" :
                                   daysRemaining === 1 ? "ينتهي غداً" :
                                   `${daysRemaining} يوم متبقي`}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  في انتظار التسعير
                                </Badge>
                              </div>
                            );
                          })()}
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