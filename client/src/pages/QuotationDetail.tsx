import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/auth";
import { formatEGP } from "@/lib/currency";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Bot, 
  FileText,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calculator
} from "lucide-react";

interface QuotationItem {
  id: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  item: {
    id: string;
    itemNumber: string;
    description: string;
    partNumber?: string;
    category?: string;
  };
}

export default function QuotationDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const safeUser = user || null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const quotationId = params.id;
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<QuotationItem | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  // Fetch quotation data
  const { data: quotation, isLoading } = useQuery({
    queryKey: ["/api/quotations", quotationId],
    enabled: !!quotationId,
  });

  // Fetch quotation items
  const { data: quotationItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/quotations", quotationId, "items"],
    enabled: !!quotationId,
  });

  // Fetch clients for display
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch all items for adding to quotation
  const { data: allItems } = useQuery({
    queryKey: ["/api/items"],
    enabled: isAddItemModalOpen,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "في الانتظار", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      processing: { label: "قيد المعالجة", variant: "default" as const, icon: Edit, color: "text-blue-600" },
      completed: { label: "مكتمل", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      cancelled: { label: "ملغي", variant: "destructive" as const, icon: X, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${
        status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
        status === "processing" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
        status === "cancelled" ? "bg-red-100 text-red-800 hover:bg-red-100" : ""
      } flex items-center space-x-1 space-x-reverse`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const updateQuotationStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await apiRequest("PATCH", `/api/quotations/${quotationId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "تم تحديث حالة الطلب",
        description: "تم تحديث حالة طلب التسعير بنجاح",
      });
      setIsStatusUpdateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message || "حدث خطأ أثناء تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  const addItemToQuotationMutation = useMutation({
    mutationFn: async (data: { itemId: string; quantity: number; unitPrice: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/quotations/${quotationId}/items`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", quotationId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", quotationId] });
      toast({
        title: "تم إضافة الصنف",
        description: "تم إضافة الصنف لطلب التسعير بنجاح",
      });
      setIsAddItemModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة الصنف",
        description: error.message || "حدث خطأ أثناء إضافة الصنف",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/quotations/${quotationId}/items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", quotationId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", quotationId] });
      toast({
        title: "تم حذف الصنف",
        description: "تم حذف الصنف من طلب التسعير بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الصنف",
        description: error.message || "حدث خطأ أثناء حذف الصنف",
        variant: "destructive",
      });
    },
  });

  // AI Item Analysis
  const analyzeItemWithAIMutation = useMutation({
    mutationFn: async (data: { description: string; partNumber?: string }) => {
      const response = await apiRequest("POST", "/api/items/ai-compare", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiAnalysisResult(data);
      toast({
        title: "تحليل الذكي مكتمل",
        description: `تم العثور على ${data.similarItems?.length || 0} عنصر مشابه`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحليل الذكي",
        description: error.message || "حدث خطأ أثناء تحليل الصنف",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getClientName = (clientId: string) => {
    if (!clients || !Array.isArray(clients)) return "غير محدد";
    const client = clients.find((c: any) => c.id === clientId);
    return client?.name || "غير محدد";
  };

  const calculateTotalAmount = () => {
    if (!quotationItems || !Array.isArray(quotationItems)) return 0;
    return quotationItems.reduce((total: number, item: QuotationItem) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full loading-spinner mx-auto mb-2"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل طلب التسعير...</p>
        </div>
      </div>
    );
  }

  if (!quotation || !quotation.id) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">طلب التسعير غير موجود</h3>
        <p className="text-gray-600 mb-4">لم يتم العثور على طلب التسعير المطلوب</p>
        <Button onClick={() => setLocation("/quotations")}>
          العودة لقائمة طلبات التسعير
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="ghost"
            onClick={() => setLocation("/quotations")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              طلب التسعير {(quotation as any)?.customRequestNumber || (quotation as any)?.requestNumber || 'غير محدد'}
            </h1>
            <p className="text-gray-600">إدارة تفاصيل طلب التسعير وأصنافه</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          {hasRole(safeUser, ["manager", "data_entry"]) && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsStatusUpdateModalOpen(true)}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Edit className="h-4 w-4" />
                <span>تحديث الحالة</span>
              </Button>
              <Button
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة صنف</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quotation Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>معلومات طلب التسعير</span>
            {getStatusBadge((quotation as any)?.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-600">رقم الطلب</Label>
              <p className="text-lg font-semibold text-gray-800">{(quotation as any)?.customRequestNumber || (quotation as any)?.requestNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">اسم العميل</Label>
              <p className="text-lg font-semibold text-gray-800">{getClientName((quotation as any)?.clientId)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">تاريخ الطلب</Label>
              <p className="text-lg font-semibold text-gray-800">{formatDate((quotation as any)?.requestDate)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">تاريخ الانتهاء</Label>
              <p className="text-lg font-semibold text-gray-800">
                {(quotation as any)?.expiryDate ? formatDate((quotation as any)?.expiryDate) : "غير محدد"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">الموظف المسؤول</Label>
              <p className="text-lg font-semibold text-gray-800">
                {(quotation as any)?.responsibleEmployee || "غير محدد"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">إجمالي المبلغ</Label>
              <p className="text-lg font-semibold text-green-600 flex items-center space-x-1 space-x-reverse">
                <Calculator className="h-4 w-4" />
                <span>{formatEGP(calculateTotalAmount())}</span>
              </p>
            </div>
            {(quotation as any)?.notes && (
              <div className="md:col-span-3">
                <Label className="text-sm font-medium text-gray-600">ملاحظات</Label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{(quotation as any)?.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotation Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Package className="h-5 w-5" />
              <span>أصناف طلب التسعير</span>
            </div>
            <Badge variant="outline">
              {quotationItems && Array.isArray(quotationItems) ? quotationItems.length : 0} صنف
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full loading-spinner mx-auto mb-2"></div>
              <p className="text-gray-600">جاري تحميل الأصناف...</p>
            </div>
          ) : !quotationItems || !Array.isArray(quotationItems) || quotationItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">لا توجد أصناف</h3>
              <p className="text-gray-600 mb-4">لم يتم إضافة أصناف لهذا الطلب بعد</p>
              {hasRole(safeUser, ["manager", "data_entry"]) && (
                <Button onClick={() => setIsAddItemModalOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول صنف
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الصنف</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>رقم القطعة</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>سعر الوحدة (ج.م)</TableHead>
                    <TableHead>المبلغ الإجمالي (ج.م)</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotationItems.map((quotationItem: QuotationItem) => (
                    <TableRow key={quotationItem.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {quotationItem.item?.itemNumber || "غير محدد"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-800 truncate">
                            {quotationItem.item?.description || "غير محدد"}
                          </p>
                          {quotationItem.item?.category && (
                            <p className="text-xs text-gray-500">
                              {quotationItem.item.category}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {quotationItem.item?.partNumber || "غير محدد"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quotationItem.quantity}
                      </TableCell>
                      <TableCell>
                        {formatEGP(quotationItem.unitPrice)}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatEGP(quotationItem.quantity * quotationItem.unitPrice)}
                      </TableCell>
                      <TableCell>
                        {quotationItem.notes ? (
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {quotationItem.notes}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {hasRole(safeUser, ["manager", "data_entry"]) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedItemForEdit(quotationItem)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItemMutation.mutate(quotationItem.id)}
                                disabled={deleteItemMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Total */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-end">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Calculator className="h-5 w-5 text-gray-600" />
                      <span className="text-lg font-medium text-gray-700">إجمالي المبلغ:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatEGP(calculateTotalAmount())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setAiAnalysisResult(null);
        }}
        onAddItem={(data) => addItemToQuotationMutation.mutate(data)}
        allItems={allItems && Array.isArray(allItems) ? allItems : []}
        aiAnalysisResult={aiAnalysisResult}
        onAnalyzeItem={(data) => analyzeItemWithAIMutation.mutate(data)}
        isAnalyzing={analyzeItemWithAIMutation.isPending}
        isAdding={addItemToQuotationMutation.isPending}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={isStatusUpdateModalOpen}
        onClose={() => setIsStatusUpdateModalOpen(false)}
        currentStatus={(quotation as any)?.status}
        onUpdateStatus={(status) => updateQuotationStatusMutation.mutate({ status })}
        isUpdating={updateQuotationStatusMutation.isPending}
      />
    </div>
  );
}

// Add Item Modal Component
interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (data: { itemId: string; quantity: number; unitPrice: number; notes?: string }) => void;
  allItems: any[];
  aiAnalysisResult: any;
  onAnalyzeItem: (data: { description: string; partNumber?: string }) => void;
  isAnalyzing: boolean;
  isAdding: boolean;
}

function AddItemModal({ 
  isOpen, 
  onClose, 
  onAddItem, 
  allItems, 
  aiAnalysisResult, 
  onAnalyzeItem, 
  isAnalyzing, 
  isAdding 
}: AddItemModalProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPartNumber, setNewItemPartNumber] = useState("");

  const handleSubmit = () => {
    if (!selectedItemId || quantity <= 0 || unitPrice <= 0) {
      return;
    }
    onAddItem({
      itemId: selectedItemId,
      quantity,
      unitPrice,
      notes: notes || undefined,
    });
  };

  const handleAnalyze = () => {
    if (!newItemDescription.trim()) return;
    onAnalyzeItem({
      description: newItemDescription,
      partNumber: newItemPartNumber || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة صنف لطلب التسعير</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* AI Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Bot className="h-5 w-5 text-blue-600" />
                <span>التحليل الذكي للأصناف</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>وصف الصنف للتحليل</Label>
                  <Textarea
                    placeholder="مثال: مضخة مياه كهربائية 2 حصان..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>رقم القطعة (اختياري)</Label>
                  <Input
                    placeholder="مثال: WP-2HP-220V"
                    value={newItemPartNumber}
                    onChange={(e) => setNewItemPartNumber(e.target.value)}
                  />
                </div>
              </div>
              
              <Button
                onClick={handleAnalyze}
                disabled={!newItemDescription.trim() || isAnalyzing}
                className="flex items-center space-x-2 space-x-reverse"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner"></div>
                    <span>جاري التحليل...</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    <span>تحليل ذكي للأصناف المشابهة</span>
                  </>
                )}
              </Button>

              {/* AI Results */}
              {aiAnalysisResult && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center space-x-2 space-x-reverse mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">نتائج التحليل الذكي</span>
                  </div>
                  
                  {aiAnalysisResult.similarItems && aiAnalysisResult.similarItems.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-700 mb-3">
                        تم العثور على {aiAnalysisResult.similarItems.length} صنف مشابه:
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {aiAnalysisResult.similarItems.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm">{item.description}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.category || "عام"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-green-700">لم يتم العثور على أصناف مشابهة - الصنف جديد</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>اختيار الصنف</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصنف من القائمة" />
                </SelectTrigger>
                <SelectContent>
                  {allItems.map((item: any) => (
                    <SelectItem key={item.id} value={item.id || ""}>
                      {item.itemNumber} - {item.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الكمية المطلوبة</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <Label>سعر الوحدة (ج.م)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label>المبلغ الإجمالي</Label>
              <Input
                value={formatEGP(quantity * unitPrice)}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="md:col-span-2">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                placeholder="أي ملاحظات خاصة بهذا الصنف..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isAdding}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedItemId || quantity <= 0 || unitPrice <= 0 || isAdding}
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة الصنف
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Status Update Modal Component
interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onUpdateStatus: (status: string) => void;
  isUpdating: boolean;
}

function StatusUpdateModal({ isOpen, onClose, currentStatus, onUpdateStatus, isUpdating }: StatusUpdateModalProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);

  const statusOptions = [
    { value: "pending", label: "في الانتظار", description: "الطلب في انتظار المعالجة" },
    { value: "processing", label: "قيد المعالجة", description: "جاري العمل على الطلب" },
    { value: "completed", label: "مكتمل", description: "تم إكمال الطلب بنجاح" },
    { value: "cancelled", label: "ملغي", description: "تم إلغاء الطلب" },
  ];

  const handleSubmit = () => {
    if (newStatus && newStatus !== currentStatus) {
      onUpdateStatus(newStatus);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تحديث حالة طلب التسعير</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div>
            <Label>الحالة الحالية</Label>
            <div className="p-2 bg-gray-50 rounded border">
              {statusOptions.find(s => s.value === currentStatus)?.label || currentStatus}
            </div>
          </div>

          <div>
            <Label>الحالة الجديدة</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة الجديدة" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!newStatus || newStatus === currentStatus || isUpdating}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  تحديث الحالة
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}