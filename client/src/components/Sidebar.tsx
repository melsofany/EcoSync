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
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDisplayName } from "@/components/UserDisplayName";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
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
      title: "أسعار الموردين",
      href: "/supplier-pricing",
      icon: DollarSign,
      section: "supplier-pricing",
    },
    {
      title: "تسعير العملاء",
      href: "/customer-pricing",
      icon: TrendingUp,
      section: "customer-pricing",
    },
    {
      title: "أوامر الشراء",
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
      title: "إدارة النظام",
      href: "/admin",
      icon: Settings,
      section: "admin",
    },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      manager: "مدير",
      it_admin: "مدير تقنية المعلومات",
      data_entry: "موظف إدخال بيانات",
      purchasing: "موظف مشتريات",
      accounting: "موظف حسابات",
    };
    return roles[role as keyof typeof roles] || role;
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle} 
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "bg-white shadow-lg border-l border-gray-200 transition-all duration-300 z-30",
        "fixed lg:relative lg:translate-x-0 h-full flex flex-col",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-16"
      )}>
        {/* Company Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center">
              <img 
                src="/assets/qortoba-logo.png" 
                alt="قرطبة للتوريدات" 
                className="h-8 w-8 lg:h-10 lg:w-10 object-contain"
              />
            </div>
            {isOpen && (
              <div>
                <h2 className="font-bold text-gray-800 text-sm lg:text-base">نظام قرطبة</h2>
                <p className="text-xs text-gray-500">للتوريدات</p>
              </div>
            )}
          </div>
        </div>
        
        {/* User Info */}
        {isOpen && (
          <div className="p-3 lg:p-4 border-b border-gray-100 bg-gray-50">
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
        )}

        {/* Static Navigation Content */}
        <div className="flex-1 p-2 lg:p-4">
          <div className="space-y-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium text-gray-800 mb-1">نظام قرطبة</h3>
              <p className="text-xs text-gray-600">إدارة التوريدات</p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg mb-1">🏢</div>
              <p className="text-xs text-blue-800 font-medium">شركة قرطبة للتوريدات</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg mb-1">✅</div>
              <p className="text-xs text-green-800">النظام يعمل بكفاءة</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-2 lg:p-4 border-t border-gray-200">
          <div
            onClick={() => logout.mutate()}
            className={cn(
              "flex items-center space-x-3 space-x-reverse p-2 lg:p-3 rounded-lg transition-colors cursor-pointer",
              "text-red-600 hover:bg-red-50 hover:text-red-700",
              logout.isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <LogOut className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
            {isOpen && <span className="font-medium text-sm lg:text-base">تسجيل الخروج</span>}
          </div>
        </div>
      </div>
    </>
  );
}