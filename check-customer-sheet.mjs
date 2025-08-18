import { google } from 'googleapis';
import fs from 'fs';

async function checkSheetColumns() {
  try {
    const keyFileContent = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const keyFile = JSON.parse(keyFileContent);
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1rSg5dBLXP5y3WlIKk3Zcy7Wyv7-Hn9wTGaP-D87xUkM';
    
    // قراءة الصف الأول من صفحة تسعير العملاء للحصول على أسماء الأعمدة
    console.log('📋 فحص أعمدة صفحة تسعير العملاء:');
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'تسعير_العملاء!A1:Q1'
    });
    
    const headers = headerResponse.data.values?.[0] || [];
    headers.forEach((header, index) => {
      const columnLetter = String.fromCharCode(65 + index); // A, B, C...
      console.log(`  العمود ${columnLetter}: ${header || 'فارغ'}`);
    });
    
    // قراءة صف واحد من البيانات كمثال
    console.log('\n📋 مثال على البيانات (الصف الثاني):');
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'تسعير_العملاء!A2:Q2'
    });
    
    const dataRow = dataResponse.data.values?.[0] || [];
    dataRow.forEach((value, index) => {
      const columnLetter = String.fromCharCode(65 + index);
      console.log(`  العمود ${columnLetter}: ${value || 'فارغ'}`);
    });
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkSheetColumns();
