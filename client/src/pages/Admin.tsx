import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Shield, 
  Database, 
  Key,
  Ban,
  Circle,
  Settings,
  Clock,
  Activity,
  AlertTriangle
} from "lucide-react";

interface SystemSettings {
  deepSeekApiKey: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  autoBackup: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    deepSeekApiKey: "",
    sessionTimeout: 30,
    maxLoginAttempts: 3,
    autoBackup: "daily"
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: hasRole(user, ["manager", "it_admin"]),
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/activity"],
    enabled: hasRole(user, ["manager", "it_admin"]),
  });

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("PATCH", `/api/users/${userId}`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم حظر المستخدم",
        description: "تم حظر المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حظر المستخدم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      await apiRequest("POST", "/api/admin/settings", settings);
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات النظام بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!hasRole(user, ["manager", "it_admin"])) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              غير مصرح لك
            </h3>
            <p className="text-gray-600">
              ليس لديك صلاحية للوصول إلى هذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      manager: "مدير",
      it_admin: "مدير تقنية المعلومات",
      data_entry: "موظف إدخال بيانات",
      purchasing: "موظف مشتريات",
    };
    return roles[role as keyof typeof roles] || role;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onlineUsers = users?.filter((u: any) => u.isOnline) || [];
  const totalUsers = users?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">إدارة النظام</h2>
        <p className="text-gray-600">إعدادات وإدارة المستخدمين والصلاحيات</p>
      </div>

      {/* Admin Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">إدارة المستخدمين</h3>
                <p className="text-sm text-gray-600">{totalUsers} مستخدم مسجل</p>
              </div>
            </div>
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              إدارة المستخدمين
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">الصلاحيات والأدوار</h3>
                <p className="text-sm text-gray-600">4 أدوار مختلفة</p>
              </div>
            </div>
            <Button className="w-full bg-green-500 hover:bg-green-600">
              إدارة الصلاحيات
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">إدارة قاعدة البيانات</h3>
                <p className="text-sm text-gray-600">نسخ احتياطية وصيانة</p>
              </div>
            </div>
            <Button className="w-full bg-purple-500 hover:bg-purple-600">
              إدارة البيانات
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Activity className="h-5 w-5" />
              <span>المستخدمون النشطون</span>
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {onlineUsers.length} مستخدم متصل
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full loading-spinner"></div>
              <span className="mr-3">جاري تحميل المستخدمين...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">آخر نشاط</TableHead>
                    <TableHead className="text-right">عنوان IP</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        لا يوجد مستخدمون
                      </TableCell>
                    </TableRow>
                  ) : (
                    users?.map((userItem: any) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {getInitials(userItem.fullName)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{userItem.fullName}</p>
                              <p className="text-sm text-gray-500">@{userItem.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleLabel(userItem.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Circle className={`w-2 h-2 rounded-full ${
                              userItem.isOnline ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'
                            }`} />
                            <span className={`text-sm ${
                              userItem.isOnline ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {userItem.isOnline ? 'متصل' : 'غير متصل'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {userItem.lastActivityAt ? formatTime(userItem.lastActivityAt) : 'غير محدد'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {userItem.ipAddress || 'غير محدد'}
                        </TableCell>
                        <TableCell>
                          {userItem.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => blockUserMutation.mutate(userItem.id)}
                              disabled={blockUserMutation.isPending || !userItem.isActive}
                              className="text-red-600 hover:text-red-800"
                              title={userItem.isActive ? "حظر المستخدم" : "محظور"}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Settings className="h-5 w-5" />
            <span>إعدادات النظام</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="deepSeekApiKey" className="flex items-center space-x-2 space-x-reverse">
                  <Key className="h-4 w-4" />
                  <span>Deep Seek API Key</span>
                </Label>
                <Input
                  id="deepSeekApiKey"
                  type="password"
                  placeholder="API Key"
                  value={systemSettings.deepSeekApiKey}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    deepSeekApiKey: e.target.value
                  })}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {/* DEEP SEEK API: Configuration for AI integration */}
                  مفتاح API الخاص بخدمة Deep Seek للذكاء الاصطناعي
                </p>
              </div>

              <div>
                <Label htmlFor="sessionTimeout" className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="h-4 w-4" />
                  <span>مهلة انتهاء الجلسة (دقيقة)</span>
                </Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="480"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    sessionTimeout: Number(e.target.value)
                  })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="maxLoginAttempts">حد أقصى لمحاولات تسجيل الدخول</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min="1"
                  max="10"
                  value={systemSettings.maxLoginAttempts}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    maxLoginAttempts: Number(e.target.value)
                  })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="autoBackup">نسخ احتياطية تلقائية</Label>
                <Select
                  value={systemSettings.autoBackup}
                  onValueChange={(value) => setSystemSettings({
                    ...systemSettings,
                    autoBackup: value
                  })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">يومياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                    <SelectItem value="monthly">شهرياً</SelectItem>
                    <SelectItem value="disabled">معطل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => saveSettingsMutation.mutate(systemSettings)}
                disabled={saveSettingsMutation.isPending}
                className="px-6"
              >
                {saveSettingsMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 ml-2" />
                    حفظ الإعدادات
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
