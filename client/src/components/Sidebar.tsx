import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { canAccessSection } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Building,
  LogOut,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen }: SidebarProps) {
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
    };
    return roles[role as keyof typeof roles] || role;
  };

  if (!user) return null;

  return (
    <div className={cn(
      "bg-white shadow-lg border-l border-gray-200 transition-all duration-300",
      isOpen ? "w-64" : "w-16"
    )}>
      {/* Company Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            {/* COMPANY LOGO: Place Al-Khedawi company logo here */}
            <Building className="h-6 w-6 text-primary" />
          </div>
          {isOpen && (
            <div>
              <h2 className="font-bold text-gray-800">نظام الخديوي</h2>
              <p className="text-xs text-gray-500">للتوريدات والمقاولات</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {isOpen && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {getInitials(user.fullName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getRoleLabel(user.role)}
              </p>
            </div>
            <div className="flex items-center">
              <Circle className={cn(
                "w-2 h-2 rounded-full",
                user.isOnline ? "fill-green-400 text-green-400" : "fill-gray-400 text-gray-400"
              )} />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          if (!canAccessSection(user, item.section)) {
            return null;
          }

          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-right h-11",
                  isActive && "bg-primary/10 text-primary border border-primary/20",
                  !isActive && "text-gray-600 hover:bg-gray-100",
                  !isOpen && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5", isOpen && "ml-3")} />
                {isOpen && <span>{item.title}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={cn("absolute bottom-4", isOpen ? "left-4 right-4" : "left-2 right-2")}>
        <Button
          variant="ghost"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className={cn(
            "w-full text-red-600 hover:bg-red-50 hover:text-red-700",
            !isOpen && "justify-center px-2"
          )}
        >
          <LogOut className={cn("h-5 w-5", isOpen && "ml-3")} />
          {isOpen && <span>تسجيل الخروج</span>}
        </Button>
      </div>
    </div>
  );
}
