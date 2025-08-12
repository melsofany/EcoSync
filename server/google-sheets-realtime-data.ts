import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

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
      // استخدام المفاتيح الثابتة المُحَدَّثة
      const credentials = {
        type: "service_account",
        project_id: "cortoba-supp-sys",
        private_key_id: "75c0919d127eca6b97f7beece4b9f5c2b9bb5ba8",
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
        range: 'DATA!A2:P10000', // قراءة من A2 إلى P مع حد أقصى 10000 صف
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من Google Sheets`);

      return rows;
    } catch (error) {
      console.error('❌ خطأ في قراءة البيانات من Google Sheets:', (error as Error).message);
      return [];
    }
  }

  async calculateTotalValue(): Promise<number> {
    try {
      const rows = await this.readDataSheet();
      let totalValue = 0;

      // حساب مجموع العمود N (العمود رقم 13 - محسوب من 0)
      for (const row of rows) {
        if (row.length > 13 && row[13]) {
          const value = parseFloat(row[13].toString().replace(/[^\d.-]/g, ''));
          if (!isNaN(value)) {
            totalValue += value;
          }
        }
      }

      console.log(`💰 إجمالي القيمة المحسوبة: ${totalValue.toLocaleString()} ج.م`);
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
          lineItem: row[1] || '', // العمود B - LINE ITEM
          partNumber: row[2] || '', // العمود C - PART NO
          description: row[3] || '', // العمود D - DESCRIPTION
          rfqNumber: row[5] || '', // العمود F - RFQ NUMBER  
          requestDate: row[6] || '', // العمود G - REQUEST DATE
          quantity: row[7] || '', // العمود H - QUANTITY
          price: row[8] || '', // العمود I - PRICE
          responseDate: row[9] || '', // العمود J - RESPONSE DATE
          poNumber: row[10] || '', // العمود K - PO NUMBER
          poDate: row[11] || '', // العمود L - PO DATE
          poQuantity: row[12] || '', // العمود M - PO QUANTITY
          poPrice: row[13] || '', // العمود N - PO PRICE
          totalValue: row[14] || '', // العمود O - القيمة الإجمالية
          clientName: row[15] || '', // العمود P - اسم العميل
          isActive: true,
          createdAt: new Date().toISOString()
        };

        // طباعة عينة من البيانات للتشخيص (أول 3 صفوف فقط)
        if (i < 3) {
          console.log(`📋 عينة البيانات - الصف ${i + 1}:`, {
            rfqNumber: row[5],
            clientName: row[15] || 'فارغ',
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
            clientName: item.clientName && item.clientName.trim() ? item.clientName.trim() : 'غير محدد', // اسم العميل من العمود P
            requestDate: item.requestDate, // التاريخ من العمود G
            expiryDate: null,
            status: 'completed',
            responsibleEmployee: 'نظام المزامنة',
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
}

export const googleSheetsRealtimeData = new GoogleSheetsRealtimeData();