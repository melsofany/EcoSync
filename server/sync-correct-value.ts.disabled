import { readFileSync, writeFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import { sheets_v4, google } from 'googleapis';

export async function syncCorrectValue(): Promise<any> {
  try {
    console.log('🔄 مزامنة القيمة المالية الصحيحة مع Google Sheets...');
    
    // قراءة البيانات الصحيحة
    const correctData = JSON.parse(readFileSync('./attached_assets/final_correct_data.json', 'utf8'));
    
    // حساب القيمة الصحيحة
    let correctTotal = 0;
    let itemsWithValues = 0;
    
    correctData.items.forEach((item: any) => {
      const value = parseFloat(item.totalPOValue) || 0;
      if (value > 0) {
        correctTotal += value;
        itemsWithValues++;
      }
    });
    
    console.log('📊 البيانات الصحيحة:');
    console.log('  - الأصناف:', correctData.items.length);
    console.log('  - بنود لها قيمة:', itemsWithValues);
    console.log('  - القيمة الإجمالية:', correctTotal.toLocaleString(), 'جنيه');
    
    // إعداد المصادقة مع Google Sheets
    const keyFile = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const serviceAccountKey = JSON.parse(keyFile);
    
    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    console.log('📤 تحديث صفحة DATA بالقيم الصحيحة...');
    
    // إنشاء البيانات للتحديث
    const dataRows = correctData.items.map((item: any, index: number) => [
      `P-${String(index + 1).padStart(7, '0')}`, // A: معرف البند
      item.lineItem,                              // B: رقم الصنف
      item.partNumber,                            // C: رقم القطعة
      item.description,                           // D: الوصف
      item.uom,                                   // E: الوحدة
      item.rfqNumber,                             // F: رقم طلب التسعير
      item.rfqDate,                               // G: تاريخ RFQ
      item.quantity,                              // H: كمية RFQ
      item.rfqPrice,                              // I: سعر RFQ
      item.poNumber,                              // J: رقم أمر الشراء
      item.poDate,                                // K: تاريخ PO
      item.poQuantity,                            // L: كمية PO
      item.poPrice,                               // M: سعر PO
      item.totalPOValue                           // N: قيمة PO الصحيحة
    ]);
    
    // تحديث البيانات على دفعات
    const batchSize = 1000;
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize);
      const startRow = i + 2; // البدء من الصف 2 (بعد العناوين)
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `DATA!A${startRow}:N${startRow + batch.length - 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: batch }
      });
      
      console.log(`📊 تم تحديث دفعة ${Math.floor(i/batchSize) + 1} من ${Math.ceil(dataRows.length/batchSize)}`);
    }
    
    // إنشاء البيانات المزامنة الصحيحة
    const uniqueRFQs = new Set();
    const uniquePOs = new Set();
    
    correctData.items.forEach((item: any) => {
      if (item.rfqNumber) uniqueRFQs.add(item.rfqNumber);
      if (item.poNumber) uniquePOs.add(item.poNumber);
    });
    
    const syncedData = {
      items: correctData.items,
      quotations: Array.from(uniqueRFQs).map(rfq => ({
        id: `rfq-${rfq}`,
        rfqNumber: rfq,
        status: 'completed'
      })),
      purchaseOrders: Array.from(uniquePOs).map(po => ({
        id: `po-${po}`,
        poNumber: po,
        status: 'confirmed'
      })),
      statistics: {
        totalItems: correctData.items.length,
        totalRFQs: uniqueRFQs.size,
        totalPOs: uniquePOs.size,
        totalPOValue: correctTotal,
        syncedFrom: 'Google Sheets DATA (Corrected)',
        lastSync: new Date().toISOString()
      },
      metadata: {
        source: 'Corrected Final Data',
        spreadsheetId,
        sheetName: 'DATA',
        correctValue: true
      }
    };
    
    // حفظ البيانات المزامنة الصحيحة
    writeFileSync('./attached_assets/synced_data_corrected.json', JSON.stringify(syncedData, null, 2));
    
    console.log('✅ تم تحديث البيانات بالقيمة الصحيحة!');
    
    return {
      success: true,
      message: 'تم تحديث Google Sheets بالقيمة المالية الصحيحة',
      correctedData: {
        items: syncedData.statistics.totalItems,
        quotations: syncedData.statistics.totalRFQs,
        purchaseOrders: syncedData.statistics.totalPOs,
        totalValue: syncedData.statistics.totalPOValue
      },
      targetValue: 14006975,
      actualValue: correctTotal,
      isCorrect: Math.abs(correctTotal - 14006975) < 100,
      spreadsheetId,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ خطأ في المزامنة:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      message: 'فشل في مزامنة القيمة الصحيحة'
    };
  }
}