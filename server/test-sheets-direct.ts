import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export async function testGoogleSheetsConnection() {
  try {
    console.log('🔑 بدء اختبار الاتصال بـ Google Sheets...');
    
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // تهيئة Google Sheets
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not found');
    }

    console.log('📋 تحليل مفتاح الخدمة...');
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
      console.log('⚠️ لا توجد بيانات في الصفحة');
      return {
        success: true,
        totalRows: 0,
        totalValue: 0,
        message: 'صفحة DATA فارغة'
      };
    }

    let totalValue = 0;

    // حساب مجموع العمود N (العمود رقم 13)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length > 13 && row[13]) {
        const rawValue = row[13].toString();
        const value = parseFloat(rawValue.replace(/[^\d.-]/g, ''));
        if (!isNaN(value)) {
          totalValue += value;
          if (i < 5) { // عرض أول 5 قيم للفحص
            console.log(`📋 الصف ${i + 2}: العمود N = "${rawValue}" → ${value}`);
          }
        }
      }
    }

    // استخراج الإحصائيات
    const uniqueRFQs = new Set();
    const uniquePOs = new Set();
    
    for (const row of rows) {
      if (row[4]) uniqueRFQs.add(row[4]); // العمود E - RFQ NUMBER
      if (row[9]) uniquePOs.add(row[9]); // العمود J - PO NUMBER
    }

    const stats = {
      success: true,
      totalRows: rows.length,
      totalItems: rows.length,
      totalQuotations: uniqueRFQs.size,
      totalPurchaseOrders: uniquePOs.size,
      totalValue: totalValue,
      targetValue: 14006975,
      accuracyPercentage: totalValue === 14006975 ? 100 : 
        ((totalValue / 14006975) * 100).toFixed(2),
      formula: 'SUM(N2:N∞)',
      lastUpdated: new Date().toISOString()
    };

    console.log(`💰 إجمالي القيمة من Google Sheets: ${totalValue.toLocaleString()} ج.م`);
    console.log(`🎯 القيمة المستهدفة: ${(14006975).toLocaleString()} ج.م`);
    console.log(`📊 دقة المطابقة: ${stats.accuracyPercentage}%`);
    console.log(`📋 طلبات التسعير: ${stats.totalQuotations}`);
    console.log(`🛒 أوامر الشراء: ${stats.totalPurchaseOrders}`);

    return stats;
  } catch (error) {
    console.error('❌ خطأ في اختبار Google Sheets:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      totalValue: 0,
      targetValue: 14006975
    };
  }
}

// تشغيل الاختبار إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  testGoogleSheetsConnection().then(result => {
    console.log('\n🎯 نتيجة الاختبار:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}