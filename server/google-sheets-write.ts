import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

interface QuotationItem {
  description: string;
  partNumber?: string;
  lineItem?: string;
  uom?: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

interface NewQuotation {
  clientName: string;
  rfqNumber: string;
  requestDate: string;
  expiryDate?: string;
  responsibleEmployee: string;
  items: QuotationItem[];
}

export class GoogleSheetsWriter {
  private auth: GoogleAuth | null = null;
  private sheets: any = null;
  private spreadsheetId: string;

  constructor() {
    // استخدام معرف Google Sheets المباشر
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  }

  async initialize() {
    try {
      // تحميل المفتاح من الملف المحلي مباشرة
      let credentials;
      
      // تحميل من الملف المحلي
      try {
        const credentialsPath = path.resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
        const fileContent = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(fileContent);
        
        // التحقق من وجود المفتاح الخاص
        if (!credentials.private_key || !credentials.client_email) {
          throw new Error('ملف المفاتيح غير مكتمل - المفتاح الخاص أو البريد الإلكتروني مفقود');
        }
        
        // التحقق من طول المفتاح الخاص
        if (credentials.private_key.length < 1000) {
          throw new Error(`المفتاح الخاص مقطوع أو غير مكتمل - الطول الحالي: ${credentials.private_key.length} حرف، المطلوب: أكثر من 1000 حرف`);
        }
        
        console.log('🔑 تم تحميل مفاتيح Google Sheets من الملف المحلي');
        console.log(`📧 البريد الإلكتروني: ${credentials.client_email}`);
        console.log(`🔐 طول المفتاح الخاص: ${credentials.private_key.length} حرف`);
      } catch (fileError) {
        console.error('❌ خطأ في تحميل ملف مفاتيح Google Sheets:', (fileError as Error).message);
        throw new Error('فشل في تحميل مفاتيح Google Sheets');
      }

      this.auth = new GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      // إضافة خيارات إضافية لحل مشاكل SSL/TLS
      this.sheets = google.sheets({ 
        version: 'v4', 
        auth: this.auth,
        timeout: 30000 // مهلة زمنية 30 ثانية
      });
      console.log('✅ تم تهيئة Google Sheets للكتابة');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets للكتابة:', error);
      console.error('❌ تفاصيل الخطأ:', (error as Error).stack);
      return false;
    }
  }

  /**
   * العثور على آخر صف فارغ في العمود F (RFQ Number)
   */
  async findNextEmptyRow(): Promise<number> {
    try {
      // محاولة مع إعدادات أمان محسنة
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!F:F', // العمود F فقط
      });

      const values = response.data.values || [];
      
      // العثور على آخر صف غير فارغ + 1
      let lastRow = 1; // البداية من الصف 2 (فهرس 1)
      
      for (let i = 0; i < values.length; i++) {
        if (values[i] && values[i][0] && values[i][0].trim()) {
          lastRow = i + 1;
        }
      }
      
