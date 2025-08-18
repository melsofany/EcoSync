// Script to search for RFQ 25R000057 in Google Sheets
import { google } from 'googleapis';

async function searchRFQ() {
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
    
    // Search in DATA sheet (main data)
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // Search in column F (RFQ column) - الصحيح هو العمود F وليس G
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:F',
    });

    const rows = response.data.values || [];
    console.log(`📋 إجمالي الصفوف في DATA: ${rows.length}`);
    
    // Search for 25R000057
    let found = false;
    let count = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const rfqValue = rows[i][5]; // Column F (index 5) - العمود الصحيح لأرقام RFQ
      if (rfqValue && rfqValue.includes('25R000057')) {
        if (!found) {
          console.log(`\n✅ تم العثور على طلب التسعير 25R000057:`);
          found = true;
        }
        count++;
        console.log(`  السطر ${i + 1}: ${rfqValue}`);
        console.log(`    - LINE ITEM: ${rows[i][2] || 'فارغ'}`); // Column C
        console.log(`    - DESCRIPTION: ${rows[i][3] || 'فارغ'}`); // Column D
      }
    }
    
    if (!found) {
      console.log(`\n⚠️ لم يتم العثور على طلب التسعير 25R000057 في ورقة DATA`);
      
      // Search in طلبات_التسعير sheet
      console.log(`\n🔍 البحث في ورقة طلبات_التسعير...`);
      
      const rfqResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'طلبات_التسعير!A:Z',
      });

      const rfqRows = rfqResponse.data.values || [];
      console.log(`📋 إجمالي الصفوف في طلبات_التسعير: ${rfqRows.length}`);
      
      // Search for 25R000057 in first column (request number)
      for (let i = 1; i < rfqRows.length; i++) {
        const requestNumber = rfqRows[i][0]; // Column A
        if (requestNumber && requestNumber.includes('25R000057')) {
          console.log(`\n✅ تم العثور على طلب التسعير في ورقة طلبات_التسعير:`);
          console.log(`  السطر ${i + 1}:`);
          console.log(`    - رقم الطلب: ${requestNumber}`);
          console.log(`    - التاريخ: ${rfqRows[i][1] || 'فارغ'}`);
          console.log(`    - العميل: ${rfqRows[i][2] || 'فارغ'}`);
          console.log(`    - عدد الأصناف: ${rfqRows[i][3] || 'فارغ'}`);
          found = true;
          break;
        }
      }
    } else {
      console.log(`\n📊 إجمالي المرات: ${count} مرة`);
    }
    
    if (!found) {
      console.log(`\n❌ طلب التسعير 25R000057 غير موجود في أي ورقة`);
      console.log(`\n💡 اقتراحات:`);
      console.log(`  1. تأكد من رقم الطلب`);
      console.log(`  2. قد يكون الطلب محذوف أو لم يتم إدخاله بعد`);
      console.log(`  3. جرب البحث برقم مختلف`);
    }
    
    return found;
  } catch (error) {
    console.error('❌ خطأ في البحث:', error);
    return false;
  }
}

// Run the search
searchRFQ().then(() => {
  console.log('\n✨ اكتمل البحث');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل البحث:', error);
  process.exit(1);
});