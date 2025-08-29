const { google } = require('googleapis');
const fs = require('fs');

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
    console.log('📋 البحث في صفحة تسعير العملاء:');
    const customerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'تسعير_العملاء!A2:Q10'
    });
    
    const customerRows = customerResponse.data.values || [];
    customerRows.forEach((row, index) => {
      if (row[0] === 'P-0000016') {
        console.log(`  الصف ${index + 2}: Item=${row[0]}, RFQ=${row[5]}, LINE ITEM في تسعير العملاء=${row[2] || 'غير موجود'}`);
      }
    });
    
    // قراءة صفحة DATA
    console.log('\n📋 البحث في صفحة DATA:');
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A20:H35'
    });
    
    const dataRows = dataResponse.data.values || [];
    dataRows.forEach((row, index) => {
      if (row[0] === 'P-0000016') {
        console.log(`  الصف ${index + 20}: Item=${row[0]}, LINE ITEM=${row[2]}, RFQ=${row[5]}`);
      }
    });
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkData();
