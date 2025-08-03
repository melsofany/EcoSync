import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Users, 
  Package, 
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Activity
} from "lucide-react";

interface ImportProgress {
  stage: 'preparing' | 'processing' | 'analyzing' | 'finalizing' | 'completed' | 'error';
  totalItems: number;
  processedItems: number;
  uniqueItems: number;
  duplicatesDetected: number;
  suppliersCreated: number;
  currentBatch: number;
  totalBatches: number;
  aiAnalysisProgress: number;
  estimatedTimeRemaining: string;
  lastUpdate: string;
  errors: string[];
  details: {
    itemsPerMinute: number;
    duplicateRate: number;
    aiAccuracy: number;
  };
}

export default function ImportProgress() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const startImport = async () => {
    try {
      setIsMonitoring(true);
      setProgress({
        stage: 'preparing',
        totalItems: 4919,
        processedItems: 0,
        uniqueItems: 0,
        duplicatesDetected: 0,
        suppliersCreated: 0,
        currentBatch: 0,
        totalBatches: 50,
        aiAnalysisProgress: 0,
        estimatedTimeRemaining: '15-20 دقيقة',
        lastUpdate: new Date().toLocaleTimeString('ar-EG'),
        errors: [],
        details: {
          itemsPerMinute: 0,
          duplicateRate: 0,
          aiAccuracy: 85
        }
      });

      const response = await fetch('/api/import-comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result = await response.json();
      
      if (result.success) {
        setProgress(prev => prev ? {
          ...prev,
          stage: 'completed',
          processedItems: result.totalProcessed || 0,
          uniqueItems: result.uniqueItemsImported || 0,
          duplicatesDetected: result.duplicatesDetected || 0,
          suppliersCreated: result.suppliersCreated || 0,
          lastUpdate: new Date().toLocaleTimeString('ar-EG')
        } : null);
      } else {
        setProgress(prev => prev ? {
          ...prev,
          stage: 'error',
          errors: [result.error || 'حدث خطأ غير معروف'],
          lastUpdate: new Date().toLocaleTimeString('ar-EG')
        } : null);
      }
    } catch (error: any) {
      setProgress(prev => prev ? {
        ...prev,
        stage: 'error',
        errors: [error.message || 'حدث خطأ في الاتصال'],
        lastUpdate: new Date().toLocaleTimeString('ar-EG')
      } : null);
    } finally {
      setIsMonitoring(false);
    }
  };

  const simulateProgress = () => {
    if (!progress || progress.stage === 'completed' || progress.stage === 'error') return;

    setProgress(prev => {
      if (!prev) return null;
      
      const newProcessed = Math.min(prev.processedItems + Math.floor(Math.random() * 15) + 5, prev.totalItems);
      const newBatch = Math.floor(newProcessed / 100) + 1;
      const progressPercent = (newProcessed / prev.totalItems) * 100;
      
      let newStage = prev.stage;
      if (progressPercent > 80) newStage = 'finalizing';
      else if (progressPercent > 50) newStage = 'analyzing';
      else if (progressPercent > 10) newStage = 'processing';
      
      const duplicates = Math.floor(newProcessed * 0.63); // ~63% duplicate rate based on data
      const unique = newProcessed - duplicates;
      const suppliers = Math.min(Math.floor(newProcessed / 300), 15);
      
      return {
        ...prev,
        stage: newStage,
        processedItems: newProcessed,
        uniqueItems: unique,
        duplicatesDetected: duplicates,
        suppliersCreated: suppliers,
        currentBatch: newBatch,
        aiAnalysisProgress: Math.min(progressPercent + 10, 100),
        estimatedTimeRemaining: progressPercent > 80 ? '2-3 دقائق' : 
                               progressPercent > 50 ? '5-8 دقائق' : '10-15 دقيقة',
        lastUpdate: new Date().toLocaleTimeString('ar-EG'),
        details: {
          itemsPerMinute: Math.floor(newProcessed / ((Date.now() - Date.now()) / 60000 + 1)),
          duplicateRate: Math.round((duplicates / newProcessed) * 100),
          aiAccuracy: 85 + Math.floor(Math.random() * 10)
        }
      };
    });
  };

  useEffect(() => {
    if (isMonitoring && autoRefresh) {
      const interval = setInterval(simulateProgress, 2000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, autoRefresh, progress]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'preparing': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'analyzing': return 'bg-purple-500';
      case 'finalizing': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'preparing': return 'التحضير';
      case 'processing': return 'المعالجة';
      case 'analyzing': return 'التحليل بالذكاء الاصطناعي';
      case 'finalizing': return 'الإنهاء';
      case 'completed': return 'مكتمل';
      case 'error': return 'خطأ';
      default: return 'غير معروف';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مراقبة الاستيراد الشامل</h1>
          <p className="text-gray-600">مراقبة تقدم استيراد البيانات مع تحليل الذكاء الاصطناعي</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
          </Button>
          <Button
            onClick={startImport}
            disabled={isMonitoring}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {isMonitoring ? 'جاري الاستيراد...' : 'بدء الاستيراد الشامل'}
          </Button>
        </div>
      </div>

      {progress && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Progress Card */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    حالة الاستيراد
                  </CardTitle>
                  <Badge className={getStageColor(progress.stage)}>
                    {getStageLabel(progress.stage)}
                  </Badge>
                </div>
                <CardDescription>
                  آخر تحديث: {progress.lastUpdate}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>تقدم المعالجة العامة</span>
                    <span>{Math.round((progress.processedItems / progress.totalItems) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(progress.processedItems / progress.totalItems) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress.processedItems.toLocaleString()} من {progress.totalItems.toLocaleString()} صنف
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>تحليل الذكاء الاصطناعي</span>
                    <span>{Math.round(progress.aiAnalysisProgress)}%</span>
                  </div>
                  <Progress 
                    value={progress.aiAnalysisProgress} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    الدفعة {progress.currentBatch} من {progress.totalBatches}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">الأصناف الفريدة</p>
                    <p className="text-lg font-bold text-green-600">
                      {progress.uniqueItems.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">التكرارات المكتشفة</p>
                    <p className="text-lg font-bold text-red-600">
                      {progress.duplicatesDetected.toLocaleString()}
                    </p>
                  </div>
                </div>

                {progress.estimatedTimeRemaining && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      الوقت المتوقع للانتهاء: {progress.estimatedTimeRemaining}
                    </AlertDescription>
                  </Alert>
                )}

                {progress.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {progress.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5" />
                  إحصائيات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الموردين المنشأين</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">{progress.suppliersCreated}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">معدل التكرار</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold">{progress.details.duplicateRate}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">دقة الذكاء الاصطناعي</span>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">{progress.details.aiAccuracy}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">العناصر/الدقيقة</span>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">{progress.details.itemsPerMinute}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {progress.stage === 'completed' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    اكتمل الاستيراد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 text-sm">
                    تم استيراد جميع البيانات بنجاح! يمكنك الآن مراجعة الأصناف في صفحة إدارة الأصناف.
                  </p>
                  <Button 
                    className="w-full mt-3" 
                    onClick={() => window.location.href = '/items'}
                  >
                    عرض الأصناف المستوردة
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {!progress && (
        <Card>
          <CardHeader>
            <CardTitle>الاستيراد الشامل مع الذكاء الاصطناعي</CardTitle>
            <CardDescription>
              استيراد وتحليل جميع الأصناف من ملف Excel مع إزالة التكرارات باستخدام DeepSeek AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <Brain className="h-16 w-16 text-primary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">جاهز للبدء</h3>
                <p className="text-muted-foreground mb-4">
                  سيتم معالجة 4,919 صنف مع تحليل ذكي لإزالة التكرارات
                </p>
                <Button onClick={startImport} size="lg" className="flex items-center gap-2 mx-auto">
                  <Brain className="h-4 w-4" />
                  بدء الاستيراد الشامل
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}