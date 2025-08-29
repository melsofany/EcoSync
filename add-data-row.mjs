import { google } from 'googleapis';
import fs from 'fs';

async function addDataRow() {
  try {
    // قراءة مفتاح الخدمة
    const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
    
    // تهيئة المصادقة
    const auth = new google.auth.JWT(
      keyFile.client_email,
      null,
      keyFile.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    
    await auth.authorize();
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    // إضافة البيانات
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'DATA!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'P-0000016',        // A - رقم البند
          'EACH',             // B - الوحدة
          'line test',        // C - LINE ITEM
          'LC1D32M7',         // D - رقم القطعة
          'كونتاكتور شنايدر',    // E - الوصف
          '25R TEST',         // F - رقم طلب التسعير
          '3'                 // G - الكمية
        ]]
      }
    });
    
    console.log('✅ تم إضافة البيانات بنجاح!');
    console.log('📍 تم إضافة الصف في:', result.data.updates.updatedRange);
    console.log('\nالآن يمكنك تحديث الصفحة وستجد "line test" يظهر بشكل صحيح.');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response) {
      console.error('التفاصيل:', error.response.data);
    }
  }
}

addDataRow();
