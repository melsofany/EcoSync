import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SyncStatus {
  success: boolean;
  syncActive: boolean;
  interval: string;
  lastSync: string;
  formattedLastSync?: string;
  itemsSynced?: number;
  errors?: string[];
  message: string;
}

export function RealTimeSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // فحص حالة المزامنة عند التحميل
  useEffect(() => {
    checkSyncStatus();
    
    // فحص دوري كل 30 ثانية
    const interval = setInterval(checkSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      const status: SyncStatus = await response.json();
      setSyncStatus(status);
    } catch (error) {
      console.error('❌ خطأ في فحص حالة المزامنة:', error);
    }
  };

  const handleManualSync = async (syncType: 'items' | 'all') => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/sync/${syncType}`);

      if (response.success) {
        toast({
          title: '✅ تم بنجاح',
          description: response.message,
        });
        
        // إعادة فحص الحالة
        setTimeout(checkSyncStatus, 1000);
      } else {
        toast({
          title: '⚠️ تنبيه',
          description: response.message || 'حدث خطأ في المزامنة',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('خطأ في المزامنة:', error);
      toast({
        title: '❌ خطأ',
        description: error.message || 'فشل في عملية المزامنة',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          المزامنة الفورية للبيانات
        </CardTitle>
        <CardDescription>
          تزامن فوري للبيانات بين النظام والمصادر الخارجية كل 10 ثوانٍ
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* حالة المزامنة */}
        <div className="flex items-center justify-between">
          <span className="font-medium">حالة المزامنة:</span>
          {syncStatus ? (
            <Badge 
              variant={syncStatus.syncActive ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {syncStatus.syncActive ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  نشطة
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  متوقفة
                </>
              )}
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              جاري الفحص...
            </Badge>
          )}
        </div>

        {/* فترة المزامنة */}
        {syncStatus && (
          <div className="flex items-center justify-between">
            <span className="font-medium">فترة المزامنة:</span>
            <span className="text-sm text-muted-foreground">
              {syncStatus.interval}
            </span>
          </div>
        )}

        {/* آخر مزامنة */}
        {syncStatus && syncStatus.lastSync && (
          <div className="flex items-center justify-between">
            <span className="font-medium">آخر مزامنة:</span>
            <span className="text-sm text-muted-foreground">
              {syncStatus.formattedLastSync || formatLastSync(syncStatus.lastSync)}
            </span>
          </div>
        )}

        {/* عدد البنود المحدثة */}
        {syncStatus && syncStatus.itemsSynced !== undefined && (
          <div className="flex items-center justify-between">
            <span className="font-medium">البنود المحدثة:</span>
            <Badge variant="secondary">
              {syncStatus.itemsSynced.toLocaleString('ar-EG')} بند
            </Badge>
          </div>
        )}

        {/* الأخطاء إن وجدت */}
        {syncStatus && syncStatus.errors && syncStatus.errors.length > 0 && (
          <div className="border border-red-200 dark:border-red-800 rounded-md p-3 space-y-1">
            <span className="font-medium text-red-600 dark:text-red-400 text-sm">أخطاء حديثة:</span>
            <ul className="text-xs text-red-500 dark:text-red-400 space-y-1">
              {syncStatus.errors.slice(-3).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* أزرار المزامنة اليدوية */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => handleManualSync('items')}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            مزامنة الأصناف
          </Button>
          
          <Button
            onClick={() => handleManualSync('all')}
            disabled={isLoading}
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            مزامنة شاملة
          </Button>
        </div>

        {/* رسالة الحالة */}
        {syncStatus && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {syncStatus.message}
            </p>
          </div>
        )}

        {/* تعليمات المزامنة */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
          <h4 className="font-medium text-sm mb-2">كيفية عمل المزامنة الفورية:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• النظام يفحص البيانات كل 10 ثوانٍ</li>
            <li>• أي تعديل في الشيت يظهر فوراً في النظام</li>
            <li>• يمكن طلب مزامنة فورية بالأزرار أعلاه</li>
            <li>• المزامنة تشمل: الأصناف، طلبات التسعير، أوامر الشراء</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}