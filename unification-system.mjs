#!/usr/bin/env node
// استخدام: node unification-system.mjs

/**
 * نظام التوحيد الذكي - الإصدار النهائي
 * يوحد البنود المتطابقة في Google Sheets بناءً على:
 * 1. الوصف (Description) - الأولوية الأولى
 * 2. رقم القطعة (PART NUMBER) - الأولوية الثانية  
 * 3. رقم البند (LINE ITEM) - الأولوية الثالثة
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
    .replace(/^\d+\s*-?\s*/, '')    // إزالة الأرقام في البداية
    .replace(/\s*-\s*/g, ' ')        // استبدال الشرطات بمسافات
    .replace(/(\d+)([a-z])/gi, '$1 $2') // فصل الأرقام عن الحروف
    .replace(/([a-z])(\d+)/gi, '$1 $2')
    .trim();
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
  console.log('🚀 بدء التوحيد الذكي للبنود...\n');
  
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
    console.log('🔍 تحليل البنود وإنشاء المجموعات...');
    
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
      
      // البحث عن مجموعة موجودة
      let groupId = null;
      let matchReason = '';
      
      // الأولوية 1: مطابقة الوصف
      if (description) {
        for (const [key, group] of groups.entries()) {
          if (group.descriptions.has(description)) {
            groupId = key;
            matchReason = `الوصف: ${description.substring(0, 30)}...`;
            break;
          }
        }
      }
      
      // الأولوية 2: مطابقة رقم القطعة (إذا لم نجد مطابقة بالوصف)
      if (!groupId && partNumber) {
        for (const [key, group] of groups.entries()) {
          if (group.partNumbers.has(partNumber)) {
            groupId = key;
            matchReason = `رقم القطعة: ${partNumber}`;
            break;
          }
        }
      }
      
      // الأولوية 3: مطابقة رقم البند (إذا لم نجد مطابقة بالوصف أو رقم القطعة)
      if (!groupId && lineItem) {
        for (const [key, group] of groups.entries()) {
          if (group.lineItems.has(lineItem)) {
            groupId = key;
            matchReason = `رقم البند: ${lineItem}`;
            break;
          }
        }
      }
      
      // إنشاء مجموعة جديدة إذا لم نجد مطابقة
      if (!groupId) {
        groupId = `P-${groupCounter.toString().padStart(7, '0')}`;
        groups.set(groupId, {
          descriptions: new Set(),
          partNumbers: new Set(),
          lineItems: new Set(),
          rows: []
        });
        groupCounter++;
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
      
      // عرض التقدم وحفظ الحالة
      if ((i % 10) === 0) {
        console.log(`⏳ معالجة: ${i}/${rows.length} (${Math.round(i * 100 / rows.length)}%)`);
        saveStatus(i, rows.length - 1, true); // حفظ الحالة كل 10 بنود
      }
    }
    
    console.log(`\n✅ تم إنشاء ${groups.size} مجموعة فريدة\n`);
    
    // ==================== المرحلة 2: إحصائيات ====================
    console.log('📊 حساب الإحصائيات...');
    
    let totalUnified = 0;
    let duplicateGroups = 0;
    
    for (const [groupId, group] of groups.entries()) {
      if (group.rows.length > 1) {
        duplicateGroups++;
        totalUnified += group.rows.length;
        
        // عرض أمثلة على المجموعات الكبيرة
        if (group.rows.length >= 10) {
          console.log(`   🔗 ${groupId}: ${group.rows.length} بند`);
        }
      }
    }
    
    console.log(`\n📈 النتائج:`);
    console.log(`   • إجمالي البنود: ${rows.length - 1}`);
    console.log(`   • المجموعات الفريدة: ${groups.size}`);
    console.log(`   • المجموعات المكررة: ${duplicateGroups}`);
    console.log(`   • البنود الموحدة: ${totalUnified}`);
    console.log(`   • معدل التوحيد: ${Math.round(totalUnified * 100 / (rows.length - 1))}%\n`);
    
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
    
    console.log('\n🎉 اكتمل التوحيد بنجاح!');
    
    // حفظ الحالة النهائية
    saveStatus(rows.length - 1, rows.length - 1, false);
    
    // ==================== المرحلة 4: عرض أمثلة ====================
    console.log('\n🔍 أمثلة على التوحيد:');
    
    let exampleCount = 0;
    for (const [groupId, group] of groups.entries()) {
      if (group.rows.length >= 5 && exampleCount < 5) {
        console.log(`\n   📦 المجموعة ${groupId}:`);
        console.log(`      • عدد البنود: ${group.rows.length}`);
        
        // عرض عينة من الأوصاف
        const descSample = Array.from(group.descriptions).slice(0, 2);
        if (descSample.length > 0) {
          console.log(`      • أمثلة أوصاف: ${descSample.join(' | ')}`);
        }
        
        // عرض عينة من أرقام القطع
        const partSample = Array.from(group.partNumbers).slice(0, 3);
        if (partSample.length > 0) {
          console.log(`      • أرقام القطع: ${partSample.join(', ')}`);
        }
        
        exampleCount++;
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response?.data) {
      console.error('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// تشغيل البرنامج
console.log('=====================================');
console.log('    نظام التوحيد الذكي للبنود');
console.log('=====================================\n');

unifyItems();