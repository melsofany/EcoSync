import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
const keyPath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
const credentials = JSON.parse(readFileSync(keyPath, 'utf8'));

const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

async function checkRowsData() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A2:AA'
    });
    
    const rows = response.data.values || [];
    console.log(`📊 إجمالي الصفوف: ${rows.length}`);
    
    // فحص الصفوف ذات أطوال مختلفة
    const lengthDistribution = {};
    let rfq25R000057Found = false;
    let rowWithRfq = -1;
    
    for (let i = 0; i < rows.length; i++) {
      const length = rows[i] ? rows[i].length : 0;
      lengthDistribution[length] = (lengthDistribution[length] || 0) + 1;
      
      // البحث عن 25R000057
      if (rows[i] && rows[i][5] === '25R000057') {
        rfq25R000057Found = true;
        rowWithRfq = i + 2;
        console.log(`✅ 25R000057 موجود في الصف ${rowWithRfq}`);
        console.log(`📋 البيانات: ${JSON.stringify(rows[i])}`);
      }
    }
    
    console.log('\n📊 توزيع أطوال الصفوف:');
    Object.keys(lengthDistribution).sort((a, b) => parseInt(a) - parseInt(b)).forEach(length => {
      console.log(`  - ${length} عمود: ${lengthDistribution[length]} صف`);
    });
    
    // فحص الصفوف الأولى والأخيرة
    console.log('\n📋 أول 3 صفوف:');
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      console.log(`  الصف ${i + 2}: ${rows[i] ? rows[i].length : 0} عمود - RFQ: ${rows[i] ? rows[i][5] : 'فارغ'}`);
    }
    
    console.log('\n📋 آخر 3 صفوف:');
    for (let i = Math.max(0, rows.length - 3); i < rows.length; i++) {
      console.log(`  الصف ${i + 2}: ${rows[i] ? rows[i].length : 0} عمود - RFQ: ${rows[i] ? rows[i][5] : 'فارغ'}`);
    }
    
    if (!rfq25R000057Found) {
      console.log('\n❌ 25R000057 غير موجود في البيانات');
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkRowsData();
