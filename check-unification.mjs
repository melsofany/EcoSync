#!/usr/bin/env node
// استخدام: node check-unification.mjs

/**
 * فحص نتائج التوحيد
 * يفحص Google Sheets ويعرض إحصائيات التوحيد
 */

import { google } from 'googleapis';
import fs from 'fs';

// التكوين
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

// البرنامج الرئيسي
async function checkUnification() {
  console.log('🔍 فحص نتائج التوحيد...\n');
  
  try {
    // قراءة البيانات
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });
    
    const rows = response.data.values || [];
    console.log(`📊 إجمالي الصفوف: ${rows.length}`);
    console.log(`📋 إجمالي البنود: ${rows.length - 1}\n`);
    
    // تحليل البيانات
    const groups = new Map();
    const emptyRows = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const id = row[0] || '';
      const lineItem = row[2] || '';
      const partNumber = row[3] || '';
      const description = row[4] || '';
      
      // تحقق من الصفوف الفارغة
      if (!lineItem && !partNumber && !description) {
        emptyRows.push(i + 1);
        continue;
      }
      
      // تجميع حسب المعرف
      if (id) {
        if (!groups.has(id)) {
          groups.set(id, {
            count: 0,
            rows: [],
            samples: []
          });
        }
        
        const group = groups.get(id);
        group.count++;
        group.rows.push(i + 1);
        
        if (group.samples.length < 3) {
          group.samples.push({
            row: i + 1,
            lineItem,
            partNumber,
            description: description ? description.substring(0, 50) : ''
          });
        }
      }
    }
    
    // حساب الإحصائيات
    let totalUnified = 0;
    let duplicateGroups = 0;
    const largeGroups = [];
    
    for (const [id, group] of groups.entries()) {
      if (group.count > 1) {
        duplicateGroups++;
        totalUnified += group.count;
        
        if (group.count >= 5) {
          largeGroups.push({ id, ...group });
        }
      }
    }
    
    // عرض النتائج
    console.log('═══════════════════════════════════════');
    console.log('            📈 نتائج التوحيد');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`✅ إجمالي البنود: ${rows.length - 1}`);
    console.log(`✅ المجموعات الفريدة: ${groups.size}`);
    console.log(`✅ المجموعات المكررة: ${duplicateGroups}`);
    console.log(`✅ البنود الموحدة: ${totalUnified}`);
    console.log(`✅ معدل التوحيد: ${Math.round(totalUnified * 100 / (rows.length - 1))}%`);
    console.log(`✅ الصفوف الفارغة: ${emptyRows.length}\n`);
    
    // عرض أكبر المجموعات
    if (largeGroups.length > 0) {
      console.log('═══════════════════════════════════════');
      console.log('         🏆 أكبر المجموعات');
      console.log('═══════════════════════════════════════\n');
      
      // ترتيب حسب الحجم
      largeGroups.sort((a, b) => b.count - a.count);
      
      // عرض أول 10 مجموعات
      for (let i = 0; i < Math.min(10, largeGroups.length); i++) {
        const group = largeGroups[i];
        console.log(`${i + 1}. ${group.id} - ${group.count} بند`);
        
        // عرض عينات
        for (const sample of group.samples) {
          console.log(`   • الصف ${sample.row}:`);
          if (sample.description) {
            console.log(`     الوصف: ${sample.description}...`);
          }
          if (sample.partNumber) {
            console.log(`     رقم القطعة: ${sample.partNumber}`);
          }
          if (sample.lineItem) {
            console.log(`     رقم البند: ${sample.lineItem}`);
          }
        }
        
        if (group.count > 3) {
          console.log(`   ... و ${group.count - 3} بند آخر`);
        }
        console.log('');
      }
    }
    
    // البحث عن بند معين (مثال: LC1D)
    console.log('═══════════════════════════════════════');
    console.log('        🔍 بحث عن LC1D');
    console.log('═══════════════════════════════════════\n');
    
    const lcidGroups = new Map();
    let lcidCount = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const id = row[0] || '';
      const description = row[4] || '';
      const partNumber = row[3] || '';
      
      if (description.includes('LC1D') || partNumber.includes('LC1D')) {
        lcidCount++;
        
        if (!lcidGroups.has(id)) {
          lcidGroups.set(id, {
            count: 0,
            rows: []
          });
        }
        
        lcidGroups.get(id).count++;
        lcidGroups.get(id).rows.push(i + 1);
      }
    }
    
    console.log(`🔍 وجدت ${lcidCount} بند يحتوي على LC1D`);
    console.log(`📦 موزعة على ${lcidGroups.size} مجموعة:\n`);
    
    for (const [id, group] of lcidGroups.entries()) {
      console.log(`   • ${id}: ${group.count} بند (الصفوف: ${group.rows.slice(0, 5).join(', ')}${group.rows.length > 5 ? '...' : ''})`);
    }
    
    // التحقق من الأخطاء المحتملة
    console.log('\n═══════════════════════════════════════');
    console.log('        ⚠️ فحص الأخطاء');
    console.log('═══════════════════════════════════════\n');
    
    let noIdCount = 0;
    const duplicateDescriptions = new Map();
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const id = row[0] || '';
      const description = row[4] || '';
      
      // بنود بدون معرف
      if (!id && description) {
        noIdCount++;
      }
      
      // أوصاف مكررة بمعرفات مختلفة
      if (description) {
        const normalized = description.toLowerCase().trim();
        if (!duplicateDescriptions.has(normalized)) {
          duplicateDescriptions.set(normalized, new Set());
        }
        if (id) {
          duplicateDescriptions.get(normalized).add(id);
        }
      }
    }
    
    console.log(`⚠️ بنود بدون معرف: ${noIdCount}`);
    
    // عد الأوصاف المكررة بمعرفات مختلفة
    let duplicateCount = 0;
    for (const [desc, ids] of duplicateDescriptions.entries()) {
      if (ids.size > 1) {
        duplicateCount++;
      }
    }
    
    console.log(`⚠️ أوصاف مكررة بمعرفات مختلفة: ${duplicateCount}`);
    
    if (duplicateCount > 0 && duplicateCount <= 5) {
      console.log('\n   أمثلة:');
      let exampleCount = 0;
      for (const [desc, ids] of duplicateDescriptions.entries()) {
        if (ids.size > 1 && exampleCount < 5) {
          console.log(`   • "${desc.substring(0, 50)}..."`);
          console.log(`     المعرفات: ${Array.from(ids).join(', ')}`);
          exampleCount++;
        }
      }
    }
    
    console.log('\n✅ اكتمل الفحص!');
    
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
  }
}

// تشغيل البرنامج
console.log('=====================================');
console.log('         فحص نتائج التوحيد');
console.log('=====================================\n');

checkUnification();