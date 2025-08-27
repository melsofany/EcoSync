#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';

console.log('🚀 بدء التوحيد الكامل لجميع البنود في Google Sheets...\n');

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

// تحضير البيانات (تخطي الصف الأول - العناوين)
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

// دالة المقارنة
function areItemsSimilar(a, b) {
  // مقارنة LINE ITEM
  if (a.line && b.line) {
    const cleanA = a.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    const cleanB = b.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    if (cleanA === cleanB && cleanA.length > 0) {
      return { match: true, reason: 'LINE' };
    }
  }
  
  // مقارنة PART NUMBER
  if (a.part && b.part) {
    const cleanA = a.part.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    const cleanB = b.part.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    if (cleanA === cleanB && cleanA.length > 0) {
      return { match: true, reason: 'PART' };
    }
  }
  
  // مقارنة الوصف التام
  if (a.desc && b.desc && a.desc.length > 10 && b.desc.length > 10) {
    const descA = a.desc.toUpperCase();
    const descB = b.desc.toUpperCase();
    if (descA === descB) {
      return { match: true, reason: 'DESC' };
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

for (let i = 0; i < items.length; i++) {
  if (used.has(i)) continue;
  
  if (i % 500 === 0) {
    console.log(`⏳ معالجة: ${i}/${items.length} (${Math.round(i * 100 / items.length)}%)`);
  }
  
  const master = items[i];
  const groupId = `P-${String(nextId).padStart(7, '0')}`;
  nextId++;
  
  const group = { id: groupId, items: [master] };
  used.add(i);
  
  // البحث عن التطابقات
  for (let j = i + 1; j < items.length; j++) {
    if (used.has(j)) continue;
    
    const result = areItemsSimilar(master, items[j]);
    if (result.match) {
      group.items.push(items[j]);
      used.add(j);
      totalMatches++;
      
      // عرض التطابقات المهمة فقط
      if (totalMatches <= 100 || totalMatches % 50 === 0) {
        console.log(`  ✅ تطابق ${result.reason}: صف ${master.row} مع ${items[j].row}`);
      }
    }
  }
  
  groups.push(group);
}

console.log(`\n📊 النتائج النهائية:`);
console.log(`  - إجمالي البنود: ${items.length}`);
console.log(`  - المجموعات المنشأة: ${groups.length}`);
console.log(`  - البنود المتطابقة: ${totalMatches}`);
console.log(`  - المجموعات مع تطابقات: ${groups.filter(g => g.items.length > 1).length}\n`);

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
