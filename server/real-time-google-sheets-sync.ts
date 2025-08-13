import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync, writeFileSync } from 'fs';

interface SyncResult {
  success: boolean;
  sheetsData: any;
  localData: any;
  differences: string[];
}

class RealTimeGoogleSheetsSync {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string = '';
  private lastSyncTime: number = 0;

  constructor() {
    console.log('🔄 تهيئة المزامنة الحقيقية مع Google Sheets...');
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const serviceAccountKey = JSON.parse(readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8'));
      this.auth = new GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.spreadsheetId = '1VL9PMLjL2V3yd8aWoMUjeBdOhT3d2JIJXCkPrjdN7CI';
      
      console.log('✅ تم تهيئة المزامنة مع Google Sheets');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', (error as Error).message);
    }
  }

  async performFullSync(): Promise<SyncResult> {
    console.log('🔄 بدء المزامنة الكاملة...');
    
    try {
      // قراءة البيانات المحلية الفعلية
      const localData = JSON.parse(readFileSync('./attached_assets/real_exact_data.json', 'utf8'));
      
      // قراءة البيانات من Google Sheets
      const sheetsData = await this.readFromSheets();
      
      // مقارنة البيانات
      const differences = this.compareData(localData, sheetsData);
      
      // إذا كانت هناك اختلافات، قم بالمزامنة
      if (differences.length > 0) {
        console.log('⚠️ تم العثور على اختلافات:', differences.length);
        await this.syncToSheets(localData);
      }
      
      // تحديث النظام المحلي بالبيانات المزامنة
      await this.updateLocalSystem(localData);
      
      this.lastSyncTime = Date.now();
      
      return {
        success: true,
        sheetsData,
        localData,
        differences
      };
      
    } catch (error) {
      console.error('❌ خطأ في المزامنة:', (error as Error).message);
      return {
        success: false,
        sheetsData: null,
        localData: null,
        differences: []
      };
    }
  }

  private async readFromSheets(): Promise<any> {
    console.log('📖 قراءة البيانات من Google Sheets...');
    
    // قراءة أوامر الشراء
    const poData = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Purchase Orders!A:G'
    });
    
    // قراءة طلبات التسعير
    const quotationData = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Quotations!A:G'
    });
    
    // قراءة الأصناف
    const itemsData = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Items!A:I'
    });
    
    console.log('📊 بيانات Google Sheets:');
    console.log('- أوامر الشراء:', (poData.data.values?.length || 1) - 1);
    console.log('- طلبات التسعير:', (quotationData.data.values?.length || 1) - 1);
    console.log('- الأصناف:', (itemsData.data.values?.length || 1) - 1);
    
    return {
      purchaseOrders: poData.data.values || [],
      quotations: quotationData.data.values || [],
      items: itemsData.data.values || []
    };
  }

  private compareData(localData: any, sheetsData: any): string[] {
    const differences: string[] = [];
    
    const localPOCount = localData.purchaseOrders?.length || 0;
    const sheetsPOCount = (sheetsData.purchaseOrders?.length || 1) - 1;
    
    const localRFQCount = localData.quotations?.length || 0;
    const sheetsRFQCount = (sheetsData.quotations?.length || 1) - 1;
    
    const localItemsCount = localData.items?.length || 0;
    const sheetsItemsCount = (sheetsData.items?.length || 1) - 1;
    
    if (localPOCount !== sheetsPOCount) {
      differences.push(`أوامر الشراء: محلي ${localPOCount} vs Sheets ${sheetsPOCount}`);
    }
    
    if (localRFQCount !== sheetsRFQCount) {
      differences.push(`طلبات التسعير: محلي ${localRFQCount} vs Sheets ${sheetsRFQCount}`);
    }
    
    if (localItemsCount !== sheetsItemsCount) {
      differences.push(`الأصناف: محلي ${localItemsCount} vs Sheets ${sheetsItemsCount}`);
    }
    
    return differences;
  }

  private async syncToSheets(localData: any): Promise<void> {
    console.log('📤 مزامنة البيانات إلى Google Sheets...');
    
    // مزامنة أوامر الشراء
    const poHeaders = ['PO Number', 'Order Date', 'Total Amount', 'Status', 'Supplier', 'Currency'];
    const poRows = localData.purchaseOrders.map((po: any) => [
      po.poNumber, po.orderDate, po.totalAmount, po.status, po.supplierName, po.currency
    ]);
    
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: 'Purchase Orders!A:Z'
    });
    
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Purchase Orders!A1',
      valueInputOption: 'RAW',
      resource: { values: [poHeaders, ...poRows] }
    });
    
    // مزامنة طلبات التسعير
    const rfqHeaders = ['RFQ Number', 'Request Date', 'Status', 'Client', 'Total Value'];
    const rfqRows = localData.quotations.map((rfq: any) => [
      rfq.rfqNumber, rfq.requestDate, rfq.status, rfq.clientName, rfq.totalValue
    ]);
    
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: 'Quotations!A:Z'
    });
    
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Quotations!A1',
      valueInputOption: 'RAW',
      resource: { values: [rfqHeaders, ...rfqRows] }
    });
    
    // مزامنة الأصناف (أول 1000)
    const itemHeaders = ['Line Item', 'Part Number', 'Description', 'UOM', 'RFQ Number', 'PO Number', 'RFQ Price', 'PO Price'];
    const itemRows = localData.items.slice(0, 1000).map((item: any) => [
      item.lineItem, item.partNumber, item.description, item.uom,
      item.rfqNumber, item.poNumber, item.rfqPrice, item.poPrice
    ]);
    
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: 'Items!A:Z'
    });
    
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Items!A1',
      valueInputOption: 'RAW',
      resource: { values: [itemHeaders, ...itemRows] }
    });
    
    console.log('✅ تمت مزامنة جميع البيانات إلى Google Sheets');
  }

  private async updateLocalSystem(data: any): Promise<void> {
    console.log('🔄 تحديث النظام المحلي...');
    
    // تحديث الملف المحلي بالبيانات المزامنة
    writeFileSync('./attached_assets/synced_data.json', JSON.stringify(data, null, 2));
    
    console.log('✅ تم تحديث النظام المحلي');
  }

  async startRealTimeSync(): Promise<void> {
    console.log('🔄 بدء المزامنة الحقيقية...');
    
    // مزامنة أولية
    await this.performFullSync();
    
    // مزامنة دورية كل 30 ثانية
    setInterval(async () => {
      const result = await this.performFullSync();
      if (result.success && result.differences.length > 0) {
        console.log('🔄 تم العثور على تغييرات ومزامنتها:', result.differences);
      }
    }, 30000);
    
    console.log('✅ المزامنة الحقيقية نشطة');
  }

  getSyncStatus(): any {
    return {
      lastSyncTime: this.lastSyncTime,
      isActive: this.lastSyncTime > 0,
      timeSinceLastSync: Date.now() - this.lastSyncTime
    };
  }
}

export const realTimeSync = new RealTimeGoogleSheetsSync();