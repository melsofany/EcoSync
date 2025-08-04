// نظام الصلاحيات المرن
export interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface UserPermissions {
  // Dashboard & Statistics
  view_dashboard: boolean;
  view_statistics: boolean;
  view_activity_log: boolean;
  
  // Quotations Management
  view_quotations: boolean;
  create_quotations: boolean;
  edit_quotations: boolean;
  delete_quotations: boolean;
  import_quotations: boolean;
  export_quotations: boolean;
  
  // Items Management
  view_items: boolean;
  create_items: boolean;
  edit_items: boolean;
  delete_items: boolean;
  import_items: boolean;
  export_items: boolean;
  ai_duplicate_detection: boolean;
  
  // Clients Management
  view_clients: boolean;
  create_clients: boolean;
  edit_clients: boolean;
  delete_clients: boolean;
  
  // Suppliers Management
  view_suppliers: boolean;
  create_suppliers: boolean;
  edit_suppliers: boolean;
  delete_suppliers: boolean;
  
  // Purchase Orders
  view_purchase_orders: boolean;
  create_purchase_orders: boolean;
  edit_purchase_orders: boolean;
  delete_purchase_orders: boolean;
  import_purchase_orders: boolean;
  export_purchase_orders: boolean;
  
  // Supplier Pricing
  view_supplier_pricing: boolean;
  create_supplier_pricing: boolean;
  edit_supplier_pricing: boolean;
  delete_supplier_pricing: boolean;
  
  // Customer Pricing
  view_customer_pricing: boolean;
  create_customer_pricing: boolean;
  edit_customer_pricing: boolean;
  delete_customer_pricing: boolean;
  
  // Reports
  view_reports: boolean;
  export_reports: boolean;
  
  // User Management
  view_users: boolean;
  create_users: boolean;
  edit_users: boolean;
  delete_users: boolean;
  reset_user_passwords: boolean;
  
  // System Administration
  system_settings: boolean;
  database_backup: boolean;
  database_export: boolean;
  system_logs: boolean;
}

