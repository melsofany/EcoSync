import { google } from 'googleapis';
import fs from 'fs';

async function fixLineItem() {
  try {
    // قراءة مفتاح الخدمة
    const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
    
    // تهيئة المصادقة مع إضافة keyFile parameter
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    console.log('🔄 إضافة البيانات الصحيحة إلى Google Sheets...\n');
    
    // البيانات الجديدة للإضافة
    const newRow = [
      'P-0000016',        // A - رقم البند
      'EACH',             // B - الوحدة
      'line test',        // C - LINE ITEM
      'LC1D32M7',         // D - رقم القطعة
      'كونتاكتور شنايدر',    // E - الوصف
      '25R TEST',         // F - رقم طلب التسعير
      '3'                 // G - الكمية
    ];
    
    console.log('📝 البيانات التي سيتم إضافتها:');
    console.log('  رقم البند: P-0000016');
    console.log('  LINE ITEM: line test');
    console.log('  طلب التسعير: 25R TEST');
    console.log('  الوحدة: EACH');
    console.log('  رقم القطعة: LC1D32M7');
    console.log('  الوصف: كونتاكتور شنايدر');
    console.log('  الكمية: 3\n');
    
    // إضافة الصف
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'DATA!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });
    
    console.log('✅ تم إضافة البيانات بنجاح!');
    console.log(`📍 تم الإضافة في: ${result.data.updates.updatedRange}`);
    console.log(`📊 عدد الخلايا المحدثة: ${result.data.updates.updatedCells}`);
    console.log(`📋 عدد الصفوف المضافة: ${result.data.updates.updatedRows}`);
    console.log('\n🎉 الآن البند P-0000016 مع طلب 25R TEST له LINE ITEM = "line test"');
    console.log('🔄 حدّث الصفحة في المتصفح (F5) لترى التغيير');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response && error.response.data) {
      console.error('التفاصيل:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixLineItem();