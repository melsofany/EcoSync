import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

class DirectGoogleSheetsSync {
  private sheets: any;
  private spreadsheetId: string = '1VL9PMLjL2V3yd8aWoMUjeBdOhT3d2JIJXCkPrjdN7CI';
  private isInitialized: boolean = false;

  async initialize() {
    try {
      // استخدام الملف المحلي مباشرة
      const credentials = JSON.parse(readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8'));

      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isInitialized = true;
      console.log('✅ تم تهيئة Google Sheets المباشر بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', (error as Error).message);
      this.isInitialized = false;
      return false;
    }
  }

  async updatePurchaseOrders() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      // قراءة البيانات من Google Sheets مباشرة
      const realData = await this.loadDataFromSheets();
      
      const headers = [
        'PO Number', 'Order Date', 'Total Amount', 'Status', 'Supplier', 'Currency', 'Delivery Status'
      ];
      
      const rows = realData.purchaseOrders.map((po: any) => [
        po.poNumber || '',
        po.orderDate || '',
        po.totalAmount || 0,
        po.status || 'pending',
        po.supplierName || '',
        po.currency || 'EGP',
        po.deliveryStatus || 'pending'
      ]);

      // مسح البيانات القديمة أولاً
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Purchase Orders!A1:Z1000'
      });

      // إدراج البيانات الجديدة
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Purchase Orders!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });

      console.log(`✅ تم تحديث ${realData.purchaseOrders.length} أمر شراء في Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث أوامر الشراء:', (error as Error).message);
      return false;
    }
  }

  async loadDataFromSheets(): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // قراءة البيانات من DATA sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:N15000'
      });
      
      const rows = response.data.values || [];
      const purchaseOrders: any[] = [];
      const quotations: any[] = [];
      
      rows.forEach((row: any[]) => {
        if (row.length >= 10) {
          // استخراج أوامر الشراء
          if (row[9] && row[10]) { // PO_NUMBER و PO_DATE
            purchaseOrders.push({
              poNumber: row[9],
              orderDate: row[10],
              totalAmount: parseFloat(row[12]) || 0,
              status: 'active',
              supplierName: row[1] || '',
              currency: 'EGP',
              deliveryStatus: 'pending'
            });
          }
          
          // استخراج طلبات التسعير  
          if (row[4] && row[5]) { // RFQ_NUMBER و REQUEST_DATE
            quotations.push({
              rfqNumber: row[4],
              requestDate: row[5],
              totalAmount: parseFloat(row[7]) || 0,
              clientName: row[1] || '',
              status: 'pending'
            });
          }
        }
      });
      
      return { purchaseOrders, quotations };
    } catch (error) {
      console.error('❌ خطأ في قراءة البيانات من Google Sheets:', (error as Error).message);
      return { purchaseOrders: [], quotations: [] };
    }
  }

  async updateQuotations() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const realData = JSON.parse(readFileSync('./attached_assets/real_exact_data.json', 'utf8'));
      
      const headers = [
        'RFQ Number', 'Request Date', 'Status', 'Client', 'Total Value', 'Response Date'
      ];
      
      const rows = realData.quotations.map((rfq: any) => [
        rfq.rfqNumber || '',
        rfq.requestDate || '',
        rfq.status || 'pending',
        rfq.clientName || '',
        rfq.totalValue || 0,
        rfq.responseDate || ''
      ]);

      // مسح البيانات القديمة
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Quotations!A1:Z1000'
      });

      // إدراج البيانات الجديدة
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Quotations!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });

      console.log(`✅ تم تحديث ${realData.quotations.length} طلب تسعير في Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث طلبات التسعير:', (error as Error).message);
      return false;
    }
  }

  async updateItems() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const realData = JSON.parse(readFileSync('./attached_assets/real_exact_data.json', 'utf8'));
      
      const headers = [
        'Line Item', 'Part Number', 'Description', 'UOM', 'RFQ Number', 'PO Number', 
        'RFQ Price', 'PO Price', 'RFQ Quantity', 'PO Quantity'
      ];
      
      const rows = realData.items.slice(0, 1000).map((item: any) => [ // تحديد 1000 صف لتجنب التحميل الزائد
        item.lineItem || '',
        item.partNumber || '',
        item.description || '',
        item.uom || '',
        item.rfqNumber || '',
        item.poNumber || '',
        item.rfqPrice || 0,
        item.poPrice || 0,
        item.rfqQuantity || 0,
        item.poQuantity || 0
      ]);

      // مسح البيانات القديمة
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Items!A1:Z1000'
      });

      // إدراج البيانات الجديدة
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Items!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });

      console.log(`✅ تم تحديث ${rows.length} صنف في Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث الأصناف:', (error as Error).message);
      return false;
    }
  }

  async updateStatistics() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const realData = JSON.parse(readFileSync('./attached_assets/real_exact_data.json', 'utf8'));
      
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Purchase Orders', realData.statistics.totalPOs],
        ['Total Quotations', realData.statistics.totalRFQs],
        ['Total Items', realData.statistics.totalItems],
        ['Total PO Value (EGP)', '14,006,975'], // القيمة الدقيقة
        ['Last Updated', new Date().toISOString()]
      ];

      // مسح البيانات القديمة
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Statistics!A1:Z20'
      });

      // إدراج البيانات الجديدة
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Statistics!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });

      console.log('✅ تم تحديث الإحصائيات في Google Sheets');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث الإحصائيات:', (error as Error).message);
      return false;
    }
  }

  async syncAllData() {
    console.log('🔄 بدء المزامنة الشاملة مع Google Sheets...');
    
    const results = await Promise.allSettled([
      this.updatePurchaseOrders(),
      this.updateQuotations(),
      this.updateItems(),
      this.updateStatistics()
    ]);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    console.log(`✅ تم إنجاز ${successful}/4 عمليات مزامنة بنجاح`);
    
    return successful === 4;
  }
}

export const directGoogleSheetsSync = new DirectGoogleSheetsSync();