import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
}

export default function EditSupplierModal({ isOpen, onClose, supplier }: EditSupplierModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Update form data when supplier changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
      });
    }
  }, [supplier]);

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/suppliers/${supplier.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث المورد",
        description: "تم تحديث بيانات المورد بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث بيانات المورد",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب إدخال اسم المورد",
        variant: "destructive",
      });
      return;
    }

    updateSupplierMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تحرير بيانات المورد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المورد/الشركة *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="اسم المورد أو الشركة"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="رقم الهاتف"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="البريد الإلكتروني"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="العنوان"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateSupplierMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={updateSupplierMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {updateSupplierMutation.isPending ? "جاري التحديث..." : "تحديث البيانات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}