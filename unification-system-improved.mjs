#!/usr/bin/env node
// نظام التوحيد الذكي المحسن مع DeepSeek API

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
  
  // إزالة الكلمات الشائعة غير المهمة للمقارنة
  const commonWords = ['p/n', 'part', 'number', 'ref', 'reference', 'for', 'and', 'the', 'with'];
  let result = normalize(text);
  
  commonWords.forEach(word => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  return result.replace(/\s+/g, ' ').trim();
}

// ==================== دالة المقارنة باستخدام DeepSeek API ====================
async function deepSeekCompare(description1, description2) {
  try {
    // إذا كان الوصفان متطابقان نصياً، تخطي استدعاء API
    if (description1 === description2) {
      return {
        isSame: true,
        explanation: 'نفس الوصف بالضبط'
      };
    }
    
    const prompt = `
أنا أعمل على نظام توحيد المنتجات. قارن بين الوصفين التاليين للمنتجات الكهربائية وحدد إذا كانا يمثلان نفس المنتج أم لا.

الوصف 1: "${description1}"
الوصف 2: "${description2}"

أجب بنعم إذا كانا نفس المنتج، ولا إذا كانا منتجين مختلفين. ركز على:
1. نوع المنتج ووظيفته
2. المواصفات الفنية الأساسية (الجهد، التيار، القدرة)
3. العلامة التجارية والموديل
4. رقم الجزء الأساسي (متجاهلاً الاختلافات في التنسيق أو المسافات)

قدم إجابة مختصرة وواضحة.
    `;

    if (!DEEPSEEK_API_KEY) {
      console.log('⚠️ لا يوجد مفتاح DeepSeek، استخدام المقارنة المحلية');
      return localCompare(description1, description2);
    }

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
            content: 'أنت خبير في المنتجات الكهربائية والإلكترونية. مهمتك هي تحديد ما إذا كان وصفان يمثلان نفس المنتج أم لا، مع تجاهل الاختلافات الطفيفة في الصياغة.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`خطأ في API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content.toLowerCase();
    
    // تحليل الإجابة بدقة أكبر
    const positiveIndicators = ['نعم', 'نفس المنتج', 'متطابق', 'نفس النوع', 'نفس الموديل'];
    const negativeIndicators = ['لا', 'مختلف', 'منتج مختلف', 'ليس نفس', 'ليس متطابق'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveIndicators.forEach(indicator => {
      if (answer.includes(indicator)) positiveCount++;
    });
    
    negativeIndicators.forEach(indicator => {
      if (answer.includes(indicator)) negativeCount++;
    });
    
    const isSame = positiveCount > negativeCount;
    
    console.log(`🤖 DeepSeek: ${answer.substring(0, 80)}...`);
    console.log(`   النتيجة: ${isSame ? 'متطابق' : 'مختلف'} (إيجابي: ${positiveCount}, سلبي: ${negativeCount})`);
    
    return {
      isSame: isSame,
      explanation: answer
    };
  } catch (error) {
    console.error('❌ خطأ في استدعاء DeepSeek API:', error.message);
    return localCompare(description1, description2);
  }
}

// ==================== المقارنة المحلية (النسخة الاحتياطية) ====================
function localCompare(description1, description2) {
  if (!description1 || !description2) {
    return { isSame: false, explanation: 'أحد الوصفين فارغ' };
  }
  
  console.log(`🔍 مقارنة محلية: "${description1.substring(0, 40)}..." مع "${description2.substring(0, 40)}..."`);
  
  const normalized1 = normalize(description1);
  const normalized2 = normalize(description2);
  
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
  
  // ==================== استخراج أرقام الأجزاء ====================
  const partNumbers1 = extractPartNumbers(description1);
  const partNumbers2 = extractPartNumbers(description2);
  
  console.log(`   🔢 أرقام الأجزاء: [${partNumbers1.join(',')}] vs [${partNumbers2.join(',')}]`);
  
  // إذا كان هناك أرقام أجزاء مشتركة
  if (partNumbers1.length > 0 && partNumbers2.length > 0) {
    const commonNumbers = partNumbers1.filter(num => partNumbers2.includes(num));
    if (commonNumbers.length > 0) {
      console.log(`   ✅ أرقام أجزاء مشتركة: ${commonNumbers.join(', ')}`);
      return {
        isSame: true,
        explanation: `أرقام أجزاء مشتركة: ${commonNumbers.join(', ')}`
      };
    }
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
  
  // تحديد العتبة
  const threshold = 0.8;
  const isSame = similarity >= threshold;
  
  if (isSame) {
    console.log(`   ✅ منتجات متطابقة (${(similarity * 100).toFixed(1)}% ≥ ${(threshold * 100).toFixed(1)}%)`);
  } else {
    console.log(`   ❌ منتجات مختلفة (${(similarity * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%)`);
  }
  
  return {
    isSame: isSame,
    explanation: `التشابه النصي: ${(similarity * 100).toFixed(1)}%`
  };
}

function extractPartNumbers(description) {
  const patterns = [
    /(?:p\/n|part\s*number|ref|reference)[\s:]*([a-z0-9]+)/gi,
    /\b([a-z]{2,}\d+[a-z0-9]*)\b/gi,
    /\b(\d+[a-z][a-z0-9]*)\b/gi
  ];
  
  const numbers = new Set();
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      if (match[1]) {
        numbers.add(match[1].toUpperCase().trim());
      }
    }
  });
  
  return Array.from(numbers);
}

