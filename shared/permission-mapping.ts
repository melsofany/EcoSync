// نظام ربط الصلاحيات المرقمة بالصلاحيات الفعلية
export const PERMISSION_ID_MAPPING: Record<string, string> = {
  // لوحة التحكم
  'perm-001': 'dashboard',
  
  // طلبات التسعير
  'perm-002': 'quotations.view',
  'perm-003': 'quotations.create',
  'perm-004': 'quotations.edit',
  'perm-005': 'quotations.delete',
  
  // الأصناف
  'perm-006': 'items.view',
  'perm-007': 'items.create',
  'perm-008': 'items.edit',
  'perm-009': 'items.delete',
  
  // العملاء
  'perm-010': 'clients.view',
  'perm-011': 'clients.create',
  'perm-012': 'clients.edit',
  'perm-013': 'clients.delete',
  
  // الموردين
  'perm-014': 'suppliers.view',
  'perm-015': 'suppliers.create',
  'perm-016': 'suppliers.edit',
  'perm-017': 'suppliers.delete',
  
  // طلبات الشراء
  'perm-018': 'purchaseOrders.view',
  'perm-019': 'purchaseOrders.create',
  'perm-020': 'purchaseOrders.edit',
  'perm-021': 'purchaseOrders.delete',
  
  // تسعير الموردين
  'perm-022': 'supplierPricing.view',
  'perm-023': 'supplierPricing.create',
  'perm-024': 'supplierPricing.edit',
  'perm-025': 'supplierPricing.delete',
  
  // تسعير العملاء
  'perm-026': 'customerPricing.view',
  'perm-027': 'customerPricing.create',
  'perm-028': 'customerPricing.edit',
  'perm-029': 'customerPricing.delete',
  
  // التقارير
  'perm-030': 'reports.view',
  'perm-031': 'reports.export',
  
  // الإحصائيات
  'perm-032': 'analytics.view',
  
  // الإدارة
  'perm-033': 'admin.userManagement',
  'perm-034': 'admin.systemSettings',
  'perm-035': 'admin.backupRestore',
  
  // استيراد البيانات
  'perm-036': 'import.quotations',
  'perm-037': 'import.items',
  'perm-038': 'import.purchaseOrders',
  
  // سجل النشاطات
  'perm-039': 'activity.view',
  
  // صلاحيات الأسعار
  'perm-040': 'pricing.viewSalePrices',
  'perm-041': 'pricing.viewSupplierPrices',
  'perm-042': 'pricing.viewPurchaseOrderPrices',
  'perm-043': 'pricing.viewCosts',
  'perm-044': 'pricing.viewMargins',
  
  // صلاحيات إضافية مستقبلية
  'perm-045': 'telegram.bot',
  'perm-046': 'data.unification',
  'perm-047': 'voice.control',
  'perm-048': 'backup.database',
  'perm-049': 'system.advanced'
};

// دالة لتحويل الصلاحيات المرقمة إلى صلاحيات فعلية
export function convertNumberedPermissions(numberedPermissions: string[]): string[] {
  const actualPermissions: string[] = [];
  
  for (const perm of numberedPermissions) {
    const mappedPermission = PERMISSION_ID_MAPPING[perm.trim()];
    if (mappedPermission) {
      actualPermissions.push(mappedPermission);
    }
  }
  
  return actualPermissions;
}

// دالة للتحقق من صلاحية معينة
export function hasSpecificPermission(userPermissions: string[], requiredPermission: string): boolean {
  // تحويل الصلاحيات المرقمة إلى صلاحيات فعلية
  const actualPermissions = convertNumberedPermissions(userPermissions);
  
  // التحقق من وجود الصلاحية المطلوبة
  return actualPermissions.includes(requiredPermission);
}

// دالة للحصول على جميع الصلاحيات الفعلية للمستخدم
export function getUserActualPermissions(user: any): string[] {
  let userPermissions: string[] = [];
  
  // إذا كانت الصلاحيات في حقل permissions كمصفوفة
  if (user.permissions && Array.isArray(user.permissions)) {
    userPermissions = user.permissions;
  }
  // إذا كانت الصلاحيات في حقل role كسلسلة نصية مفصولة بفواصل
  else if (user.role && user.role.includes('perm-')) {
    userPermissions = user.role.split(',').map((p: string) => p.trim());
  }
  // إذا كان الدور عادي (manager, it_admin, إلخ)
  else if (user.role && !user.role.includes('perm-')) {
    // إرجاع الدور كما هو للتعامل معه بالطريقة التقليدية
    return [user.role];
  }
  
  // تحويل الصلاحيات المرقمة إلى صلاحيات فعلية
  return convertNumberedPermissions(userPermissions);
}

// دالة للتحقق من الوصول لقسم معين
export function canUserAccessSection(user: any, section: string): boolean {
  const actualPermissions = getUserActualPermissions(user);
  
  // إذا كان المستخدم له دور تقليدي
  if (actualPermissions.length === 1 && !actualPermissions[0].includes('.')) {
    // استخدام النظام القديم للأدوار التقليدية
    const traditionalRoles: Record<string, string[]> = {
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
    
    const allowedRoles = traditionalRoles[section];
    return allowedRoles ? allowedRoles.includes(actualPermissions[0]) : false;
  }
  
  // للصلاحيات المفصلة
  const sectionPermissionMap: Record<string, string[]> = {
    dashboard: ['dashboard'],
    quotations: ['quotations.view'],
    items: ['items.view'],
    clients: ['clients.view'],
    suppliers: ['suppliers.view'],
    supplier_pricing: ['supplierPricing.view'],
    customer_pricing: ['customerPricing.view'],
    'purchase-orders': ['purchaseOrders.view'],
    reports: ['reports.view'],
    analytics: ['analytics.view'],
    admin: ['admin.userManagement', 'admin.systemSettings', 'admin.backupRestore'],
    import: ['import.quotations', 'import.items', 'import.purchaseOrders'],
    activity: ['activity.view'],
    telegram: ['telegram.bot'],
    unification: ['data.unification'],
    voice: ['voice.control']
  };
  
  const requiredPermissions = sectionPermissionMap[section];
  if (!requiredPermissions) return false;
  
  // التحقق من وجود أي من الصلاحيات المطلوبة
  return requiredPermissions.some(perm => actualPermissions.includes(perm));
}

// دالة للتحقق من صلاحية عملية معينة
export function canUserPerformAction(user: any, resource: string, action: string): boolean {
  const actualPermissions = getUserActualPermissions(user);
  
  // إذا كان المستخدم له دور تقليدي مع صلاحيات كاملة
  if (actualPermissions.includes('manager') || actualPermissions.includes('it_admin')) {
    return true;
  }
  
  // بناء اسم الصلاحية المطلوبة
  const requiredPermission = `${resource}.${action}`;
  
  // التحقق من وجود الصلاحية
  return actualPermissions.includes(requiredPermission);
}