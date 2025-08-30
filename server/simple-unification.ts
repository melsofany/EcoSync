import { writeFileSync, readFileSync } from 'fs';
import { google } from 'googleapis';

// خدمة التوحيد البسيط
class SimpleUnificationService {
  async initialize() {
    console.log('✅ تم تهيئة خدمة التوحيد البسيط');
    return true;
  }
  
  async run() {
    return runSimpleUnification();
  }
}

export const simpleUnificationService = new SimpleUnificationService();

// دالة توحيد بسيطة وقوية
export async function runSimpleUnification() {
  console.log('🚀 بدء التوحيد البسيط والقوي');
  
  const statusPath = './unification-status.json';
  
  // حالة أولية
  const status = {
    isRunning: true,
    isPaused: false,
    currentIndex: 0,
    totalItems: 0,
    processedItems: 0,
    unifiedItems: 0,
    percentage: 0,
    startTime: new Date().toISOString(),
    errorCount: 0,
    lastError: null
  };
  
  try {
    // إعداد Google Sheets
    const auth = new google.auth.GoogleAuth({
      keyFile: './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // قراءة البيانات
    console.log('📖 قراءة البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E' // الأعمدة المطلوبة فقط
    });
    
    const rows = response.data.values || [];
    console.log(`✅ تم قراءة ${rows.length} صف`);
    
    if (rows.length <= 1) {
      console.log('⚠️ لا توجد بيانات للمعالجة');
      status.isRunning = false;
      writeFileSync(statusPath, JSON.stringify(status, null, 2));
      return;
    }
    
    // إزالة رأس العمود
    const dataRows = rows.slice(1);
    status.totalItems = dataRows.length;
    console.log(`📊 بدء معالجة ${dataRows.length} عنصر`);
    
    // معالجة البيانات
    const groups = new Map(); // خريطة للمجموعات
    let nextId = 1;
    
    // دالة استخراج البراند
    const extractBrand = (text: any) => {
      if (!text) return '';
      const brands = [
        'TORNADO', 'TOSHIBA', 'SAMSUNG', 'OLYMPIC', 'ARISTON', 'CARRIER',
        'LG', 'SONY', 'PANASONIC', 'PHILIPS', 'BOSCH', 'SIEMENS',
        'WHIRLPOOL', 'ZANUSSI', 'HITACHI', 'MITSUBISHI', 'DAIKIN', 'GREE'
      ];
      const upperText = text.toUpperCase();
      for (const brand of brands) {
        if (upperText.includes(brand)) return brand;
      }
      return '';
    };
    
    // دالة استخراج المواصفات
    const extractSpecs = (text: any) => {
      if (!text) return '';
      const specs = [];
      
      // استخراج الأحجام
      const sizeMatch = text.match(/\d+\.?\d*\s*(INCH|"|LTR|L|MM|CM|M|KW|W|V|TON)/gi);
      if (sizeMatch) {
        specs.push(...sizeMatch.map((s: any) => s.toUpperCase().replace(/\s+/g, '')));
      }
      
      // استخراج أرقام الموديلات
      const modelMatch = text.match(/[A-Z]{2,}[\-]?\d+[A-Z]*/g);
      if (modelMatch) {
        specs.push(...modelMatch.filter((m: any) => m.length > 3 && m.length < 20));
      }
      
      return specs.join('_');
    };
    
    // معالجة كل صف
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const description = row[4] || row[2] || ''; // العمود E أو C
      const partNumber = row[1] || ''; // العمود B
      
      // إنشاء مفتاح للمجموعة
      let groupKey = '';
      
      if (partNumber && partNumber.length > 3) {
        // استخدم رقم الجزء إذا كان متاحاً
        groupKey = partNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
      } else if (description) {
        // استخدم البراند والمواصفات
        const brand = extractBrand(description);
        const specs = extractSpecs(description);
        
        if (brand && specs) {
          groupKey = `${brand}_${specs}`;
        } else if (brand) {
          groupKey = `${brand}_${description.substring(0, 30).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
        } else {
          // بدون براند، استخدم جزء من الوصف
          groupKey = `GENERIC_${i}`;
        }
      } else {
        // لا يوجد وصف أو رقم جزء
        groupKey = `ITEM_${i}`;
      }
      
      // إضافة إلى المجموعة
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: `P-${String(nextId++).padStart(7, '0')}`,
          rows: []
        });
      }
      
      groups.get(groupKey).rows.push(i + 2); // +2 لأن الصف يبدأ من 2 في Sheets
      
      // تحديث الحالة
      status.processedItems = i + 1;
      status.currentIndex = i;
      status.unifiedItems = groups.size;
      status.percentage = Math.round((status.processedItems / status.totalItems) * 100);
      
      // حفظ الحالة كل 100 عنصر
      if (i % 100 === 0) {
        writeFileSync(statusPath, JSON.stringify(status, null, 2));
        console.log(`📊 التقدم: ${status.processedItems}/${status.totalItems} (${status.percentage}%) - ${groups.size} مجموعة`);
        
        // تأخير صغير
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`✅ تم إنشاء ${groups.size} مجموعة من ${dataRows.length} عنصر`);
    
    // كتابة النتائج إلى Google Sheets
    console.log('📝 كتابة النتائج إلى Google Sheets...');
    
    const batchData = [];
    for (const [key, group] of groups) {
      for (const rowIndex of group.rows) {
        batchData.push({
          range: `DATA!A${rowIndex}`,
          values: [[group.id]]
        });
      }
    }
    
    // كتابة على دفعات
    const chunkSize = 500;
    for (let i = 0; i < batchData.length; i += chunkSize) {
      const chunk = batchData.slice(i, i + chunkSize);
      
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: chunk
        }
      });
      
      console.log(`✅ تم كتابة دفعة ${Math.floor(i/chunkSize) + 1} (${chunk.length} تحديث)`);
      
      // تأخير بين الدفعات
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // تحديث الحالة النهائية
    status.isRunning = false;
    status.percentage = 100;
    (status as any).endTime = new Date().toISOString();
    writeFileSync(statusPath, JSON.stringify(status, null, 2));
    
    console.log('🎉 انتهى التوحيد بنجاح!');
    console.log(`📊 النتائج النهائية:`);
    console.log(`   - عدد العناصر: ${dataRows.length}`);
    console.log(`   - عدد المجموعات: ${groups.size}`);
    console.log(`   - معدل التوحيد: ${((dataRows.length - groups.size) / dataRows.length * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ خطأ في التوحيد:', error);
    status.isRunning = false;
    status.errorCount++;
    status.lastError = (error as any).message || String(error);
    writeFileSync(statusPath, JSON.stringify(status, null, 2));
  }
}