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
  isActive: boolean;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  return response.json();
};

export const logout = async (): Promise<void> => {
  await apiRequest("POST", "/api/auth/logout");
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiRequest("GET", "/api/auth/me");
  return response.json();
};

export const hasRole = (user: User | null, roles: string[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const canAccessSection = (user: User | null, section: string): boolean => {
  if (!user) return false;

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
      "supplier-pricing": ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      "customer-pricing": ["manager", "accounting"],
      "purchase-orders": ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      reports: ["manager", "it_admin", "data_entry", "purchasing", "accounting"],
      admin: ["manager", "it_admin"],
    };

    return permissions[section as keyof typeof permissions]?.includes(user.role) ?? false;
  }
};
