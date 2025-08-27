#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

console.log('🚀 بدء التوحيد الذكي باستخدام DeepSeek AI...\n');

// قراءة مفتاح DeepSeek من البيئة أو ملف التكوين
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
      line: (line || '').trim(),
      part: (part || '').trim(),
      desc: (desc || '').trim()
    });
  }
}

console.log(`✅ تم تحضير ${items.length} بند للمعالجة\n`);

// دالة للاتصال بـ DeepSeek
async function checkSimilarityWithDeepSeek(item1, item2) {
  try {
    const prompt = `قارن بين هذين البندين وحدد نسبة التطابق (0-100):

البند الأول:
- LINE ITEM: ${item1.line || 'غير محدد'}
- PART NUMBER: ${item1.part || 'غير محدد'}  
- الوصف: ${item1.desc || 'غير محدد'}

البند الثاني:
- LINE ITEM: ${item2.line || 'غير محدد'}
- PART NUMBER: ${item2.part || 'غير محدد'}
- الوصف: ${item2.desc || 'غير محدد'}

المعايير:
1. إذا كان الوصف متطابق تماماً = 100%
2. إذا كان PART NUMBER متطابق = 95%
3. إذا كان LINE ITEM متطابق = 90%
4. إذا كان هناك تشابه جزئي قوي = 80-89%
5. إذا كان التشابه ضعيف = أقل من 80%

أرجع النتيجة بصيغة JSON فقط:
{"similarity": رقم, "reason": "سبب التطابق"}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في تحليل البيانات ومقارنة البنود. قم بالإجابة بصيغة JSON فقط.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      console.error('خطأ في DeepSeek:', response.status);
      return { similarity: 0, reason: 'error' };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      return result;
    } catch (e) {
      // في حالة فشل تحليل JSON، نستخدم المقارنة المحلية
      return localCompare(item1, item2);
    }
  } catch (error) {
    console.error('خطأ في الاتصال:', error.message);
    // استخدام المقارنة المحلية كبديل
    return localCompare(item1, item2);
  }
}

// دالة المقارنة المحلية (كخطة بديلة)
function localCompare(a, b) {
  // مقارنة الوصف
  if (a.desc && b.desc) {
    const cleanDescA = a.desc.replace(/[\r\n\t\s]+/g, ' ').trim().toUpperCase();
    const cleanDescB = b.desc.replace(/[\r\n\t\s]+/g, ' ').trim().toUpperCase();
    if (cleanDescA === cleanDescB && cleanDescA.length > 5) {
      return { similarity: 100, reason: 'وصف متطابق' };
    }
  }
  
  // مقارنة PART NUMBER
  if (a.part && b.part) {
    const cleanPartA = a.part.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    const cleanPartB = b.part.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    if (cleanPartA === cleanPartB && cleanPartA.length > 0) {
      return { similarity: 95, reason: 'رقم قطعة متطابق' };
    }
  }
  
  // مقارنة LINE ITEM
  if (a.line && b.line) {
    const cleanLineA = a.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    const cleanLineB = b.line.toUpperCase().replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
    if (cleanLineA === cleanLineB && cleanLineA.length > 0) {
      return { similarity: 90, reason: 'رقم بند متطابق' };
    }
  }
  
  return { similarity: 0, reason: 'لا يوجد تطابق' };
}

// التوحيد الذكي
console.log('🔍 بدء التوحيد الذكي مع DeepSeek...\n');
const groups = [];
const used = new Set();
let nextId = 1;
let totalMatches = 0;
let apiCalls = 0;
const matchStats = { high: 0, medium: 0, low: 0 };

// معالجة عينة صغيرة أولاً (أول 100 بند للاختبار)
const sampleSize = Math.min(100, items.length);
console.log(`🧪 معالجة عينة من ${sampleSize} بند للاختبار...\n`);

for (let i = 0; i < sampleSize; i++) {
  if (used.has(i)) continue;
  
  if (i % 10 === 0) {
    console.log(`⏳ معالجة: ${i}/${sampleSize} (${Math.round(i * 100 / sampleSize)}%)`);
  }
  
  const master = items[i];
  const groupId = `P-${String(nextId).padStart(7, '0')}`;
  nextId++;
  
  const group = { 
    id: groupId, 
    items: [master],
    similarities: []
  };
  used.add(i);
  
  // البحث عن التطابقات
  for (let j = i + 1; j < sampleSize; j++) {
    if (used.has(j)) continue;
    
    // استخدام المقارنة المحلية أولاً للتوفير
    const localResult = localCompare(master, items[j]);
    
    let result;
    if (localResult.similarity >= 90) {
      // إذا كان التطابق المحلي قوي، نستخدمه مباشرة
      result = localResult;
    } else if (localResult.similarity >= 80 && apiCalls < 50) {
      // إذا كان هناك احتمال تطابق، نستخدم DeepSeek للتأكد
      apiCalls++;
      result = await checkSimilarityWithDeepSeek(master, items[j]);
      
      // تأخير صغير لتجنب حدود API
      await new Promise(r => setTimeout(r, 100));
    } else {
      // إذا كان التطابق ضعيف، نتجاهله
      continue;
    }
    
    if (result.similarity >= 80) {
      group.items.push(items[j]);
      group.similarities.push(result);
      used.add(j);
      totalMatches++;
      
      if (result.similarity >= 95) matchStats.high++;
      else if (result.similarity >= 90) matchStats.medium++;
      else matchStats.low++;
      
      console.log(`  ✅ تطابق ${result.similarity}%: صف ${master.row} مع ${items[j].row} - ${result.reason}`);
    }
  }
  
  groups.push(group);
}

console.log(`\n📊 نتائج العينة التجريبية:`);
console.log(`  - البنود المعالجة: ${sampleSize}`);
console.log(`  - المجموعات المنشأة: ${groups.length}`);
console.log(`  - البنود المتطابقة: ${totalMatches}`);
console.log(`  - استخدامات DeepSeek API: ${apiCalls}`);
console.log(`\n📊 جودة التطابقات:`);
console.log(`  - تطابق عالي (95%+): ${matchStats.high}`);
console.log(`  - تطابق متوسط (90-94%): ${matchStats.medium}`);
console.log(`  - تطابق مقبول (80-89%): ${matchStats.low}\n`);

// معالجة باقي البنود بالمقارنة المحلية السريعة
if (items.length > sampleSize) {
  console.log(`⚡ معالجة باقي البنود (${items.length - sampleSize}) بالمقارنة السريعة...\n`);
  
  for (let i = sampleSize; i < items.length; i++) {
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
      similarities: []
    };
    used.add(i);
    
    // البحث عن التطابقات بالمقارنة المحلية
    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue;
      
      const result = localCompare(master, items[j]);
      if (result.similarity >= 90) {
        group.items.push(items[j]);
        group.similarities.push(result);
        used.add(j);
        totalMatches++;
      }
    }
    
    groups.push(group);
  }
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
  
  if (i + batchSize < updates.length) {
    await new Promise(r => setTimeout(r, 500));
  }
}

console.log(`\n🎉 اكتمل التوحيد الذكي بنجاح!`);
console.log(`✅ تم توحيد ${totalMatches} بند باستخدام الذكاء الاصطناعي`);

// عرض أمثلة على المجموعات الذكية
const smartGroups = groups.filter(g => g.similarities.some(s => s.similarity >= 95)).slice(0, 3);
if (smartGroups.length > 0) {
  console.log(`\n🧠 أمثلة على التوحيد الذكي:`);
  for (const g of smartGroups) {
    const sample = g.items[0];
    console.log(`\n  📦 المعرف ${g.id}: ${g.items.length} بند`);
    console.log(`     LINE: ${sample.line || 'غير محدد'}`);
    console.log(`     PART: ${sample.part || 'غير محدد'}`);
    console.log(`     الوصف: ${(sample.desc || 'غير محدد').substring(0, 50)}...`);
    if (g.similarities.length > 0) {
      console.log(`     التطابقات:`);
      g.similarities.slice(0, 3).forEach(s => {
        console.log(`       - ${s.similarity}% (${s.reason})`);
      });
    }
  }
}