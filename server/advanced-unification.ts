import { writeFileSync } from 'fs';
import { google } from 'googleapis';

export async function runAdvancedUnification() {
  console.log('🚀 بدء التوحيد الذكي المتقدم');
  
  const statusPath = './unification-status.json';
  
  // حالة أولية
  const status: any = {
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
      range: 'DATA!A:E' // الأعمدة المطلوبة
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
    
    // خريطة للمنتجات الفريدة
    const uniqueProducts = new Map();
    let nextId = 1;
    
    // معالجة كل صف
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const lineItem = row[2] || ''; // العمود C - LINE ITEM
      const partNumber = row[1] || ''; // العمود B - PART NO
      const description = row[4] || ''; // العمود E - DESCRIPTION
      
      // إنشاء مفتاح فريد للمنتج
      let productKey = '';
      
      // أولاً: استخدم LINE ITEM إذا كان متاحاً
      if (lineItem && lineItem.trim().length > 0) {
        productKey = lineItem.trim().toUpperCase();
      }
      // ثانياً: استخدم PART NUMBER إذا كان متاحاً
      else if (partNumber && partNumber.trim().length > 0) {
        productKey = partNumber.trim().toUpperCase();
      }
      // ثالثاً: استخدم الوصف مع التنظيف
      else if (description) {
        // تنظيف الوصف من الأحرف الخاصة والمسافات الزائدة
        const cleanDesc = description
          .toUpperCase()
          .replace(/[^\w\s]/g, ' ') // إزالة الأحرف الخاصة
          .replace(/\s+/g, ' ') // استبدال المسافات المتعددة بمسافة واحدة
          .trim();
        
        // استخراج المعلومات المهمة من الوصف
        const important = extractImportantInfo(cleanDesc);
        productKey = important || `DESC_${i}`;
      }
      // رابعاً: استخدم رقم الصف كمفتاح أخير
      else {
        productKey = `ROW_${i}`;
      }
      
      // التحقق من وجود المنتج
      if (!uniqueProducts.has(productKey)) {
        // منتج جديد - أعطه معرف فريد
        const unifiedId = `P-${String(nextId++).padStart(7, '0')}`;
        uniqueProducts.set(productKey, {
          id: unifiedId,
          rows: [],
          description: description || partNumber || lineItem || `Item ${i}`,
          count: 0
        });
        
        console.log(`🆕 منتج جديد #${nextId - 1}: ${productKey.substring(0, 50)}...`);
      }
      
      // إضافة الصف إلى المنتج
      const product = uniqueProducts.get(productKey);
      product.rows.push(i + 2); // +2 لأن الصف يبدأ من 2 في Sheets
      product.count++;
      
      // تحديث الحالة
      status.processedItems = i + 1;
      status.currentIndex = i;
      status.unifiedItems = uniqueProducts.size;
      status.percentage = Math.round((status.processedItems / status.totalItems) * 100);
      
      // حفظ الحالة كل 50 عنصر
      if (i % 50 === 0) {
        writeFileSync(statusPath, JSON.stringify(status, null, 2));
        console.log(`📊 التقدم: ${status.processedItems}/${status.totalItems} (${status.percentage}%) - ${uniqueProducts.size} منتج فريد`);
        
        // تأخير صغير
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    
    console.log(`\n✅ النتائج النهائية:`);
    console.log(`   📦 عدد المنتجات الفريدة: ${uniqueProducts.size}`);
    console.log(`   📋 إجمالي الصفوف: ${dataRows.length}`);
    console.log(`   📈 معدل التوحيد: ${((dataRows.length - uniqueProducts.size) / dataRows.length * 100).toFixed(1)}%`);
    
    // طباعة أمثلة على المنتجات
    console.log(`\n📦 أمثلة على المنتجات الموحدة:`);
    let examples = 0;
    for (const [key, product] of uniqueProducts) {
      if (product.count > 1) {
        console.log(`   ${product.id}: ${product.count} صف - ${product.description.substring(0, 60)}...`);
        examples++;
        if (examples >= 10) break;
      }
    }
    
    // كتابة النتائج إلى Google Sheets
    console.log('\n📝 كتابة المعرفات الموحدة إلى Google Sheets...');
    
    const batchData = [];
    for (const [key, product] of uniqueProducts) {
      for (const rowIndex of product.rows) {
        batchData.push({
          range: `DATA!A${rowIndex}`,
          values: [[product.id]]
        });
      }
    }
    
    // كتابة على دفعات
    const chunkSize = 1000;
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
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // تحديث الحالة النهائية
    status.isRunning = false;
    status.percentage = 100;
    status.endTime = new Date().toISOString();
    writeFileSync(statusPath, JSON.stringify(status, null, 2));
    
    console.log('\n🎉 انتهى التوحيد المتقدم بنجاح!');
    console.log(`✅ تم إنشاء ${uniqueProducts.size} معرف فريد من ${dataRows.length} صف`);
    
  } catch (error: any) {
    console.error('❌ خطأ في التوحيد:', error);
    status.isRunning = false;
    status.errorCount++;
    status.lastError = error.message || String(error);
    writeFileSync(statusPath, JSON.stringify(status, null, 2));
  }
}

// دالة استخراج المعلومات المهمة من الوصف
function extractImportantInfo(text: string): string {
  if (!text) return '';
  
  // قائمة الكلمات المهمة للتعريف
  const keywords = [
    // المنتجات
    'BRACKET', 'BATTERY', 'HOT PLATE', 'THERMOSTAT', 'HEATER',
    'TV', 'LED', 'WATER HEATER', 'CONTACTOR', 'SWITCH',
    'GASKET', 'CABLE', 'LNB', 'DISH', 'RECEIVER', 'FAN',
    'VACUUM', 'BLENDER', 'COOKER', 'OVEN', 'REFRIGERATOR',
    
    // البراندات
    'CARRIER', 'ENERGIZER', 'BRENNENSTUHL', 'EGO', 'DIXELL',
    'TORNADO', 'TOSHIBA', 'SAMSUNG', 'OLYMPIC', 'ARISTON',
    'SCHNEIDER', 'TELEMECANIQUE', 'BRAUN', 'CROWN', 'ASTRA',
    
    // المواصفات
    'LEFT', 'RIGHT', 'UPPER', 'LOWER', 'FRONT', 'BACK',
    'AA', 'AAA', '1.5V', '220V', '380V',
    '16 INCH', '30x30', '32"', '43"', '50"', '55"',
    '30 LTR', '40 LTR', '50 LTR', '100 LITERS',
    '1KW', '2KW', '3KW', '1300 WATT', '1950 KW',
    
    // أرقام الموديلات
    'LC1D', 'XR10CX', 'P/N', 'MODEL'
  ];
  
  // استخراج الكلمات المهمة
  const foundKeywords = [];
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }
  
  // استخراج الأرقام المهمة (موديلات، أحجام)
  const numbers = text.match(/\d+[\.\d]*\s*(INCH|LTR|LITER|WATT|KW|V|VOLT|MM|CM)/gi);
  if (numbers) {
    foundKeywords.push(...numbers);
  }
  
  // استخراج أرقام الموديلات
  const models = text.match(/[A-Z]{2,}[\-\s]?\d+[A-Z\d]*/g);
  if (models) {
    foundKeywords.push(...models.filter(m => m.length > 3 && m.length < 20));
  }
  
  // دمج الكلمات المهمة
  return foundKeywords.slice(0, 5).join('_');
}