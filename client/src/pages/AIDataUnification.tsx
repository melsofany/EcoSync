import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  PlayCircle, 
  Pause,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Database,
  TrendingUp,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// واجهات البيانات
interface UnificationStatus {
  isRunning: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalItems: number;
  processedItems: number;
  unifiedItems: number;
  quotaExceeded: boolean;
  progress: number;
  logs: string[];
}

interface LogEntry {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

export default function AIDataUnification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // حالة الواجهة
  const [status, setStatus] = useState<UnificationStatus>({
    isRunning: false,
    isPaused: false,
    currentIndex: 0,
    totalItems: 0,
    processedItems: 0,
    unifiedItems: 0,
    quotaExceeded: false,
    progress: 0,
    logs: []
  });
  
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // الاتصال بالخادم للحصول على التحديثات المباشرة
  useEffect(() => {
    const eventSource = new EventSource('/api/ai-unification/stream');
    
    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('✅ تم الاتصال بسيرفر التحديثات المباشرة');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'status') {
          setStatus(data.payload);
        } else if (data.type === 'log') {
          const logEntry: LogEntry = {
            message: data.payload.message,
            type: data.payload.type || 'info',
            timestamp: new Date().toLocaleTimeString('ar-EG')
          };
          
          setRecentLogs(prev => [...prev.slice(-49), logEntry]); // آخر 50 رسالة
        }
      } catch (error) {
        console.error('خطأ في معالجة التحديث:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.warn('⚠️ انقطع الاتصال بسيرفر التحديثات');
    };

    // تنظيف الاتصال عند إغلاق الصفحة
    return () => {
      eventSource.close();
    };
  }, []);

  // جلب الحالة الحالية عند تحميل الصفحة
  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  // جلب الحالة الحالية
  const fetchCurrentStatus = async () => {
    try {
      const response = await fetch('/api/ai-unification/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('خطأ في جلب الحالة:', error);
    }
  };

  // بدء عملية التوحيد
  const startUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-unification/start', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'فشل في بدء التوحيد');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🚀 تم البدء",
        description: "تم بدء عملية التوحيد في الخلفية",
        className: "bg-green-50 border-green-200"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في البدء",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // إيقاف مؤقت
  const pauseUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-unification/pause', {
        method: 'POST',
        credentials: 'include'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "⏸️ تم الإيقاف",
        description: "تم إيقاف العملية مؤقتاً",
        className: "bg-yellow-50 border-yellow-200"
      });
    }
  });

  // استئناف
  const resumeUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-unification/resume', {
        method: 'POST',
        credentials: 'include'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "▶️ تم الاستئناف",
        description: "تم استئناف العملية",
        className: "bg-blue-50 border-blue-200"
      });
    }
  });

  // إيقاف نهائي
  const stopUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-unification/stop', {
        method: 'POST',
        credentials: 'include'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🛑 تم الإيقاف",
        description: "تم إيقاف العملية نهائياً",
        className: "bg-red-50 border-red-200"
      });
    }
  });

  // تحديد حالة العملية
  const getStatusInfo = () => {
    if (status.quotaExceeded) {
      return {
        text: 'نفد رصيد API - متوقف',
        color: 'bg-orange-500',
        icon: AlertTriangle
      };
    } else if (status.isRunning && status.isPaused) {
      return {
        text: 'متوقف مؤقتاً',
        color: 'bg-yellow-500',
        icon: Pause
      };
    } else if (status.isRunning) {
      return {
        text: 'يعمل في الخلفية',
        color: 'bg-green-500',
        icon: Zap
      };
    } else if (status.processedItems > 0) {
      return {
        text: 'مكتمل',
        color: 'bg-blue-500',
        icon: CheckCircle2
      };
    } else {
      return {
        text: 'في انتظار البدء',
        color: 'bg-gray-400',
        icon: Clock
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          التوحيد الذكي للمنتجات
        </h1>
        <p className="text-gray-600">نظام ذكي يعمل في الخلفية لتوحيد المنتجات المتطابقة باستخدام AI</p>
      </motion.div>

      {/* شريط الاتصال */}
      <Card className={`border-2 ${isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="font-medium">
              {isConnected ? '🔗 متصل - تحديثات مباشرة' : '📶 غير متصل - قم بإعادة تحميل الصفحة'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* شريط التحكم والحالة */}
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${statusInfo.color} animate-pulse`} />
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <StatusIcon className="h-5 w-5" />
                  {statusInfo.text}
                </h3>
                {(status.totalItems || 0) > 0 && (
                  <p className="text-sm text-gray-600">
                    البند {(status.currentIndex || 0) + 1} من {status.totalItems || 0}
                  </p>
                )}
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex items-center gap-2">
              {!status.isRunning && (
                <Button
                  onClick={() => startUnification.mutate()}
                  disabled={startUnification.isPending}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  <PlayCircle className="ml-2 h-4 w-4" />
                  بدء التوحيد
                </Button>
              )}

              {status.isRunning && !status.isPaused && (
                <Button
                  onClick={() => pauseUnification.mutate()}
                  disabled={pauseUnification.isPending}
                  variant="outline"
                  className="border-yellow-300 hover:bg-yellow-50"
                >
                  <Pause className="ml-2 h-4 w-4" />
                  إيقاف مؤقت
                </Button>
              )}

              {status.isRunning && status.isPaused && (
                <Button
                  onClick={() => resumeUnification.mutate()}
                  disabled={resumeUnification.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <RotateCcw className="ml-2 h-4 w-4" />
                  استئناف
                </Button>
              )}

              {status.isRunning && (
                <Button
                  onClick={() => stopUnification.mutate()}
                  disabled={stopUnification.isPending}
                  variant="destructive"
                >
                  <Square className="ml-2 h-4 w-4" />
                  إيقاف نهائي
                </Button>
              )}
            </div>
          </div>

          {/* شريط التقدم */}
          {(status.totalItems || 0) > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>التقدم</span>
                <span>{(status.progress || 0).toFixed(1)}%</span>
              </div>
              <Progress value={status.progress || 0} className="h-3" />
            </div>
          )}

          {/* تحذير نفاد الرصيد */}
          {status.quotaExceeded && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>نفد رصيد DeepSeek API!</strong>
                <br />
                يمكنك إما انتظار إعادة تعبئة الرصيد أو سيتم استخدام المقارنة البسيطة.
                <br />
                العملية محفوظة ويمكن استئنافها في أي وقت.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>إجمالي البنود</span>
              <Database className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">
              {(status.totalItems || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>تمت معالجتها</span>
              <Cpu className="h-5 w-5 text-yellow-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-700">
              {(status.processedItems || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>تم توحيدها</span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">
              {(status.unifiedItems || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>معدل التوحيد</span>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700">
              {(status.processedItems || 0) > 0 ? 
                (((status.unifiedItems || 0) / (status.processedItems || 1)) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* سجل العمليات المباشر */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: status.isRunning && !status.isPaused ? 360 : 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-5 w-5 text-blue-600" />
            </motion.div>
            سجل العمليات المباشر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-sm">
            <AnimatePresence>
              {recentLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 rounded border-r-4 ${
                    log.type === 'error' ? 'bg-red-50 border-red-400' :
                    log.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    log.type === 'success' ? 'bg-green-50 border-green-400' :
                    'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-gray-800">{log.message}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.timestamp}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {recentLogs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                لا توجد رسائل جديدة
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* معلومات النظام */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">مميزات النظام الجديد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">🔧 العمل في الخلفية</h4>
              <ul className="space-y-1 text-green-600">
                <li>• يستمر العمل حتى بعد إغلاق المتصفح</li>
                <li>• حفظ تلقائي للتقدم كل دقيقة</li>
                <li>• إمكانية الاستئناف من حيث توقف</li>
                <li>• تحديثات مباشرة عبر WebSocket</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2">🤖 إدارة ذكية للـ API</h4>
              <ul className="space-y-1 text-green-600">
                <li>• كشف نفاد الرصيد تلقائياً</li>
                <li>• التبديل للمقارنة البسيطة عند الحاجة</li>
                <li>• معالجة الأخطاء والإعادة التلقائية</li>
                <li>• تحكم كامل: بدء/إيقاف/استئناف</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}