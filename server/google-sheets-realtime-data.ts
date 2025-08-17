import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleSheetsRealtimeData {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // استخدام المفتاح الجديد من الملف المحلي
      
      let credentials;
      try {
        const credentialsPath = path.resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
        const fileContent = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(fileContent);
        
        // التحقق من طول المفتاح الخاص
        if (credentials.private_key.length < 1000) {
          throw new Error(`المفتاح الخاص مقطوع أو غير مكتمل - الطول الحالي: ${credentials.private_key.length} حرف`);
        }
        
        console.log('✅ تم تحميل المفتاح الجديد من الملف المحلي');
        console.log(`📧 البريد الإلكتروني: ${credentials.client_email}`);
        console.log(`🔐 طول المفتاح الخاص: ${credentials.private_key.length} حرف`);
      } catch (fileError) {
        console.error('❌ خطأ في قراءة الملف المحلي:', fileError.message);
        throw fileError;
      }

      this.auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ تم تهيئة Google Sheets للبيانات الحقيقية');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', (error as Error).message);
    }
  }

  async readDataSheet(): Promise<any[]> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      // قراءة البيانات من صفحة DATA بدءاً من الصف 2
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:Z10000', // قراءة من A2 إلى Z مع حد أقصى 10000 صف (يشمل العمود Q)
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من Google Sheets`);

      return rows;
    } catch (error) {
      console.error('❌ خطأ في قراءة البيانات من Google Sheets:', (error as Error).message);
      return [];
    }
  }

  async updateCellValue(cellAddress: string, value: string): Promise<void> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `DATA!${cellAddress}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[value]]
        }
      });

      console.log(`✅ تم تحديث الخلية ${cellAddress} بالقيمة: ${value}`);
    } catch (error) {
      console.error(`❌ خطأ في تحديث الخلية ${cellAddress}:`, error);
      throw error;
    }
  }

  async findItemByPartNumber(partNumber: string): Promise<{row: number, data: any} | null> {
    try {
      const rawData = await this.readDataSheet();
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row[2] && row[2].toString().includes(partNumber)) { // العمود C - part number
          return {
            row: i + 2, // +2 لأن البيانات تبدأ من الصف 2
            data: {
              id: row[0] || '',
              lineItem: row[1] || '',
              partNumber: row[2] || '',
              description: row[3] || '',
              uom: row[4] || '',
              poNumber: row[10] || '', // العمود K - رقم أمر الشراء
            }
          };
        }
      }
      return null;
    } catch (error) {
      console.error('خطأ في البحث عن البند:', error);
      return null;
    }
  }

  async updatePONumber(itemId: string, poNumber: string): Promise<boolean> {
    try {
      const rawData = await this.readDataSheet();
      console.log(`🔍 البحث عن البند ${itemId} لتحديث PO إلى ${poNumber}`);
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        console.log(`فحص الصف ${i + 2}: ${row[0]} مقابل ${itemId}`);
        
        if (row[0] === itemId) { // العمود A - معرف البند
          const rowNumber = i + 2; // +2 لأن البيانات تبدأ من الصف 2
          console.log(`🎯 تم العثور على البند ${itemId} في الصف ${rowNumber}`);
          
          // تحديث العمود K (رقم أمر الشراء) والعمود L (تاريخ أمر الشراء)
          await this.updateCellValue(`K${rowNumber}`, poNumber); // العمود K
          await this.updateCellValue(`L${rowNumber}`, new Date().toLocaleDateString('ar-EG')); // العمود L
          
          console.log(`✅ تم تحديث البند ${itemId} في الصف ${rowNumber} - PO: ${poNumber}`);
          
          // التأكد من التحديث بقراءة البيانات مرة أخرى
          const verificationData = await this.readDataSheet();
          const updatedRow = verificationData[i];
          console.log(`🔍 تأكد من التحديث: العمود K = "${updatedRow[10]}" العمود L = "${updatedRow[11]}"`);
          
          return true;
        }
      }
      
      console.log(`❌ لم يتم العثور على البند ${itemId}`);
      return false;
    } catch (error) {
      console.error('خطأ في تحديث رقم أمر الشراء:', error);
      return false;
    }
  }

  async deleteRow(rowNumber: number): Promise<void> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // معرف صفحة DATA
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // Google Sheets يستخدم فهرسة من 0
                endIndex: rowNumber
              }
            }
          }]
        }
      });

      console.log(`✅ تم حذف الصف ${rowNumber}`);
    } catch (error) {
      console.error(`❌ خطأ في حذف الصف ${rowNumber}:`, error);
      throw error;
    }
  }

  async calculateTotalValue(): Promise<number> {
    try {
      const rows = await this.readDataSheet();
      let totalValue = 0;

      // حساب إجمالي RFQ: كمية العمود M (12) × سعر العمود N (13)
      for (let i = 1; i < rows.length; i++) { // تخطي صف العناوين
        const row = rows[i];
        if (row.length > 13) {
          // كمية PO من العمود M (رقم 12)
          const quantity = parseFloat(row[12]?.toString().replace(/[^\d.-]/g, '') || '0');
          // سعر PO من العمود N (رقم 13)  
          const price = parseFloat(row[13]?.toString().replace(/[^\d.-]/g, '') || '0');
          
          if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            const itemTotal = quantity * price;
            totalValue += itemTotal;
          }
        }
      }

      console.log(`💰 إجمالي القيمة المحسوبة (الكمية × السعر): ${totalValue.toLocaleString()} ج.م`);
      return totalValue;
    } catch (error) {
      console.error('❌ خطأ في حساب إجمالي القيمة:', (error as Error).message);
      return 0;
    }
  }

  async getAllItems() {
    try {
      const rows = await this.readDataSheet();
      const items = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // تخطي الصفوف الفارغة

        const item = {
          id: `item-sheets-${i + 1}`,
          itemNumber: row[0] || '', // العمود A - P-0000001
          uom: row[1] || '', // العمود B - UOM
          lineItem: row[2] || '', // العمود C - LINE ITEM
          partNumber: row[3] || '', // العمود D - PART NO
          description: row[4] || '', // العمود E - DESCRIPTION
          rfqNumber: row[5] || '', // العمود F - RFQ NUMBER  
          requestDate: row[6] || '', // العمود G - REQUEST DATE
          quantity: row[7] || '', // العمود H - QUANTITY
          price: row[8] || '', // العمود I - PRICE
          responseDate: row[9] || '', // العمود J - تاريخ الانتهاء/الاستجابة
          poNumber: row[10] || '', // العمود K - PO NUMBER
          poDate: row[11] || '', // العمود L - PO DATE
          poQuantity: row[12] || '', // العمود M - PO QUANTITY
          poPrice: row[13] || '', // العمود N - PO PRICE
          totalValue: row[14] || '', // العمود O - القيمة الإجمالية
          clientName: row[15] || '', // العمود P (فهرس 15) - اسم العميل
          responsibleEmployee: row[16] || '', // العمود Q (فهرس 16) - الموظف المسؤول
          isActive: true,
          createdAt: new Date().toISOString()
        };

        // طباعة عينة من البيانات للتشخيص (أول 10 صفوف فقط)
        if (i < 10) {
          console.log(`📋 عينة البيانات - الصف ${i + 1}:`, {
            itemNumber: row[0] || 'فارغ',
            uom: row[1] || 'فارغ',
            lineItem: row[2] || 'فارغ', 
            partNumber: row[3] || 'فارغ',
            description: (row[4] || 'فارغ').substring(0, 50) + '...',
            rfqNumber: row[5] || 'فارغ',
            clientName: row[15] || 'فارغ',
            responsibleEmployee: row[16] || 'فارغ',
            totalColumns: row.length
          });
        }

        items.push(item);
      }

      console.log(`📦 تم استخراج ${items.length} صنف من Google Sheets`);
      return items;
    } catch (error) {
      console.error('❌ خطأ في استخراج الأصناف:', (error as Error).message);
      return [];
    }
  }

  async getAllQuotations() {
    try {
      const items = await this.getAllItems();
      const quotationsMap = new Map();

      // تجميع الأصناف حسب RFQ NUMBER
      for (const item of items) {
        if (!item.rfqNumber) continue;

        if (!quotationsMap.has(item.rfqNumber)) {
          quotationsMap.set(item.rfqNumber, {
            id: `rfq-sheets-${item.rfqNumber}`,
            requestNumber: item.rfqNumber, // رقم الطلب من العمود F
            customRequestNumber: item.rfqNumber, // رقم الطلب من العمود F
            clientName: item.clientName && item.clientName.trim() && item.clientName.trim() !== '""' ? item.clientName.trim() : 'غير محدد', // اسم العميل من العمود P
            requestDate: item.requestDate, // التاريخ من العمود G
            expiryDate: item.responseDate || null, // تاريخ الانتهاء من العمود J
            responsibleEmployee: item.responsibleEmployee && item.responsibleEmployee.trim() ? item.responsibleEmployee.trim() : 'غير محدد', // الموظف المسؤول من العمود Q
            status: 'completed',
            notes: `طلب مستورد من Google Sheets`,
            totalItems: 0,
            totalValue: 0,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        const quotation = quotationsMap.get(item.rfqNumber);
        quotation.items.push(item);
        quotation.totalItems++;
        
        // حساب القيمة الإجمالية
        const value = parseFloat(item.totalValue?.toString().replace(/[^\d.-]/g, '') || '0');
        if (!isNaN(value)) {
          quotation.totalValue += value;
        }
      }

      const quotations = Array.from(quotationsMap.values());
      console.log(`📋 تم استخراج ${quotations.length} طلب تسعير من Google Sheets`);
      return quotations;
    } catch (error) {
      console.error('❌ خطأ في استخراج طلبات التسعير:', (error as Error).message);
      return [];
    }
  }

  async getAllPurchaseOrders() {
    try {
      const items = await this.getAllItems();
      const poMap = new Map();

      // تجميع الأصناف حسب PO NUMBER
      for (const item of items) {
        if (!item.poNumber) continue;

        if (!poMap.has(item.poNumber)) {
          poMap.set(item.poNumber, {
            id: `po-sheets-${item.poNumber}`,
            poNumber: item.poNumber,
            quotationNumber: item.rfqNumber,
            orderDate: item.poDate,
            status: 'confirmed',
            supplierName: item.clientName || 'الموردين المعتمدين', // اسم العميل من العمود P
            currency: 'EGP',
            totalAmount: 0,
            deliveryStatus: 'delivered',
            itemsCount: 0,
            items: []
          });
        }

        const po = poMap.get(item.poNumber);
        po.items.push(item);
        po.itemsCount++;
        
        // حساب القيمة الإجمالية
        const value = parseFloat(item.totalValue?.toString().replace(/[^\d.-]/g, '') || '0');
        if (!isNaN(value)) {
          po.totalAmount += value;
        }
      }

      const purchaseOrders = Array.from(poMap.values());
      console.log(`🛒 تم استخراج ${purchaseOrders.length} أمر شراء من Google Sheets`);
      return purchaseOrders;
    } catch (error) {
      console.error('❌ خطأ في استخراج أوامر الشراء:', (error as Error).message);
      return [];
    }
  }

  async getStatistics() {
    try {
      const [items, quotations, purchaseOrders, totalValue] = await Promise.all([
        this.getAllItems(),
        this.getAllQuotations(),
        this.getAllPurchaseOrders(),
        this.calculateTotalValue()
      ]);

      return {
        totalItems: items.length,
        totalQuotations: quotations.length,
        totalPurchaseOrders: purchaseOrders.length,
        totalValue: totalValue,
        targetValue: global.TARGET_TOTAL_VALUE,
        accuracyPercentage: totalValue === global.TARGET_TOTAL_VALUE ? 100 : 
          ((totalValue / global.TARGET_TOTAL_VALUE) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('❌ خطأ في حساب الإحصائيات:', (error as Error).message);
      return {
        totalItems: 0,
        totalQuotations: 0,
        totalPurchaseOrders: 0,
        totalValue: 0,
        targetValue: global.TARGET_TOTAL_VALUE,
        accuracyPercentage: 0
      };
    }
  }

  // Methods for Telegram Bot Support
  async getLatestQuotations(limit: number = 5): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:Z1000'
      });

      const rows = response.data.values || [];
      const quotations = [];
      const seenRfqNumbers = new Set();

      // Process rows to get unique quotations
      for (const row of rows) {
        if (row[5]) { // Column F contains RFQ Number
          const rfqNumber = row[5];
          if (!seenRfqNumbers.has(rfqNumber)) {
            seenRfqNumbers.add(rfqNumber);
            quotations.push({
              rfqNumber: rfqNumber,
              requestDate: row[6] || '', // Column G - Request Date
              clientName: row[16] || '', // Column Q - Client Name
              expiryDate: row[9] || '' // Column J - Expiry Date
            });
          }
        }
      }

      // Sort by date and return latest
      return quotations
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('❌ خطأ في جلب آخر طلبات التسعير:', error);
      return [];
    }
  }

  async getPendingItems(limit: number = 10): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:Z1000'
      });

      const rows = response.data.values || [];
      const pendingItems = [];

      // Get items that might be pending (no price or incomplete data)
      for (const row of rows) {
        if (row[3] && row[4]) { // Part Number and Description exist
          const hasPrice = row[11] && parseFloat(row[11]) > 0; // Check if has price
          
          if (!hasPrice) {
            pendingItems.push({
              partNumber: row[3] || '', // Column D - Part Number
              description: row[4] || '', // Column E - Description
              rfqNumber: row[5] || '', // Column F - RFQ Number
              requestDate: row[6] || '', // Column G - Request Date
              quantity: row[7] || '', // Column H - Quantity
              clientName: row[16] || '' // Column Q - Client Name
            });
          }
        }
      }

      return pendingItems.slice(0, limit);
    } catch (error) {
      console.error('❌ خطأ في جلب البنود المعلقة:', error);
      return [];
    }
  }

  async getAllItems(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:Z1000'
      });

      const rows = response.data.values || [];
      const items = [];

      for (const row of rows) {
        if (row[3] && row[4]) { // Part Number and Description exist
          items.push({
            id: row[0] || '', // Column A - Item Number
            itemNumber: row[0] || '',
            partNumber: row[3] || '', // Column D - Part Number
            description: row[4] || '', // Column E - Description
            rfqNumber: row[5] || '', // Column F - RFQ Number
            requestDate: row[6] || '', // Column G - Request Date
            quantity: row[7] || '', // Column H - Quantity
            clientName: row[16] || '' // Column Q - Client Name
          });
        }
      }

      return items;
    } catch (error) {
      console.error('❌ خطأ في جلب جميع الأصناف:', error);
      return [];
    }
  }

  /**
   * قراءة البيانات من صفحة تسعير الموردين
   */
  async getItemsReadyForSupplierPricing(): Promise<any[]> {
    try {
      if (!this.sheets) {
        console.log('❌ Google Sheets غير مُهيأ');
        return [];
      }

      const sheetName = 'تسعير_الموردين';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Y1000`, // توسيع النطاق إلى Y لاستيعاب البيانات الجديدة
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من صفحة تسعير الموردين`);

      // تحويل البيانات إلى تنسيق مناسب مع الحقول الجديدة
      const items = rows.map((row: any[], index: number) => ({
        id: `supplier-${index + 2}`,
        itemNumber: row[0] || '',
        partNumber: row[1] || '',
        description: row[2] || '',
        uom: row[3] || '',
        quantity: row[4] || '',
        rfqNumber: row[5] || '',
        clientName: row[6] || '',
        requestDate: row[7] || '',
        expiryDate: row[8] || '',
        // بيانات المورد المحسنة
        supplierName: row[9] || '',
        supplierContact: row[10] || '', // جهة الاتصال
        supplierPhone: row[11] || '', // الهاتف
        supplierEmail: row[12] || '', // البريد الإلكتروني
        supplierAddress: row[13] || '', // العنوان
        // بيانات التسعير
        unitPrice: row[14] || '',
        totalPrice: row[15] || '',
        currency: row[16] || '',
        // معلومات ضريبة القيمة المضافة
        vatIncluded: row[17] || 'لا', // هل السعر يشمل ضريبة القيمة المضافة
        vatRate: row[18] || '14%', // معدل ضريبة القيمة المضافة
        priceBeforeVat: row[19] || '', // السعر قبل الضريبة
        vatAmount: row[20] || '', // مبلغ الضريبة
        // تفاصيل إضافية
        deliveryTime: row[21] || '',
        paymentTerms: row[22] || '', // شروط الدفع
        warrantyPeriod: row[23] || '', // فترة الضمان
        notes: row[24] || '',
        status: row[25] || 'جديد'
      })).filter(item => item.itemNumber); // تصفية البنود الفارغة

      return items;
    } catch (error) {
      console.error('❌ خطأ في قراءة صفحة تسعير الموردين:', (error as Error).message);
      return [];
    }
  }

  /**
   * قراءة البيانات من صفحة تسعير العملاء
   */
  async getItemsReadyForCustomerPricing(): Promise<any[]> {
    try {
      if (!this.sheets) {
        console.log('❌ Google Sheets غير مُهيأ');
        return [];
      }

      const sheetName = 'تسعير_العملاء';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:P1000`, // قراءة من A2 إلى P مع حد أقصى 1000 صف
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من صفحة تسعير العملاء`);

      // تحويل البيانات إلى تنسيق مناسب
      const items = rows.map((row: any[], index: number) => ({
        id: `customer-${index + 2}`,
        itemNumber: row[0] || '',
        partNumber: row[1] || '',
        description: row[2] || '',
        uom: row[3] || '',
        quantity: row[4] || '',
        rfqNumber: row[5] || '',
        clientName: row[6] || '',
        requestDate: row[7] || '',
        expiryDate: row[8] || '',
        customerUnitPrice: row[9] || '',
        customerTotalPrice: row[10] || '',
        supplierUnitPrice: row[11] || '',
        profitMargin: row[12] || '',
        currency: row[13] || '',
        notes: row[14] || '',
        status: row[15] || 'في انتظار تسعير الموردين'
      })).filter(item => item.itemNumber); // تصفية البنود الفارغة

      return items;
    } catch (error) {
      console.error('❌ خطأ في قراءة صفحة تسعير العملاء:', (error as Error).message);
      return [];
    }
  }
}

export const googleSheetsRealtimeData = new GoogleSheetsRealtimeData();