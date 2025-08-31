import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Users, Shield, Settings, Bot, UserPlus } from 'lucide-react';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  canAccessBot: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Permission {
  id: string;
  permissionName: string;
  displayName: string;
  category: string;
  description: string;
  isActive: boolean;
}

export default function UserPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'data_entry',
    canAccessBot: false
  });
  const [showCreateUser, setShowCreateUser] = useState(false);

  // جلب المستخدمين من Google Sheets
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/sheets-users'],
    refetchInterval: 30000 // تحديث كل 30 ثانية
  });

  // جلب الصلاحيات
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions']
  });

  // تحديث صلاحية الوصول للبوت
  const updateBotAccessMutation = useMutation({
    mutationFn: async ({ username, canAccess }: { username: string; canAccess: boolean }) => {
      const response = await apiRequest(`/api/bot-access/${username}`, 'PATCH', { canAccess });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحديث",
        description: data.message || "تم تحديث صلاحية الوصول للبوت بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث صلاحية الوصول للبوت",
        variant: "destructive",
      });
    }
  });

  // إنشاء مستخدم جديد
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest('POST', '/api/sheets-users', userData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الإنشاء",
        description: data.message || "تم إنشاء المستخدم بنجاح",
      });
      setShowCreateUser(false);
      setNewUser({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: 'data_entry',
        canAccessBot: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المستخدم",
        variant: "destructive",
      });
    }
  });

  // تهيئة أوراق المستخدمين
  const initializeSheetsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/initialize-user-sheets');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التهيئة",
        description: data.message || "تم تهيئة أوراق المستخدمين بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تهيئة الأوراق",
        variant: "destructive",
      });
    }
  });

  const users = usersData?.users || [];
  const permissions = permissionsData?.permissions || [];

  const handleBotAccessChange = (username: string, canAccess: boolean) => {
    updateBotAccessMutation.mutate({ username, canAccess });
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.fullName || !newUser.password) {
      toast({
        title: "خطأ",
        description: "اسم المستخدم والاسم الكامل وكلمة المرور مطلوبة",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'it_admin': return 'bg-red-100 text-red-800';
      case 'purchasing': return 'bg-blue-100 text-blue-800';
      case 'accounting': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      'manager': 'مدير',
      'it_admin': 'مدير تقني',
      'purchasing': 'مشتريات',
      'accounting': 'محاسبة',
      'data_entry': 'إدخال بيانات'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  if (usersLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            إدارة المستخدمين والصلاحيات
          </h1>
          <p className="text-gray-600 mt-1">إدارة المستخدمين وصلاحية الوصول للبوت</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => initializeSheetsMutation.mutate()}
            disabled={initializeSheetsMutation.isPending}
            variant="outline"
          >
            <Settings className="h-4 w-4 ml-2" />
            تهيئة الأوراق
          </Button>
          <Button
            onClick={() => setShowCreateUser(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 ml-2" />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">المستخدمين النشطين</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">الوصول للبوت</p>
                <p className="text-2xl font-bold">{users.filter(u => u.canAccessBot).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">الصلاحيات المتاحة</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المستخدمين المسجلين
          </CardTitle>
          <CardDescription>
            إدارة المستخدمين وصلاحيات الوصول للبوت
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-800 font-semibold">
                      {user.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.fullName}</h3>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      {user.isActive && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          نشط
                        </Badge>
                      )}
                      {user.canAccessBot && (
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          <Bot className="h-3 w-3 ml-1" />
                          وصول للبوت
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`bot-access-${user.id}`} className="text-sm">
                      الوصول للبوت
                    </Label>
                    <Switch
                      id={`bot-access-${user.id}`}
                      checked={user.canAccessBot}
                      onCheckedChange={(checked) => handleBotAccessChange(user.username, checked)}
                      disabled={updateBotAccessMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مستخدمين مسجلين</p>
                <p className="text-sm">ابدأ بإنشاء مستخدم جديد أو تهيئة الأوراق</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الصلاحيات المتاحة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            الصلاحيات المتاحة في النظام
          </CardTitle>
          <CardDescription>
            قائمة جميع الصلاحيات المتاحة مجمعة حسب الفئة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(
                permissions.reduce((groups, permission) => {
                  if (!groups[permission.category]) {
                    groups[permission.category] = [];
                  }
                  groups[permission.category].push(permission);
                  return groups;
                }, {} as Record<string, Permission[]>)
              ).map(([category, categoryPermissions]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-2 capitalize">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{permission.displayName}</span>
                          <Badge variant={permission.isActive ? "default" : "secondary"}>
                            {permission.isActive ? "نشط" : "معطل"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{permission.description}</p>
                        <code className="text-xs bg-gray-100 px-1 rounded mt-1 block">
                          {permission.permissionName}
                        </code>
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد صلاحيات محددة</p>
              <p className="text-sm">ابدأ بتهيئة أوراق الصلاحيات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء مستخدم جديد */}
      <AlertDialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>إنشاء مستخدم جديد</AlertDialogTitle>
            <AlertDialogDescription>
              أدخل بيانات المستخدم الجديد. سيتم حفظ البيانات في Google Sheets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">اسم المستخدم *</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="fullName">الاسم الكامل *</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="أحمد محمد"
              />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="كلمة مرور قوية"
              />
            </div>
            <div>
              <Label htmlFor="role">الدور</Label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="data_entry">إدخال بيانات</option>
                <option value="purchasing">مشتريات</option>
                <option value="accounting">محاسبة</option>
                <option value="manager">مدير</option>
                <option value="it_admin">مدير تقني</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="canAccessBot"
                checked={newUser.canAccessBot}
                onCheckedChange={(checked) => setNewUser({ ...newUser, canAccessBot: checked })}
              />
              <Label htmlFor="canAccessBot">السماح بالوصول للبوت</Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}