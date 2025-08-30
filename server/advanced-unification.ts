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
      const lineItem = (row[2] || '').trim().toUpperCase(); // العمود C - LINE ITEM
      const partNumber = (row[3] || '').trim().toUpperCase(); // العمود D - PART NO  
      const description = (row[4] || '').trim().toUpperCase(); // العمود E - DESCRIPTION
      
      // إنشاء مفتاح ذكي للمنتج
      let productKey = createSmartProductKey(lineItem, partNumber, description);
      
      // البحث عن منتج مطابق بذكاء
      let matchFound = false;
      for (const [existingKey, product] of uniqueProducts) {
        // مقارنة ذكية للمنتجات
        if (areProductsSimilar(productKey, existingKey, lineItem, partNumber, description, product)) {
          // وجدنا تطابق - استخدم نفس المعرف
          product.rows.push(i + 2);
          product.count++;
          matchFound = true;
          break;
        }
      }
      
      // إذا لم نجد تطابق، أنشئ منتج جديد
      if (!matchFound) {
        const unifiedId = `P-${String(nextId++).padStart(7, '0')}`;
        uniqueProducts.set(productKey, {
          id: unifiedId,
          rows: [i + 2],
          lineItem: lineItem,
          partNumber: partNumber,
          description: description,
          count: 1
        });
        
        console.log(`🆕 منتج فريد #${nextId - 1}: ${productKey.substring(0, 60)}...`);
      }
      
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
    
    // طباعة أمثلة على المنتجات الموحدة
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

// إنشاء مفتاح ذكي للمنتج
function createSmartProductKey(lineItem: string, partNumber: string, description: string): string {
  // الأولوية للمعلومات الأساسية
  const parts = [];
  
  // استخدم LINE ITEM إذا كان متاحاً ومفيداً
  if (lineItem && lineItem.length > 3) {
    parts.push(lineItem);
  }
  
  // استخدم PART NUMBER إذا كان متاحاً ومختلفاً عن LINE ITEM
  if (partNumber && partNumber.length > 2 && partNumber !== lineItem) {
    parts.push(partNumber);
  }
  
  // استخرج المعلومات المهمة من الوصف
  if (description) {
    const importantInfo = extractCoreProductInfo(description);
    if (importantInfo) {
      parts.push(importantInfo);
    }
  }
  
  // إذا لم نجد أي معلومات، استخدم الوصف مباشرة
  if (parts.length === 0 && description) {
    return normalizeText(description);
  }
  
  return parts.join('_');
}

// مقارنة ذكية للمنتجات
function areProductsSimilar(
  key1: string, 
  key2: string, 
  lineItem: string, 
  partNumber: string, 
  description: string,
  existingProduct: any
): boolean {
  
  // إذا كان LINE ITEM و PART NUMBER متطابقان تماماً، فهو نفس المنتج
  if (lineItem && existingProduct.lineItem && 
      lineItem === existingProduct.lineItem &&
      partNumber && existingProduct.partNumber &&
      partNumber === existingProduct.partNumber) {
    return true;
  }
  
  // إذا كان LINE ITEM متطابق والوصف متشابه جداً
  if (lineItem && existingProduct.lineItem && 
      lineItem === existingProduct.lineItem) {
    // تحقق من تشابه الوصف
    const similarity = calculateSimilarity(description, existingProduct.description);
    if (similarity > 0.85) {
      return true;
    }
  }
  
  // إذا كان PART NUMBER متطابق والوصف متشابه
  if (partNumber && existingProduct.partNumber && 
      partNumber === existingProduct.partNumber &&
      partNumber.length > 3) { // تجاهل الأرقام القصيرة جداً
    const similarity = calculateSimilarity(description, existingProduct.description);
    if (similarity > 0.8) {
      return true;
    }
  }
  
  // للتلفزيونات والأجهزة الإلكترونية - تحقق من الحجم والنوع
  if (isElectronicDevice(description) && isElectronicDevice(existingProduct.description)) {
    return areElectronicDevicesSimilar(description, existingProduct.description);
  }
  
  // مقارنة المفاتيح المنشأة
  if (key1 === key2) {
    return true;
  }
  
  return false;
}