export const PERMISSIONS: Permission[] = [
  // Dashboard & Statistics
  { id: 'view_dashboard', name: 'عرض لوحة التحكم', category: 'dashboard', description: 'السماح بعرض لوحة التحكم الرئيسية' },
  { id: 'view_statistics', name: 'عرض الإحصائيات', category: 'dashboard', description: 'السماح بعرض الإحصائيات والمقاييس' },
  { id: 'view_activity_log', name: 'عرض سجل النشاطات', category: 'dashboard', description: 'السماح بعرض سجل نشاطات المستخدمين' },
  
  // Quotations Management
  { id: 'view_quotations', name: 'عرض طلبات التسعير', category: 'quotations', description: 'السماح بعرض طلبات التسعير' },
  { id: 'create_quotations', name: 'إنشاء طلبات التسعير', category: 'quotations', description: 'السماح بإنشاء طلبات تسعير جديدة' },
  { id: 'edit_quotations', name: 'تعديل طلبات التسعير', category: 'quotations', description: 'السماح بتعديل طلبات التسعير الموجودة' },
  { id: 'delete_quotations', name: 'حذف طلبات التسعير', category: 'quotations', description: 'السماح بحذف طلبات التسعير' },
  { id: 'import_quotations', name: 'استيراد طلبات التسعير', category: 'quotations', description: 'السماح باستيراد طلبات التسعير من Excel' },
  { id: 'export_quotations', name: 'تصدير طلبات التسعير', category: 'quotations', description: 'السماح بتصدير طلبات التسعير إلى Excel' },
  
  // Items Management
  { id: 'view_items', name: 'عرض الأصناف', category: 'items', description: 'السماح بعرض قائمة الأصناف' },
  { id: 'create_items', name: 'إنشاء الأصناف', category: 'items', description: 'السماح بإنشاء أصناف جديدة' },
  { id: 'edit_items', name: 'تعديل الأصناف', category: 'items', description: 'السماح بتعديل الأصناف الموجودة' },
  { id: 'delete_items', name: 'حذف الأصناف', category: 'items', description: 'السماح بحذف الأصناف' },
  { id: 'import_items', name: 'استيراد الأصناف', category: 'items', description: 'السماح باستيراد الأصناف من Excel' },
  { id: 'export_items', name: 'تصدير الأصناف', category: 'items', description: 'السماح بتصدير الأصناف إلى Excel' },
  { id: 'ai_duplicate_detection', name: 'كشف التكرارات بالذكاء الاصطناعي', category: 'items', description: 'السماح باستخدام AI لكشف الأصناف المكررة' },
  
  // Clients Management
  { id: 'view_clients', name: 'عرض العملاء', category: 'clients', description: 'السماح بعرض قائمة العملاء' },
  { id: 'create_clients', name: 'إنشاء العملاء', category: 'clients', description: 'السماح بإنشاء عملاء جدد' },
  { id: 'edit_clients', name: 'تعديل العملاء', category: 'clients', description: 'السماح بتعديل بيانات العملاء' },
  { id: 'delete_clients', name: 'حذف العملاء', category: 'clients', description: 'السماح بحذف العملاء' },
  
  // Suppliers Management
  { id: 'view_suppliers', name: 'عرض الموردين', category: 'suppliers', description: 'السماح بعرض قائمة الموردين' },
  { id: 'create_suppliers', name: 'إنشاء الموردين', category: 'suppliers', description: 'السماح بإنشاء موردين جدد' },
  { id: 'edit_suppliers', name: 'تعديل الموردين', category: 'suppliers', description: 'السماح بتعديل بيانات الموردين' },
  { id: 'delete_suppliers', name: 'حذف الموردين', category: 'suppliers', description: 'السماح بحذف الموردين' },
  
  // Purchase Orders
  { id: 'view_purchase_orders', name: 'عرض أوامر الشراء', category: 'purchase_orders', description: 'السماح بعرض أوامر الشراء' },
  { id: 'create_purchase_orders', name: 'إنشاء أوامر الشراء', category: 'purchase_orders', description: 'السماح بإنشاء أوامر شراء جديدة' },
  { id: 'edit_purchase_orders', name: 'تعديل أوامر الشراء', category: 'purchase_orders', description: 'السماح بتعديل أوامر الشراء' },
  { id: 'delete_purchase_orders', name: 'حذف أوامر الشراء', category: 'purchase_orders', description: 'السماح بحذف أوامر الشراء' },
  { id: 'import_purchase_orders', name: 'استيراد أوامر الشراء', category: 'purchase_orders', description: 'السماح باستيراد أوامر الشراء من Excel' },
  { id: 'export_purchase_orders', name: 'تصدير أوامر الشراء', category: 'purchase_orders', description: 'السماح بتصدير أوامر الشراء إلى Excel' },
  
  // Supplier Pricing
  { id: 'view_supplier_pricing', name: 'عرض أسعار الموردين', category: 'pricing', description: 'السماح بعرض أسعار الموردين' },
  { id: 'create_supplier_pricing', name: 'إنشاء أسعار الموردين', category: 'pricing', description: 'السماح بإنشاء أسعار جديدة للموردين' },
  { id: 'edit_supplier_pricing', name: 'تعديل أسعار الموردين', category: 'pricing', description: 'السماح بتعديل أسعار الموردين' },
  { id: 'delete_supplier_pricing', name: 'حذف أسعار الموردين', category: 'pricing', description: 'السماح بحذف أسعار الموردين' },
  
  // Customer Pricing
  { id: 'view_customer_pricing', name: 'عرض أسعار العملاء', category: 'pricing', description: 'السماح بعرض أسعار العملاء' },
  { id: 'create_customer_pricing', name: 'إنشاء أسعار العملاء', category: 'pricing', description: 'السماح بإنشاء أسعار جديدة للعملاء' },
  { id: 'edit_customer_pricing', name: 'تعديل أسعار العملاء', category: 'pricing', description: 'السماح بتعديل أسعار العملاء' },
  { id: 'delete_customer_pricing', name: 'حذف أسعار العملاء', category: 'pricing', description: 'السماح بحذف أسعار العملاء' },
  
  // Reports
  { id: 'view_reports', name: 'عرض التقارير', category: 'reports', description: 'السماح بعرض التقارير المختلفة' },
  { id: 'export_reports', name: 'تصدير التقارير', category: 'reports', description: 'السماح بتصدير التقارير إلى Excel/PDF' },
  
  // User Management
  { id: 'view_users', name: 'عرض المستخدمين', category: 'users', description: 'السماح بعرض قائمة المستخدمين' },
  { id: 'create_users', name: 'إنشاء المستخدمين', category: 'users', description: 'السماح بإنشاء مستخدمين جدد' },
  { id: 'edit_users', name: 'تعديل المستخدمين', category: 'users', description: 'السماح بتعديل بيانات المستخدمين' },
  { id: 'delete_users', name: 'حذف المستخدمين', category: 'users', description: 'السماح بحذف المستخدمين' },
  { id: 'reset_user_passwords', name: 'إعادة تعيين كلمات المرور', category: 'users', description: 'السماح بإعادة تعيين كلمات مرور المستخدمين' },
  
  // System Administration
  { id: 'system_settings', name: 'إعدادات النظام', category: 'system', description: 'السماح بالوصول لإعدادات النظام' },
  { id: 'database_backup', name: 'نسخ احتياطي للقاعدة', category: 'system', description: 'السماح بإنشاء نسخ احتياطية من قاعدة البيانات' },
  { id: 'database_export', name: 'تصدير قاعدة البيانات', category: 'system', description: 'السماح بتصدير قاعدة البيانات كاملة' },
  { id: 'system_logs', name: 'سجلات النظام', category: 'system', description: 'السماح بعرض سجلات النظام المفصلة' },
];

