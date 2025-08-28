import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlayCircle, 
  PauseCircle, 
  StopCircle, 
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Brain,
  Zap,
  Target,
  Activity,
  TrendingUp,
  Database,
  Layers,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UnificationStatus {
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  total: number;
  processed: number;
  unified: number;
  skipped: number;
  errors: number;
  currentItem?: {
    description: string;
    partNumber: string;
    lineItem: string;
  };
  startTime?: string;
  estimatedTimeRemaining?: number;
  accuracy: number;
  quotaExceeded?: boolean;
  pauseReason?: string;
}

interface UnificationStats {
  totalItems: number;
  uniqueItems: number;
  duplicatesFound: number;
  unificationRate: number;
  averageConfidence: number;
  lastRunDate?: string;
  totalRuns: number;
}

export default function AIDataUnification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);

  // جلب حالة التوحيد
  const { data: status, isLoading: statusLoading } = useQuery<UnificationStatus>({
    queryKey: ["/api/ai-unification/status"],
    refetchInterval: (query) => {
      const data = query.state.data as UnificationStatus;
      return data?.isRunning ? 1000 : 5000;
    }
  });

  // مراقبة نفاد الرصيد وعرض الرسالة المنبثقة
  useEffect(() => {
    if (status?.quotaExceeded && !showQuotaDialog) {
      setShowQuotaDialog(true);
      toast({
        title: "🚫 نفد رصيد الـ AI",
        description: "يرجى إعادة تعبئة رصيد الـ DeepSeek API لمتابعة التوحيد",
        variant: "destructive",
        duration: 10000
      });
    }
  }, [status?.quotaExceeded, showQuotaDialog, toast]);

  // جلب إحصائيات التوحيد
  const { data: stats } = useQuery<UnificationStats>({
    queryKey: ["/api/ai-unification/stats"],
    refetchInterval: 30000
  });

  // بدء عملية التوحيد
  const startUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-unification/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "full",
          targetAccuracy: 100,
          batchSize: 10
        }),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✨ بدء التوحيد الذكي",
        description: "تم بدء عملية توحيد البيانات بالذكاء الاصطناعي",
        className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-unification/status"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في بدء التوحيد",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // إيقاف عملية التوحيد مؤقتاً
  const pauseUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-unification/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "⏸️ إيقاف مؤقت",
        description: "تم إيقاف عملية التوحيد مؤقتاً"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-unification/status"] });
    }
  });

  // استئناف عملية التوحيد
  const resumeUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-unification/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "▶️ استئناف التوحيد",
        description: "تم استئناف عملية التوحيد"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-unification/status"] });
    }
  });

  // إيقاف عملية التوحيد نهائياً
  const stopUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-unification/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🛑 إيقاف التوحيد",
        description: "تم إيقاف عملية التوحيد نهائياً",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-unification/status"] });
    }
  });

  // إعادة تعيين التوحيد
  const resetUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-unification/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🔄 إعادة تعيين",
        description: "تمت إعادة تعيين بيانات التوحيد"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-unification/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-unification/stats"] });
    }
  });

  const formatTime = (seconds?: number) => {
    if (!seconds) return "--:--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    } else if (minutes > 0) {
      return `${minutes}د ${secs}ث`;
    } else {
      return `${secs}ث`;
    }
  };

  const progressPercentage = status?.total ? (status.processed / status.total) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          توحيد البيانات بالذكاء الاصطناعي
        </h1>
        <p className="text-gray-600">نظام ذكي لتوحيد البنود المكررة وتحسين جودة البيانات باستخدام الذكاء الاصطناعي</p>
      </motion.div>

      {/* شريط الحالة */}
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                status?.isRunning ? 'bg-green-500' : 
                status?.isPaused ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="font-semibold text-lg">
                {status?.isRunning ? 'جاري التوحيد...' : 
                 status?.isPaused ? 'متوقف مؤقتاً' : 'في وضع الانتظار'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {!status?.isRunning && !status?.isPaused && (
                <Button 
                  onClick={() => startUnification.mutate()}
                  disabled={startUnification.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <PlayCircle className="ml-2 h-4 w-4" />
                  بدء التوحيد بـ AI
                </Button>
              )}
              
              {status?.isRunning && (
                <>
                  <Button 
                    onClick={() => pauseUnification.mutate()}
                    variant="outline"
                    disabled={pauseUnification.isPending}
                  >
                    <PauseCircle className="ml-2 h-4 w-4" />
                    إيقاف مؤقت
                  </Button>
                  <Button 
                    onClick={() => stopUnification.mutate()}
                    variant="destructive"
                    disabled={stopUnification.isPending}
                  >
                    <StopCircle className="ml-2 h-4 w-4" />
                    إيقاف نهائي
                  </Button>
                </>
              )}
              
              {status?.isPaused && (
                <Button 
                  onClick={() => resumeUnification.mutate()}
                  className="bg-gradient-to-r from-green-500 to-teal-600"
                  disabled={resumeUnification.isPending}
                >
                  <PlayCircle className="ml-2 h-4 w-4" />
                  استئناف
                </Button>
              )}
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{status?.processed || 0} من {status?.total || 0}</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            
            {status?.currentItem && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-white rounded-lg border"
              >
                <p className="text-sm font-medium mb-1">جاري معالجة:</p>
                <p className="text-xs text-gray-600 truncate">{status.currentItem.description}</p>
                <div className="flex gap-2 mt-2">
                  {status.currentItem.partNumber && (
                    <Badge variant="outline" className="text-xs">
                      {status.currentItem.partNumber}
                    </Badge>
                  )}
                  {status.currentItem.lineItem && (
                    <Badge variant="outline" className="text-xs">
                      {status.currentItem.lineItem}
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <Activity className="ml-2 h-4 w-4" />
            لوحة التحكم
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <TrendingUp className="ml-2 h-4 w-4" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Database className="ml-2 h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* كارت البنود المعالجة */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>تم معالجتها</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-700">
                  {status?.processed || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  بند تم تحليله
                </p>
              </CardContent>
            </Card>

            {/* كارت البنود الموحدة */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>تم توحيدها</span>
                  <Layers className="h-5 w-5 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-700">
                  {status?.unified || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  بند موحد
                </p>
              </CardContent>
            </Card>

            {/* كارت دقة التوحيد */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>دقة التوحيد</span>
                  <Target className="h-5 w-5 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-700">
                  {status?.accuracy || 100}%
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  مستوى الدقة
                </p>
              </CardContent>
            </Card>

            {/* كارت الوقت المتبقي */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>الوقت المتبقي</span>
                  <Clock className="h-5 w-5 text-orange-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-700">
                  {formatTime(status?.estimatedTimeRemaining)}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  تقديري
                </p>
              </CardContent>
            </Card>

            {/* كارت البنود المتخطاة */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>تم تخطيها</span>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-700">
                  {status?.skipped || 0}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  بند متخطى
                </p>
              </CardContent>
            </Card>

            {/* كارت الأخطاء */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>أخطاء</span>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-700">
                  {status?.errors || 0}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  خطأ في المعالجة
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  إحصائيات عامة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">إجمالي البنود</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {stats?.totalItems || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">البنود الفريدة</span>
                  <Badge className="bg-blue-600 text-lg px-3 py-1">
                    {stats?.uniqueItems || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">المكررات المكتشفة</span>
                  <Badge className="bg-orange-600 text-lg px-3 py-1">
                    {stats?.duplicatesFound || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  أداء النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">معدل التوحيد</span>
                  <Badge className="bg-green-600 text-lg px-3 py-1">
                    {typeof stats?.unificationRate === 'number' ? stats.unificationRate.toFixed(1) : (stats?.unificationRate || 0)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">متوسط الثقة</span>
                  <Badge className="bg-purple-600 text-lg px-3 py-1">
                    {typeof stats?.averageConfidence === 'number' ? stats.averageConfidence.toFixed(1) : (stats?.averageConfidence || 0)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">عدد التشغيلات</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {stats?.totalRuns || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.lastRunDate && (
            <Alert className="mt-6">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                آخر عملية توحيد تمت في: {new Date(stats.lastRunDate).toLocaleString('ar-SA')}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                إعدادات التوحيد المتقدمة
              </CardTitle>
              <CardDescription>
                تحكم في معاملات الذكاء الاصطناعي لتحقيق أفضل نتائج
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-800">DeepSeek AI Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">النموذج المستخدم</span>
                    <Badge>DeepSeek-V2</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">عتبة التشابه</span>
                    <Badge variant="outline">85%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">حجم الدفعة</span>
                    <Badge variant="outline">10 بند</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">التحليل العميق</span>
                    <Badge className="bg-green-600">مفعّل</Badge>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  النظام مُعد للعمل بدقة 100% باستخدام خوارزميات DeepSeek المتقدمة
                  للتحليل الدلالي والمقارنة الذكية بين البنود
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => resetUnification.mutate()}
                  variant="outline"
                  disabled={resetUnification.isPending || status?.isRunning}
                >
                  <RefreshCw className="ml-2 h-4 w-4" />
                  إعادة تعيين البيانات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog لعرض رسالة نفاد الرصيد */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <CreditCard className="h-5 w-5" />
              نفد رصيد الـ AI
            </DialogTitle>
            <DialogDescription className="text-right">
              تم إيقاف عملية التوحيد الذكي مؤقتاً بسبب انتهاء رصيد DeepSeek API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                لمتابعة عملية التوحيد، يرجى إعادة تعبئة رصيد DeepSeek API من خلال:
                <br />
                • زيارة موقع DeepSeek
                <br />
                • إضافة رصيد إلى حسابك
                <br />
                • إعادة تشغيل عملية التوحيد
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowQuotaDialog(false)}
              >
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  setShowQuotaDialog(false);
                  window.open('https://platform.deepseek.com/', '_blank');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                فتح DeepSeek
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}