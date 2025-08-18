// Script to fix client name for RFQ 25R000057
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
    
    // Find the row with RFQ 25R000057 in طلبات_التسعير sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'طلبات_التسعير!A:H',
    });

    const rows = response.data.values || [];
    console.log(`📋 تم قراءة ${rows.length} صف من ورقة طلبات_التسعير`);
    
    // Find row with 25R000057
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === '25R000057') {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        console.log(`✅ تم العثور على الطلب 25R000057 في الصف ${rowIndex}`);
        console.log(`  - العميل الحالي: "${rows[i][2] || 'فارغ'}"`);
        break;
      }
    }
    
    if (rowIndex === -1) {
      console.log('⚠️ لم يتم العثور على الطلب 25R000057');
      return false;
    }
    
    // Update client name in column C
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `طلبات_التسعير!C${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['CARRIER']]
      }
    });
    
    console.log('✅ تم تحديث اسم العميل إلى: CARRIER');
    
    // Also update the date to today's date
    const today = new Date().toLocaleDateString('en-GB');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `طلبات_التسعير!B${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[today]]
      }
    });
    
    console.log(`✅ تم تحديث التاريخ إلى: ${today}`);
    
    // Verify the update
    const verifyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `طلبات_التسعير!A${rowIndex}:H${rowIndex}`,
    });
    
    const updatedRow = verifyResponse.data.values[0];
    console.log('\n📝 البيانات المحدثة:');
    console.log(`  - رقم الطلب: ${updatedRow[0]}`);
    console.log(`  - التاريخ: ${updatedRow[1]}`);
    console.log(`  - العميل: ${updatedRow[2]}`);
    console.log(`  - عدد الأصناف: ${updatedRow[3]}`);
    console.log(`  - الحالة: ${updatedRow[4]}`);
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث البيانات:', error);
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