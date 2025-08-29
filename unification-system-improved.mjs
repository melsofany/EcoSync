#!/usr/bin/env node
// نظام التوحيد المحسن مع DeepSeek API

import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

// ==================== التكوين ====================
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

// إعداد Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

// ==================== دالة التطبيع ====================
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

// ==================== دالة المقارنة المحلية المحسنة ====================
function areProductsSimilar(desc1, desc2) {
  if (!desc1 || !desc2) return { isSame: false, explanation: 'أحد الوصفين فارغ' };
  
  console.log(`🔍 مقارنة: "${desc1.substring(0, 40)}..." مع "${desc2.substring(0, 40)}..."`);
  
  const normalized1 = normalize(desc1);
  const normalized2 = normalize(desc2);
  
  // ==================== فحص الحجم (أولوية عالية) ====================
  const sizePattern = /(\d+)\s*(?:''|"|inch|بوصة|in)/gi;
  const sizes1 = [...normalized1.matchAll(sizePattern)].map(m => m[1]);
  const sizes2 = [...normalized2.matchAll(sizePattern)].map(m => m[1]);
  
  console.log(`   📏 الأحجام: [${sizes1.join(',')}] vs [${sizes2.join(',')}]`);
  
  // إذا كانت الأحجام مختلفة، فالمنتجات مختلفة
  if (sizes1.length > 0 && sizes2.length > 0) {
    const hasCommonSize = sizes1.some(s1 => sizes2.includes(s1));
    if (!hasCommonSize) {
      console.log(`   ❌ أحجام مختلفة: ${sizes1[0]} ≠ ${sizes2[0]}`);
      return {
        isSame: false,
        explanation: `أحجام مختلفة: ${sizes1[0]} بوصة vs ${sizes2[0]} بوصة`
      };
    }
  }
  
  // ==================== فحص العلامة التجارية ====================
  const brands = ['samsung', 'tornado', 'toshiba', 'lg', 'sony', 'sharp', 'panasonic', 'carrier', 'gree', 'midea'];
  const brand1 = brands.find(brand => normalized1.includes(brand));
  const brand2 = brands.find(brand => normalized2.includes(brand));
  
  console.log(`   🏷️ العلامات: ${brand1 || 'غير محدد'} vs ${brand2 || 'غير محدد'}`);
  
  // إذا كانت العلامات التجارية مختلفة، فالمنتجات مختلفة
  if (brand1 && brand2 && brand1 !== brand2) {
    console.log(`   ❌ علامات مختلفة: ${brand1} ≠ ${brand2}`);
    return {
      isSame: false,
      explanation: `علامات تجارية مختلفة: ${brand1} vs ${brand2}`
    };
  }
  
  // ==================== فحص نوع المنتج ====================
  const productTypes = ['tv', 't.v', 'television', 'fridge', 'refrigerator', 'washing machine', 'washer', 'ac', 'air conditioner'];
  const type1 = productTypes.find(type => normalized1.includes(type.replace(/\s+/g, '')));
  const type2 = productTypes.find(type => normalized2.includes(type.replace(/\s+/g, '')));
  
  console.log(`   📺 الأنواع: ${type1 || 'غير محدد'} vs ${type2 || 'غير محدد'}`);
  
  // إذا كانت الأنواع مختلفة، فالمنتجات مختلفة
  if (type1 && type2 && type1 !== type2) {
    console.log(`   ❌ أنواع مختلفة: ${type1} ≠ ${type2}`);
    return {
      isSame: false,
      explanation: `أنواع منتجات مختلفة: ${type1} vs ${type2}`
    };
  }
  
  // ==================== حساب التشابه النصي ====================
  const words1 = new Set(normalized1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(normalized2.split(/\s+/).filter(w => w.length > 2));
  
  // إزالة الكلمات الشائعة
  const commonWords = ['led', 'with', 'built', 'receiver', 'smart', 'ultra'];
  const filteredWords1 = new Set([...words1].filter(w => !commonWords.includes(w)));
  const filteredWords2 = new Set([...words2].filter(w => !commonWords.includes(w)));
  
  const intersection = new Set([...filteredWords1].filter(word => filteredWords2.has(word)));
  const union = new Set([...filteredWords1, ...filteredWords2]);
  const similarity = union.size > 0 ? intersection.size / union.size : 0;
  
  console.log(`   📊 التشابه: ${(similarity * 100).toFixed(1)}% (${intersection.size}/${union.size})`);
  console.log(`   🔤 الكلمات المشتركة: [${[...intersection].slice(0, 5).join(', ')}]`);
  
  // تحديد العتبة بناء على نوع المنتج
  let threshold = 0.75;
  if (type1 === 'tv' || type1 === 't.v' || type2 === 'tv' || type2 === 't.v') {
    threshold = 0.85; // عتبة أعلى للتلفزيونات
  }
  
  const isSame = similarity >= threshold;
  
  if (isSame) {
    console.log(`   ✅ منتجات متطابقة (${(similarity * 100).toFixed(1)}% ≥ ${(threshold * 100).toFixed(1)}%)`);
  } else {
    console.log(`   ❌ منتجات مختلفة (${(similarity * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%)`);
  }
  
  return {
    isSame: isSame,
    explanation: `التشابه النصي: ${(similarity * 100).toFixed(1)}% (عتبة: ${(threshold * 100).toFixed(1)}%)`
  };
}

// ==================== حفظ الحالة ====================
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
async function unifyItems() {
  console.log('🚀 بدء التوحيد الذكي المحسن...\n');
  
  try {
    // قراءة البيانات من Google Sheets
    console.log('📖 قراءة البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });
    
    const rows = response.data.values || [];
    console.log(`✅ تم قراءة ${rows.length} صف\n`);
    
    if (rows.length < 2) {
      console.log('❌ لا توجد بيانات كافية للمعالجة');
      return;
    }
    
    // ==================== تحليل البنود ====================
    console.log('🔍 تحليل البنود وإنشاء المجموعات الفريدة...');
    
    const groups = new Map();
    const itemGroups = [];
    let groupCounter = 1;
    let comparisonCount = 0;
    
    // معالجة كل صف
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      
      // استخراج البيانات
      const currentId = row[0] || '';
      const lineItem = row[2] || '';
      const partNumber = row[3] || '';
      const description = row[4] || '';
      
      // تخطي الصفوف الفارغة
      if (!lineItem && !partNumber && !description) {
        itemGroups.push(null);
        continue;
      }
      
      // البحث عن مجموعة موجودة
      let groupId = null;
      let matchReason = '';
      
      if (description) {
        console.log(`\n🔍 معالجة الصف ${i+1}: "${description.substring(0, 60)}..."`);
        
        for (const [key, group] of groups.entries()) {
          for (const existingDesc of group.descriptions) {
            comparisonCount++;
            const comparison = areProductsSimilar(description, existingDesc);
            
            if (comparison.isSame) {
              groupId = key;
              matchReason = `منتج متشابه: ${comparison.explanation}`;
              console.log(`   🎯 تطابق مع المجموعة ${key}`);
              break;
            }
          }
          if (groupId) break;
        }
      }
      
      // إنشاء مجموعة جديدة
      if (!groupId) {
        groupId = `P-${groupCounter.toString().padStart(7, '0')}`;
        groups.set(groupId, {
          descriptions: new Set(),
          partNumbers: new Set(),
          lineItems: new Set(),
          rows: []
        });
        groupCounter++;
        matchReason = 'منتج فريد';
        console.log(`   🆕 مجموعة جديدة: ${groupId}`);
      }
      
      // إضافة البيانات للمجموعة
      const group = groups.get(groupId);
      if (description) group.descriptions.add(description);
      if (partNumber) group.partNumbers.add(partNumber);
      if (lineItem) group.lineItems.add(lineItem);
      group.rows.push(i);
      
      // حفظ معلومات المجموعة
      itemGroups.push({
        row: i,
        groupId,
        matchReason
      });
      
      // عرض التقدم
      if ((i % 50) === 0) {
        console.log(`\n⏳ التقدم: ${i}/${rows.length-1} (${Math.round(i * 100 / (rows.length-1))}%)`);
        console.log(`📊 عدد المقارنات: ${comparisonCount}`);
        console.log(`🆔 عدد المجموعات: ${groups.size}`);
        saveStatus(i, rows.length - 1, true);
      }
    }
    
    console.log(`\n✅ تم إنشاء ${groups.size} معرف فريد`);
    console.log(`📊 إجمالي المقارنات: ${comparisonCount}\n`);
    
    // ==================== عرض الإحصائيات ====================
    console.log('📊 الإحصائيات النهائية:');
    
    let totalUnified = 0;
    let duplicateGroups = 0;
    let uniqueProducts = 0;
    
    for (const [groupId, group] of groups.entries()) {
      if (group.rows.length > 1) {
        duplicateGroups++;
        totalUnified += group.rows.length;
        console.log(`   🔗 ${groupId}: ${group.rows.length} بند متطابق`);
      } else {
        uniqueProducts++;
      }
    }
    
    console.log(`\n📈 النتائج النهائية:`);
    console.log(`   • إجمالي البنود: ${rows.length - 1}`);
    console.log(`   • المنتجات الفريدة: ${uniqueProducts}`);
    console.log(`   • المنتجات المكررة: ${duplicateGroups}`);
    console.log(`   • البنود الموحدة: ${totalUnified}`);
    console.log(`   • إجمالي المعرفات: ${groups.size}`);
    console.log(`   • معدل التوفير: ${Math.round((rows.length - 1 - groups.size) * 100 / (rows.length - 1))}%\n`);
    
    // ==================== تحديث Google Sheets ====================
    console.log('💾 تحديث Google Sheets...');
    
    const updates = [];
    for (const item of itemGroups) {
      if (item) {
        updates.push({
          range: `DATA!A${item.row + 1}`,
          values: [[item.groupId]]
        });
      }
    }
    
    // تطبيق التحديثات بدفعات
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
    }
    
    console.log('\n🎉 اكتمل التوحيد المحسن بنجاح!');
    
    // حفظ الحالة النهائية
    saveStatus(rows.length - 1, rows.length - 1, false);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response?.data) {
      console.error('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// تشغيل البرنامج
console.log('=====================================');
console.log('   نظام التوحيد الذكي المحسن');
console.log('=====================================\n');

unifyItems();