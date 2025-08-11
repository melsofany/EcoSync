// نظام عرض توضيحي للبيانات المستخرجة
import { completeDataLoader } from './load-complete-data';

export class DemoStorage {
  private demoUser = {
    id: 'demo-admin-1',
    username: 'admin',
    password: '$2b$10$uvaNpzImqUgJ0sVnTT.uRORgXa2lpiC4E2gJBvnO/54G1kmiox0i2', // admin123
    fullName: 'مدير النظام - قرطبة للتوريدات',
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
    console.log('🎯 تشغيل نظام قرطبة للتوريدات - البيانات الحقيقية');
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
    // استخدام البيانات الحقيقية الكاملة المحملة من الملف
    const allItems = completeDataLoader.getAllItems();
    
    // إذا لم تكن البيانات محملة، استخدم البيانات النموذجية
    if (allItems.length === 0) {
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
    
    // إرجاع البيانات الحقيقية الكاملة
    return allItems;
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
  
  // دوال طلبات التسعير مع البيانات الحقيقية
  async getAllQuotations() {
    // استخدام البيانات الحقيقية الكاملة المحملة من الملف
    const allRFQs = completeDataLoader.getAllQuotationRequests();
    
    // إذا كانت البيانات الحقيقية محملة، استخدمها مباشرة
    if (allRFQs.length > 0) {
      console.log(`🎯 عرض ${allRFQs.length} طلب تسعير حقيقي من البيانات المستوردة`);
      return allRFQs;
    }
    
    // احتياطي: البيانات النموذجية في حالة عدم التحميل
    console.log('⚠️ استخدام البيانات النموذجية - لم يتم تحميل البيانات الحقيقية');
    if (allRFQs.length === 0) {
      return [
        {
          id: 'demo-rfq-1',
          rfqNumber: '25R000057',
          customRequestNumber: '25R000057',
          requestDate: '2025-02-20',
          status: 'completed',
          clientName: 'شركة المشاريع الهندسية المحدودة',
          totalItems: 15,
          totalValue: 25000,
          createdAt: '2025-02-20T10:00:00.000Z',
          notes: 'طلب تسعير لمعدات التكييف والتهوية'
        },
        {
          id: 'demo-rfq-2', 
          rfqNumber: '25R000209',
          customRequestNumber: '25R000209',
          requestDate: '2025-02-22',
          status: 'quoted',
          clientName: 'مؤسسة الكهرباء والميكانيكا',
          totalItems: 8,
          totalValue: 18500,
          createdAt: '2025-02-22T14:30:00.000Z',
          notes: 'طلب تسعير للأجهزة الكهربائية'
        }
      ];
    }
  }
  
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
  
  // دوال الأسعار والطلبات
  async getQuotationItemsByQuotation() { return []; }
  async getItemsRequiringPricing() { return []; }
  async getItemsReadyForCustomerPricing() { return []; }
  async getQuotationItemsWithoutSupplierPricing() { return []; }
  async getQuotationItemsWithSupplierPricing() { return []; }
  async getCustomerPricingForQuotation() { return []; }
  
  // دوال أوامر الشراء مع البيانات الحقيقية المستوردة من Excel (451 أمر فريد من 698 إجمالي)
  async getAllPurchaseOrders() { 
    // استخدام البيانات الحقيقية الكاملة المحملة من الملف
    const allPOs = completeDataLoader.getAllPurchaseOrders();
    
    // إذا كانت البيانات الحقيقية محملة، استخدمها مباشرة
    if (allPOs.length > 0) {
      console.log(`🎯 عرض ${allPOs.length} أمر شراء حقيقي من البيانات المستوردة`);
      return allPOs;
    }
    
    // احتياطي: البيانات النموذجية في حالة عدم التحميل
    console.log('⚠️ استخدام البيانات النموذجية - لم يتم تحميل البيانات الحقيقية');
    return [
      {
        id: 'po-1',
        poNumber: 'P25E02726',
        quotationNumber: '25R000057',
        orderDate: '2025-02-24',
        totalAmount: 2250,
        status: 'completed',
        supplierName: 'موزع كاريير الرسمي',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-2', 
        poNumber: 'P25E03288',
        quotationNumber: '25R000209',
        orderDate: '2025-02-26',
        totalAmount: 8750,
        status: 'pending',
        supplierName: 'الموزع العام للمعدات',
        currency: 'EGP',
        deliveryStatus: 'pending'
      },
      {
        id: 'po-3',
        poNumber: 'P25E03511',
        quotationNumber: '25R000244',
        orderDate: '2025-03-02',
        totalAmount: 15600,
        status: 'completed',
        supplierName: 'شركة التوريدات المتقدمة',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-4',
        poNumber: 'P25E03847',
        quotationNumber: '25R000156',
        orderDate: '2025-03-05',
        totalAmount: 4320,
        status: 'confirmed',
        supplierName: 'موزع شنايدر المعتمد',
        currency: 'EGP',
        deliveryStatus: 'shipped'
      },
      {
        id: 'po-5',
        poNumber: 'P25E04022',
        quotationNumber: '25R000078',
        orderDate: '2025-03-08',
        totalAmount: 7890,
        status: 'pending',
        supplierName: 'مؤسسة الكهرباء والتكييف',
        currency: 'EGP',
        deliveryStatus: 'pending'
      },
      {
        id: 'po-6',
        poNumber: 'P25E04155',
        quotationNumber: '25R000321',
        orderDate: '2025-03-12',
        totalAmount: 12450,
        status: 'completed',
        supplierName: 'شركة ABB مصر',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-7',
        poNumber: 'P25E04289',
        quotationNumber: '25R000467',
        orderDate: '2025-03-15',
        totalAmount: 6780,
        status: 'confirmed',
        supplierName: 'موزع الأجهزة الصناعية',
        currency: 'EGP',
        deliveryStatus: 'processing'
      },
      {
        id: 'po-8',
        poNumber: 'P25E04456',
        quotationNumber: '25R000523',
        orderDate: '2025-03-18',
        totalAmount: 9340,
        status: 'pending',
        supplierName: 'التوريدات الهندسية المحدودة',
        currency: 'EGP',
        deliveryStatus: 'pending'
      },
      {
        id: 'po-9',
        poNumber: 'P25E04578',
        quotationNumber: '25R000634',
        orderDate: '2025-03-22',
        totalAmount: 18750,
        status: 'completed',
        supplierName: 'شركة سيمنز العربية',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-10',
        poNumber: 'P25E04721',
        quotationNumber: '25R000789',
        orderDate: '2025-03-25',
        totalAmount: 5560,
        status: 'confirmed',
        supplierName: 'مؤسسة الأتمتة الصناعية',
        currency: 'EGP',
        deliveryStatus: 'shipped'
      },
      // المزيد من أوامر الشراء الحقيقية
      {
        id: 'po-11',
        poNumber: 'P25E04889',
        quotationNumber: '25R000901',
        orderDate: '2025-04-01',
        totalAmount: 13200,
        status: 'completed',
        supplierName: 'شركة الإلكترونيات المتطورة',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-12',
        poNumber: 'P25E05002',
        quotationNumber: '25R001045',
        orderDate: '2025-04-05',
        totalAmount: 7650,
        status: 'pending',
        supplierName: 'موزع التحكم الصناعي',
        currency: 'EGP',
        deliveryStatus: 'pending'
      },
      {
        id: 'po-13',
        poNumber: 'P25E05134',
        quotationNumber: '25R001178',
        orderDate: '2025-04-08',
        totalAmount: 22500,
        status: 'completed',
        supplierName: 'شركة WEG للمحركات',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-14',
        poNumber: 'P25E05267',
        quotationNumber: '25R001289',
        orderDate: '2025-04-12',
        totalAmount: 8900,
        status: 'confirmed',
        supplierName: 'مؤسسة أجهزة القياس',
        currency: 'EGP',
        deliveryStatus: 'processing'
      },
      {
        id: 'po-15',
        poNumber: 'P25E05398',
        quotationNumber: '25R001356',
        orderDate: '2025-04-15',
        totalAmount: 16750,
        status: 'completed',
        supplierName: 'شركة OMRON الشرق الأوسط',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-16',
        poNumber: 'P25E05521',
        quotationNumber: '25R001423',
        orderDate: '2025-04-18',
        totalAmount: 11300,
        status: 'pending',
        supplierName: 'الموزع المعتمد للكابلات',
        currency: 'EGP',
        deliveryStatus: 'pending'
      },
      {
        id: 'po-17',
        poNumber: 'P25E05654',
        quotationNumber: '25R001567',
        orderDate: '2025-04-22',
        totalAmount: 9850,
        status: 'confirmed',
        supplierName: 'شركة Danfoss مصر',
        currency: 'EGP',
        deliveryStatus: 'shipped'
      },
      {
        id: 'po-18',
        poNumber: 'P25E05787',
        quotationNumber: '25R001634',
        orderDate: '2025-04-25',
        totalAmount: 14200,
        status: 'completed',
        supplierName: 'مؤسسة أجهزة الحماية',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      },
      {
        id: 'po-19',
        poNumber: 'P25E05912',
        quotationNumber: '25R001789',
        orderDate: '2025-04-28',
        totalAmount: 6750,
        status: 'pending',
        supplierName: 'شركة التوريدات الكهربائية',
        currency: 'EGP',
        deliveryStatus: 'pending'
      },
      {
        id: 'po-20',
        poNumber: 'P25E06043',
        quotationNumber: '25R001856',
        orderDate: '2025-05-02',
        totalAmount: 18900,
        status: 'completed',
        supplierName: 'موزع Mitsubishi Electric',
        currency: 'EGP',
        deliveryStatus: 'delivered'
      }
    ];
  }
  
  // دوال إضافية مطلوبة
  async getQuotationItemsByQuotationId() { return []; }
  async createQuotationItem() { return {}; }
  async updateQuotationItems() { return []; }
  async deleteQuotationItems() { return; }
  
  async createPurchaseOrderItem() { return {}; }
  async updatePurchaseOrderItems() { return []; }
  async deletePurchaseOrderItems() { return; }
  
  async createSupplierQuote() { return {}; }
  async updateSupplierQuote() { return {}; }
  async deleteSupplierQuote() { return; }
  
  async createSupplierPricing() { return {}; }
  async updateSupplierPricing() { return {}; }
  async deleteSupplierPricing() { return; }
  
  async createCustomerPricing() { return {}; }
  async updateCustomerPricing() { return {}; }
  async deleteCustomerPricing() { return; }
  
  async getQuotationsByStatusAndClient() { return []; }
  async getItemsBySupplierAndCategory() { return []; }
  async getPurchaseOrdersByDateRange() { return []; }
  
  async getAdvancedItemSearch() { return []; }
  async getAdvancedQuotationSearch() { return []; }
  async getAdvancedPurchaseOrderSearch() { return []; }
  
  // دوال أوامر الشراء المفقودة مع البيانات المستوردة
  async getPurchaseOrderItems(poId: string) {
    const itemsMap: Record<string, any[]> = {
      'po-1': [
        {
          id: 'po-item-1',
          itemId: 'demo-item-1',
          itemNumber: 'P-000001',
          lineItem: '1854.014.CARIER.7506',
          partNumber: 'CARRIER-7506',
          description: 'LEFT BRACKET FOR A/C CARRIER QG MODEL 42QG18H',
          quantity: 10,
          unitPrice: 225,
          totalPrice: 2250,
          uom: 'SET'
        }
      ],
      'po-2': [
        {
          id: 'po-item-2',
          itemId: 'demo-item-2',
          itemNumber: 'P-000002',
          lineItem: '1854.014.CARIER.7507',
          partNumber: 'CARRIER-7507',
          description: 'RIGHT BRACKET FOR A/C CARRIER QG MODEL 42QG18H',
          quantity: 25,
          unitPrice: 350,
          totalPrice: 8750,
          uom: 'METER'
        }
      ],
      'po-3': [
        {
          id: 'po-item-3',
          itemId: 'demo-item-3',
          itemNumber: 'P-000003',
          lineItem: '5720.001.GENRAL.0004',
          partNumber: 'ENERGIZER-AA-1.5V',
          description: 'ENERGIZER BATTERY 1,5V SIZE AA',
          quantity: 100,
          unitPrice: 156,
          totalPrice: 15600,
          uom: 'SET'
        }
      ],
      'po-4': [
        {
          id: 'po-item-4',
          itemId: 'demo-item-4',
          itemNumber: 'P-000004',
          lineItem: '0004.166.GENRAL.7732',
          partNumber: 'ENERGIZER-AAA-1.5V',
          description: 'ENERGIZER BATTERY,1.5V,SIZE AAA',
          quantity: 48,
          unitPrice: 90,
          totalPrice: 4320,
          uom: 'KG'
        }
      ],
      'po-5': [
        {
          id: 'po-item-5',
          itemId: 'demo-item-5',
          itemNumber: 'P-000005',
          lineItem: '0005.512.GENRAL.9995',
          partNumber: 'TRS/1 CR-A',
          description: 'P/N TRS/1 CR-A , HINGE DOOR HINGES (SET) REF/ 2101099 FOR ELECTRIC COOKER',
          quantity: 53,
          unitPrice: 149,
          totalPrice: 7890,
          uom: 'EACH'
        }
      ],
      'po-6': [
        {
          id: 'po-item-6',
          itemId: 'demo-item-6',
          itemNumber: 'P-000006',
          lineItem: '6754.321.GENRAL.8844',
          partNumber: '11.33454.247',
          description: 'P/N 11.33454.247 , HOT PLATE WITH FRAME ST-STEEL 30x30 CM , 30KW , 230 VOLT (EGO CAT.) (MADE IN TURKEY)',
          quantity: 30,
          unitPrice: 415,
          totalPrice: 12450,
          uom: 'PIECE'
        }
      ],
      'po-7': [
        {
          id: 'po-item-7',
          itemId: 'demo-item-7',
          itemNumber: 'P-000007',
          lineItem: '7788.445.SCHNEIDER.2233',
          partNumber: 'XB2-BA31',
          description: 'SCHNEIDER ELECTRIC PUSH BUTTON XB2-BA31 GREEN 22MM',
          quantity: 15,
          unitPrice: 452,
          totalPrice: 6780,
          uom: 'PIECE'
        }
      ],
      'po-8': [
        {
          id: 'po-item-8',
          itemId: 'demo-item-8',
          itemNumber: 'P-000008',
          lineItem: '8899.556.ABB.1122',
          partNumber: 'AF09-30-10',
          description: 'ABB CONTACTOR AF09-30-10 220V AC 9A 3-POLE',
          quantity: 12,
          unitPrice: 778,
          totalPrice: 9340,
          uom: 'PIECE'
        }
      ],
      'po-9': [
        {
          id: 'po-item-9',
          itemId: 'demo-item-9',
          itemNumber: 'P-000009',
          lineItem: '9900.667.SIEMENS.5544',
          partNumber: '3RT1015-1BB41',
          description: 'SIEMENS CONTACTOR 3RT1015-1BB41 220V AC 7A 3-POLE',
          quantity: 25,
          unitPrice: 750,
          totalPrice: 18750,
          uom: 'PIECE'
        }
      ],
      'po-10': [
        {
          id: 'po-item-10',
          itemId: 'demo-item-10',
          itemNumber: 'P-000010',
          lineItem: '1011.778.AUTOMATION.6677',
          partNumber: 'PLC-CPU-1214C',
          description: 'PLC CPU 1214C DC/DC/DC WITH DIGITAL INPUTS/OUTPUTS',
          quantity: 4,
          unitPrice: 1390,
          totalPrice: 5560,
          uom: 'UNIT'
        }
      ]
    };
    
    return itemsMap[poId] || [];
  }
  
  async getPurchaseOrder(id: string) {
    const orders = await this.getAllPurchaseOrders();
    return orders.find(po => po.id === id);
  }
  
  async createPurchaseOrder(data: any) {
    return {
      id: 'po-' + Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
  }
  
  async updatePurchaseOrder(id: string, data: any) {
    return {
      id,
      ...data,
      updatedAt: new Date().toISOString()
    };
  }
  
  async deletePurchaseOrder(id: string) {
    return;
  }
  async getTopSuppliers() { return []; }
  async getMonthlyStats() { return []; }
  async backupDatabase() { return ''; }
}