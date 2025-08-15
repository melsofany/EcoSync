import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, Trash2, Users, Activity } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BotStatus {
  status: string;
  botName: string;
  username?: string;
  authorized_users: number;
  deepseek_configured: boolean;
}

interface BotUsers {
  users: string[];
  count: number;
}

export function TelegramBotManagement() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botUsers, setBotUsers] = useState<BotUsers | null>(null);
  const [newUserId, setNewUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchBotStatus = async () => {
    try {
      const status = await apiRequest('/api/telegram/status', 'GET');
      console.log('Received bot status data:', status);
      setBotStatus(status);
    } catch (error) {
      console.error('Error fetching bot status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب حالة البوت',
        variant: 'destructive'
      });
    }
  };

  const fetchBotUsers = async () => {
    try {
      const users = await apiRequest('/api/telegram/users', 'GET');
      setBotUsers(users);
    } catch (error) {
      console.error('Error fetching bot users:', error);
    }
  };

  const addUser = async () => {
    if (!newUserId.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال معرف التليجرام',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest('/api/telegram/external-users', 'POST', {
        telegramUserId: newUserId.trim()
      });
      
      toast({
        title: 'نجح',
        description: result.message || 'تم إضافة المستخدم بنجاح'
      });
      
      setNewUserId('');
      await Promise.all([fetchBotStatus(), fetchBotUsers()]);
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة المستخدم',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    setIsLoading(true);
    try {
      const result = await apiRequest(`/api/telegram/external-users/${userId}`, 'DELETE');
      
      toast({
        title: 'نجح',
        description: result.message || 'تم حذف المستخدم بنجاح'
      });
      
      await Promise.all([fetchBotStatus(), fetchBotUsers()]);
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المستخدم',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchBotStatus(), fetchBotUsers()]);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Bot className="w-8 h-8" />
          إدارة بوت التليجرام
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          إدارة وتكوين بوت التليجرام للتحليل التلقائي للبنود
        </p>
      </div>

      {/* Bot Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            حالة البوت
          </CardTitle>
        </CardHeader>
        <CardContent>
          {botStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">اسم البوت</div>
                <div className="font-semibold text-green-800 dark:text-green-300">
                  {botStatus.botName}
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">الحالة</div>
                <div className="font-semibold text-blue-800 dark:text-blue-300">
                  <Badge variant={botStatus.status === 'active' ? 'default' : 'destructive'}>
                    {botStatus.status === 'active' ? 'نشط' : 'متوقف'}
                  </Badge>
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-sm text-purple-600 dark:text-purple-400">المستخدمون المخولون</div>
                <div className="font-semibold text-purple-800 dark:text-purple-300">
                  {botStatus.authorized_users || 0}
                </div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">تكوين AI</div>
                <div className="font-semibold text-orange-800 dark:text-orange-300">
                  <Badge variant={botStatus.deepseek_configured ? 'default' : 'destructive'}>
                    {botStatus.deepseek_configured ? 'مكون' : 'غير مكون'}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">جاري تحميل حالة البوت...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة مستخدم مخول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="معرف التليجرام (مثال: 123456789)"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addUser} disabled={isLoading}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            للحصول على معرف التليجرام، يمكن للمستخدم إرسال /start للبوت @userinfobot
          </p>
        </CardContent>
      </Card>

      {/* Users List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            المستخدمون المخولون ({botUsers?.count || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {botUsers && botUsers.users && botUsers.users.length > 0 ? (
            <div className="space-y-2">
              {botUsers.users.map((userId, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <span className="font-mono text-sm">{userId}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeUser(userId)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              لا توجد مستخدمون مخولون حالياً
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>تعليمات الاستخدام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">الأوامر المتاحة للبوت:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li><code>/start</code> - بدء التشغيل والترحيب</li>
                <li><code>/latest</code> - آخر 5 طلبات تسعير</li>
                <li><code>/analyze [رقم القطعة]</code> - تحليل بند معين</li>
                <li><code>/stats</code> - إحصائيات النظام</li>
                <li><code>/help</code> - المساعدة والتعليمات</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ميزات البوت:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                <li>• تحليل تلقائي للبنود الجديدة عند إنشاء طلبات التسعير</li>
                <li>• تكامل مع Google Sheets لقراءة البيانات الحقيقية</li>
                <li>• تحليل بالذكاء الاصطناعي باستخدام DeepSeek API</li>
                <li>• تقدير الأسعار والمواصفات الفنية</li>
                <li>• إشعارات فورية للمندوبين والمسؤولين</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}