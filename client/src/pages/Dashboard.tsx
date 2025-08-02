import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Plus
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/statistics"],
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/activity"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === "manager" || user?.role === "it_admin",
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          مرحباً، {user?.fullName}
        </h1>
        <p className="text-gray-600">
          نظرة عامة على أداء النظام اليوم
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">طلبات التسعير</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(stats as any)?.totalQuotations || 0}
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
                  {(stats as any)?.totalPurchaseOrders || 0}
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
                  {(stats as any)?.totalItems || 0}
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

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المستخدمون النشطون</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(stats as any)?.activeUsers || 0}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {activity.details || activity.action}
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
                {(stats as any)?.activeUsers || 0} متصل
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users && Array.isArray(users) ? users.filter((u: any) => u.isOnline).map((onlineUser: any) => (
                <div key={onlineUser.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {getInitials(onlineUser.fullName)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {onlineUser.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {onlineUser.role === 'manager' && 'مدير'}
                        {onlineUser.role === 'it_admin' && 'مدير تقنية المعلومات'}
                        {onlineUser.role === 'data_entry' && 'موظف إدخال بيانات'}
                        {onlineUser.role === 'purchasing' && 'موظف مشتريات'}
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
    </div>
  );
}
