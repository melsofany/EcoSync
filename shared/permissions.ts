// نظام الصلاحيات المرن
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface UserPermissions {
  dashboard: boolean;
  quotations: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  items: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  clients: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  suppliers: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  purchaseOrders: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  customerPricing: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
  analytics: {
    view: boolean;
  };
  admin: {
    userManagement: boolean;
    systemSettings: boolean;
    backupRestore: boolean;
  };
  import: {
    quotations: boolean;
    items: boolean;
    purchaseOrders: boolean;
  };
  activity: {
    view: boolean;
  };
  pricing: {
    viewSalePrices: boolean;
    viewSupplierPrices: boolean;
    viewPurchaseOrderPrices: boolean;
    viewCosts: boolean;
    viewMargins: boolean;
  };
}

// الصلاحيات المتاحة
export const AVAILABLE_PERMISSIONS: Permission[] = [
  // لوحة التحكم
  {
    id: 'dashboard',
    name: 'لوحة التحكم',
    description: 'الوصول إلى لوحة التحكم الرئيسية',
    category: 'عام'
  },
  
  // طلبات التسعير
  {
    id: 'quotations.view',
    name: 'عرض طلبات التسعير',
    description: 'عرض قائمة طلبات التسعير',
    category: 'طلبات التسعير'
  },
  {
    id: 'quotations.create',
    name: 'إنشاء طلبات التسعير',
    description: 'إنشاء طلبات تسعير جديدة',
    category: 'طلبات التسعير'
  },
  {
    id: 'quotations.edit',
    name: 'تعديل طلبات التسعير',
    description: 'تعديل طلبات التسعير الموجودة',
    category: 'طلبات التسعير'
  },
  {
    id: 'quotations.delete',
    name: 'حذف طلبات التسعير',
    description: 'حذف طلبات التسعير',
    category: 'طلبات التسعير'
  },

  // إدارة الأصناف
  {
    id: 'items.view',
    name: 'عرض الأصناف',
    description: 'عرض قائمة الأصناف',
    category: 'الأصناف'
  },
  {
    id: 'items.create',
    name: 'إنشاء الأصناف',
    description: 'إضافة أصناف جديدة',
    category: 'الأصناف'
  },
  {
    id: 'items.edit',
    name: 'تعديل الأصناف',
    description: 'تعديل الأصناف الموجودة',
    category: 'الأصناف'
  },
  {
    id: 'items.delete',
    name: 'حذف الأصناف',
    description: 'حذف الأصناف',
    category: 'الأصناف'
  },

  // إدارة العملاء
  {
    id: 'clients.view',
    name: 'عرض العملاء',
    description: 'عرض قائمة العملاء',
    category: 'العملاء'
  },
  {
    id: 'clients.create',
    name: 'إنشاء العملاء',
    description: 'إضافة عملاء جدد',
    category: 'العملاء'
  },
  {
    id: 'clients.edit',
    name: 'تعديل العملاء',
    description: 'تعديل بيانات العملاء',
    category: 'العملاء'
  },
  {
    id: 'clients.delete',
    name: 'حذف العملاء',
    description: 'حذف العملاء',
    category: 'العملاء'
  },

  // إدارة الموردين
  {
    id: 'suppliers.view',
    name: 'عرض الموردين',
    description: 'عرض قائمة الموردين',
    category: 'الموردين'
  },
  {
    id: 'suppliers.create',
    name: 'إنشاء الموردين',
    description: 'إضافة موردين جدد',
    category: 'الموردين'
  },
  {
    id: 'suppliers.edit',
    name: 'تعديل الموردين',
    description: 'تعديل بيانات الموردين',
    category: 'الموردين'
  },
  {
    id: 'suppliers.delete',
    name: 'حذف الموردين',
    description: 'حذف الموردين',
    category: 'الموردين'
  },

  // طلبات الشراء
  {
    id: 'purchaseOrders.view',
    name: 'عرض طلبات الشراء',
    description: 'عرض قائمة طلبات الشراء',
    category: 'طلبات الشراء'
  },
  {
    id: 'purchaseOrders.create',
    name: 'إنشاء طلبات الشراء',
    description: 'إنشاء طلبات شراء جديدة',
    category: 'طلبات الشراء'
  },
  {
    id: 'purchaseOrders.edit',
    name: 'تعديل طلبات الشراء',
    description: 'تعديل طلبات الشراء الموجودة',
    category: 'طلبات الشراء'
  },
  {
    id: 'purchaseOrders.delete',
    name: 'حذف طلبات الشراء',
    description: 'حذف طلبات الشراء',
    category: 'طلبات الشراء'
  },

  // تسعير العملاء
  {
    id: 'customerPricing.view',
    name: 'عرض تسعير العملاء',
    description: 'عرض أسعار العملاء',
    category: 'التسعير'
  },
  {
    id: 'customerPricing.create',
    name: 'إنشاء تسعير العملاء',
    description: 'إضافة أسعار جديدة للعملاء',
    category: 'التسعير'
  },
  {
    id: 'customerPricing.edit',
    name: 'تعديل تسعير العملاء',
    description: 'تعديل أسعار العملاء',
    category: 'التسعير'
  },
  {
    id: 'customerPricing.delete',
    name: 'حذف تسعير العملاء',
    description: 'حذف أسعار العملاء',
    category: 'التسعير'
  },

  // التقارير
  {
    id: 'reports.view',
    name: 'عرض التقارير',
    description: 'عرض التقارير المختلفة',
    category: 'التقارير'
  },
  {
    id: 'reports.export',
    name: 'تصدير التقارير',
    description: 'تصدير التقارير إلى ملفات',
    category: 'التقارير'
  },

  // الإحصائيات
  {
    id: 'analytics.view',
    name: 'عرض الإحصائيات',
    description: 'عرض الإحصائيات والتحليلات',
    category: 'الإحصائيات'
  },

  // الإدارة
  {
    id: 'admin.userManagement',
    name: 'إدارة المستخدمين',
    description: 'إدارة المستخدمين والصلاحيات',
    category: 'الإدارة'
  },
  {
    id: 'admin.systemSettings',
    name: 'إعدادات النظام',
    description: 'إدارة إعدادات النظام',
    category: 'الإدارة'
  },
  {
    id: 'admin.backupRestore',
    name: 'النسخ الاحتياطي',
    description: 'إنشاء واستعادة النسخ الاحتياطية',
    category: 'الإدارة'
  },

  // استيراد البيانات
  {
    id: 'import.quotations',
    name: 'استيراد طلبات التسعير',
    description: 'استيراد طلبات التسعير من Excel',
    category: 'استيراد البيانات'
  },
  {
    id: 'import.items',
    name: 'استيراد الأصناف',
    description: 'استيراد الأصناف من Excel',
    category: 'استيراد البيانات'
  },
  {
    id: 'import.purchaseOrders',
    name: 'استيراد طلبات الشراء',
    description: 'استيراد طلبات الشراء من Excel',
    category: 'استيراد البيانات'
  },

  // سجل النشاطات
  {
    id: 'activity.view',
    name: 'عرض سجل النشاطات',
    description: 'عرض سجل نشاطات المستخدمين',
    category: 'النشاطات'
  },

  // صلاحيات مشاهدة الأسعار
  {
    id: 'pricing.viewSalePrices',
    name: 'مشاهدة أسعار البيع',
    description: 'عرض أسعار البيع في طلبات التسعير والعروض',
    category: 'الأسعار'
  },
  {
    id: 'pricing.viewSupplierPrices',
    name: 'مشاهدة أسعار الموردين',
    description: 'عرض أسعار الموردين وعروض الأسعار من الموردين',
    category: 'الأسعار'
  },
  {
    id: 'pricing.viewPurchaseOrderPrices',
    name: 'مشاهدة أسعار أوامر الشراء',
    description: 'عرض أسعار أوامر الشراء والتكاليف الفعلية',
    category: 'الأسعار'
  },
  {
    id: 'pricing.viewCosts',
    name: 'مشاهدة أسعار التكلفة',
    description: 'عرض أسعار التكلفة والتحليلات المالية',
    category: 'الأسعار'
  },
  {
    id: 'pricing.viewMargins',
    name: 'مشاهدة هوامش الربح',
    description: 'عرض هوامش الربح والتحليلات المالية',
    category: 'الأسعار'
  }
];

