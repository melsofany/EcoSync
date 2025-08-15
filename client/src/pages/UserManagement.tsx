import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Users, Plus, Shield, Edit, Trash2, UserPlus, Database, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const userFormSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  email: z.string().email("بريد إلكتروني صحيح مطلوب").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["manager", "it_admin", "data_entry", "purchasing", "accounting"])
});

type UserFormData = z.infer<typeof userFormSchema>;

interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const roleLabels: Record<string, string> = {
  manager: "مدير",
  it_admin: "مدير تقني",
  data_entry: "إدخال بيانات",
  purchasing: "مشتريات",
  accounting: "محاسبة"
};

const getRolePermissions = (role: string) => {
  const basePermissions = {
    dashboard: true,
    quotations: { view: true, create: false, edit: false, delete: false },
    items: { view: true, create: false, edit: false, delete: false },
    clients: { view: true, create: false, edit: false, delete: false },
    suppliers: { view: true, create: false, edit: false, delete: false },
    pricing: { view: false, create: false, edit: false, delete: false },
    purchase_orders: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    admin: { view: false, create: false, edit: false, delete: false }
  };

  switch (role) {
    case "manager":
      return {
        ...basePermissions,
        quotations: { view: true, create: true, edit: true, delete: true },
        items: { view: true, create: true, edit: true, delete: true },
        clients: { view: true, create: true, edit: true, delete: true },
        suppliers: { view: true, create: true, edit: true, delete: true },
        pricing: { view: true, create: true, edit: true, delete: true },
        purchase_orders: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, create: true, edit: true, delete: false },
        admin: { view: true, create: true, edit: true, delete: true }
      };
    case "it_admin":
      return {
        ...basePermissions,
        quotations: { view: true, create: true, edit: true, delete: false },
        items: { view: true, create: true, edit: true, delete: false },
        clients: { view: true, create: true, edit: true, delete: false },
        suppliers: { view: true, create: true, edit: true, delete: false },
        pricing: { view: true, create: false, edit: false, delete: false },
        purchase_orders: { view: true, create: false, edit: false, delete: false },
        reports: { view: true, create: true, edit: false, delete: false },
        admin: { view: true, create: false, edit: true, delete: false }
      };
    case "data_entry":
      return {
        ...basePermissions,
        quotations: { view: true, create: true, edit: true, delete: false },
        items: { view: true, create: true, edit: true, delete: false },
        clients: { view: true, create: true, edit: false, delete: false },
        suppliers: { view: true, create: false, edit: false, delete: false }
      };
    case "purchasing":
      return {
        ...basePermissions,
        quotations: { view: true, create: false, edit: false, delete: false },
        items: { view: true, create: false, edit: false, delete: false },
        suppliers: { view: true, create: true, edit: true, delete: false },
        pricing: { view: true, create: true, edit: true, delete: false },
        purchase_orders: { view: true, create: true, edit: true, delete: false }
      };
    case "accounting":
      return {
        ...basePermissions,
        quotations: { view: true, create: false, edit: false, delete: false },
        purchase_orders: { view: true, create: false, edit: false, delete: false },
        reports: { view: true, create: true, edit: false, delete: false },
        pricing: { view: true, create: false, edit: false, delete: false }
      };
    default:
      return basePermissions;
  }
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is manager
  if (currentUser?.role !== "manager") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">غير مصرح بالدخول</h2>
            <p className="text-red-600">هذه الصفحة متاحة فقط للمدراء</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const permissions = getRolePermissions(userData.role);
      const response = await apiRequest("/api/users/create", "POST", {
        ...userData,
        permissions
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء المستخدم بنجاح"
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المستخدم",
        variant: "destructive"
      });
    }
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      role: "data_entry"
    }
  });

  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  // Check if response has success property or is direct data
  const users = usersData?.success ? (usersData.users || []) : (usersData || []);
  
  // معالجة خطأ Unauthorized
  const isUnauthorized = error && (error as any).status === 401;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* شريط إعلام للمستخدمين غير المسجلين */}
      {isUnauthorized && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                يرجى تسجيل الدخول
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>للوصول لإدارة المستخدمين، يرجى تسجيل الدخول باستخدام: <strong>admin</strong> / <strong>admin123</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="text-gray-600 dark:text-gray-400">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المستخدم الجديد وحدد دوره في النظام
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="كلمة المرور" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="البريد الإلكتروني" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="رقم الهاتف" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدور</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الدور" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manager">مدير</SelectItem>
                            <SelectItem value="it_admin">مدير تقني</SelectItem>
                            <SelectItem value="data_entry">إدخال بيانات</SelectItem>
                            <SelectItem value="purchasing">مشتريات</SelectItem>
                            <SelectItem value="accounting">محاسبة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createUserMutation.isPending}
                      className="flex-1"
                    >
                      {createUserMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* إحصائيات المستخدمين */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u: User) => u.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدراء</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u: User) => u.role === 'manager').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدراء التقنيون</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {users.filter((u: User) => u.role === 'it_admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">خطأ في تحميل البيانات</p>
              {!isUnauthorized && <p className="text-sm text-gray-500 mt-1">تأكد من اتصال الإنترنت</p>}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا يوجد مستخدمون بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-medium">المستخدم</th>
                    <th className="text-right py-3 px-4 font-medium">الدور</th>
                    <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 font-medium">تاريخ الإنشاء</th>
                    <th className="text-right py-3 px-4 font-medium">آخر دخول</th>
                    <th className="text-center py-3 px-4 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                          {user.email && <div className="text-sm text-gray-500">{user.email}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.role === 'manager' ? 'default' : 'secondary'}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لم يدخل بعد'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}