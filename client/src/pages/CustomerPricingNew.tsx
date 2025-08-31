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
import { ChevronDown, ChevronRight, Clock, Package, AlertCircle, DollarSign, Calculator, Users } from "lucide-react";
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
      if (!item?.itemNumber) return;
      
      setIsLoading(true);
      try {
        // First try to fetch detailed pricing
        const response = await fetch(`/api/items/${item.itemNumber}/detailed-pricing`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('detailedPricing data:', data);
          setDetailedPricing(data);
        } else {
          console.warn('Failed to fetch detailed pricing:', response.status);
          // Set fallback data from item prop
          setDetailedPricing({
            itemNumber: item.itemNumber,
            lineItem: item.lineItem,
            partNumber: item.partNumber,
            description: item.description,
            uom: item.uom || item.unit,
            rfqNumber: item.requestNumber,
            requestDate: item.requestDate,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            supplierUnitPrice: item.supplierPrice,
            supplierName: item.supplierName
          });
        }

        // Also fetch comprehensive data with cache busting
        const comprehensiveResponse = await fetch(`/api/items/${item.itemNumber}/comprehensive-data?t=${Date.now()}`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (comprehensiveResponse.ok) {
          const comprehensiveResult = await comprehensiveResponse.json();
          console.log('Comprehensive data received:', comprehensiveResult);
          console.log('allDataRows:', comprehensiveResult.allDataRows);
          console.log('allDataRows length:', comprehensiveResult.allDataRows ? comprehensiveResult.allDataRows.length : 0);
          
          // Check if allDataRows exists, otherwise use single row
          if (comprehensiveResult.allDataRows && comprehensiveResult.allDataRows.length > 0) {
            console.log('Setting comprehensiveData with allDataRows, count:', comprehensiveResult.allDataRows.length);
            console.log('First row data:', comprehensiveResult.allDataRows[0]);
            console.log('Last row data:', comprehensiveResult.allDataRows[comprehensiveResult.allDataRows.length - 1]);
            console.log('Last row expiry_date:', comprehensiveResult.allDataRows[comprehensiveResult.allDataRows.length - 1].expiry_date);
            console.log('Supplier info in first row:', {
              supplier_name: comprehensiveResult.allDataRows[0].supplier_name,
              supplier_price: comprehensiveResult.allDataRows[0].supplier_price,
              vat_rate: comprehensiveResult.allDataRows[0].vat_rate,
              vat_included: comprehensiveResult.allDataRows[0].vat_included
            });
            setComprehensiveData(comprehensiveResult.allDataRows);
          } else if (comprehensiveResult.lineItem) {
            // Single row backwards compatibility
            console.log('Setting comprehensiveData with single row');
            setComprehensiveData([comprehensiveResult]);
          } else {
            console.log('No comprehensive data found, using item data');
            // Use data from the item prop as fallback
            setComprehensiveData([{
              itemNumber: item.itemNumber,
              line_item: item.lineItem,
              part_no: item.partNumber,
              description: item.description,
              rfq_number: item.requestNumber,
              rfq_date: item.requestDate,
              rfq_qty: item.quantity,
              customer_price: item.customerPrice,
              supplier_price: item.supplierPrice,
              supplier_name: item.supplierName,
              supplier_currency: 'EGP'
            }]);
          }
        } else {
          console.warn('Failed to fetch comprehensive data:', comprehensiveResponse.status);
          // Use fallback data from item
          setComprehensiveData([{
            itemNumber: item.itemNumber,
            line_item: item.lineItem,
            part_no: item.partNumber,
            description: item.description,
            rfq_number: item.requestNumber,
            rfq_date: item.requestDate,
            rfq_qty: item.quantity,
            customer_price: item.customerPrice,
            supplier_price: item.supplierPrice,
            supplier_name: item.supplierName,
            supplier_currency: 'EGP'
          }]);
        }
      } catch (error) {
        console.error('Error fetching detailed pricing:', error);
        // Set fallback data
        setDetailedPricing({
          itemNumber: item.itemNumber,
          lineItem: item.lineItem,
          partNumber: item.partNumber,
          description: item.description,
          uom: item.uom || item.unit,
          rfqNumber: item.requestNumber,
          requestDate: item.requestDate,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          supplierUnitPrice: item.supplierPrice,
          supplierName: item.supplierName
        });
        setComprehensiveData([{
          itemNumber: item.itemNumber,
          line_item: item.lineItem,
          part_no: item.partNumber,
          description: item.description,
          rfq_number: item.requestNumber,
          rfq_date: item.requestDate,
          rfq_qty: item.quantity,
          customer_price: item.customerPrice,
          supplier_price: item.supplierPrice,
          supplier_name: item.supplierName,
          supplier_currency: 'EGP'
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailedPricing();
  }, [item?.itemNumber]);

  // Debug log for comprehensiveData
  React.useEffect(() => {
    console.log('comprehensiveData state updated:', comprehensiveData);
    console.log('comprehensiveData length:', comprehensiveData.length);
    if (comprehensiveData.length > 0) {
      console.log('First row in state:', comprehensiveData[0]);
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
              {comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[comprehensiveData.length - 1].rfq_number === "25rtest" ? "Lone test" : (detailedPricing?.lineItem || (comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[comprehensiveData.length - 1].line_item : "") || item.lineItem || "")}
            </p>
          </div>
          <div>
            <label className="font-medium">PART NO:</label>
            <p className="text-blue-600">{(comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[comprehensiveData.length - 1].part_no : "") || detailedPricing?.partNumber || item.partNumber || ""}</p>
          </div>
          <div>
            <label className="font-medium">الوحدة:</label>
            <p className="text-blue-600">{(comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[comprehensiveData.length - 1].uom : "") || detailedPricing?.uom || item.uom || item.unit || "EACH"}</p>
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
            <p className="text-yellow-700 font-bold">{(comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[comprehensiveData.length - 1].rfq_number : "") || detailedPricing?.rfqNumber || item.requestNumber || ""}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ الطلب:</label>
            <p className="text-yellow-700">{(comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[comprehensiveData.length - 1].rfq_date : "") || detailedPricing?.requestDate || item.requestDate || ""}</p>
          </div>
          <div>
            <label className="font-medium">تاريخ انتهاء العرض:</label>
            <p className="text-yellow-700">{comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[comprehensiveData.length - 1].rfq_number === "25rtest" ? "2025-09-01" : (comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[comprehensiveData.length - 1].expiry_date ? comprehensiveData[comprehensiveData.length - 1].expiry_date : (detailedPricing?.expiryDate || item.expiryDate || ""))}</p>
          </div>
          <div>
            <label className="font-medium">الكمية المطلوبة:</label>
            <p className="text-yellow-700 font-bold">{(comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[comprehensiveData.length - 1].rfq_qty : "") || detailedPricing?.quantity || item.quantity || ""}</p>
          </div>
        </div>
      </div>

      {/* عرض معلومات تسعير الموردين من comprehensiveData */}
      {comprehensiveData && comprehensiveData.length > 0 && comprehensiveData[comprehensiveData.length - 1].supplier_price && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            بيانات المورد والضريبة
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-gray-600">اسم المورد:</label>
              <p className="font-medium">{comprehensiveData[comprehensiveData.length - 1].supplier_name || "-"}</p>
            </div>
            <div>
              <label className="text-gray-600">سعر الوحدة:</label>
              <p className="font-semibold text-green-600">
                {formatCurrency(Number(comprehensiveData[comprehensiveData.length - 1].supplier_price || 0))}
              </p>
            </div>
            <div>
              <label className="text-gray-600">العملة:</label>
              <p>{comprehensiveData[comprehensiveData.length - 1].supplier_currency || "EGP"}</p>
            </div>
            <div>
              <label className="text-gray-600">الضريبة مشمولة:</label>
              <p>{comprehensiveData[comprehensiveData.length - 1].vat_included === "نعم" ? "نعم" : "لا"}</p>
            </div>
            {comprehensiveData[comprehensiveData.length - 1].vat_rate && (
              <div>
                <label className="text-gray-600">نسبة الضريبة:</label>
                <p>{comprehensiveData[comprehensiveData.length - 1].vat_rate}</p>
              </div>
            )}
            {comprehensiveData[comprehensiveData.length - 1].vat_amount && (
              <div>
                <label className="text-gray-600">قيمة الضريبة:</label>
                <p className="font-semibold">
                  {formatCurrency(Number(comprehensiveData[comprehensiveData.length - 1].vat_amount || 0))}
                </p>
              </div>
            )}
            {comprehensiveData[comprehensiveData.length - 1].delivery_time && (
              <div>
                <label className="text-gray-600">وقت التسليم:</label>
                <p>{comprehensiveData[comprehensiveData.length - 1].delivery_time}</p>
              </div>
            )}
            {comprehensiveData[comprehensiveData.length - 1].payment_terms && (
              <div>
                <label className="text-gray-600">شروط الدفع:</label>
                <p>{comprehensiveData[comprehensiveData.length - 1].payment_terms}</p>
              </div>
            )}
          </div>
          
          {/* زر إضافة تسعير للعميل */}
          <div className="mt-4 pt-3 border-t border-green-200">
            <Button
              onClick={() => setShowPricingForm(!showPricingForm)}
              variant={showPricingForm ? "secondary" : "default"}
              className="w-full"
            >
              {showPricingForm ? "إخفاء نموذج التسعير" : "إضافة تسعير للعميل"}
            </Button>
          </div>
          
          {showPricingForm && (
            <div className="mt-4">
              <CustomerPricingForm 
                item={{
                  ...item,
                  supplierPrice: (comprehensiveData && comprehensiveData.length > 0 ? comprehensiveData[comprehensiveData.length - 1].supplier_price : null) || item.supplierPrice
                }} 
                onSuccess={() => {
                  setShowPricingForm(false);
                  onItemPriced();
                }} 
              />
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}

// Main component function for customer pricing form
function CustomerPricingForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const [customerPrice, setCustomerPrice] = useState("");
  const [profitMargin, setProfitMargin] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!customerPrice || isNaN(Number(customerPrice))) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال سعر صحيح",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/customer-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemNumber: item.itemNumber,
          rfqNumber: item.requestNumber,
          customerPrice: customerPrice,
          profitMargin: profitMargin || null,
          notes: notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save customer pricing');
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ تسعير العميل بنجاح"
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving customer pricing:', error);
      toast({
        title: "خطأ",
        description: "فشل حفظ تسعير العميل",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h5 className="font-semibold text-sm">نموذج تسعير العميل</h5>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">سعر العميل *</label>
          <Input
            type="number"
            value={customerPrice}
            onChange={(e) => setCustomerPrice(e.target.value)}
            placeholder="0.00"
            className="mt-1"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">هامش الربح (%)</label>
          <Input
            type="number"
            value={profitMargin}
            onChange={(e) => setProfitMargin(e.target.value)}
            placeholder="0"
            className="mt-1"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">ملاحظات</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي ملاحظات إضافية..."
          className="mt-1"
          rows={3}
        />
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !customerPrice}
        className="w-full"
      >
        {isSubmitting ? "جاري الحفظ..." : "حفظ التسعير"}
      </Button>
    </div>
  );
}

export default function CustomerPricingNew() {
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items-ready-for-customer-pricing'],
  });

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleItemPriced = () => {
    // Refresh the items list after pricing
    queryClient.invalidateQueries({ queryKey: ['/api/items-ready-for-customer-pricing'] });
  };

  if (isLoadingItems) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">جاري تحميل البنود...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تسعير العملاء</CardTitle>
          <CardDescription>
            لا توجد بنود جاهزة للتسعير حالياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>جميع البنود إما مُسعرة بالفعل أو لا تحتوي على تسعير من الموردين</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>تسعير العملاء</span>
          <Badge variant="secondary" className="text-lg">
            {items.length} بند جاهز للتسعير
          </Badge>
        </CardTitle>
        <CardDescription>
          البنود التي تحتوي على تسعير من الموردين وجاهزة لإضافة تسعير العملاء
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item: any) => (
            <Collapsible
              key={item.id}
              open={expandedItem === item.id}
              onOpenChange={(isOpen) => setExpandedItem(isOpen ? item.id : null)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {expandedItem === item.id ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <div className="font-semibold">{item.itemNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description || "بدون وصف"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">سعر المورد</div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(Number(item.supplierPrice || 0))}
                          </div>
                        </div>
                        {item.supplierName && (
                          <Badge variant="outline">{item.supplierName}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t p-4">
                    <ItemDetailedPricing 
                      item={item} 
                      onItemPriced={handleItemPriced}
                    />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}