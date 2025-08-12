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
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not found');
      }

      const credentials = JSON.parse(serviceAccountKey);
      this.auth = new GoogleAuth({
        credentials,
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
        range: 'DATA!A2:N10000', // قراءة من A2 إلى N مع حد أقصى 10000 صف
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
          rfqNumber: row[4] || '', // العمود E - RFQ NUMBER
          requestDate: row[5] || '', // العمود F - REQUEST DATE
          quantity: row[6] || '', // العمود G - QUANTITY
          price: row[7] || '', // العمود H - PRICE
          responseDate: row[8] || '', // العمود I - RESPONSE DATE
          poNumber: row[9] || '', // العمود J - PO NUMBER
          poDate: row[10] || '', // العمود K - PO DATE
          poQuantity: row[11] || '', // العمود L - PO QUANTITY
          poPrice: row[12] || '', // العمود M - PO PRICE
          totalValue: row[13] || '', // العمود N - القيمة الإجمالية
          isActive: true,
          createdAt: new Date().toISOString()
        };

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
            rfqNumber: item.rfqNumber,
            customRequestNumber: item.rfqNumber,
            requestDate: item.requestDate,
            status: 'completed',
            clientName: 'قرطبة للتوريدات',
            totalItems: 0,
            totalValue: 0,
            items: []
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
            supplierName: 'الموردين المعتمدين',
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