// الصلاحيات الافتراضية للأدوار الموجودة
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Partial<UserPermissions>> = {
  manager: {
    dashboard: true,
    quotations: { view: true, create: true, edit: true, delete: true },
    items: { view: true, create: true, edit: true, delete: true },
    clients: { view: true, create: true, edit: true, delete: true },
    suppliers: { view: true, create: true, edit: true, delete: true },
    purchaseOrders: { view: true, create: true, edit: true, delete: true },
    customerPricing: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true },
    analytics: { view: true },
    admin: { userManagement: true, systemSettings: true, backupRestore: true },
    import: { quotations: true, items: true, purchaseOrders: true },
    activity: { view: true },
    pricing: { viewSalePrices: true, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: true }
  },
  it_admin: {
    dashboard: true,
    quotations: { view: true, create: true, edit: true, delete: true },
    items: { view: true, create: true, edit: true, delete: true },
    clients: { view: true, create: true, edit: true, delete: true },
    suppliers: { view: true, create: true, edit: true, delete: true },
    purchaseOrders: { view: true, create: true, edit: true, delete: true },
    customerPricing: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true },
    analytics: { view: true },
    admin: { userManagement: true, systemSettings: true, backupRestore: true },
    import: { quotations: true, items: true, purchaseOrders: true },
    activity: { view: true },
    pricing: { viewSalePrices: true, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: true }
  },
  data_entry: {
    dashboard: true,
    quotations: { view: true, create: true, edit: true, delete: false },
    items: { view: true, create: true, edit: true, delete: false },
    clients: { view: true, create: true, edit: true, delete: false },
    suppliers: { view: true, create: true, edit: true, delete: false },
    purchaseOrders: { view: true, create: true, edit: true, delete: false },
    customerPricing: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, export: false },
    analytics: { view: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false },
    import: { quotations: false, items: false, purchaseOrders: false },
    activity: { view: false },
    pricing: { viewSalePrices: false, viewSupplierPrices: false, viewPurchaseOrderPrices: false, viewCosts: false, viewMargins: false }
  },
  purchasing: {
    dashboard: true,
    quotations: { view: true, create: false, edit: false, delete: false },
    items: { view: true, create: false, edit: false, delete: false },
    clients: { view: true, create: false, edit: false, delete: false },
    suppliers: { view: true, create: true, edit: true, delete: false },
    purchaseOrders: { view: true, create: true, edit: true, delete: false },
    customerPricing: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, export: false },
    analytics: { view: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false },
    import: { quotations: false, items: false, purchaseOrders: false },
    activity: { view: false },
    pricing: { viewSalePrices: false, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: false }
  },
  accounting: {
    dashboard: true,
    quotations: { view: true, create: false, edit: false, delete: false },
    items: { view: true, create: false, edit: false, delete: false },
    clients: { view: true, create: false, edit: false, delete: false },
    suppliers: { view: true, create: false, edit: false, delete: false },
    purchaseOrders: { view: true, create: false, edit: false, delete: false },
    customerPricing: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, export: true },
    analytics: { view: true },
    admin: { userManagement: false, systemSettings: false, backupRestore: false },
    import: { quotations: false, items: false, purchaseOrders: false },
    activity: { view: false },
    pricing: { viewSalePrices: true, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: true }
  }
};

