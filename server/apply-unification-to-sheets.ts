import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync, writeFileSync } from 'fs';
import fs from 'fs';

class GoogleSheetsUnification {
  private sheets: any;
  private spreadsheetId: string = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

  constructor() {
    this.initializeSheets();
  }

  private async initializeSheets() {
    try {
      const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
      const credentials = JSON.parse(serviceAccountKey);
      
      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: auth });
      console.log('🔗 تم تهيئة Google Sheets API');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error.message);
      throw error;
    }
  }

  // تطبيق التوحيد على Google Sheets
  async applyUnificationToSheets() {
    console.log('🔄 تطبيق التوحيد على Google Sheets...');

    // قراءة البيانات الموحدة
    const unifiedDataPath = './attached_assets/database_records_unified.json';
    const unificationResultsPath = './attached_assets/smart_unification_results.json';
    
    if (!fs.existsSync(unifiedDataPath)) {
      console.log('❌ لم يتم العثور على البيانات الموحدة');
      return;
    }

    const unifiedData = JSON.parse(readFileSync(unifiedDataPath, 'utf8'));
    console.log(`📊 تحديث ${unifiedData.length} عنصر في Google Sheets`);

    // تحديث ورقة الأصناف
    await this.updateItemsSheet(unifiedData);
    
    // تحديث ورقة طلبات التسعير
    await this.updateQuotationsSheet(unifiedData);
    
    // تحديث ورقة أوامر الشراء
    await this.updatePurchaseOrdersSheet(unifiedData);

    console.log('✅ تم تطبيق التوحيد على Google Sheets بنجاح');
  }

  private async updateItemsSheet(unifiedData: any[]) {
    console.log('📦 تحديث ورقة الأصناف...');

    // تحضير بيانات الأصناف
    const itemsData = unifiedData.map((record, index) => [
      `P-${(index + 1).toString().padStart(7, '0')}`, // المعرف
      record.lineItem || '', // LINE ITEM
      record.partNumber || '', // PART NO
      record.description || '', // الوصف
      record.uom || 'EACH', // وحدة القياس
      '', // العلامة التجارية
      '', // السعر
      new Date().toISOString() // تاريخ الإنشاء
    ]);

    // إضافة العناوين
    const headers = [
      'المعرف', 'LINE ITEM', 'PART NO', 'الوصف', 
      'وحدة القياس', 'العلامة التجارية', 'السعر', 'تاريخ الإنشاء'
    ];

    const allData = [headers, ...itemsData];

    try {
      // مسح البيانات الحالية وإدراج البيانات الموحدة
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'الأصناف!A:H'
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'الأصناف!A1',
        valueInputOption: 'RAW',
        resource: { values: allData }
      });

      console.log(`✅ تم تحديث ${itemsData.length} صنف في ورقة الأصناف`);
    } catch (error) {
      console.error('❌ خطأ في تحديث ورقة الأصناف:', error.message);
    }
  }

  private async updateQuotationsSheet(unifiedData: any[]) {
    console.log('📋 تحديث ورقة طلبات التسعير...');

    // تجميع طلبات التسعير من البيانات الموحدة
    const rfqMap = new Map();

    unifiedData.forEach(record => {
      const rfqNumber = record.rfqNumber;
      if (rfqNumber && rfqNumber.trim()) {
        const rfqId = rfqNumber.trim();
        if (!rfqMap.has(rfqId)) {
          rfqMap.set(rfqId, {
            rfqNumber: rfqId,
            requestDate: this.parseExcelDate(record.rfqDate),
            responseDate: this.parseExcelDate(record.rfqResponseDate),
            status: record.poNumber ? 'completed' : 'quoted',
            clientName: 'عميل من قاعدة البيانات',
            totalItems: 0,
            totalValue: 0,
            notes: 'طلب موحد من قاعدة البيانات'
          });
        }
        
        const rfq = rfqMap.get(rfqId);
        rfq.totalItems++;
        const price = parseFloat(record.rfqPrice || '0');
        const quantity = parseFloat(record.rfqQuantity || '0');
        rfq.totalValue += (price * quantity);
      }
    });

    const quotationsData = Array.from(rfqMap.values()).map(rfq => [
      `rfq-${rfq.rfqNumber}`, // رقم الطلب
      rfq.rfqNumber, // رقم التسعير المخصص
      rfq.requestDate, // تاريخ الطلب
      rfq.responseDate, // تاريخ الرد
      rfq.status, // الحالة
      rfq.clientName, // اسم العميل
      rfq.totalItems, // عدد الأصناف
      rfq.totalValue, // القيمة الإجمالية
      rfq.notes // الملاحظات
    ]);

    const headers = [
      'رقم الطلب', 'رقم التسعير المخصص', 'تاريخ الطلب', 'تاريخ الرد',
      'الحالة', 'اسم العميل', 'عدد الأصناف', 'القيمة الإجمالية', 'الملاحظات'
    ];

    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'طلبات التسعير!A:I'
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'طلبات التسعير!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...quotationsData] }
      });

      console.log(`✅ تم تحديث ${quotationsData.length} طلب تسعير`);
    } catch (error) {
      console.error('❌ خطأ في تحديث طلبات التسعير:', error.message);
    }
  }

  private async updatePurchaseOrdersSheet(unifiedData: any[]) {
    console.log('🛒 تحديث ورقة أوامر الشراء...');

    // تجميع أوامر الشراء من البيانات الموحدة
    const poMap = new Map();

    unifiedData.forEach(record => {
      const poNumber = record.poNumber;
      if (poNumber && poNumber.trim()) {
        const poId = poNumber.trim();
        if (!poMap.has(poId)) {
          poMap.set(poId, {
            poNumber: poId,
            quotationNumber: record.rfqNumber,
            orderDate: this.parseExcelDate(record.poDate),
            status: 'confirmed',
            supplierName: 'مورد من قاعدة البيانات',
            currency: 'EGP',
            deliveryStatus: 'pending',
            totalAmount: 0,
            itemsCount: 0
          });
        }
        
        const po = poMap.get(poId);
        const poPrice = parseFloat(record.poPrice || '0');
        const poQuantity = parseFloat(record.poQuantity || '0');
        po.totalAmount += (poPrice * poQuantity);
        po.itemsCount++;
      }
    });

    const purchaseOrdersData = Array.from(poMap.values()).map(po => [
      po.poNumber, // رقم الأمر
      po.quotationNumber, // رقم التسعير
      po.orderDate, // التاريخ
      po.totalAmount, // المبلغ
      po.status, // الحالة
      po.supplierName, // المورد
      po.currency, // العملة
      po.deliveryStatus // حالة التسليم
    ]);

    const headers = [
      'رقم الأمر', 'رقم التسعير', 'التاريخ', 'المبلغ',
      'الحالة', 'المورد', 'العملة', 'حالة التسليم'
    ];

    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'أوامر الشراء!A:H'
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'أوامر الشراء!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...purchaseOrdersData] }
      });

      console.log(`✅ تم تحديث ${purchaseOrdersData.length} أمر شراء`);
    } catch (error) {
      console.error('❌ خطأ في تحديث أوامر الشراء:', error.message);
    }
  }

  private parseExcelDate(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      // إذا كان التاريخ بصيغة نص
      if (typeof dateValue === 'string') {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0');
          const day = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      
      // إذا كان التاريخ بصيغة رقم Excel
      if (typeof dateValue === 'number') {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      return new Date(dateValue).toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  // إنشاء ورقة تقرير التوحيد
  async createUnificationReport() {
    console.log('📊 إنشاء تقرير التوحيد...');

    const unificationResultsPath = './attached_assets/smart_unification_results.json';
    if (!fs.existsSync(unificationResultsPath)) {
      console.log('❌ لم يتم العثور على نتائج التوحيد');
      return;
    }

    const unificationResults = JSON.parse(readFileSync(unificationResultsPath, 'utf8'));
    
    // تحضير بيانات التقرير
    const reportData = [
      ['نوع التوحيد', 'العنصر الرئيسي', 'العناصر المكررة', 'مستوى الثقة', 'السبب'],
      ...unificationResults.unificationActions.map((action: any) => [
        action.type === 'part_number_match' ? 'مطابقة رقم القطعة' : 'مطابقة الوصف',
        action.masterItem,
        action.duplicates.join(', '),
        `${action.confidence}%`,
        action.reason
      ])
    ];

    try {
      // إنشاء ورقة جديدة للتقرير
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'تقرير التوحيد!A1',
        valueInputOption: 'RAW',
        resource: { values: reportData }
      });

      console.log(`✅ تم إنشاء تقرير التوحيد بـ ${reportData.length - 1} عملية`);
    } catch (error) {
      console.error('❌ خطأ في إنشاء تقرير التوحيد:', error.message);
    }
  }
}

// تشغيل التوحيد
async function runCompleteUnification() {
  try {
    console.log('🚀 بدء التوحيد الشامل...');
    
    const sheetsUnification = new GoogleSheetsUnification();
    await sheetsUnification.applyUnificationToSheets();
    await sheetsUnification.createUnificationReport();
    
    console.log('🎯 اكتمل التوحيد الشامل بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في التوحيد:', error.message);
  }
}

export { GoogleSheetsUnification, runCompleteUnification };

// تشغيل مباشر
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteUnification();
}