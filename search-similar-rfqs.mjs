// Script to search for RFQs similar to 25R000057
import { google } from 'googleapis';

async function searchSimilarRFQs() {
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
    console.log(`📋 إجمالي الصفوف: ${rows.length}`);
    
    // Find all unique RFQs that start with 25R00005
    const rfqSet = new Set();
    
    for (let i = 1; i < rows.length; i++) {
      const rfqValue = rows[i][0];
      if (rfqValue && rfqValue.includes('25R00005')) {
        // Split by comma to handle multiple RFQs in one cell
        const rfqList = rfqValue.split(',').map(r => r.trim());
        rfqList.forEach(rfq => {
          if (rfq.startsWith('25R00005')) {
            rfqSet.add(rfq);
          }
        });
      }
    }
    
    // Sort RFQs
    const sortedRFQs = Array.from(rfqSet).sort();
    
    if (sortedRFQs.length > 0) {
      console.log(`\n✅ وجدت ${sortedRFQs.length} طلبات تسعير تبدأ بـ 25R00005:`);
      sortedRFQs.forEach(rfq => {
        console.log(`  - ${rfq}`);
      });
      
      console.log(`\n💡 ملاحظة: الطلب 25R000057 غير موجود`);
      console.log(`   الطلبات الموجودة في هذا النطاق هي: ${sortedRFQs.join(', ')}`);
    } else {
      console.log(`\n⚠️ لا توجد طلبات تسعير تبدأ بـ 25R00005`);
      
      // Search for similar numbers (25R00004x, 25R00006x)
      const alternativeRFQs = new Set();
      for (let i = 1; i < rows.length; i++) {
        const rfqValue = rows[i][0];
        if (rfqValue && (rfqValue.includes('25R00004') || rfqValue.includes('25R00006'))) {
          const rfqList = rfqValue.split(',').map(r => r.trim());
          rfqList.forEach(rfq => {
            if (rfq.startsWith('25R00004') || rfq.startsWith('25R00006')) {
              alternativeRFQs.add(rfq);
            }
          });
        }
      }
      
      const sortedAlternatives = Array.from(alternativeRFQs).sort();
      if (sortedAlternatives.length > 0) {
        console.log(`\n💡 طلبات قريبة من 25R000057:`);
        sortedAlternatives.slice(0, 10).forEach(rfq => {
          console.log(`  - ${rfq}`);
        });
      }
    }
    
    // Find the lowest and highest RFQ numbers
    const allRFQs = new Set();
    for (let i = 1; i < rows.length; i++) {
      const rfqValue = rows[i][0];
      if (rfqValue) {
        const rfqList = rfqValue.split(',').map(r => r.trim());
        rfqList.forEach(rfq => {
          if (rfq.startsWith('25R')) {
            allRFQs.add(rfq);
          }
        });
      }
    }
    
    const allSorted = Array.from(allRFQs).sort();
    if (allSorted.length > 0) {
      console.log(`\n📊 نطاق أرقام الطلبات:`);
      console.log(`  - أول طلب: ${allSorted[0]}`);
      console.log(`  - آخر طلب: ${allSorted[allSorted.length - 1]}`);
      console.log(`  - إجمالي الطلبات الفريدة: ${allSorted.length}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في البحث:', error.message);
    return false;
  }
}

// Run the search
searchSimilarRFQs().then(() => {
  console.log('\n✨ اكتمل البحث');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل البحث:', error);
  process.exit(1);
});