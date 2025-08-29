#!/usr/bin/env node
// استخدام: node unification-system-fixed.mjs

/**
 * نظام التوحيد الذكي - الإصدار المصحح
 * يوحد البنود المتطابقة في Google Sheets بناءً على التطابق الصارم
 * كل منتج مختلف يحصل على معرف منفصل P-XXXXXXX
 */

import { google } from 'googleapis';
import fs from 'fs';

// ==================== التكوين ====================
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

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
    .replace(/\s+/g, ' ')           // توحيد المسافات
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // إزالة الرموز الخاصة
    .trim();
}

// دالة فحص التشابه بين المنتجات
function areProductsSimilar(desc1, desc2) {
  if (!desc1 || !desc2) return false;
  
  // تطبيع النصوص
  const clean1 = normalize(desc1).replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const clean2 = normalize(desc2).replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // استخراج الكلمات المهمة
  const getKeywords = (text) => {
    return text.split(' ')
      .filter(word => word.length > 2) // فقط الكلمات الطويلة
      .filter(word => !['led', 'tv', 't.v', 'built', 'in', 'receiver', 'with'].includes(word)); // تجاهل الكلمات الشائعة
  };
  
  const keywords1 = getKeywords(clean1);
  const keywords2 = getKeywords(clean2);
  
  // البحث عن الحجم (32", 43", 55", إلخ) - نمط محسن
  const sizeMatch1 = desc1.match(/(\d+)\s*(?:"|''|inch|بوصة)/i);
  const sizeMatch2 = desc2.match(/(\d+)\s*(?:"|''|inch|بوصة)/i);
  
  console.log(`🔍 فحص الأحجام: "${desc1.substring(0, 30)}..." vs "${desc2.substring(0, 30)}..."`);
  console.log(`   الحجم 1: ${sizeMatch1 ? sizeMatch1[1] + '"' : 'غير محدد'}`);
  console.log(`   الحجم 2: ${sizeMatch2 ? sizeMatch2[1] + '"' : 'غير محدد'}`);
  
  // يجب أن يتطابق الحجم بالضبط - هذا شرط إجباري!
  if (sizeMatch1 && sizeMatch2) {
    if (sizeMatch1[1] !== sizeMatch2[1]) {
      console.log(`❌ رفض التطابق: أحجام مختلفة ${sizeMatch1[1]}" ≠ ${sizeMatch2[1]}"`);
      return false;
    }
  }
  
  // إذا كان أحدهما يحتوي على حجم والآخر لا، فهما مختلفان
  if ((sizeMatch1 && !sizeMatch2) || (!sizeMatch1 && sizeMatch2)) {
    console.log(`❌ رفض التطابق: حجم واحد فقط محدد`);
    return false;
  }
  
  // البحث عن العلامة التجارية
  const brands1 = keywords1.filter(word => ['samsung', 'tornado', 'toshiba', 'lg', 'sony'].includes(word));
  const brands2 = keywords2.filter(word => ['samsung', 'tornado', 'toshiba', 'lg', 'sony'].includes(word));
  
  // يجب أن تتطابق العلامة التجارية
  if (brands1.length > 0 && brands2.length > 0) {
    const commonBrands = brands1.filter(brand => brands2.includes(brand));
    if (commonBrands.length === 0) {
      console.log(`❌ رفض التطابق: علامات تجارية مختلفة ${brands1.join(',')} ≠ ${brands2.join(',')}`);
      return false;
    }
  }
  
  // حساب نسبة التشابه
  const commonKeywords = keywords1.filter(word => keywords2.includes(word));
  const totalKeywords = [...new Set([...keywords1, ...keywords2])].length;
  
  if (totalKeywords === 0) return false;
  
  const similarity = commonKeywords.length / totalKeywords;
  
  // تطابق عالي = منتج متشابه (مع التأكد من المتطلبات الأساسية)
  const isMatch = similarity >= 0.8; // زيادة معدل التشابه المطلوب
  
  if (isMatch) {
    console.log(`✅ تطابق مقبول: ${similarity.toFixed(2)} تشابه`);
    console.log(`   النص 1: ${clean1.substring(0, 50)}...`);
    console.log(`   النص 2: ${clean2.substring(0, 50)}...`);
  }
  
  return isMatch;
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
  console.log('🚀 بدء التوحيد الذكي المصحح للبنود...\n');
  
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
    
    // ==================== المرحلة 1: تحليل البنود ====================
    console.log('🔍 تحليل البنود وإنشاء المجموعات الفريدة...');
    
    const groups = new Map(); // خريطة المجموعات
    const itemGroups = [];    // مصفوفة لتتبع كل صف ومجموعته
    let groupCounter = 1;
    
    // معالجة كل صف (بدءاً من الصف الثاني)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      
      // استخراج البيانات
      const currentId = row[0] || '';
      const lineItem = normalize(row[2] || ''); // العمود C
      const partNumber = normalize(row[3] || ''); // العمود D
      const description = normalize(row[4] || ''); // العمود E
      
      // تخطي الصفوف الفارغة
      if (!lineItem && !partNumber && !description) {
        itemGroups.push(null);
        continue;
      }
      
      // البحث عن مجموعة موجودة - مطابقة صارمة جداً
      let groupId = null;
      let matchReason = '';
      
      // مطابقة ذكية: البحث عن التشابه في المعنى الأساسي
      if (description) {
        for (const [key, group] of groups.entries()) {
          // فحص كل وصف في المجموعة
          for (const existingDesc of group.descriptions) {
            if (areProductsSimilar(description, existingDesc)) {
              groupId = key;
              matchReason = `منتج متشابه: ${description.substring(0, 30)}...`;
              break;
            }
          }
          if (groupId) break;
        }
      }
      
      // إنشاء مجموعة جديدة لكل منتج فريد
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
      }
      
      // إضافة البيانات للمجموعة
      const group = groups.get(groupId);
      if (description) group.descriptions.add(description);
      if (partNumber) group.partNumbers.add(partNumber);
      if (lineItem) group.lineItems.add(lineItem);
      group.rows.push(i);
      
      // حفظ معلومات المجموعة للصف
      itemGroups.push({
        row: i,
        groupId,
        matchReason
      });
      
      // عرض التفاصيل
      if (group.rows.length === 1) {
        console.log(`🆕 منتج فريد: ${description || partNumber || lineItem}`);
        console.log(`   📝 المعرف الجديد: ${groupId}`);
      } else {
        console.log(`✅ تم دمج بند متطابق: ${description || partNumber || lineItem}`);
        console.log(`   📝 المعرف الموحد: ${groupId}`);
      }
      
      // عرض التقدم وحفظ الحالة
      if ((i % 50) === 0) {
        console.log(`⏳ معالجة: ${i}/${rows.length-1} (${Math.round(i * 100 / (rows.length-1))}%)`);
        saveStatus(i, rows.length - 1, true);
      }
    }
    
    console.log(`\n✅ تم إنشاء ${groups.size} معرف فريد\n`);
    
    // ==================== المرحلة 2: إحصائيات ====================
    console.log('📊 حساب الإحصائيات...');
    
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
    
    console.log(`\n📈 النتائج:`);
    console.log(`   • إجمالي البنود: ${rows.length - 1}`);
    console.log(`   • المنتجات الفريدة: ${uniqueProducts}`);
    console.log(`   • المنتجات المكررة: ${duplicateGroups}`);
    console.log(`   • البنود الموحدة: ${totalUnified}`);
    console.log(`   • إجمالي المعرفات: ${groups.size}`);
    console.log(`   • معدل التوفير: ${Math.round((rows.length - 1 - groups.size) * 100 / (rows.length - 1))}%\n`);
    
    // ==================== المرحلة 3: تحديث Google Sheets ====================
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
    
    // تقسيم التحديثات إلى دفعات
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
    
    console.log('\n🎉 اكتمل التوحيد المصحح بنجاح!');
    
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
console.log('   نظام التوحيد الذكي المصحح');
console.log('=====================================\n');

unifyItems();