// استخراج المعلومات الأساسية من وصف المنتج
function extractCoreProductInfo(description: string): string {
  const normalized = normalizeText(description);
  
  // استخراج نوع المنتج الأساسي
  const productTypes = [
    'TV', 'TELEVISION', 'LED', 'SMART TV',
    'BRACKET', 'MOUNT', 'HOLDER',
    'BATTERY', 'ENERGIZER', 'DURACELL',
    'HOT PLATE', 'HEATER', 'COOKER', 'OVEN',
    'THERMOSTAT', 'CONTROLLER', 'REGULATOR',
    'GASKET', 'SEAL', 'DOOR GASKET',
    'CABLE', 'WIRE', 'CORD',
    'RECEIVER', 'SATELLITE', 'DISH', 'LNB',
    'FAN', 'EXHAUST', 'VENTILATOR',
    'VACUUM', 'CLEANER', 'HOOVER',
    'WATER HEATER', 'BOILER',
    'CONTACTOR', 'RELAY', 'SWITCH',
    'BLENDER', 'MIXER', 'PROCESSOR'
  ];
  
  let productType = '';
  for (const type of productTypes) {
    if (normalized.includes(type)) {
      productType = type;
      break;
    }
  }
  
  // استخراج البراند
  const brands = [
    'CARRIER', 'ENERGIZER', 'DURACELL', 'BRENNENSTUHL', 
    'EGO', 'DIXELL', 'TORNADO', 'TOSHIBA', 'SAMSUNG', 
    'OLYMPIC', 'ARISTON', 'SCHNEIDER', 'TELEMECANIQUE', 
    'BRAUN', 'CROWN', 'ASTRA', 'BEIN', 'LG', 'SONY'
  ];
  
  let brand = '';
  for (const b of brands) {
    if (normalized.includes(b)) {
      brand = b;
      break;
    }
  }
  
  // استخراج الحجم أو القوة
  const sizeMatch = normalized.match(/(\d+)\s*(INCH|"|LTR|LITER|WATT|KW|VOLT|V|MM|CM|M)/);
  const size = sizeMatch ? sizeMatch[0] : '';
  
  // استخراج الموديل المحدد
  const modelMatch = normalized.match(/MODEL\s*:?\s*([A-Z0-9\-]+)/);
  const model = modelMatch ? modelMatch[1] : '';
  
  // دمج المعلومات المهمة
  const parts = [];
  if (productType) parts.push(productType);
  if (brand) parts.push(brand);
  if (size) parts.push(size);
  if (model) parts.push(model);
  
  return parts.join('_');
}

// تطبيع النص
function normalizeText(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// حساب التشابه بين نصين
function calculateSimilarity(text1: string, text2: string): number {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  if (norm1 === norm2) return 1;
  
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  const allWords = new Set([...words1, ...words2]);
  const commonWords = words1.filter(w => words2.includes(w));
  
  return commonWords.length / allWords.size;
}

// التحقق من كون المنتج جهاز إلكتروني
function isElectronicDevice(description: string): boolean {
  const electronics = ['TV', 'LED', 'TELEVISION', 'RECEIVER', 'SATELLITE', 'FAN', 'VACUUM', 'WATER HEATER', 'BLENDER'];
  const normalized = normalizeText(description);
  return electronics.some(e => normalized.includes(e));
}

// مقارنة الأجهزة الإلكترونية بذكاء
function areElectronicDevicesSimilar(desc1: string, desc2: string): boolean {
  const norm1 = normalizeText(desc1);
  const norm2 = normalizeText(desc2);
  
  // استخراج النوع والحجم للتلفزيونات
  const tvPattern = /(\d+)\s*"?\s*(INCH|LED|TV)/;
  const tv1 = norm1.match(tvPattern);
  const tv2 = norm2.match(tvPattern);
  
  if (tv1 && tv2) {
    // نفس الحجم = نفس المنتج للتلفزيونات
    if (tv1[1] === tv2[1]) {
      // تحقق من البراند أيضاً
      const sameBrand = ['TORNADO', 'TOSHIBA', 'SAMSUNG', 'LG', 'SONY'].some(
        brand => norm1.includes(brand) && norm2.includes(brand)
      );
      return sameBrand || (!norm1.match(/TORNADO|TOSHIBA|SAMSUNG|LG|SONY/) && !norm2.match(/TORNADO|TOSHIBA|SAMSUNG|LG|SONY/));
    }
  }
  
  // للأجهزة الأخرى
  const device1Type = extractDeviceType(norm1);
  const device2Type = extractDeviceType(norm2);
  
  if (device1Type === device2Type && device1Type !== '') {
    // نفس النوع، تحقق من المواصفات
    const specs1 = extractSpecs(norm1);
    const specs2 = extractSpecs(norm2);
    
    // إذا كانت المواصفات متطابقة، فهو نفس المنتج
    if (specs1.length > 0 && specs2.length > 0) {
      const commonSpecs = specs1.filter(s => specs2.includes(s));
      return commonSpecs.length / Math.max(specs1.length, specs2.length) > 0.7;
    }
  }
  
  return false;
}

// استخراج نوع الجهاز
function extractDeviceType(text: string): string {
  const types = {
    'TV': ['TV', 'TELEVISION', 'LED TV'],
    'RECEIVER': ['RECEIVER', 'SATELLITE', 'RECIVER'],
    'FAN': ['FAN', 'EXHAUST', 'WALL FAN'],
    'WATER_HEATER': ['WATER HEATER', 'BOILER'],
    'VACUUM': ['VACUUM', 'CLEANER'],
    'BLENDER': ['BLENDER', 'MIXER']
  };
  
  for (const [key, patterns] of Object.entries(types)) {
    if (patterns.some(p => text.includes(p))) {
      return key;
    }
  }
  
  return '';
}

// استخراج المواصفات
function extractSpecs(text: string): string[] {
  const specs = [];
  
  // الأحجام
  const sizes = text.match(/\d+\s*(INCH|"|LTR|LITER|CM|MM)/g);
  if (sizes) specs.push(...sizes);
  
  // القوة
  const power = text.match(/\d+\s*(WATT|KW|VOLT|V)/g);
  if (power) specs.push(...power);
  
  // الموديلات
  const models = text.match(/[A-Z]{2,}[\d]+[A-Z\d]*/g);
  if (models) specs.push(...models);
  
  return specs;
}