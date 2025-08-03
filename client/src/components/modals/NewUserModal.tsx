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
import { X, User, Lock, Shield, Mail, Phone, Camera, Upload } from "lucide-react";
import ProfileImageUploader from "@/components/ProfileImageUploader";

const userSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل").optional().or(z.literal("")),
  profileImage: z.string().optional(),
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
      email: "",
      phone: "",
      profileImage: "",
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
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
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

            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01234567890"
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
              <Label htmlFor="profileImage">الصورة الشخصية</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {/* Profile Image Preview */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden shadow-lg">
                    {form.watch("profileImage") ? (
                      <img 
                        src={form.watch("profileImage").startsWith('/profile-images/') 
                          ? form.watch("profileImage") 
                          : form.watch("profileImage")
                        } 
                        alt="صورة المستخدم" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {!form.watch("profileImage") && (
                      <div className="text-white text-xl font-bold">
                        {form.watch("fullName") 
                          ? form.watch("fullName").split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                          : <Camera className="h-8 w-8" />
                        }
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <ProfileImageUploader
                        currentImageUrl={form.watch("profileImage")}
                        onImageUploaded={(imageUrl) => {
                          form.setValue("profileImage", imageUrl);
                        }}
                      />
                      {form.watch("profileImage") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("profileImage", "")}
                        >
                          <X className="h-4 w-4 mr-1" />
                          إزالة
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      يمكنك رفع صورة شخصية من جهازك (حد أقصى 5 ميجابايت)
                    </div>
                    
                    {/* Manual URL Input (Alternative) */}
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        أو أدخل رابط الصورة يدوياً
                      </summary>
                      <Input
                        id="profileImage"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className="mt-2"
                        {...form.register("profileImage")}
                      />
                    </details>
                  </div>
                </div>
              </div>
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
                    <li>• إدارة الأصناف</li>
                    <li>• التقارير الأساسية</li>
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