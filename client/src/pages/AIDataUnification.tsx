import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  PlayCircle, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Brain,
  Target,
  Activity,
  TrendingUp,
  Database,
  Layers
} from "lucide-react";
import { motion } from "framer-motion";

interface SemanticUnificationStatus {
  isRunning: boolean;
  progress: number;
  currentItem?: {
    description: string;
    partNumber: string;
    lineItem: string;
  } | null;
}

interface SemanticUnificationStats {
  totalItems: number;
  uniqueItems: number;
  duplicatesFound: number;
  unificationRate: number;
}

interface SemanticUnificationResult {
  totalProcessed: number;
  groupsFound: number;
  itemsUnified: number;
  processingTime: number;
}

export default function AIDataUnification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب حالة التوحيد الدلالي
  const { data: status, isLoading: statusLoading } = useQuery<SemanticUnificationStatus>({
    queryKey: ["/api/ai-unification/status"],
    refetchInterval: (query) => {
      const data = query.state.data as SemanticUnificationStatus;
      return data?.isRunning ? 1000 : 5000;
    }
  });

  // جلب إحصائيات التوحيد
  const { data: stats } = useQuery<SemanticUnificationStats>({
    queryKey: ["/api/ai-unification/stats"],
    refetchInterval: 30000
  });

  // بدء عملية التوحيد الدلالي
  const startSemanticUnification = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-unification/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `خطأ في الخادم: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "🧠 بدء التحليل الدلالي",
          description: data.message || "تم بدء عملية التوحيد بالتحليل الدلالي للمعنى",
          className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
        });
      } else {
        toast({
          title: "تحذير",
          description: data.message || "حدث خطأ في بدء التوحيد الدلالي",
          variant: "destructive"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/ai-unification/status"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحليل الدلالي",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const progressPercentage = status?.progress || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          توحيد المنتجات بالتحليل الدلالي
        </h1>
        <p className="text-gray-600">نظام ذكي يفهم معنى التوصيف ويوحد المنتجات المتطابقة دلالياً</p>
      </motion.div>

      {/* شريط الحالة */}
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                status?.isRunning ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="font-semibold text-lg">
                {status?.isRunning ? 'جاري التحليل الدلالي...' : 'في وضع الانتظار'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {!status?.isRunning && (
                <Button 
                  onClick={() => startSemanticUnification.mutate()}
                  disabled={startSemanticUnification.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Brain className="ml-2 h-4 w-4" />
                  بدء التوحيد الدلالي
                </Button>
              )}
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>التقدم</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            
            {status?.isRunning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-white rounded-lg border"
              >
                <p className="text-sm font-medium mb-1">🧠 جاري التحليل الدلالي للمنتجات...</p>
                {status.currentItem && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border-r-4 border-blue-400">
                    <p className="text-xs font-medium text-gray-700">🔍 البند الحالي:</p>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">التوصيف:</span> {status.currentItem.description.substring(0, 80)}...
                    </p>
                    {status.currentItem.partNumber && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">رقم القطعة:</span> {status.currentItem.partNumber}
                      </p>
                    )}
                    {status.currentItem.lineItem && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">اسم البند:</span> {status.currentItem.lineItem}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-2">يتم تحليل معنى كل توصيف وإيجاد المنتجات المتطابقة دلالياً</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* إجمالي المنتجات */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>إجمالي المنتجات</span>
              <Database className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">
              {stats?.totalItems || 0}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              منتج في النظام
            </p>
          </CardContent>
        </Card>

        {/* المنتجات الفريدة */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>منتجات فريدة</span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">
              {stats?.uniqueItems || 0}
            </p>
            <p className="text-sm text-green-600 mt-1">
              منتج مختلف
            </p>
          </CardContent>
        </Card>

        {/* المكررات المكتشفة */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>مكررات مكتشفة</span>
              <Layers className="h-5 w-5 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-700">
              {stats?.duplicatesFound || 0}
            </p>
            <p className="text-sm text-orange-600 mt-1">
              منتج مكرر
            </p>
          </CardContent>
        </Card>

        {/* معدل التوحيد */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>معدل التوحيد</span>
              <Target className="h-5 w-5 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700">
              {stats?.unificationRate ? stats.unificationRate.toFixed(1) : '0'}%
            </p>
            <p className="text-sm text-purple-600 mt-1">
              نسبة النجاح
            </p>
          </CardContent>
        </Card>
      </div>

      {/* شرح النظام الدلالي */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-green-600" />
            كيف يعمل التحليل الدلالي؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">🔍 تحليل المعنى</h4>
              <ul className="space-y-1 text-green-600">
                <li>• يستخرج الشركة المصنعة والموديل</li>
                <li>• يحلل المواصفات التقنية (جهد، تيار، قدرة)</li>
                <li>• يطبع أرقام الجزء (LC1D-32-M7 = LC1D32M7)</li>
                <li>• يفهم المرادفات والاختصارات</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2">⚡ أمثلة التوحيد</h4>
              <ul className="space-y-1 text-green-600">
                <li>• "LC1D 32 M7" + "LC1D-32-M7" = منتج واحد</li>
                <li>• "شنايدر 32Amp" + "2102034" = منتج واحد</li>
                <li>• نفس المواصفات بتوصيفات مختلفة</li>
                <li>• تجاهل الأخطاء الإملائية والترقيم</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}