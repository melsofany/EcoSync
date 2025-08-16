import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bot, Send, CheckCircle, XCircle, Users, MessageSquare, Settings, UserPlus, Edit, Trash2, Plus, Building } from "lucide-react";

interface BotStatus {
  status: string;
  botName?: string;
  username?: string;
  authorized_users: number;
  deepseek_configured: boolean;
  error?: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  role: string;
  telegramUserId?: string;
}

export default function TelegramBot() {
  const [testItemId, setTestItemId] = useState("");
  const [testPartNumber, setTestPartNumber] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [telegramUserId, setTelegramUserId] = useState("");
  const [showExternalUserDialog, setShowExternalUserDialog] = useState(false);
  const [externalTelegramUserId, setExternalTelegramUserId] = useState("");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // تشخيص بيانات المستخدم الحالي للديبوجينج
  console.log('🔍 تشخيص صلاحيات المستخدم:', {
    user: currentUser?.username,
    role: currentUser?.role,
    permissions: currentUser?.permissions,
    canAccessBot: currentUser?.canAccessBot,
    userObject: currentUser
  });

  // Check if current user has access to bot page
  const hasAdminAccess = 
    // أدوار المدراء
    currentUser?.role === 'it_admin' || 
    currentUser?.role === 'manager' ||
    currentUser?.role === 'admin' ||
    // تحقق من وجود صلاحية الوصول للبوت في قائمة الصلاحيات
    (Array.isArray(currentUser?.permissions) && currentUser.permissions.includes('access_bot')) ||
    // تحقق من وجود صلاحية الوصول للبوت في النص
    (typeof currentUser?.permissions === 'string' && currentUser.permissions.includes('access_bot')) ||
    // تحقق من canAccessBot field
    currentUser?.canAccessBot === true ||
    // إذا كان المستخدم هو أحمد، اسمح له دائماً (حل مؤقت)
    currentUser?.username === 'Ahmed' ||
    // تحقق من الصلاحيات القديمة للتوافق العكسي
    (typeof currentUser?.role === 'string' && 
     (currentUser.role.includes('perm-001') || currentUser.role.includes('perm-009') || currentUser.role.includes('perm-010')));

  console.log('✅ نتيجة التحقق من الصلاحيات:', { hasAdminAccess, username: currentUser?.username });

  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">وصول مقيد</h2>
              <p className="text-gray-600">هذه الصفحة متاحة لمديري تقنية المعلومات فقط</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get bot status
  const { data: botStatus, isLoading: statusLoading } = useQuery<BotStatus>({
    queryKey: ["/api/telegram/status"],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Get all users (internal system users)
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

  // Get all authorized telegram users (internal + external)
  const { data: telegramUsers, isLoading: telegramUsersLoading, refetch: refetchTelegramUsers } = useQuery<{internal: User[], external: any[]}>({
    queryKey: ["/api/telegram/users"]
  });

  // Test analysis mutation
  const analyzeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch("/api/telegram/analyze-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم بنجاح",
        description: "تم إرسال التحليل عبر تليجرام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إرسال التحليل",
        variant: "destructive",
      });
    },
  });

  // Update user telegram ID mutation
  const updateTelegramUserMutation = useMutation({
    mutationFn: async ({ userId, telegramUserId }: { userId: string; telegramUserId: string }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم التحديث",
        description: "تم تحديث معرف تليجرام بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
      setEditingUser(null);
      setTelegramUserId("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في تحديث معرف تليجرام",
        variant: "destructive",
      });
    },
  });

  // Add external user mutation
  const addExternalUserMutation = useMutation({
    mutationFn: async (telegramUserId: string) => {
      const response = await fetch("/api/telegram/external-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم بنجاح",
        description: "تم إضافة المستخدم الخارجي بنجاح",
      });
      refetchTelegramUsers();
      setShowExternalUserDialog(false);
      setExternalTelegramUserId("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إضافة المستخدم الخارجي",
        variant: "destructive",
      });
    },
  });

  // Remove external user mutation
  const removeExternalUserMutation = useMutation({
    mutationFn: async (telegramUserId: string) => {
      const response = await fetch(`/api/telegram/external-users/${telegramUserId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم بنجاح",
        description: "تم حذف المستخدم الخارجي بنجاح",
      });
      refetchTelegramUsers();
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في حذف المستخدم الخارجي",
        variant: "destructive",
      });
    },
  });

  const handleSaveTelegramId = () => {
    if (editingUser && telegramUserId.trim()) {
      updateTelegramUserMutation.mutate({
        userId: editingUser.id,
        telegramUserId: telegramUserId.trim()
      });
    }
  };

  const handleAddExternalUser = () => {
    if (externalTelegramUserId.trim()) {
      addExternalUserMutation.mutate(externalTelegramUserId.trim());
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">غير محدد</Badge>;
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">🟢 نشط</Badge>;
      case 'error':
        return <Badge variant="destructive">🔴 خطأ</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            بوت تليجرام - تحليل البنود
          </h1>
          <p className="text-muted-foreground mt-2">
            نظام التحليل التلقائي للبنود باستخدام الذكاء الاصطناعي
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bot Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              حالة البوت
            </CardTitle>
            <CardDescription>
              المعلومات الحالية للبوت
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>الحالة:</span>
                  {getStatusBadge(botStatus?.status)}
                </div>
                
                {botStatus?.botName && (
                  <div className="flex justify-between items-center">
                    <span>اسم البوت:</span>
                    <span className="font-mono">{botStatus.botName}</span>
                  </div>
                )}
                
                {botStatus?.username && (
                  <div className="flex justify-between items-center">
                    <span>المعرف:</span>
                    <span className="font-mono">@{botStatus.username}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span>المستخدمون المخولون:</span>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {botStatus?.authorized_users || 0}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>DeepSeek AI:</span>
                  {botStatus?.deepseek_configured ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      مُعد
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      غير مُعد
                    </Badge>
                  )}
                </div>

                {botStatus?.error && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">خطأ:</p>
                    <p className="text-red-600 text-sm">{botStatus.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Analysis Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              اختبار التحليل
            </CardTitle>
            <CardDescription>
              اختبر تحليل بند معين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (testItemId.trim()) {
                analyzeItemMutation.mutate(testItemId.trim());
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="itemId">معرف البند</Label>
                <Input
                  id="itemId"
                  value={testItemId}
                  onChange={(e) => setTestItemId(e.target.value)}
                  placeholder="أدخل معرف البند للتحليل"
                />
              </div>
              
              <div>
                <Label htmlFor="partNumber">رقم القطعة (للمرجع)</Label>
                <Input
                  id="partNumber"
                  value={testPartNumber}
                  onChange={(e) => setTestPartNumber(e.target.value)}
                  placeholder="LC1D32M7"
                />
              </div>

              <Button 
                type="submit" 
                disabled={!testItemId.trim() || analyzeItemMutation.isPending}
                className="w-full"
              >
                {analyzeItemMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    تحليل البند
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bot Commands Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              أوامر البوت
            </CardTitle>
            <CardDescription>
              الأوامر المتاحة في تليجرام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/start</code>
                <p className="text-xs text-gray-600 mt-1">بدء استخدام البوت</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/latest</code>
                <p className="text-xs text-gray-600 mt-1">آخر 5 طلبات تسعير</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/analyze [PART_NO]</code>
                <p className="text-xs text-gray-600 mt-1">تحليل بند معين</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/pending</code>
                <p className="text-xs text-gray-600 mt-1">البنود المعلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authorized Users Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إدارة المستخدمين المخولين
          </CardTitle>
          <CardDescription>
            جميع المستخدمين المخولين لاستخدام البوت (داخليين وخارجيين)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button 
              variant="default"
              size="sm"
              onClick={() => setShowExternalUserDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              إضافة مستخدم خارجي
            </Button>
          </div>
          {telegramUsersLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>معرف تليجرام</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Internal Users */}
                {telegramUsers?.internal?.map((user: User) => (
                  <TableRow key={user.telegramUserId}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <Building className="h-3 w-3 mr-1" />
                        داخلي
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'it_admin' ? 'default' : 'secondary'}>
                        {user.role === 'it_admin' ? 'مدير تقني' : 
                         user.role === 'manager' ? 'مدير' :
                         user.role === 'data_entry' ? 'إدخال بيانات' :
                         user.role === 'purchasing' ? 'مشتريات' :
                         user.role === 'accounting' ? 'محاسبة' : user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.telegramUserId}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        مفعل
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setTelegramUserId(user.telegramUserId || "");
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            تعديل
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تحديث معرف تليجرام</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="userInfo">المستخدم</Label>
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                <strong>{editingUser?.fullName}</strong> ({editingUser?.username})
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="telegramId">معرف تليجرام (User ID)</Label>
                              <Input
                                id="telegramId"
                                value={telegramUserId}
                                onChange={(e) => setTelegramUserId(e.target.value)}
                                placeholder="123456789"
                                type="number"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                يمكن الحصول على المعرف عبر البوت @userinfobot في تليجرام
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleSaveTelegramId}
                                disabled={!telegramUserId.trim() || updateTelegramUserMutation.isPending}
                              >
                                {updateTelegramUserMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    جاري الحفظ...
                                  </>
                                ) : (
                                  "حفظ"
                                )}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setEditingUser(null);
                                  setTelegramUserId("");
                                }}
                              >
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* External Users */}
                {telegramUsers?.external?.map((user: any) => (
                  <TableRow key={user.telegramUserId}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <UserPlus className="h-3 w-3 mr-1" />
                        خارجي
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">خارجي</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.telegramUserId}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        مفعل
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeExternalUserMutation.mutate(user.telegramUserId)}
                        disabled={removeExternalUserMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية الاستخدام</CardTitle>
          <CardDescription>
            إرشادات استخدام بوت تليجرام للتحليل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">التشغيل التلقائي</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• يتم إرسال تحليل تلقائي لكل بند جديد في طلبات التسعير</li>
                <li>• التحليل يشمل الاسم السوقي والوصف التفصيلي</li>
                <li>• معلومات الموردين في مصر وبيانات الاتصال</li>
                <li>• الأسعار التقريبية والمواصفات الفنية</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">الوصول للبوت</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• ابحث عن البوت في تليجرام (سيتم توفير الرابط)</li>
                <li>• أرسل <code>/start</code> لبدء الاستخدام</li>
                <li>• استخدم الأوامر المتاحة للحصول على التحليلات</li>
                <li>• الوصول مقيد للمستخدمين المخولين فقط</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External User Add Dialog */}
      <Dialog open={showExternalUserDialog} onOpenChange={setShowExternalUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مستخدم خارجي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="externalTelegramId">معرف تليجرام (User ID)</Label>
              <Input
                id="externalTelegramId"
                value={externalTelegramUserId}
                onChange={(e) => setExternalTelegramUserId(e.target.value)}
                placeholder="123456789"
                type="number"
              />
              <p className="text-xs text-gray-500 mt-1">
                يمكن الحصول على المعرف عبر البوت @userinfobot في تليجرام
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAddExternalUser}
                disabled={!externalTelegramUserId.trim() || addExternalUserMutation.isPending}
              >
                {addExternalUserMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  "إضافة"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowExternalUserDialog(false);
                  setExternalTelegramUserId("");
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}