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
      console.log(`🔄 تحديث سعر العميل للبند ${itemId} مع RFQ ${rfqNumber || 'بدون RFQ'} في ورقة DATA`);

      // قراءة البيانات الحالية من ورقة DATA
      const response = await this.googleSheets.sheets.spreadsheets.values.get({
        spreadsheetId: this.googleSheets.spreadsheetId,
        range: `${sheetName}!A:S`
      });

      const rows = response.data.values || [];
      console.log(`📊 عدد الصفوف المقروءة من DATA: ${rows.length}`);
      
      // البحث عن الصف المطابق بناءً على معرف البند
      let targetRowIndex = -1;
      let foundRows = [];
      let lastCheckedRow = 0;
      
      for (let i = 1; i < rows.length; i++) { // البداية من الصف 2 (تخطي الرؤوس)
        const itemNumber = (rows[i][0] || '').toString().trim(); // العمود A - معرف البند
        const rfqCol = (rows[i][5] || '').toString().trim(); // العمود F - RFQ
        lastCheckedRow = i + 1;
        
        // طباعة تفاصيل البحث للصفوف القريبة من 5577
        if (i >= 5575 && i <= 5580) {
          console.log(`🔍 الصف ${i + 1}: البند="${itemNumber}", RFQ="${rfqCol}" (يُبحث عن: البند="${itemId}", RFQ="${rfqNumber}")`);
        }
        
        if (itemNumber === itemId.trim()) {
          foundRows.push({
            index: i + 1,
            rfq: rfqCol || '',
            hasCustomerPrice: !!(rows[i][8]) // العمود I - سعر العميل
          });
          console.log(`📍 وجد البند ${itemId} في الصف ${i + 1} مع RFQ="${rfqCol}"`);
          
          // إذا كان لدينا RFQ محدد، نبحث عن تطابق كامل
          if (rfqNumber && rfqCol === rfqNumber.trim()) {
            targetRowIndex = i + 1;
            console.log(`✅ وجد تطابق كامل في الصف ${targetRowIndex} للبند ${itemId} مع RFQ ${rfqNumber}`);
            break;
          }
        }
      }
      
      console.log(`🔄 تم فحص ${lastCheckedRow} صف، وجد ${foundRows.length} صف للبند ${itemId}`);
      if (foundRows.length > 0) {
        console.log(`📋 الصفوف الموجودة:`, foundRows);
      }
      
      // إذا لم نجد تطابق كامل، نستخدم أول صف للبند بدون سعر عميل
      if (targetRowIndex === -1 && foundRows.length > 0) {
        // نبحث عن أول صف بدون سعر عميل
        const emptyPriceRow = foundRows.find(r => !r.hasCustomerPrice);
        if (emptyPriceRow) {
          targetRowIndex = emptyPriceRow.index;
          console.log(`⚠️ لم يوجد تطابق RFQ، استخدام الصف ${targetRowIndex} بدون سعر عميل`);
        } else {
          // إذا كل الصفوف لديها أسعار، نستخدم أول صف
          targetRowIndex = foundRows[0].index;
          console.log(`⚠️ كل الصفوف لديها أسعار، استخدام الصف الأول ${targetRowIndex}`);
        }
      }

      // إذا لم نجد البند، نضيفه كصف جديد
      if (targetRowIndex === -1) {
        console.log(`⚠️ البند ${itemId} غير موجود في ورقة DATA، سيتم إضافته`);
        
        // البحث عن بيانات البند من صفحة تسعير العملاء
        const customerResponse = await this.googleSheets.sheets.spreadsheets.values.get({
          spreadsheetId: this.googleSheets.spreadsheetId,
          range: 'تسعير_العملاء!A:Q'
        });
        
        const customerRows = customerResponse.data.values || [];
        let itemData = null;
        
        for (let i = 1; i < customerRows.length; i++) {
          if (customerRows[i][0] === itemId) {
            // الأعمدة في صفحة تسعير_العملاء:
            // A=ItemNumber, B=PartNumber, C=Description, D=UOM, E=Quantity
            // F=RFQNumber, G=ClientName, H=RequestDate, I=ExpiryDate
            itemData = {
              itemNumber: customerRows[i][0] || itemId,
              partNumber: customerRows[i][1] || '',
              description: customerRows[i][2] || '',
              uom: customerRows[i][3] || 'EACH',
              quantity: customerRows[i][4] || '1',
              rfqNumber: rfqNumber || customerRows[i][5] || '',
              clientName: customerRows[i][6] || '',
              requestDate: customerRows[i][7] || ''
            };
            console.log(`✅ تم العثور على بيانات البند من صفحة تسعير العملاء:`, itemData);
            break;
          }
        }
        
        if (!itemData) {
          throw new Error(`لم يتم العثور على بيانات البند ${itemId} في صفحة تسعير العملاء`);
        }
        
        // إضافة صف جديد في DATA
        const newRow = [
          itemData.itemNumber,  // A - معرف البند
          itemData.uom,         // B - الوحدة
          '',                   // C - LINE ITEM (فارغ للبنود الجديدة)
          itemData.partNumber,  // D - رقم القطعة
          itemData.description, // E - الوصف
          itemData.rfqNumber,   // F - RFQ
          itemData.requestDate, // G - تاريخ الطلب
          itemData.quantity,    // H - الكمية
          pricingData.customerUnitPrice || '', // I - سعر العميل
          '',                   // J - RES. DATE
          '',                   // K - PO
          '',                   // L - DATE/PO
          '',                   // M - Quantity/PO
          '',                   // N - PRICE/PO
          '',                   // O - TOTAL PO
          itemData.clientName,  // P - العميل
          '',                   // Q - الموظف المسؤول
          '',                   // R - فارغ
          pricingData.employeeName // S - اسم الموظف (من قام بالتسعير)
        ];
        
        // إضافة الصف الجديد
        await this.googleSheets.sheets.spreadsheets.values.append({
          spreadsheetId: this.googleSheets.spreadsheetId,
          range: `${sheetName}!A:S`,
          valueInputOption: 'RAW',
          resource: {
            values: [newRow]
          }
        });
        
        console.log(`✅ تم إضافة البند ${itemId} إلى ورقة DATA مع سعر العميل ${pricingData.customerUnitPrice}`);
        return;
      }

      // تحديث العمود I (سعر العميل) والعمود S (اسم الموظف) للصف الموجود
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