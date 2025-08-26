import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Activity, AlertCircle, CheckCircle, Pause, Play, Square, Clock, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UnificationStats {
  totalItems: number;
  duplicateGroups: number;
  duplicateItems: number;
  status: 'idle' | 'running' | 'completed';
  isRunning: boolean;
  progress: number;
  currentRow?: number;
  currentItemName?: string;
  currentItem?: string;
  remainingRows?: number;
  remainingItems?: number;
  estimatedTimeRemaining?: number;
  processedItems?: number;
  unifiedItems?: number;
  startTime?: string;
  elapsedTime?: number;
  progressPercentage?: number;
}

// دالة لتنسيق الوقت
const formatTime = (seconds: number): string => {
  if (!seconds || seconds === 0) return 'حساب...';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (secs > 0) parts.push(`${secs} ثانية`);
  
  return parts.join(' و ') || '0 ثانية';
};

export default function UnificationProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<UnificationStats>({
    totalItems: 0,
    duplicateGroups: 0,
    duplicateItems: 0,
    status: 'idle',
    isRunning: false,
    progress: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // التحقق من صلاحية الوصول
  if (!user || (user.role !== 'it_admin' && user.role !== 'manager')) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            هذه الصفحة متاحة فقط للمديرين ومديري تقنية المعلومات
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // جلب الإحصائيات كل ثانيتين
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/monitor/stats', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          // تحويل البيانات من تنسيق monitor إلى تنسيق unification progress
          const convertedStats = {
            totalItems: data.total || 0,
            duplicateGroups: data.groupsCreated || Math.floor((data.total - data.unified) / 2) || 0,
            duplicateItems: data.duplicatesFound || (data.total - data.unified) || 0,
            status: data.endTime ? 'completed' : (data.isRunning ? 'running' : 'idle'),
            isRunning: data.isRunning || false,
            progress: data.progressPercentage || data.progress || 0,
            currentRow: data.currentRow || data.processed || 0,
            currentItem: data.currentItem || '',
            currentItemName: data.currentItem || '',
            processedItems: data.processed || 0,
            unifiedItems: data.unified || 0,
            remainingRows: data.remainingItems || Math.max(0, (data.total || 0) - (data.processed || 0)),
            remainingItems: data.remainingItems || 0,
            startTime: data.startTime,
            elapsedTime: data.elapsedTime || 0,
            estimatedTimeRemaining: data.estimatedTimeRemaining || 0
          };
          setStats(convertedStats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStartUnification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monitor/start', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "تم بدء التوحيد",
          description: data.message || "بدأت عملية التوحيد الذكي",
        });
      } else {
        throw new Error('فشل في بدء التوحيد');
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في بدء العملية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopUnification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monitor/stop', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "تم إيقاف التوحيد",
          description: data.message || "تم إيقاف عملية التوحيد",
        });
      } else {
        throw new Error('فشل في إيقاف التوحيد');
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في إيقاف العملية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (stats.isRunning) return <Activity className="h-5 w-5 text-green-500 animate-pulse" />;
    if (stats.status === 'completed') return <CheckCircle className="h-5 w-5 text-blue-500" />;
    return <Pause className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (stats.isRunning) return 'قيد التشغيل';
    if (stats.status === 'completed') return 'مكتمل';
    return 'متوقف';
  };

  const getStatusColor = () => {
    if (stats.isRunning) return 'text-green-600 bg-green-50 border-green-200';
    if (stats.status === 'completed') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* رأس الصفحة */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              مراقبة التوحيد الذكي
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              تتبع تقدم عملية توحيد البنود المكررة بالذكاء الاصطناعي
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* شريط التقدم الرئيسي */}
      {stats.isRunning && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                التقدم العام
              </h3>
              <span className="text-2xl font-bold text-blue-600">
                {Math.round(stats.progress || 0)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-center relative"
                style={{ width: `${stats.progress || 0}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                {stats.progress && stats.progress > 15 && (
                  <span className="text-white text-sm font-bold relative z-10">
                    {Math.round(stats.progress)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* البند الحالي */}
          {stats.currentItem && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-yellow-600 animate-pulse" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  البند الحالي:
                </span>
              </div>
              <div className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                {stats.currentItem}
              </div>
            </div>
          )}

          {/* تفاصيل مباشرة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.currentRow || 0}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                الصف الحالي
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.processedItems || 0}
              </div>
              <div className="text-sm text-green-800 dark:text-green-300 font-medium">
                تم معالجته
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.remainingRows || 0}
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                متبقي
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatTime(stats.estimatedTimeRemaining || 0)}
              </div>
              <div className="text-sm text-purple-800 dark:text-purple-300 font-medium">
                الوقت المتبقي
              </div>
            </div>
          </div>

        </div>
      )}

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {stats.totalItems?.toLocaleString() || 0}
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            إجمالي البنود
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            في ورقة DATA
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            {stats.duplicateItems?.toLocaleString() || 0}
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            بنود مكررة
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            تحتاج توحيد
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {stats.unifiedItems || 0}
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            تم توحيدها
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            في هذه العملية
          </div>
        </div>
      </div>

      {/* معلومات إضافية */}
      {stats.isRunning && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              معلومات العملية
            </h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">الوقت المستغرق:</span>
              <span className="text-gray-900 dark:text-white font-medium mr-2">
                {formatTime(stats.elapsedTime || 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">الوقت المتبقي:</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium mr-2">
                {formatTime(stats.estimatedTimeRemaining || 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">تم توحيد:</span>
              <span className="text-green-600 dark:text-green-400 font-bold mr-2">
                {stats.unifiedItems || 0} بند
              </span>
            </div>
          </div>
        </div>
      )}

      {/* أزرار التحكم */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          التحكم في العملية
        </h3>
        
        <div className="flex gap-4">
          <button
            onClick={handleStartUnification}
            disabled={stats.isRunning || isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              stats.isRunning || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
          >
            <Play className="h-4 w-4" />
            {stats.isRunning ? 'جاري التوحيد...' : 'بدء التوحيد الذكي'}
          </button>
          
          {stats.isRunning && (
            <button
              onClick={handleStopUnification}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors"
            >
              <Square className="h-4 w-4" />
              إيقاف التوحيد
            </button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          النظام يبدأ من الصف الثاني ويحلل رقم القطعة والتوصيف لكل بند
        </p>
      </div>
    </div>
  );
}