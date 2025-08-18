import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

export class CustomerPricingUpdater {
  private googleSheets: GoogleSheetsRealtimeData;

  constructor() {
    this.googleSheets = new GoogleSheetsRealtimeData();
  }

  /**
   * تحديث سعر العميل في العمود I في ورقة DATA
   */
  async updateCustomerPricingInDataSheet(itemId: string, rfqNumber: string, pricingData: {
    customerUnitPrice?: string;
    employeeName: string;
  }): Promise<void> {
    try {
      const sheetName = 'DATA';
      console.log(`🔄 تحديث سعر العميل للبند ${itemId} مع RFQ ${rfqNumber} في ورقة DATA`);

      // قراءة البيانات الحالية من ورقة DATA
      const response = await this.googleSheets.sheets.spreadsheets.values.get({
        spreadsheetId: this.googleSheets.spreadsheetId,
        range: `${sheetName}!A:Q`
      });

      const rows = response.data.values || [];
      
      // البحث عن الصف المطابق بناءً على معرف البند ورقم RFQ
      let targetRowIndex = -1;
      for (let i = 1; i < rows.length; i++) { // البداية من الصف 2 (تخطي الرؤوس)
        const itemNumber = rows[i][0]; // العمود A - معرف البند
        const rfqCol = rows[i][5]; // العمود F - RFQ
        
        if (itemNumber === itemId && rfqCol === rfqNumber) {
          targetRowIndex = i + 1; // +1 للحصول على رقم الصف الفعلي
          console.log(`✅ وجد الصف ${targetRowIndex} للبند ${itemId} مع RFQ ${rfqNumber}`);
          break;
        }
      }

      if (targetRowIndex === -1) {
        console.error(`❌ لم يتم العثور على البند ${itemId} مع RFQ ${rfqNumber} في ورقة DATA`);
        throw new Error(`Item ${itemId} with RFQ ${rfqNumber} not found in DATA sheet`);
      }

      // تحديث العمود I (سعر العميل) والعمود S (اسم الموظف)
      const updateRequests = [];
      
      // تحديث العمود I - سعر العميل
      if (pricingData.customerUnitPrice) {
        updateRequests.push({
          range: `${sheetName}!I${targetRowIndex}`,
          values: [[pricingData.customerUnitPrice]]
        });
      }
      
      // تحديث العمود S - اسم الموظف
      if (pricingData.employeeName) {
        updateRequests.push({
          range: `${sheetName}!S${targetRowIndex}`,
          values: [[pricingData.employeeName]]
        });
      }

      // تنفيذ التحديثات
      if (updateRequests.length > 0) {
        await this.googleSheets.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.googleSheets.spreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: updateRequests
          }
        });
        
        console.log(`✅ تم تحديث سعر العميل (${pricingData.customerUnitPrice}) في العمود I، الصف ${targetRowIndex}`);
        console.log(`✅ تم تحديث اسم الموظف (${pricingData.employeeName}) في العمود S، الصف ${targetRowIndex}`);
      }

    } catch (error) {
      console.error(`❌ خطأ في تحديث سعر العميل في ورقة DATA:`, error);
      throw error;
    }
  }

  /**
   * تحديث تسعير العميل مع إضافة اسم الموظف (الوظيفة القديمة للتوافق)
   */
  async updateCustomerPricing(itemId: string, pricingData: {
    customerUnitPrice?: string;
    customerTotalPrice?: string;
    supplierUnitPrice?: string;
    profitMargin?: string;
    currency?: string;
    notes?: string;
    status?: string;
    employeeName: string;
  }): Promise<void> {
    try {
      const sheetName = 'تسعير_العملاء';
      console.log(`🔄 تحديث تسعير العميل للبند ${itemId}`);

      // قراءة البيانات الحالية
      const response = await this.googleSheets.sheets.spreadsheets.values.get({
        spreadsheetId: this.googleSheets.spreadsheetId,
        range: `${sheetName}!A:Q`
      });

      const rows = response.data.values || [];
      
      // البحث عن البند
      let targetRowIndex = -1;
      for (let i = 1; i < rows.length; i++) { // البداية من الصف 2 (تخطي الرؤوس)
        if (rows[i][0] === itemId) {
          targetRowIndex = i + 1; // +1 للحصول على رقم الصف الفعلي
          break;
        }
      }

      if (targetRowIndex === -1) {
        console.error(`❌ لم يتم العثور على البند ${itemId} في ورقة تسعير العملاء`);
        throw new Error(`Item ${itemId} not found in customer pricing sheet`);
      }

      // تحديث الصف بالبيانات الجديدة
      const existingRow = rows[targetRowIndex - 1];
      const updatedRow = [
        existingRow[0] || '',                                    // A - Item Number
        existingRow[1] || '',                                    // B - Part Number
        existingRow[2] || '',                                    // C - Description
        existingRow[3] || 'EACH',                               // D - UOM
        existingRow[4] || '1',                                  // E - Quantity
        existingRow[5] || '',                                   // F - RFQ Number
        existingRow[6] || '',                                   // G - Client Name
        existingRow[7] || '',                                   // H - Request Date
        existingRow[8] || '',                                   // I - Expiry Date
        pricingData.customerUnitPrice || existingRow[9] || '',   // J - Customer Unit Price
        pricingData.customerTotalPrice || existingRow[10] || '', // K - Customer Total Price
        pricingData.supplierUnitPrice || existingRow[11] || '',  // L - Supplier Unit Price
        pricingData.profitMargin || existingRow[12] || '',       // M - Profit Margin %
        pricingData.currency || existingRow[13] || 'EGP',        // N - Currency
        pricingData.notes || existingRow[14] || '',              // O - Notes
        pricingData.status || existingRow[15] || 'مُسعّر',       // P - Status
        pricingData.employeeName || existingRow[16] || ''        // Q - Employee Name
      ];

      // تحديث الصف في Google Sheets
      const range = `${sheetName}!A${targetRowIndex}:Q${targetRowIndex}`;
      await this.googleSheets.sheets.spreadsheets.values.update({
        spreadsheetId: this.googleSheets.spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: {
          values: [updatedRow]
        }
      });

      console.log(`✅ تم تحديث تسعير العميل للبند ${itemId} مع اسم الموظف: ${pricingData.employeeName}`);

    } catch (error) {
      console.error(`❌ خطأ في تحديث تسعير العميل:`, error);
      throw error;
    }
  }
}