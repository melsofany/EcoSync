import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
}

export default function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Update form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
      });
    }
  }, [client]);

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/clients/${client.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث العميل",
        description: "تم تحديث بيانات العميل بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث بيانات العميل",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب إدخال اسم العميل",
        variant: "destructive",
      });
      return;
    }

    updateClientMutation.mutate(formData);
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
          <DialogTitle>تحرير بيانات العميل</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم العميل/الشركة *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="اسم العميل أو الشركة"
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
              disabled={updateClientMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={updateClientMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {updateClientMutation.isPending ? "جاري التحديث..." : "تحديث البيانات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}