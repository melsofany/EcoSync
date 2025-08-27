#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';

console.log('🚀 بدء التوحيد بالأولويات الصحيحة...\n');
console.log('📋 الأولويات:');
console.log('   1️⃣ الوصف (Description)');
console.log('   2️⃣ رقم القطعة (PART NUMBER)');
console.log('   3️⃣ رقم البند (LINE ITEM)\n');

// الاتصال بـ Google Sheets
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

console.log('✅ تم الاتصال بـ Google Sheets\n');

// قراءة كل البيانات
console.log('📊 قراءة جميع البيانات...');
const res = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: 'DATA!A:E'
});

const rows = res.data.values || [];
console.log(`📊 تم قراءة ${rows.length} صف\n`);

// تحضير البيانات
const items = [];
for (let i = 1; i < rows.length; i++) {
  const [id, unit, line, part, desc] = rows[i] || [];
  if (line || part || desc) {
    items.push({
      row: i + 1,
      currentId: id || '',
      line: (line || '').trim(),
      part: (part || '').trim(),
      desc: (desc || '').trim()
    });
  }
}

console.log(`✅ تم تحضير ${items.length} بند للمعالجة\n`);

// دالة تنظيف النص للمقارنة
function cleanText(text) {
  if (!text) return '';
  // إزالة المسافات والرموز الخاصة وتوحيد الأحرف الكبيرة
  return text.toUpperCase()
    .replace(/\s+/g, ' ')  // توحيد المسافات
    .replace(/[\r\n\t]/g, ' ')  // إزالة أسطر جديدة
    .replace(/[^\w\s\u0600-\u06FF]/g, '')  // إزالة الرموز الخاصة (مع الاحتفاظ بالعربية)
    .trim();
}

// دالة المقارنة بالأولويات
function areItemsSimilar(a, b) {
  // 1. أولوية الوصف (Description)
  if (a.desc && b.desc) {
    const cleanDescA = cleanText(a.desc);
    const cleanDescB = cleanText(b.desc);
    
    // إذا كان الوصف متطابق تماماً
    if (cleanDescA === cleanDescB && cleanDescA.length > 5) {
      return { match: true, reason: 'DESC', confidence: 100 };
    }
    
    // مقارنة الوصف بدون الأسطر الجديدة والمسافات الزائدة
    const descA = a.desc.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    const descB = b.desc.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (descA === descB && descA.length > 5) {
      return { match: true, reason: 'DESC', confidence: 95 };
    }
  }
  
  // 2. أولوية رقم القطعة (PART NUMBER)
  if (a.part && b.part) {
    const cleanPartA = a.part.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    const cleanPartB = b.part.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    
    if (cleanPartA === cleanPartB && cleanPartA.length > 0) {
      // تحقق إضافي: إذا كان لديهما نفس LINE ITEM أيضاً
      if (a.line && b.line) {
        const cleanLineA = a.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
        const cleanLineB = b.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
        if (cleanLineA === cleanLineB) {
          return { match: true, reason: 'PART+LINE', confidence: 100 };
        }
      }
      return { match: true, reason: 'PART', confidence: 90 };
    }
  }
  
  // 3. أولوية رقم البند (LINE ITEM)
  if (a.line && b.line) {
    const cleanLineA = a.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    const cleanLineB = b.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    
    if (cleanLineA === cleanLineB && cleanLineA.length > 0) {
      return { match: true, reason: 'LINE', confidence: 80 };
    }
  }
  
  return { match: false };
}

// التوحيد
console.log('🔍 بدء معالجة التوحيد...\n');
const groups = [];
const used = new Set();
let nextId = 1;
let totalMatches = 0;
const matchStats = { DESC: 0, PART: 0, LINE: 0, 'PART+LINE': 0 };

for (let i = 0; i < items.length; i++) {
  if (used.has(i)) continue;
  
  if (i % 500 === 0) {
    console.log(`⏳ معالجة: ${i}/${items.length} (${Math.round(i * 100 / items.length)}%)`);
  }
  
  const master = items[i];
  const groupId = `P-${String(nextId).padStart(7, '0')}`;
  nextId++;
  
  const group = { 
    id: groupId, 
    items: [master],
    reasons: []
  };
  used.add(i);
  
  // البحث عن التطابقات
  for (let j = i + 1; j < items.length; j++) {
    if (used.has(j)) continue;
    
    const result = areItemsSimilar(master, items[j]);
    if (result.match) {
      group.items.push(items[j]);
      group.reasons.push(result.reason);
      used.add(j);
      totalMatches++;
      matchStats[result.reason]++;
      
      // عرض أمثلة على التطابقات
      if (totalMatches <= 50 || (result.reason === 'DESC' && matchStats.DESC <= 20)) {
        console.log(`  ✅ تطابق ${result.reason} (${result.confidence}%): صف ${master.row} مع ${items[j].row}`);
        if (result.reason === 'PART+LINE') {
          console.log(`     - LINE: ${master.line}`);
          console.log(`     - PART: ${master.part}`);
        }
      }
    }
  }
  
  groups.push(group);
}

console.log(`\n📊 النتائج النهائية:`);
console.log(`  - إجمالي البنود: ${items.length}`);
console.log(`  - المجموعات المنشأة: ${groups.length}`);
console.log(`  - البنود المتطابقة: ${totalMatches}`);
console.log(`  - المجموعات مع تطابقات: ${groups.filter(g => g.items.length > 1).length}`);
console.log(`\n📊 إحصائيات التطابق:`);
console.log(`  - تطابق الوصف: ${matchStats.DESC}`);
console.log(`  - تطابق رقم القطعة: ${matchStats.PART}`);
console.log(`  - تطابق رقم البند: ${matchStats.LINE}`);
console.log(`  - تطابق القطعة+البند: ${matchStats['PART+LINE']}\n`);

// الكتابة إلى Google Sheets
const updates = [];
for (const g of groups) {
  for (const item of g.items) {
    updates.push({
      range: `DATA!A${item.row}`,
      values: [[g.id]]
    });
  }
}

console.log(`📝 كتابة ${updates.length} معرف جديد إلى Google Sheets...`);

// الكتابة على دفعات
const batchSize = 100;
for (let i = 0; i < updates.length; i += batchSize) {
  const batch = updates.slice(i, i + batchSize);
  
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: batch
    }
  });
  
  console.log(`  ✅ تمت كتابة ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
  
  // انتظار قليل لتجنب حدود API
  if (i + batchSize < updates.length) {
    await new Promise(r => setTimeout(r, 500));
  }
}

console.log(`\n🎉 اكتمل التوحيد بنجاح!`);
console.log(`✅ تم توحيد ${totalMatches} بند في ${groups.filter(g => g.items.length > 1).length} مجموعة`);

// عرض أمثلة على المجموعات الكبيرة
const largeGroups = groups.filter(g => g.items.length > 5).slice(0, 5);
if (largeGroups.length > 0) {
  console.log(`\n📋 أمثلة على المجموعات الكبيرة:`);
  for (const g of largeGroups) {
    const sample = g.items[0];
    console.log(`  - المعرف ${g.id}: ${g.items.length} بند`);
    console.log(`    LINE: ${sample.line || 'لا يوجد'}`);
    console.log(`    PART: ${sample.part || 'لا يوجد'}`);
    console.log(`    DESC: ${(sample.desc || 'لا يوجد').substring(0, 50)}...`);
  }
}