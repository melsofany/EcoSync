// Script to list all unique RFQs in Google Sheets
import { google } from 'googleapis';

async function listAllRFQs() {
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
    
    // Get all RFQ data from column G
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!G:G',
    });

    const rows = response.data.values || [];
    console.log(`📋 إجمالي الصفوف في DATA: ${rows.length}`);
    
    // Collect all unique RFQs
    const rfqSet = new Set();
    
    for (let i = 1; i < rows.length; i++) {
      const rfqValue = rows[i][0];
      if (rfqValue) {
        // Split by comma to handle multiple RFQs in one cell
        const rfqList = rfqValue.split(',').map(r => r.trim());
        rfqList.forEach(rfq => {
          if (rfq.startsWith('25R')) {
            rfqSet.add(rfq);
          }
        });
      }
    }
    
    // Convert to array and sort
    const sortedRFQs = Array.from(rfqSet).sort();
    
    if (sortedRFQs.length > 0) {
      console.log(`\n✅ إجمالي طلبات التسعير الفريدة: ${sortedRFQs.length}`);
      console.log(`\n📊 نطاق الأرقام:`);
      console.log(`  - أول طلب: ${sortedRFQs[0]}`);
      console.log(`  - آخر طلب: ${sortedRFQs[sortedRFQs.length - 1]}`);
      
      // Find RFQs near 25R000057
      console.log(`\n🔍 البحث عن طلبات قريبة من 25R000057:`);
      
      // Look for RFQs that start with 25R00005
      const nearbyRFQs = sortedRFQs.filter(rfq => rfq.startsWith('25R00005'));
      if (nearbyRFQs.length > 0) {
        console.log(`\n✅ طلبات تبدأ بـ 25R00005:`);
        nearbyRFQs.forEach(rfq => {
          console.log(`  - ${rfq}`);
        });
      } else {
        console.log(`  ⚠️ لا توجد طلبات تبدأ بـ 25R00005`);
      }
      
      // Look for RFQs in the 25R00006x range
      const range6x = sortedRFQs.filter(rfq => rfq.startsWith('25R00006'));
      if (range6x.length > 0) {
        console.log(`\n📋 طلبات في نطاق 25R00006x (أول 10):`);
        range6x.slice(0, 10).forEach(rfq => {
          console.log(`  - ${rfq}`);
        });
      }
      
      // Look for RFQs in the 25R00004x range
      const range4x = sortedRFQs.filter(rfq => rfq.startsWith('25R00004'));
      if (range4x.length > 0) {
        console.log(`\n📋 طلبات في نطاق 25R00004x (آخر 10):`);
        range4x.slice(-10).forEach(rfq => {
          console.log(`  - ${rfq}`);
        });
      }
      
      // Show first 20 RFQs
      console.log(`\n📋 أول 20 طلب تسعير:`);
      sortedRFQs.slice(0, 20).forEach(rfq => {
        console.log(`  - ${rfq}`);
      });
      
      // Show if 25R000057 exists
      if (rfqSet.has('25R000057')) {
        console.log(`\n✅ الطلب 25R000057 موجود في النظام`);
      } else {
        console.log(`\n❌ الطلب 25R000057 غير موجود في النظام`);
        console.log(`\n💡 اقتراحات:`);
        console.log(`  1. تأكد من رقم الطلب الصحيح`);
        console.log(`  2. قد يكون الطلب لم يتم إدخاله بعد`);
        console.log(`  3. استخدم أحد الأرقام الموجودة أعلاه`);
      }
    } else {
      console.log(`\n⚠️ لا توجد طلبات تسعير في النظام`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في البحث:', error.message);
    return false;
  }
}

// Run the search
listAllRFQs().then(() => {
  console.log('\n✨ اكتمل البحث');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل البحث:', error);
  process.exit(1);
});