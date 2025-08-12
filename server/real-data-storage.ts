// نظام البيانات الحقيقية - بدون أي مراجع خارجية
import { readFileSync } from 'fs';

export class RealDataStorage {
  private purchaseOrders: any[] = [];
  private quotations: any[] = [];
  private items: any[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // التحقق من وضع المسح
    if (global.DISABLE_DATA_LOADING) {
      console.log('🚫 تم تعطيل تحميل البيانات - النظام فارغ');
      this.createEmptyData();
      return;
    }
    
    try {
      console.log('📊 تحميل البيانات من المصدر الأساسي...');
      
      // التحقق من وجود البيانات المزامنة أولاً
      const syncedData = JSON.parse(readFileSync('./attached_assets/synced_data_from_sheets.json', 'utf8'));
      
      // إذا كانت البيانات فارغة أو حالة مسح كامل، استخدم بيانات فارغة
      if (syncedData.status === 'completely_empty' || !syncedData.items || syncedData.items.length === 0) {
        console.log('📭 لا توجد بيانات مزامنة - النظام فارغ');
        this.createEmptyData();
        return;
      }
      
      this.purchaseOrders = syncedData.purchaseOrders || [];
      this.quotations = syncedData.quotations || [];
      this.items = syncedData.items || [];
      
      console.log(`✅ تم تحميل ${this.purchaseOrders.length} أمر شراء`);
      console.log(`✅ تم تحميل ${this.quotations.length} طلب تسعير`);
      console.log(`✅ تم تحميل ${this.items.length} صنف`);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
      this.createEmptyData();
    }
  }

  private processOriginalData(originalData: any[]) {
    console.log('🔄 معالجة البيانات الأصلية...');
    
    const purchaseOrdersMap = new Map();
    const quotationsMap = new Map();
    this.items = [];

    let itemCounter = 1;

    originalData.forEach((record) => {
      // إنشاء صنف لكل سجل
      const item = {
        id: `item-${itemCounter}`,
        itemNumber: `P-${String(itemCounter++).padStart(6, '0')}`,
        lineItem: record.lineItem || '',
        partNumber: record.partNumber || '',
        description: record.description || '',
        uom: record.uom || 'EACH',
        category: 'مستورد من Excel',
        brand: '',
        rfqNumber: record.rfqNumber || '',
        poNumber: record.poNumber || '',
        rfqPrice: parseFloat(record.rfqPrice || '0'),
        poPrice: parseFloat(record.poPrice || '0'),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      this.items.push(item);

      // تجميع أوامر الشراء
      if (record.poNumber && record.poNumber.trim()) {
        const poNumber = record.poNumber.trim();
        if (!purchaseOrdersMap.has(poNumber)) {
          purchaseOrdersMap.set(poNumber, {
            id: `po-${purchaseOrdersMap.size + 1}`,
            poNumber: poNumber,
            quotationNumber: record.rfqNumber || '',
            orderDate: record.poDate || '',
            totalAmount: 0,
            status: 'confirmed',
            supplierName: 'مورد من البيانات الأصلية',
            currency: 'EGP',
            deliveryStatus: 'pending',
            itemsCount: 0,
            notes: 'مستورد من Excel الأصلي'
          });
        }
        
        const po = purchaseOrdersMap.get(poNumber);
        po.totalAmount += parseFloat(record.poPrice || '0') * parseFloat(record.poQuantity || '1');
        po.itemsCount++;
      }

      // تجميع طلبات التسعير
      if (record.rfqNumber && record.rfqNumber.trim()) {
        const rfqNumber = record.rfqNumber.trim();
        if (!quotationsMap.has(rfqNumber)) {
          quotationsMap.set(rfqNumber, {
            id: `rfq-${quotationsMap.size + 1}`,
            rfqNumber: rfqNumber,
            customRequestNumber: rfqNumber,
            requestDate: record.rfqDate || '',
            status: record.poNumber ? 'completed' : 'quoted',
            clientName: 'عميل قرطبة للتوريدات',
            totalItems: 0,
            totalValue: 0,
            responseDate: record.rfqResponseDate || '',
            notes: 'مستورد من Excel الأصلي',
            createdAt: new Date().toISOString()
          });
        }
        
        const rfq = quotationsMap.get(rfqNumber);
        rfq.totalItems++;
        rfq.totalValue += parseFloat(record.rfqPrice || '0') * parseFloat(record.rfqQuantity || '1');
      }
    });

    this.purchaseOrders = Array.from(purchaseOrdersMap.values());
    this.quotations = Array.from(quotationsMap.values());
    
    console.log(`✅ تم معالجة ${this.purchaseOrders.length} أمر شراء`);
    console.log(`✅ تم معالجة ${this.quotations.length} طلب تسعير`);
    console.log(`✅ تم معالجة ${this.items.length} صنف`);
    
    this.isInitialized = true;
  }

  private createEmptyData() {
    console.log('⚠️ إنشاء بيانات فارغة');
    this.purchaseOrders = [];
    this.quotations = [];
    this.items = [];
    this.isInitialized = true;
  }

  async getAllPurchaseOrders() {
    if (!this.isInitialized) {
      this.initializeData();
    }
    return this.purchaseOrders;
  }

  async getAllQuotationRequests() {
    if (!this.isInitialized) {
      this.initializeData();
    }
    return this.quotations;
  }

  async getAllQuotationRequestsWithClients() {
    return await this.getAllQuotationRequests();
  }

  async getAllItems() {
    if (!this.isInitialized) {
      this.initializeData();
    }
    return this.items;
  }

  async getStatistics() {
    const [purchaseOrders, quotations, items] = await Promise.all([
      this.getAllPurchaseOrders(),
      this.getAllQuotationRequests(),
      this.getAllItems()
    ]);

    const stats = {
      totalPurchaseOrders: purchaseOrders.length,
      totalQuotations: quotations.length,
      totalItems: items.length,
      totalPOValue: purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0),
      totalRFQValue: quotations.reduce((sum, rfq) => sum + (rfq.totalValue || 0), 0),
      pendingPOs: purchaseOrders.filter(po => po.status === 'pending').length,
      completedPOs: purchaseOrders.filter(po => po.status === 'completed').length,
      pendingRFQs: quotations.filter(rfq => rfq.status === 'pending').length,
      quotedRFQs: quotations.filter(rfq => rfq.status === 'quoted').length
    };

    console.log('📊 إحصائيات النظام:');
    console.log(`   🛒 أوامر الشراء: ${stats.totalPurchaseOrders}`);
    console.log(`   📋 طلبات التسعير: ${stats.totalQuotations}`);
    console.log(`   📦 الأصناف: ${stats.totalItems}`);

    return stats;
  }

