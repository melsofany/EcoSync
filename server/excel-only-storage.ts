// نظام للعمل ببيانات Excel فقط - لا توجد بيانات من مصادر أخرى
import * as fs from 'fs';

export class ExcelOnlyStorage {
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

  private excelData: {
    purchaseOrders: any[],
    quotationRequests: any[],
    items: any[]
  } = {
    purchaseOrders: [],
    quotationRequests: [],
    items: []
  };

  constructor() {
    console.log('📥 النظام فارغ - تم مسح جميع البيانات كما طلب المستخدم');
    // لا نحمل أي بيانات - النظام فارغ تماماً
    this.excelData = {
      purchaseOrders: [],
      quotationRequests: [],
      items: []
    };
  }

  // تحميل بيانات Excel فقط
  private loadExcelDataOnly() {
    try {
      const newData = JSON.parse(fs.readFileSync('./attached_assets/new_excel_import_data.json', 'utf8'));
      
      if (newData.items && newData.items.length > 0) {
        // تحويل البيانات إلى صيغة النظام
        this.excelData.items = newData.items.map((item: any) => ({
          id: item.id,
          itemNumber: this.generateItemNumber(item.id),
          lineItem: item.lineItem,
          partNumber: item.partNumber,
          description: item.description,
          uom: item.uom,
          category: 'مستورد من Excel',
          createdAt: new Date().toISOString(),
          isActive: true
        }));
        
        // إنشاء طلبات التسعير وأوامر الشراء
        this.processExcelData(newData.items);
        
        console.log(`✅ تم تحميل ${this.excelData.items.length} صنف من Excel فقط`);
        console.log(`📋 طلبات التسعير: ${this.excelData.quotationRequests.length}`);
        console.log(`🛒 أوامر الشراء: ${this.excelData.purchaseOrders.length}`);
      } else {
        console.log('❌ لا توجد بيانات في Excel');
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات Excel:', error);
    }
  }

  // معالجة بيانات Excel لإنشاء طلبات التسعير وأوامر الشراء
  private processExcelData(items: any[]) {
    const rfqMap = new Map();
    const poMap = new Map();

    items.forEach(item => {
      // طلبات التسعير
      if (item.rfqNumber && item.rfqNumber.trim()) {
        if (!rfqMap.has(item.rfqNumber)) {
          rfqMap.set(item.rfqNumber, {
            id: `rfq-excel-${item.rfqNumber}`,
            rfqNumber: item.rfqNumber,
            customRequestNumber: item.rfqNumber,
            requestDate: this.parseExcelDate(item.requestDate),
            status: item.poNumber ? 'completed' : 'quoted',
            clientName: 'عميل من Excel',
            totalItems: 0,
            totalValue: 0,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            notes: 'طلب مستورد من Excel'
          });
        }
        
        const rfq = rfqMap.get(item.rfqNumber);
        rfq.totalItems++;
        rfq.totalValue += (item.price * item.quantity);
      }

      // أوامر الشراء
      if (item.poNumber && item.poNumber.trim()) {
        if (!poMap.has(item.poNumber)) {
          poMap.set(item.poNumber, {
            id: `po-excel-${item.poNumber}`,
            poNumber: item.poNumber,
            quotationNumber: item.rfqNumber,
            orderDate: this.parseExcelDate(item.poDate),
            status: 'confirmed',
            supplierName: 'مورد من Excel',
            currency: 'EGP',
            deliveryStatus: 'pending',
            totalAmount: 0,
            itemsCount: 0
          });
        }
        
        const po = poMap.get(item.poNumber);
        po.totalAmount += (item.poPrice * item.poQuantity);
        po.itemsCount++;
      }
    });

    this.excelData.quotationRequests = Array.from(rfqMap.values());
    this.excelData.purchaseOrders = Array.from(poMap.values());
  }

  // توليد رقم صنف
  private generateItemNumber(id: string): string {
    const index = this.excelData.items.length + 1;
    return `P-${index.toString().padStart(6, '0')}`;
  }

  // تحويل تاريخ Excel
  private parseExcelDate(excelDate: string): string {
    if (!excelDate || excelDate.trim() === '') return new Date().toISOString().split('T')[0];
    
    const dateNumber = parseInt(excelDate);
    if (isNaN(dateNumber)) return new Date().toISOString().split('T')[0];
    
    const excelEpoch = new Date(1900, 0, 1);
    const actualDate = new Date(excelEpoch.getTime() + (dateNumber - 2) * 24 * 60 * 60 * 1000);
    return actualDate.toISOString().split('T')[0];
  }

  // دوال المستخدمين
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

  // دوال الأصناف
  async getAllItems() {
    console.log('📭 النظام فارغ - لا توجد أصناف');
    return [];
  }

  // دوال طلبات التسعير
  async getAllQuotationRequests() {
    console.log('📭 النظام فارغ - لا توجد طلبات تسعير');
    return [];
  }

  // دوال أوامر الشراء
  async getAllPurchaseOrders() {
    console.log('📭 النظام فارغ - لا توجد أوامر شراء');
    return [];
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
}