#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

console.log('🚀 نظام التوحيد الذكي الشامل...\n');

// إعدادات DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-36bc95e2c5fd4e8c97f9e1e5e5cf9e8e';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// الاتصال بـ Google Sheets
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

console.log('✅ تم الاتصال بـ Google Sheets');
console.log('🤖 تم تهيئة DeepSeek AI\n');

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
      unit: unit || '',
      line: (line || '').trim(),
      part: (part || '').trim(),
      desc: (desc || '').trim()
    });
  }
}

console.log(`✅ تم تحضير ${items.length} بند للمعالجة\n`);

// دالة تنظيف النص
function cleanForComparison(text) {
  if (!text) return '';
  return text.toUpperCase()
    .replace(/[\r\n\t]+/g, ' ')  // استبدال أسطر جديدة بمسافة
    .replace(/\s+/g, ' ')         // توحيد المسافات
    .replace(/[^\w\s\u0600-\u06FF]/g, '')  // إزالة الرموز الخاصة
    .trim();
}

// دالة المقارنة الذكية
function smartCompare(a, b) {
  // 1. المقارنة بالوصف (أولوية قصوى)
  if (a.desc && b.desc) {
    const cleanDescA = cleanForComparison(a.desc);
    const cleanDescB = cleanForComparison(b.desc);
    
    // تطابق تام في الوصف
    if (cleanDescA === cleanDescB && cleanDescA.length > 10) {
      return { match: true, confidence: 100, reason: 'DESC_EXACT' };
    }
    
    // تطابق بدون تنظيف كامل (للنصوص متعددة الأسطر)
    const simpleDescA = a.desc.replace(/\s+/g, ' ').trim();
    const simpleDescB = b.desc.replace(/\s+/g, ' ').trim();
    if (simpleDescA === simpleDescB && simpleDescA.length > 10) {
      return { match: true, confidence: 95, reason: 'DESC_SIMILAR' };
    }
  }
  
  // 2. المقارنة برقم القطعة (أولوية عالية)
  if (a.part && b.part) {
    const cleanPartA = a.part.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanPartB = b.part.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanPartA === cleanPartB && cleanPartA.length > 2) {
      // إذا كان LINE ITEM متطابق أيضاً، الثقة أعلى
      if (a.line && b.line) {
        const cleanLineA = a.line.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const cleanLineB = b.line.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (cleanLineA === cleanLineB) {
          return { match: true, confidence: 98, reason: 'PART_AND_LINE' };
        }
      }
      return { match: true, confidence: 90, reason: 'PART_EXACT' };
    }
  }
  
  // 3. المقارنة برقم البند (أولوية متوسطة)
  if (a.line && b.line) {
    const cleanLineA = a.line.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanLineB = b.line.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanLineA === cleanLineB && cleanLineA.length > 5) {
      // التحقق من تشابه الوصف الجزئي
      if (a.desc && b.desc) {
        const wordsA = a.desc.toUpperCase().split(/\s+/);
        const wordsB = b.desc.toUpperCase().split(/\s+/);
        const commonWords = wordsA.filter(w => wordsB.includes(w) && w.length > 3);
        
        if (commonWords.length >= 3) {
          return { match: true, confidence: 88, reason: 'LINE_WITH_DESC' };
        }
      }
      return { match: true, confidence: 85, reason: 'LINE_EXACT' };
    }
  }
  
  return { match: false, confidence: 0, reason: 'NO_MATCH' };
}

