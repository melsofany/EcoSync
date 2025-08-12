import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

class GoogleSheetsSync {
  private sheets: any;
  private spreadsheetId: string = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  private syncInterval: NodeJS.Timeout | null = null;
  private storage: any;

  constructor(storage: any) {
    this.storage = storage;
    this.initializeSheets();
  }

  private async initializeSheets() {
    try {
      const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
      const credentials = JSON.parse(serviceAccountKey);
      
      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: auth });
      console.log('🔗 تم تهيئة المزامنة مع المصدر الأساسي');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error.message);
    }
  }

  // بدء المزامنة الفورية كل 10 ثوانٍ
  startRealTimeSync() {
    console.log('🔄 بدء المزامنة التلقائية للبيانات (كل 10 ثوانٍ)...');
    
    this.syncInterval = setInterval(async () => {
      await this.syncFromSheets();
    }, 10000);

    // مزامنة أولية
    setTimeout(() => this.syncFromSheets(), 2000);
  }

  stopRealTimeSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ تم إيقاف المزامنة الفورية');
    }
  }

  // مزامنة البيانات من Google Sheets
  private async syncFromSheets() {
    try {
      // مزامنة الأصناف
      await this.syncItems();
      
      // مزامنة طلبات التسعير  
      await this.syncQuotations();
      
      // مزامنة أوامر الشراء
      await this.syncPurchaseOrders();
      
    } catch (error) {
      console.error('❌ خطأ في المزامنة:', error.message);
    }
  }

  private async syncItems() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'الأصناف!A2:H5000'
      });

      if (response.data.values && response.data.values.length > 0) {
        const items = response.data.values.map(row => ({
          id: row[0] || '',
          lineItem: row[1] || '',
          partNumber: row[2] || '',
          description: row[3] || '',
          uom: row[4] || 'EACH',
          brand: row[5] || '',
          price: row[6] || '',
          createdAt: row[7] || new Date().toISOString(),
          isActive: true
        }));

        if (this.storage.updateItemsFromSheets) {
          this.storage.updateItemsFromSheets(items);
        }
      }
    } catch (error) {
      // تجاهل الأخطاء الطفيفة
    }
  }

  private async syncQuotations() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'طلبات التسعير!A2:I2000'
      });

      if (response.data.values && response.data.values.length > 0) {
        const quotations = response.data.values.map(row => ({
          id: row[0] || '',
          rfqNumber: row[1] || '',
          requestDate: row[2] || '',
          responseDate: row[3] || '',
          status: row[4] || 'pending',
          clientName: row[5] || '',
          totalItems: parseInt(row[6]) || 0,
          totalValue: parseFloat(row[7]) || 0,
          notes: row[8] || ''
        }));

        if (this.storage.updateQuotationsFromSheets) {
          this.storage.updateQuotationsFromSheets(quotations);
        }
      }
    } catch (error) {
      // تجاهل الأخطاء الطفيفة
    }
  }

  private async syncPurchaseOrders() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'أوامر الشراء!A2:H500'
      });

      if (response.data.values && response.data.values.length > 0) {
        const purchaseOrders = response.data.values.map(row => ({
          id: row[0] || '',
          poNumber: row[0] || '',
          quotationNumber: row[1] || '',
          orderDate: row[2] || '',
          totalAmount: parseFloat(row[3]) || 0,
          status: row[4] || 'pending',
          supplierName: row[5] || '',
          currency: row[6] || 'EGP',
          deliveryStatus: row[7] || 'pending'
        }));

        if (this.storage.updatePurchaseOrdersFromSheets) {
          this.storage.updatePurchaseOrdersFromSheets(purchaseOrders);
        }
      }
    } catch (error) {
      // تجاهل الأخطاء الطفيفة
    }
  }

  // إرسال تحديث إلى Google Sheets عند تعديل البيانات
  async pushToSheets(sheetName: string, data: any[]) {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: data }
      });
      
      console.log(`✅ تم إرسال التحديث إلى ${sheetName}`);
    } catch (error) {
      console.error(`❌ خطأ في إرسال التحديث إلى ${sheetName}:`, error.message);
    }
  }
}

export default GoogleSheetsSync;