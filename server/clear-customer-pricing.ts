import { google } from 'googleapis';
import { createGoogleAuth } from './google-auth-helper';

export class ClearCustomerPricing {
  private sheets: any;
  private spreadsheetId: string = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  
  async initialize() {
    try {
      const auth = createGoogleAuth();
      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ تم تهيئة Google Sheets لحذف بيانات تسعير العملاء');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error);
      throw error;
    }
  }
  
  async clearAllCustomerPricingData() {
    try {
      console.log('🗑️ بدء حذف بيانات تسعير العملاء...');
      
      // قراءة البيانات الحالية
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'تسعير_العملاء!A:P'
      });
      
      const rows = response.data.values || [];
      console.log(`📊 عدد الصفوف الحالية في تسعير العملاء: ${rows.length}`);
      
      if (rows.length > 1) {
        // حذف جميع البيانات عدا صف العناوين
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.spreadsheetId,
          range: 'تسعير_العملاء!A2:P'
        });
        
        console.log(`✅ تم حذف ${rows.length - 1} بند من صفحة تسعير العملاء`);
        return { success: true, deletedCount: rows.length - 1 };
      } else {
        console.log('📭 صفحة تسعير العملاء فارغة بالفعل');
        return { success: true, deletedCount: 0 };
      }
    } catch (error) {
      console.error('❌ خطأ في حذف بيانات تسعير العملاء:', error);
      throw error;
    }
  }
}