import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ShoppingCart, FileText, Calendar, Package, DollarSign, Plus } from "lucide-react";
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
  itemId: string;
  quotationItemId?: string;
  quantity: number;
  originalQuantity?: number;
  remainingQuantity?: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export default function CreatePurchaseOrder() {
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [quotationSearchTerm, setQuotationSearchTerm] = useState("");
  const [poNumber, setPONumber] = useState("");
  const [useCustomPONumber, setUseCustomPONumber] = useState(false);
  const [poDate, setPODate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quotations
  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  // Get selected quotation details with items
  const { data: selectedQuotation } = useQuery<Quotation>({
    queryKey: ["/api/quotations", selectedQuotationId],
    enabled: !!selectedQuotationId,
  });

  // Get quotation items separately
  const { data: quotationItems = [] } = useQuery<any[]>({
    queryKey: ["/api/quotations", selectedQuotationId, "items"],
    enabled: !!selectedQuotationId,
  });

  // Filter quotations based on search term
  const filteredQuotations = React.useMemo(() => {
    if (!quotationSearchTerm) return quotations;
    return quotations.filter((q: Quotation) => 
      q.requestNumber.toLowerCase().includes(quotationSearchTerm.toLowerCase()) ||
      (q.customRequestNumber && q.customRequestNumber.toLowerCase().includes(quotationSearchTerm.toLowerCase())) ||
      (q.clientName && q.clientName.toLowerCase().includes(quotationSearchTerm.toLowerCase()))
    );
  }, [quotations, quotationSearchTerm]);

  // Clear search term when quotation is selected
  React.useEffect(() => {
    if (selectedQuotationId && quotations) {
      const selected = quotations.find((q: Quotation) => q.id === selectedQuotationId);
      if (selected) {
        setQuotationSearchTerm("");
      }
    }
  }, [selectedQuotationId, quotations]);

  // Generate automatic PO number
  React.useEffect(() => {
    if (!useCustomPONumber) {
      const generatePONumber = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PO-K${timestamp}${random}`;
      };
      setPONumber(generatePONumber());
    }
  }, [useCustomPONumber]);

  // When quotation is selected, keep PO items empty initially for manual selection
  React.useEffect(() => {
    if (selectedQuotationId && quotationItems) {
      // Start with empty PO items, let user select which items to include
      setPOItems([]);
    } else {
      setPOItems([]);
    }
  }, [selectedQuotationId, quotationItems]);

  // Function to add an item to the PO
  const addItemToPO = (quotationItem: any) => {
    const existingItem = poItems.find(item => item.itemId === quotationItem.itemId);
    if (existingItem) {
      toast({
        title: "البند موجود بالفعل",
        description: "هذا البند مضاف بالفعل لأمر الشراء",
        variant: "destructive",
      });
      return;
    }

    const newPOItem = {
      itemId: quotationItem.itemId,
      quotationItemId: quotationItem.id,
      quantity: quotationItem.quantity || 1,
      originalQuantity: quotationItem.quantity || 1,
      remainingQuantity: quotationItem.quantity || 1,
      unitPrice: quotationItem.unitPrice || quotationItem.supplierPricing?.unitPrice ? parseFloat(quotationItem.supplierPricing.unitPrice) : 0,
      totalPrice: (quotationItem.quantity || 1) * (quotationItem.unitPrice || quotationItem.supplierPricing?.unitPrice ? parseFloat(quotationItem.supplierPricing.unitPrice) : 0),
      notes: "",
    };
    
    setPOItems(prev => [...prev, newPOItem]);
    toast({
      title: "تم إضافة البند",
      description: "تم إضافة البند لأمر الشراء بنجاح",
    });
  };

  // Function to remove an item from PO
  const removeItemFromPO = (itemId: string) => {
    setPOItems(prev => prev.filter(item => item.itemId !== itemId));
    toast({
      title: "تم حذف البند",
      description: "تم حذف البند من أمر الشراء",
    });
  };

  // Update item in PO
  const updatePOItem = (index: number, field: keyof POItem, value: any) => {
    const updatedItems = [...poItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setPOItems(updatedItems);
  };

  // Calculate total PO value
  const totalPOValue = poItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Create purchase order mutation
  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create purchase order");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء أمر الشراء بنجاح",
        description: `رقم أمر الشراء: ${poNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء أمر الشراء",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedQuotationId("");
    setQuotationSearchTerm("");
    setPONumber("");
    setUseCustomPONumber(false);
    setPODate(format(new Date(), "yyyy-MM-dd"));
    setPOItems([]);
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuotationId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طلب التسعير",
        variant: "destructive",
      });
      return;
    }

    if (!poNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم أمر الشراء",
        variant: "destructive",
      });
      return;
    }

    if (poItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة بنود لأمر الشراء",
        variant: "destructive",
      });
      return;
    }

    // Check if all items have valid prices and quantities
    const invalidItems = poItems.filter(item => !item.unitPrice || item.unitPrice <= 0 || !item.quantity || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال سعر وكمية صحيحة لجميع البنود",
        variant: "destructive",
      });
      return;
    }

    const poData = {
      poNumber: poNumber.trim(),
      quotationId: selectedQuotationId,
      poDate: poDate, // Send as string, server will convert
      totalValue: totalPOValue,
      notes,
      items: poItems,
    };

    createPOMutation.mutate(poData);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">إنشاء أمر شراء جديد</h1>
          <p className="text-gray-600">إنشاء أمر شراء من طلب تسعير معتمد</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معلومات أمر الشراء الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quotation Selection */}
              <div className="space-y-2">
                <Label htmlFor="quotation">طلب التسعير *</Label>
                <Select 
                  value={selectedQuotationId} 
                  onValueChange={setSelectedQuotationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اكتب لبحث أو اختر طلب التسعير..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="ابحث برقم الطلب أو اسم العميل..."
                        value={quotationSearchTerm}
                        onChange={(e) => setQuotationSearchTerm(e.target.value)}
                        className="text-right mb-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {filteredQuotations?.map((quotation: any) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        <div className="text-right w-full">
                          <span className="font-medium">
                            {quotation.customRequestNumber || quotation.requestNumber}
                          </span>
                          {quotation.customRequestNumber && quotation.customRequestNumber !== quotation.requestNumber && (
                            <span className="text-xs text-blue-600 ml-2">({quotation.requestNumber})</span>
                          )}
                          <span className="text-gray-500 ml-2">- {quotation.clientName || "غير محدد"}</span>
                          <div className="text-xs text-gray-400">
                            {quotation.requestDate && format(new Date(quotation.requestDate), "dd/MM/yyyy", { locale: ar })}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {filteredQuotations?.length === 0 && quotationSearchTerm && (
                      <div className="p-2 text-center text-gray-500">
                        لا توجد نتائج للبحث "{quotationSearchTerm}"
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* PO Date */}
              <div className="space-y-2">
                <Label htmlFor="poDate">تاريخ إصدار أمر الشراء *</Label>
                <Input
                  id="poDate"
                  type="date"
                  value={poDate}
                  onChange={(e) => setPODate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* PO Number Options */}
              <div className="space-y-3">
                <Label>رقم أمر الشراء *</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant={!useCustomPONumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseCustomPONumber(false)}
                  >
                    رقم تلقائي
                  </Button>
                  <Button
                    type="button"
                    variant={useCustomPONumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseCustomPONumber(true)}
                  >
                    رقم مخصص
                  </Button>
                </div>
                <Input
                  value={poNumber}
                  onChange={(e) => setPONumber(e.target.value)}
                  placeholder={useCustomPONumber ? "أدخل رقم أمر الشراء" : "سيتم إنشاء رقم تلقائي"}
                  disabled={!useCustomPONumber}
                  required
                />
              </div>

              {/* Notes */}
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
            </div>
          </CardContent>
        </Card>

        {/* Selected Quotation Info */}
        {selectedQuotation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                تفاصيل طلب التسعير المحدد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-blue-700">رقم طلب التسعير</Label>
                  <p className="font-bold text-blue-900">
                    {selectedQuotation.customRequestNumber || selectedQuotation.requestNumber}
                  </p>
                  {selectedQuotation.customRequestNumber && selectedQuotation.customRequestNumber !== selectedQuotation.requestNumber && (
                    <p className="text-xs text-blue-600 mt-1">رقم النظام: {selectedQuotation.requestNumber}</p>
                  )}
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-green-700">العميل</Label>
                  <p className="font-bold text-green-900">{selectedQuotation.clientName || "غير محدد"}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-orange-700">تاريخ الطلب</Label>
                  <p className="font-bold text-orange-900">
                    {format(new Date(selectedQuotation.requestDate), "dd/MM/yyyy", { locale: ar })}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-purple-700">تاريخ انتهاء العرض</Label>
                  <p className="font-bold text-purple-900">
                    {selectedQuotation.expiryDate ? 
                      format(new Date(selectedQuotation.expiryDate), "dd/MM/yyyy", { locale: ar }) : 
                      "غير محدد"
                    }
                  </p>
                </div>
              </div>

              {/* Additional quotation details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-700 mb-2">تفاصيل إضافية عن طلب التسعير</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">عدد البنود في الطلب: </span>
                    <span className="font-semibold">{quotationItems?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">تاريخ الإنشاء: </span>
                    <span className="font-semibold">
                      {selectedQuotation.createdAt ? 
                        format(new Date(selectedQuotation.createdAt), "dd/MM/yyyy HH:mm", { locale: ar }) : 
                        "غير محدد"
                      }
                    </span>
                  </div>
                  {selectedQuotation.notes && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">ملاحظات الطلب: </span>
                      <span className="font-medium">{selectedQuotation.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Available Items Selection */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  اختيار البنود من طلب التسعير
                </h4>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-blue-800">البنود المتاحة في طلب التسعير ({quotationItems?.length || 0})</h5>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          quotationItems?.forEach((item: any) => {
                            if (!poItems.some(poItem => poItem.itemId === item.itemId)) {
                              addItemToPO(item);
                            }
                          });
                        }}
                        disabled={quotationItems?.length === 0 || poItems.length === quotationItems?.length}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        إضافة جميع البنود
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPOItems([]);
                          toast({
                            title: "تم إزالة جميع البنود",
                            description: "تم إزالة جميع البنود من أمر الشراء",
                          });
                        }}
                        disabled={poItems.length === 0}
                        className="text-red-600 hover:text-red-800"
                      >
                        إزالة الكل
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الصنف / LINE ITEM</TableHead>
                          <TableHead className="text-right">وصف البند</TableHead>
                          <TableHead className="text-right">الكمية المطلوبة</TableHead>
                          <TableHead className="text-right">السعر المتوقع</TableHead>
                          <TableHead className="text-right">الإجراء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotationItems?.map((quotationItem: any) => {
                          const isAdded = poItems.some(item => item.itemId === quotationItem.itemId);
                          return (
                            <TableRow key={quotationItem.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-xs text-green-600 font-medium">رقم البند: {quotationItem.itemNumber || "غير محدد"}</p>
                                  <p className="text-sm font-mono text-blue-600 font-semibold" dir="ltr">
                                    {quotationItem.lineItem || "غير محدد"}
                                  </p>
                                  <p className="text-xs text-purple-600">PART NO: {quotationItem.partNumber || "غير محدد"}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-semibold text-gray-900">{quotationItem.description || "وصف البند"}</p>
                                  <p className="text-xs text-gray-500">الوحدة: {quotationItem.unit || "Each"}</p>
                                  {quotationItem.category && (
                                    <p className="text-xs text-gray-500">الفئة: {quotationItem.category}</p>
                                  )}
                                  {quotationItem.brand && (
                                    <p className="text-xs text-gray-500">الماركة: {quotationItem.brand}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-blue-600">{quotationItem.quantity || 1}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-green-600">
                                  {quotationItem.unitPrice ? formatCurrency(quotationItem.unitPrice) : 
                                   quotationItem.supplierPricing?.unitPrice ? formatCurrency(parseFloat(quotationItem.supplierPricing.unitPrice)) : 
                                   "غير محدد"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {isAdded ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default" className="text-xs">مضاف</Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeItemFromPO(quotationItem.itemId)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      إزالة
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addItemToPO(quotationItem)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Plus className="h-4 w-4 ml-1" />
                                    إضافة
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* PO Items */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  بنود أمر الشراء المحددة ({poItems.length})
                </h4>
                
                {poItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم الصنف / LINE ITEM</TableHead>
                          <TableHead>تفاصيل البند</TableHead>
                          <TableHead>بيانات طلب التسعير</TableHead>
                          <TableHead>بيانات أمر الشراء</TableHead>
                          <TableHead>الإجمالي</TableHead>
                          <TableHead>ملاحظات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poItems.map((poItem, index) => {
                          const quotationItem = quotationItems?.find(
                            (item: any) => item.itemId === poItem.itemId
                          );
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-xs text-green-600 font-medium">رقم البند: {quotationItem?.itemNumber || "غير محدد"}</p>
                                  <p className="text-sm font-mono text-blue-600 font-semibold" dir="ltr">
                                    {quotationItem?.lineItem || "غير محدد"}
                                  </p>
                                  <p className="text-xs text-purple-600">PART NO: {quotationItem?.partNumber || "غير محدد"}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-semibold text-gray-900">{quotationItem?.description || "وصف البند"}</p>
                                  <p className="text-xs text-gray-500">الوحدة: {quotationItem?.unit || "Each"}</p>
                                  {quotationItem?.category && (
                                    <p className="text-xs text-gray-500">الفئة: {quotationItem.category}</p>
                                  )}
                                  {quotationItem?.brand && (
                                    <p className="text-xs text-gray-500">الماركة: {quotationItem.brand}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 bg-blue-50 p-3 rounded">
                                  <div className="border-b border-blue-200 pb-2 mb-2">
                                    <p className="font-medium text-blue-800">
                                      {selectedQuotation?.customRequestNumber || selectedQuotation?.requestNumber || "غير محدد"}
                                    </p>
                                    <p className="text-sm text-blue-600 font-medium">العميل: {selectedQuotation?.clientName || "غير محدد"}</p>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    تاريخ الطلب: {selectedQuotation?.requestDate ? 
                                      format(new Date(selectedQuotation.requestDate), "dd/MM/yyyy", { locale: ar }) : 
                                      "غير محدد"
                                    }
                                  </p>
                                  <p className="text-xs text-green-600 font-medium">
                                    الكمية المطلوبة: {quotationItem?.quantity || 1}
                                  </p>
                                  {quotationItem?.unitPrice && quotationItem.unitPrice > 0 && (
                                    <p className="text-xs text-green-600 font-medium">
                                      السعر في التسعير: {formatCurrency(quotationItem.unitPrice)}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Badge variant={selectedQuotation?.status === "approved" ? "default" : "secondary"} className="text-xs">
                                      {selectedQuotation?.status === "approved" ? "معتمد" : 
                                       selectedQuotation?.status === "pending" ? "في الانتظار" : "غير محدد"}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-3 bg-green-50 p-3 rounded">
                                  <div className="border-b border-green-200 pb-2">
                                    <p className="text-sm font-medium text-green-800 mb-2">أمر الشراء:</p>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-xs text-gray-600">السعر المتفق عليه *</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={poItem.unitPrice || ""}
                                        onChange={(e) =>
                                          updatePOItem(index, "unitPrice", Number(e.target.value) || 0)
                                        }
                                        placeholder="أدخل السعر"
                                        className="w-full mt-1"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">الكمية المطلوبة *</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={poItem.quantity || ""}
                                        onChange={(e) =>
                                          updatePOItem(index, "quantity", Number(e.target.value) || 1)
                                        }
                                        placeholder="الكمية"
                                        className="w-full mt-1"
                                        required
                                      />
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatCurrency(poItem.totalPrice || 0)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={poItem.notes || ""}
                                  onChange={(e) =>
                                    updatePOItem(index, "notes", e.target.value)
                                  }
                                  placeholder="ملاحظات إضافية"
                                  className="w-40"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>ملاحظة:</strong> يمكنك تعديل السعر والكمية لكل بند حسب الاتفاق مع المورد
                      </p>
                      <p className="text-xs text-blue-600">
                        * الحقول المطلوبة يجب ملؤها قبل إنشاء أمر الشراء
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لم يتم تحديد أي بنود لأمر الشراء</p>
                    <p className="text-sm mt-2">استخدم القسم أعلاه لاختيار البنود التي تريد إضافتها لأمر الشراء</p>
                    <p className="text-xs mt-1 text-blue-600">يمكن إصدار أمر الشراء لبند واحد أو أكثر من البنود المتاحة</p>
                  </div>
                )}

                {/* Total */}
                {poItems.length > 0 && (
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">عدد البنود</p>
                          <p className="text-xl font-bold text-blue-600">{poItems.length}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">إجمالي الكمية</p>
                          <p className="text-xl font-bold text-orange-600">
                            {poItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">إجمالي قيمة أمر الشراء</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalPOValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={resetForm}>
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={createPOMutation.isPending || !selectedQuotationId || poItems.length === 0}
            className="min-w-32"
          >
            {createPOMutation.isPending ? "جاري الإنشاء..." : "إنشاء أمر الشراء"}
          </Button>
        </div>
      </form>
    </div>
  );
}