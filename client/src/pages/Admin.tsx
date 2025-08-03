import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NewUserModal from "@/components/modals/NewUserModal";
import EditUserModal from "@/components/modals/EditUserModal";
import { UserDisplayName } from "@/components/UserDisplayName";
import { UserAvatar } from "@/components/UserAvatar";
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
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Edit,
  CheckCircle
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
  
  const [activeSection, setActiveSection] = useState<string>("");
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    deepSeekApiKey: "",
    sessionTimeout: 30,
    maxLoginAttempts: 3,
    autoBackup: "daily"
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: user ? hasRole(user, ["manager", "it_admin"]) : false,
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/activity"],
    enabled: user ? hasRole(user, ["manager", "it_admin"]) : false,
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

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("PATCH", `/api/users/${userId}`, { isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم إلغاء حظر المستخدم",
        description: "تم إلغاء حظر المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء حظر المستخدم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المستخدم",
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

  if (!user || !hasRole(user, ["manager", "it_admin"])) {
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

  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    // Allow local public-objects URLs and external image URLs
    if (url.startsWith('/public-objects/')) {
      return true;
    }
    // Check if URL is a direct image link
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.includes(ext)) && 
           !lowercaseUrl.includes('ibb.co/') && // Exclude ImgBB page links
           (lowercaseUrl.startsWith('http://') || lowercaseUrl.startsWith('https://'));
  };

  const usersArray = Array.isArray(users) ? users : [];
  const onlineUsers = usersArray.filter((u: any) => u.isOnline === true);
  const totalUsers = usersArray.length || 0;
  
  // Debug: log users online status
  console.log('Users array:', usersArray.map(u => ({ name: u.fullName, isOnline: u.isOnline })));
  console.log('Online users count:', onlineUsers.length);

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
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={() => setActiveSection(activeSection === "users" ? "" : "users")}
            >
              {activeSection === "users" ? "إخفاء" : "إدارة"} المستخدمين
              <ArrowRight className={`h-4 w-4 mr-2 transition-transform ${activeSection === "users" ? "rotate-90" : ""}`} />
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
            <Button 
              className="w-full bg-green-500 hover:bg-green-600"
              onClick={() => setActiveSection(activeSection === "roles" ? "" : "roles")}
            >
              {activeSection === "roles" ? "إخفاء" : "إدارة"} الصلاحيات
              <ArrowRight className={`h-4 w-4 mr-2 transition-transform ${activeSection === "roles" ? "rotate-90" : ""}`} />
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
            <Button 
              className="w-full bg-purple-500 hover:bg-purple-600"
              onClick={() => setActiveSection(activeSection === "database" ? "" : "database")}
            >
              {activeSection === "database" ? "إخفاء" : "إدارة"} البيانات
              <ArrowRight className={`h-4 w-4 mr-2 transition-transform ${activeSection === "database" ? "rotate-90" : ""}`} />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section */}
      {activeSection === "users" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="h-5 w-5" />
              <span>إدارة المستخدمين</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">إضافة مستخدم جديد</h4>
                <Button 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => setIsNewUserModalOpen(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مستخدم
                </Button>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  يمكن لمدير تقنية المعلومات إضافة مستخدمين جدد وتعديل بياناتهم وحظرهم عند الحاجة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Management Section */}
      {activeSection === "roles" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Shield className="h-5 w-5" />
              <span>إدارة الأدوار والصلاحيات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-blue-600 mb-2">مدير (Manager)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ جميع الصلاحيات</li>
                  <li>✓ التقارير المالية</li>
                  <li>✓ إدارة المستخدمين</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-600 mb-2">مدير تقنية المعلومات</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ إدارة المستخدمين</li>
                  <li>✓ إعدادات النظام</li>
                  <li>✓ النسخ الاحتياطية</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-orange-600 mb-2">موظف إدخال البيانات</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ إدخال طلبات التسعير</li>
                  <li>✓ إدارة الأصناف</li>
                  <li>✓ التقارير الأساسية</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-purple-600 mb-2">موظف المشتريات</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ عرض التقارير</li>
                  <li>✓ أوامر الشراء</li>
                  <li>✗ لا يرى الأسعار</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Management Section */}
      {activeSection === "database" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Database className="h-5 w-5" />
              <span>إدارة قاعدة البيانات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">النسخ الاحتياطية</h4>
                <div className="space-y-2">
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    <Download className="h-4 w-4 ml-2" />
                    إنشاء نسخة احتياطية الآن
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 ml-2" />
                    استعادة من نسخة احتياطية
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">صيانة قاعدة البيانات</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تحسين الأداء
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-800">
                    <Trash2 className="h-4 w-4 ml-2" />
                    مسح البيانات المؤقتة
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                تحذير: عمليات إدارة قاعدة البيانات قد تؤثر على أداء النظام. تأكد من إنشاء نسخة احتياطية قبل القيام بأي تغييرات.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Activity className="h-5 w-5" />
            <span>سجل النشاط</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities && activities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.slice(0, 10).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <UserAvatar 
                    user={{ 
                      fullName: activity.userFullName || activity.username,
                      profileImage: activity.userProfileImage 
                    }} 
                    size="sm" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="font-medium text-sm text-gray-900">
                        {activity.userFullName || activity.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.action}
                      {activity.details && (
                        <span className="text-gray-500"> - {activity.details}</span>
                      )}
                    </p>
                    {activity.entityType && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded mt-1">
                        {activity.entityType}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد أنشطة حديثة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="h-5 w-5" />
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
                  {usersArray.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        لا يوجد مستخدمون
                      </TableCell>
                    </TableRow>
                  ) : (
                    usersArray.map((userItem: any) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <UserDisplayName 
                            user={userItem}
                            showUsername={true}
                            showEmail={true}
                            showPhone={true}
                            avatarSize="md"
                          />
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
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {/* Edit Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(userItem)}
                                className="text-blue-600 hover:text-blue-800"
                                title="تعديل المستخدم"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              {/* Block/Unblock Button - Always show both options for clarity */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => blockUserMutation.mutate(userItem.id)}
                                disabled={blockUserMutation.isPending || !userItem.isActive}
                                className={`${userItem.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-gray-400'}`}
                                title={userItem.isActive ? "حظر المستخدم" : "المستخدم محظور"}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unblockUserMutation.mutate(userItem.id)}
                                disabled={unblockUserMutation.isPending || userItem.isActive}
                                className={`${!userItem.isActive ? 'text-green-600 hover:text-green-800' : 'text-gray-400'}`}
                                title={!userItem.isActive ? "إلغاء حظر المستخدم" : "المستخدم نشط"}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>

                              {/* Delete Button */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-800"
                                    title="حذف المستخدم"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد حذف المستخدم</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من حذف المستخدم "{userItem.fullName}"؟
                                      هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بيانات المستخدم.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(userItem.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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

      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
      />
      
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
