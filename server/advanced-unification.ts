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
      
      // استخراج المعلومات الحقيقية للمنتج من الوصف
      const actualProduct = extractActualProduct(description);
      
      // البحث عن منتج مطابق
      let matchFound = false;
      let matchedProduct = null;
      
      for (const [existingKey, product] of uniqueProducts) {
        // مقارنة ذكية جداً
        if (areProductsIdentical(
          actualProduct,
          product.actualProduct,
          lineItem,
          product.lineItem,
          partNumber,
          product.partNumber,
          description,
          product.description
        )) {
          // وجدنا تطابق
          product.rows.push(i + 2);
          product.count++;
          matchFound = true;
          matchedProduct = product;
          break;
        }
      }
      
      // إذا لم نجد تطابق، أنشئ منتج جديد
      if (!matchFound) {
        const unifiedId = `P-${String(nextId++).padStart(7, '0')}`;
        const productKey = actualProduct.key || `${lineItem}_${partNumber}`;
        
        uniqueProducts.set(productKey, {
          id: unifiedId,
          rows: [i + 2],
          lineItem: lineItem,
          partNumber: partNumber,
          description: description,
          actualProduct: actualProduct,
          count: 1
        });
        
        console.log(`🆕 منتج فريد #${nextId - 1}: ${actualProduct.name || productKey.substring(0, 60)}`);
      } else if (matchedProduct) {
        console.log(`🔗 توحيد: ${actualProduct.name || 'منتج'} - الصف ${i + 2} مع ${matchedProduct.id}`);
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
        console.log(`   ${product.id}: ${product.count} صف - ${product.actualProduct.name || product.description.substring(0, 60)}...`);
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

// استخراج المعلومات الحقيقية للمنتج
function extractActualProduct(description: string): any {
  const normalized = description.toUpperCase().replace(/\s+/g, ' ').trim();
  
  // استخراج المعلومات الأساسية من الوصف
  const result: any = {
    key: '',
    name: '',
    brand: '',
    model: '',
    specs: [],
    type: ''
  };
  
  // قائمة الكونتاكتورات المعروفة
  const contactors = {
    'LC1D 32 M7': 'SCHNEIDER CONTACTOR LC1D32M7',
    'LC1D32M7': 'SCHNEIDER CONTACTOR LC1D32M7',
    'LC1D 32M7': 'SCHNEIDER CONTACTOR LC1D32M7',
    'LC1D 25 M7': 'SCHNEIDER CONTACTOR LC1D25M7',
    'LC1D25M7': 'SCHNEIDER CONTACTOR LC1D25M7',
    'LC1D 25M7': 'SCHNEIDER CONTACTOR LC1D25M7',
    'LC1D 18 M7': 'SCHNEIDER CONTACTOR LC1D18M7',
    'LC1D18M7': 'SCHNEIDER CONTACTOR LC1D18M7',
    'LC1D 18M7': 'SCHNEIDER CONTACTOR LC1D18M7'
  };
  
  // البحث عن الكونتاكتور في الوصف
  for (const [pattern, productName] of Object.entries(contactors)) {
    if (normalized.includes(pattern.toUpperCase())) {
      result.type = 'CONTACTOR';
      result.model = pattern.replace(/\s+/g, '');
      result.name = productName;
      result.brand = 'SCHNEIDER';
      
      // استخراج المواصفات
      const voltMatch = normalized.match(/(\d+)\s*V(?:OLT)?/);
      if (voltMatch) result.specs.push(voltMatch[0]);
      
      const ampMatch = normalized.match(/(\d+)\s*A(?:MP)?/);
      if (ampMatch) result.specs.push(ampMatch[0]);
      
      const kwMatch = normalized.match(/(\d+)\s*KW/);
      if (kwMatch) result.specs.push(kwMatch[0]);
      
      const hzMatch = normalized.match(/\d+\/?\d*\s*HZ/);
      if (hzMatch) result.specs.push(hzMatch[0]);
      
      result.key = `CONTACTOR_${result.model}_${result.specs.join('_')}`;
      return result;
    }
  }
  
  // معالجة المنتجات الأخرى
  
  // التلفزيونات
  if (normalized.includes('TV') || normalized.includes('TELEVISION') || normalized.includes('LED')) {
    result.type = 'TV';
    
    // استخراج الحجم
    const sizeMatch = normalized.match(/(\d+)\s*"?\s*(INCH|LED)?/);
    if (sizeMatch) {
      result.specs.push(sizeMatch[1] + '"');
      result.name = `TV ${sizeMatch[1]}" LED`;
    }
    
    // استخراج البراند
    const brands = ['SAMSUNG', 'TORNADO', 'TOSHIBA', 'LG', 'SONY'];
    for (const brand of brands) {
      if (normalized.includes(brand)) {
        result.brand = brand;
        break;
      }
    }
    
    // استخراج الموديل
    const modelMatch = normalized.match(/MODEL\s*:?\s*([A-Z0-9\-]+)/);
    if (modelMatch) {
      result.model = modelMatch[1];
    }
    
    result.key = `TV_${result.specs.join('_')}_${result.brand || 'GENERIC'}`;
    return result;
  }
  
  // البطاريات
  if (normalized.includes('BATTERY') || normalized.includes('ENERGIZER')) {
    result.type = 'BATTERY';
    result.brand = 'ENERGIZER';
    
    // نوع البطارية
    if (normalized.includes('AAA')) {
      result.model = 'AAA';
      result.name = 'ENERGIZER BATTERY AAA';
    } else if (normalized.includes('AA')) {
      result.model = 'AA';
      result.name = 'ENERGIZER BATTERY AA';
    }
    
    // الفولت
    const voltMatch = normalized.match(/(\d+\.?\d*)\s*V/);
    if (voltMatch) result.specs.push(voltMatch[0]);
    
    result.key = `BATTERY_${result.brand}_${result.model}`;
    return result;
  }
  
  // HOT PLATES
  if (normalized.includes('HOT PLATE')) {
    result.type = 'HOT_PLATE';
    result.name = 'HOT PLATE';
    
    // استخراج الحجم
    const sizeMatch = normalized.match(/(\d+X\d+|\d+\s*X\s*\d+)/);
    if (sizeMatch) result.specs.push(sizeMatch[0]);
    
    // استخراج القوة
    const powerMatch = normalized.match(/(\d+\.?\d*)\s*KW/);
    if (powerMatch) result.specs.push(powerMatch[0]);
    
    // استخراج الفولت
    const voltMatch = normalized.match(/(\d+)\s*VOLT/);
    if (voltMatch) result.specs.push(voltMatch[0]);
    
    // استخراج رقم الموديل
    const pnMatch = normalized.match(/P\/N\s*:?\s*([0-9\.]+)/);
    if (pnMatch) result.model = pnMatch[1];
    
    result.key = `HOT_PLATE_${result.model || result.specs.join('_')}`;
    return result;
  }
  
  // THERMOSTATS
  if (normalized.includes('THERMOSTAT')) {
    result.type = 'THERMOSTAT';
    result.name = 'THERMOSTAT';
    
    // البراند
    if (normalized.includes('DIXELL')) result.brand = 'DIXELL';
    else if (normalized.includes('EGO')) result.brand = 'EGO';
    
    // الموديل
    const modelMatch = normalized.match(/([A-Z]{2,}[\d]+[A-Z\d]*)/);
    if (modelMatch) result.model = modelMatch[1];
    
    // درجة الحرارة
    const tempMatch = normalized.match(/(\d+\/\d+|\d+-\d+|\d+)\s*[OC°]/);
    if (tempMatch) result.specs.push(tempMatch[0]);
    
    result.key = `THERMOSTAT_${result.brand}_${result.model}`;
    return result;
  }
  
  // BRACKETS
  if (normalized.includes('BRACKET')) {
    result.type = 'BRACKET';
    
    // الاتجاه
    if (normalized.includes('LEFT')) {
      result.name = 'LEFT BRACKET';
      result.specs.push('LEFT');
    } else if (normalized.includes('RIGHT')) {
      result.name = 'RIGHT BRACKET';
      result.specs.push('RIGHT');
    } else {
      result.name = 'BRACKET';
    }
    
    // البراند أو النوع
    if (normalized.includes('CARRIER')) {
      result.brand = 'CARRIER';
      result.specs.push('CARRIER');
    }
    
    // الموديل
    const modelMatch = normalized.match(/MODEL\s*([A-Z0-9]+)|([0-9]{2}[A-Z]{2}[0-9]+)/);
    if (modelMatch) result.model = modelMatch[1] || modelMatch[2];
    
    result.key = `BRACKET_${result.specs.join('_')}_${result.model || ''}`;
    return result;
  }
  
  // WATER HEATERS
  if (normalized.includes('WATER HEATER')) {
    result.type = 'WATER_HEATER';
    result.name = 'WATER HEATER';
    
    // البراند
    if (normalized.includes('OLYMPIC')) result.brand = 'OLYMPIC';
    else if (normalized.includes('ARISTON')) result.brand = 'ARISTON';
    
    // الحجم
    const sizeMatch = normalized.match(/(\d+)\s*(LTR|LITER)/);
    if (sizeMatch) {
      result.specs.push(sizeMatch[1] + ' LTR');
      result.name = `${result.brand || ''} WATER HEATER ${sizeMatch[1]} LTR`.trim();
    }
    
    result.key = `WATER_HEATER_${result.brand}_${result.specs.join('_')}`;
    return result;
  }
  
  // إذا لم نتعرف على المنتج، استخدم المعلومات الأساسية
  result.name = normalized.substring(0, 100);
  result.key = normalized.replace(/[^\w]/g, '_').substring(0, 100);
  
  return result;
}

// مقارنة ذكية جداً للمنتجات
function areProductsIdentical(
  product1: any,
  product2: any,
  lineItem1: string,
  lineItem2: string,
  partNumber1: string,
  partNumber2: string,
  desc1: string,
  desc2: string
): boolean {
  
  // إذا كان لدينا معلومات منتج محددة
  if (product1.type && product2.type) {
    // نفس النوع من المنتج
    if (product1.type === product2.type) {
      // للكونتاكتورات - تحقق من الموديل
      if (product1.type === 'CONTACTOR') {
        // نفس الموديل = نفس المنتج
        if (product1.model === product2.model) {
          return true;
        }
      }
      
      // للتلفزيونات - تحقق من الحجم والبراند
      if (product1.type === 'TV') {
        const sameSize = product1.specs[0] === product2.specs[0];
        const sameBrand = product1.brand === product2.brand || 
                          (!product1.brand && !product2.brand);
        return sameSize && sameBrand;
      }
      
      // للبطاريات
      if (product1.type === 'BATTERY') {
        return product1.model === product2.model && 
               product1.brand === product2.brand;
      }
      
      // لل HOT PLATES
      if (product1.type === 'HOT_PLATE') {
        // نفس الموديل أو نفس المواصفات
        if (product1.model && product2.model) {
          return product1.model === product2.model;
        }
        // مقارنة المواصفات
        const specs1 = product1.specs.join('_');
        const specs2 = product2.specs.join('_');
        return specs1 === specs2;
      }
      
      // للثرموستات
      if (product1.type === 'THERMOSTAT') {
        return product1.model === product2.model && 
               product1.brand === product2.brand;
      }
      
      // للبراكيت
      if (product1.type === 'BRACKET') {
        // نفس الاتجاه والموديل
        const sameDirection = product1.specs.includes('LEFT') === product2.specs.includes('LEFT') &&
                             product1.specs.includes('RIGHT') === product2.specs.includes('RIGHT');
        const sameModel = product1.model === product2.model;
        return sameDirection && (sameModel || (!product1.model && !product2.model));
      }
      
      // لسخانات المياه
      if (product1.type === 'WATER_HEATER') {
        const sameBrand = product1.brand === product2.brand;
        const sameSize = product1.specs[0] === product2.specs[0];
        return sameBrand && sameSize;
      }
    }
  }
  
  // إذا كان LINE ITEM و PART NUMBER متطابقان تماماً
  if (lineItem1 && lineItem2 && lineItem1 === lineItem2 &&
      partNumber1 && partNumber2 && partNumber1 === partNumber2) {
    return true;
  }
  
  // إذا كان LINE ITEM متطابق والوصف متشابه جداً
  if (lineItem1 && lineItem2 && lineItem1 === lineItem2) {
    const similarity = calculateSimilarity(desc1, desc2);
    if (similarity > 0.9) {
      return true;
    }
  }
  
  // مقارنة المفاتيح
  if (product1.key && product2.key && product1.key === product2.key) {
    return true;
  }
  
  return false;
}

// حساب التشابه بين نصين
function calculateSimilarity(text1: string, text2: string): number {
  const norm1 = text1.toUpperCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const norm2 = text2.toUpperCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (norm1 === norm2) return 1;
  
  const words1 = norm1.split(' ').filter(w => w.length > 2);
  const words2 = norm2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const unionWords = new Set([...words1, ...words2]);
  
  return commonWords.length / unionWords.size;
}