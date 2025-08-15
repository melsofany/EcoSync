import { Link, useLocation } from "wouter";
import { canAccessSection } from "@/lib/auth";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  BarChart,
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
  KeyRound,
  Bot,
  Merge,
  Download,
  Database,
  Mic,
  Shield,
  ChevronDown,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDisplayName } from "@/components/UserDisplayName";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  
  // Get user from session or mock for testing
  const user = {
    id: 'admin-user',
    username: 'admin',
    fullName: 'مدير النظام',
    email: 'admin@qurtoba.com',
    role: 'manager',
    profileImage: null,
    permissions: [
      'view_all', 
      'edit_all', 
      'delete_all',
      'user_management',
      'admin_panel',
      'system_settings'
    ]
  };
  
  const logout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Redirect to login page
    window.location.href = '/';
  };

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
      title: "الإدارة العامة",
      href: "/admin",
      icon: Shield,
      section: "admin",
    },
    {
      title: "إدارة المستخدمين",
      href: "/user-management",
      icon: Users,
      section: "admin",
      parentSection: "admin", // هذا عنصر فرعي تحت الإدارة العامة
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
    {
      title: "بوت تليجرام",
      href: "/telegram-bot",
      icon: Bot,
      section: "admin",
    },

    {
      title: "مراقب التوحيد الذكي",
      href: "/unification-monitor",
      icon: Merge,
      section: "admin",
    },
    {
      title: "شاشة التوحيد المتقدمة",
      href: "/unification-progress",
      icon: BarChart,
      section: "admin",
    },
    {
      title: "الأوامر الصوتية",
      href: "/voice-control",
      icon: Mic,
      section: "voice_control",
    },
    {
      title: "استرداد البيانات",
      href: "/data-recovery",
      icon: Download,
      section: "admin",
    },
    {
      title: "حفظ قاعدة البيانات",
      href: "/database-storage",
      icon: Database,
      section: "admin",
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

            // إخفاء إدارة المستخدمين إذا لم يكن المستخدم مدير
            if (item.href === '/user-management' && user.role !== 'manager') {
              return null;
            }

            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const isSubItem = item.parentSection; // العناصر الفرعية

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className={cn(
                  "flex items-center space-x-4 space-x-reverse px-4 py-4 lg:px-5 lg:py-5 rounded-xl transition-all duration-200 group relative border-2",
                  isSubItem ? "mr-4 border-l-2 border-l-gray-200" : "", // مسافة إضافية للعناصر الفرعية
                  isActive 
                    ? "bg-primary text-white shadow-lg border-primary-600 transform scale-[1.02]" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-200 hover:shadow-sm"
                )}>
                  <Icon className={cn(
                    "flex-shrink-0",
                    isSubItem ? "h-5 w-5 lg:h-6 lg:w-6" : "h-6 w-6 lg:h-7 lg:w-7"
                  )} />
                  <span className={cn(
                    "font-semibold leading-tight",
                    isSubItem ? "text-sm lg:text-base" : "text-base lg:text-lg"
                  )}>
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
            onClick={() => logout()}
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