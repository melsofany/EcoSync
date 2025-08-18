// Script to find and fix client name for RFQ 25R000057
import { google } from 'googleapis';

async function fixClientName() {
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
    console.log('\n📋 الأوراق المتاحة:');
    
    // Find quotations sheet  
    let quotationsSheet = null;
    for (const sheet of sheetsList) {
      const title = sheet.properties.title;
      console.log(`  - ${title} (ID: ${sheet.properties.sheetId})`);
      
      // Look for quotations sheet by various names
      if (title.includes('طلبات') || title.includes('تسعير') || 
          title === 'QUOTATIONS' || title === 'RFQ' ||
          title === 'quotations' || title === 'Quotations') {
        quotationsSheet = sheet;
      }
    }
    
    if (!quotationsSheet) {
      console.log('\n⚠️ لم يتم العثور على ورقة طلبات التسعير');
      return false;
    }
    
    console.log(`\n✅ تم العثور على ورقة طلبات التسعير: ${quotationsSheet.properties.title}`);
    const sheetName = quotationsSheet.properties.title;
    
    // Try to get data using sheet ID instead of name (to avoid encoding issues)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:H`,
    });

    const rows = response.data.values || [];
    console.log(`📋 تم قراءة ${rows.length} صف من الورقة`);
    
    // Find row with 25R000057
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === '25R000057') {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        console.log(`\n✅ تم العثور على الطلب 25R000057 في الصف ${rowIndex}`);
        console.log(`  البيانات الحالية:`);
        console.log(`    - رقم الطلب: ${rows[i][0]}`);
        console.log(`    - التاريخ: ${rows[i][1] || 'فارغ'}`);
        console.log(`    - العميل: ${rows[i][2] || 'فارغ'}`);
        console.log(`    - عدد الأصناف: ${rows[i][3] || 'فارغ'}`);
        console.log(`    - الحالة: ${rows[i][4] || 'فارغ'}`);
        break;
      }
    }
    
    if (rowIndex === -1) {
      console.log('\n⚠️ لم يتم العثور على الطلب 25R000057');
      return false;
    }
    
    // Update client name and date
    const today = new Date().toLocaleDateString('en-GB');
    const updateRange = `'${sheetName}'!B${rowIndex}:C${rowIndex}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[today, 'CARRIER']]
      }
    });
    
    console.log('\n✅ تم التحديث:');
    console.log(`  - التاريخ: ${today}`);
    console.log(`  - العميل: CARRIER`);
    
    // Verify the update
    const verifyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A${rowIndex}:H${rowIndex}`,
    });
    
    const updatedRow = verifyResponse.data.values[0];
    console.log('\n📝 البيانات بعد التحديث:');
    console.log(`  - رقم الطلب: ${updatedRow[0]}`);
    console.log(`  - التاريخ: ${updatedRow[1]}`);
    console.log(`  - العميل: ${updatedRow[2]}`);
    console.log(`  - عدد الأصناف: ${updatedRow[3]}`);
    console.log(`  - الحالة: ${updatedRow[4]}`);
    
    return true;
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    if (error.response && error.response.data) {
      console.error('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Run the fix
fixClientName().then(success => {
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