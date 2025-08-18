import { google } from 'googleapis';
import fs from 'fs';

async function checkData() {
  try {
    const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
    
    const auth = new google.auth.JWT(
      keyFile.client_email,
      null,
      keyFile.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    console.log('🔍 البحث عن البند P-0000016 مع طلب التسعير 25R TEST:');
    console.log('========================================\n');
    
    // قراءة صفحة DATA
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:G'
    });
    
    const rows = response.data.values || [];
    let found = false;
    
    for (let i = 0; i < rows.length; i++) {
      const itemNumber = (rows[i][0] || '').trim();
      const rfqNumber = (rows[i][5] || '').trim();
      const lineItem = rows[i][2] || '';
      
      // البحث عن P-0000016 مع 25R TEST بالتحديد
      if (itemNumber === 'P-0000016' && rfqNumber === '25R TEST') {
        console.log(`✅ وجدت التطابق في الصف ${i + 1}:`);
        console.log(`  رقم البند: ${itemNumber}`);
        console.log(`  طلب التسعير: ${rfqNumber}`);
        console.log(`  LINE ITEM: "${lineItem}"`);
        console.log(`  الوحدة: ${rows[i][1] || ''}`);
        console.log(`  رقم القطعة: ${rows[i][3] || ''}`);
        console.log(`  الوصف: ${rows[i][4] || ''}\n`);
        found = true;
      }
    }
    
    if (!found) {
      console.log('❌ لم يتم العثور على P-0000016 مع 25R TEST في صفحة DATA\n');
      
      // عرض جميع سجلات P-0000016
      console.log('📋 جميع سجلات P-0000016 الموجودة:');
      for (let i = 0; i < rows.length; i++) {
        if ((rows[i][0] || '').trim() === 'P-0000016') {
          console.log(`  الصف ${i + 1}: RFQ="${rows[i][5]||''}", LINE="${rows[i][2]||'فارغ'}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkData();
