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
      
      // قراءة ورقة DATA
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:I'
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من DATA`);

      // البحث عن البند مع رقم الطلب
      let targetRow = -1;
      for (let i = 1; i < rows.length; i++) {
        const itemCol = (rows[i][0] || '').toString().trim();
        const rfqCol = (rows[i][5] || '').toString().trim(); // العمود F للطلب
        
        // البحث عن تطابق كامل: البند + رقم الطلب
        if (itemCol.toUpperCase() === itemNumber.toUpperCase()) {
          if (rfqNumber && rfqCol === rfqNumber) {
            targetRow = i + 1;
            console.log(`✅ وجدت تطابق كامل: البند ${itemNumber} مع الطلب ${rfqNumber} في الصف ${targetRow}`);
            break;
          } else if (!rfqNumber && targetRow === -1) {
            // إذا لم يكن لدينا رقم طلب، نستخدم أول تطابق
            targetRow = i + 1;
            console.log(`📌 وجدت البند ${itemNumber} في الصف ${targetRow} (بدون رقم طلب)`);
          }
        }
      }

      if (targetRow === -1) {
        throw new Error(`لم يتم العثور على البند ${itemNumber}`);
      }

      // حفظ السعر في العمود I
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `DATA!I${targetRow}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[price]]
        }
      });

      console.log(`✅ تم حفظ السعر ${price} في الخلية I${targetRow}`);
      return { success: true, row: targetRow };
    } catch (error) {
      console.error('❌ خطأ في الحفظ المباشر:', error);
      throw error;
    }
  }
}