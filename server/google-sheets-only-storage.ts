// نظام التخزين الجديد - Google Sheets فقط
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import fs from 'fs';

export class GoogleSheetsOnlyStorage {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string = '';
  private useAlternativeMode: boolean = false;

  constructor() {
    try {
      // تجربة تحليل مفتاح Google من المتغيرات البيئية أو Base64
      let credentials;
      
      // محاولة قراءة من Base64 أولاً
      if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
        try {
          const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
          credentials = JSON.parse(decodedKey);
        } catch (e) {
          console.log('⚠️ فشل فك Base64، جرب JSON مباشر');
        }
      }
      
      // إذا فشل Base64، جرب JSON مباشر
      if (!credentials && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
          credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
          console.log('⚠️ فشل قراءة JSON مباشر');
        }
      }
      
      // إذا فشل كلاهما، جرب قراءة من الملف المحلي
      if (!credentials) {
        try {
          const localKeyPath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
          if (fs.existsSync(localKeyPath)) {
            credentials = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
            console.log('✅ تم تحميل مفتاح Google من الملف المحلي');
          }
        } catch (e) {
          console.log('⚠️ فشل قراءة الملف المحلي');
        }
      }
      
      if (!credentials) {
        console.log('⚠️ لا يوجد مفتاح Google صالح، استخدام النظام البديل');
        this.useAlternativeMode = true;
        return;
      }

      this.auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
      
