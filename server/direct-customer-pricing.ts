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

  async saveCustomerPrice(itemNumber: string, price: string, rfqNumber: string = '', employeeName: string = '') {
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
      let rowData: any = null;
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
            rfq: rfqCol,
            data: rows[i]
          });
          
          // إذا وجدنا تطابق كامل مع رقم الطلب
          if (rfqNumber && rfqCol === rfqNumber) {
            targetRow = i + 1;
            rowData = rows[i];
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
          rowData = matchedRows[0].data;
          console.log(`📌 استخدام الصف ${targetRow} (أول تطابق للبند)`);
        } else {
          targetRow = matchedRows[0].row;
          rowData = matchedRows[0].data;
          console.log(`📌 استخدام الصف ${targetRow} (بدون تحديد RFQ)`);
        }
      }

      if (targetRow === -1 || !rowData) {
        console.error(`❌ لم يتم العثور على البند ${itemNumber} في ورقة DATA`);
        throw new Error(`لم يتم العثور على البند ${itemNumber} في ورقة DATA`);
      }

      // حفظ السعر في العمود I من DATA
      console.log(`💾 حفظ السعر ${price} في الخلية DATA!I${targetRow}`);
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `DATA!I${targetRow}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[price]]
        }
      });

      // الآن نحتاج لحفظ البيانات الكاملة في صفحة تسعير_العملاء
      console.log(`📝 حفظ البيانات الكاملة في صفحة تسعير_العملاء`);
      
      // التحقق من وجود البند في صفحة تسعير_العملاء
      const customerPricingResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'تسعير_العملاء!A:Q'
      });
      
      const customerRows = customerPricingResponse.data.values || [];
      let customerTargetRow = -1;
      
      // البحث عن البند في صفحة تسعير_العملاء
      for (let i = 1; i < customerRows.length; i++) {
        if (!customerRows[i] || customerRows[i].length === 0) continue;
        
        const custItemNumber = (customerRows[i][0] || '').toString().trim();
        const custRfqNumber = customerRows[i].length > 5 ? (customerRows[i][5] || '').toString().trim() : '';
        
        if (custItemNumber === itemNumber && custRfqNumber === rfqNumber) {
          customerTargetRow = i + 1;
          console.log(`✅ تم العثور على البند في صفحة تسعير_العملاء في الصف ${customerTargetRow}`);
          break;
        }
      }

      // إعداد بيانات تسعير العملاء الكاملة
      const customerPricingData = [
        itemNumber,                    // A - Item Number
        rowData[3] || '',              // B - Part Number
        rowData[4] || '',              // C - Description  
        rowData[1] || '',              // D - UOM
        rowData[7] || '',              // E - Quantity
        rfqNumber || rowData[5] || '', // F - RFQ Number
        rowData[16] || '',             // G - Client Name
        rowData[6] || '',              // H - Request Date
        '',                            // I - Expiry Date (if available)
        price,                         // J - Customer Unit Price
        '',                            // K - Customer Total Price (calculated)
        '',                            // L - Supplier Unit Price
        '',                            // M - Profit Margin %
        'جنيه',                        // N - Currency
        '',                            // O - Notes
        'تم التسعير',                  // P - Status
        employeeName || ''             // Q - مدخل التسعير
      ];

      // حساب السعر الإجمالي
      if (customerPricingData[4] && price) {
        const quantity = parseFloat(customerPricingData[4]);
        const unitPrice = parseFloat(price);
        if (!isNaN(quantity) && !isNaN(unitPrice)) {
          customerPricingData[10] = (quantity * unitPrice).toString();
        }
      }

      if (customerTargetRow === -1) {
        // إضافة صف جديد في صفحة تسعير_العملاء
        console.log(`➕ إضافة بند جديد في صفحة تسعير_العملاء`);
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'تسعير_العملاء!A:Q',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: [customerPricingData]
          }
        });
        console.log(`✅ تم إضافة البند في صفحة تسعير_العملاء`);
      } else {
        // تحديث الصف الموجود
        console.log(`🔄 تحديث البند في صفحة تسعير_العملاء في الصف ${customerTargetRow}`);
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `تسعير_العملاء!A${customerTargetRow}:Q${customerTargetRow}`,
          valueInputOption: 'RAW',
          resource: {
            values: [customerPricingData]
          }
        });
        console.log(`✅ تم تحديث البند في صفحة تسعير_العملاء`);
      }

      console.log(`✅ تم حفظ سعر العميل ${price} بنجاح في كل من DATA وتسعير_العملاء`);
      return { success: true, row: targetRow };
    } catch (error) {
      console.error('❌ خطأ في حفظ سعر العميل:', error);
      throw error;
    }
  }
}