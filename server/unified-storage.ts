import { readFileSync, writeFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

interface UnifiedData {
  purchaseOrders: any[];
  quotations: any[];
  items: any[];
  statistics: any;
}

class UnifiedStorage {
  private localData: UnifiedData | null = null;
  private sheetsAuth: any;
  private sheets: any;
  private spreadsheetId: string = '1VL9PMLjL2V3yd8aWoMUjeBdOhT3d2JIJXCkPrjdN7CI';

  constructor() {
    this.initializeGoogleSheets();
    this.loadLocalData();
  }

  private async initializeGoogleSheets() {
    try {
      const serviceAccountKey = JSON.parse(readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8'));
      this.sheetsAuth = new GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.sheetsAuth });
      console.log('✅ تم تهيئة Google Sheets في النظام الموحد');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', (error as Error).message);
    }
  }

  private loadLocalData() {
    try {
      this.localData = JSON.parse(readFileSync('./attached_assets/real_exact_data.json', 'utf8'));
      console.log('📁 تم تحميل البيانات المحلية الفعلية');
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات المحلية:', (error as Error).message);
    }
  }

  // دمج العمليات مع Google Sheets
  async getAllPurchaseOrders() {
    if (!this.localData) return [];
    
    console.log(`🛒 عرض ${this.localData.purchaseOrders.length} أمر شراء فعلي`);
    
    // مزامنة مع Google Sheets إذا كان متاحاً
    if (this.sheets) {
      await this.syncPurchaseOrdersToSheets();
    }
    
    return this.localData.purchaseOrders.map((po, index) => ({
      id: `po-unified-${index}`,
      poNumber: po.poNumber,
      quotationNumber: po.quotationNumber || '',
      orderDate: po.orderDate,
      totalAmount: po.totalAmount,
      status: po.status,
      supplierName: po.supplierName,
      currency: po.currency || 'EGP',
      deliveryStatus: po.deliveryStatus || 'pending',
      itemsCount: 1,
      notes: po.notes || ''
    }));
  }

  async getAllQuotations() {
    if (!this.localData) return [];
    
    console.log(`📋 عرض ${this.localData.quotations.length} طلب تسعير فعلي`);
    
    // مزامنة مع Google Sheets إذا كان متاحاً
    if (this.sheets) {
      await this.syncQuotationsToSheets();
    }
    
    return this.localData.quotations.map((rfq, index) => ({
      id: `rfq-unified-${index}`,
      rfqNumber: rfq.rfqNumber,
      customRequestNumber: rfq.customRequestNumber || rfq.rfqNumber,
      requestDate: rfq.requestDate,
      status: rfq.status,
      clientName: rfq.clientName,
      totalItems: rfq.totalItems || 1,
      totalValue: rfq.totalValue,
      responseDate: rfq.responseDate,
      notes: rfq.notes || ''
    }));
  }

  async getAllItems() {
    if (!this.localData) return [];
    
    console.log(`📦 عرض ${this.localData.items.length} صنف فعلي`);
    
    return this.localData.items.map((item, index) => ({
      id: `item-unified-${index}`,
      itemNumber: item.lineItem,
      lineItem: item.lineItem,
      partNumber: item.partNumber,
      description: item.description,
      uom: item.uom,
      rfqNumber: item.rfqNumber,
      poNumber: item.poNumber,
      rfqPrice: item.rfqPrice || 0,
      poPrice: item.poPrice || 0,
      rfqQuantity: item.rfqQuantity || 0,
      poQuantity: item.poQuantity || 0,
      requestDate: item.requestDate,
      responseDate: item.responseDate,
      poDate: item.poDate,
      category: 'مكونات كهربائية',
      supplierName: 'مورد موحد',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  async getStatistics() {
    if (!this.localData) {
      return {
        totalPurchaseOrders: 0,
        totalQuotations: 0,
        totalItems: 0,
        totalPOValue: 0,
        totalRFQValue: 0
      };
    }

    const stats = this.localData.statistics;
    console.log('📊 إحصائيات النظام الموحد:');
    console.log(`   🛒 أوامر الشراء: ${stats.totalPOs}`);
    console.log(`   📋 طلبات التسعير: ${stats.totalRFQs}`);
    console.log(`   📦 الأصناف: ${stats.totalItems}`);
    console.log(`   💰 القيمة المالية: ${stats.totalPOValue.toLocaleString()}`);
    
    return {
      totalPurchaseOrders: stats.totalPOs,
      totalQuotations: stats.totalRFQs,
      totalItems: stats.totalItems,
      totalPOValue: stats.totalPOValue,
      totalRFQValue: stats.totalRFQs * 1000, // تقدير
      pendingPOs: 0,
      completedPOs: stats.totalPOs,
      pendingRFQs: 0,
      quotedRFQs: stats.totalRFQs
    };
  }

  private async syncPurchaseOrdersToSheets() {
    try {
      if (!this.localData || !this.sheets) return;
      
      const headers = ['PO Number', 'Order Date', 'Total Amount', 'Status', 'Supplier', 'Currency'];
      const rows = this.localData.purchaseOrders.map(po => [
        po.poNumber, po.orderDate, po.totalAmount, po.status, po.supplierName, po.currency || 'EGP'
      ]);
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Purchase Orders!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });
      
    } catch (error) {
      console.log('⚠️ تعذرت مزامنة أوامر الشراء:', (error as Error).message);
    }
  }

  private async syncQuotationsToSheets() {
    try {
      if (!this.localData || !this.sheets) return;
      
      const headers = ['RFQ Number', 'Request Date', 'Status', 'Client', 'Total Value'];
      const rows = this.localData.quotations.map(rfq => [
        rfq.rfqNumber, rfq.requestDate, rfq.status, rfq.clientName, rfq.totalValue
      ]);
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Quotations!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });
      
    } catch (error) {
      console.log('⚠️ تعذرت مزامنة طلبات التسعير:', (error as Error).message);
    }
  }

  // إنشاء أمر شراء جديد
  async createPurchaseOrder(data: any) {
    if (!this.localData) return null;
    
    const newPO = {
      id: `po-new-${Date.now()}`,
      poNumber: data.poNumber,
      quotationNumber: data.quotationNumber || '',
      orderDate: data.orderDate,
      totalAmount: data.totalAmount,
      status: data.status || 'pending',
      supplierName: data.supplierName,
      currency: data.currency || 'EGP',
      deliveryStatus: 'pending',
      itemsCount: 1,
      notes: data.notes || ''
    };
    
    this.localData.purchaseOrders.push(newPO);
    this.saveLocalData();
    
    // مزامنة مع Google Sheets
    if (this.sheets) {
      await this.syncPurchaseOrdersToSheets();
    }
    
    console.log('✅ تم إنشاء أمر شراء جديد:', newPO.poNumber);
    return newPO;
  }

  // إنشاء طلب تسعير جديد
  async createQuotationRequest(data: any) {
    if (!this.localData) return null;
    
    const newRFQ = {
      id: `rfq-new-${Date.now()}`,
      rfqNumber: data.rfqNumber,
      customRequestNumber: data.customRequestNumber || data.rfqNumber,
      requestDate: data.requestDate,
      status: data.status || 'pending',
      clientName: data.clientName,
      totalItems: data.totalItems || 1,
      totalValue: data.totalValue,
      responseDate: data.responseDate || '',
      notes: data.notes || ''
    };
    
    this.localData.quotations.push(newRFQ);
    this.saveLocalData();
    
    // مزامنة مع Google Sheets
    if (this.sheets) {
      await this.syncQuotationsToSheets();
    }
    
    console.log('✅ تم إنشاء طلب تسعير جديد:', newRFQ.rfqNumber);
    return newRFQ;
  }

  private saveLocalData() {
    try {
      if (this.localData) {
        writeFileSync('./attached_assets/real_exact_data.json', JSON.stringify(this.localData, null, 2));
        console.log('💾 تم حفظ البيانات المحلية');
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ البيانات:', (error as Error).message);
    }
  }
}

export const unifiedStorage = new UnifiedStorage();