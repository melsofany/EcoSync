import { google } from 'googleapis';
import fs from 'fs';

async function verifyChanges() {
  try {
    const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
    
    const jwtClient = new google.auth.JWT({
      email: keyFile.client_email,
      key: keyFile.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth: jwtClient });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    console.log('🔍 البحث في صفحة DATA عن P-0000016 مع 25R TEST:\n');
    
    // قراءة صفحة DATA
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:G'
    });
    
    const rows = response.data.values || [];
    let foundExactMatch = false;
    let allP16Records = [];
    
    // البحث عن جميع سجلات P-0000016
    for (let i = 0; i < rows.length; i++) {
      const itemNumber = (rows[i][0] || '').trim();
      const rfqNumber = (rows[i][5] || '').trim();
      const lineItem = rows[i][2] || '';
      
      if (itemNumber === 'P-0000016') {
        allP16Records.push({
          row: i + 1,
          rfq: rfqNumber,
          lineItem: lineItem
        });
        
        if (rfqNumber === '25R TEST') {
          foundExactMatch = true;
          console.log(`✅ وجدت P-0000016 مع 25R TEST في الصف ${i + 1}:`);
          console.log(`  LINE ITEM: "${lineItem}"`);
          console.log(`  الوحدة: ${rows[i][1] || ''}`);
          console.log(`  رقم القطعة: ${rows[i][3] || ''}`);
          console.log(`  الوصف: ${rows[i][4] || ''}\n`);
        }
      }
    }
    
    if (!foundExactMatch) {
      console.log('❌ لا يوجد P-0000016 مع 25R TEST في صفحة DATA\n');
      console.log('📋 جميع سجلات P-0000016 الموجودة:');
      allP16Records.forEach(record => {
        console.log(`  الصف ${record.row}: RFQ="${record.rfq}", LINE="${record.lineItem || 'فارغ'}"`);
      });
      
      console.log('\n💡 الحل: أضف صف جديد في صفحة DATA بهذه البيانات:');
      console.log('  العمود A: P-0000016');
      console.log('  العمود B: EACH');
      console.log('  العمود C: [القيمة المطلوبة لـ LINE ITEM]');
      console.log('  العمود D: LC1D32M7');
      console.log('  العمود E: كونتاكتور شنايدر');
      console.log('  العمود F: 25R TEST');
      console.log('  العمود G: 3');
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

verifyChanges();