  // دوال المستخدمين
  async getUserByUsername(username: string) {
    console.log(`🔍 البحث عن المستخدم: ${username}`);
    
    if (username === 'admin') {
      const adminUser = {
        id: 'admin-system',
        username: 'admin',
        password: '$2b$10$Ybm8FXXJQdbSP8LjWr3kUuJPWMLI2/YvzX7XMUk0AqjdM4ula3CCe', // admin123
        fullName: 'مدير النظام',
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
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ تم العثور على المستخدم admin');
      return adminUser;
    }
    
    console.log('❌ لم يتم العثور على المستخدم');
    return undefined;
  }

  async getUser(id: string) {
    if (id === 'admin-system') {
      return await this.getUserByUsername('admin');
    }
    return undefined;
  }

  async getAllUsers() {
    return [await this.getUserByUsername('admin')];
  }

  // دوال فارغة للتوافق
  async createUser() { return await this.getUserByUsername('admin'); }
  async updateUser() { return await this.getUserByUsername('admin'); }
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
  async getActivities() { return []; }
  async createPasswordResetToken() { return; }
  async getPasswordResetToken() { return undefined; }
  async markPasswordResetTokenUsed() { return; }
  async createQuotationRequest() { return {}; }
  async getQuotationRequest() { return undefined; }
  async updateQuotationRequest() { return {}; }
  async deleteQuotationRequest() { return; }
  async createItem() { return {}; }
  async getItem() { return undefined; }
  async updateItem() { return {}; }
  async deleteItem() { return; }
  async createPurchaseOrder() { return {}; }
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
}

export const realDataStorage = new RealDataStorage();