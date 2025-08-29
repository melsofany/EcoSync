import { google } from 'googleapis';
import fs from 'fs';

async function checkLineItem() {
  try {
    const keyFileContent = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const keyFile = JSON.parse(keyFileContent);
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    console.log('🔍 البحث عن البند P-0000016 في صفحة DATA:');
    console.log('=====================================');
    
    // قراءة صفحة DATA
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:F'
    });
    
    const dataRows = dataResponse.data.values || [];
    let found = false;
    
    // البحث عن البند P-0000016
    for (let i = 0; i < dataRows.length; i++) {
      const itemNumber = dataRows[i][0] ? String(dataRows[i][0]).trim() : '';
      const rfqNumber = dataRows[i][1] ? String(dataRows[i][1]).trim() : '';
      
      if (itemNumber === 'P-0000016') {
        console.log(`\n✅ وجدت البند P-0000016 في الصف ${i + 1}:`);
        console.log(`  العمود A (Item Number): "${dataRows[i][0]}"`);
        console.log(`  العمود B (RFQ Number): "${dataRows[i][1]}"`);
        console.log(`  العمود C (LINE ITEM): "${dataRows[i][2] || 'فارغ'}"`);
        console.log(`  العمود D: "${dataRows[i][3] || 'فارغ'}"`);
        console.log(`  العمود E: "${dataRows[i][4] || 'فارغ'}"`);
        console.log(`  العمود F: "${dataRows[i][5] || 'فارغ'}"`);
        
        // تحقق من تطابق RFQ
        if (rfqNumber === '25R TEST') {
          console.log('\n🎯 تطابق تام مع 25R TEST!');
          found = true;
        } else {
          console.log(`\n⚠️ RFQ مختلف: "${rfqNumber}" بدلاً من "25R TEST"`);
        }
      }
    }
    
    if (!found) {
      console.log('\n❌ لم يتم العثور على البند P-0000016 مع RFQ "25R TEST" في صفحة DATA');
      
      // البحث عن أي بيانات تحتوي على P-0000016
      console.log('\n📋 جميع الصفوف التي تحتوي على P-0000016:');
      let count = 0;
      for (let i = 0; i < dataRows.length; i++) {
        if (dataRows[i][0] && dataRows[i][0].includes('P-0000016')) {
          count++;
          console.log(`الصف ${i + 1}: [${dataRows[i].slice(0, 4).join(' | ')}]`);
        }
      }
      if (count === 0) {
        console.log('لا توجد أي صفوف تحتوي على P-0000016');
      }
    }
    
    // التحقق أيضاً من صفحة تسعير العملاء
    console.log('\n\n🔍 التحقق من صفحة تسعير العملاء:');
    console.log('=====================================');
    
    const customerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'تسعير_العملاء!A:G'
    });
    
    const customerRows = customerResponse.data.values || [];
    
    for (let i = 0; i < customerRows.length; i++) {
      if (customerRows[i][0] === 'P-0000016') {
        console.log(`\n✅ وجدت البند في صفحة تسعير العملاء - الصف ${i + 1}:`);
        console.log(`  العمود A (Item Number): "${customerRows[i][0]}"`);
        console.log(`  العمود B (Part Number): "${customerRows[i][1] || 'فارغ'}"`);
        console.log(`  العمود C (Description): "${customerRows[i][2] || 'فارغ'}"`);
        console.log(`  العمود D (UOM): "${customerRows[i][3] || 'فارغ'}"`);
        console.log(`  العمود E (Quantity): "${customerRows[i][4] || 'فارغ'}"`);
        console.log(`  العمود F (RFQ Number): "${customerRows[i][5] || 'فارغ'}"`);
        console.log(`  العمود G (Client Name): "${customerRows[i][6] || 'فارغ'}"`);
        break;
      }
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkLineItem();
