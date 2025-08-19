import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ShoppingCart, FileText, Calendar, Package, DollarSign, Plus, Trash2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface QuotationItem {
  id: string;
  itemId?: string;
  description?: string;
  itemNumber?: string;
  kItemId?: string;
  partNumber?: string;
  lineItem?: string;
  unit?: string;
  category?: string;
  brand?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  supplierPricing?: {
    id: string;
    unitPrice: string;
    supplier: { name: string };
  };
}

interface Quotation {
  id: string;
  requestNumber: string;
  customRequestNumber?: string;
  clientName?: string;
  requestDate: string;
  expiryDate?: string;
  status: string;
  notes?: string;
  createdAt?: string;
  items?: QuotationItem[];
}

interface POItem {
  quotationId: string;
  quotationNumber: string;
  itemId: string;
  quotationItemId?: string;
  lineItem?: string;
  itemNumber?: string;
  partNumber?: string;
  description?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  isSelected: boolean;
}

export default function CreatePurchaseOrder() {
  const [poNumber, setPONumber] = useState("");
  const [poDate, setPODate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [currentQuotationSearch, setCurrentQuotationSearch] = useState("");
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all quotations for search
  const { data: allQuotations = [], isLoading: loadingQuotations } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  // تسجيل حالة تحميل البيانات
  React.useEffect(() => {
    if (!loadingQuotations) {
      console.log(`📊 تم تحميل ${allQuotations.length} طلب تسعير`);
      if (allQuotations.length > 0) {
        console.log("📄 أول 5 طلبات:");
        allQuotations.slice(0, 5).forEach((q: Quotation) => {
          console.log(`  - ID: ${q.id}`);
          console.log(`    Request: ${q.requestNumber}`);
          console.log(`    Custom: ${q.customRequestNumber}`);
        });
      }
    }
  }, [allQuotations, loadingQuotations]);

  // Get selected quotation details with items
  const { data: selectedQuotation, isLoading: loadingQuotation } = useQuery<Quotation>({
    queryKey: ["/api/quotations", selectedQuotationId],
    enabled: !!selectedQuotationId,
  });

  // Get quotation items separately  
  const { data: quotationItems = [], isLoading: loadingItems } = useQuery<any[]>({
    queryKey: [`/api/quotations/${selectedQuotationId}/items`],
    enabled: !!selectedQuotationId,
  });

  // Search for quotation by number
  const handleSearchQuotation = () => {
    if (!currentQuotationSearch.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم طلب التسعير",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    // تسجيل معلومات التشخيص
    console.log("🔍 البحث عن:", currentQuotationSearch.trim());
    console.log("📋 عدد طلبات التسعير المُحملة:", allQuotations.length);
    
    if (allQuotations.length > 0) {
      console.log("📄 أمثلة على طلبات التسعير:");
      allQuotations.slice(0, 5).forEach((q: Quotation) => {
        console.log(`  - ${q.requestNumber} | ${q.customRequestNumber} | ${q.id}`);
      });
    }
    
    // البحث في طلبات التسعير - مع تحسين المقارنة
    const searchTerm = currentQuotationSearch.trim().toUpperCase();
    const found = allQuotations.find((q: Quotation) => {
      const requestNum = q.requestNumber?.toUpperCase();
      const customNum = q.customRequestNumber?.toUpperCase();
      
      console.log(`🔎 مقارنة مع: ${requestNum} | ${customNum}`);
      
      return requestNum === searchTerm || 
             customNum === searchTerm ||
             requestNum?.includes(searchTerm) ||
             customNum?.includes(searchTerm);
    });

    if (found) {
      console.log("✅ تم العثور على طلب:", found);
      setSelectedQuotationId(found.id);
      toast({
        title: "تم العثور على طلب التسعير",
        description: `طلب التسعير ${found.customRequestNumber || found.requestNumber} - ${found.clientName || "غير محدد"}`,
      });
    } else {
      console.log("❌ لم يتم العثور على طلب");
      toast({
        title: "لم يتم العثور على طلب التسعير",
        description: "يرجى التحقق من رقم طلب التسعير",
        variant: "destructive",
      });
      setSelectedQuotationId("");
    }
    
    setIsSearching(false);
  };

  // When quotation items are loaded, add them to the list
  React.useEffect(() => {
    if (selectedQuotationId && quotationItems && quotationItems.length > 0) {
      console.log(`📋 تحميل ${quotationItems.length} بند لطلب التسعير ${selectedQuotationId}`);
      console.log("📄 بيانات البنود المستلمة:", quotationItems);
      
      const newItems: POItem[] = quotationItems.map((item: any, index: number) => {
        // استخراج البيانات من البند
        const lineItem = item.lineItem || item.item?.lineItem || item.LINE_ITEM || "";
        const itemNumber = item.itemNumber || item.item?.itemNumber || item.ITEM_NUMBER || "";
        const partNumber = item.partNumber || item.item?.partNumber || item.PART_NUMBER || "";
        const description = item.description || item.item?.description || item.DESCRIPTION || "";
        const unit = item.unit || item.item?.uom || item.UOM || "Each";
        
        console.log(`  البند ${index + 1}: ${lineItem} - ${description}`);
        
        return {
          quotationId: selectedQuotationId,
          quotationNumber: selectedQuotation?.customRequestNumber || selectedQuotation?.requestNumber || "",
          itemId: item.itemId || item.item?.id || item.id || `item-${index}`,
          quotationItemId: item.id,
          lineItem: lineItem,
          itemNumber: itemNumber,
          partNumber: partNumber,
          description: description,
          unit: unit,
          quantity: 0, // سيتم إدخالها من المستخدم
          unitPrice: 0, // سيتم إدخالها من المستخدم
          totalPrice: 0,
          notes: "",
          isSelected: false, // غير محدد بشكل افتراضي
        };
      });

      // إضافة البنود الجديدة إلى القائمة الموجودة
      setPOItems(prev => {
        // مسح البنود السابقة لنفس طلب التسعير
        const filteredPrev = prev.filter(item => item.quotationId !== selectedQuotationId);
        const updatedItems = [...filteredPrev, ...newItems];
        
        console.log(`✅ تم إضافة ${newItems.length} بند جديد، الإجمالي: ${updatedItems.length}`);
        return updatedItems;
      });
    }
  }, [selectedQuotationId, quotationItems, selectedQuotation]);

  // Toggle item selection
  const toggleItemSelection = (index: number, checked: boolean) => {
    const updatedItems = [...poItems];
    updatedItems[index].isSelected = checked;
    setPOItems(updatedItems);
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...poItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].totalPrice = quantity * updatedItems[index].unitPrice;
    setPOItems(updatedItems);
  };

  // Update item price
  const updateItemPrice = (index: number, price: number) => {
    const updatedItems = [...poItems];
    updatedItems[index].unitPrice = price;
    updatedItems[index].totalPrice = updatedItems[index].quantity * price;
    setPOItems(updatedItems);
  };

  // Remove item from list
  const removeItem = (index: number) => {
    setPOItems(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "تم حذف البند",
      description: "تم حذف البند من القائمة",
    });
  };

  // Clear current quotation and search
  const clearCurrentQuotation = () => {
    setCurrentQuotationSearch("");
    setSelectedQuotationId("");
  };

  // Calculate total PO value
  const totalPOValue = poItems
    .filter(item => item.isSelected)
    .reduce((sum, item) => sum + item.totalPrice, 0);

  // Get selected items count
  const selectedItemsCount = poItems.filter(item => item.isSelected).length;

  // Create purchase order mutation
  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await apiRequest("POST", "/api/purchase-orders/google-sheets", data);
        return response;
      } catch (error: any) {
        console.error("❌ خطأ في إرسال أمر الشراء:", error);
        // معالجة أخطاء الشبكة بشكل خاص
        if (error.message?.includes('fetch')) {
          throw new Error("خطأ في الاتصال بالخادم. تأكد من اتصال الإنترنت وحاول مرة أخرى");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ تم إنشاء أمر الشراء بنجاح:", data);
      toast({
        title: "تم إنشاء أمر الشراء بنجاح ✅",
        description: `رقم أمر الشراء: ${poNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      resetForm();
    },
    onError: (error: any) => {
      console.error("❌ فشل إنشاء أمر الشراء:", error);
      toast({
        title: "خطأ في إنشاء أمر الشراء",
        description: error.message || "حدث خطأ غير متوقع. حاول مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPONumber("");
    setPODate(format(new Date(), "yyyy-MM-dd"));
    setCurrentQuotationSearch("");
    setSelectedQuotationId("");
    setPOItems([]);
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("📝 بدء إنشاء أمر الشراء...");
    console.log("رقم أمر الشراء:", poNumber);
    console.log("عدد البنود الكلي:", poItems.length);
    
    if (!poNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم أمر الشراء",
        variant: "destructive",
      });
      return;
    }

    const selectedItems = poItems.filter(item => item.isSelected);
    console.log("عدد البنود المحددة:", selectedItems.length);
    
    if (selectedItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار بند واحد على الأقل بوضع علامة ✓ بجانبه",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة البيانات المدخلة
    const invalidItems = selectedItems.filter(item => 
      !item.quantity || item.quantity <= 0 || 
      !item.unitPrice || item.unitPrice <= 0
    );

    if (invalidItems.length > 0) {
      console.log("❌ بنود غير صالحة:", invalidItems);
      toast({
        title: "خطأ في البيانات",
        description: `يرجى إدخال كمية وسعر صحيح لجميع البنود المحددة (${invalidItems.length} بند ناقص)`,
        variant: "destructive",
      });
      return;
    }

    const poData = {
      poNumber: poNumber.trim(),
      poDate: poDate,
      totalValue: totalPOValue,
      notes,
      items: selectedItems.map(item => ({
        quotationId: item.quotationId,
        quotationNumber: item.quotationNumber,
        itemId: item.itemId,
        lineItem: item.lineItem || "",
        itemNumber: item.itemNumber || "",
        partNumber: item.partNumber || "",
        description: item.description || "",
        unit: item.unit || "Each",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    };

    console.log("📊 بيانات أمر الشراء المرسلة:", poData);
    console.log("✅ عدد البنود:", poData.items.length);
    console.log("💰 الإجمالي:", poData.totalValue);

    createPOMutation.mutate(poData);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">إنشاء أمر شراء جديد</h1>
          <p className="text-gray-600">إنشاء أمر شراء من طلبات التسعير</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* معلومات أمر الشراء الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معلومات أمر الشراء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poNumber">رقم أمر الشراء *</Label>
                <Input
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPONumber(e.target.value)}
                  placeholder="أدخل رقم أمر الشراء"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="poDate">تاريخ أمر الشراء *</Label>
                <Input
                  id="poDate"
                  type="date"
                  value={poDate}
                  onChange={(e) => setPODate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية لأمر الشراء"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* البحث عن طلبات التسعير وإضافة البنود */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              إضافة البنود من طلبات التسعير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* قسم البحث */}
            <div className="bg-gray-50 p-4 rounded-lg">
              {/* عرض حالة تحميل البيانات */}
              {loadingQuotations ? (
                <div className="mb-3 text-sm text-gray-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                  جاري تحميل طلبات التسعير...
                </div>
              ) : (
                <div className="mb-3 text-sm text-green-600">
                  ✅ تم تحميل {allQuotations.length} طلب تسعير
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  value={currentQuotationSearch}
                  onChange={(e) => setCurrentQuotationSearch(e.target.value)}
                  placeholder="أدخل رقم طلب التسعير للبحث (مثال: 25R000057)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchQuotation();
                    }
                  }}
                  disabled={loadingQuotations || allQuotations.length === 0}
                />
                <Button
                  type="button"
                  onClick={handleSearchQuotation}
                  disabled={isSearching || loadingQuotations || allQuotations.length === 0}
                >
                  <Search className="h-4 w-4 ml-1" />
                  بحث
                </Button>
                {selectedQuotationId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearCurrentQuotation}
                  >
                    مسح
                  </Button>
                )}
              </div>

              {/* عرض معلومات طلب التسعير المحدد */}
              {selectedQuotation && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">رقم الطلب: </span>
                      <span className="font-semibold">
                        {selectedQuotation.customRequestNumber || selectedQuotation.requestNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">العميل: </span>
                      <span className="font-semibold">{selectedQuotation.clientName || "غير محدد"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">التاريخ: </span>
                      <span className="font-semibold">
                        {selectedQuotation.requestDate && !isNaN(Date.parse(selectedQuotation.requestDate))
                          ? format(new Date(selectedQuotation.requestDate), "dd/MM/yyyy", { locale: ar })
                          : "غير محدد"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* عرض حالة التحميل */}
            {loadingItems && selectedQuotationId && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700">جاري تحميل بنود طلب التسعير...</span>
                </div>
              </div>
            )}

            {/* جدول البنود */}
            {poItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">
                    البنود المضافة ({poItems.length} بند - {selectedItemsCount} محدد)
                  </h4>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    الإجمالي: {formatCurrency(totalPOValue)}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-12">اختيار</TableHead>
                        <TableHead className="text-right">طلب التسعير</TableHead>
                        <TableHead className="text-right">رقم الصنف / LINE ITEM</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right w-24">الكمية</TableHead>
                        <TableHead className="text-right w-28">السعر</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead className="text-center w-12">حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poItems.map((item, index) => (
                        <TableRow key={index} className={item.isSelected ? "bg-blue-50" : ""}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.isSelected}
                              onCheckedChange={(checked) => toggleItemSelection(index, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.quotationNumber}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {item.itemNumber && (
                                <p className="text-xs text-green-600">رقم: {item.itemNumber}</p>
                              )}
                              {item.lineItem && (
                                <p className="text-sm font-mono text-blue-600" dir="ltr">{item.lineItem}</p>
                              )}
                              {item.partNumber && (
                                <p className="text-xs text-purple-600">PART: {item.partNumber}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{item.description || "غير محدد"}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.unit}</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
                              className="w-24"
                              disabled={!item.isSelected}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                              className="w-28"
                              disabled={!item.isSelected}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {poItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد بنود مضافة</p>
                <p className="text-sm mt-1">ابحث عن طلبات التسعير لإضافة البنود</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* زر الإرسال */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={createPOMutation.isPending || selectedItemsCount === 0}
          >
            {createPOMutation.isPending ? (
              <>جاري الإنشاء...</>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 ml-1" />
                إنشاء أمر الشراء
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}