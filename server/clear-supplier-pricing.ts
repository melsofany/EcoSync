import { google } from 'googleapis';
import { createGoogleAuth } from './google-auth-helper';

export class ClearSupplierPricing {
  private sheets: any;
  private spreadsheetId: string = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  
  async initialize() {
    try {
      // استخدام نفس طريقة المصادقة المستخدمة في النظام
      const auth = createGoogleAuth();
      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ تم تهيئة Google Sheets لحذف البيانات');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error);
      throw error;
    }
  }
  
  async clearAllData() {
    try {
      console.log('🗑️ بدء حذف بيانات تسعير الموردين...');
      
      // قراءة البيانات الحالية
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'تسعير_الموردين!A:AA'
      });
      
      const rows = response.data.values || [];
      console.log(`📊 عدد الصفوف الحالية: ${rows.length}`);
      
      if (rows.length > 1) {
        // حذف جميع البيانات عدا صف العناوين
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.spreadsheetId,
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