import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Save, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditPOItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
}

interface POItem {
  id: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemNumber?: string;
  description?: string;
  unit?: string;
  lineItem?: string;
  partNumber?: string;
}

export default function EditPOItemsModal({ 
  isOpen, 
  onClose, 
  purchaseOrder 
}: EditPOItemsModalProps) {
  const [items, setItems] = useState<POItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load purchase order items
  const { data: poItems, isLoading } = useQuery({
    queryKey: ["/api/purchase-orders", purchaseOrder?.id, "items"],
    enabled: !!purchaseOrder?.id && isOpen,
  });

  useEffect(() => {
    if (poItems) {
      setItems(poItems.map((item: any) => ({
        id: item.id,
        itemId: item.itemId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        itemNumber: item.itemNumber,
        description: item.description,
        unit: item.unit,
        lineItem: item.lineItem,
        partNumber: item.partNumber,
      })));
    }
  }, [poItems]);

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string, data: any }) => {
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "خطأ في تحديث البند");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث البند بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "خطأ في حذف البند");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف البند بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setItems(updatedItems);
  };

  const saveItem = (item: POItem) => {
    updateItemMutation.mutate({
      itemId: item.id,
      data: {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }
    });
  };

  const deleteItem = (item: POItem) => {
    if (window.confirm(`هل أنت متأكد من حذف البند "${item.description}"؟`)) {
      deleteItemMutation.mutate(item.id);
      // Remove from local state immediately
      setItems(items.filter(i => i.id !== item.id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalPOValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            تعديل بنود أمر الشراء رقم: {purchaseOrder?.poNumber}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full loading-spinner mx-auto mb-2"></div>
            <p>جاري تحميل البنود...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">تعليمات التعديل</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• يمكنك تعديل الكمية والسعر لكل بند</li>
                <li>• اضغط على زر الحفظ بعد تعديل كل بند</li>
                <li>• يمكنك حذف البنود غير المطلوبة</li>
                <li>• سيتم حساب السعر الإجمالي تلقائياً</li>
              </ul>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم البند</TableHead>
                    <TableHead className="text-right">LINE ITEM</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">الوحدة</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">سعر الوحدة</TableHead>
                    <TableHead className="text-right">السعر الإجمالي</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-blue-600">
                        {item.itemNumber}
                      </TableCell>
                      <TableCell className="font-mono text-blue-800" dir="ltr">
                        {item.lineItem || "غير محدد"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-medium truncate">{item.description}</p>
                          {item.partNumber && (
                            <p className="text-xs text-gray-600">PART NO: {item.partNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 1)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value) || 0)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-800"
                            onClick={() => saveItem(item)}
                            disabled={updateItemMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => deleteItem(item)}
                            disabled={deleteItemMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد بنود في أمر الشراء</p>
              </div>
            )}

            {/* Total Summary */}
            {items.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">عدد البنود</p>
                    <p className="text-xl font-bold text-blue-600">{items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي الكمية</p>
                    <p className="text-xl font-bold text-orange-600">
                      {items.reduce((sum, item) => sum + item.quantity, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي قيمة الأمر</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalPOValue)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}