import React, { useState, useEffect, useCallback } from "react";
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
import { ShoppingCart, FileText, Calendar, Package, DollarSign, Plus, Trash2, Search, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [currentQuotationItems, setCurrentQuotationItems] = useState<POItem[]>([]);
  const [finalPOItems, setFinalPOItems] = useState<POItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingPO, setIsCheckingPO] = useState(false);
  const [poWarning, setPOWarning] = useState<string | null>(null);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingPO, setExistingPO] = useState<any>(null);
  
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

  // التحقق من رقم أمر الشراء
  const checkPONumber = useCallback(async (poNumber: string) => {
    if (!poNumber.trim()) {
      setPOWarning(null);
      return;
    }

    setIsCheckingPO(true);
    try {
      const response = await fetch(`/api/purchase-orders/check/${encodeURIComponent(poNumber)}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.exists) {
        setPOWarning(`⚠️ رقم أمر الشراء ${poNumber} موجود مسبقاً`);
        setExistingPO(data.purchaseOrder);
        setShowDuplicateDialog(true); // عرض النافذة المنبثقة
      } else {
        setPOWarning(null);
        setExistingPO(null);
        setShowDuplicateDialog(false);
      }
    } catch (error) {
      console.error('خطأ في التحقق من رقم أمر الشراء:', error);
      setPOWarning(null);
    } finally {
      setIsCheckingPO(false);
    }
  }, []);

  // استخدام debounce للتحقق عند التوقف عن الكتابة
  useEffect(() => {
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    const timeout = setTimeout(() => {
      checkPONumber(poNumber);
    }, 500);

    setCheckTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [poNumber]);

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
    
    console.log("🔍 البحث عن:", currentQuotationSearch.trim());
    
    // البحث في طلبات التسعير
    const searchTerm = currentQuotationSearch.trim().toUpperCase();
    const found = allQuotations.find((q: Quotation) => {
      const requestNum = q.requestNumber?.toUpperCase();
      const customNum = q.customRequestNumber?.toUpperCase();
      
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

  // When quotation items are loaded, add them to current items
  React.useEffect(() => {
    if (selectedQuotationId && quotationItems && quotationItems.length > 0) {
      console.log(`📋 تحميل ${quotationItems.length} بند لطلب التسعير ${selectedQuotationId}`);
      
      const newItems: POItem[] = quotationItems.map((item: any, index: number) => {
        const lineItem = item.lineItem || item.item?.lineItem || item.LINE_ITEM || "";
        const itemNumber = item.itemNumber || item.item?.itemNumber || item.ITEM_NUMBER || "";
        const partNumber = item.partNumber || item.item?.partNumber || item.PART_NUMBER || "";
        const description = item.description || item.item?.description || item.DESCRIPTION || "";
        const unit = item.unit || item.item?.uom || item.UOM || "Each";
        
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
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
          notes: "",
          isSelected: false,
        };
      });

      setCurrentQuotationItems(newItems);
    }
  }, [selectedQuotationId, quotationItems, selectedQuotation]);

  // Toggle item selection in current quotation
  const toggleItemSelection = (index: number, checked: boolean) => {
    const updatedItems = [...currentQuotationItems];
    updatedItems[index].isSelected = checked;
    setCurrentQuotationItems(updatedItems);
  };

  // Update item quantity in current quotation
  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...currentQuotationItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].totalPrice = quantity * updatedItems[index].unitPrice;
    setCurrentQuotationItems(updatedItems);
  };

  // Update item price in current quotation
  const updateItemPrice = (index: number, price: number) => {
    const updatedItems = [...currentQuotationItems];
    updatedItems[index].unitPrice = price;
    updatedItems[index].totalPrice = updatedItems[index].quantity * price;
    setCurrentQuotationItems(updatedItems);
  };

  // إضافة البنود المحددة للطلب النهائي
  const addSelectedItemsToPO = () => {
    const selectedItems = currentQuotationItems.filter(item => item.isSelected);
    
    if (selectedItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار بند واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة البيانات
    const invalidItems = selectedItems.filter(item => 
      !item.quantity || item.quantity <= 0 || 
      !item.unitPrice || item.unitPrice <= 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: "خطأ في البيانات",
        description: `يرجى إدخال كمية وسعر صحيح لجميع البنود المحددة`,
        variant: "destructive",
      });
      return;
    }

    // إضافة البنود للقائمة النهائية
    setFinalPOItems(prev => [...prev, ...selectedItems]);
    
    toast({
      title: "تمت الإضافة",
      description: `تم إضافة ${selectedItems.length} بند لأمر الشراء`,
    });

    // مسح البحث الحالي للسماح بإضافة طلب جديد
    setCurrentQuotationSearch("");
    setSelectedQuotationId("");
    setCurrentQuotationItems([]);
  };

  // Remove item from final list
  const removeItemFromFinal = (index: number) => {
    setFinalPOItems(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "تم حذف البند",
      description: "تم حذف البند من أمر الشراء",
    });
  };

  // Calculate total PO value
  const totalPOValue = finalPOItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Create purchase order mutation
  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        console.log("📤 إرسال بيانات أمر الشراء:", data);
        const response = await apiRequest("POST", "/api/purchase-orders/google-sheets", data);
        console.log("📥 استجابة الخادم:", response);
        return response;
      } catch (error: any) {
        console.error("❌ خطأ في إنشاء أمر الشراء:", error);
        console.error("❌ تفاصيل الخطأ:", {
          message: error.message,
          data: error.data,
          status: error.status,
          response: error.response
        });
        
        // التحقق من الخطأ 409 (تكرار)
        if (error.status === 409 || error.data?.error === 'DUPLICATE_PO_NUMBER') {
          setExistingPO(error.data?.existingPO);
          setShowDuplicateDialog(true);
          throw new Error("رقم أمر الشراء موجود مسبقاً");
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
      console.error("❌ تفاصيل الخطأ الكاملة:", {
        message: error.message,
        details: error.details,
        stack: error.stack
      });
      
      if (!showDuplicateDialog) {
        // عرض رسالة خطأ مفصلة
        let errorMessage = error.message || "حدث خطأ غير متوقع";
        
        // إضافة تفاصيل إضافية إذا كانت متاحة
        if (error.message?.includes("البند") && error.message?.includes("غير موجود")) {
          errorMessage += ". تحقق من اختيار البنود الصحيحة من طلبات التسعير المحددة";
        } else if (error.message?.includes("لم يتم حفظ أي بند")) {
          errorMessage += ". جميع البنود المحددة غير صالحة أو غير موجودة في طلبات التسعير";
        } else if (error.message?.includes("بدون رقم طلب تسعير")) {
          errorMessage += ". تأكد من تحديد طلب التسعير لكل بند";
        }
        
        toast({
          title: "❌ فشل إنشاء أمر الشراء",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const resetForm = () => {
    setPONumber("");
    setPODate(format(new Date(), "yyyy-MM-dd"));
    setCurrentQuotationSearch("");
    setSelectedQuotationId("");
    setCurrentQuotationItems([]);
    setFinalPOItems([]);
    setNotes("");
    setPOWarning(null);
    setExistingPO(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("📝 بدء إنشاء أمر الشراء...");
    
    if (!poNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم أمر الشراء",
        variant: "destructive",
      });
      return;
    }

    // التحقق من عدم وجود رقم أمر شراء مكرر
    if (existingPO) {
      setShowDuplicateDialog(true);
      toast({
        title: "خطأ",
        description: "رقم أمر الشراء موجود مسبقاً",
        variant: "destructive",
      });
      return;
    }

    if (finalPOItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة بند واحد على الأقل لأمر الشراء",
        variant: "destructive",
      });
      return;
    }

    const poData = {
      poNumber: poNumber.trim(),
      poDate: poDate,
      totalValue: totalPOValue,
      notes,
      items: finalPOItems.map(item => ({
        quotationId: item.quotationId,
        quotationNumber: item.quotationNumber,
        rfqNumber: item.quotationNumber, // إضافة رقم طلب التسعير
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

    console.log("📊 بيانات أمر الشراء:", poData);
    createPOMutation.mutate(poData);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">إنشاء أمر شراء جديد</h1>
          <p className="text-gray-600">إنشاء أمر شراء من طلبات تسعير متعددة</p>
        </div>
      </div>

      {/* نافذة التنبيه للأمر المكرر */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              أمر الشراء موجود مسبقاً
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-3">
              <p className="text-base">
                رقم أمر الشراء <strong className="text-primary">{poNumber}</strong> موجود بالفعل في النظام.
              </p>
              {existingPO && (
                <div className="bg-muted p-3 rounded-md space-y-2">
                  <p className="text-sm font-medium">معلومات الأمر الموجود:</p>
                  <div className="text-sm space-y-1">
                    <p>• التاريخ: <span className="font-medium">{existingPO.date}</span></p>
                    <p>• القيمة: <span className="font-medium">{formatCurrency(existingPO.totalValue || 0)}</span></p>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                لا يمكن إضافة أمر شراء بنفس الرقم مرة أخرى.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel onClick={() => {
              setShowDuplicateDialog(false);
              setPONumber(''); // مسح رقم أمر الشراء المكرر
              setExistingPO(null);
              setPOWarning(null);
            }}>
              تغيير رقم أمر الشراء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <div className="relative">
                  <Input
                    id="poNumber"
                    value={poNumber}
                    onChange={(e) => setPONumber(e.target.value)}
                    placeholder="أدخل رقم أمر الشراء"
                    className={poWarning ? 'border-amber-500' : ''}
                    required
                  />
                  {isCheckingPO && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {poWarning && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {poWarning}
                    </p>
                  </div>
                )}
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

            {/* جدول البنود الحالية من طلب التسعير */}
            {currentQuotationItems.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">
                  بنود طلب التسعير الحالي ({currentQuotationItems.length} بند)
                </h4>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-12">اختيار</TableHead>
                        <TableHead className="text-right">رقم الصنف / LINE ITEM</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right w-24">الكمية</TableHead>
                        <TableHead className="text-right w-28">السعر</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentQuotationItems.map((item, index) => (
                        <TableRow key={index} className={item.isSelected ? "bg-blue-50" : ""}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.isSelected}
                              onCheckedChange={(checked) => toggleItemSelection(index, checked as boolean)}
                            />
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
                                <p className="text-xs text-gray-600">P/N: {item.partNumber}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm max-w-xs truncate" title={item.description}>
                              {item.description || "غير محدد"}
                            </p>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.quantity || ""}
                              onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
                              className="w-20"
                              disabled={!item.isSelected}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice || ""}
                              onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                              className="w-24"
                              disabled={!item.isSelected}
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* زر إضافة البنود المحددة */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={addSelectedItemsToPO}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة البنود المحددة للطلب
                  </Button>
                </div>
              </div>
            )}

            {/* البنود النهائية لأمر الشراء */}
            {finalPOItems.length > 0 && (
              <div className="space-y-4 mt-6">
                <Separator />
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-lg">
                    البنود النهائية لأمر الشراء ({finalPOItems.length} بند)
                  </h4>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    الإجمالي: {formatCurrency(totalPOValue)}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">طلب التسعير</TableHead>
                        <TableHead className="text-right">رقم الصنف / LINE ITEM</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead className="text-center w-12">حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finalPOItems.map((item, index) => (
                        <TableRow key={index} className="bg-green-50">
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
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm max-w-xs truncate" title={item.description}>
                              {item.description || "غير محدد"}
                            </p>
                          </TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.totalPrice)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromFinal(index)}
                              className="text-red-600 hover:text-red-700"
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
          </CardContent>
        </Card>

        {/* أزرار الإجراءات */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={resetForm}>
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={createPOMutation.isPending || finalPOItems.length === 0 || !!existingPO}
            className={existingPO ? "bg-red-500 cursor-not-allowed opacity-60" : "bg-blue-600 hover:bg-blue-700"}
            title={existingPO ? "لا يمكن إصدار أمر شراء برقم مكرر" : ""}
          >
            {createPOMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري الإنشاء...
              </>
            ) : existingPO ? (
              <>
                <AlertCircle className="h-4 w-4 ml-1" />
                رقم أمر الشراء مكرر
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 ml-1" />
                إصدار أمر الشراء
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}