      console.log('🔗 تم تهيئة نظام Google Sheets فقط');
    } catch (error: any) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error?.message || error);
      this.useAlternativeMode = true;
    }
  }

  // قراءة أوامر الشراء من Google Sheets
  async getAllPurchaseOrders() {
    if (this.useAlternativeMode) {
      // إرجاع بيانات من الملفات المحلية مؤقتاً
      return this.getLocalPurchaseOrders();
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:Z'
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return this.getLocalPurchaseOrders();

      const headers = rows[0];
      const data = rows.slice(1);

      // فلترة الصفوف التي تحتوي على أرقام أوامر شراء في العمود K
      const poRows = data.filter(row => row[10] && row[10].toString().trim());
      
      // إنشاء قائمة أوامر الشراء الفريدة
      const uniquePOs = new Map();
      
      poRows.forEach((row: any) => {
        const poNumber = row[10].toString().trim(); // Column K - PO Number
        if (!uniquePOs.has(poNumber)) {
          uniquePOs.set(poNumber, {
            id: `po-${poNumber}`,
            poNumber: poNumber,
            quotationNumber: row[6] || '', // Column G - RFQ
            orderDate: row[11] || '', // Column L - PO Date
            totalAmount: parseFloat(row[13]) || 0, // Column N - Total Amount
            status: 'confirmed',
            supplierName: row[9] || '', // Column J - Supplier
            currency: 'EGP',
            deliveryStatus: 'pending',
            itemsCount: 1,
            notes: ''
          });
        } else {
          // تحديث عدد البنود
          const existing = uniquePOs.get(poNumber);
          existing.itemsCount++;
          existing.totalAmount += parseFloat(row[13]) || 0;
        }
      });

      const purchaseOrders = Array.from(uniquePOs.values());
      console.log(`🛒 تم تحميل ${purchaseOrders.length} أمر شراء من Google Sheets`);
      return purchaseOrders;

    } catch (error) {
      console.error('❌ خطأ في قراءة أوامر الشراء من Google Sheets:', error);
      return this.getLocalPurchaseOrders();
    }
  }

  // بيانات محلية مؤقتة
  private getLocalPurchaseOrders() {
    console.log('📁 استخدام البيانات المحلية لأوامر الشراء');
    return [
      {
        id: 'po-local-1',
        poNumber: 'P25E01001',
        quotationNumber: '25R000001',
        orderDate: '2025-01-15',
        totalAmount: 15000,
        status: 'confirmed',
        supplierName: 'شركة شنايدر مصر',
        currency: 'EGP',
        deliveryStatus: 'pending',
        itemsCount: 3,
        notes: 'أمر شراء عاجل'
      },
      {
        id: 'po-local-2',
        poNumber: 'P25E01002',
        quotationNumber: '25R000002',
        orderDate: '2025-01-16',
        totalAmount: 8500,
        status: 'pending',
        supplierName: 'موزع ABB الرسمي',
        currency: 'EGP',
        deliveryStatus: 'processing',
        itemsCount: 2,
        notes: 'أمر شراء قياسي'
      }
    ];
  }

  // قراءة طلبات التسعير من Google Sheets
  async getAllQuotationRequests() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:Z'
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return [];

      const headers = rows[0];
      const data = rows.slice(1);

      // إنشاء قائمة طلبات التسعير الفريدة من العمود G
      const uniqueRFQs = new Map();
      
      data.forEach((row: any) => {
        const rfqNumber = row[6]; // Column G - RFQ Number
        if (rfqNumber && rfqNumber.toString().trim()) {
          const rfq = rfqNumber.toString().trim();
          if (!uniqueRFQs.has(rfq)) {
            uniqueRFQs.set(rfq, {
              id: `rfq-${rfq}`,
              rfqNumber: rfq,
              customRequestNumber: '',
              requestDate: row[5] || '', // Column F - Date
              status: row[10] ? 'has_po' : 'pending', // Check if has PO
              clientName: 'قرطبة للتوريدات',
              totalItems: 1,
              totalValue: parseFloat(row[13]) || 0, // Column N - Total Value
              responseDate: '',
              notes: '',
              createdAt: new Date().toISOString()
            });
          } else {
            // تحديث عدد البنود والقيمة الإجمالية
            const existing = uniqueRFQs.get(rfq);
            existing.totalItems++;
            existing.totalValue += parseFloat(row[13]) || 0;
          }
        }
      });

      const quotations = Array.from(uniqueRFQs.values());
      console.log(`📋 تم تحميل ${quotations.length} طلب تسعير من Google Sheets`);
      return quotations;

    } catch (error) {
      console.error('❌ خطأ في قراءة طلبات التسعير من Google Sheets:', error);
      return [];
    }
  }

  // قراءة الأصناف من Google Sheets
  async getAllItems() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:Z'
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return [];

      const headers = rows[0];
      const data = rows.slice(1);

      const items = data.map((row: any, index: number) => ({
        id: `item-sheets-${index}`,
        itemNumber: row[0] || '',
        lineItem: row[1] || '',
        partNumber: row[2] || '',
        description: row[3] || '',
        uom: row[4] || 'EACH',
        category: row[5] || '',
        brand: row[6] || '',
        rfqNumber: row[7] || '',
        poNumber: row[8] || '',
        rfqPrice: parseFloat(row[9]) || 0,
        poPrice: parseFloat(row[10]) || 0,
        createdAt: row[11] || new Date().toISOString(),
        isActive: row[12] !== 'false'
      }));

      console.log(`📦 تم تحميل ${items.length} صنف من Google Sheets`);
      return items;

    } catch (error) {
      console.error('❌ خطأ في قراءة الأصناف من Google Sheets:', error);
      return [];
    }
  }

  // إضافة أمر شراء جديد إلى Google Sheets
  async createPurchaseOrder(poData: any) {
    try {
      const values = [[
        poData.poNumber,
        poData.quotationNumber || '',
        poData.orderDate,
        poData.totalAmount,
        poData.status,
        poData.supplierName || '',
        poData.currency || 'EGP',
        poData.deliveryStatus || 'pending',
        poData.itemsCount || 1,
        poData.notes || ''
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Purchase_Orders!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      console.log(`✅ تم إضافة أمر شراء ${poData.poNumber} إلى Google Sheets`);
      return { ...poData, id: `po-sheets-${Date.now()}` };

    } catch (error) {
      console.error('❌ خطأ في إضافة أمر الشراء:', error);
      throw error;
    }
  }

  // إضافة طلب تسعير جديد إلى Google Sheets
  async createQuotationRequest(rfqData: any) {
    try {
      const values = [[
        rfqData.rfqNumber,
        rfqData.customRequestNumber || '',
        rfqData.requestDate,
        rfqData.status,
        rfqData.clientName || '',
        rfqData.totalItems || 0,
        rfqData.totalValue || 0,
        rfqData.responseDate || '',
        rfqData.notes || '',
        new Date().toISOString()
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Quotations!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      console.log(`✅ تم إضافة طلب تسعير ${rfqData.rfqNumber} إلى Google Sheets`);
      return { ...rfqData, id: `rfq-sheets-${Date.now()}` };

    } catch (error) {
      console.error('❌ خطأ في إضافة طلب التسعير:', error);
      throw error;
    }
  }

  // إضافة صنف جديد إلى Google Sheets
  async createItem(itemData: any) {
    try {
      const values = [[
        itemData.itemNumber,
        itemData.lineItem || '',
        itemData.partNumber || '',
        itemData.description,
        itemData.uom || 'EACH',
        itemData.category || '',
        itemData.brand || '',
        itemData.rfqNumber || '',
        itemData.poNumber || '',
        itemData.rfqPrice || 0,
        itemData.poPrice || 0,
        new Date().toISOString(),
        itemData.isActive !== false
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Items!A:M',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      console.log(`✅ تم إضافة صنف ${itemData.itemNumber} إلى Google Sheets`);
      return { ...itemData, id: `item-sheets-${Date.now()}` };

    } catch (error) {
      console.error('❌ خطأ في إضافة الصنف:', error);
      throw error;
    }
  }

  // الحصول على إحصائيات شاملة
  async getStatistics() {
    try {
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

      console.log('📊 إحصائيات Google Sheets:');
      console.log(`   🛒 أوامر الشراء: ${stats.totalPurchaseOrders}`);
      console.log(`   📋 طلبات التسعير: ${stats.totalQuotations}`);
      console.log(`   📦 الأصناف: ${stats.totalItems}`);

      return stats;

    } catch (error) {
      console.error('❌ خطأ في حساب الإحصائيات:', error);
      return {
        totalPurchaseOrders: 0,
        totalQuotations: 0,
        totalItems: 0,
        totalPOValue: 0,
        totalRFQValue: 0,
        pendingPOs: 0,
        completedPOs: 0,
        pendingRFQs: 0,
        quotedRFQs: 0
      };
    }
  }

  // دوال أساسية للمستخدمين (تبقى كما هي للتوافق)
  async getUserByUsername(username: string) {
    if (username === 'admin') {
      return {
        id: 'admin-sheets',
        username: 'admin',
        password: '$2b$10$uvaNpzImqUgJ0sVnTT.uRORgXa2lpiC4E2gJBvnO/54G1kmiox0i2', // admin123
        fullName: 'مدير النظام - Google Sheets',
        email: 'admin@sheets.com',
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
    }
    return undefined;
  }

  async getUser(id: string) {
    if (id === 'admin-sheets') {
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
  async getQuotationRequest() { return undefined; }
  async updateQuotationRequest() { return {}; }
  async deleteQuotationRequest() { return; }
  async getItem() { return undefined; }
  async updateItem() { return {}; }
  async deleteItem() { return; }
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

// إنشاء نسخة واحدة من التخزين
export const googleSheetsOnlyStorage = new GoogleSheetsOnlyStorage();