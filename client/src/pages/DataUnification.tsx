import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Merge,
  Play,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  FileText,
  TrendingUp
} from "lucide-react";

interface UnificationStatus {
  isRunning: boolean;
  totalItems: number;
  processedItems: number;
  currentItem: string | null;
  duplicateGroups: number;
  itemsUnified: number;
  progress: number;
  logs: string[];
  startTime: string | null;
  endTime: string | null;
}

export default function DataUnification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBatchSize, setSelectedBatchSize] = useState(50);

  // إذا لم يكن المستخدم مدير تقني، لا يمكنه الوصول
  if (user?.role !== 'it_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                غير مسموح بالوصول
              </h2>
              <p className="text-gray-600">
                هذه الصفحة متاحة لمدراء التقنية فقط
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // حالة التوحيد
  const { data: status, isLoading } = useQuery<UnificationStatus>({
    queryKey: ["/api/unification/status"],
    refetchInterval: 2000, // تحديث كل ثانيتين
  });

  // بدء التوحيد
  const startMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 بدء التوحيد بند بند...');
      const response = await apiRequest("POST", "/api/unification/start");
      const result = await response.json();
      console.log('📥 نتيجة الاستجابة:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "تم بدء التوحيد",
        description: "بدأت عملية التوحيد بند بند بدقة 100%",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/unification/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في بدء التوحيد",
        description: error.message || "فشل في بدء عملية التوحيد",
        variant: "destructive",
      });
    },
  });

  // إيقاف التوحيد
  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/unification/stop");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إيقاف التوحيد",
        description: "تم إيقاف عملية التوحيد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/unification/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إيقاف التوحيد",
        description: error.message || "فشل في إيقاف عملية التوحيد",
        variant: "destructive",
      });
    },
  });

  // إعادة تعيين الحالة
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/unification/reset");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين حالة التوحيد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/unification/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إعادة التعيين",
        description: error.message || "فشل في إعادة تعيين الحالة",
        variant: "destructive",
      });
    },
  });

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ar-EG');
  };

  const formatDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return '-';
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const diffInSeconds = Math.round((end - start) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} ثانية`;
    if (diffInSeconds < 3600) return `${Math.round(diffInSeconds / 60)} دقيقة`;
    return `${Math.round(diffInSeconds / 3600)} ساعة`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل بيانات التوحيد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Merge className="h-8 w-8 text-primary" />
          توحيد البيانات بالذكاء الاصطناعي
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          نظام ذكي لتوحيد البنود المكررة وتحسين جودة البيانات
        </p>
      </div>

      {/* حالة النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            حالة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* حالة التشغيل */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {status?.isRunning ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Play className="h-3 w-3 mr-1" />
                    يعمل
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Square className="h-3 w-3 mr-1" />
                    متوقف
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600">حالة النظام</p>
            </div>

            {/* إجمالي البنود */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-900">
                {status?.totalItems?.toLocaleString('ar-EG') || 0}
              </div>
              <p className="text-xs text-blue-600">إجمالي البنود</p>
            </div>

            {/* البنود الموحدة */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-900">
                {status?.itemsUnified?.toLocaleString('ar-EG') || 0}
              </div>
              <p className="text-xs text-green-600">البنود الموحدة</p>
            </div>

            {/* مجموعات التكرار */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-900">
                {status?.duplicateGroups?.toLocaleString('ar-EG') || 0}
              </div>
              <p className="text-xs text-orange-600">مجموعات التكرار</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* شريط التقدم */}
      {status?.isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>التقدم: {status.processedItems} من {status.totalItems}</span>
                <span>{Math.round(status.progress)}%</span>
              </div>
              <Progress value={status.progress} className="w-full" />
              {status.currentItem && (
                <p className="text-sm text-gray-600">
                  <Clock className="h-4 w-4 inline ml-1" />
                  البند الحالي: {status.currentItem}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* أزرار التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            التحكم في التوحيد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* معلومات عن المعالجة */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">معالجة بند بند - دقة 100%</h4>
              </div>
              <p className="text-xs text-blue-700">
                النظام يعالج كل بند مع جميع البنود الأخرى لضمان أعلى دقة.
                قد تستغرق العملية 15-30 دقيقة للحصول على نتائج دقيقة.
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3">
              <Button
                onClick={() => startMutation.mutate()}
                disabled={status?.isRunning || startMutation.isPending}
                className="flex-1"
              >
                <Play className="h-4 w-4 ml-2" />
                {startMutation.isPending ? "جاري البدء..." : "بدء التوحيد بند بند"}
              </Button>
              
              <Button
                onClick={() => stopMutation.mutate()}
                disabled={!status?.isRunning || stopMutation.isPending}
                variant="destructive"
              >
                <Square className="h-4 w-4 ml-2" />
                إيقاف
              </Button>
              
              <Button
                onClick={() => resetMutation.mutate()}
                disabled={status?.isRunning || resetMutation.isPending}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات التوحيد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            إحصائيات التوحيد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">وقت البدء</h4>
              <p className="text-sm text-gray-600">{formatTime(status?.startTime || null)}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">وقت الانتهاء</h4>
              <p className="text-sm text-gray-600">{formatTime(status?.endTime || null)}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">المدة المستغرقة</h4>
              <p className="text-sm text-gray-600">
                {formatDuration(status?.startTime || null, status?.endTime || null)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">معدل النجاح</h4>
              <p className="text-sm text-gray-600">
                {status?.totalItems && status.itemsUnified 
                  ? `${Math.round((status.itemsUnified / status.totalItems) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* سجل الأحداث */}
      {status?.logs && status.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              سجل الأحداث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
              {status.logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}