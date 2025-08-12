import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

async function testGoogleSheets() {
  try {
    console.log('📖 قراءة مفتاح الخدمة...');
    const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const credentials = JSON.parse(serviceAccountKey);
    
    console.log('✅ تم تحليل مفتاح JSON بنجاح');
    console.log('🔑 Project ID:', credentials.project_id);
    console.log('📧 Client Email:', credentials.client_email);
    
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    console.log('📊 قراءة بيانات Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A2:N10000'
    });

    const rows = response.data.values || [];
    console.log(`✅ تم قراءة ${rows.length} صف من Google Sheets`);
    
    let totalValue = 0;
    for (const row of rows) {
      if (row.length > 13 && row[13]) {
        const value = parseFloat(row[13].toString().replace(/[^\d.-]/g, ''));
        if (!isNaN(value)) {
          totalValue += value;
        }
      }
    }
    
    console.log(`💰 إجمالي القيمة: ${totalValue.toLocaleString()} ج.م`);
    console.log(`🎯 الهدف: ${(14006975).toLocaleString()} ج.م`);
    
    return {
      success: true,
      totalRows: rows.length,
      totalValue: totalValue,
      accuracyPercentage: totalValue === 14006975 ? 100 : 
        ((totalValue / 14006975) * 100).toFixed(2)
    };
    
  } catch (error) {
    console.error('❌ خطأ:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

testGoogleSheets().then(result => {
  console.log('🎯 النتيجة:', JSON.stringify(result, null, 2));
});