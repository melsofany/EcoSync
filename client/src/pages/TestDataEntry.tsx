import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/components/PermissionGuard";
import { Shield, CheckCircle, XCircle, FileText, Package, ShoppingCart, Users, Truck, BarChart3, Settings } from "lucide-react";

export default function TestDataEntry() {
  const { user } = useAuth();
  const permission = usePermission();

  const testActions = [
    {
      name: "عرض طلبات التسعير",
      resource: "quotations" as const,
      action: "read" as const,
      icon: FileText
    },
    {
      name: "إنشاء طلب تسعير",
      resource: "quotations" as const,
      action: "create" as const,
      icon: FileText
    },
    {
      name: "حذف طلب تسعير",
      resource: "quotations" as const,
      action: "delete" as const,
      icon: FileText
    },
    {
      name: "عرض الأصناف",
      resource: "items" as const,
      action: "read" as const,
      icon: Package
    },
    {
      name: "إنشاء صنف جديد",
      resource: "items" as const,
      action: "create" as const,
      icon: Package
    },
    {
      name: "حذف صنف",
      resource: "items" as const,
      action: "delete" as const,
      icon: Package
    },
    {
      name: "عرض أوامر الشراء",
      resource: "purchaseOrders" as const,
      action: "read" as const,
      icon: ShoppingCart
    },
    {
      name: "إنشاء أمر شراء",
      resource: "purchaseOrders" as const,
      action: "create" as const,
      icon: ShoppingCart
    },
    {
      name: "حذف أمر شراء",
      resource: "purchaseOrders" as const,
      action: "delete" as const,
      icon: ShoppingCart
    },
    {
      name: "عرض العملاء",
      resource: "clients" as const,
      action: "read" as const,
      icon: Users
    },
    {
      name: "إنشاء عميل جديد",
      resource: "clients" as const,
      action: "create" as const,
      icon: Users
    },
    {
      name: "حذف عميل",
      resource: "clients" as const,
      action: "delete" as const,
      icon: Users
    },
    {
      name: "عرض الموردين",
      resource: "suppliers" as const,
      action: "read" as const,
      icon: Truck
    },
    {
      name: "إنشاء مورد جديد",
      resource: "suppliers" as const,
      action: "create" as const,
      icon: Truck
    },
    {
      name: "حذف مورد",
      resource: "suppliers" as const,
      action: "delete" as const,
      icon: Truck
    },
    {
      name: "عرض التقارير",
      resource: "reports" as const,
      action: "read" as const,
      icon: BarChart3
    },
    {
      name: "تصدير التقارير",
      resource: "reports" as const,
      action: "export" as const,
      icon: BarChart3
    },
    {
      name: "عرض المستخدمين",
      resource: "users" as const,
      action: "read" as const,
      icon: Users
    },
    {
      name: "إدارة إعدادات النظام",
      resource: "systemSettings" as const,
      action: "read" as const,
      icon: Settings
    }
  ];

  const getRoleTitle = (role: string) => {
    const titles: Record<string, string> = {
      manager: "مدير",
      it_admin: "مدير تقنية المعلومات",
      data_entry: "موظف إدخال البيانات",
      purchasing: "موظف المشتريات"
    };
    return titles[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">اختبار صلاحيات المستخدم</h1>
          <p className="text-gray-600 mt-2">
            الدور الحالي: <span className="font-semibold text-primary">{getRoleTitle(user?.role || '')}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">مرحباً، {user?.fullName}</p>
          <p className="text-xs text-gray-400">@{user?.username}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Shield className="h-5 w-5" />
            <span>اختبار الصلاحيات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testActions.map((test, index) => {
              const hasPermission = permission.hasPermission(test.resource, test.action);
              const Icon = test.icon;
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    hasPermission 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${
                      hasPermission ? 'text-green-600' : 'text-red-600'
                    }`} />
                    {hasPermission ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <h3 className={`text-sm font-medium ${
                    hasPermission ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {test.name}
                  </h3>
                  <p className={`text-xs mt-1 ${
                    hasPermission ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {hasPermission ? 'مسموح' : 'غير مسموح'}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">ملخص الصلاحيات:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600 font-medium">
                  المسموح: {testActions.filter(test => permission.hasPermission(test.resource, test.action)).length}
                </span>
              </div>
              <div>
                <span className="text-red-600 font-medium">
                  غير مسموح: {testActions.filter(test => !permission.hasPermission(test.resource, test.action)).length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}