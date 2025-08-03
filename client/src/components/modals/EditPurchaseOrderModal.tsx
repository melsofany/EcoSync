import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EditPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
}

export default function EditPurchaseOrderModal({ 
  isOpen, 
  onClose, 
  purchaseOrder 
}: EditPurchaseOrderModalProps) {
  const [formData, setFormData] = useState({
    totalValue: "",
    status: "",
    deliveryStatus: false,
    invoiceIssued: false,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        totalValue: purchaseOrder.totalValue?.toString() || "",
        status: purchaseOrder.status || "pending",
        deliveryStatus: purchaseOrder.deliveryStatus || false,
        invoiceIssued: purchaseOrder.invoiceIssued || false,
      });
    }
  }, [purchaseOrder]);

  const updatePOMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ أثناء تحديث أمر الشراء");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث أمر الشراء بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث أمر الشراء",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePOMutation.mutate({
      totalValue: parseFloat(formData.totalValue),
      status: formData.status,
      deliveryStatus: formData.deliveryStatus,
      invoiceIssued: formData.invoiceIssued,
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تحرير أمر الشراء رقم: {purchaseOrder?.poNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalValue">القيمة الإجمالية</Label>
            <Input
              id="totalValue"
              type="number"
              step="0.01"
              value={formData.totalValue}
              onChange={(e) => handleInputChange("totalValue", e.target.value)}
              placeholder="القيمة الإجمالية"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="invoiced">تم إصدار الفاتورة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="deliveryStatus"
              checked={formData.deliveryStatus}
              onChange={(e) => handleInputChange("deliveryStatus", e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="deliveryStatus">تم التسليم</Label>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="invoiceIssued"
              checked={formData.invoiceIssued}
              onChange={(e) => handleInputChange("invoiceIssued", e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="invoiceIssued">تم إصدار الفاتورة</Label>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={updatePOMutation.isPending}>
              {updatePOMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}