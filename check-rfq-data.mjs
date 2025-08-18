import { google } from 'googleapis';
import fs from 'fs';

async function checkData() {
  try {
    const keyFileContent = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const keyFile = JSON.parse(keyFileContent);
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    // قراءة صفحة تسعير العملاء
    console.log('📋 البحث في صفحة تسعير العملاء عن P-0000016:');
    const customerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'تسعير_العملاء!A2:Q10'
    });
    
    const customerRows = customerResponse.data.values || [];
    customerRows.forEach((row, index) => {
      if (row[0] === 'P-0000016') {
        console.log(`  الصف ${index + 2}: Item=${row[0]}, RFQ=${row[5]}, LINE ITEM=${row[2] || 'غير موجود'}`);
      }
    });
    
    // قراءة صفحة DATA - البحث في نطاق أوسع
    console.log('\n📋 البحث في صفحة DATA عن P-0000016:');
    console.log('البحث عن جميع السجلات التي تحتوي على P-0000016...');
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A2:H100' // نطاق أوسع
    });
    
    const dataRows = dataResponse.data.values || [];
    let found = false;
    dataRows.forEach((row, index) => {
      if (row[0] === 'P-0000016') {
        found = true;
        console.log(`  الصف ${index + 2}: Item=${row[0]}, LINE ITEM=${row[2] || 'فارغ'}, PART=${row[3]}, RFQ=${row[5] || 'فارغ'}`);
      }
    });
    
    if (!found) {
      console.log('  ⚠️ لم يتم العثور على P-0000016 في صفحة DATA');
    }
    
    // البحث عن أي طلب يحتوي على "25R"
    console.log('\n📋 جميع الطلبات التي تحتوي على "25R" في DATA:');
    dataRows.forEach((row, index) => {
      if (row[5] && row[5].includes('25R')) {
        console.log(`  الصف ${index + 2}: Item=${row[0]}, RFQ=${row[5]}, LINE ITEM=${row[2] || 'فارغ'}`);
      }
    });
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkData();
