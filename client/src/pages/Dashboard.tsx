import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ExcelImporter } from "@/components/ExcelImporter";
import { QuickImporter } from "@/components/QuickImporter";
import { RealTimeSync } from "@/components/RealTimeSync";
import { 
  FileText, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Plus,
  Database,
  Upload,
  Brain,
  DollarSign
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showImporter, setShowImporter] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/statistics"],
  });

  // إضافة استعلام للبيانات الخارجية
  const { data: googleSheetsData, isLoading: googleSheetsLoading } = useQuery({
    queryKey: ["/api/google-sheets-data"],
    refetchInterval: 5000, // تحديث كل 5 ثوانٍ
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/activity"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === "manager" || user?.role === "it_admin",
  });

  // DeepSeek balance query
  const { data: deepseekBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/public/deepseek/balance"],
    enabled: true, // متاح لجميع المستخدمين
    refetchInterval: 60000, // تحديث كل دقيقة
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${day}/${month}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <Plus className="h-4 w-4 text-blue-600" />;
    if (action.includes('login')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-blue-100';
    if (action.includes('login')) return 'bg-green-100';
    return 'bg-gray-100';
  };



  return (
    <div className="space-y-4 lg:space-y-8">
      {/* Welcome Header */}
      <div className="text-center sm:text-right">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
          مرحباً، {user?.fullName}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          نظرة عامة على أداء النظام اليوم
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">طلبات التسعير</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(stats as any)?.totalQuotations?.toLocaleString('ar-EG') || 0}
                </p>
                <div className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 ml-1" />
                  نمو مستمر
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">أوامر الشراء</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(stats as any)?.totalPurchaseOrders?.toLocaleString('ar-EG') || 0}
                </p>
                <div className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 ml-1" />
                  أداء ممتاز
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الأصناف المسجلة</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(stats as any)?.totalItems?.toLocaleString('ar-EG') || 0}
                </p>
                <div className="text-xs text-blue-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 ml-1" />
                  زيادة مستمرة
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">إجمالي القيمة</p>
                <p className="text-xl font-bold text-green-900">
                  {googleSheetsLoading ? "جاري التحميل..." : 
                   googleSheetsData && (googleSheetsData as any).totalValue > 0 ? 
                   `${(googleSheetsData as any).totalValue?.toLocaleString('ar-EG')} ج.م` : "0 ج.م"}
                </p>
                <div className="text-xs text-green-700 mt-1 flex items-center">
                  <Database className="h-3 w-3 ml-1" />
                  النظام جاهز
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المستخدمون النشطون</p>
                <p className="text-2xl font-bold text-gray-800">
                  {users && Array.isArray(users) ? users.filter((u: any) => u.isOnline).length : 0}
                </p>
                <div className="text-xs text-gray-600 mt-1 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full ml-1"></div>
                  متصل الآن
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DeepSeek Balance - عرض رصيد الذكاء الاصطناعي */}
        <Card className="card-hover border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800 flex items-center">
                  <Brain className="h-4 w-4 ml-1" />
                  رصيد DeepSeek AI
                </p>
                {balanceLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 w-20 bg-purple-200 rounded mt-2"></div>
                  </div>
                ) : deepseekBalance?.success ? (
                  <>
                    <p className="text-xl font-bold text-purple-900">
                      ${deepseekBalance.balance.available_balance?.toFixed(4) || '0.2100'}
                    </p>
                    <div className="text-xs text-purple-700 mt-1 space-y-1">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 ml-1" />
                        <span>
                          {deepseekBalance.balance.available_balance > 1 ? '✅ رصيد جيد' : 
                           deepseekBalance.balance.available_balance > 0.1 ? '⚠️ رصيد منخفض' : '❌ يحتاج تعبئة'}
                        </span>
                      </div>
                      {deepseekBalance.balance.total_balance > 0 && (
                        <div className="text-xs text-gray-600">
                          الإجمالي: ${deepseekBalance.balance.total_balance?.toFixed(4)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
                      </div>
                      {deepseekBalance.balance.is_demo ? (
                        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1">
                          ⚠️ خطأ في جلب الرصيد الحقيقي
                        </div>
                      ) : (
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded mt-1">
                          ✅ رصيد حقيقي من DeepSeek
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-red-600">❌ غير متاح</p>
                    <div className="text-xs text-red-600 mt-1">
                      تحقق من إعداد API Key
                    </div>
                  </>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Online Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Clock className="h-5 w-5" />
              <span>آخر الأنشطة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities && Array.isArray(activities) ? activities.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-center space-x-3 space-x-reverse">
                  <UserAvatar 
                    user={{ 
                      fullName: activity.userFullName || activity.username || 'مستخدم غير معروف',
                      profileImage: activity.userProfileImage 
                    }} 
                    size="sm" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      <span className="text-blue-600">{activity.userFullName || activity.username}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(activity.timestamp)} - {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  لا توجد أنشطة حديثة
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Online Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Users className="h-5 w-5" />
                <span>المستخدمون المتصلون</span>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {users && Array.isArray(users) ? users.filter((u: any) => u.isOnline).length : 0} متصل
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users && Array.isArray(users) ? users.filter((u: any) => u.isOnline).map((onlineUser: any) => (
                <div key={onlineUser.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <UserAvatar 
                      user={onlineUser} 
                      size="sm" 
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {onlineUser.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {onlineUser.role === 'manager' && 'مدير'}
                        {onlineUser.role === 'it_admin' && 'مدير تقنية المعلومات'}
                        {onlineUser.role === 'data_entry' && 'موظف إدخال بيانات'}
                        {onlineUser.role === 'purchasing' && 'موظف مشتريات'}
                        {onlineUser.role === 'accounting' && 'موظف حسابات'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">
                      {onlineUser.ipAddress || 'غير معروف'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  لا يوجد مستخدمون متصلون
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Excel Import Section - Only for IT Admins */}
      {user?.role === 'it_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Upload className="h-5 w-5" />
                <span>استيراد البيانات من Excel</span>
              </div>
              <Button
                onClick={() => setShowImporter(!showImporter)}
                variant={showImporter ? "secondary" : "default"}
              >
                {showImporter ? "إخفاء" : "عرض"} مستورد Excel
              </Button>
            </CardTitle>
          </CardHeader>
          {showImporter && (
            <CardContent>
              <QuickImporter onImportComplete={() => {
                // Refresh data after import
                window.location.reload();
              }} />
            </CardContent>
          )}
        </Card>
      )}

      {/* Data Unification Section - Only for IT Admins */}
      {user?.role === 'it_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Database className="h-5 w-5" />
              <span>توحيد البيانات بالذكاء الاصطناعي</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-gray-600">
                نظام ذكي لتوحيد البنود المكررة وتحسين جودة البيانات باستخدام الذكاء الاصطناعي
              </p>
              <div className="flex items-center space-x-4 space-x-reverse">
                <Button
                  onClick={() => window.location.href = '/ai-data-unification'}
                  className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Brain className="h-4 w-4" />
                  <span>الانتقال لشاشة التوحيد</span>
                </Button>
                <div className="text-xs text-gray-500">
                  متاح لمدراء التقنية فقط
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Sync - For IT Admins */}
      {user?.role === 'it_admin' && (
        <RealTimeSync />
      )}
    </div>
  );
}
