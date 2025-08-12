// نظام تخزين بسيط لحل مشكلة قاعدة البيانات المؤقتة
export class SimpleStorage {
  private users = new Map();
  
  constructor() {
    // إنشاء مستخدم افتراضي
    this.users.set('admin', {
      id: 'admin-1',
      username: 'admin',
      password: '$2b$10$8K1p/a0dL2LT1Z7xaOEWteEhqvqGdqC8.3ZMj0CQCdGGWyLQ1W9zK', // admin123
      full_name: 'مدير النظام',
      email: 'admin@qurtoba.com',
      role: 'manager',
      permissions: {
        manage_quotations: { view: true, create: true, edit: true, delete: true },
        manage_items: { view: true, create: true, edit: true, delete: true },
        manage_clients: { view: true, create: true, edit: true, delete: true },
        manage_suppliers: { view: true, create: true, edit: true, delete: true },
        manage_users: { view: true, create: true, edit: true, delete: true },
        manage_data_import: { view: true, create: true, edit: true, delete: true }
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('✅ تم إنشاء نظام التخزين البسيط');
  }
  
  getUserByUsername(username: string) {
    return this.users.get(username);
  }
  
  getUser(id: string) {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }
  
  getAllUsers() {
    return Array.from(this.users.values());
  }
  
  // دوال فارغة للمتطلبات الأخرى
  createUser() { return Promise.resolve({}); }
  updateUser() { return Promise.resolve({}); }
  deleteUser() { return Promise.resolve(); }
  updateUserOnlineStatus() { return Promise.resolve(); }
  updateUserPassword() { return Promise.resolve(); }
  getUserByEmail() { return Promise.resolve(undefined); }
  
  // دوال العملاء
  createClient() { return Promise.resolve({}); }
  getAllClients() { return Promise.resolve([]); }
  getClient() { return Promise.resolve(undefined); }
  getClientById() { return Promise.resolve(undefined); }
  updateClient() { return Promise.resolve({}); }
  deleteClient() { return Promise.resolve(); }
  
  // باقي الدوال
  logActivity() { return Promise.resolve(); }
  createPasswordResetToken() { return Promise.resolve(); }
  getPasswordResetToken() { return Promise.resolve(undefined); }
  markPasswordResetTokenUsed() { return Promise.resolve(); }
  
  // دوال الباقي
  createQuotationRequest() { return Promise.resolve({}); }
  getAllQuotationRequests() { return Promise.resolve([]); }
  getQuotationRequest() { return Promise.resolve(undefined); }
  updateQuotationRequest() { return Promise.resolve({}); }
  deleteQuotationRequest() { return Promise.resolve(); }
  
  createItem() { return Promise.resolve({}); }
  getAllItems() { return Promise.resolve([]); }
  getItem() { return Promise.resolve(undefined); }
  updateItem() { return Promise.resolve({}); }
  deleteItem() { return Promise.resolve(); }
  
  createPurchaseOrder() { return Promise.resolve({}); }
  getAllPurchaseOrders() { return Promise.resolve([]); }
  getPurchaseOrder() { return Promise.resolve(undefined); }
  updatePurchaseOrder() { return Promise.resolve({}); }
  deletePurchaseOrder() { return Promise.resolve(); }
  
  createSupplier() { return Promise.resolve({}); }
  getAllSuppliers() { return Promise.resolve([]); }
  getSupplier() { return Promise.resolve(undefined); }
  updateSupplier() { return Promise.resolve({}); }
  deleteSupplier() { return Promise.resolve(); }
  
  // المزيد من الدوال الفارغة حسب الحاجة
  createQuotationItem() { return Promise.resolve({}); }
  getQuotationItemsByRequestId() { return Promise.resolve([]); }
  updateQuotationItem() { return Promise.resolve({}); }
  deleteQuotationItem() { return Promise.resolve(); }
  
  createPurchaseOrderItem() { return Promise.resolve({}); }
  getPurchaseOrderItemsByOrderId() { return Promise.resolve([]); }
  updatePurchaseOrderItem() { return Promise.resolve({}); }
  deletePurchaseOrderItem() { return Promise.resolve(); }
  
  createSupplierQuote() { return Promise.resolve({}); }
  getSupplierQuotesByItemId() { return Promise.resolve([]); }
  updateSupplierQuote() { return Promise.resolve({}); }
  deleteSupplierQuote() { return Promise.resolve(); }
  
  getSupplierPricingByItemId() { return Promise.resolve([]); }
  createSupplierPricing() { return Promise.resolve({}); }
  updateSupplierPricing() { return Promise.resolve({}); }
  deleteSupplierPricing() { return Promise.resolve(); }
  
  getCustomerPricingByItemId() { return Promise.resolve([]); }
  createCustomerPricing() { return Promise.resolve({}); }
  updateCustomerPricing() { return Promise.resolve({}); }
  deleteCustomerPricing() { return Promise.resolve(); }
  
  getPricingHistoryByItemId() { return Promise.resolve([]); }
  createPricingHistory() { return Promise.resolve({}); }
  
  getDashboardStats() { return Promise.resolve({}); }
  getRecentActivity() { return Promise.resolve([]); }
  getActivityLog() { return Promise.resolve([]); }
  searchQuotationRequests() { return Promise.resolve([]); }
  searchItems() { return Promise.resolve([]); }
  searchPurchaseOrders() { return Promise.resolve([]); }
  getQuotationsByStatus() { return Promise.resolve([]); }
  getItemsBySupplier() { return Promise.resolve([]); }
  getTopClients() { return Promise.resolve([]); }
  getTopSuppliers() { return Promise.resolve([]); }
  getMonthlyStats() { return Promise.resolve([]); }
  backupDatabase() { return Promise.resolve(''); }

  // تحديث الأصناف من Google Sheets
  updateItemsFromSheets(items: any[]) {
    this.items.clear();
    items.forEach(item => {
      this.items.set(item.id, item);
    });
    console.log(`🔄 تم تحديث ${items.length} صنف من Google Sheets`);
  }

  // تحديث طلبات التسعير من Google Sheets
  updateQuotationsFromSheets(quotations: any[]) {
    quotations.forEach(quotation => {
      this.quotations.set(quotation.id, quotation);
    });
    console.log(`🔄 تم تحديث ${quotations.length} طلب تسعير من Google Sheets`);
  }

  // تحديث أوامر الشراء من Google Sheets
  updatePurchaseOrdersFromSheets(purchaseOrders: any[]) {
    purchaseOrders.forEach(po => {
      this.purchaseOrders.set(po.id, po);
    });
    console.log(`🔄 تم تحديث ${purchaseOrders.length} أمر شراء من Google Sheets`);
  }

  // تحديث المستخدمين من Google Sheets
  updateUsersFromSheets(users: any[]) {
    users.forEach(user => {
      this.users.set(user.username, user);
    });
    console.log(`🔄 تم تحديث ${users.length} مستخدم من Google Sheets`);
  }
}