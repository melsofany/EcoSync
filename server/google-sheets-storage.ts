// نظام تخزين Google Sheets - بديل لقاعدة البيانات المجمدة
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export class GoogleSheetsStorage {
  private auth: GoogleAuth;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    // تحميل المفاتيح: أولاً متغير البيئة، ثم الملف المحلي للتطوير
    let credentials: any;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      const decodedJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      credentials = JSON.parse(decodedJson);
      console.log('✅ تم تحميل مفتاح Google Sheets من متغير البيئة');
    } else {
      const fsSync = require('fs');
      const localPaths = ['./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', './google-service-account.json'];
      let loaded = false;
      for (const p of localPaths) { if (fsSync.existsSync(p)) { credentials = JSON.parse(fsSync.readFileSync(p, 'utf8')); loaded = true; break; } }
      if (!loaded) throw new Error('أضف GOOGLE_SERVICE_ACCOUNT_BASE64 في متغيرات البيئة');
    }

    this.auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
    
    console.log(`🔗 محاولة الاتصال بـ Google Sheets: ${this.spreadsheetId}`);
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
        ['رقم الطلب', 'رقم التسعير المخصص', 'تاريخ الطلب', 'تاريخ الرد', 'الحالة', 'اسم العميل', 'عدد الأصناف', 'القيمة الإجمالية', 'الملاحظات'],
        ...quotations.map(q => [
          q.id,
          q.rfqNumber,
          q.requestDate,
          q.responseDate || '',
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
        ['المعرف', 'LINE ITEM', 'PART NO', 'الوصف', 'وحدة القياس', 'العلامة التجارية', 'السعر', 'تاريخ الإنشاء'],
        ...items.map(item => [
          item.id,
          item.lineItem || '',
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

  // حفظ المستخدمين في Google Sheets
  async saveUsers(users: any[]) {
    try {
      console.log(`📊 حفظ ${users.length} مستخدم في Google Sheets`);
      
      const values = [
        ['المعرف', 'اسم المستخدم', 'الرقم السري المشفر', 'الاسم الكامل', 'الدور', 'البريد الإلكتروني', 'نشط', 'آخر تسجيل دخول', 'تاريخ الإنشاء', 'عرض طلبات التسعير', 'إنشاء طلبات التسعير', 'تعديل طلبات التسعير', 'حذف طلبات التسعير', 'عرض الأصناف', 'إنشاء الأصناف', 'تعديل الأصناف', 'حذف الأصناف', 'عرض أوامر الشراء', 'إنشاء أوامر الشراء', 'تعديل أوامر الشراء', 'حذف أوامر الشراء', 'عرض المستخدمين', 'إنشاء المستخدمين', 'تعديل المستخدمين', 'حذف المستخدمين', 'عرض التقارير', 'استيراد البيانات', 'تصدير البيانات', 'نسخ احتياطي'],
        ...users.map(user => [
          user.id,
          user.username,
          user.hashedPassword || 'غير متوفر',
          user.fullName,
          user.role,
          user.email,
          user.isActive ? 'نعم' : 'لا',
          user.lastLogin || '',
          user.createdAt || '',
          user.permissions?.viewQuotations ? 'نعم' : 'لا',
          user.permissions?.createQuotations ? 'نعم' : 'لا',
          user.permissions?.editQuotations ? 'نعم' : 'لا',
          user.permissions?.deleteQuotations ? 'نعم' : 'لا',
          user.permissions?.viewItems ? 'نعم' : 'لا',
          user.permissions?.createItems ? 'نعم' : 'لا',
          user.permissions?.editItems ? 'نعم' : 'لا',
          user.permissions?.deleteItems ? 'نعم' : 'لا',
          user.permissions?.viewPurchaseOrders ? 'نعم' : 'لا',
          user.permissions?.createPurchaseOrders ? 'نعم' : 'لا',
          user.permissions?.editPurchaseOrders ? 'نعم' : 'لا',
          user.permissions?.deletePurchaseOrders ? 'نعم' : 'لا',
          user.permissions?.viewUsers ? 'نعم' : 'لا',
          user.permissions?.createUsers ? 'نعم' : 'لا',
          user.permissions?.editUsers ? 'نعم' : 'لا',
          user.permissions?.deleteUsers ? 'نعم' : 'لا',
          user.permissions?.viewReports ? 'نعم' : 'لا',
          user.permissions?.importData ? 'نعم' : 'لا',
          user.permissions?.exportData ? 'نعم' : 'لا',
          user.permissions?.backupDatabase ? 'نعم' : 'لا'
        ])
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Users!A1',
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log('✅ تم حفظ المستخدمين في Google Sheets بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ المستخدمين:', error);
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

  // مسح جميع البيانات من Google Sheets
  async clearAllData() {
    try {
      const sheets = ['أوامر الشراء', 'طلبات التسعير', 'الأصناف'];
      
      for (const sheetName of sheets) {
        try {
          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A:Z`
          });
          console.log(`🗑️ تم مسح بيانات ورقة: ${sheetName}`);
        } catch (error) {
          console.log(`⚠️ لا توجد ورقة ${sheetName} أو تم مسحها بالفعل`);
        }
      }
      
      console.log('✅ تم مسح جميع البيانات من Google Sheets');
    } catch (error) {
      console.log('❌ خطأ في مسح البيانات:', error.message);
    }
  }

  // إعادة تعيين الأوراق
  async resetSheets() {
    try {
      console.log('🔄 إعادة تعيين Google Sheets...');
      await this.clearAllData();
      console.log('✅ تم إعادة تعيين Google Sheets بنجاح');
    } catch (error) {
      console.log('❌ خطأ في إعادة تعيين الأوراق:', error.message);
    }
  }
}

export const googleSheetsStorage = new GoogleSheetsStorage();