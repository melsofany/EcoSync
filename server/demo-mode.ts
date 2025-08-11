// نظام عرض توضيحي للبيانات المستخرجة
export class DemoStorage {
  private demoUser = {
    id: 'demo-admin-1',
    username: 'admin',
    password: '$2b$10$8K1p/a0dL2LT1Z7xaOEWteEhqvqGdqC8.3ZMj0CQCdGGWyLQ1W9zK', // admin123
    full_name: 'مدير النظام - نسخة تجريبية',
    email: 'admin@demo.com',
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
  };

  constructor() {
    console.log('🎯 تشغيل النظام في وضع العرض التوضيحي');
  }

  async getUserByUsername(username: string) {
    if (username === 'admin') {
      return this.demoUser;
    }
    return undefined;
  }

  async getUser(id: string) {
    if (id === this.demoUser.id) {
      return this.demoUser;
    }
    return undefined;
  }

  async getAllUsers() {
    return [this.demoUser];
  }

  // دوال فارغة للباقي
  async createUser() { return this.demoUser; }
  async updateUser() { return this.demoUser; }
  async deleteUser() { return; }
  async updateUserOnlineStatus() { return; }
  async updateUserPassword() { return; }
  async getUserByEmail() { return undefined; }
  
  async createClient() { return {}; }
  async getAllClients() { return []; }
  async getClient() { return undefined; }
  async getClientById() { return undefined; }
  async updateClient() { return {}; }
  async deleteClient() { return; }
  
  async logActivity() { return; }
  async createPasswordResetToken() { return; }
  async getPasswordResetToken() { return undefined; }
  async markPasswordResetTokenUsed() { return; }
  
  async createQuotationRequest() { return {}; }
  async getAllQuotationRequests() { return []; }
  async getQuotationRequest() { return undefined; }
  async updateQuotationRequest() { return {}; }
  async deleteQuotationRequest() { return; }
  
  async createItem() { return {}; }
  async getAllItems() { return []; }
  async getItem() { return undefined; }
  async updateItem() { return {}; }
  async deleteItem() { return; }
  
  async createPurchaseOrder() { return {}; }
  async getAllPurchaseOrders() { return []; }
  async getPurchaseOrder() { return undefined; }
  async updatePurchaseOrder() { return {}; }
  async deletePurchaseOrder() { return; }
  
  async createSupplier() { return {}; }
  async getAllSuppliers() { return []; }
  async getSupplier() { return undefined; }
  async updateSupplier() { return {}; }
  async deleteSupplier() { return; }
  
  async createQuotationItem() { return {}; }
  async getQuotationItemsByRequestId() { return []; }
  async updateQuotationItem() { return {}; }
  async deleteQuotationItem() { return; }
  
  async createPurchaseOrderItem() { return {}; }
  async getPurchaseOrderItemsByOrderId() { return []; }
  async updatePurchaseOrderItem() { return {}; }
  async deletePurchaseOrderItem() { return; }
  
  async createSupplierQuote() { return {}; }
  async getSupplierQuotesByItemId() { return []; }
  async updateSupplierQuote() { return {}; }
  async deleteSupplierQuote() { return; }
  
  async getSupplierPricingByItemId() { return []; }
  async createSupplierPricing() { return {}; }
  async updateSupplierPricing() { return {}; }
  async deleteSupplierPricing() { return; }
  
  async getCustomerPricingByItemId() { return []; }
  async createCustomerPricing() { return {}; }
  async updateCustomerPricing() { return {}; }
  async deleteCustomerPricing() { return; }
  
  async getPricingHistoryByItemId() { return []; }
  async createPricingHistory() { return {}; }
  
  async getDashboardStats() { return {}; }
  async getRecentActivity() { return []; }
  async getActivityLog() { return []; }
  async searchQuotationRequests() { return []; }
  async searchItems() { return []; }
  async searchPurchaseOrders() { return []; }
  async getQuotationsByStatus() { return []; }
  async getItemsBySupplier() { return []; }
  async getTopClients() { return []; }
  async getTopSuppliers() { return []; }
  async getMonthlyStats() { return []; }
  async backupDatabase() { return ''; }
}