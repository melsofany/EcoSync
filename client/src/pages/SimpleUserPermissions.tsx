import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Users, 
  Shield, 
  Save,
  Check,
  UserCheck,
  UserPlus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Camera,
  Key,
  Monitor,
  Clock,
  Settings,
  Wifi,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  ipAddress?: string;
  macAddress?: string;
  profileImage?: string;
}

interface Permission {
  id: string;
  permissionName: string;
  displayName: string;
  category: string;
  description: string;
  isActive: boolean;
}

export default function SimpleUserPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('users');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // نموذج إضافة مستخدم جديد
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'data_entry',
    isActive: true,
    canAccessBot: false
  });

  // نموذج تغيير كلمة المرور
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // جلب المستخدمين من Google Sheets
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/sheets-users'],
    refetchInterval: 30000
  });

  // جلب الصلاحيات
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions']
  });

  const users = usersData?.users || [];
  const permissions = permissionsData?.permissions || [];
  const currentUser = users.find((u: User) => u.id === selectedUserId);

  // تحديث الصلاحيات عند اختيار مستخدم جديد
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((u: User) => u.id === userId);
    if (user) {
      setUserPermissions(new Set(user.permissions || []));
    }
  };

  // تحديث صلاحية معينة
  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    const newPermissions = new Set(userPermissions);
    if (checked) {
      newPermissions.add(permissionId);
    } else {
      newPermissions.delete(permissionId);
    }
    setUserPermissions(newPermissions);
  };

  // تحديث صلاحيات المستخدم
  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('لم يتم اختيار مستخدم');
      
      console.log('إرسال طلب تحديث الصلاحيات:', {
        username: currentUser.username,
        permissions: Array.from(userPermissions)
      });
      
      const response = await apiRequest(`/api/user-permissions/${currentUser.username}`, 'PATCH', {
        permissions: Array.from(userPermissions)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('خطأ في الاستجابة:', response.status, errorText);
        throw new Error(`خطأ في الخادم: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('نتيجة تحديث الصلاحيات:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('تم تحديث الصلاحيات بنجاح:', data);
      toast({
        title: "تم التحديث",
        description: `تم حفظ ${Array.from(userPermissions).length} صلاحية للمستخدم ${currentUser?.fullName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث الصلاحيات:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث الصلاحيات",
        variant: "destructive",
      });
    },
  });

  // إضافة مستخدم جديد
  const addUserMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/users', 'POST', newUser);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة المستخدم",
        description: "تم إضافة المستخدم الجديد بنجاح",
      });
      setIsAddUserOpen(false);
      setNewUser({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: 'data_entry',
        isActive: true,
        canAccessBot: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المستخدم",
        variant: "destructive",
      });
    },
  });

  // حذف مستخدم
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/users/${userId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  // حظر/إلغاء حظر مستخدم
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest(`/api/users/${userId}/status`, 'PATCH', { isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث حالة المستخدم",
        description: "تم تحديث حالة المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة المستخدم",
        variant: "destructive",
      });
    },
  });

  // تغيير كلمة المرور
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error('لم يتم اختيار مستخدم');
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('كلمة المرور وتأكيدها غير متطابقين');
      }
      
      const response = await apiRequest(`/api/users/${selectedUser.id}/password`, 'PATCH', {
        newPassword: passwordData.newPassword
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      setIsChangePasswordOpen(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تغيير كلمة المرور",
        variant: "destructive",
      });
    },
  });

  // رفع صورة المستخدم
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedUser) throw new Error('لم يتم اختيار مستخدم');
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/users/${selectedUser.id}/image`, {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم رفع الصورة",
        description: "تم رفع صورة المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع الصورة",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedUser) {
      uploadImageMutation.mutate(file);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'لم يسجل دخول';
    return new Date(dateString).toLocaleString('ar-EG');
  };

  // تجميع الصلاحيات حسب الفئة
  const groupedPermissions = permissions.reduce((acc: any, perm: Permission) => {
    const category = perm.category || 'عام';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {});

  const getRoleLabel = (role: string) => {
    const roles = {
      manager: "مدير",
      it_admin: "مدير تقنية المعلومات", 
      data_entry: "موظف إدخال بيانات",
      purchasing: "موظف مشتريات",
      accounting: "موظف حسابات",
    };
    return roles[role as keyof typeof roles] || role;
  };

  if (usersLoading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          إدارة المستخدمين المتقدمة
        </h1>
        <p className="text-gray-600">
          إدارة شاملة للمستخدمين مع جميع الصلاحيات والميزات المتقدمة
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الصلاحيات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* شريط الأدوات */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    إضافة مستخدم جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات المستخدم الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="اسم المستخدم"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        value={newUser.fullName}
                        onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="الاسم الكامل"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="البريد الإلكتروني"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="كلمة المرور"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">الدور</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">مدير</SelectItem>
                          <SelectItem value="it_admin">مدير تقنية المعلومات</SelectItem>
                          <SelectItem value="data_entry">موظف إدخال بيانات</SelectItem>
                          <SelectItem value="purchasing">موظف مشتريات</SelectItem>
                          <SelectItem value="accounting">موظف حسابات</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => addUserMutation.mutate()}
                      disabled={addUserMutation.isPending}
                    >
                      {addUserMutation.isPending ? 'جاري الإضافة...' : 'إضافة المستخدم'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="text-sm text-gray-500">
              إجمالي المستخدمين: {users.length}
            </div>
          </div>

          {/* قائمة المستخدمين */}
          <div className="grid gap-4">
            {users.map((user: User) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage 
                            src={user.profileImage || `/api/users/${user.id}/avatar`} 
                            alt={user.fullName} 
                          />
                          <AvatarFallback className="text-lg font-semibold">
                            {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0"
                          onClick={() => {
                            setSelectedUser(user);
                            fileInputRef.current?.click();
                          }}
                        >
                          <Camera className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "نشط" : "محظور"}
                          </Badge>
                          {user.canAccessBot && (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              وصول البوت
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-sm text-blue-600">{getRoleLabel(user.role)}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            آخر دخول: {formatDate(user.lastLogin)}
                          </div>
                          {user.ipAddress && (
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              IP: {user.ipAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsChangePasswordOpen(true);
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatusMutation.mutate({ 
                          userId: user.id, 
                          isActive: !user.isActive 
                        })}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedUserId(user.id);
                          setUserPermissions(new Set(user.permissions || []));
                          setActiveTab('permissions');
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف المستخدم {user.fullName}؟ هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>الصلاحيات: {user.permissions?.length || 0}</span>
                      {user.macAddress && (
                        <span>MAC: {user.macAddress}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          {/* اختيار المستخدم للصلاحيات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                اختيار المستخدم
              </CardTitle>
              <CardDescription>
                اختر المستخدم المراد تعديل صلاحياته
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Select value={selectedUserId} onValueChange={handleUserSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر المستخدم..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-gray-500">
                              {user.username} • {getRoleLabel(user.role)}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {currentUser && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">{currentUser.fullName}</h3>
                        <p className="text-sm text-blue-700">
                          {currentUser.username} • {getRoleLabel(currentUser.role)}
                        </p>
                        <p className="text-sm text-blue-600">{currentUser.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={currentUser.isActive ? "default" : "secondary"}>
                          {currentUser.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        {currentUser.canAccessBot && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            وصول البوت
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* الصلاحيات */}
          {currentUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  صلاحيات المستخدم
                </CardTitle>
                <CardDescription>
                  حدد الصلاحيات للمستخدم {currentUser.fullName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">
                      {category}
                    </h3>
                    <div className="grid gap-3">
                      {perms.map((permission: Permission) => (
                        <div 
                          key={permission.id} 
                          className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg border hover:bg-gray-50"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={userPermissions.has(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionToggle(permission.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={permission.id} 
                              className="font-medium cursor-pointer"
                            >
                              {permission.displayName || permission.category}
                            </Label>
                            <p className="text-sm text-gray-600">
                              {permission.description}
                            </p>
                          </div>
                          {userPermissions.has(permission.id) && (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={() => updatePermissionsMutation.mutate()}
                    disabled={updatePermissionsMutation.isPending || !currentUser}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updatePermissionsMutation.isPending ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام</CardTitle>
              <CardDescription>
                سيتم إضافة إعدادات النظام هنا
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      {/* حوار تغيير كلمة المرور */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
            <DialogDescription>
              تغيير كلمة المرور للمستخدم {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="كلمة المرور الجديدة"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="تأكيد كلمة المرور"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => changePasswordMutation.mutate()}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حقل رفع الصورة المخفي */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
}