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

        {/* Enhanced Navigation */}
        <nav className="flex-1 p-2 lg:p-4 space-y-2">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
              {isOpen ? "القائمة الرئيسية" : ""}
            </h3>
          </div>
          
          {menuItems.map((item) => {
            if (!canAccessSection(user, item.section)) {
              return null;
            }

            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "group relative flex items-center space-x-4 space-x-reverse p-4 rounded-xl transition-all duration-200 transform hover:scale-102",
                  isActive 
                    ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25" 
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md border border-transparent hover:border-gray-200"
                )}>
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-colors",
                    isActive 
                      ? "bg-white/20" 
                      : "bg-gray-100 group-hover:bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-gray-600 group-hover:text-primary"
                    )} />
                  </div>
                  
                  <div className="flex-1">
                    <span className={cn(
                      "font-semibold text-base block",
                      isActive ? "text-white" : "text-gray-800"
                    )}>
                      {item.title}
                    </span>
                    {isActive && (
                      <div className="w-full h-0.5 bg-white/30 mt-2 rounded-full"></div>
                    )}
                  </div>
                  
                  {!isOpen && (
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      {item.title}
                      <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                  )}
                  
                  {isActive && (
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-1 h-8 bg-primary rounded-full shadow-lg"></div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

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