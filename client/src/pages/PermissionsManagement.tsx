import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Users, Settings, Eye, Edit, Trash2, Plus, Check, X, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  section: string;
  subsection: string;
  name: string;
  description: string;
  type: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'admin';
  category: 'data' | 'screen' | 'feature' | 'admin';
  isActive: boolean;
}

interface UserPermission {
  userId: string;
  username: string;
  permissionId: string;
  granted: boolean;
  grantedBy: string;
  grantedAt: string;
  updatedAt: string;
}

const sectionLabels: Record<string, string> = {
  dashboard: "لوحة التحكم",
  quotations: "طلبات التسعير", 
  items: "إدارة الأصناف",
  clients: "إدارة العملاء",
  suppliers: "إدارة الموردين",
  pricing: "التسعير",
  purchase_orders: "أوامر الشراء",
  reports: "التقارير",
  analytics: "الإحصائيات",
  admin: "الإدارة العامة",
  activity: "سجل النشاطات",
  settings: "الإعدادات"
};

const typeLabels: Record<string, string> = {
  view: "عرض",
  create: "إنشاء",
  edit: "تعديل", 
  delete: "حذف",
  export: "تصدير",
  admin: "إدارة"
};

const categoryLabels: Record<string, string> = {
  data: "بيانات",
  screen: "شاشة",
  feature: "ميزة",
  admin: "إدارية"
};

export default function PermissionsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedUser, setSelectedUser] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب جميع الصلاحيات
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      const response = await apiRequest('/api/permissions', 'GET');
      return response.json();
    }
  });

  // جلب المستخدمين
  const { data: usersData } = useQuery({
    queryKey: ['/api/debug-users'],
    queryFn: async () => {
      const response = await apiRequest('/api/debug-users', 'GET');
      return response.json();
    }
  });

  // جلب صلاحيات المستخدم المحدد
  const { data: userPermissionsData } = useQuery({
    queryKey: ['/api/user-permissions', selectedUser],
    enabled: !!selectedUser,
    queryFn: async () => {
      const response = await apiRequest(`/api/user-permissions/${selectedUser}`, 'GET');
      return response.json();
    }
  });

  // منح صلاحية
  const grantPermissionMutation = useMutation({
    mutationFn: async ({ userId, username, permissionId }: { userId: string, username: string, permissionId: string }) => {
      const response = await apiRequest('/api/grant-permission', 'POST', { userId, username, permissionId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم منح الصلاحية بنجاح" });
      queryClient.invalidateQueries({ queryKey: ['/api/user-permissions'] });
    },
    onError: () => {
      toast({ title: "خطأ في منح الصلاحية", variant: "destructive" });
    }
  });

  // تهيئة نظام الصلاحيات
  const initPermissionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/init-permissions', 'POST');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "تم تهيئة نظام الصلاحيات بنجاح", description: data.details });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
    },
    onError: () => {
      toast({ title: "خطأ في تهيئة النظام", variant: "destructive" });
    }
  });

  const permissions = permissionsData?.permissions || [];
  const users = usersData?.users || [];
  const userPermissions = userPermissionsData?.userPermissions || [];

  // تصفية الصلاحيات
  const filteredPermissions = permissions.filter((permission: Permission) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === "all" || permission.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  // التحقق من وجود صلاحية للمستخدم
  const hasPermission = (permissionId: string) => {
    return userPermissions.some((up: UserPermission) => up.permissionId === permissionId && up.granted);
  };

  // منح/إلغاء صلاحية
  const togglePermission = (permission: Permission, granted: boolean) => {
    if (!selectedUser) return;
    
    const selectedUserData = users.find((u: any) => u.id === selectedUser);
    if (!selectedUserData) return;

    if (granted) {
      grantPermissionMutation.mutate({
        userId: selectedUser,
        username: selectedUserData.username,
        permissionId: permission.id
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الصلاحيات</h1>
          <p className="text-muted-foreground">نظام إدارة الصلاحيات الشامل</p>
        </div>
        
        <Button 
          onClick={() => initPermissionsMutation.mutate()}
          disabled={initPermissionsMutation.isPending}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          تهيئة النظام
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الصلاحيات</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المستخدمون</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الأقسام</p>
                <p className="text-2xl font-bold">{Object.keys(sectionLabels).length}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الصلاحيات النشطة</p>
                <p className="text-2xl font-bold">{permissions.filter((p: Permission) => p.isActive).length}</p>
              </div>
              <Check className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle>أدوات التحكم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>البحث في الصلاحيات</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن صلاحية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <Label>تصفية حسب القسم</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {Object.entries(sectionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>اختر مستخدم</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستخدم..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول الصلاحيات */}
      <Card>
        <CardHeader>
          <CardTitle>الصلاحيات المتاحة</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedUser ? `إدارة صلاحيات المستخدم المحدد` : 'اختر مستخدماً لإدارة صلاحياته'}
          </p>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="text-center py-8">جاري تحميل الصلاحيات...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>القسم</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الحالة</TableHead>
                    {selectedUser && <TableHead>منح الصلاحية</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission: Permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {sectionLabels[permission.section] || permission.section}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {permission.description}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={permission.type === 'admin' ? 'destructive' : 'secondary'}
                        >
                          {typeLabels[permission.type] || permission.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[permission.category] || permission.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {permission.isActive ? (
                          <Badge className="bg-green-100 text-green-800">نشط</Badge>
                        ) : (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                      </TableCell>
                      {selectedUser && (
                        <TableCell>
                          <Checkbox
                            checked={hasPermission(permission.id)}
                            onCheckedChange={(checked) => 
                              togglePermission(permission, checked as boolean)
                            }
                            disabled={grantPermissionMutation.isPending}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}