// ==================== نظام إدارة المعرفات ====================
class ProductGroupManager {
  constructor() {
    this.groups = new Map();
    this.groupCounter = 1;
    this.descriptionsMap = new Map();
  }
  
  async findMatchingGroup(description, partNumber, lineItem) {
    // البحث في المجموعات الحالية
    for (const [groupId, group] of this.groups.entries()) {
      for (const existingDesc of group.descriptions) {
        try {
          // استخدام DeepSeek إذا متوفر، وإلا المقارنة المحلية
          const comparison = DEEPSEEK_API_KEY 
            ? await deepSeekCompare(description, existingDesc)
            : localCompare(description, existingDesc);
            
          if (comparison.isSame) {
            return groupId;
          }
        } catch (error) {
          console.error('خطأ في المقارنة:', error.message);
        }
      }
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
    
    if (description) this.descriptionsMap.set(description, newGroupId);
    return newGroupId;
  }
  
  addToGroup(groupId, description, partNumber, lineItem, rowIndex) {
    const group = this.groups.get(groupId);
    if (description) group.descriptions.add(description);
    if (partNumber) group.partNumbers.add(partNumber);
    if (lineItem) group.lineItems.add(lineItem);
    group.rows.push(rowIndex);
    
    if (description) this.descriptionsMap.set(description, groupId);
  }
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
    
    const manager = new ProductGroupManager();
    const itemGroups = [];
    let apiCallCount = 0;
    
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
      
      console.log(`\n🔍 معالجة الصف ${i+1}: "${(description || partNumber || lineItem).substring(0, 60)}..."`);
      
      // البحث عن مجموعة مطابقة
      let groupId = null;
      if (description) {
        groupId = await manager.findMatchingGroup(description, partNumber, lineItem);
        if (DEEPSEEK_API_KEY) apiCallCount++;
      }
      
      if (!groupId) {
        // إنشاء مجموعة جديدة
        groupId = manager.createNewGroup(description, partNumber, lineItem);
        console.log(`   🆕 مجموعة جديدة: ${groupId}`);
      } else {
        console.log(`   🎯 تطابق مع المجموعة: ${groupId}`);
      }
      
      // إضافة البيانات للمجموعة
      manager.addToGroup(groupId, description, partNumber, lineItem, i);
      
      // حفظ معلومات المجموعة
      itemGroups.push({
        row: i,
        groupId,
        originalId: currentId
      });
      
      // عرض التقدم وحفظ الحالة كل 10 صفوف
      if ((i % 10) === 0) {
        console.log(`\n⏳ التقدم: ${i}/${rows.length-1} (${Math.round(i * 100 / (rows.length-1))}%)`);
        console.log(`📊 عدد المجموعات: ${manager.groups.size}`);
        if (DEEPSEEK_API_KEY) console.log(`🤖 استدعاءات API: ${apiCallCount}`);
        saveStatus(i, rows.length - 1, true);
        
        // تأخير لتجنب تجاوز معدل API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n✅ تم إنشاء ${manager.groups.size} معرف فريد`);
    if (DEEPSEEK_API_KEY) console.log(`📊 إجمالي استدعاءات DeepSeek API: ${apiCallCount}`);
    
    // ==================== عرض الإحصائيات ====================
    console.log('\n📊 الإحصائيات النهائية:');
    
    let totalUnified = 0;
    let duplicateGroups = 0;
    let uniqueProducts = 0;
    
    for (const [groupId, group] of manager.groups.entries()) {
      if (group.rows.length > 1) {
        duplicateGroups++;
        totalUnified += group.rows.length;
        const firstDesc = [...group.descriptions][0];
        console.log(`   🔗 ${groupId}: ${group.rows.length} بند متطابق - "${firstDesc?.substring(0, 50)}..."`);
      } else {
        uniqueProducts++;
      }
    }
    
    console.log(`\n📈 النتائج النهائية:`);
    console.log(`   • إجمالي البنود: ${rows.length - 1}`);
    console.log(`   • المنتجات الفريدة: ${uniqueProducts}`);
    console.log(`   • المنتجات المكررة: ${duplicateGroups}`);
    console.log(`   • البنود الموحدة: ${totalUnified}`);
    console.log(`   • إجمالي المعرفات: ${manager.groups.size}`);
    console.log(`   • معدل التوفير: ${Math.round((rows.length - 1 - manager.groups.size) * 100 / (rows.length - 1))}%\n`);
    
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
      
      // تأخير قصير بين الدفعات
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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
console.log('   مع دعم DeepSeek AI اختياري');
console.log('=====================================\n');

if (DEEPSEEK_API_KEY) {
  console.log('🤖 سيتم استخدام DeepSeek AI للمقارنة الذكية');
} else {
  console.log('🔧 سيتم استخدام المقارنة المحلية المحسنة');
}

unifyItems();