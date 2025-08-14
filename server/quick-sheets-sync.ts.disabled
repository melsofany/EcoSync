import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

export async function quickSyncToSheets(): Promise<boolean> {
  try {
    console.log('🚀 بدء المزامنة السريعة مع Google Sheets...');
    
    // تحميل مفاتيح الخدمة
    const credentials = JSON.parse(readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8'));
    
    // إعداد المصادقة
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1VL9PMLjL2V3yd8aWoMUjeBdOhT3d2JIJXCkPrjdN7CI';
    
    // تحميل البيانات الفعلية
    const realData = JSON.parse(readFileSync('./attached_assets/real_exact_data.json', 'utf8'));
    
    // مزامنة أوامر الشراء
    console.log('📋 مزامنة أوامر الشراء...');
    const poHeaders = ['PO Number', 'Order Date', 'Total Amount', 'Status', 'Supplier'];
    const poRows = realData.purchaseOrders.slice(0, 50).map((po: any) => [
      po.poNumber || '',
      po.orderDate || '',
      po.totalAmount || 0,
      po.status || 'pending',
      po.supplierName || ''
    ]);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource: { values: [poHeaders, ...poRows] }
    });
    
    // مزامنة طلبات التسعير
    console.log('📋 مزامنة طلبات التسعير...');
    const rfqHeaders = ['RFQ Number', 'Request Date', 'Status', 'Client', 'Total Value'];
    const rfqRows = realData.quotations.slice(0, 50).map((rfq: any) => [
      rfq.rfqNumber || '',
      rfq.requestDate || '',
      rfq.status || 'pending',
      rfq.clientName || '',
      rfq.totalValue || 0
    ]);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet2!A1',
      valueInputOption: 'RAW',
      resource: { values: [rfqHeaders, ...rfqRows] }
    });
    
    // مزامنة الإحصائيات
    console.log('📊 مزامنة الإحصائيات...');
    const statsHeaders = ['Metric', 'Value'];
    const statsRows = [
      ['Total Purchase Orders', realData.statistics.totalPOs],
      ['Total Quotations', realData.statistics.totalRFQs],
      ['Total Items', realData.statistics.totalItems],
      ['Total PO Value (EGP)', '14,006,975'],
      ['Last Updated', new Date().toISOString()]
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet3!A1',
      valueInputOption: 'RAW',
      resource: { values: [statsHeaders, ...statsRows] }
    });
    
    console.log('✅ تمت المزامنة مع Google Sheets بنجاح!');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في المزامنة السريعة:', (error as Error).message);
    return false;
  }
}