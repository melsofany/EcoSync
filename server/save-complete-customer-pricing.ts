import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

export class SaveCompleteCustomerPricing {
  private googleSheets: GoogleSheetsRealtimeData;
  
  constructor() {
    this.googleSheets = new GoogleSheetsRealtimeData();
  }
  
  async initialize() {
    await this.googleSheets.initialize();
  }
  
  async saveCompleteData(data: {
    itemNumber: string;
    partNumber?: string;
    description?: string;
    uom?: string;
    quantity?: string;
    rfqNumber?: string;
    clientName?: string;
    requestDate?: string;
    expiryDate?: string;
    customerUnitPrice?: string;
    customerTotalPrice?: string;
    supplierUnitPrice?: string;
    profitMargin?: string;
    currency?: string;
    notes?: string;
    status?: string;
    employeeName?: string;
  }) {
    try {
      console.log('📝 حفظ بيانات تسعير العميل الكاملة:', data);
      
      // قراءة البيانات الحالية
      const response = await this.googleSheets.sheets.spreadsheets.values.get({
        spreadsheetId: this.googleSheets.spreadsheetId,
        range: 'تسعير_العملاء!A:Q'
      });
      
      const rows = response.data.values || [];
      console.log(`📊 عدد الصفوف الحالية: ${rows.length}`);
      
      // البحث عن البند الموجود
      let targetRow = -1;
      for (let i = 1; i < rows.length; i++) {
        const itemId = (rows[i][0] || '').toString().trim();
        const rfq = (rows[i][5] || '').toString().trim();
        
        if (itemId === data.itemNumber) {
          // إذا كان لدينا رقم طلب، نبحث عن التطابق الكامل
          if (data.rfqNumber && rfq === data.rfqNumber) {
            targetRow = i + 1;
            console.log(`✅ وجدت تطابق كامل: البند ${data.itemNumber} مع RFQ ${data.rfqNumber} في الصف ${targetRow}`);
            break;
          } else if (!data.rfqNumber) {
            // إذا لم يكن لدينا رقم طلب، نأخذ أول تطابق
            targetRow = i + 1;
            console.log(`📌 وجدت البند ${data.itemNumber} في الصف ${targetRow}`);
            break;
          }
        }
      }
      
      // إذا لم نجد البند، نضيفه كصف جديد
      if (targetRow === -1) {
        console.log(`➕ إضافة صف جديد للبند ${data.itemNumber}`);
        
        const newRow = [
          data.itemNumber || '',           // A - Item Number
          data.partNumber || '',           // B - Part Number
          data.description || '',          // C - Description
          data.uom || 'EACH',             // D - UOM
          data.quantity || '1',            // E - Quantity
          data.rfqNumber || '',            // F - RFQ Number
          data.clientName || '',           // G - Client Name
          data.requestDate || '',          // H - Request Date
          data.expiryDate || '',           // I - Expiry Date
          data.customerUnitPrice || '',    // J - Customer Unit Price
          data.customerTotalPrice || '',   // K - Customer Total Price
          data.supplierUnitPrice || '',    // L - Supplier Unit Price
          data.profitMargin || '',         // M - Profit Margin %
          data.currency || 'EGP',          // N - Currency
          data.notes || '',                // O - Notes
          data.status || 'مُسعّر',         // P - Status
          data.employeeName || ''          // Q - Employee Name
        ];
        
        await this.googleSheets.sheets.spreadsheets.values.append({
          spreadsheetId: this.googleSheets.spreadsheetId,
          range: 'تسعير_العملاء!A:Q',
          valueInputOption: 'RAW',
          resource: {
            values: [newRow]
          }
        });
        
        console.log(`✅ تم إضافة البند ${data.itemNumber} إلى صفحة تسعير العملاء`);
      } else {
        // تحديث الصف الموجود
        console.log(`🔄 تحديث الصف ${targetRow} للبند ${data.itemNumber}`);
        
        const existingRow = rows[targetRow - 1];
        const updatedRow = [
          data.itemNumber || existingRow[0] || '',           // A - Item Number
          data.partNumber || existingRow[1] || '',           // B - Part Number
          data.description || existingRow[2] || '',          // C - Description
          data.uom || existingRow[3] || 'EACH',             // D - UOM
          data.quantity || existingRow[4] || '1',            // E - Quantity
          data.rfqNumber || existingRow[5] || '',            // F - RFQ Number
          data.clientName || existingRow[6] || '',           // G - Client Name
          data.requestDate || existingRow[7] || '',          // H - Request Date
          data.expiryDate || existingRow[8] || '',           // I - Expiry Date
          data.customerUnitPrice || existingRow[9] || '',    // J - Customer Unit Price
          data.customerTotalPrice || existingRow[10] || '',  // K - Customer Total Price
          data.supplierUnitPrice || existingRow[11] || '',   // L - Supplier Unit Price
          data.profitMargin || existingRow[12] || '',        // M - Profit Margin %
          data.currency || existingRow[13] || 'EGP',         // N - Currency
          data.notes || existingRow[14] || '',               // O - Notes
          data.status || existingRow[15] || 'مُسعّر',        // P - Status
          data.employeeName || existingRow[16] || ''         // Q - Employee Name
        ];
        
        await this.googleSheets.sheets.spreadsheets.values.update({
          spreadsheetId: this.googleSheets.spreadsheetId,
          range: `تسعير_العملاء!A${targetRow}:Q${targetRow}`,
          valueInputOption: 'RAW',
          resource: {
            values: [updatedRow]
          }
        });
        
        console.log(`✅ تم تحديث البند ${data.itemNumber} في صفحة تسعير العملاء`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في حفظ بيانات تسعير العميل:', error);
      throw error;
    }
  }
}