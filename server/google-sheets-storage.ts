// نظام تخزين Google Sheets - بديل لقاعدة البيانات المجمدة
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export class GoogleSheetsStorage {
  private auth: GoogleAuth;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    // إعداد المصادقة مع Google Sheets API باستخدام بيانات الاعتماد من المتغيرات البيئية
    const credentials = {
      type: "service_account",
      project_id: "cortoba-supp-sys",
      private_key_id: "75c0919d127e568d06729547b79f62f3b83322bd",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLRiY5TEiNxTqU\nSKp94TnwbJh4L+bc8WylNB7qeXqFF8+obb1ErPy8kfq21vLRZNM7bY6R8zT+R96O\n+lFgemZrCg98jI9eZo/z2sdZZ8sBowGQpOC2S/+1bnqVtR/uBr5lSZNTXdxd0NBL\nRqSUrY79C7e5xBYQ/k60sRv3cGvwu0p2yuflca5Nq8B8ONCDTKdXMZNLyf3LYc2o\nXXDH4j+RdGkS7OAj3dUMYSt4yUa923ERYaSoaUkuUxyxy40c205MFkzPQRfcU3f4\nsoDLGcXq90lj5HvMkO9iFc6rXJoLAsKYkwBOQrabOIADw8snPXOxy0Pg4DAnbFX6\nkZ28acaVAgMBAAECggEABuzMNJDYD+xeLdsOjodJFVsTE//Ib6fR5GGS2WNrZx6u\ni7W2svY/DfWIgwjDm5qXD6Pl2Cxe681q/u1MLxXnE1JzwJx77eK0mMF6n8hyGWDX\nls6R0TlkQWa9dQgx9Eaf3zd9y2NGifOpL5yn0rYu9DPyqGN5FPnKQ0xIAEqrgrdE\ncwAvDiJ9jtj/7hUtL9E/Py3awxtqGrqfqAWyDMhlwqkPpQ/Ci9UT5LPGKU6PgGDA\nzOUNh0N3zreN4zjHaKGezdW+9wVAGkuJKOu4JtOkU6SJvKyQt4wHzrglQNjkl65C\nfCZl9ci9YTr+UD24LhAiA8yyQ9IYrDWn5dCeELjaAQKBgQD4L5wDoRvkPi42e3qg\n+sOpxiErPhyHl4keYW+DMPulad8qgXF+WUc5A9youEzj6D0EiXI0OrxuKw7Bhwkl\nbuisoLWeENsf8Djsa+xtDwwm+1IEIXi8xpVYhH83OY+o06Mw3JEB2K+Ci6SG0AUf\nFtzhvk02XSNQSfTF01K0Dke3wQKBgQDRrIwkl+/aQ/DzrDm4oWexdZJwWgWJESKi\nlx0Vb8nMVNFx2JBLmAcV1B4OvmpoAFHsr5/3/3x/pRa6Zk6GZluSrE7u3bbd6Hna\nTtUW4eo/2XR+/HFlbAWZwsNQAvHZ1gsBv+GlnT5zNE2fs4zI1KQigiAtGg4mnTga\n4KHDsD6j1QKBgHnfNyd5F68u8ZaDcCZYvXhC+Mq5R102BnlKs22iwg/qO1IuGkNH\nJ/hRcyvOxMMtqbjunYwUQ699qVNTMiSVn+AVUtn5wQCf//Po00KCnx8NTqsEnLtm\ncLP07Ft8ApWOx5YY2YQkmZrrY7FnuPwZSAH6ZwQJHGwyxOXX7cbJNGKBAoGAMqh3\nq5ex8ZActSLVR1Bn1y5K1S5KzBUBwzqzYiyCGwYbHGBwbHMssw9uu60x1DLPmFnO\nUoK9t7FRTnPNYRd15HgREhErT24NkrsdLMwkZozJYqznUNPKfp3ZxokPmcvnGOMd\nR4A4SGlIn98nkpYdmeDKmVsENDwkBAplyvvYBokCgYEA9uA3IUMaZ5G5KHgA+C4F\nmU+pwnOGs60BLTgK+EUXaUQ4f0HDsqCz0UXrI146bWW1sxU4TyddNUscc4SX/60k\nU86A4nrFQk0FkIcrhFS9KYkuWzqgBuY1N8AmgfI7tRIaqsRXb0281uhHmyN1MGBT\nx78kvtrLVv33tSBmTfs2m3k=\n-----END PRIVATE KEY-----\n",
      client_email: "cortoba-sys@cortoba-supp-sys.iam.gserviceaccount.com",
      client_id: "108486641505877917440",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/cortoba-sys%40cortoba-supp-sys.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    this.auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
    
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