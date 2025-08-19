import { google } from 'googleapis';
import * as fs from 'fs';

async function checkUsersSheet() {
  try {
    // قراءة ملف المفتاح
    const serviceAccountKey = JSON.parse(
      fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8')
    );

    // إنشاء عميل مصادقة
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

    // قراءة بيانات المستخدمين
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'USERS!A1:P5'
    });

    const rows = response.data.values || [];
    
    console.log('📋 بيانات ورقة USERS:');
    console.log('=====================================');
    
    rows.forEach((row, index) => {
      console.log(`\nالصف ${index + 1}:`);
      if (index === 0) {
        console.log('رؤوس الأعمدة:');
        row.forEach((cell, cellIndex) => {
          const colLetter = String.fromCharCode(65 + cellIndex);
          console.log(`  العمود ${colLetter}: ${cell}`);
        });
      } else {
        console.log(`المستخدم: ${row[1] || 'غير محدد'}`);
        row.forEach((cell, cellIndex) => {
          const colLetter = String.fromCharCode(65 + cellIndex);
          const headers = rows[0];
          const header = headers[cellIndex] || '';
          
          if (cell) {
            if (cell.startsWith('data:image/')) {
              console.log(`  ${colLetter} (${header}): صورة Base64 (${cell.length} حرف)`);
            } else if (cell.length > 50) {
              console.log(`  ${colLetter} (${header}): ${cell.substring(0, 50)}...`);
            } else {
              console.log(`  ${colLetter} (${header}): ${cell}`);
            }
          }
        });
      }
    });

    console.log('\n=====================================');
    console.log('✅ تم التحقق من البيانات بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

checkUsersSheet();