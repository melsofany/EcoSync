import { google } from 'googleapis';
import fs from 'fs';

async function addTestLineItem() {
  try {
    // قراءة مفتاح الخدمة
    const keyFileContent = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const keyFile = JSON.parse(keyFileContent);
    
    // تهيئة المصادقة
    const jwtClient = new google.auth.JWT(
      keyFile.client_email,
      null,
      keyFile.private_key,
      ['https://www.googleapis.com/auth/spreadsheets'],
      null
    );
    
    // الحصول على رمز الوصول
    const tokens = await jwtClient.authorize();
    console.log('✅ تم الحصول على رمز الوصول');
    
    const sheets = google.sheets({ version: 'v4', auth: jwtClient });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    // البيانات الجديدة
    const newRow = [
      'P-0000016',        // A - رقم البند
      'EACH',             // B - الوحدة
      'line test',        // C - LINE ITEM الصحيح للطلب
      'LC1D32M7',         // D - رقم القطعة
      'كونتاكتور شنايدر',    // E - الوصف
      '25R TEST',         // F - رقم طلب التسعير
      '3'                 // G - الكمية
    ];
    
    console.log('🔄 إضافة البيانات الصحيحة...');
    console.log('  البند: P-0000016');
    console.log('  طلب التسعير: 25R TEST');
    console.log('  LINE ITEM: line test');
    
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
    console.log('📍 الموقع:', result.data.updates.updatedRange);
    console.log('\nالآن البند P-0000016 مع طلب 25R TEST له LINE ITEM = "line test"');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response && error.response.data) {
      console.error('التفاصيل:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

addTestLineItem();