// الصلاحيات الافتراضية للأدوار
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Partial<UserPermissions>> = {
  manager: {
    // إدارية - صلاحيات كاملة
    view_dashboard: true,
    view_statistics: true,
    view_activity_log: true,
    view_quotations: true,
    create_quotations: true,
    edit_quotations: true,
    delete_quotations: true,
    export_quotations: true,
    view_items: true,
    create_items: true,
    edit_items: true,
    delete_items: true,
    export_items: true,
    view_clients: true,
    create_clients: true,
    edit_clients: true,
    delete_clients: true,
    view_suppliers: true,
    create_suppliers: true,
    edit_suppliers: true,
    delete_suppliers: true,
    view_purchase_orders: true,
    create_purchase_orders: true,
    edit_purchase_orders: true,
    delete_purchase_orders: true,
    export_purchase_orders: true,
    view_supplier_pricing: true,
    create_supplier_pricing: true,
    edit_supplier_pricing: true,
    delete_supplier_pricing: true,
    view_customer_pricing: true,
    create_customer_pricing: true,
    edit_customer_pricing: true,
    delete_customer_pricing: true,
    view_reports: true,
    export_reports: true,
    view_users: true,
    create_users: true,
    edit_users: true,
    reset_user_passwords: true,
  },
  
  it_admin: {
    // تقنية المعلومات - صلاحيات تقنية وإدارية
    view_dashboard: true,
    view_statistics: true,
    view_activity_log: true,
    view_quotations: true,
    create_quotations: true,
    edit_quotations: true,
    import_quotations: true,
    export_quotations: true,
    view_items: true,
    create_items: true,
    edit_items: true,
    import_items: true,
    export_items: true,
    ai_duplicate_detection: true,
    view_clients: true,
    create_clients: true,
    edit_clients: true,
    view_suppliers: true,
    create_suppliers: true,
    edit_suppliers: true,
    view_purchase_orders: true,
    create_purchase_orders: true,
    edit_purchase_orders: true,
    import_purchase_orders: true,
    export_purchase_orders: true,
    view_supplier_pricing: true,
    create_supplier_pricing: true,
    edit_supplier_pricing: true,
    view_customer_pricing: true,
    create_customer_pricing: true,
    edit_customer_pricing: true,
    view_reports: true,
    export_reports: true,
    view_users: true,
    create_users: true,
    edit_users: true,
    reset_user_passwords: true,
    system_settings: true,
    database_backup: true,
    database_export: true,
    system_logs: true,
  },
  
  data_entry: {
    // إدخال البيانات - صلاحيات محدودة للإدخال والعرض
    view_dashboard: true,
    view_quotations: true,
    create_quotations: true,
    edit_quotations: true,
    view_items: true,
    create_items: true,
    edit_items: true,
    view_clients: true,
    create_clients: true,
    edit_clients: true,
    view_suppliers: true,
    create_suppliers: true,
    edit_suppliers: true,
    view_supplier_pricing: true,
    create_supplier_pricing: true,
    edit_supplier_pricing: true,
  },
  
  purchasing: {
    // المشتريات - صلاحيات الشراء والموردين
    view_dashboard: true,
    view_quotations: true,
    edit_quotations: true,
    view_items: true,
    view_clients: true,
    view_suppliers: true,
    create_suppliers: true,
    edit_suppliers: true,
    view_purchase_orders: true,
    create_purchase_orders: true,
    edit_purchase_orders: true,
    view_supplier_pricing: true,
    create_supplier_pricing: true,
    edit_supplier_pricing: true,
    view_reports: true,
  },
  
  accounting: {
    // المحاسبة - عرض فقط للمراجعة المالية
    view_dashboard: true,
    view_statistics: true,
    view_quotations: true,
    view_items: true,
    view_clients: true,
    view_suppliers: true,
    view_purchase_orders: true,
    view_supplier_pricing: true,
    view_customer_pricing: true,
    view_reports: true,
    export_reports: true,
  },
};

// دوال مساعدة
export function getDefaultPermissions(role: string): UserPermissions {
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || {};
  const allPermissions = PERMISSIONS.reduce((acc, perm) => {
    acc[perm.id as keyof UserPermissions] = false;
    return acc;
  }, {} as UserPermissions);
  
  return { ...allPermissions, ...defaultPerms };
}

export function hasPermission(userPermissions: string | UserPermissions, permission: keyof UserPermissions): boolean {
  if (typeof userPermissions === 'string') {
    try {
      const parsed = JSON.parse(userPermissions);
      return !!parsed[permission];
    } catch {
      return false;
    }
  }
  return !!userPermissions[permission];
}

export function getPermissionsByCategory() {
  const categories: Record<string, Permission[]> = {};
  PERMISSIONS.forEach(perm => {
    if (!categories[perm.category]) {
      categories[perm.category] = [];
    }
    categories[perm.category].push(perm);
  });
  return categories;
}

export const CATEGORY_NAMES: Record<string, string> = {
  dashboard: 'لوحة التحكم والإحصائيات',
  quotations: 'إدارة طلبات التسعير',
  items: 'إدارة الأصناف',
  clients: 'إدارة العملاء',
  suppliers: 'إدارة الموردين',
  purchase_orders: 'أوامر الشراء',
  pricing: 'إدارة الأسعار',
  reports: 'التقارير',
  users: 'إدارة المستخدمين',
  system: 'إدارة النظام',
};