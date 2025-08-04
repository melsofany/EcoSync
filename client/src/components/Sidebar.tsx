import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { canAccessSection } from "@/lib/auth";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Building,
  LogOut,
  Circle,
  Users,
  Truck,
  DollarSign,
  TrendingUp,
  Upload,
  Activity,
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDisplayName } from "@/components/UserDisplayName";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();

  const menuItems = [
    {
      title: "لوحة التحكم",
      href: "/",
      icon: LayoutDashboard,
      section: "dashboard",
    },
    {
      title: "طلبات التسعير",
      href: "/quotations",
      icon: FileText,
      section: "quotations",
    },
    {
      title: "إدارة الأصناف",
      href: "/items",
      icon: Package,
      section: "items",
    },
    {
      title: "إدارة العملاء",
      href: "/clients",
      icon: Users,
      section: "clients",
    },
    {
      title: "إدارة الموردين",
      href: "/suppliers",
      icon: Truck,
      section: "suppliers",
    },
    {
      title: "تسعير الموردين",
      href: "/supplier-pricing",
      icon: TrendingUp,
      section: "supplier_pricing",
    },
    {
      title: "تسعير العملاء",
      href: "/customer-pricing",
      icon: DollarSign,
      section: "customer_pricing",
    },
    {
      title: "طلبات الشراء",
      href: "/purchase-orders",
      icon: ShoppingCart,
      section: "purchase-orders",
    },
    {
      title: "التقارير",
      href: "/reports",
      icon: BarChart3,
      section: "reports",
    },
    {
      title: "الإحصائيات",
      href: "/analytics",
      icon: TrendingUp,
      section: "analytics",
    },
    {
      title: "الإعدادات",
      href: "/settings",
      icon: Settings,
      section: "settings",
    },
    {
      title: "إدارة المستخدمين",
      href: "/admin",
      icon: Users,
      section: "admin",
    },
    {
      title: "استيراد البيانات",
      href: "/import",
      icon: Upload,
      section: "import",
    },
    {
      title: "سجل النشاطات",
      href: "/activity-log",
      icon: Activity,
      section: "activity",
    },
  ];

  const getRoleLabel = (role: string) => {
    const roles = {
      manager: "مدير",
      it_admin: "مدير تقنية المعلومات",
      data_entry: "موظف إدخال بيانات",
      purchasing: "موظف مشتريات",
      accounting: "موظف حسابات",
    };
    return roles[role as keyof typeof roles] || String(role).replace(/[<>]/g, '') || "مستخدم";
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "h-full w-64 bg-white shadow-lg border-l border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out",
        "fixed top-0 right-0 lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Company Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img 
                src="/assets/qortoba-logo.png" 
                alt="قرطبة للتوريدات" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base">نظام قرطبة</h2>
              <p className="text-xs text-gray-500">للتوريدات</p>
            </div>
          </div>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <UserDisplayName 
            user={user}
            showUsername={false}
            showEmail={false}
            showPhone={false}
            avatarSize="md"
            layout="horizontal"
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 truncate">
              {getRoleLabel(user.role)}
            </p>
            <div className="flex items-center">
              <Circle className={cn(
                "w-2 h-2 rounded-full",
                user.isOnline ? "fill-green-400 text-green-400" : "fill-gray-400 text-gray-400"
              )} />
              <span className="text-xs text-gray-500 mr-1">
                {user.isOnline ? "متصل" : "غير متصل"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto">
          {menuItems.map((item) => {
            if (!canAccessSection(user, item.section)) {
              return null;
            }

            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className={cn(
                  "flex items-center space-x-4 space-x-reverse px-4 py-4 lg:px-5 lg:py-5 rounded-xl transition-all duration-200 group relative border-2",
                  isActive 
                    ? "bg-primary text-white shadow-lg border-primary-600 transform scale-[1.02]" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-200 hover:shadow-sm"
                )}>
                  <Icon className="h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0" />
                  <span className="font-semibold text-base lg:text-lg leading-tight">
                    {item.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="p-3 lg:p-4 border-t border-gray-200 space-y-2">
          {/* Change Password */}
          <Link href="/change-password" onClick={onClose}>
            <div className="flex items-center space-x-4 space-x-reverse px-4 py-3 lg:px-5 lg:py-4 rounded-xl transition-all duration-200 cursor-pointer border-2 border-transparent text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 hover:shadow-sm">
              <KeyRound className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <span className="font-medium text-sm lg:text-base leading-tight">تغيير كلمة المرور</span>
            </div>
          </Link>

          {/* Logout */}
          <div 
            onClick={() => logout.mutate()}
            className={cn(
              "flex items-center space-x-4 space-x-reverse px-4 py-3 lg:px-5 lg:py-4 rounded-xl transition-all duration-200 cursor-pointer border-2 border-transparent",
              "text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 hover:shadow-sm"
            )}
          >
            <LogOut className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
            <span className="font-medium text-sm lg:text-base leading-tight">تسجيل الخروج</span>
          </div>
        </div>
      </div>
    </>
  );
}