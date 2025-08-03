import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, UserRole, RolePermissions } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  resource: keyof RolePermissions;
  action: 'read' | 'create' | 'update' | 'delete' | 'export' | 'import';
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({ 
  children, 
  resource, 
  action, 
  fallback, 
  showMessage = true 
}: PermissionGuardProps) {
  const { user } = useAuth();
  
  if (!user) {
    return showMessage ? (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            تسجيل الدخول مطلوب
          </h3>
          <p className="text-gray-600">
            يجب تسجيل الدخول للوصول إلى هذا المحتوى
          </p>
        </CardContent>
      </Card>
    ) : null;
  }
  
  const userRole = user.role as UserRole;
  const hasAccess = hasPermission(userRole, resource, action);
  
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return showMessage ? (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            غير مصرح لك
          </h3>
          <p className="text-gray-600">
            ليس لديك صلاحية لتنفيذ هذا الإجراء
          </p>
        </CardContent>
      </Card>
    ) : null;
  }
  
  return <>{children}</>;
}

// Quick permission check hook
export function usePermission() {
  const { user } = useAuth();
  
  return {
    hasPermission: (resource: keyof RolePermissions, action: 'read' | 'create' | 'update' | 'delete' | 'export' | 'import') => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, resource, action);
    },
    canRead: (resource: keyof RolePermissions) => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, resource, 'read');
    },
    canCreate: (resource: keyof RolePermissions) => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, resource, 'create');
    },
    canUpdate: (resource: keyof RolePermissions) => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, resource, 'update');
    },
    canDelete: (resource: keyof RolePermissions) => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, resource, 'delete');
    },
    canExport: (resource: keyof RolePermissions) => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, resource, 'export');
    },
    canImport: (resource: keyof RolePermissions) => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, resource, 'import');
    }
  };
}