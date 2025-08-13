import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Play, 
  Pause, 
  Square, 
  Activity, 
  Clock, 
  Target, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap,
  Brain,
  Database,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UnificationProgress {
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  totalItems: number;
  processedRows: number;
  unifiedItems: number;
  currentItemName: string;
  currentPartNumber: string;
  startedAt: string;
  lastUpdateAt: string;
  estimatedTimeRemaining: number;
  aiRequestsCount: number;
  successfulMatches: number;
  failedRequests: number;
  averageProcessingTime: number;
}

export default function UnificationMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<UnificationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startingOptions, setStartingOptions] = useState({
    startFromRow: 5,
    batchSize: 50
  });

  // التحقق من صلاحية الوصول
  if (!user || user.role !== 'it_admin') {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            هذه الصفحة متاحة فقط لمديري تقنية المعلومات
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // جلب حالة التقدم كل 2 ثانية
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/unification/status', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleStartUnification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/unification/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(startingOptions)
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "تم بدء التوحيد",
          description: data.message || "تم بدء عملية التوحيد الذكي بنجاح",
        });
      } else {
        throw new Error('فشل في بدء التوحيد');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في بدء العملية",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseUnification = async () => {
    setIsLoading(true);
    try {
      await apiRequest('/api/pause-unification', {
        method: 'POST'
      });
      
      toast({
        title: "تم إيقاف العملية مؤقتاً",
        description: "يمكنك استئناف العملية لاحقاً",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إيقاف العملية",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUnification = async () => {
    setIsLoading(true);
    try {
      await apiRequest('/api/resume-unification', {
        method: 'POST'
      });
      
      toast({
        title: "تم استئناف العملية",
        description: "جاري متابعة معالجة البنود",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في استئناف العملية",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopUnification = async () => {
    setIsLoading(true);
    try {
      await apiRequest('/api/stop-unification', {
        method: 'POST'
      });
      
      toast({
        title: "تم إيقاف العملية نهائياً",
        description: "تم إنهاء عملية التوحيد",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إيقاف العملية",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { label: "قيد التشغيل", color: "bg-green-500", icon: Activity },
      paused: { label: "متوقف مؤقتاً", color: "bg-yellow-500", icon: Pause },
      completed: { label: "مكتمل", color: "bg-blue-500", icon: CheckCircle },
      error: { label: "خطأ", color: "bg-red-500", icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
    const Icon = config.icon;

    return (
      <Badge className={cn("text-white", config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)} ثانية`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`;
    return `${Math.round(seconds / 3600)} ساعة`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const progressPercentage = progress ? (progress.processedRows / progress.totalItems) * 100 : 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مراقب التوحيد الذكي</h1>
          <p className="text-gray-600">نظام توحيد البنود باستخدام الذكاء الاصطناعي</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!progress || progress.status === 'completed' || progress.status === 'error' ? (
            <Button
              onClick={handleStartUnification}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              بدء التوحيد
            </Button>
          ) : (
            <>
              {progress.status === 'running' && (
                <Button
                  onClick={handlePauseUnification}
                  disabled={isLoading}
                  variant="outline"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  إيقاف مؤقت
                </Button>
              )}
              
              {progress.status === 'paused' && (
                <Button
                  onClick={handleResumeUnification}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  استئناف
                </Button>
              )}
              
              <Button
                onClick={handleStopUnification}
                disabled={isLoading}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                إيقاف نهائي
              </Button>
            </>
          )}
        </div>
      </div>

      {/* إعدادات البدء */}
      {(!progress || progress.status === 'completed' || progress.status === 'error') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              إعدادات التوحيد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">البدء من الصف</label>
                <input
                  type="number"
                  value={startingOptions.startFromRow}
                  onChange={(e) => setStartingOptions(prev => ({
                    ...prev,
                    startFromRow: parseInt(e.target.value) || 5
                  }))}
                  className="w-full p-2 border rounded-md mt-1"
                  min="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">حجم الدفعة</label>
                <input
                  type="number"
                  value={startingOptions.batchSize}
                  onChange={(e) => setStartingOptions(prev => ({
                    ...prev,
                    batchSize: parseInt(e.target.value) || 50
                  }))}
                  className="w-full p-2 border rounded-md mt-1"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات التقدم */}
      {progress && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* التقدم العام */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  التقدم العام
                </div>
                {getStatusBadge(progress.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>التقدم: {progress.processedRows} من {progress.totalItems}</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-2 text-blue-500" />
                  <div>
                    <div className="font-medium">البنود الموحدة</div>
                    <div className="text-gray-600">{progress.unifiedItems}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                  <div>
                    <div className="font-medium">الوقت المتبقي</div>
                    <div className="text-gray-600">
                      {progress.estimatedTimeRemaining > 0 
                        ? formatTime(progress.estimatedTimeRemaining)
                        : "غير محدد"
                      }
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* البند الحالي */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                البند قيد المعالجة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-600">الوصف</div>
                <div className="text-sm bg-gray-50 p-2 rounded border">
                  {progress.currentItemName || "لا يوجد"}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-600">رقم القطعة</div>
                <div className="text-sm bg-gray-50 p-2 rounded border">
                  {progress.currentPartNumber || "غير محدد"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات الذكاء الاصطناعي */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                إحصائيات الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  <div>
                    <div className="font-medium">طلبات ناجحة</div>
                    <div className="text-gray-600">{progress.aiRequestsCount}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                  <div>
                    <div className="font-medium">مطابقات ناجحة</div>
                    <div className="text-gray-600">{progress.successfulMatches}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                  <div>
                    <div className="font-medium">طلبات فاشلة</div>
                    <div className="text-gray-600">{progress.failedRequests}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-purple-500" />
                  <div>
                    <div className="font-medium">متوسط الوقت</div>
                    <div className="text-gray-600">
                      {progress.averageProcessingTime > 0 
                        ? `${progress.averageProcessingTime.toFixed(1)}ث`
                        : "غير محدد"
                      }
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الجلسة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                معلومات الجلسة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-600">معرف الجلسة</div>
                <div className="text-sm font-mono bg-gray-50 p-2 rounded border">
                  {progress.sessionId}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-600">بدأت في</div>
                <div className="text-sm bg-gray-50 p-2 rounded border">
                  {formatDate(progress.startedAt)}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-600">آخر تحديث</div>
                <div className="text-sm bg-gray-50 p-2 rounded border">
                  {formatDate(progress.lastUpdateAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* رسالة عدم وجود جلسة نشطة */}
      {!progress && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              لا توجد عملية توحيد نشطة
            </h3>
            <p className="text-gray-600 mb-6">
              ابدأ عملية جديدة لتوحيد البنود باستخدام الذكاء الاصطناعي
            </p>
            <Button 
              onClick={handleStartUnification}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              بدء التوحيد الآن
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}