#!/usr/bin/env node
// نظام التوحيد الذكي المحسّن - الإصدار النهائي

import { google } from 'googleapis';
import fs from 'fs';
import { config } from 'dotenv';
import fetch from 'node-fetch';

// تحميل المتغيرات البيئية
config();

// ==================== التكوين ====================
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

// ==================== قاعدة معرفة المنتجات المتشابهة ====================
const PRODUCT_EQUIVALENTS = {
  // كونتاكتور Schneider Electric LC1D32M7 - نفس المنتج بأرقام مختلفة
  'LC1D32M7': ['2102034', '2102049', 'LC1D32', 'LC1D32M7C', 'LC1D32BD', 'LC1D32M7'],
  '2102034': ['LC1D32M7', '2102049', 'LC1D32', 'LC1D32M7C', 'LC1D32BD'],
  '2102049': ['LC1D32M7', '2102034', 'LC1D32', 'LC1D32M7C', 'LC1D32BD'],
  'LC1D32': ['LC1D32M7', '2102034', '2102049', 'LC1D32M7C', 'LC1D32BD'],
  
  // يمكن إضافة المزيد من المنتجات هنا في المستقبل
};

// ==================== دوال المعالجة المسبقة للنصوص ====================
function normalize(text) {
  if (!text) return '';
  
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .trim();
}

function extractKeyFeatures(text) {
  if (!text) return '';
  
  const commonWords = ['p/n', 'part', 'number', 'ref', 'reference', 'for', 'and', 'the', 'with'];
  let result = normalize(text);
  
  commonWords.forEach(word => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  return result.replace(/\s+/g, ' ').trim();
}

// ==================== دالة استخراج أرقام الأجزاء المحسنة ====================
function extractPartNumbers(description) {
  const patterns = [
    /(?:p\/n|part\s*number|ref|reference)[\s:]*([a-z0-9\s]+)/gi,
    /\b([a-z]{2,}\d+[a-z0-9]*)\b/gi,
    /\b(\d+[a-z][a-z0-9]*)\b/gi,
    /\b(lc1d\s*\d+\s*[a-z]\d*)\b/gi
  ];
  
  const numbers = new Set();
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(description.toLowerCase())) !== null) {
      if (match[1]) {
        const cleanNumber = match[1].replace(/\s+/g, '').toUpperCase().trim();
        if (cleanNumber.length >= 3) {
          numbers.add(cleanNumber);
        }
      }
    }
  });
  
  // إضافة الأرقام المكافئة من قاعدة المعرفة
  const finalNumbers = new Set([...numbers]);
  numbers.forEach(number => {
    if (PRODUCT_EQUIVALENTS[number]) {
      PRODUCT_EQUIVALENTS[number].forEach(equivalent => {
        finalNumbers.add(equivalent);
      });
    }
  });
  
  return Array.from(finalNumbers);
}