// استدعاء DeepSeek للحالات المعقدة
async function deepSeekCompare(a, b) {
  try {
    const prompt = `Compare these two items and return similarity (0-100):
    
Item 1:
- LINE: ${a.line || 'N/A'}
- PART: ${a.part || 'N/A'}
- DESC: ${a.desc || 'N/A'}

Item 2:
- LINE: ${b.line || 'N/A'}
- PART: ${b.part || 'N/A'}
- DESC: ${b.desc || 'N/A'}

Return JSON only: {"similarity": number, "reason": "string"}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Return JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      try {
        const result = JSON.parse(content);
        return { 
          match: result.similarity >= 80, 
          confidence: result.similarity, 
          reason: 'AI_' + result.reason 
        };
      } catch (e) {
        return { match: false, confidence: 0, reason: 'AI_ERROR' };
      }
    }
  } catch (error) {
    // في حالة الفشل، استخدم المقارنة المحلية
  }
  
  return smartCompare(a, b);
}

// التوحيد الشامل
console.log('🔍 بدء التوحيد الشامل...\n');
const groups = [];
const used = new Set();
let nextId = 1;
let totalMatches = 0;
const stats = {
  DESC_EXACT: 0,
  DESC_SIMILAR: 0,
  PART_AND_LINE: 0,
  PART_EXACT: 0,
  LINE_WITH_DESC: 0,
  LINE_EXACT: 0,
  AI: 0
};

// معالجة البيانات
for (let i = 0; i < items.length; i++) {
  if (used.has(i)) continue;
  
  if (i % 200 === 0) {
    console.log(`⏳ معالجة: ${i}/${items.length} (${Math.round(i * 100 / items.length)}%)`);
  }
  
  const master = items[i];
  const groupId = `P-${String(nextId).padStart(7, '0')}`;
  nextId++;
  
  const group = {
    id: groupId,
    items: [master],
    matches: []
  };
  used.add(i);
  
  // البحث عن التطابقات
  for (let j = i + 1; j < items.length; j++) {
    if (used.has(j)) continue;
    
    const result = smartCompare(master, items[j]);
    
    // استخدام AI للحالات الحدية (اختياري)
    if (!result.match && i < 100 && j < 100 && stats.AI < 20) {
      const aiResult = await deepSeekCompare(master, items[j]);
      if (aiResult.match) {
        result.match = true;
        result.confidence = aiResult.confidence;
        result.reason = aiResult.reason;
        stats.AI++;
      }
    }
    
    if (result.match) {
      group.items.push(items[j]);
      group.matches.push({
        row: items[j].row,
        confidence: result.confidence,
        reason: result.reason
      });
      used.add(j);
      totalMatches++;
      
      // تحديث الإحصائيات
      if (stats[result.reason] !== undefined) {
        stats[result.reason]++;
      }
      
      // عرض أمثلة
      if (totalMatches <= 50 || totalMatches % 100 === 0) {
        console.log(`  ✅ تطابق ${result.confidence}%: صف ${master.row} مع ${items[j].row} (${result.reason})`);
      }
    }
  }
  
  groups.push(group);
}

console.log(`\n📊 النتائج النهائية:`);
console.log(`  - إجمالي البنود: ${items.length}`);
console.log(`  - المجموعات المنشأة: ${groups.length}`);
console.log(`  - البنود الموحدة: ${totalMatches}`);
console.log(`  - المجموعات مع تطابقات: ${groups.filter(g => g.items.length > 1).length}`);

console.log(`\n📊 إحصائيات التطابق:`);
console.log(`  - تطابق الوصف التام: ${stats.DESC_EXACT}`);
console.log(`  - تطابق الوصف المشابه: ${stats.DESC_SIMILAR}`);
console.log(`  - تطابق القطعة والبند: ${stats.PART_AND_LINE}`);
console.log(`  - تطابق رقم القطعة: ${stats.PART_EXACT}`);
console.log(`  - تطابق البند مع الوصف: ${stats.LINE_WITH_DESC}`);
console.log(`  - تطابق رقم البند: ${stats.LINE_EXACT}`);
if (stats.AI > 0) {
  console.log(`  - تطابق بالذكاء الاصطناعي: ${stats.AI}`);
}

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

console.log(`\n📝 كتابة ${updates.length} معرف موحد إلى Google Sheets...`);

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
  
  if (i + batchSize < updates.length) {
    await new Promise(r => setTimeout(r, 300));
  }
}

console.log(`\n🎉 اكتمل التوحيد الشامل بنجاح!`);
console.log(`✅ تم توحيد ${totalMatches} بند في ${groups.filter(g => g.items.length > 1).length} مجموعة`);

// عرض أكبر المجموعات
const largeGroups = groups.filter(g => g.items.length > 5).sort((a, b) => b.items.length - a.items.length).slice(0, 5);
if (largeGroups.length > 0) {
  console.log(`\n🏆 أكبر المجموعات الموحدة:`);
  for (const g of largeGroups) {
    const sample = g.items[0];
    console.log(`\n  📦 المعرف ${g.id}: ${g.items.length} بند`);
    console.log(`     LINE: ${sample.line || 'غير محدد'}`);
    console.log(`     PART: ${sample.part || 'غير محدد'}`);
    console.log(`     الوصف: ${(sample.desc || 'غير محدد').substring(0, 60)}...`);
  }
}

console.log(`\n✅ التوحيد الذكي اكتمل 100%!`);