import { google } from 'googleapis';
import fs from 'fs';

async function checkColumnC() {
  try {
    const keyFileContent = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const keyFile = JSON.parse(keyFileContent);
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    // قراءة البند P-0000016 من صفحة تسعير العملاء
    console.log('📋 فحص البند P-0000016 في صفحة تسعير العملاء:');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'تسعير_العملاء!A:Q'
    });
    
    const rows = response.data.values || [];
    
    // البحث عن البند P-0000016
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === 'P-0000016') {
        console.log(`\nالصف ${i + 1} - البند P-0000016:`);
        console.log(`  العمود A (Item Number): ${rows[i][0] || 'فارغ'}`);
        console.log(`  العمود B (Part Number): ${rows[i][1] || 'فارغ'}`);
        console.log(`  العمود C (Description): ${rows[i][2] || 'فارغ'}`);
        console.log(`  العمود D (UOM): ${rows[i][3] || 'فارغ'}`);
        console.log(`  العمود E (Quantity): ${rows[i][4] || 'فارغ'}`);
        console.log(`  العمود F (RFQ Number): ${rows[i][5] || 'فارغ'}`);
        break;
      }
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkColumnC();
