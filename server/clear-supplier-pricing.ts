import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

export class ClearSupplierPricing {
  private googleSheets: GoogleSheetsRealtimeData;
  
  constructor() {
    this.googleSheets = new GoogleSheetsRealtimeData();
  }
  
  async initialize() {
    await this.googleSheets.initialize();
  }
  
  async clearAllData() {
    try {
      console.log('🗑️ بدء حذف بيانات تسعير الموردين...');
      
      // قراءة البيانات الحالية
      const response = await this.googleSheets.sheets.spreadsheets.values.get({
        spreadsheetId: this.googleSheets.spreadsheetId,
        range: 'تسعير_الموردين!A:AA'
      });
      
      const rows = response.data.values || [];
      console.log(`📊 عدد الصفوف الحالية: ${rows.length}`);
      
      if (rows.length > 1) {
        // حذف جميع البيانات عدا صف العناوين
        await this.googleSheets.sheets.spreadsheets.values.clear({
          spreadsheetId: this.googleSheets.spreadsheetId,
          range: 'تسعير_الموردين!A2:AA'
        });
        
        console.log(`✅ تم حذف ${rows.length - 1} بند من صفحة تسعير الموردين`);
        return { success: true, deletedCount: rows.length - 1 };
      } else {
        console.log('📭 صفحة تسعير الموردين فارغة بالفعل');
        return { success: true, deletedCount: 0 };
      }
    } catch (error) {
      console.error('❌ خطأ في حذف البيانات:', error);
      throw error;
    }
  }
}