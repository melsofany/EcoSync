import { google } from 'googleapis';
import { readFileSync } from 'fs';

async function testWriteRange() {
  try {
    console.log('🧪 اختبار كتابة نطاق من المعرفات...');
    
    const credentials = JSON.parse(readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e.json', 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

    // كتابة نطاق من المعرفات للتأكد من أن النظام يعمل
    console.log('✍️ كتابة نطاق اختبار A10:A15...');
    
    const testData = [
      ['TEST-010'],
      ['TEST-011'],
      ['TEST-012'],
      ['TEST-013'],
      ['TEST-014'],
      ['TEST-015']
    ];

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'DATA!A10:A15',
      valueInputOption: 'RAW',
      resource: {
        values: testData
      }
    });

    console.log('✅ نتيجة الكتابة:', result.data.updatedCells, 'خلية');

    // انتظار ثانيتين ثم قراءة النتيجة
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 قراءة النتائج...');
    const readResult = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A10:A15'
    });
    
    console.log('📋 النتائج:', readResult.data.values);

    // إعادة المعرفات الأصلية
    const originalData = [
      ['P-0000010'],
      ['P-0000011'],
      ['P-0000012'],
      ['P-0000013'],
      ['P-0000014'],
      ['P-0000015']
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'DATA!A10:A15',
      valueInputOption: 'RAW',
      resource: {
        values: originalData
      }
    });

    console.log('↩️ تم إعادة المعرفات الأصلية');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testWriteRange();