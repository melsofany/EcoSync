import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Truck, Phone, Mail, MapPin, User } from "lucide-react";

const supplierSchema = z.object({
  name: z.string().min(1, "اسم المورد مطلوب"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSupplierModal({ isOpen, onClose }: NewSupplierModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierForm) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "تم إضافة المورد",
        description: `تم إضافة المورد ${data.name} بنجاح`,
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة المورد",
        description: error.message || "حدث خطأ أثناء إضافة المورد",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierForm) => {
    createSupplierMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>إضافة مورد جديد</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">اسم الشركة/المورد *</Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="اسم الشركة أو المورد"
                  className="pl-10"
                  {...form.register("name")}
                />
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="contactPerson">جهة الاتصال</Label>
              <div className="relative">
                <Input
                  id="contactPerson"
                  placeholder="اسم جهة الاتصال"
                  className="pl-10"
                  {...form.register("contactPerson")}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {form.formState.errors.contactPerson && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.contactPerson.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="01xxxxxxxxx"
                  className="pl-10"
                  {...form.register("phone")}
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10"
                  {...form.register("email")}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">العنوان</Label>
              <div className="relative">
                <Textarea
                  id="address"
                  placeholder="عنوان المورد أو الشركة..."
                  rows={3}
                  {...form.register("address")}
                />
                <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              </div>
              {form.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createSupplierMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createSupplierMutation.isPending}
            >
              {createSupplierMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري الإضافة...
                </>
              ) : (
                "إضافة المورد"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}