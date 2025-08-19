import { google } from 'googleapis';
import { readFileSync } from 'fs';

const credentials = JSON.parse(readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1rwRsOQgG7Mb84R9JiMKVqaLa8kUsoAYg4WGPJdQWLJU';

// قراءة الصف 5451 (البند 6666.555) مع كل الأعمدة
const response = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: 'DATA!A5451:AA5451' // قراءة كل الأعمدة
});

const row = response.data.values?.[0] || [];

console.log('📊 بيانات الصف 5451 (البند 6666.555):');
console.log('═══════════════════════════════════════');
for (let i = 0; i < Math.min(row.length, 27); i++) {
  const columnLetter = String.fromCharCode(65 + i); // A, B, C, etc.
  const value = row[i] || '(فارغ)';
  console.log(`العمود ${columnLetter} [${i}]: ${value}`);
  
  // تحديد التوصيف إذا وجد
  if (value && value.length > 20 && !value.includes('25R') && !value.match(/^\d+$/)) {
    console.log(`   ⬆️ قد يكون هذا التوصيف`);
  }
}

console.log('\n📍 التوصيف المتوقع في العمود E [4]:', row[4] || '(فارغ)');