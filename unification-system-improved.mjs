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
  // كونتاكتور Schneider Electric LC1D32M7
  'LC1D32M7': ['2102034', '2102049', 'LC1D32', 'LC1D32M7C', 'LC1D32BD'],
  '2102034': ['LC1D32M7', '2102049', 'LC1D32'],
  '2102049': ['LC1D32M7', '2102034', 'LC1D32'],
  
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

// ==================== دالة المقارنة المحسنة ====================
function areProductsEquivalent(description1, description2) {
  if (!description1 || !description2) return false;
  
  const normalized1 = normalize(description1);
  const normalized2 = normalize(description2);
  
  // 1. التحقق من التطابق التام بعد التطبيع
  if (normalized1 === normalized2) {
    return true;
  }
  
  // 2. التحقق من أرقام الأجزاء المتشابهة
  const partNumbers1 = extractPartNumbers(description1);
  const partNumbers2 = extractPartNumbers(description2);
  
  if (partNumbers1.length > 0 && partNumbers2.length > 0) {
    const commonNumbers = partNumbers1.filter(num => partNumbers2.includes(num));
    if (commonNumbers.length > 0) {
      return true;
    }
  }
  
  // 3. التحقق من العلامات التجارية
  const brands = ['schneider', 'telemecanique', 'toshiba', 'samsung', 'lg'];
  const brand1 = brands.find(brand => normalized1.includes(brand));
  const brand2 = brands.find(brand => normalized2.includes(brand));
  
  if (brand1 && brand2 && brand1 !== brand2) {
    return false;
  }
  
  // 4. التحقق من المواصفات الأساسية
  const keySpecs = ['220v', '50/60hz', '50a', '15kw', '400v'];
  const hasSameSpecs = keySpecs.every(spec => 
    normalized1.includes(spec) === normalized2.includes(spec)
  );
  
  if (!hasSameSpecs) {
    return false;
  }
  
  // 5. حساب التشابه النصي
  const words1 = new Set(normalized1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(normalized2.split(/\s+/).filter(w => w.length > 2));
  
  const commonWords = new Set([...words1].filter(word => words2.has(word)));
  const allWords = new Set([...words1, ...words2]);
  
  const similarity = allWords.size > 0 ? commonWords.size / allWords.size : 0;
  
  return similarity >= 0.7;
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