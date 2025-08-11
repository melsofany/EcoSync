// نظام عرض توضيحي للبيانات المستخرجة
export class DemoStorage {
  private demoUser = {
    id: 'demo-admin-1',
    username: 'admin',
    password: '$2b$10$uvaNpzImqUgJ0sVnTT.uRORgXa2lpiC4E2gJBvnO/54G1kmiox0i2', // admin123
    fullName: 'مدير النظام - نسخة تجريبية',
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
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
  async getAllItems() { 
    return [
      {
        id: 'demo-item-1',
        itemNumber: 'P-000001',
        lineItem: '1854.014.CARIER.7506',
        partNumber: 'CARRIER-7506',
        description: 'LEFT BRACKET FOR A/C CARRIER QG MODEL 42QG18H',
        uom: 'EACH',
        category: 'Air Conditioning',
        brand: 'CARRIER',
        createdAt: '2025-08-11T20:00:00.000Z',
        aiStatus: 'processed',
        aiConfidence: 95
      },
      {
        id: 'demo-item-2',
        itemNumber: 'P-000002',
        lineItem: '1854.014.CARIER.7507',
        partNumber: 'CARRIER-7507',
        description: 'RIGHT BRACKET FOR A/C CARRIER QG MODEL 42QG18H',
        uom: 'EACH',
        category: 'Air Conditioning',
        brand: 'CARRIER',
        createdAt: '2025-08-11T20:01:00.000Z',
        aiStatus: 'processed',
        aiConfidence: 94
      },
      {
        id: 'demo-item-3',
        itemNumber: 'P-000003',
        lineItem: '5720.001.GENRAL.0004',
        partNumber: 'ENERGIZER-AA-1.5V',
        description: 'ENERGIZER BATTERY 1,5V SIZE AA',
        uom: 'EACH',
        category: 'Electrical',
        brand: 'ENERGIZER',
        createdAt: '2025-08-11T20:02:00.000Z',
        aiStatus: 'processed',
        aiConfidence: 99
      }
    ]; 
  }
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
  
  // إضافة الدوال المفقودة
  async getStatistics() { 
    return {
      totalQuotations: 0,
      totalItems: 0,
      totalClients: 0,
      totalSuppliers: 0,
      pendingQuotations: 0,
      completedQuotations: 0
    }; 
  }
  
  async getActivities() { return []; }
  
  async getAllQuotationsDetailed() { return []; }
  async getAllItemsDetailed() { return []; }
  async getAllPurchaseOrdersDetailed() { return []; }
  async getAllSuppliersDetailed() { return []; }
  
  async searchPurchaseOrdersByClientId() { return []; }
  async searchQuotationRequestsByClientId() { return []; }
  async createOrUpdateItem() { return {}; }
  async generateItemNumber() { return 'P-000001'; }
  
  async getUnprocessedQuotationRequests() { return []; }
  async updateQuotationRequestStatus() { return {}; }
  
  async getItemsWithPricing() { return []; }
  async getQuotationItemsWithPricing() { return []; }
  
  async getAllQuotationItemsDetailed() { return []; }
  async getAvailableItemsForQuotation() { return []; }
  
  async createManyQuotationItems() { return []; }
  async updateManyQuotationItems() { return []; }
  
  async getNewestItems() { return []; }
  async getPopularItems() { return []; }
  
  async getItemByPartNumber() { return undefined; }
  async getItemByKId() { return undefined; }
  
  async createOrFindSimilarItem() { return {}; }
  async findSimilarItems() { return []; }
  
  async getItemsByCategory() { return []; }
  async getItemsByBrand() { return []; }
  
  async exportQuotationItems() { return []; }
  async importQuotationItems() { return []; }
  
  async getQuotationRequestsWithCounts() { return []; }
  async getItemsWithCounts() { return []; }
  
  async updateItemNumbers() { return; }
  async generateBulkItemNumbers() { return []; }
  
  // دوال طلبات التسعير مع العملاء
  async getAllQuotationRequestsWithClients() { 
    return [
      {
        id: 'demo-rfq-1',
        rfqNumber: '25R000057',
        clientName: 'شركة المثال للهندسة',
        requestDate: '2025-01-05',
        status: 'quoted',
        totalItems: 3,
        totalValue: 675
      }
    ]; 
  }
  
  async getQuotationRequestWithItems() { 
    return {
      id: 'demo-rfq-1',
      rfqNumber: '25R000057',
      clientName: 'شركة المثال للهندسة',
      requestDate: '2025-01-05',
      status: 'quoted',
      items: [
        {
          id: 'demo-item-1',
          lineItem: '1854.014.CARIER.7506',
          partNumber: 'CARRIER-7506',
          description: 'LEFT BRACKET FOR A/C CARRIER QG MODEL 42QG18H',
          uom: 'EACH',
          quantity: 2,
          price: 225
        }
      ]
    }; 
  }
  
  // دوال إضافية مفقودة
  async createClient() { return {}; }
  async updateClient() { return {}; }
  async deleteClient() { return {}; }
  
  async createSupplier() { return {}; }
  async updateSupplier() { return {}; }
  async deleteSupplier() { return {}; }
  
  // دالة البيانات الشاملة للأصناف
  async getItemComprehensiveDataUnified(itemId: string) {
    const items = await this.getAllItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return null;
    
    return {
      ...item,
      quotationRequests: [
        {
          rfqNumber: '25R000057',
          requestDate: '2025-01-05',
          quantity: 2,
          clientName: 'شركة المثال للهندسة'
        }
      ],
      purchaseOrders: [
        {
          poNumber: 'P25E02726',
          poDate: '2025-02-24',
          quantity: 2,
          price: 225,
          supplierName: 'موزع كاريير'
        }
      ],
      duplicates: [],
      aiAnalysis: {
        confidence: item.aiConfidence || 95,
        status: item.aiStatus || 'processed',
        lastAnalyzed: item.createdAt
      }
    };
  }
  async getTopSuppliers() { return []; }
  async getMonthlyStats() { return []; }
  async backupDatabase() { return ''; }
}