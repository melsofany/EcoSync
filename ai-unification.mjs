#!/usr/bin/env node
// استخدام: node ai-unification.mjs

/**
 * نظام التوحيد بالذكاء الاصطناعي
 * يستخدم DeepSeek AI لمقارنة البنود بذكاء
 */

import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

// ==================== التكوين ====================
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-8a6b3c1c95264a199c3bd2563c7e6dc2';

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

// ==================== DeepSeek AI ====================
async function compareWithAI(item1, item2) {
  try {
    const prompt = `قارن بين البندين التاليين وحدد نسبة التشابه (0-100):

البند الأول:
- الوصف: ${item1.description || 'غير متوفر'}
- رقم القطعة: ${item1.partNumber || 'غير متوفر'}
- رقم البند: ${item1.lineItem || 'غير متوفر'}

البند الثاني:
- الوصف: ${item2.description || 'غير متوفر'}
- رقم القطعة: ${item2.partNumber || 'غير متوفر'}
- رقم البند: ${item2.lineItem || 'غير متوفر'}

أجب بنسبة التشابه فقط (رقم بين 0 و 100)`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      return 0; // في حالة الخطأ، اعتبر عدم التشابه
    }

    const data = await response.json();
    const similarityText = data.choices[0]?.message?.content || '0';
    const similarity = parseInt(similarityText.match(/\d+/)?.[0] || '0');
    
    return Math.min(100, Math.max(0, similarity));
  } catch (error) {
    return 0; // في حالة الخطأ، اعتبر عدم التشابه
  }
}

// ==================== البرنامج الرئيسي ====================
async function unifyWithAI() {
  console.log('🤖 بدء التوحيد بالذكاء الاصطناعي...\n');
  
  try {
    // قراءة البيانات
    console.log('📖 قراءة البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });
    
    const rows = response.data.values || [];
    console.log(`✅ تم قراءة ${rows.length} صف\n`);
    
    if (rows.length < 2) {
      console.log('❌ لا توجد بيانات كافية');
      return;
    }
    
    // ==================== تحليل بالذكاء الاصطناعي ====================
    console.log('🧠 تحليل البنود بالذكاء الاصطناعي...');
    console.log('⚠️ ملاحظة: هذه العملية قد تستغرق وقتاً طويلاً\n');
    
    const groups = [];
    const assigned = new Array(rows.length).fill(false);
    let groupCounter = 1;
    const similarityThreshold = 80; // عتبة التشابه 80%
    
    // معالجة البنود
    for (let i = 1; i < Math.min(rows.length, 100); i++) { // معالجة أول 100 بند فقط للاختبار
      if (assigned[i]) continue;
      
      const row1 = rows[i] || [];
      const item1 = {
        description: row1[4] || '',
        partNumber: row1[3] || '',
        lineItem: row1[2] || ''
      };
      
      // تخطي البنود الفارغة
      if (!item1.description && !item1.partNumber && !item1.lineItem) continue;
      
      // إنشاء مجموعة جديدة
      const groupId = `P-${groupCounter.toString().padStart(7, '0')}`;
      const group = {
        id: groupId,
        items: [i]
      };
      
      // البحث عن بنود مشابهة
      for (let j = i + 1; j < Math.min(rows.length, 100); j++) {
        if (assigned[j]) continue;
        
        const row2 = rows[j] || [];
        const item2 = {
          description: row2[4] || '',
          partNumber: row2[3] || '',
          lineItem: row2[2] || ''
        };
        
        // تخطي البنود الفارغة
        if (!item2.description && !item2.partNumber && !item2.lineItem) continue;
        
        // مقارنة سريعة أولاً
        let quickMatch = false;
        
        // مطابقة تامة في الوصف
        if (item1.description && item2.description && 
            item1.description.toLowerCase().trim() === item2.description.toLowerCase().trim()) {
          quickMatch = true;
        }
        
        // مطابقة تامة في رقم القطعة
        if (!quickMatch && item1.partNumber && item2.partNumber && 
            item1.partNumber.toLowerCase().trim() === item2.partNumber.toLowerCase().trim()) {
          quickMatch = true;
        }
        
        // إذا كانت هناك مطابقة سريعة، أضف للمجموعة
        if (quickMatch) {
          group.items.push(j);
          assigned[j] = true;
          console.log(`   🔗 ربط الصف ${j + 1} مع الصف ${i + 1} (مطابقة تامة)`);
        } else {
          // استخدم AI للمقارنة الذكية
          const similarity = await compareWithAI(item1, item2);
          
          if (similarity >= similarityThreshold) {
            group.items.push(j);
            assigned[j] = true;
            console.log(`   🧠 ربط الصف ${j + 1} مع الصف ${i + 1} (تشابه ${similarity}%)`);
          }
        }
      }
      
      assigned[i] = true;
      groups.push(group);
      groupCounter++;
      
      // عرض التقدم
      if ((i % 10) === 0) {
        console.log(`\n⏳ معالجة: ${i}/${Math.min(rows.length, 100)} بند`);
      }
    }
    
    // ==================== الإحصائيات ====================
    console.log('\n📊 النتائج:');
    
    let unifiedCount = 0;
    let duplicateGroups = 0;
    
    for (const group of groups) {
      if (group.items.length > 1) {
        duplicateGroups++;
        unifiedCount += group.items.length;
      }
    }
    
    console.log(`   • تم معالجة: ${Math.min(rows.length - 1, 99)} بند`);
    console.log(`   • المجموعات: ${groups.length}`);
    console.log(`   • المجموعات المكررة: ${duplicateGroups}`);
    console.log(`   • البنود الموحدة: ${unifiedCount}`);
    
    // ==================== تحديث Google Sheets ====================
    console.log('\n💾 تحديث Google Sheets...');
    
    const updates = [];
    for (const group of groups) {
      for (const rowIndex of group.items) {
        updates.push({
          range: `DATA!A${rowIndex + 1}`,
          values: [[group.id]]
        });
      }
    }
    
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          data: updates,
          valueInputOption: 'RAW'
        }
      });
      
      console.log(`✅ تم تحديث ${updates.length} صف`);
    }
    
    console.log('\n🎉 اكتمل التوحيد بالذكاء الاصطناعي!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

// تشغيل البرنامج
console.log('=====================================');
console.log('  التوحيد بالذكاء الاصطناعي (DeepSeek)');
console.log('=====================================\n');

unifyWithAI();