import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

class RealTimeSyncManager {
  private sheets: any;
  private spreadsheetId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: string = '';
  private storage: any;

  constructor(storage: any) {
    this.storage = storage;
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.initializeGoogleSheets();
  }

  private async initializeGoogleSheets() {
    try {
      const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
      const credentials = JSON.parse(serviceAccountKey);
      
      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: auth });
      console.log('🔗 تم تهيئة المزامنة الفورية مع Google Sheets');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error.message);
    }
  }

  // بدء المزامنة الفورية
  startRealTimeSync() {
    console.log('🔄 بدء المزامنة الفورية مع Google Sheets...');
    
    // مزامنة كل 5 ثوانٍ للتحديثات الفورية
    this.syncInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, 5000);

    // مزامنة أولية
    this.checkForUpdates();
  }

  // إيقاف المزامنة
  stopRealTimeSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ تم إيقاف المزامنة الفورية');
    }
  }

  // فحص التحديثات من Google Sheets
  private async checkForUpdates() {
    try {
      // فحص تحديثات الأصناف
      await this.syncItemsFromSheets();
      
      // فحص تحديثات طلبات التسعير
      await this.syncQuotationsFromSheets();
      
      // فحص تحديثات أوامر الشراء
      await this.syncPurchaseOrdersFromSheets();
      
      // فحص تحديثات المستخدمين
      await this.syncUsersFromSheets();
      
    } catch (error) {
      console.error('❌ خطأ في فحص التحديثات:', error.message);
    }
  }

  // مزامنة الأصناف من Google Sheets
  private async syncItemsFromSheets() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'الأصناف!A2:H1000'
      });

      if (response.data.values && response.data.values.length > 0) {
        const updatedItems = response.data.values.map(row => ({
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

        // تحديث البيانات في النظام
        this.storage.updateItemsFromSheets(updatedItems);
        console.log(`🔄 تم تحديث ${updatedItems.length} صنف من Google Sheets`);
      }
    } catch (error) {
      console.error('❌ خطأ في مزامنة الأصناف:', error.message);
    }
  }

  // مزامنة طلبات التسعير من Google Sheets
  private async syncQuotationsFromSheets() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'طلبات التسعير!A2:I1000'
      });

      if (response.data.values && response.data.values.length > 0) {
        const updatedQuotations = response.data.values.map(row => ({
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

        this.storage.updateQuotationsFromSheets(updatedQuotations);
        console.log(`🔄 تم تحديث ${updatedQuotations.length} طلب تسعير من Google Sheets`);
      }
    } catch (error) {
      console.error('❌ خطأ في مزامنة طلبات التسعير:', error.message);
    }
  }

  // مزامنة أوامر الشراء من Google Sheets
  private async syncPurchaseOrdersFromSheets() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'أوامر الشراء!A2:H1000'
      });

      if (response.data.values && response.data.values.length > 0) {
        const updatedPOs = response.data.values.map(row => ({
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

        this.storage.updatePurchaseOrdersFromSheets(updatedPOs);
        console.log(`🔄 تم تحديث ${updatedPOs.length} أمر شراء من Google Sheets`);
      }
    } catch (error) {
      console.error('❌ خطأ في مزامنة أوامر الشراء:', error.message);
    }
  }

  // مزامنة المستخدمين من Google Sheets
  private async syncUsersFromSheets() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Users!A2:AC20'
      });

      if (response.data.values && response.data.values.length > 0) {
        const updatedUsers = response.data.values.map(row => ({
          id: row[0] || '',
          username: row[1] || '',
          hashedPassword: row[2] || '',
          fullName: row[3] || '',
          role: row[4] || 'data_entry',
          email: row[5] || '',
          isActive: row[6] === 'نعم',
          lastLogin: row[7] || '',
          createdAt: row[8] || '',
          permissions: {
            viewQuotations: row[9] === 'نعم',
            createQuotations: row[10] === 'نعم',
            editQuotations: row[11] === 'نعم',
            deleteQuotations: row[12] === 'نعم',
            viewItems: row[13] === 'نعم',
            createItems: row[14] === 'نعم',
            editItems: row[15] === 'نعم',
            deleteItems: row[16] === 'نعم',
            viewPurchaseOrders: row[17] === 'نعم',
            createPurchaseOrders: row[18] === 'نعم',
            editPurchaseOrders: row[19] === 'نعم',
            deletePurchaseOrders: row[20] === 'نعم',
            viewUsers: row[21] === 'نعم',
            createUsers: row[22] === 'نعم',
            editUsers: row[23] === 'نعم',
            deleteUsers: row[24] === 'نعم',
            viewReports: row[25] === 'نعم',
            importData: row[26] === 'نعم',
            exportData: row[27] === 'نعم',
            backupDatabase: row[28] === 'نعم'
          }
        }));

        this.storage.updateUsersFromSheets(updatedUsers);
        console.log(`🔄 تم تحديث ${updatedUsers.length} مستخدم من Google Sheets`);
      }
    } catch (error) {
      console.error('❌ خطأ في مزامنة المستخدمين:', error.message);
    }
  }

  // إرسال تحديث إلى Google Sheets
  async pushUpdateToSheets(sheetName: string, data: any[]) {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: data }
      });
      
      console.log(`✅ تم إرسال التحديث إلى ورقة ${sheetName}`);
    } catch (error) {
      console.error(`❌ خطأ في إرسال التحديث إلى ${sheetName}:`, error.message);
    }
  }

  // إضافة صف جديد لورقة محددة
  async addRowToSheet(sheetName: string, rowData: any[]) {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      
      console.log(`✅ تم إضافة صف جديد إلى ورقة ${sheetName}`);
    } catch (error) {
      console.error(`❌ خطأ في إضافة صف إلى ${sheetName}:`, error.message);
    }
  }
}

export default RealTimeSyncManager;