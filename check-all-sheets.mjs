// Script to check all sheets and find RFQ 25R000057
import { google } from 'googleapis';

async function checkAllSheets() {
  try {
    // Read credentials from local JSON file
    const fs = await import('fs');
    const credentialsFile = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const credentials = JSON.parse(credentialsFile);
    console.log('✅ تم تحميل المفتاح من الملف المحلي');
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // Get list of all sheets
    const sheetsInfo = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties'
    });
    
    const sheetsList = sheetsInfo.data.sheets || [];
    console.log('\n📋 جميع الأوراق في الملف:');
    
    for (const sheet of sheetsList) {
      const title = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      console.log(`\n📄 ورقة: ${title} (ID: ${sheetId})`);
      
      try {
        // Try to read first few rows from each sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${title}'!A1:H10`,
        });
        
        const rows = response.data.values || [];
        
        // Check if this sheet contains RFQ 25R000057
        let found = false;
        for (let i = 0; i < rows.length; i++) {
          for (let j = 0; j < (rows[i] || []).length; j++) {
            if (rows[i][j] && rows[i][j].toString().includes('25R000057')) {
              found = true;
              console.log(`  ✅ تم العثور على 25R000057 في الصف ${i + 1}, العمود ${String.fromCharCode(65 + j)}`);
              console.log(`     البيانات الكاملة للصف:`);
              for (let k = 0; k < Math.min(8, rows[i].length); k++) {
                const colName = String.fromCharCode(65 + k);
                console.log(`       ${colName}: ${rows[i][k] || 'فارغ'}`);
              }
            }
          }
        }
        
        if (!found && rows.length > 0) {
          // Show headers if no RFQ found
          if (rows[0]) {
            console.log(`  رؤوس الأعمدة: ${rows[0].slice(0, 8).join(' | ')}`);
          }
          console.log(`  عدد الصفوف: ${rows.length}`);
        }
        
      } catch (error) {
        console.log(`  ⚠️ لا يمكن قراءة البيانات: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    return false;
  }
}

// Run the check
checkAllSheets().then(success => {
  console.log('\n✨ انتهى الفحص');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ فشل:', error);
  process.exit(1);
});