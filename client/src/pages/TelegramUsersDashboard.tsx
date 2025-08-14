import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, MessageCircle, Clock, UserPlus, BarChart3 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TelegramUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateAdded: string;
  status: string;
  lastActivity: string;
  requestsCount: number;
  notes: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRequests: number;
  averageRequestsPerUser: number;
}

export function TelegramUsersDashboard() {
  const [users, setUsers] = useState<string[]>([]);
  const [userDetails, setUserDetails] = useState<TelegramUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserStats = async () => {
    try {
      const stats = await apiRequest('/api/telegram-bot/stats', 'GET');
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('/api/telegram-bot/users', 'GET');
      setUsers(response.users || []);
      
      // جلب تفاصيل كل مستخدم
      const details: TelegramUser[] = [];
      for (const userId of response.users || []) {
        try {
          const userDetail = await apiRequest(`/api/telegram-bot/user/${userId}`, 'GET');
          if (userDetail) {
            details.push(userDetail);
          }
        } catch (error) {
          console.log(`User ${userId} not found in sheets, skipping details`);
        }
      }
      setUserDetails(details);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب قائمة المستخدمين',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchUserStats()]);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'destructive'}>
        {status === 'active' ? 'نشط' : 'غير نشط'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Users className="w-8 h-8" />
          لوحة تحكم مستخدمي التليجرام
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          إدارة ومراقبة مستخدمي بوت التليجرام من ورقة Google Sheets
        </p>
      </div>

      {/* إحصائيات شاملة */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                إجمالي المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {userStats.totalUsers}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                المستخدمون النشطون
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {userStats.activeUsers}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                غير النشطين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {userStats.inactiveUsers}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                إجمالي الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {userStats.totalRequests}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                متوسط الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {userStats.averageRequestsPerUser}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* جدول المستخدمين التفصيلي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              تفاصيل مستخدمي التليجرام ({userDetails.length})
            </span>
            <Button onClick={() => Promise.all([fetchUsers(), fetchUserStats()])} size="sm">
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-right py-3 px-4">معرف التليجرام</th>
                    <th className="text-right py-3 px-4">اسم المستخدم</th>
                    <th className="text-right py-3 px-4">الاسم</th>
                    <th className="text-right py-3 px-4">تاريخ الإضافة</th>
                    <th className="text-right py-3 px-4">الحالة</th>
                    <th className="text-right py-3 px-4">آخر نشاط</th>
                    <th className="text-right py-3 px-4">عدد الطلبات</th>
                    <th className="text-right py-3 px-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {userDetails.map((user, index) => (
                    <tr key={user.userId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{user.userId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-blue-600">@{user.username || 'غير محدد'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'غير محدد'}
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(user.dateAdded)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.lastActivity}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {user.requestsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          عرض التفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد بيانات مفصلة للمستخدمين
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                المستخدمون الحاليون: {users.length > 0 ? users.join(', ') : 'لا يوجد'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة تفاصيل المستخدم */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">تفاصيل المستخدم</h3>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium">معرف التليجرام:</span>
                <span className="mr-2 font-mono">{selectedUser.userId}</span>
              </div>
              
              <div>
                <span className="font-medium">اسم المستخدم:</span>
                <span className="mr-2">@{selectedUser.username || 'غير محدد'}</span>
              </div>
              
              <div>
                <span className="font-medium">الاسم الكامل:</span>
                <span className="mr-2">
                  {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'غير محدد'}
                </span>
              </div>
              
              <div>
                <span className="font-medium">رقم الهاتف:</span>
                <span className="mr-2">{selectedUser.phoneNumber || 'غير محدد'}</span>
              </div>
              
              <div>
                <span className="font-medium">تاريخ الإضافة:</span>
                <span className="mr-2">{formatDate(selectedUser.dateAdded)}</span>
              </div>
              
              <div>
                <span className="font-medium">آخر نشاط:</span>
                <span className="mr-2">{selectedUser.lastActivity}</span>
              </div>
              
              <div>
                <span className="font-medium">عدد الطلبات:</span>
                <span className="mr-2 font-semibold text-blue-600">{selectedUser.requestsCount}</span>
              </div>
              
              <div>
                <span className="font-medium">الحالة:</span>
                <span className="mr-2">{getStatusBadge(selectedUser.status)}</span>
              </div>
              
              {selectedUser.notes && (
                <div>
                  <span className="font-medium">ملاحظات:</span>
                  <p className="mr-2 mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {selectedUser.notes}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={() => setSelectedUser(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* تعليمات الاستخدام */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>تعليمات إدارة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">ميزات إدارة المستخدمين:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li>• تتبع تلقائي للمستخدمين في ورقة Google Sheets منفصلة</li>
                <li>• إحصائيات شاملة عن النشاط والاستخدام</li>
                <li>• تسجيل آخر نشاط وعدد الطلبات لكل مستخدم</li>
                <li>• إمكانية تفعيل وإلغاء تفعيل المستخدمين</li>
                <li>• حفظ معلومات المستخدم الأساسية من التليجرام</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">البيانات المحفوظة:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li>• معرف التليجرام والاسم واسم المستخدم</li>
                <li>• تاريخ الإضافة وآخر نشاط</li>
                <li>• عدد الطلبات والتفاعلات</li>
                <li>• حالة المستخدم (نشط/غير نشط)</li>
                <li>• ملاحظات إدارية</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}