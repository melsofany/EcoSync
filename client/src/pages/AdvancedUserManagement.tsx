import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Ban,
  CheckCircle,
  XCircle,
  Camera,
  Key,
  Monitor,
  Clock,
  UserX,
  UserCheck,
  Settings
} from 'lucide-react';

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
  displayName: string;
  description: string;
  category: string;
}

export default function AdvancedUserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

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

  // جلب المستخدمين
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/sheets-users'],
    refetchInterval: 30000
  });

  // جلب الصلاحيات
  const { data: permissionsData } = useQuery({
    queryKey: ['/api/permissions']
  });

  const users = usersData?.users || [];
  const permissions = permissionsData?.permissions || [];

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'لم يسجل دخول';
    return new Date(dateString).toLocaleString('ar-EG');
  };

  if (usersLoading) {
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
                          setIsEditUserOpen(true);
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

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الصلاحيات</CardTitle>
              <CardDescription>
                سيتم إضافة نظام إدارة الصلاحيات هنا
              </CardDescription>
            </CardHeader>
          </Card>
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