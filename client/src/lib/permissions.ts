// Role-based permissions system
export type UserRole = "manager" | "it_admin" | "data_entry" | "purchasing";

export interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  export?: boolean;
  import?: boolean;
}

export interface RolePermissions {
  quotations: Permission;
  items: Permission;
  purchaseOrders: Permission;
  clients: Permission;
  suppliers: Permission;
  users: Permission;
  reports: Permission;
  systemSettings: Permission;
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  manager: {
    quotations: { read: true, create: true, update: true, delete: true, export: true, import: true },
    items: { read: true, create: true, update: true, delete: true, export: true, import: true },
    purchaseOrders: { read: true, create: true, update: true, delete: true, export: true },
    clients: { read: true, create: true, update: true, delete: true, export: true },
    suppliers: { read: true, create: true, update: true, delete: true, export: true },
    users: { read: true, create: true, update: true, delete: true },
    reports: { read: true, create: false, update: false, delete: false, export: true },
    systemSettings: { read: true, create: true, update: true, delete: true }
  },
  it_admin: {
    quotations: { read: true, create: true, update: true, delete: true, export: true, import: true },
    items: { read: true, create: true, update: true, delete: true, export: true, import: true },
    purchaseOrders: { read: true, create: true, update: true, delete: true, export: true },
    clients: { read: true, create: true, update: true, delete: true, export: true },
    suppliers: { read: true, create: true, update: true, delete: true, export: true },
    users: { read: true, create: true, update: true, delete: true },
    reports: { read: true, create: false, update: false, delete: false, export: true },
    systemSettings: { read: true, create: true, update: true, delete: true }
  },
  data_entry: {
    quotations: { read: true, create: true, update: true, delete: false, export: false, import: false },
    items: { read: true, create: true, update: true, delete: false, export: false, import: false },
    purchaseOrders: { read: false, create: false, update: false, delete: false, export: false },
    clients: { read: false, create: false, update: false, delete: false, export: false },
    suppliers: { read: false, create: false, update: false, delete: false, export: false },
    users: { read: false, create: false, update: false, delete: false },
    reports: { read: true, create: false, update: false, delete: false, export: false },
    systemSettings: { read: false, create: false, update: false, delete: false }
  },
  purchasing: {
    quotations: { read: true, create: false, update: true, delete: false, export: true, import: false },
    items: { read: true, create: false, update: false, delete: false, export: true, import: false },
    purchaseOrders: { read: true, create: true, update: true, delete: false, export: true },
    clients: { read: true, create: false, update: false, delete: false, export: false },
    suppliers: { read: true, create: true, update: true, delete: false, export: true },
    users: { read: false, create: false, update: false, delete: false },
    reports: { read: true, create: false, update: false, delete: false, export: true },
    systemSettings: { read: false, create: false, update: false, delete: false }
  }
};

// Helper functions to check permissions
export function hasPermission(
  userRole: UserRole,
  resource: keyof RolePermissions,
  action: keyof Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  const resourcePermissions = rolePermissions[resource];
  return resourcePermissions[action] === true;
}

export function canRead(userRole: UserRole, resource: keyof RolePermissions): boolean {
  return hasPermission(userRole, resource, 'read');
}

export function canCreate(userRole: UserRole, resource: keyof RolePermissions): boolean {
  return hasPermission(userRole, resource, 'create');
}

export function canUpdate(userRole: UserRole, resource: keyof RolePermissions): boolean {
  return hasPermission(userRole, resource, 'update');
}

export function canDelete(userRole: UserRole, resource: keyof RolePermissions): boolean {
  return hasPermission(userRole, resource, 'delete');
}

export function canExport(userRole: UserRole, resource: keyof RolePermissions): boolean {
  return hasPermission(userRole, resource, 'export');
}

export function canImport(userRole: UserRole, resource: keyof RolePermissions): boolean {
  return hasPermission(userRole, resource, 'import');
}

// Get user's allowed navigation items
export function getAllowedNavItems(userRole: UserRole): string[] {
  const navItems: string[] = [];
  
  if (canRead(userRole, 'quotations')) navItems.push('quotations');
  if (canRead(userRole, 'items')) navItems.push('items');
  if (canRead(userRole, 'purchaseOrders')) navItems.push('purchase-orders');
  if (canRead(userRole, 'clients')) navItems.push('clients');
  if (canRead(userRole, 'suppliers')) navItems.push('suppliers');
  if (canRead(userRole, 'users')) navItems.push('users');
  if (canRead(userRole, 'reports')) navItems.push('reports');
  if (canRead(userRole, 'systemSettings')) navItems.push('settings');
  
  return navItems;
}

// Get permission summary for a role
export function getRolePermissionSummary(userRole: UserRole): { 
  resource: string; 
  permissions: string[] 
}[] {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  const summary: { resource: string; permissions: string[] }[] = [];
  
  Object.entries(rolePermissions).forEach(([resource, permissions]) => {
    const allowedActions: string[] = [];
    
    if (permissions.read) allowedActions.push('قراءة');
    if (permissions.create) allowedActions.push('إنشاء');
    if (permissions.update) allowedActions.push('تعديل');
    if (permissions.delete) allowedActions.push('حذف');
    if (permissions.export) allowedActions.push('تصدير');
    if (permissions.import) allowedActions.push('استيراد');
    
    if (allowedActions.length > 0) {
      const resourceNames: Record<string, string> = {
        quotations: 'طلبات التسعير',
        items: 'الأصناف',
        purchaseOrders: 'أوامر الشراء',
        clients: 'العملاء',
        suppliers: 'الموردين',
        users: 'المستخدمين',
        reports: 'التقارير',
        systemSettings: 'إعدادات النظام'
      };
      
      summary.push({
        resource: resourceNames[resource] || resource,
        permissions: allowedActions
      });
    }
  });
  
  return summary;
}