      // إضافة 1 للحصول على الصف الفارغ التالي
      const nextRow = lastRow + 1;
      console.log(`📍 آخر صف مملوء: ${lastRow}, الصف التالي الفارغ: ${nextRow}`);
      return nextRow;
    } catch (error) {
      console.error('❌ خطأ في العثور على الصف الفارغ:', error);
      console.error('❌ تفاصيل الخطأ:', (error as Error).message);
      throw error;
    }
  }

  /**
   * كتابة طلب تسعير جديد إلى Google Sheets مع البيانات الإضافية
   */
  async writeQuotation(quotation: NewQuotation, employeeName: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }
      
      // تحضير البيانات للكتابة
      const dataToWrite: any[][] = [];
      
      for (const item of quotation.items) {
        const row = [
          '', // A: معرف البند (سيتم إنشاؤه تلقائياً)
          item.uom || 'EACH', // B: UOM
          item.lineItem || '', // C: LINE ITEM
          item.partNumber || '', // D: PART NO
          item.description, // E: DESCRIPTION
          quotation.rfqNumber, // F: RFQ
          quotation.requestDate, // G: DATE/RFQ
          item.quantity || '', // H: QTY
          item.unitPrice || '', // I: PRICE RFQ
          quotation.expiryDate || '', // J: RES. DATE
          '', // K: PO
          '', // L: DATE /PO
          '', // M: Quantity/PO
          '', // N: PRICE/PO
          '', // O: TOTAL PO
          quotation.clientName, // P: العميل
          quotation.responsibleEmployee, // Q: الموظف المسؤول
          employeeName || '', // R: اسم الموظف مدخل الطلب
          '', // S: اسم الموظف المدخل لسعر العميل
        ];
        dataToWrite.push(row);
      }
      
      console.log(`📝 إضافة ${dataToWrite.length} صف جديد إلى ورقة DATA`);
      
      // محاولة استخدام batchUpdate بدلاً من append
      try {
        const response = await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: [{
              range: 'DATA!A:S',
              values: dataToWrite
            }]
          }
        });
        
        console.log('✅ تم كتابة البيانات بنجاح باستخدام batchUpdate');
        return {
          success: true,
          message: `تم إضافة طلب التسعير ${quotation.rfqNumber} بنجاح`,
          details: {
            rfqNumber: quotation.rfqNumber,
            itemsCount: quotation.items.length,
            responses: response.data.responses
          }
        };
      } catch (batchError) {
        console.log('⚠️ فشل batchUpdate، محاولة append...');
        
        // إذا فشل batchUpdate، نحاول append
        const response = await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'DATA!A:S',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: dataToWrite
          }
        });

        console.log('✅ تم كتابة طلب التسعير بنجاح');
        console.log(`📊 تفاصيل الكتابة:`, response.data.updates);

        return {
          success: true,
          message: `تم إضافة طلب التسعير ${quotation.rfqNumber} بنجاح`,
          details: {
            rfqNumber: quotation.rfqNumber,
            itemsCount: quotation.items.length,
            updates: response.data.updates
          }
        };
      }
    } catch (error) {
      console.error('❌ خطأ في كتابة طلب التسعير:', error);
      console.error('❌ تفاصيل الخطأ:', (error as Error).stack);
      
      return {
        success: false,
        message: 'فشل في كتابة طلب التسعير إلى Google Sheets',
        details: (error as Error).message
      };
    }
  }

  /**
   * كتابة أسعار الموردين إلى ورقة supplier_pricing
   */
  async writeSupplierPricing(data: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // العثور على آخر صف فارغ في ورقة supplier_pricing
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'supplier_pricing!A:A',
      });

      const values = response.data.values || [];
      const nextRow = values.length + 1;

      // تحضير البيانات للكتابة (27 عمود من A إلى AA)
      const rowData = [
        data.itemNumber || '', // A: معرف البند
        data.partNumber || '', // B: PART NUMBER
        data.lineItem || '', // C: LINE ITEM
        data.description || '', // D: DESCRIPTION
        data.supplierName || '', // E: اسم المورد
        data.supplierContact || '', // F: الشخص المسؤول
        data.supplierPhone || '', // G: رقم الهاتف
        data.supplierEmail || '', // H: البريد الإلكتروني
        data.supplierAddress || '', // I: العنوان
        data.vatType || 'exclusive', // J: نوع الضريبة (شامل/غير شامل)
        data.supplierPriceExcludingVAT || 0, // K: السعر بدون ضريبة
        data.vatRate || 14, // L: نسبة الضريبة
        data.vatAmount || 0, // M: قيمة الضريبة
        data.supplierPriceIncludingVAT || 0, // N: السعر شامل الضريبة
        data.unitPrice || 0, // O: سعر الوحدة النهائي
        data.minimumQuantity || 1, // P: الحد الأدنى للطلب
        data.maximumQuantity || '', // Q: الحد الأقصى للطلب
        data.currency || 'EGP', // R: العملة
        new Date().toISOString().split('T')[0], // S: تاريخ التسعير
        data.validUntil || '', // T: صالح حتى
        data.paymentTerms || '', // U: شروط الدفع
        data.deliveryTime || '', // V: مدة التسليم
        data.warrantyPeriod || '', // W: فترة الضمان
        data.notes || '', // X: ملاحظات عامة
        data.internalNotes || '', // Y: ملاحظات داخلية
        data.employeeName || '', // Z: اسم الموظف
        new Date().toISOString() // AA: الطابع الزمني
      ];

      // كتابة البيانات
      const range = `supplier_pricing!A${nextRow}:AA${nextRow}`;
      
      const updateResponse = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });

      console.log('✅ تم كتابة أسعار المورد بنجاح');
      return {
        success: true,
        message: 'تم حفظ أسعار المورد بنجاح',
        details: {
          row: nextRow,
          updatedCells: updateResponse.data.updatedCells
        }
      };
    } catch (error) {
      console.error('❌ خطأ في كتابة أسعار المورد:', error);
      return {
        success: false,
        message: 'فشل في كتابة أسعار المورد',
        details: (error as Error).message
      };
    }
  }

  /**
   * كتابة أسعار العملاء مباشرة إلى العمود I في ورقة DATA
   */
  async writeCustomerPricing(data: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // البحث عن الصف المطابق في ورقة DATA
      const searchResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:F', // البحث في الأعمدة الأولى
      });

      const rows = searchResponse.data.values || [];
      let targetRow = -1;

      // البحث عن الصف المطابق بناءً على معرف البند أو LINE ITEM
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] === data.itemNumber || // معرف البند في العمود A
            row[2] === data.lineItem) {   // LINE ITEM في العمود C
          targetRow = i + 1; // +1 لأن الفهرس يبدأ من 1 في Sheets
          break;
        }
      }

      if (targetRow === -1) {
        throw new Error('لم يتم العثور على البند المطلوب');
      }

      // كتابة السعر في العمود I واسم الموظف في العمود S
      const updates = [
        {
          range: `DATA!I${targetRow}`,
          values: [[data.finalPrice || data.customerPrice || '']]
        },
        {
          range: `DATA!S${targetRow}`,
          values: [[data.employeeName || '']]
        }
      ];

      // تنفيذ التحديثات
      const batchUpdateResponse = await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates
        }
      });

      console.log('✅ تم حفظ سعر العميل بنجاح في ورقة DATA');
      return {
        success: true,
        message: 'تم حفظ سعر العميل بنجاح',
        details: {
          row: targetRow,
          price: data.finalPrice || data.customerPrice,
          employeeName: data.employeeName
        }
      };
    } catch (error) {
      console.error('❌ خطأ في كتابة سعر العميل:', error);
      return {
        success: false,
        message: 'فشل في كتابة سعر العميل',
        details: (error as Error).message
      };
    }
  }

  /**
   * كتابة طلب تسعير إلى ورقة طلبات_التسعير
   */
  async writeQuotationRequest(data: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // العثور على آخر صف فارغ في ورقة طلبات_التسعير
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'طلبات_التسعير!A:A',
      });

      const values = response.data.values || [];
      const nextRow = values.length + 1;

      // تحضير البيانات للكتابة
      const rowData = [
        data.requestId || `REQ-${Date.now()}`, // A: رقم الطلب
        new Date().toISOString().split('T')[0], // B: التاريخ
        data.clientName || '', // C: اسم العميل
        data.clientContact || '', // D: جهة الاتصال
        data.clientPhone || '', // E: رقم الهاتف
        data.clientEmail || '', // F: البريد الإلكتروني
        data.itemDescription || '', // G: وصف البند
        data.quantity || 1, // H: الكمية
        data.unitOfMeasure || 'EACH', // I: وحدة القياس
        data.requiredDate || '', // J: التاريخ المطلوب
        data.notes || '', // K: ملاحظات
        data.priority || 'عادي', // L: الأولوية
        'جديد', // M: الحالة
        data.responsibleEmployee || '', // N: الموظف المسؤول
        data.createdBy || '', // O: أنشأ بواسطة
        new Date().toISOString() // P: الطابع الزمني
      ];

      // كتابة البيانات
      const range = `طلبات_التسعير!A${nextRow}:P${nextRow}`;
      
      const updateResponse = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });

      console.log('✅ تم كتابة طلب التسعير بنجاح في ورقة طلبات_التسعير');
      
      // أيضاً توزيع البند إلى ورقة supplier_pricing و customer_pricing إذا لزم الأمر
      
      return {
        success: true,
        message: 'تم حفظ طلب التسعير بنجاح',
        details: {
          requestId: rowData[0],
          row: nextRow,
          updatedCells: updateResponse.data.updatedCells
        }
      };
    } catch (error) {
      console.error('❌ خطأ في كتابة طلب التسعير:', error);
      return {
        success: false,
        message: 'فشل في كتابة طلب التسعير',
        details: (error as Error).message
      };
    }
  }

  /**
   * كتابة أمر شراء إلى Google Sheets
   */
  async writePurchaseOrder(data: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // البحث عن البنود المطابقة وتحديثها
      const searchResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:K', // البحث في الأعمدة حتى K (PO)
      });

      const rows = searchResponse.data.values || [];
      const updates = [];
      let updatedCount = 0;

      for (const item of data.items) {
        // البحث عن الصف المطابق
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          
          // التحقق من التطابق بناءً على معرف البند أو LINE ITEM
          if ((row[0] === item.itemNumber || row[2] === item.lineItem) &&
              (!row[10] || row[10] === '')) { // التأكد من عدم وجود PO سابق
            
            // إذا كان هناك PO موجود، نحتاج لإضافة صف جديد
            if (row[10] && row[10] !== '') {
              // نسخ الصف ولكن مع PO جديد
              const newRow = [...row];
              newRow[10] = data.poNumber; // K: PO
              newRow[11] = data.poDate; // L: DATE /PO
              newRow[12] = item.quantity; // M: Quantity/PO
              newRow[13] = item.unitPrice; // N: PRICE/PO
              newRow[14] = item.quantity * item.unitPrice; // O: TOTAL PO
              
              // إضافة الصف الجديد
              const insertResponse = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'DATA!A:O',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                  values: [newRow]
                }
              });
              
              updatedCount++;
            } else {
              // تحديث الصف الموجود
              updates.push({
                range: `DATA!K${i + 1}:O${i + 1}`,
                values: [[
                  data.poNumber, // K: PO
                  data.poDate, // L: DATE /PO
                  item.quantity, // M: Quantity/PO
                  item.unitPrice, // N: PRICE/PO
                  item.quantity * item.unitPrice // O: TOTAL PO
                ]]
              });
              updatedCount++;
            }
            break;
          }
        }
      }

      if (updates.length > 0) {
        // تنفيذ التحديثات
        const batchUpdateResponse = await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates
          }
        });
      }

      console.log(`✅ تم كتابة أمر الشراء ${data.poNumber} بنجاح`);
      return {
        success: true,
        message: `تم حفظ أمر الشراء ${data.poNumber} بنجاح`,
        details: {
          poNumber: data.poNumber,
          updatedItems: updatedCount,
          totalItems: data.items.length
        }
      };
    } catch (error) {
      console.error('❌ خطأ في كتابة أمر الشراء:', error);
      return {
        success: false,
        message: 'فشل في كتابة أمر الشراء',
        details: (error as Error).message
      };
    }
  }

  /**
   * تحديث بيانات أمر شراء موجود
   */
  async updatePurchaseOrder(poNumber: string, updates: any): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // البحث عن أمر الشراء
      const searchResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!K:K', // البحث في عمود PO
      });

      const poColumn = searchResponse.data.values || [];
      const updateRanges = [];

      for (let i = 0; i < poColumn.length; i++) {
        if (poColumn[i][0] === poNumber) {
          const row = i + 1;
          
          // تحديث البيانات المطلوبة
          if (updates.quantity !== undefined) {
            updateRanges.push({
              range: `DATA!M${row}`,
              values: [[updates.quantity]]
            });
          }
          
          if (updates.unitPrice !== undefined) {
            updateRanges.push({
              range: `DATA!N${row}`,
              values: [[updates.unitPrice]]
            });
          }
          
          if (updates.quantity !== undefined && updates.unitPrice !== undefined) {
            updateRanges.push({
              range: `DATA!O${row}`,
              values: [[updates.quantity * updates.unitPrice]]
            });
          }
        }
      }

      if (updateRanges.length > 0) {
        const batchUpdateResponse = await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updateRanges
          }
        });

        console.log(`✅ تم تحديث أمر الشراء ${poNumber} بنجاح`);
        return {
          success: true,
          message: `تم تحديث أمر الشراء ${poNumber} بنجاح`
        };
      } else {
        return {
          success: false,
          message: `لم يتم العثور على أمر الشراء ${poNumber}`
        };
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث أمر الشراء:', error);
      return {
        success: false,
        message: 'فشل في تحديث أمر الشراء'
      };
    }
  }

  /**
   * كتابة بيانات عميل جديد
   */
  async writeClient(clientData: any): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // العثور على آخر صف فارغ في ورقة العملاء
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'العملاء!A:A',
      });

      const values = response.data.values || [];
      const nextRow = values.length + 1;

      // تحضير البيانات
      const rowData = [
        clientData.clientId || `CLIENT-${Date.now()}`,
        clientData.name,
        clientData.contactPerson || '',
        clientData.phone || '',
        clientData.email || '',
        clientData.address || '',
        clientData.taxNumber || '',
        clientData.notes || '',
        new Date().toISOString()
      ];

      // كتابة البيانات
      const range = `العملاء!A${nextRow}:I${nextRow}`;
      
      const updateResponse = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });

      console.log('✅ تم إضافة العميل بنجاح');
      return {
        success: true,
        message: 'تم إضافة العميل بنجاح'
      };
    } catch (error) {
      console.error('❌ خطأ في إضافة العميل:', error);
      return {
        success: false,
        message: 'فشل في إضافة العميل'
      };
    }
  }

  /**
   * كتابة بيانات مورد جديد
   */
  async writeSupplier(supplierData: any): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // العثور على آخر صف فارغ في ورقة الموردين
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'الموردين!A:A',
      });

      const values = response.data.values || [];
      const nextRow = values.length + 1;

      // تحضير البيانات
      const rowData = [
        supplierData.supplierId || `SUPPLIER-${Date.now()}`,
        supplierData.name,
        supplierData.contactPerson || '',
        supplierData.phone || '',
        supplierData.email || '',
        supplierData.address || '',
        supplierData.taxNumber || '',
        supplierData.paymentTerms || '',
        supplierData.notes || '',
        new Date().toISOString()
      ];

      // كتابة البيانات
      const range = `الموردين!A${nextRow}:J${nextRow}`;
      
      const updateResponse = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });

      console.log('✅ تم إضافة المورد بنجاح');
      return {
        success: true,
        message: 'تم إضافة المورد بنجاح'
      };
    } catch (error) {
      console.error('❌ خطأ في إضافة المورد:', error);
      return {
        success: false,
        message: 'فشل في إضافة المورد'
      };
    }
  }
}