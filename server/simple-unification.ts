import { google } from 'googleapis';
import { authenticateGoogle } from './google-auth.js';

export class SimpleUnificationService {
  private sheets: any;
  private spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  
  constructor() {
    console.log('🚀 تهيئة خدمة التوحيد البسيط...');
  }

  async initialize() {
    const auth = await authenticateGoogle();
    this.sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ تم تهيئة خدمة التوحيد');
  }

  async startUnification() {
    console.log('🔄 بدء عملية التوحيد البسيط...');
    
    try {
      // قراءة البيانات
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:E',
      });

      const rows = response.data.values || [];
      console.log(`📊 تم العثور على ${rows.length} صف`);

      if (rows.length === 0) {
        return {
          success: true,
          message: 'لا توجد بيانات للتوحيد',
          totalRows: 0,
          unifiedCount: 0
        };
      }

      // معالجة البيانات بند بند
      const updates = [];
      const groups = new Map();
      let groupCounter = 1;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const itemNumber = row[0] || '';
        const partNumber = row[1] || '';
        const description = row[4] || '';
        
        // مفتاح التجميع البسيط
        const key = `${partNumber.toLowerCase().trim()}_${description.substring(0, 50).toLowerCase().trim()}`;
        
        if (!groups.has(key)) {
          groups.set(key, `P-${String(groupCounter).padStart(7, '0')}`);
          groupCounter++;
        }
        
        const unifiedId = groups.get(key);
        updates.push([unifiedId]);
        
        // عرض التقدم كل 100 صف
        if ((i + 1) % 100 === 0) {
          console.log(`⏳ تم معالجة ${i + 1}/${rows.length} صف...`);
        }
      }

      // تحديث Google Sheets
      console.log('💾 تحديث Google Sheets...');
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!D2',
        valueInputOption: 'RAW',
        requestBody: {
          values: updates
        },
      });

      console.log('✅ اكتمل التوحيد بنجاح!');
      
      return {
        success: true,
        message: 'تم التوحيد بنجاح',
        totalRows: rows.length,
        unifiedGroups: groups.size,
        unifiedCount: rows.length
      };

    } catch (error) {
      console.error('❌ خطأ في التوحيد:', error);
      return {
        success: false,
        message: `خطأ: ${error.message}`,
        error: error.message
      };
    }
  }
}

// إنشاء instance واحد
export const simpleUnificationService = new SimpleUnificationService();