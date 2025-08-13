import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { canAccessSection } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Eye, 
  Edit, 
  Trash2,
  Save,
  X,
  Phone,
  Mail,
  UserCheck
} from "lucide-react";

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string;
  isActive: boolean;
  isOnline: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// نموذج إضافة مستخدم جديد
function AddUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "data_entry",
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/users/create", userData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء المستخدم بنجاح",
        description: "تم إضافة المستخدم الجديد إلى النظام"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setFormData({
        username: "",
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "data_entry",
        isActive: true
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message || "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.fullName.trim() || !formData.password.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    createUserMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* اسم المستخدم */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-right">اسم المستخدم *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="اسم المستخدم للدخول"
            className="text-right"
            required
          />
        </div>

        {/* كلمة المرور */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-right">كلمة المرور *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="كلمة مرور قوية"
            className="text-right"
            required
          />
        </div>

        {/* الاسم الكامل */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-right">الاسم الكامل *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="الاسم الكامل للموظف"
            className="text-right"
            required
          />
        </div>

        {/* رقم الهاتف */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-right">رقم الهاتف</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="01xxxxxxxxx"
            className="text-right"
            dir="ltr"
          />
        </div>

        {/* البريد الإلكتروني */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-right">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="example@company.com"
            className="text-right"
            dir="ltr"
          />
        </div>

        {/* الدور والصلاحيات */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-right">الدور والصلاحيات *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
            <SelectTrigger className="text-right">
              <SelectValue placeholder="اختر دور المستخدم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data_entry">إدخال بيانات</SelectItem>
              <SelectItem value="purchasing">مشتريات</SelectItem>
              <SelectItem value="accounting">محاسبة</SelectItem>
              <SelectItem value="it_admin">مدير تقنية المعلومات</SelectItem>
              <SelectItem value="manager">مدير</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* تفعيل الحساب */}
      <div className="flex items-center justify-between">
        <Label htmlFor="isActive" className="text-sm font-medium">
          تفعيل الحساب
        </Label>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline">
          إلغاء
        </Button>
        <Button 
          type="submit" 
          disabled={createUserMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {createUserMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              إضافة المستخدم
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function GeneralAdmin() {
  const { user } = useAuth();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  // التحقق من الصلاحيات
  if (!user || !canAccessSection(user, "admin")) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            غير مصرح لك بالوصول
          </h3>
          <p className="text-red-700">
            ليس لديك الصلاحيات اللازمة للوصول إلى الإدارة العامة
          </p>
        </div>
      </div>
    );
  }

  // جلب قائمة المستخدمين
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  const users = usersData?.success ? (usersData.users || []) : (usersData || []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الإدارة العامة</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة النظام والمستخدمين والصلاحيات</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-right">إضافة مستخدم جديد</DialogTitle>
              </DialogHeader>
              <AddUserForm onSuccess={() => setIsAddUserDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              مجموع جميع حسابات المستخدمين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u: User) => u.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              الحسابات المفعلة والجاهزة للاستخدام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متصل الآن</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u: User) => u.isOnline).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              المستخدمون المتصلون حالياً
            </p>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إدارة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل المستخدمين...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد مستخدمين</h3>
              <p className="text-gray-500 mb-4">لم يتم إنشاء أي مستخدمين بعد</p>
              <Button 
                onClick={() => setIsAddUserDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                إضافة أول مستخدم
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>@{user.username}</span>
                        {user.email && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={user.isActive ? "default" : "secondary"}
                      className={user.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {user.isActive ? "نشط" : "معطل"}
                    </Badge>
                    {user.isOnline && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        متصل
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {user.role === "manager" ? "مدير" :
                       user.role === "it_admin" ? "مدير تقنية" :
                       user.role === "accounting" ? "محاسبة" :
                       user.role === "purchasing" ? "مشتريات" :
                       "إدخال بيانات"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* أدوات إدارية إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              الإعدادات العامة
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              إدارة الصلاحيات
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              أدوات المراقبة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" />
              سجل النشاطات
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              المستخدمون النشطون
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}