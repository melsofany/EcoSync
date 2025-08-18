import { google } from 'googleapis';
import fs from 'fs';

async function checkExactData() {
  try {
    const keyFileContent = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const keyFile = JSON.parse(keyFileContent);
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    console.log('🔍 البحث عن "line test" في صفحة DATA:');
    console.log('=====================================\n');
    
    // قراءة صفحة DATA بالكامل
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:G'
    });
    
    const dataRows = dataResponse.data.values || [];
    let foundLineTest = false;
    let found25RTest = false;
    
    // البحث عن "line test" في أي مكان
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowString = JSON.stringify(row).toLowerCase();
      
      // البحث عن "line test"
      if (rowString.includes('line test') || rowString.includes('line  test')) {
        console.log(`✅ وجدت "line test" في الصف ${i + 1}:`);
        console.log(`  البيانات الكاملة: [${row.join(' | ')}]`);
        console.log(`  العمود A (Item): "${row[0] || ''}"`);
        console.log(`  العمود B: "${row[1] || ''}"`); 
        console.log(`  العمود C (LINE ITEM): "${row[2] || ''}"`);
        console.log(`  العمود D: "${row[3] || ''}"`);
        console.log(`  العمود E: "${row[4] || ''}"`);
        console.log(`  العمود F (RFQ): "${row[5] || ''}"`);
        console.log(`  العمود G: "${row[6] || ''}"\n`);
        foundLineTest = true;
      }
      
      // البحث عن "25R TEST"
      if (row[5] && row[5].toString().includes('25R TEST')) {
        console.log(`📌 وجدت RFQ "25R TEST" في الصف ${i + 1}:`);
        console.log(`  العمود A (Item): "${row[0] || ''}"`);
        console.log(`  العمود C (LINE ITEM): "${row[2] || ''}"`);
        console.log(`  العمود F (RFQ): "${row[5] || ''}"\n`);
        found25RTest = true;
      }
    }
    
    if (!foundLineTest) {
      console.log('❌ لم يتم العثور على "line test" في أي مكان في صفحة DATA');
    }
    
    if (!found25RTest) {
      console.log('❌ لم يتم العثور على RFQ "25R TEST" في صفحة DATA');
    }
    
    // البحث عن P-0000016 مع أي قيمة LINE ITEM
    console.log('\n📋 جميع سجلات P-0000016 في صفحة DATA:');
    console.log('=====================================');
    let p16Count = 0;
    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][0] === 'P-0000016') {
        p16Count++;
        console.log(`الصف ${i + 1}: Item="${dataRows[i][0]}", LINE="${dataRows[i][2] || 'فارغ'}", RFQ="${dataRows[i][5] || 'فارغ'}"`);
      }
    }
    if (p16Count === 0) {
      console.log('لا توجد أي سجلات لـ P-0000016');
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkExactData();
