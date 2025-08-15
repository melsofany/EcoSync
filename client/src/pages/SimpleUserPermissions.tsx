import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  UserCheck
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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());

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
  const selectedUser = users.find((u: User) => u.id === selectedUserId);

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
      if (!selectedUser) throw new Error('لم يتم اختيار مستخدم');
      
      const response = await apiRequest(`/api/user-permissions/${selectedUser.username}`, 'PATCH', {
        permissions: Array.from(userPermissions)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحديث",
        description: "تم حفظ صلاحيات المستخدم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sheets-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الصلاحيات",
        variant: "destructive",
      });
    },
  });

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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          إدارة صلاحيات المستخدمين
        </h1>
        <p className="text-gray-600">
          اختر المستخدم وحدد الصلاحيات المطلوبة له
        </p>
      </div>

      <div className="grid gap-6">
        {/* اختيار المستخدم */}
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

              {selectedUser && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">{selectedUser.fullName}</h3>
                      <p className="text-sm text-blue-700">
                        {selectedUser.username} • {getRoleLabel(selectedUser.role)}
                      </p>
                      <p className="text-sm text-blue-600">{selectedUser.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                        {selectedUser.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                      {selectedUser.canAccessBot && (
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
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                صلاحيات المستخدم
              </CardTitle>
              <CardDescription>
                ضع علامة صح أمام الصلاحيات المراد منحها للمستخدم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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
              </div>

              <div className="mt-8 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    تم اختيار {userPermissions.size} من {permissions.length} صلاحية
                  </div>
                  <Button 
                    onClick={() => updatePermissionsMutation.mutate()}
                    disabled={updatePermissionsMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updatePermissionsMutation.isPending ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* رسالة عند عدم اختيار مستخدم */}
        {!selectedUser && (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لم يتم اختيار مستخدم
              </h3>
              <p className="text-gray-600 text-center">
                اختر مستخدماً من القائمة أعلاه لبدء تعديل صلاحياته
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}