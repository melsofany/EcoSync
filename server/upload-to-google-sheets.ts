// رفع البيانات الأصلية إلى Google Sheets
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

export async function uploadToGoogleSheets() {
  try {
    console.log('🔄 بدء رفع البيانات إلى Google Sheets...');

    // قراءة البيانات المعدة للرفع
    const sheetsData = JSON.parse(readFileSync('./attached_assets/sheets_upload_data.json', 'utf8'));
    
    // تهيئة اتصال Google Sheets
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // مسح البيانات القديمة
    console.log('🗑️ مسح البيانات القديمة...');
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Purchase_Orders!A:Z'
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Quotations!A:Z'
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Items!A:Z'
    });

    // رفع أوامر الشراء
    console.log('🛒 رفع أوامر الشراء...');
    const poHeaders = [
      'رقم أمر الشراء', 'رقم طلب التسعير', 'تاريخ الأمر', 'إجمالي المبلغ',
      'الحالة', 'اسم المورد', 'العملة', 'حالة التسليم', 'عدد الأصناف', 'ملاحظات'
    ];
    
    const poValues = [poHeaders];
    sheetsData.purchaseOrders.forEach(po => {
      poValues.push([
        po.poNumber,
        po.quotationNumber,
        po.orderDate,
        po.totalAmount,
        po.status,
        po.supplierName,
        po.currency,
        po.deliveryStatus,
        po.itemsCount,
        po.notes
      ]);
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Purchase_Orders!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: poValues }
    });

    // رفع طلبات التسعير
    console.log('📋 رفع طلبات التسعير...');
    const rfqHeaders = [
      'رقم طلب التسعير', 'رقم الطلب المخصص', 'تاريخ الطلب', 'الحالة',
      'اسم العميل', 'عدد الأصناف', 'إجمالي القيمة', 'تاريخ الرد', 'ملاحظات'
    ];
    
    const rfqValues = [rfqHeaders];
    sheetsData.quotations.forEach(rfq => {
      rfqValues.push([
        rfq.rfqNumber,
        rfq.customRequestNumber,
        rfq.requestDate,
        rfq.status,
        rfq.clientName,
        rfq.totalItems,
        rfq.totalValue,
        rfq.responseDate,
        rfq.notes
      ]);
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Quotations!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rfqValues }
    });

    // رفع الأصناف (أول 1000 صنف لتجنب حدود Google Sheets)
    console.log('📦 رفع الأصناف...');
    const itemHeaders = [
      'رقم الصنف', 'LINE ITEM', 'رقم القطعة', 'الوصف', 'وحدة القياس',
      'الفئة', 'العلامة التجارية', 'رقم طلب التسعير', 'رقم أمر الشراء',
      'سعر طلب التسعير', 'سعر أمر الشراء', 'تاريخ طلب التسعير', 'تاريخ أمر الشراء',
      'كمية طلب التسعير', 'كمية أمر الشراء'
    ];
    
    const itemValues = [itemHeaders];
    
    // رفع أول 1000 صنف فقط لتجنب حدود Google Sheets
    const itemsToUpload = sheetsData.items.slice(0, 1000);
    
    itemsToUpload.forEach(item => {
      itemValues.push([
        item.itemNumber,
        item.lineItem,
        item.partNumber,
        item.description,
        item.uom,
        item.category,
        item.brand,
        item.rfqNumber,
        item.poNumber,
        item.rfqPrice,
        item.poPrice,
        item.rfqDate,
        item.poDate,
        item.rfqQuantity,
        item.poQuantity
      ]);
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Items!A:O',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: itemValues }
    });

    console.log('✅ تم رفع البيانات إلى Google Sheets بنجاح!');
    console.log(`🛒 تم رفع ${sheetsData.purchaseOrders.length} أمر شراء`);
    console.log(`📋 تم رفع ${sheetsData.quotations.length} طلب تسعير`);
    console.log(`📦 تم رفع ${itemsToUpload.length} صنف`);

    return {
      success: true,
      uploadedPOs: sheetsData.purchaseOrders.length,
      uploadedRFQs: sheetsData.quotations.length,
      uploadedItems: itemsToUpload.length
    };

  } catch (error) {
    console.error('❌ خطأ في رفع البيانات إلى Google Sheets:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// تشغيل الرفع إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadToGoogleSheets().then(result => {
    if (result.success) {
      console.log('🎉 انتهى الرفع بنجاح!');
    } else {
      console.error('❌ فشل الرفع:', result.error);
    }
  });
}