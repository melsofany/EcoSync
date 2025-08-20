import { apiRequest } from "./queryClient";
import { 
  getUserActualPermissions, 
  canUserAccessSection, 
  canUserPerformAction 
} from "@shared/permission-mapping";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions?: string[]; // صلاحيات مفصلة اختيارية
  isActive: boolean;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    // apiRequest الآن ترجع JSON مباشرة
    return response;
  } catch (error: any) {
    console.error("❌ خطأ في تسجيل الدخول:", error);
    if (error.message?.includes('fetch')) {
      throw new Error("خطأ في الاتصال بالخادم. تأكد من اتصال الإنترنت");
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  await apiRequest("POST", "/api/auth/logout");
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiRequest("GET", "/api/auth/me");
  return response;
};

export const hasRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  
  // الحصول على الصلاحيات الفعلية للمستخدم
  const actualPermissions = getUserActualPermissions(user);
  
  // إذا كان المستخدم له دور تقليدي
  if (actualPermissions.length === 1 && !actualPermissions[0].includes('.')) {
    // التحقق من الأدوار التقليدية
    return roles.includes(actualPermissions[0]);
  }
  
  // للمستخدمين بصلاحيات مفصلة، التحقق من وجود صلاحيات إدارية
  // نتحقق من وجود صلاحيات إدارة المستخدمين أو إعدادات النظام
  if (actualPermissions.includes('admin.userManagement') || 
      actualPermissions.includes('admin.systemSettings')) {
    // إذا كان المطلوب صلاحيات إدارية
    if (roles.includes('manager') || roles.includes('it_admin')) {
      return true;
    }
  }
  
  // التحقق من صلاحيات محددة بناء على الأدوار المطلوبة
  if (roles.includes('data_entry')) {
    // التحقق من صلاحيات إدخال البيانات
    return actualPermissions.includes('items.create') || 
           actualPermissions.includes('quotations.create');
  }
  
  if (roles.includes('purchasing')) {
    // التحقق من صلاحيات المشتريات
    return actualPermissions.includes('purchaseOrders.create') || 
           actualPermissions.includes('suppliers.edit');
  }
  
  if (roles.includes('accounting')) {
    // التحقق من صلاحيات المحاسبة
    return actualPermissions.includes('reports.view') || 
           actualPermissions.includes('pricing.viewMargins');
  }
  
  return false;
};

export const canAccessSection = (user: User | null, section: string): boolean => {
  if (!user) return false;
  
  // استخدام النظام الجديد للصلاحيات
  return canUserAccessSection(user, section);
};

// دالة جديدة للتحقق من صلاحية عملية معينة
export const canPerformAction = (user: User | null, resource: string, action: string): boolean => {
  if (!user) return false;
  
  // استخدام النظام الجديد للتحقق من العمليات
  return canUserPerformAction(user, resource, action);
};