// ==================== دالة المقارنة المحسنة - تعتمد على دلالة التوصيف ====================
function areProductsEquivalent(description1, description2) {
  if (!description1 || !description2) return false;
  
  const normalized1 = normalize(description1);
  const normalized2 = normalize(description2);
  
  // 1. التحقق من التطابق التام بعد التطبيع
  if (normalized1 === normalized2) {
    return true;
  }
  
  // 2. استخراج الخصائص الأساسية للمنتج (بدون أرقام القطع)
  const getProductCharacteristics = (desc) => {
    const normalized = normalize(desc);
    
    // استخراج نوع المنتج
    const productType = getProductType(normalized);
    
    // استخراج العلامة التجارية
    const brand = getBrand(normalized);
    
    // استخراج المواصفات التقنية
    const specs = getTechnicalSpecs(normalized);
    
    // استخراج الوظيفة/الاستخدام
    const usage = getUsage(normalized);
    
    return { productType, brand, specs, usage };
  };
  
  const chars1 = getProductCharacteristics(description1);
  const chars2 = getProductCharacteristics(description2);
  
  // 3. مقارنة الخصائص الأساسية
  
  // نوع المنتج يجب أن يكون متطابق
  if (chars1.productType && chars2.productType && chars1.productType !== chars2.productType) {
    return false;
  }
  
  // العلامة التجارية يجب أن تكون متطابقة
  if (chars1.brand && chars2.brand && chars1.brand !== chars2.brand) {
    return false;
  }
  
  // المواصفات التقنية يجب أن تكون متقاربة
  const specsMatch = compareSpecs(chars1.specs, chars2.specs);
  if (!specsMatch) {
    return false;
  }
  
  // 4. حساب التشابه الدلالي للوصف (بدون أرقام القطع)
  const cleanDesc1 = removePartNumbers(normalized1);
  const cleanDesc2 = removePartNumbers(normalized2);
  
  const words1 = new Set(cleanDesc1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(cleanDesc2.split(/\s+/).filter(w => w.length > 2));
  
  const commonWords = new Set([...words1].filter(word => words2.has(word)));
  const allWords = new Set([...words1, ...words2]);
  
  const similarity = allWords.size > 0 ? commonWords.size / allWords.size : 0;
  
  // عتبة أعلى للتشابه الدلالي
  return similarity >= 0.8;
}

// دالة استخراج نوع المنتج
function getProductType(description) {
  const types = [
    { pattern: /contactor/gi, type: 'contactor' },
    { pattern: /tv|television|تلفزيون/gi, type: 'tv' },
    { pattern: /led.*tv/gi, type: 'led_tv' },
    { pattern: /smart.*tv/gi, type: 'smart_tv' },
    { pattern: /grill/gi, type: 'grill' },
    { pattern: /fryer/gi, type: 'fryer' },
    { pattern: /switch/gi, type: 'switch' },
    { pattern: /relay/gi, type: 'relay' }
  ];
  
  for (const { pattern, type } of types) {
    if (pattern.test(description)) {
      return type;
    }
  }
  return 'unknown';
}

// دالة استخراج العلامة التجارية
function getBrand(description) {
  const brands = [
    { pattern: /schneider|schnieder/gi, brand: 'schneider' },
    { pattern: /telemecanique/gi, brand: 'schneider' }, // Telemecanique هي جزء من Schneider
    { pattern: /samsung/gi, brand: 'samsung' },
    { pattern: /lg/gi, brand: 'lg' },
    { pattern: /toshiba/gi, brand: 'toshiba' },
    { pattern: /sony/gi, brand: 'sony' },
    { pattern: /tornado/gi, brand: 'tornado' }
  ];
  
  for (const { pattern, brand } of brands) {
    if (pattern.test(description)) {
      return brand;
    }
  }
  return 'unknown';
}

// دالة استخراج المواصفات التقنية
function getTechnicalSpecs(description) {
  const specs = {};
  
  // الجهد
  const voltageMatch = description.match(/(\d+)v/gi);
  if (voltageMatch) specs.voltage = voltageMatch.map(v => v.toLowerCase());
  
  // التيار
  const currentMatch = description.match(/(\d+)a/gi);
  if (currentMatch) specs.current = currentMatch.map(c => c.toLowerCase());
  
  // القدرة
  const powerMatch = description.match(/(\d+)\s*kw/gi);
  if (powerMatch) specs.power = powerMatch.map(p => p.toLowerCase().replace(/\s/g, ''));
  
  // التردد
  const freqMatch = description.match(/(\d+\/\d+)\s*hz/gi);
  if (freqMatch) specs.frequency = freqMatch.map(f => f.toLowerCase().replace(/\s/g, ''));
  
  // الحجم (للتلفزيونات)
  const sizeMatch = description.match(/(\d+)\s*(?:''|"|inch|بوصة)/gi);
  if (sizeMatch) specs.size = sizeMatch.map(s => s.replace(/[^0-9]/g, ''));
  
  return specs;
}

// دالة استخراج الاستخدام
function getUsage(description) {
  const usages = [];
  
  if (/grill/gi.test(description)) usages.push('grill');
  if (/fryer/gi.test(description)) usages.push('fryer');
  if (/electric/gi.test(description)) usages.push('electric');
  if (/kitchen/gi.test(description)) usages.push('kitchen');
  if (/smart/gi.test(description)) usages.push('smart');
  
  return usages;
}

// دالة مقارنة المواصفات
function compareSpecs(specs1, specs2) {
  // إذا كان أحدهما فارغ، نعتبرهما متطابقين
  if (!specs1 || !specs2) return true;
  
  // مقارنة الجهد
  if (specs1.voltage && specs2.voltage) {
    const voltageMatch = specs1.voltage.some(v => specs2.voltage.includes(v));
    if (!voltageMatch) return false;
  }
  
  // مقارنة التيار
  if (specs1.current && specs2.current) {
    const currentMatch = specs1.current.some(c => specs2.current.includes(c));
    if (!currentMatch) return false;
  }
  
  // مقارنة القدرة
  if (specs1.power && specs2.power) {
    const powerMatch = specs1.power.some(p => specs2.power.includes(p));
    if (!powerMatch) return false;
  }
  
  // مقارنة الحجم (مهم جداً للتلفزيونات)
  if (specs1.size && specs2.size) {
    const sizeMatch = specs1.size.some(s => specs2.size.includes(s));
    if (!sizeMatch) return false;
  }
  
  return true;
}

// دالة إزالة أرقام القطع من النص
function removePartNumbers(description) {
  return description
    .replace(/p\/n\s*:?\s*[a-z0-9\s]+/gi, '')
    .replace(/ref\s*:?\s*[a-z0-9\s]+/gi, '')
    .replace(/\b[a-z]{2,}\d+[a-z0-9]*\b/gi, '')
    .replace(/\b\d{7}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ==================== نظام إدارة المجموعات ====================
class ProductGroupManager {
  constructor() {
    this.groups = new Map();
    this.groupCounter = 1;
    this.productToGroupMap = new Map();
  }
  
  findGroupForProduct(description, partNumber, lineItem) {
    const key = description || partNumber || lineItem;
    if (!key) return null;
    
    // البحث في الخريطة باستخدام أرقام الأجزاء أولاً
    const partNumbers = extractPartNumbers(description || '');
    for (const pn of partNumbers) {
      if (this.productToGroupMap.has(pn)) {
        return this.productToGroupMap.get(pn);
      }
    }
    
    // البحث بالوصف الكامل
    if (this.productToGroupMap.has(key)) {
      return this.productToGroupMap.get(key);
    }
    
    return null;
  }
  
  createNewGroup(description, partNumber, lineItem) {
    const newGroupId = `P-${this.groupCounter.toString().padStart(7, '0')}`;
    this.groupCounter++;
    
    this.groups.set(newGroupId, {
      descriptions: new Set(),
      partNumbers: new Set(),
      lineItems: new Set(),
      rows: []
    });
    
    this.addToGroup(newGroupId, description, partNumber, lineItem, -1);
    return newGroupId;
  }
  
  addToGroup(groupId, description, partNumber, lineItem, rowIndex) {
    const group = this.groups.get(groupId);
    
    if (description) {
      group.descriptions.add(description);
      this.productToGroupMap.set(description, groupId);
    }
    
    if (partNumber) {
      group.partNumbers.add(partNumber);
      this.productToGroupMap.set(partNumber, groupId);
    }
    
    if (lineItem) {
      group.lineItems.add(lineItem);
      this.productToGroupMap.set(lineItem, groupId);
    }
    
    // إضافة أرقام الأجزاء المستخرجة إلى الخريطة
    const partNumbers = extractPartNumbers(description || '');
    partNumbers.forEach(pn => {
      this.productToGroupMap.set(pn, groupId);
    });
    
    if (rowIndex >= 0) {
      group.rows.push(rowIndex);
    }
  }
}

// ==================== حفظ الحالة للتوافق مع النظام ====================
function saveStatus(currentIndex, totalItems, isRunning = true) {
  const status = {
    isRunning,
    isPaused: false,
    currentIndex,
    totalItems,
    processedItems: currentIndex,
    unifiedItems: 0,
    startTime: new Date().toISOString(),
    errorCount: 0
  };
  
  fs.writeFileSync('./unification-status.json', JSON.stringify(status, null, 2));
}

// ==================== البرنامج الرئيسي ====================
async function unifyProducts() {
  console.log('🚀 بدء عملية توحيد المنتجات - الإصدار النهائي المحسن...\n');
  
  try {
    // قراءة البيانات من Google Sheets
    console.log('📖 جلب البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });
    
    const rows = response.data.values || [];
    console.log(`✅ تم تحميل ${rows.length} صفوف\n`);
    
    if (rows.length < 2) {
      console.log('❌ لا توجد بيانات كافية للمعالجة');
      return;
    }
    
    // معالجة البيانات
    console.log('🔍 معالجة البيانات وإنشاء المجموعات...');
    const manager = new ProductGroupManager();
    const updates = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const currentId = row[0] || '';
      const lineItem = row[2] || '';
      const partNumber = row[3] || '';
      const description = row[4] || '';
      
      if (!lineItem && !partNumber && !description) {
        continue;
      }
      
      console.log(`\n🔍 معالجة الصف ${i+1}: "${(description || partNumber || lineItem).substring(0, 60)}..."`);
      
      // البحث عن مجموعة موجودة
      let groupId = manager.findGroupForProduct(description, partNumber, lineItem);
      
      // إذا لم يتم العثور على مجموعة، البحث بالمقارنة مع المجموعات الموجودة
      if (!groupId) {
        for (const [existingGroupId, group] of manager.groups.entries()) {
          for (const existingDesc of group.descriptions) {
            if (areProductsEquivalent(description, existingDesc)) {
              groupId = existingGroupId;
              console.log(`   🎯 تطابق مع المجموعة: ${groupId}`);
              break;
            }
          }
          if (groupId) break;
        }
      }
      
      // إذا لم يتم العثور على مجموعة، إنشاء مجموعة جديدة
      if (!groupId) {
        groupId = manager.createNewGroup(description, partNumber, lineItem);
        console.log(`   🆕 مجموعة جديدة: ${groupId}`);
      } else {
        console.log(`   ✅ تطابق مع المجموعة: ${groupId}`);
      }
      
      // إضافة الصف إلى المجموعة
      manager.addToGroup(groupId, description, partNumber, lineItem, i);
      
      // إضافة التحديث إلى القائمة
      updates.push({
        range: `DATA!A${i + 1}`,
        values: [[groupId]]
      });
      
      // عرض التقدم وحفظ الحالة كل 10 صفوف
      if (i % 10 === 0) {
        console.log(`\n⏳ التقدم: ${i}/${rows.length-1} (${Math.round(i * 100 / (rows.length-1))}%)`);
        console.log(`📊 عدد المجموعات: ${manager.groups.size}`);
        saveStatus(i, rows.length - 1, true);
        
        // تأخير قصير
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // تطبيق التحديثات على Google Sheets
    console.log('\n💾 حفظ التغييرات في Google Sheets...');
    const batchSize = 500;
    let updatedCount = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          data: batch,
          valueInputOption: 'RAW'
        }
      });
      
      updatedCount += batch.length;
      console.log(`   ✅ تم تحديث ${updatedCount}/${updates.length} صف`);
      
      // تأخير قصير بين الدفعات
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // عرض الإحصائيات النهائية
    console.log('\n📊 الإحصائيات النهائية:');
    console.log(`   • إجمالي الصفوف: ${rows.length - 1}`);
    console.log(`   • المجموعات الفريدة: ${manager.groups.size}`);
    console.log(`   • نسبة التوفير: ${Math.round(((rows.length - 1 - manager.groups.size) / (rows.length - 1)) * 100)}%`);
    
    // عرض تفاصيل المجموعات المتطابقة
    let totalUnified = 0;
    let duplicateGroups = 0;
    
    for (const [groupId, group] of manager.groups.entries()) {
      if (group.rows.length > 1) {
        duplicateGroups++;
        totalUnified += group.rows.length;
        const firstDesc = [...group.descriptions][0];
        console.log(`   🔗 ${groupId}: ${group.rows.length} بند متطابق - "${firstDesc?.substring(0, 50)}..."`);
      }
    }
    
    console.log(`\n📈 ملخص التوحيد:`);
    console.log(`   • المنتجات المكررة: ${duplicateGroups}`);
    console.log(`   • البنود الموحدة: ${totalUnified}`);
    console.log(`   • معدل التوفير: ${Math.round((totalUnified - duplicateGroups) * 100 / (rows.length - 1))}%`);
    
    console.log('\n🎉 تم الانتهاء من عملية التوحيد بنجاح!');
    
    // حفظ الحالة النهائية
    saveStatus(rows.length - 1, rows.length - 1, false);
    
  } catch (error) {
    console.error('❌ حدث خطأ:', error.message);
    if (error.response?.data) {
      console.error('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// تشغيل البرنامج
console.log('=====================================');
console.log('   نظام التوحيد الذكي المحسن');
console.log('   الإصدار النهائي المطور');
console.log('=====================================\n');

console.log('🔧 استخدام نظام المقارنة المحسن مع قاعدة المعرفة');
console.log('📋 قاعدة معرفة المنتجات: LC1D32M7, 2102034, 2102049');

unifyProducts();