import { GoogleSheetsWriter } from './server/google-sheets-write.js';

async function addLineItemDirectly() {
  try {
    console.log('🔄 إضافة البيانات مباشرة إلى Google Sheets...');
    
    const writer = new GoogleSheetsWriter();
    await writer.initialize();
    
    // البيانات الجديدة للإضافة
    const newData = {
      itemNumber: 'P-0000016',
      uom: 'EACH',
      lineItem: 'line test',
      partNumber: 'LC1D32M7',
      description: 'كونتاكتور شنايدر',
      rfqNumber: '25R TEST',
      quantity: '3'
    };
    
    // إضافة السطر في صفحة DATA
    const values = [[
      newData.itemNumber,  // A
      newData.uom,         // B
      newData.lineItem,    // C
      newData.partNumber,  // D
      newData.description, // E
      newData.rfqNumber,   // F
      newData.quantity     // G
    ]];
    
    const result = await writer.sheets.spreadsheets.values.append({
      spreadsheetId: writer.spreadsheetId,
      range: 'DATA!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });
    
    console.log('✅ تم إضافة البيانات بنجاح!');
    console.log(`📍 الموقع: ${result.data.updates.updatedRange}`);
    console.log('\nالآن البند P-0000016 مع طلب 25R TEST له LINE ITEM = "line test"');
    console.log('🔄 حدّث الصفحة لترى التغيير');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

addLineItemDirectly();