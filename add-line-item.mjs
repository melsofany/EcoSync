import { google } from 'googleapis';
import fs from 'fs';

async function addLineItem() {
  try {
    const keyFileContent = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const keyFile = JSON.parse(keyFileContent);
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    // البيانات الجديدة للإضافة
    const newRow = [
      'P-0000016',     // العمود A - Item Number
      'EACH',          // العمود B - UOM
      'line test',     // العمود C - LINE ITEM
      'LC1D32M7',      // العمود D - Part Number
      'كونتاكتور شنايدر', // العمود E - Description
      '25R TEST',      // العمود F - RFQ Number
      '3'              // العمود G - Quantity
    ];
    
    console.log('🔄 إضافة صف جديد في صفحة DATA...');
    console.log(`  البند: P-0000016`);
    console.log(`  LINE ITEM: line test`);
    console.log(`  طلب التسعير: 25R TEST`);
    
    // إضافة الصف الجديد
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'DATA!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });
    
    console.log('✅ تم إضافة الصف بنجاح!');
    console.log('📋 الآن LINE ITEM "line test" سيظهر للبند P-0000016 مع طلب التسعير 25R TEST');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

addLineItem();
