import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, User, Lock, Shield } from "lucide-react";

const userSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  role: z.string().min(1, "الدور مطلوب"),
  isActive: z.boolean().default(true),
});

type UserForm = z.infer<typeof userSchema>;

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const roles = [
    { value: "manager", label: "مدير" },
    { value: "it_admin", label: "مدير تقنية المعلومات" },
    { value: "data_entry", label: "موظف إدخال بيانات" },
    { value: "purchasing", label: "موظف مشتريات" },
  ];

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: undefined,
      isActive: true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserForm) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم إنشاء المستخدم",
        description: `تم إنشاء المستخدم ${data.username} بنجاح`,
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message || "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserForm) => {
    createUserMutation.mutate(data);
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
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
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
            <div>
              <Label htmlFor="username">اسم المستخدم *</Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="اسم المستخدم للدخول"
                  className="pl-10"
                  {...form.register("username")}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {form.formState.errors.username && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="كلمة مرور قوية"
                  className="pl-10"
                  {...form.register("password")}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="fullName">الاسم الكامل *</Label>
              <Input
                id="fullName"
                placeholder="الاسم الكامل للموظف"
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="role">الدور والصلاحيات *</Label>
              <div className="relative">
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value)}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="اختر دور المستخدم" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              </div>
              {form.formState.errors.role && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="isActive">حالة المستخدم</Label>
              <Select
                value={form.watch("isActive") ? "active" : "inactive"}
                onValueChange={(value) => form.setValue("isActive", value === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role Description */}
          {form.watch("role") && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">صلاحيات هذا الدور:</h4>
              <div className="text-sm text-blue-700">
                {form.watch("role") === "manager" && (
                  <ul className="space-y-1">
                    <li>• جميع الصلاحيات في النظام</li>
                    <li>• إدارة المستخدمين والأدوار</li>
                    <li>• عرض التقارير المالية والإدارية</li>
                    <li>• الوصول لجميع البيانات</li>
                  </ul>
                )}
                {form.watch("role") === "it_admin" && (
                  <ul className="space-y-1">
                    <li>• إدارة المستخدمين وحظرهم</li>
                    <li>• إعدادات النظام والأمان</li>
                    <li>• النسخ الاحتياطية</li>
                    <li>• مراقبة أداء النظام</li>
                  </ul>
                )}
                {form.watch("role") === "data_entry" && (
                  <ul className="space-y-1">
                    <li>• إدخال طلبات التسعير</li>
                    <li>• إدارة الأصناف والعملاء</li>
                    <li>• عرض التقارير الأساسية</li>
                    <li>• إنشاء أوامر الشراء</li>
                  </ul>
                )}
                {form.watch("role") === "purchasing" && (
                  <ul className="space-y-1">
                    <li>• عرض أوامر الشراء وحالتها</li>
                    <li>• عرض التقارير والإحصائيات</li>
                    <li>• لا يمكن رؤية الأسعار</li>
                    <li>• متابعة حالة الطلبات</li>
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createUserMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء المستخدم"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}