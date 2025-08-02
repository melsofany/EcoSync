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
  description: string;
  itemNumber: string;
  quantity: number;
  supplierPricing?: {
    id: string;
    unitPrice: string;
    supplier: { name: string };
  };
}

interface Quotation {
  id: string;
  requestNumber: string;
  clientName: string;
  requestDate: string;
  status: string;
  items: QuotationItem[];
}

interface POItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export default function CreatePurchaseOrder() {
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
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

  // Get selected quotation details
  const { data: selectedQuotation } = useQuery<Quotation>({
    queryKey: ["/api/quotations", selectedQuotationId],
    enabled: !!selectedQuotationId,
  });

  // Generate automatic PO number
  React.useEffect(() => {
    if (!useCustomPONumber) {
      const generatePONumber = () => {
        const timestamp = Date.now().toString().slice(-6);
        return `PO-K${timestamp}`;
      };
      setPONumber(generatePONumber());
    }
  }, [useCustomPONumber]);

  // Initialize PO items when quotation is selected
  React.useEffect(() => {
    if (selectedQuotation?.items) {
      const items: POItem[] = selectedQuotation.items
        .filter(item => item.supplierPricing)
        .map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.supplierPricing!.unitPrice),
          totalPrice: item.quantity * Number(item.supplierPricing!.unitPrice),
          notes: ""
        }));
      setPOItems(items);
    }
  }, [selectedQuotation]);

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

    const poData = {
      poNumber: poNumber.trim(),
      quotationId: selectedQuotationId,
      poDate: new Date(poDate).toISOString(),
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
                <Select value={selectedQuotationId} onValueChange={setSelectedQuotationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طلب التسعير" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotations.map((quotation) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.requestNumber} - {quotation.clientName}
                      </SelectItem>
                    ))}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium">رقم الطلب</Label>
                  <p className="font-semibold">{selectedQuotation.requestNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">العميل</Label>
                  <p className="font-semibold">{selectedQuotation.clientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">تاريخ الطلب</Label>
                  <p className="font-semibold">
                    {format(new Date(selectedQuotation.requestDate), "dd/MM/yyyy", { locale: ar })}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* PO Items */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  بنود أمر الشراء
                </h4>
                
                {poItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>البند</TableHead>
                          <TableHead>المورد</TableHead>
                          <TableHead>السعر المتفق عليه</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>الإجمالي</TableHead>
                          <TableHead>ملاحظات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poItems.map((poItem, index) => {
                          const quotationItem = selectedQuotation.items.find(
                            (item) => item.id === poItem.itemId
                          );
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{quotationItem?.description}</p>
                                  <p className="text-sm text-gray-500">{quotationItem?.itemNumber}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {quotationItem?.supplierPricing?.supplier.name}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={poItem.unitPrice}
                                  onChange={(e) =>
                                    updatePOItem(index, "unitPrice", Number(e.target.value))
                                  }
                                  className="w-28"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={poItem.quantity}
                                  onChange={(e) =>
                                    updatePOItem(index, "quantity", Number(e.target.value))
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(poItem.totalPrice)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={poItem.notes || ""}
                                  onChange={(e) =>
                                    updatePOItem(index, "notes", e.target.value)
                                  }
                                  placeholder="ملاحظات"
                                  className="w-32"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد بنود متاحة للشراء في طلب التسعير المحدد</p>
                  </div>
                )}

                {/* Total */}
                {poItems.length > 0 && (
                  <div className="flex justify-end">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">إجمالي قيمة أمر الشراء:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalPOValue)}
                        </span>
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