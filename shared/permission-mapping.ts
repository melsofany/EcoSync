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
  
  // أوامر الشراء
  'perm-018': 'purchaseOrders.view',
  'perm-019': 'purchaseOrders.create',
  'perm-020': 'purchaseOrders.edit',
  'perm-021': 'purchaseOrders.delete',
  'perm-022': 'purchaseOrders.approve',
  'perm-023': 'purchaseOrders.cancel',
  
  // أسعار الموردين
  'perm-024': 'supplierPricing.view',
  'perm-025': 'supplierPricing.create',
  'perm-026': 'supplierPricing.edit',
  'perm-027': 'supplierPricing.delete',
  
  // أسعار العملاء
  'perm-028': 'customerPricing.view',
  'perm-029': 'customerPricing.create',
  'perm-030': 'customerPricing.edit',
  'perm-031': 'customerPricing.delete',
  
  // التقارير والإحصائيات
  'perm-032': 'reports.view',
  'perm-033': 'reports.export',
  'perm-034': 'analytics.view',
  'perm-035': 'analytics.export',
  
  // الإدارة والنظام
  'perm-036': 'admin.userManagement',
  'perm-037': 'admin.systemSettings',
  'perm-038': 'admin.backupRestore',
  'perm-039': 'admin.activityLog',
  
  // استيراد وتصدير البيانات
  'perm-040': 'import.quotations',
  'perm-041': 'import.items',
  'perm-042': 'import.purchaseOrders',
  'perm-043': 'export.data',
  
  // خدمات إضافية
  'perm-044': 'telegram.bot',
  'perm-045': 'data.unification',
  'perm-046': 'voice.control',
  
  // احتياطي للتوسع المستقبلي
  'perm-047': 'future.feature1',
  'perm-048': 'future.feature2',
  'perm-049': 'future.feature3'
};

// دالة لتحويل الصلاحيات المرقمة إلى صلاحيات فعلية
export function convertNumberedPermissions(numberedPermissions: string[]): string[] {
  // إذا وجدت 49 صلاحية كاملة، أعطي كل الصلاحيات
  if (numberedPermissions.length >= 49) {
    console.log('✅ المستخدم لديه جميع الصلاحيات (49 صلاحية)');
    // إرجاع جميع الصلاحيات الفعلية
    return Object.values(PERMISSION_ID_MAPPING);
  }
  
  const actualPermissions: string[] = [];
  
  for (const perm of numberedPermissions) {
    // إزالة المسافات وعلامات الاقتباس الزائدة
    const cleanPerm = perm.trim().replace(/['"]/g, '');
    const mappedPermission = PERMISSION_ID_MAPPING[cleanPerm];
    
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
  if (!user) return [];
  
  let userPermissions: string[] = [];
  
  // نقرأ الصلاحيات من حقل permissions فقط
  if (user.permissions && Array.isArray(user.permissions)) {
    userPermissions = user.permissions;
    console.log(`📋 المستخدم ${user.username} لديه ${userPermissions.length} صلاحية مرقمة`);
  } else if (user.permissions && typeof user.permissions === 'string') {
    // إذا كانت الصلاحيات نص مفصول بفواصل
    userPermissions = user.permissions.split(',').map((p: string) => p.trim());
    console.log(`📋 المستخدم ${user.username} لديه ${userPermissions.length} صلاحية مرقمة (من نص)`);
  } else {
    // لا توجد صلاحيات
    console.log(`⚠️ المستخدم ${user.username} لا يملك أي صلاحيات`);
    return [];
  }
  
  // تحويل الصلاحيات المرقمة إلى صلاحيات فعلية
  const result = convertNumberedPermissions(userPermissions);
  console.log(`✅ تم تحويل ${userPermissions.length} صلاحية مرقمة إلى ${result.length} صلاحية فعلية`);
  
  return result;
}

// دالة للتحقق من الوصول لقسم معين
export function canUserAccessSection(user: any, section: string): boolean {
  const actualPermissions = getUserActualPermissions(user);
  
  // إذا لم يكن للمستخدم صلاحيات
  if (actualPermissions.length === 0) {
    console.log(`❌ المستخدم ${user.username} لا يملك أي صلاحيات للوصول إلى ${section}`);
    return false;
  }
  
  // إذا كان لديه جميع الصلاحيات (49 صلاحية)
  if (actualPermissions.length >= 49) {
    console.log(`✅ المستخدم ${user.username} لديه جميع الصلاحيات - السماح بالوصول للقسم ${section}`);
    return true;
  }
  
  // للصلاحيات المفصلة
  const sectionPermissionMap: Record<string, string[]> = {
    dashboard: ['dashboard'],
    quotations: ['quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete'],
    items: ['items.view', 'items.create', 'items.edit', 'items.delete'],
    clients: ['clients.view', 'clients.create', 'clients.edit', 'clients.delete'],
    suppliers: ['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete'],
    supplier_pricing: ['supplierPricing.view', 'supplierPricing.create', 'supplierPricing.edit', 'supplierPricing.delete'],
    customer_pricing: ['customerPricing.view', 'customerPricing.create', 'customerPricing.edit', 'customerPricing.delete'],
    'purchase-orders': ['purchaseOrders.view', 'purchaseOrders.create', 'purchaseOrders.edit', 'purchaseOrders.delete', 'purchaseOrders.approve', 'purchaseOrders.cancel'],
    reports: ['reports.view', 'reports.export'],
    analytics: ['analytics.view', 'analytics.export'],
    settings: ['admin.systemSettings'],
    import: ['import.quotations', 'import.items', 'import.purchaseOrders'],
    export: ['export.data'],
    activity: ['admin.activityLog'],
    admin: ['admin.userManagement', 'admin.systemSettings', 'admin.backupRestore', 'admin.activityLog'],
    telegram: ['telegram.bot'],
    unification: ['data.unification'],
    voice_control: ['voice.control']
  };
  
  const requiredPermissions = sectionPermissionMap[section];
  if (!requiredPermissions) return false;
  
  // التحقق من وجود أي من الصلاحيات المطلوبة
  return requiredPermissions.some(perm => actualPermissions.includes(perm));
}

// دالة للتحقق من صلاحية عملية معينة
export function canUserPerformAction(user: any, resource: string, action: string): boolean {
  const actualPermissions = getUserActualPermissions(user);
  
  // إذا لم يكن للمستخدم صلاحيات
  if (actualPermissions.length === 0) {
    console.log(`❌ المستخدم ${user.username} لا يملك أي صلاحيات لتنفيذ ${action} على ${resource}`);
    return false;
  }
  
  // بناء اسم الصلاحية المطلوبة
  const requiredPermission = `${resource}.${action}`;
  
  // التحقق من وجود الصلاحية
  const hasPermission = actualPermissions.includes(requiredPermission);
  
  if (hasPermission) {
    console.log(`✅ المستخدم ${user.username} لديه صلاحية ${requiredPermission}`);
  } else {
    console.log(`❌ المستخدم ${user.username} لا يملك صلاحية ${requiredPermission}`);
  }
  
  return hasPermission;
}