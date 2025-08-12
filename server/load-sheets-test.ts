import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

export async function loadSheetsTest() {
  try {
    console.log('🔑 بدء اختبار تحميل Google Sheets...');
    
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // قراءة مفتاح الخدمة من الملف
    const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const credentials = JSON.parse(serviceAccountKey);
    
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ تم تهيئة Google Sheets API');

    // قراءة البيانات من صفحة DATA بدءاً من الصف 2
    console.log('📖 قراءة البيانات من الصفحة DATA...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A2:N10000'
    });

    const rows = response.data.values || [];
    console.log(`📊 تم قراءة ${rows.length} صف من Google Sheets`);

    if (rows.length === 0) {
      console.log('⚠️ صفحة DATA فارغة - يجب إضافة البيانات في Google Sheets');
      return {
        success: true,
        totalRows: 0,
        totalValue: 0,
        message: 'صفحة DATA فارغة - انتظار البيانات'
      };
    }

    // حساب مجموع العمود N (العمود رقم 13)
    let totalValue = 0;
    for (const row of rows) {
      if (row.length > 13 && row[13]) {
        const value = parseFloat(row[13].toString().replace(/[^\d.-]/g, ''));
        if (!isNaN(value)) {
          totalValue += value;
        }
      }
    }

    const result = {
      success: true,
      totalRows: rows.length,
      totalValue: totalValue,
      targetValue: 14006975,
      accuracyPercentage: totalValue === 14006975 ? 100 : 
        ((totalValue / 14006975) * 100).toFixed(2),
      formula: 'SUM(N2:N∞)',
      message: totalValue === 14006975 ? 'القيمة صحيحة 100%' : 'انتظار البيانات الكاملة'
    };

    console.log(`💰 إجمالي القيمة: ${totalValue.toLocaleString()} ج.م`);
    console.log(`🎯 الهدف: ${(14006975).toLocaleString()} ج.م`);
    console.log(`📊 دقة المطابقة: ${result.accuracyPercentage}%`);

    return result;
  } catch (error) {
    console.error('❌ خطأ في تحميل Google Sheets:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      totalValue: 0,
      targetValue: 14006975,
      message: 'خطأ في الاتصال'
    };
  }
}

// تشغيل الاختبار
if (import.meta.url === `file://${process.argv[1]}`) {
  loadSheetsTest().then(result => {
    console.log('\n🎯 نتيجة التحميل:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}