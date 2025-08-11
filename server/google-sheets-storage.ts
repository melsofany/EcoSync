// نظام تخزين Google Sheets - بديل لقاعدة البيانات المجمدة
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export class GoogleSheetsStorage {
  private auth: GoogleAuth;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    // إعداد المصادقة مع Google Sheets API باستخدام الملف المحلي
    this.auth = new GoogleAuth({
      keyFile: './service-account-key.json', // استخدام الملف المحلي
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
    
    console.log(`🔗 متصل بـ Google Sheets: ${this.spreadsheetId}`);
  }

  // حفظ أوامر الشراء في Google Sheets
  async savePurchaseOrders(purchaseOrders: any[]) {
    try {
      console.log(`📊 حفظ ${purchaseOrders.length} أمر شراء في Google Sheets`);
      
      // تحضير البيانات للكتابة
      const values = [
        ['رقم الأمر', 'رقم التسعير', 'التاريخ', 'المبلغ', 'الحالة', 'المورد', 'العملة', 'حالة التسليم'], // العناوين
        ...purchaseOrders.map(po => [
          po.poNumber,
          po.quotationNumber,
          po.orderDate,
          po.totalAmount,
          po.status,
          po.supplierName,
          po.currency,
          po.deliveryStatus
        ])
      ];

      // كتابة البيانات في ورقة "أوامر الشراء"
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'أوامر الشراء!A1',
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log('✅ تم حفظ أوامر الشراء في Google Sheets بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ أوامر الشراء:', error);
      return false;
    }
  }

  // حفظ طلبات التسعير في Google Sheets
  async saveQuotationRequests(quotations: any[]) {
    try {
      console.log(`📊 حفظ ${quotations.length} طلب تسعير في Google Sheets`);
      
      const values = [
        ['رقم الطلب', 'رقم التسعير المخصص', 'تاريخ الطلب', 'الحالة', 'اسم العميل', 'عدد الأصناف', 'القيمة الإجمالية', 'الملاحظات'],
        ...quotations.map(q => [
          q.id,
          q.rfqNumber,
          q.requestDate,
          q.status,
          q.clientName,
          q.totalItems,
          q.totalValue,
          q.notes || ''
        ])
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'طلبات التسعير!A1',
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log('✅ تم حفظ طلبات التسعير في Google Sheets بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ طلبات التسعير:', error);
      return false;
    }
  }

  // حفظ الأصناف في Google Sheets
  async saveItems(items: any[]) {
    try {
      console.log(`📊 حفظ ${items.length} صنف في Google Sheets`);
      
      const values = [
        ['المعرف', 'رقم القطعة', 'الوصف', 'وحدة القياس', 'العلامة التجارية', 'السعر', 'تاريخ الإنشاء'],
        ...items.map(item => [
          item.id,
          item.partNumber || '',
          item.description || '',
          item.uom || '',
          item.brand || '',
          item.price || '',
          item.createdAt || ''
        ])
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'الأصناف!A1',
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log('✅ تم حفظ الأصناف في Google Sheets بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ الأصناف:', error);
      return false;
    }
  }

  // قراءة البيانات من Google Sheets
  async readFromSheets(sheetName: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`❌ خطأ في قراءة البيانات من ${sheetName}:`, error);
      return [];
    }
  }

  // إنشاء ورقة عمل جديدة
  async createWorksheet(title: string) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: title
              }
            }
          }]
        }
      });
      
      console.log(`✅ تم إنشاء ورقة العمل: ${title}`);
    } catch (error) {
      console.log(`⚠️ ورقة العمل ${title} موجودة بالفعل أو خطأ في الإنشاء`);
    }
  }

  // تهيئة Google Sheets مع الأوراق المطلوبة
  async initializeSheets() {
    try {
      console.log('🚀 تهيئة Google Sheets للبيانات الحقيقية');
      
      // إنشاء الأوراق المطلوبة
      await this.createWorksheet('أوامر الشراء');
      await this.createWorksheet('طلبات التسعير');
      await this.createWorksheet('الأصناف');
      
      console.log('✅ تم تهيئة Google Sheets بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error);
    }
  }
}

export const googleSheetsStorage = new GoogleSheetsStorage();