import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserPlus, Shield, Database, CheckCircle, XCircle } from "lucide-react";

const userFormSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(2, "الاسم الكامل مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["manager", "it_admin", "data_entry", "purchasing", "accounting"], {
    required_error: "يرجى اختيار دور المستخدم"
  })
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
  isOnline: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const roleLabels = {
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
    purchaseOrders: { view: true, create: false, edit: false, delete: false },
    supplierPricing: { view: false, create: false, edit: false, delete: false },
    customerPricing: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, export: false },
    analytics: { view: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false },
    import: { quotations: false, items: false, purchaseOrders: false },
    activity: { view: false },
    pricing: { viewSalePrices: false, viewSupplierPrices: false, viewPurchaseOrderPrices: false, viewCosts: false, viewMargins: false }
  };

  switch (role) {
    case "manager":
      return {
        ...basePermissions,
        quotations: { view: true, create: true, edit: true, delete: true },
        items: { view: true, create: true, edit: true, delete: true },
        clients: { view: true, create: true, edit: true, delete: true },
        suppliers: { view: true, create: true, edit: true, delete: true },
        purchaseOrders: { view: true, create: true, edit: true, delete: true },
        supplierPricing: { view: true, create: true, edit: true, delete: true },
        customerPricing: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, export: true },
        analytics: { view: true },
        admin: { userManagement: true, systemSettings: true, backupRestore: true },
        import: { quotations: true, items: true, purchaseOrders: true },
        activity: { view: true },
        pricing: { viewSalePrices: true, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: true }
      };
    case "it_admin":
      return {
        ...basePermissions,
        quotations: { view: true, create: true, edit: true, delete: false },
        items: { view: true, create: true, edit: true, delete: false },
        clients: { view: true, create: true, edit: true, delete: false },
        suppliers: { view: true, create: true, edit: true, delete: false },
        admin: { userManagement: true, systemSettings: true, backupRestore: true },
        import: { quotations: true, items: true, purchaseOrders: true },
        activity: { view: true }
      };
    case "data_entry":
      return {
        ...basePermissions,
        quotations: { view: true, create: true, edit: true, delete: false },
        items: { view: true, create: true, edit: true, delete: false },
        clients: { view: true, create: true, edit: false, delete: false }
      };
    case "purchasing":
      return {
        ...basePermissions,
        quotations: { view: true, create: false, edit: false, delete: false },
        items: { view: true, create: false, edit: false, delete: false },
        suppliers: { view: true, create: true, edit: true, delete: false },
        purchaseOrders: { view: true, create: true, edit: true, delete: false },
        supplierPricing: { view: true, create: true, edit: true, delete: false }
      };
    case "accounting":
      return {
        ...basePermissions,
        reports: { view: true, export: true },
        analytics: { view: true },
        pricing: { viewSalePrices: true, viewSupplierPrices: false, viewPurchaseOrderPrices: true, viewCosts: false, viewMargins: true }
      };
    default:
      return basePermissions;
  }
};

export default function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // جلب قائمة المستخدمين
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: true
  });

  // إنشاء ورقة المستخدمين
  const createSheetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/users/create-sheet", "POST");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء ورقة المستخدمين في Google Sheets بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء ورقة المستخدمين",
        variant: "destructive"
      });
    }
  });

  // إضافة مستخدم جديد
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="text-gray-600 dark:text-gray-400">إدارة المستخدمين من خلال Google Sheets</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => createSheetMutation.mutate()}
            disabled={createSheetMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            إنشاء ورقة المستخدمين
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  إضافة مستخدم جديد إلى النظام في Google Sheets
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
                          <Input type="password" placeholder="كلمة المرور" {...field} />
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
                          <Input type="email" placeholder="البريد الإلكتروني" {...field} />
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
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* معلومات الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            معلومات النظام
          </CardTitle>
          <CardDescription>
            النظام يستخدم Google Sheets لإدارة المستخدمين والصلاحيات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-700 dark:text-green-400">Google Sheets</div>
              <div className="text-sm text-green-600 dark:text-green-500">متصل</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-blue-700 dark:text-blue-400">المستخدمين</div>
              <div className="text-sm text-blue-600 dark:text-blue-500">{users.length} مستخدم</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold text-purple-700 dark:text-purple-400">الأمان</div>
              <div className="text-sm text-purple-600 dark:text-purple-500">تشفير كامل</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>
            جميع المستخدمين المسجلين في النظام من Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل المستخدمين...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">لا توجد مستخدمين</p>
              <p className="text-sm text-gray-500">قم بإنشاء ورقة المستخدمين أولاً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-semibold">اسم المستخدم</th>
                    <th className="text-right py-3 px-4 font-semibold">الاسم الكامل</th>
                    <th className="text-right py-3 px-4 font-semibold">البريد الإلكتروني</th>
                    <th className="text-right py-3 px-4 font-semibold">الدور</th>
                    <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                    <th className="text-right py-3 px-4 font-semibold">آخر دخول</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-medium">{user.username}</td>
                      <td className="py-3 px-4">{user.fullName}</td>
                      <td className="py-3 px-4">{user.email || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">
                          {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.isOnline ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={user.isOnline ? "text-green-600" : "text-gray-500"}>
                            {user.isOnline ? "متصل" : "غير متصل"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ar-EG') : "لم يسجل دخول"}
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