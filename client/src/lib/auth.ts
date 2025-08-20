import { apiRequest } from "./queryClient";

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
  
  // التحقق من الصلاحيات سواء كانت في permissions أو في role
  let userPermissions: string[] = [];
  
  // إذا كانت الصلاحيات في حقل permissions كمصفوفة
  if (user.permissions && user.permissions.length > 0) {
    userPermissions = user.permissions;
  }
  // إذا كانت الصلاحيات في حقل role كسلسلة نصية مفصولة بفواصل
  else if (user.role && user.role.includes('perm-')) {
    userPermissions = user.role.split(',').map(p => p.trim());
  }
  
  // إذا كان للمستخدم صلاحيات مفصلة
  if (userPermissions.length > 0) {
    // التحقق من وجود صلاحيات إدارية أساسية
    const hasAdminPermissions = userPermissions.some(p => 
      ['perm-001', 'perm-002', 'perm-003', 'perm-010'].includes(p)
    );
    if (hasAdminPermissions) {
      return true; // منح الوصول الكامل للمستخدمين ذوي الصلاحيات الإدارية
    }
  }
  
  // التحقق العادي من الأدوار
  return roles.includes(user.role);
};

export const canAccessSection = (user: User | null, section: string): boolean => {
  if (!user) return false;

  // التحقق من الصلاحيات سواء كانت في permissions أو في role
  let userPermissions: string[] = [];
  
  // إذا كانت الصلاحيات في حقل permissions كمصفوفة
  if (user.permissions && user.permissions.length > 0) {
    userPermissions = user.permissions;
  }
  // إذا كانت الصلاحيات في حقل role كسلسلة نصية مفصولة بفواصل
  else if (user.role && user.role.includes('perm-')) {
    userPermissions = user.role.split(',').map(p => p.trim());
  }
  
  // إذا كان للمستخدم صلاحيات مفصلة، منحه الوصول الكامل إذا كان لديه صلاحيات إدارية
  if (userPermissions.length > 0) {
    const hasAdminPermissions = userPermissions.some(p => 
      ['perm-001', 'perm-002', 'perm-003', 'perm-010'].includes(p)
    );
    if (hasAdminPermissions) {
      return true; // منح الوصول الكامل للمستخدمين ذوي الصلاحيات الإدارية
    }
  }

  // استخدام نظام الصلاحيات الجديد إذا كان متوفراً
  try {
    const { canAccessSection: newCanAccessSection } = require('../../shared/permissions');
    return newCanAccessSection(user, section);
  } catch (e) {
    // العودة للنظام القديم في حالة عدم توفر الملف
    const permissions = {
      dashboard: ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      quotations: ["manager", "it_admin", "data_entry", "accounting"],
      items: ["manager", "it_admin", "data_entry"],
      clients: ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      suppliers: ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      supplier_pricing: ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      customer_pricing: ["manager", "accounting"],
      "purchase-orders": ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      reports: ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      admin: ["manager", "it_admin"],
    };

    return permissions[section as keyof typeof permissions]?.includes(user.role) ?? false;
  }
};
