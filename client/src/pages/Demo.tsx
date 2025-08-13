import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users, 
  Globe, 
  Database,
  Zap,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';

const Demo = () => {
  const [currentStats, setCurrentStats] = useState({
    items: 1832,
    quotations: 251,
    purchaseOrders: 91,
    totalValue: 3612085.45,
    users: 12,
    suppliers: 45
  });

  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // تحريك القيم
    const timer = setInterval(() => {
      setAnimatedValue(prev => {
        if (prev < currentStats.totalValue) {
          return Math.min(prev + 50000, currentStats.totalValue);
        }
        return currentStats.totalValue;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentStats.totalValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const systemFeatures = [
    {
      icon: <Database className="w-6 h-6" />,
      title: "Google Sheets Integration",
      description: "مزامنة كاملة مع Google Sheets كمصدر البيانات الوحيد",
      status: "active"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Analysis",
      description: "تحليل ذكي للبيانات وتوحيد الأصناف المكررة تلقائياً",
      status: "active"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Role-Based Access Control",
      description: "إدارة شاملة للصلاحيات بـ 5 أدوار مختلفة",
      status: "active"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Arabic RTL Interface",
      description: "واجهة عربية كاملة بتصميم من اليمين لليسار",
      status: "active"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Excel Import/Export",
      description: "استيراد وتصدير البيانات من وإلى Excel",
      status: "active"
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Production Ready",
      description: "نظام جاهز للإنتاج مع إعدادات أمان متقدمة",
      status: "active"
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "إدخال طلبات التسعير",
      description: "استلام وتسجيل طلبات التسعير من العملاء",
      progress: 100
    },
    {
      step: 2,
      title: "تحليل الأصناف",
      description: "تحليل ذكي للأصناف وتوحيد المكررات",
      progress: 85
    },
    {
      step: 3,
      title: "إعداد العروض",
      description: "تحضير عروض الأسعار للعملاء",
      progress: 70
    },
    {
      step: 4,
      title: "إصدار أوامر الشراء",
      description: "تحويل العروض المقبولة لأوامر شراء",
      progress: 45
    },
    {
      step: 5,
      title: "متابعة التنفيذ",
      description: "متابعة تنفيذ أوامر الشراء والتسليم",
      progress: 30
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Building2 className="w-16 h-16 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                نظام قرطبة للتوريدات
              </h1>
              <p className="text-xl text-gray-600">
                نظام إدارة التوريدات الذكي المتطور
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Google Sheets Powered • AI Enhanced • Production Ready
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-gray-900">
                {currentStats.items.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">الأصناف</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-gray-900">
                {currentStats.quotations}
              </div>
              <p className="text-sm text-gray-600">طلبات التسعير</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-gray-900">
                {currentStats.purchaseOrders}
              </div>
              <p className="text-sm text-gray-600">أوامر الشراء</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(animatedValue).replace('EGP', 'ج.م')}
              </div>
              <p className="text-sm text-gray-600">إجمالي القيمة</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-gray-900">
                {currentStats.users}
              </div>
              <p className="text-sm text-gray-600">المستخدمون</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <div className="text-2xl font-bold text-gray-900">
                {currentStats.suppliers}
              </div>
              <p className="text-sm text-gray-600">الموردون</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">مميزات النظام</TabsTrigger>
            <TabsTrigger value="workflow">سير العمل</TabsTrigger>
            <TabsTrigger value="tech">التقنيات المستخدمة</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {feature.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                          <Badge 
                            variant={feature.status === 'active' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {feature.status === 'active' ? 'نشط' : 'قيد التطوير'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  سير العمل في النظام
                </CardTitle>
                <CardDescription>
                  عملية إدارة التوريدات من البداية حتى النهاية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {workflowSteps.map((step) => (
                  <div key={step.step} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </div>
                        <div>
                          <h3 className="font-semibold">{step.title}</h3>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {step.progress}%
                      </div>
                    </div>
                    <Progress value={step.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tech" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>التقنيات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline">Frontend</Badge>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• React + TypeScript</li>
                        <li>• Shadcn/ui Components</li>
                        <li>• Tailwind CSS</li>
                        <li>• Arabic RTL Support</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">Backend</Badge>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Node.js + Express</li>
                        <li>• TypeScript</li>
                        <li>• Google Sheets API</li>
                        <li>• Session Management</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>مميزات التقنية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">مزامنة حقيقية مع Google Sheets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">تشفير كلمات المرور</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">إعدادات أمان للإنتاج</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">تحليل AI للبيانات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">واجهة متجاوبة للجوال</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">نظام مراقبة العمليات</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.8%</div>
                    <div className="text-sm text-gray-600">وقت التشغيل</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">&lt;2s</div>
                    <div className="text-sm text-gray-600">زمن الاستجابة</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">12K+</div>
                    <div className="text-sm text-gray-600">سجلات معالجة</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">24/7</div>
                    <div className="text-sm text-gray-600">مزامنة مستمرة</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-12">
          <Button size="lg" className="px-8">
            <Database className="w-5 h-5 mr-2" />
            عرض البيانات المباشرة
          </Button>
          <Button variant="outline" size="lg" className="px-8">
            <Settings className="w-5 h-5 mr-2" />
            إعدادات النظام
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Demo;