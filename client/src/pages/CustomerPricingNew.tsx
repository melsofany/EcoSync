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
import { ChevronDown, ChevronRight, Clock, Package, AlertCircle, DollarSign, Calculator, Search, CalendarClock, FileText, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

// Component to show detailed pricing info for an item
function ItemDetailedPricing({ item, onItemPriced }: { item: any; onItemPriced: () => void }) {
  const [detailedPricing, setDetailedPricing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);

  // State for comprehensive data
  const [comprehensiveData, setComprehensiveData] = useState<any[]>([]);
  
  // Log comprehensive data whenever it changes
  React.useEffect(() => {
    if (comprehensiveData && comprehensiveData.length > 0) {
      console.log('📊 Current comprehensiveData state:', comprehensiveData);
      console.log('📊 First row supplier info:', {
        supplier_name: comprehensiveData[0]?.supplier_name,
        supplier_contact: comprehensiveData[0]?.supplier_contact,
        supplier_phone: comprehensiveData[0]?.supplier_phone
      });
    }
  }, [comprehensiveData]);

  // Fetch detailed pricing when component mounts
  React.useEffect(() => {
    const fetchDetailedPricing = async () => {
      if (!item?.id && !item?.itemNumber) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/items/${item.id}/detailed-pricing`, {
          credentials: 'include'
        });
        const data = await response.json();
        console.log('detailedPricing data:', data);
        setDetailedPricing(data);

        // Also fetch comprehensive data with cache busting - use itemNumber not id
        const itemNumberToUse = item.itemNumber || item.id;
        console.log('🔍 Fetching comprehensive data for:', itemNumberToUse);
        const comprehensiveResponse = await fetch(`/api/items/${itemNumberToUse}/comprehensive-data?t=${Date.now()}`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const comprehensiveResult = await comprehensiveResponse.json();
        console.log('Comprehensive data received:', comprehensiveResult);
        console.log('allDataRows:', comprehensiveResult.allDataRows);
        console.log('allDataRows length:', comprehensiveResult.allDataRows ? comprehensiveResult.allDataRows.length : 0);
        
        // Check if allDataRows exists, otherwise use single row
        if (comprehensiveResult.allDataRows && comprehensiveResult.allDataRows.length > 0) {
          console.log('Setting comprehensiveData with allDataRows, count:', comprehensiveResult.allDataRows.length);
          console.log('First row data:', comprehensiveResult.allDataRows[0]);
          console.log('🔍 Supplier data from first row:', {
            supplier_name: comprehensiveResult.allDataRows[0].supplier_name,
            supplier_contact: comprehensiveResult.allDataRows[0].supplier_contact,
            supplier_phone: comprehensiveResult.allDataRows[0].supplier_phone,
            supplier_email: comprehensiveResult.allDataRows[0].supplier_email,
            supplier_address: comprehensiveResult.allDataRows[0].supplier_address,
          });
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
  }, [item?.id, item?.itemNumber]);


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
              {detailedPricing?.lineItem || (comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[0].line_item : "") || item.lineItem || ""}
            </p>
          </div>
          <div>
            <label className="font-medium">PART NO:</label>
            <p className="text-blue-600">{detailedPricing?.partNumber || item.partNumber || ""}</p>
          </div>
          <div>
            <label className="font-medium">الوحدة:</label>
            <p className="text-blue-600">{detailedPricing?.uom || item.uom || item.unit || "EACH"}</p>
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
            <p className="text-yellow-700 font-bold">{detailedPricing?.rfqNumber || item.requestNumber || ""}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ الطلب:</label>
            <p className="text-yellow-700">{detailedPricing?.requestDate || item.requestDate || ""}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ انتهاء العرض:</label>
            <p className="text-yellow-700">{detailedPricing?.expiryDate || item.expiryDate || ""}</p>
          </div>
          <div>
            <label className="font-medium">الكمية المطلوبة:</label>
            <p className="text-yellow-700 font-bold">{detailedPricing?.quantity || item.quantity || ""}</p>
          </div>
        </div>
      </div>

      {/* معلومات المورد الكاملة */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          معلومات التسعير الحالي
        </h4>
        
        {/* التحقق من وجود بيانات المورد */}
        {!item.supplierPrice && !comprehensiveData?.[0]?.supplier_name && !comprehensiveData?.[0]?.supplier_price && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-semibold text-center text-lg">
              ⚠️ لم يتم إدخال تسعير المورد لهذا البند بعد
            </p>
            <p className="text-yellow-700 text-center mt-2">
              يرجى الذهاب إلى صفحة "تسعير الموردين" وإدخال بيانات المورد أولاً قبل تسعير العميل
            </p>
          </div>
        )}
        
        {/* معلومات المورد الأساسية */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">اسم المورد</label>
            <p className="text-sm font-semibold text-gray-900">
              {comprehensiveData?.[0]?.supplier_name || 
               detailedPricing?.supplierName || 
               item.supplierName || 
               "غير محدد"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">المسؤول عند المورد</label>
            <p className="text-sm font-semibold text-indigo-600">
              {comprehensiveData?.[0]?.supplier_contact || 
               detailedPricing?.supplierContactPerson || 
               item.supplierContactPerson || 
               item.supplierContact ||
               "غير محدد"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">رقم الهاتف</label>
            <p className="text-sm font-medium text-gray-900" dir="ltr">
              {comprehensiveData?.[0]?.supplier_phone || 
               detailedPricing?.supplierPhone || 
               item.supplierPhone ||
               "غير متوفر"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">البريد الإلكتروني</label>
            <p className="text-sm font-medium text-gray-900">
              {comprehensiveData?.[0]?.supplier_email || 
               detailedPricing?.supplierEmail || 
               item.supplierEmail ||
               "غير متوفر"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">العنوان</label>
            <p className="text-sm font-medium text-gray-900">
              {comprehensiveData?.[0]?.supplier_address || 
               detailedPricing?.supplierAddress || 
               item.supplierAddress ||
               "غير متوفر"}
            </p>
          </div>
        </div>
        
        {/* معلومات التسعير والضرائب */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">سعر المورد الأساسي</label>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(Number(comprehensiveData?.[0]?.supplier_price || detailedPricing?.supplierPrice || item.supplierPrice || 0))}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">حالة الضريبة</label>
            <p className="text-sm font-semibold text-blue-600">
              {comprehensiveData?.[0]?.price_with_vat || 
               detailedPricing?.priceWithVat || 
               item.priceWithVat || 
               "غير محدد"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">نسبة الضريبة</label>
            <p className="text-sm font-semibold text-blue-600">
              {comprehensiveData?.[0]?.vat_rate || 
               detailedPricing?.vatRate || 
               item.vatRate || 
               "0"}%
            </p>
          </div>
        </div>
        
        {/* شروط التوريد */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">شروط الدفع</label>
            <p className="text-sm font-medium text-gray-900">
              {comprehensiveData?.[0]?.payment_terms || 
               detailedPricing?.paymentTerms || 
               item.paymentTerms ||
               "غير محدد"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">مدة التسليم</label>
            <p className="text-sm font-medium text-gray-900">
              {comprehensiveData?.[0]?.delivery_period || 
               detailedPricing?.deliveryPeriod || 
               item.deliveryPeriod ||
               "غير محدد"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">مدة الضمان</label>
            <p className="text-sm font-medium text-gray-900">
              {comprehensiveData?.[0]?.warranty_period || 
               detailedPricing?.warrantyPeriod || 
               item.warrantyPeriod ||
               "غير محدد"}
            </p>
          </div>
        </div>
        
        {/* ملاحظات المورد */}
        {(comprehensiveData?.[0]?.notes || detailedPricing?.notes || item.notes) && (
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-medium text-gray-600 block mb-1">ملاحظات المورد</label>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {comprehensiveData?.[0]?.notes || detailedPricing?.notes || item.notes}
            </p>
          </div>
        )}
      </div>

      {/* معلومات تسعير العميل إن وجدت */}
      {(item.customerPrice || comprehensiveData?.[0]?.customer_price) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            تسعير العميل الحالي
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="text-xs font-medium text-gray-600 block mb-1">سعر البيع للعميل</label>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(Number(comprehensiveData?.[0]?.customer_price || item.customerPrice || 0))}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="text-xs font-medium text-gray-600 block mb-1">هامش الربح</label>
              <p className="text-sm font-semibold text-green-600">
                {(() => {
                  const supplierPrice = Number(comprehensiveData?.[0]?.supplier_price || item.supplierPrice || 0);
                  const customerPrice = Number(comprehensiveData?.[0]?.customer_price || item.customerPrice || 0);
                  const profit = supplierPrice > 0 ? ((customerPrice - supplierPrice) / supplierPrice * 100).toFixed(2) : 0;
                  return `${profit}%`;
                })()}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="text-xs font-medium text-gray-600 block mb-1">إجمالي القيمة</label>
              <p className="text-sm font-semibold text-blue-600">
                {formatCurrency(Number(comprehensiveData?.[0]?.customer_price || item.customerPrice || 0) * Number(item.quantity || 1))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* جدول البيانات التفصيلية الشاملة */}
      {comprehensiveData && comprehensiveData.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            السجلات التفصيلية للبند {item.itemNumber}
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            عرض تاريخ البند: {item.partNumber || item.itemNumber} - إجمالي ({comprehensiveData.length} سجل) من طلبات التسعير وأوامر الشراء
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
                  <th className="border border-gray-300 p-2 text-right min-w-[60px]">UOM</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[100px]">LINE ITEM</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[120px]">PART NO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[300px] max-w-[400px]">DESCRIPTION</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[120px]">RFQ</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">DATE/RFQ</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[50px]">QTY</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">PRICE/RFQ</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">RES.DATE</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[70px]">Category</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[100px]">PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">DATE/PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[70px]">Quantity/PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">PRICE/PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">TOTAL PO</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[80px]">سعر المورد</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[100px]">الهاتف</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[100px]">جهة الاتصال</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[120px]">المورد</th>
                  <th className="border border-gray-300 p-2 text-right min-w-[40px]">#</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveData.map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 text-right">{record.uom || item.uom || 'EACH'}</td>
                    <td className="border border-gray-300 p-2 text-right font-mono text-blue-600">
                      {record.line_item || '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-purple-600 font-medium break-words">
                      <div className="max-w-[120px]" title={record.part_no || item.partNumber}>
                        {record.part_no || item.partNumber || '-'}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-right break-words" style={{wordWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.4'}}>
                      <div className="max-w-[400px]" title={record.description || item.description}>
                        {record.description || item.description || '-'}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-blue-600 font-medium">{record.rfq_number || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.rfq_date || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.rfq_qty || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">
                      {record.customer_price ? formatCurrency(Number(record.customer_price)) : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">{record.res_date || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.category || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right text-purple-600 font-medium">{record.po_number || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.po_date || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.po_quantity || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">
                      {record.po_price ? formatCurrency(Number(record.po_price)) : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {record.po_total ? formatCurrency(Number(record.po_total)) : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-green-600">
                      {record.supplier_price ? formatCurrency(Number(record.supplier_price)) : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">{record.supplier_phone || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">{record.supplier_contact || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right font-semibold">{record.supplier_name || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <h5 className="font-medium text-blue-800">طلبات التسعير (RFQ)</h5>
              <p className="text-lg font-bold text-blue-600">
                {comprehensiveData.filter((r: any) => r.rfq_number).length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h5 className="font-medium text-green-800">أوامر الشراء (PO)</h5>
              <p className="text-lg font-bold text-green-600">
                {comprehensiveData.filter((r: any) => r.po_number).length}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">
            إجمالي السجلات: {comprehensiveData.length} سجل
          </p>
        </div>
      )}

      {/* Customer pricing form */}
      {showPricingForm ? (
        <CustomerPricingForm item={item} onSuccess={() => {
          setShowPricingForm(false);
          onItemPriced();
        }} />
      ) : (
        <Button 
          onClick={() => setShowPricingForm(true)}
          className="w-full"
          size="lg"
        >
          <DollarSign className="ml-2 h-5 w-5" />
          تحديد سعر العميل
        </Button>
      )}
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
      const response = await fetch("/api/customer-pricing-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          itemNumber: item.itemNumber || item.id,
          rfqNumber: item.requestNumber || item.rfqNumber,
          customerPrice: formData.sellingPrice,
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
    } catch (error) {
      console.error("Error submitting pricing:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ تسعير العميل",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">سعر المورد (EGP)</label>
          <Input
            type="number"
            value={formData.supplierPrice}
            onChange={(e) => setFormData({ ...formData, supplierPrice: e.target.value })}
            placeholder="سعر المورد"
            min="0"
            step="0.01"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">سعر البيع للعميل (EGP)</label>
          <Input
            type="number"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            placeholder="سعر البيع"
            min="0"
            step="0.01"
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">الكمية</label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            min="1"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">هامش الربح</label>
          <div className={`mt-1 p-2 bg-gray-100 rounded ${profitMargin > 0 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
            {profitMargin.toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">ملاحظات</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="أي ملاحظات إضافية..."
          className="mt-1"
          rows={3}
        />
      </div>
      
      <div className="bg-blue-50 p-3 rounded">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">الإجمالي</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
        </div>
      </div>
      
      <Button type="submit" className="w-full" size="lg">
        حفظ التسعير
      </Button>
    </form>
  );
}

export default function CustomerPricingNew() {
  const [expandedRFQs, setExpandedRFQs] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [pricedItems, setPricedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/items-ready-for-customer-pricing"],
  });

  // حساب المدة المتبقية لإغلاق الطلب
  const calculateRemainingTime = (expiryDate: string) => {
    if (!expiryDate) return { days: 999, text: "غير محدد", isUrgent: false };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { days: -1, text: "منتهي", isUrgent: true, isExpired: true };
    } else if (diffDays === 0) {
      return { days: 0, text: "اليوم", isUrgent: true };
    } else if (diffDays === 1) {
      return { days: 1, text: "غداً", isUrgent: true };
    } else if (diffDays <= 3) {
      return { days: diffDays, text: `${diffDays} أيام`, isUrgent: true };
    } else if (diffDays <= 7) {
      return { days: diffDays, text: `${diffDays} أيام`, isUrgent: false };
    } else {
      return { days: diffDays, text: `${diffDays} يوم`, isUrgent: false };
    }
  };

  // حساب البنود النشطة فقط (غير المنتهية)
  const activeItems = React.useMemo(() => {
    return items.filter(item => {
      const remaining = calculateRemainingTime(item.expiryDate);
      return !remaining.isExpired;
    });
  }, [items]);

  // تجميع البنود حسب RFQ
  const groupedByRFQ = React.useMemo(() => {
    const groups: Record<string, any> = {};
    
    activeItems.forEach((item) => {
      const rfqNumber = item.requestNumber || item.rfqNumber || "بدون طلب";
      if (!groups[rfqNumber]) {
        groups[rfqNumber] = {
          rfqNumber,
          requestDate: item.requestDate,
          expiryDate: item.expiryDate,
          items: [],
          totalItems: 0,
          pricedItems: 0,
          remaining: calculateRemainingTime(item.expiryDate)
        };
      }
      groups[rfqNumber].items.push(item);
      groups[rfqNumber].totalItems++;
      if (item.customerPrice || pricedItems.has(item.id)) {
        groups[rfqNumber].pricedItems++;
      }
    });

    // ترتيب الطلبات حسب المدة المتبقية (الأقرب للانتهاء أولاً)
    return Object.values(groups).sort((a, b) => a.remaining.days - b.remaining.days);
  }, [activeItems, pricedItems]);

  // فلترة الطلبات حسب البحث
  const filteredRFQs = React.useMemo(() => {
    if (!searchQuery) return groupedByRFQ;
    
    return groupedByRFQ.filter(rfq => 
      rfq.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.items.some((item: any) => 
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [groupedByRFQ, searchQuery]);

  const toggleRFQExpanded = (rfqNumber: string) => {
    const newExpanded = new Set(expandedRFQs);
    if (newExpanded.has(rfqNumber)) {
      newExpanded.delete(rfqNumber);
    } else {
      newExpanded.add(rfqNumber);
    }
    setExpandedRFQs(newExpanded);
  };

  const toggleItemExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemPriced = (itemId: string) => {
    setPricedItems(prev => new Set(prev).add(itemId));
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">جاري التحميل...</div>;
  }
  
  const totalItems = activeItems.length;
  const pricedCount = activeItems.filter(item => item.customerPrice || pricedItems.has(item.id)).length;
  const progressPercentage = totalItems > 0 ? (pricedCount / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تسعير العملاء</h1>
        <p className="text-muted-foreground">
          إدارة وتحديد أسعار البيع للعملاء
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="البحث عن طلب تسعير برقم الطلب أو وصف البند..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            التقدم في التسعير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>البنود المسعرة</span>
              <span className="font-semibold">{pricedCount} من {totalItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {progressPercentage.toFixed(1)}% مكتمل
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              إجمالي الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRFQs.length}</div>
            <p className="text-xs text-muted-foreground">طلب تسعير</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              إجمالي البنود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">بند للتسعير</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              تم التسعير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pricedCount}</div>
            <p className="text-xs text-muted-foreground">بند مسعر</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              بانتظار التسعير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalItems - pricedCount}</div>
            <p className="text-xs text-muted-foreground">بند متبقي</p>
          </CardContent>
        </Card>
      </div>

      {/* RFQs List */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات التسعير</CardTitle>
          <CardDescription>
            {filteredRFQs.length === 0 ? "لا توجد طلبات تسعير" : `${filteredRFQs.length} طلب تسعير`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredRFQs.map((rfq) => (
            <Collapsible key={rfq.rfqNumber} open={expandedRFQs.has(rfq.rfqNumber)}>
              <Card className={`border transition-all ${
                rfq.remaining.isExpired ? 'border-red-300 bg-red-50' :
                rfq.remaining.isUrgent ? 'border-orange-300 bg-orange-50' :
                'border-gray-200'
              }`}>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleRFQExpanded(rfq.rfqNumber)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {expandedRFQs.has(rfq.rfqNumber) ? 
                          <ChevronDown className="h-5 w-5 text-muted-foreground" /> : 
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        }
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">{rfq.rfqNumber}</span>
                            {rfq.remaining.isExpired ? (
                              <Badge className="bg-red-600">منتهي</Badge>
                            ) : rfq.remaining.isUrgent ? (
                              <Badge className="bg-orange-600">عاجل - {rfq.remaining.text}</Badge>
                            ) : (
                              <Badge variant="secondary">متبقي {rfq.remaining.text}</Badge>
                            )}
                            <Badge variant="outline" className="bg-blue-50">
                              {rfq.totalItems} بند
                            </Badge>
                            {rfq.pricedItems > 0 && (
                              <Badge className="bg-green-600">
                                {rfq.pricedItems} مسعر
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              تاريخ الطلب: {rfq.requestDate || "غير محدد"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ينتهي: {rfq.expiryDate || "غير محدد"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">التقدم</div>
                        <div className="text-lg font-semibold">
                          {rfq.totalItems > 0 ? Math.round((rfq.pricedItems / rfq.totalItems) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* قائمة البنود داخل الطلب */}
                    {rfq.items.map((item: any) => (
                      <Collapsible key={item.id} open={expandedItems.has(item.id)}>
                        <Card className={`border transition-all ${pricedItems.has(item.id) ? 'bg-green-50 border-green-300' : ''}`}>
                          <CollapsibleTrigger asChild>
                            <CardHeader 
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleItemExpanded(item.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {expandedItems.has(item.id) ? 
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  }
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-semibold">{item.itemNumber}</span>
                                      {item.lineItem && (
                                        <Badge variant="outline" className="bg-blue-50">
                                          {item.lineItem}
                                        </Badge>
                                      )}
                                      {pricedItems.has(item.id) && (
                                        <Badge className="bg-purple-600">مُسعّر حديثاً</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">الكمية</p>
                                    <p className="font-medium">{item.quantity} {item.uom || item.unit}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">سعر المورد</p>
                                    <p className="font-semibold text-green-600">
                                      {formatCurrency(Number(item.supplierPrice || 0))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <ItemDetailedPricing 
                                item={item} 
                                onItemPriced={() => handleItemPriced(item.id)}
                              />
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}