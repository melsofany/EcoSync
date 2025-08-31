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
function ItemDetailedPricing({ item, onItemPriced }: { item: any; onItemPriced: () => void }) {
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
        console.log('detailedPricing data:', data);
        setDetailedPricing(data);

        // Also fetch comprehensive data with cache busting
        const comprehensiveResponse = await fetch(`/api/items/${item.id}/comprehensive-data?t=${Date.now()}`, {
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

  // Debug log for comprehensiveData
  React.useEffect(() => {
    console.log('comprehensiveData state updated:', comprehensiveData);
    console.log('comprehensiveData length:', comprehensiveData.length);
    if (comprehensiveData.length > 0) {
      console.log('First row in state:', comprehensiveData[0]);
      console.log('supplier_contact value:', comprehensiveData[0].supplier_contact);
    }
  }, [comprehensiveData]);

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
        
        {/* معلومات المورد الأساسية */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium">اسم المورد:</label>
            <p className="text-sm font-semibold">
              {(comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[0].supplier_name) || 
               detailedPricing?.supplierName || 
               item.supplierName || 
               "غير محدد"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">المسؤول عند المورد:</label>
            <p className="text-sm font-semibold text-indigo-600">
              {(comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[0].supplier_contact) || 
               detailedPricing?.supplierContactPerson || 
               item.supplierContactPerson || 
               "غير محدد"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium">رقم الهاتف:</label>
            <p className="text-sm" dir="ltr">
              {(comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[0].supplier_phone) || 
               detailedPricing?.supplierPhone || 
               item.supplierPhone || 
               "غير متوفر"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">البريد الإلكتروني:</label>
            <p className="text-sm">
              {(comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[0].supplier_email) || 
               detailedPricing?.supplierEmail || 
               item.supplierEmail || 
               "غير متوفر"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">العنوان:</label>
            <p className="text-sm">
              {(comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[0].supplier_address) || 
               detailedPricing?.supplierAddress || 
               item.supplierAddress || 
               "غير متوفر"}
            </p>
          </div>
        </div>

        {/* معلومات التسعير والضريبة */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white rounded-lg">
          <div className="text-center border-l">
            <label className="text-sm font-medium block mb-1">سعر الوحدة (بدون ضريبة)</label>
            <p className="font-bold text-green-600 text-lg">
              {formatCurrency(Number(detailedPricing?.supplierUnitPrice || item.supplierPrice || 0))}
            </p>
          </div>
          <div className="text-center border-l">
            <label className="text-sm font-medium block mb-1">قيمة الضريبة</label>
            <p className="font-bold text-blue-600 text-lg">
              {(() => {
                const basePrice = Number(detailedPricing?.supplierUnitPrice || item.supplierPrice || 0);
                const vatRate = Number(detailedPricing?.vatRate || item.vatRate || 14) / 100;
                const vatAmount = basePrice * vatRate;
                return formatCurrency(vatAmount);
              })()}
            </p>
            <p className="text-xs text-gray-600">
              {detailedPricing?.vatRate || item.vatRate || "14"}% ضريبة
            </p>
          </div>
          <div className="text-center">
            <label className="text-sm font-medium block mb-1">الشخص المسؤول</label>
            <p className="font-bold text-purple-700 text-lg">
              {(comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[0].responsible_employee) || detailedPricing?.responsibleEmployee || detailedPricing?.employeeName || item.employeeName || "غير محدد"}
            </p>
            <p className="text-xs text-gray-600">
              الموظف المسؤول عن التسعير
            </p>
          </div>
        </div>

        {/* الشروط والأحكام */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-xs font-medium text-gray-600">شروط الدفع:</label>
            <p className="text-sm font-medium">{detailedPricing?.paymentTerms || item.paymentTerms || "نقداً عند التسليم"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">مدة التوريد:</label>
            <p className="text-sm font-medium">{detailedPricing?.deliveryTime || item.deliveryTime || "فوري"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">فترة الضمان:</label>
            <p className="text-sm font-medium">{detailedPricing?.warrantyPeriod || item.warrantyPeriod || "غير محدد"}</p>
          </div>
        </div>

        {/* ملاحظات إضافية */}
        {(detailedPricing?.supplierNotes || item.supplierNotes) && (
          <div className="mt-3 p-2 bg-yellow-50 rounded">
            <label className="text-xs font-medium text-gray-600">ملاحظات المورد:</label>
            <p className="text-sm mt-1">{detailedPricing?.supplierNotes || item.supplierNotes}</p>
          </div>
        )}
        
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
                supplierPrice: (comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[0].supplier_unit_price) || detailedPricing?.supplierUnitPrice || item.supplierPrice
              }} 
              onSuccess={() => {
                setShowPricingForm(false);
                onItemPriced(); // Call the parent callback
              }} 
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
            placeholder="الكمية"
            min="1"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <span className="text-sm text-gray-600">نسبة الربح</span>
          <p className={`text-lg font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitMargin.toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <span className="text-sm text-gray-600">الإجمالي</span>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="text-center">
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
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="أي ملاحظات إضافية..."
          className="mt-1"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          <DollarSign className="h-4 w-4 ml-2" />
          حفظ التسعير
        </Button>
      </div>
    </form>
  );
}

export default function CustomerPricingNew() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [pricedItems, setPricedItems] = useState<Set<string>>(new Set());
  
  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/items-ready-for-customer-pricing"],
  });

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

  const totalItems = items.length;
  const pricedCount = pricedItems.size;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">إجمالي البنود</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">بنود تحتاج تسعير</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">تم التسعير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pricedCount}</div>
            <p className="text-xs text-muted-foreground">بنود مسعرة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">بانتظار التسعير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalItems - pricedCount}</div>
            <p className="text-xs text-muted-foreground">بنود متبقية</p>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>البنود الجاهزة للتسعير</CardTitle>
          <CardDescription>
            {items.length === 0 ? "لا توجد بنود جاهزة للتسعير حالياً" : `${items.length} بند جاهز للتسعير`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
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
                          <ChevronDown className="h-5 w-5 text-muted-foreground" /> : 
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        }
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-base">{item.itemNumber}</span>
                            {item.lineItem && (
                              <Badge variant="outline" className="bg-blue-50">
                                {item.lineItem}
                              </Badge>
                            )}
                            {pricedItems.has(item.id) && (
                              <Badge className="bg-green-600">تم التسعير</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">RFQ</p>
                          <p className="font-medium">{item.requestNumber}</p>
                        </div>
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
      </Card>
    </div>
  );
}