// دالة للحصول على صلاحيات المستخدم
export const getUserPermissions = (user: any): UserPermissions => {
  // إذا كان المستخدم لديه صلاحيات مخصصة
  if (user.permissions) {
    try {
      return JSON.parse(user.permissions);
    } catch (e) {
      console.error('Error parsing user permissions:', e);
    }
  }
  
  // استخدام الصلاحيات الافتراضية للدور
  const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.role];
  if (defaultPermissions) {
    return defaultPermissions as UserPermissions;
  }
  
  // إذا لم يوجد شيء، إرجاع صلاحيات فارغة
  return {
    dashboard: false,
    quotations: { view: false, create: false, edit: false, delete: false },
    items: { view: false, create: false, edit: false, delete: false },
    clients: { view: false, create: false, edit: false, delete: false },
    suppliers: { view: false, create: false, edit: false, delete: false },
    purchaseOrders: { view: false, create: false, edit: false, delete: false },
    customerPricing: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, export: false },
    analytics: { view: false },
    admin: { userManagement: false, systemSettings: false, backupRestore: false },
    import: { quotations: false, items: false, purchaseOrders: false },
    activity: { view: false },
    pricing: { viewSalePrices: false, viewSupplierPrices: false, viewPurchaseOrderPrices: false, viewCosts: false, viewMargins: false }
  };
};

// دالة للتحقق من صلاحية معينة
export const hasPermission = (user: any, permission: string): boolean => {
  const permissions = getUserPermissions(user);
  const keys = permission.split('.');
  
  let current: any = permissions;
  for (const key of keys) {
    if (current[key] === undefined) {
      return false;
    }
    current = current[key];
  }
  
  return current === true;
};

// دالة للتحقق من صلاحيات الأسعار
export const canViewPricing = (user: any, priceType: 'salePrices' | 'supplierPrices' | 'purchaseOrderPrices' | 'costs' | 'margins' = 'salePrices'): boolean => {
  if (!user) return false;
  
  const permissions = getUserPermissions(user);
  
  switch (priceType) {
    case 'salePrices':
      return permissions.pricing.viewSalePrices;
    case 'supplierPrices':
      return permissions.pricing.viewSupplierPrices;
    case 'purchaseOrderPrices':
      return permissions.pricing.viewPurchaseOrderPrices;
    case 'costs': 
      return permissions.pricing.viewCosts;
    case 'margins':
      return permissions.pricing.viewMargins;
    default:
      return false;
  }
};

// دالة للتحقق من إمكانية الوصول للقسم (للتوافق مع النظام الحالي)
export const canAccessSection = (user: any, section: string): boolean => {
  if (!user) return false;
  
  const permissions = getUserPermissions(user);
  
  switch (section) {
    case 'dashboard':
      return permissions.dashboard;
    case 'quotations':
      return permissions.quotations.view;
    case 'items':
      return permissions.items.view;
    case 'clients':
      return permissions.clients.view;
    case 'suppliers':
      return permissions.suppliers.view;
    case 'purchase-orders':
    case 'purchase_orders':
      return permissions.purchaseOrders.view;
    case 'customer_pricing':
      return permissions.customerPricing.view;
    case 'reports':
      return permissions.reports.view;
    case 'analytics':
      return permissions.analytics.view;
    case 'admin':
      return permissions.admin.userManagement;
    case 'import':
      return permissions.import.quotations || permissions.import.items || permissions.import.purchaseOrders;
    case 'activity':
      return permissions.activity.view;
    case 'settings':
      return permissions.admin.systemSettings;
    default:
      return false;
  }
};