import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, CheckCircle, XCircle, Users, MessageSquare, Settings } from "lucide-react";

interface BotStatus {
  status: string;
  botName?: string;
  username?: string;
  authorized_users: number;
  deepseek_configured: boolean;
  error?: string;
}

export default function TelegramBot() {
  const [testItemId, setTestItemId] = useState("");
  const [testPartNumber, setTestPartNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get bot status
  const { data: botStatus, isLoading: statusLoading } = useQuery<BotStatus>({
    queryKey: ["/api/telegram/status"],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Test analysis mutation
  const analyzeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch("/api/telegram/analyze-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم بنجاح",
        description: "تم إرسال التحليل عبر تليجرام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إرسال التحليل",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">غير محدد</Badge>;
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">🟢 نشط</Badge>;
      case 'error':
        return <Badge variant="destructive">🔴 خطأ</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            بوت تليجرام - تحليل البنود
          </h1>
          <p className="text-muted-foreground mt-2">
            نظام التحليل التلقائي للبنود باستخدام الذكاء الاصطناعي
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bot Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              حالة البوت
            </CardTitle>
            <CardDescription>
              المعلومات الحالية للبوت
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>الحالة:</span>
                  {getStatusBadge(botStatus?.status)}
                </div>
                
                {botStatus?.botName && (
                  <div className="flex justify-between items-center">
                    <span>اسم البوت:</span>
                    <span className="font-mono">{botStatus.botName}</span>
                  </div>
                )}
                
                {botStatus?.username && (
                  <div className="flex justify-between items-center">
                    <span>المعرف:</span>
                    <span className="font-mono">@{botStatus.username}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span>المستخدمون المخولون:</span>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {botStatus?.authorized_users || 0}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>DeepSeek AI:</span>
                  {botStatus?.deepseek_configured ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      مُعد
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      غير مُعد
                    </Badge>
                  )}
                </div>

                {botStatus?.error && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">خطأ:</p>
                    <p className="text-red-600 text-sm">{botStatus.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Analysis Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              اختبار التحليل
            </CardTitle>
            <CardDescription>
              اختبر تحليل بند معين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (testItemId.trim()) {
                analyzeItemMutation.mutate(testItemId.trim());
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="itemId">معرف البند</Label>
                <Input
                  id="itemId"
                  value={testItemId}
                  onChange={(e) => setTestItemId(e.target.value)}
                  placeholder="أدخل معرف البند للتحليل"
                />
              </div>
              
              <div>
                <Label htmlFor="partNumber">رقم القطعة (للمرجع)</Label>
                <Input
                  id="partNumber"
                  value={testPartNumber}
                  onChange={(e) => setTestPartNumber(e.target.value)}
                  placeholder="LC1D32M7"
                />
              </div>

              <Button 
                type="submit" 
                disabled={!testItemId.trim() || analyzeItemMutation.isPending}
                className="w-full"
              >
                {analyzeItemMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    تحليل البند
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bot Commands Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              أوامر البوت
            </CardTitle>
            <CardDescription>
              الأوامر المتاحة في تليجرام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/start</code>
                <p className="text-xs text-gray-600 mt-1">بدء استخدام البوت</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/latest</code>
                <p className="text-xs text-gray-600 mt-1">آخر 5 طلبات تسعير</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/analyze [PART_NO]</code>
                <p className="text-xs text-gray-600 mt-1">تحليل بند معين</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm font-mono">/pending</code>
                <p className="text-xs text-gray-600 mt-1">البنود المعلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية الاستخدام</CardTitle>
          <CardDescription>
            إرشادات استخدام بوت تليجرام للتحليل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">التشغيل التلقائي</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• يتم إرسال تحليل تلقائي لكل بند جديد في طلبات التسعير</li>
                <li>• التحليل يشمل الاسم السوقي والوصف التفصيلي</li>
                <li>• معلومات الموردين في مصر وبيانات الاتصال</li>
                <li>• الأسعار التقريبية والمواصفات الفنية</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">الوصول للبوت</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• ابحث عن البوت في تليجرام (سيتم توفير الرابط)</li>
                <li>• أرسل <code>/start</code> لبدء الاستخدام</li>
                <li>• استخدم الأوامر المتاحة للحصول على التحليلات</li>
                <li>• الوصول مقيد للمستخدمين المخولين فقط</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}