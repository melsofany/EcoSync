import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/auth";
import { 
  BarChart3, 
  Users, 
  Calculator, 
  Package, 
  Handshake, 
  Settings,
  FileText,
  Download,
  Search,
  TrendingUp
} from "lucide-react";

export default function Reports() {
  const { user } = useAuth();
  const [reportFilters, setReportFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
  });

  const { data: statistics } = useQuery({
    queryKey: ["/api/statistics"],
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/activity"],
    enabled: hasRole(user, ["manager", "it_admin"]),
  });

  const { data: quotations } = useQuery({
    queryKey: ["/api/quotations"],
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: items } = useQuery({
    queryKey: ["/api/items"],
  });

  const reportCategories = [
    {
      title: "تقرير المبيعات",
      description: "إحصائيات طلبات التسعير وأوامر الشراء",
      icon: BarChart3,
      color: "blue",
      value: "sales",
      access: ["manager", "it_admin", "data_entry", "purchasing"],
    },
    {
      title: "تقرير أداء الموظفين",
      description: "إنجازات ونشاط الموظفين",
      icon: Users,
      color: "green",
      value: "employee",
      access: ["manager", "it_admin"],
    },
    {
      title: "التقرير المالي",
      description: "الحسابات والأرباح والخسائر",
      icon: Calculator,
      color: "purple",
      value: "financial",
      access: ["manager"],
    },
    {
      title: "تقرير الأصناف",
      description: "إحصائيات الأصناف المسجلة",
      icon: Package,
      color: "orange",
      value: "inventory",
      access: ["manager", "it_admin", "data_entry"],
    },
    {
      title: "تقرير العملاء",
      description: "تحليل سلوك وإحصائيات العملاء",
      icon: Handshake,
      color: "red",
      value: "client",
      access: ["manager", "it_admin"],
    },
    {
      title: "تقرير النظام",
      description: "نشاط المستخدمين والنظام",
      icon: Settings,
      color: "gray",
      value: "system",
      access: ["manager", "it_admin"],
    },
  ];

  const canAccessReport = (reportAccess: string[]) => {
    return user && reportAccess.includes(user.role);
  };

  const generateReport = (reportType: string) => {
    // TODO: Implement actual report generation
    console.log(`Generating ${reportType} report with filters:`, reportFilters);
  };

  const exportReport = (format: string) => {
    // TODO: Implement report export functionality
    console.log(`Exporting report as ${format}`);
  };

  // Calculate conversion rate
  const conversionRate = quotations && purchaseOrders 
    ? ((purchaseOrders.length / quotations.length) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">التقارير والإحصائيات</h2>
        <p className="text-gray-600">تقارير شاملة حسب صلاحيات المستخدم</p>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((category) => {
          if (!canAccessReport(category.access)) return null;

          const Icon = category.icon;
          const colorClasses = {
            blue: "bg-blue-100 text-blue-600",
            green: "bg-green-100 text-green-600", 
            purple: "bg-purple-100 text-purple-600",
            orange: "bg-orange-100 text-orange-600",
            red: "bg-red-100 text-red-600",
            gray: "bg-gray-100 text-gray-600",
          };

          return (
            <Card 
              key={category.value} 
              className="card-hover cursor-pointer"
              onClick={() => generateReport(category.value)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[category.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{category.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Search className="h-5 w-5" />
            <span>تخصيص التقرير</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select 
                value={reportFilters.type} 
                onValueChange={(value) => setReportFilters({ ...reportFilters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  {reportCategories.filter(cat => canAccessReport(cat.access)).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                value={reportFilters.startDate}
                onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                value={reportFilters.endDate}
                onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full"
                onClick={() => generateReport(reportFilters.type)}
                disabled={!reportFilters.type}
              >
                <FileText className="h-4 w-4 ml-2" />
                إنشاء التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Report Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>معاينة التقرير - تقرير المبيعات الشهري</CardTitle>
            <div className="flex space-x-2 space-x-reverse">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportReport('excel')}
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                <Download className="h-4 w-4 ml-1" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportReport('pdf')}
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              >
                <Download className="h-4 w-4 ml-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {statistics?.totalQuotations || 0}
              </p>
              <p className="text-sm text-gray-600">إجمالي طلبات التسعير</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {statistics?.totalPurchaseOrders || 0}
              </p>
              <p className="text-sm text-gray-600">أوامر شراء مؤكدة</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
              <p className="text-sm text-gray-600">معدل التحويل</p>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">منطقة عرض الرسوم البيانية</p>
              <p className="text-sm">سيتم عرض المخططات والرسوم البيانية هنا</p>
            </div>
          </div>

          {/* Performance Indicators */}
          {hasRole(user, ["manager", "it_admin"]) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">الأداء العام</h4>
                      <p className="text-sm text-gray-600">مؤشرات الأداء الرئيسية</p>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-semibold">ممتاز</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">نشاط النظام</h4>
                      <p className="text-sm text-gray-600">معدل الاستخدام اليومي</p>
                    </div>
                    <div className="text-orange-600">
                      <span className="font-semibold">{statistics?.activeUsers || 0} نشط</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
