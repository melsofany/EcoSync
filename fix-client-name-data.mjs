// Script to add client name to RFQ 25R000057 in DATA sheet
import { google } from 'googleapis';

async function fixClientNameInData() {
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
    
    // Read DATA sheet to find rows with 25R000057
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:P', // قراءة من العمود A إلى P (يشمل اسم العميل)
    });

    const rows = response.data.values || [];
    console.log(`📋 تم قراءة ${rows.length} صف من ورقة DATA`);
    
    // Find rows with 25R000057 in column F
    const rowsToUpdate = [];
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const rfqNumber = rows[i][5]; // Column F (index 5)
      if (rfqNumber === '25R000057') {
        const rowNumber = i + 1; // +1 because sheets are 1-indexed
        const clientName = rows[i][15] || ''; // Column P (index 15)
        
        console.log(`✅ وجدت 25R000057 في الصف ${rowNumber}`);
        console.log(`  - LINE ITEM: ${rows[i][2] || 'فارغ'}`);
        console.log(`  - اسم العميل الحالي: "${clientName || 'فارغ'}"`);
        
        if (!clientName || clientName.trim() === '') {
          rowsToUpdate.push(rowNumber);
        }
      }
    }
    
    if (rowsToUpdate.length === 0) {
      console.log('✅ جميع الصفوف تحتوي بالفعل على أسماء عملاء');
      return true;
    }
    
    console.log(`\n📝 تحديث ${rowsToUpdate.length} صف...`);
    
    // Update client name in column P for each row
    for (const rowNumber of rowsToUpdate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `DATA!P${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['CARRIER']]
        }
      });
      
      console.log(`✅ تم تحديث الصف ${rowNumber} - اسم العميل: CARRIER`);
    }
    
    // Verify the updates
    console.log('\n🔍 التحقق من التحديثات...');
    const verifyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:P',
    });
    
    const updatedRows = verifyResponse.data.values || [];
    for (const rowNumber of rowsToUpdate) {
      const row = updatedRows[rowNumber - 1];
      console.log(`📋 الصف ${rowNumber}:`);
      console.log(`  - RFQ: ${row[5]}`);
      console.log(`  - LINE ITEM: ${row[2]}`);
      console.log(`  - اسم العميل: ${row[15]}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث البيانات:', error);
    return false;
  }
}

// Run the fix
fixClientNameInData().then(success => {
  if (success) {
    console.log('\n✨ تم التحديث بنجاح - قم بتحديث الصفحة لرؤية التغييرات');
  } else {
    console.log('\n❌ فشل التحديث');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ فشل:', error);
  process.exit(1);
});