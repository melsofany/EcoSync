import { google } from 'googleapis';
import * as fs from 'fs';

export class DirectCustomerPricing {
  private sheets: any;
  private spreadsheetId: string = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

  async initialize() {
    const keyFile = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
    const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const authClient = await auth.getClient();
    this.sheets = google.sheets({ version: 'v4', auth: authClient as any });
  }

  async saveCustomerPrice(itemNumber: string, price: string, rfqNumber: string = '') {
    try {
      console.log(`📝 حفظ مباشر لسعر العميل: ${itemNumber} = ${price} للطلب ${rfqNumber}`);
      
      // قراءة ورقة DATA مع كل الأعمدة
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:AA'
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من DATA`);

      // البحث عن البند مع رقم الطلب
      let targetRow = -1;
      let matchedRows = [];
      console.log(`🔍 البحث عن: البند="${itemNumber}" مع RFQ="${rfqNumber}"`);
      
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i] || rows[i].length === 0) continue;
        
        const itemCol = (rows[i][0] || '').toString().trim();
        const rfqCol = rows[i].length > 5 ? (rows[i][5] || '').toString().trim() : '';
        
        // البحث عن البند المطابق
        if (itemCol === itemNumber || itemCol.toUpperCase() === itemNumber.toUpperCase()) {
          matchedRows.push({
            row: i + 1,
            itemNumber: itemCol,
            rfq: rfqCol
          });
          
          // إذا وجدنا تطابق كامل مع رقم الطلب
          if (rfqNumber && rfqCol === rfqNumber) {
            targetRow = i + 1;
            console.log(`✅ تطابق كامل: البند ${itemNumber} + RFQ ${rfqNumber} في الصف ${targetRow}`);
            break;
          }
        }
      }
      
      // إذا لم نجد تطابق كامل، نستخدم أول صف يحتوي على البند
      if (targetRow === -1 && matchedRows.length > 0) {
        if (rfqNumber) {
          console.log(`⚠️ لم يتم العثور على RFQ ${rfqNumber} للبند ${itemNumber}`);
          console.log(`📋 الصفوف المطابقة للبند:`, matchedRows);
          // البحث عن أقرب تطابق
          targetRow = matchedRows[0].row;
          console.log(`📌 استخدام الصف ${targetRow} (أول تطابق للبند)`);
        } else {
          targetRow = matchedRows[0].row;
          console.log(`📌 استخدام الصف ${targetRow} (بدون تحديد RFQ)`);
        }
      }

      if (targetRow === -1) {
        console.error(`❌ لم يتم العثور على البند ${itemNumber} في ورقة DATA`);
        throw new Error(`لم يتم العثور على البند ${itemNumber} في ورقة DATA`);
      }

      // حفظ السعر في العمود I
      console.log(`💾 حفظ السعر ${price} في الخلية DATA!I${targetRow}`);
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `DATA!I${targetRow}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[price]]
        }
      });

      console.log(`✅ تم حفظ سعر العميل ${price} في DATA!I${targetRow} بنجاح`);
      return { success: true, row: targetRow };
    } catch (error) {
      console.error('❌ خطأ في حفظ سعر العميل:', error);
      throw error;
    }
  }
}