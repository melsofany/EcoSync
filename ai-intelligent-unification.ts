#!/usr/bin/env tsx

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
interface ItemData {
  rowIndex: number;
  currentId: string;
  partNo: string;
  description: string;
  lineItem: string;
}

class AIIntelligentUnification {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  }

  async initialize() {
    console.log('🔧 تهيئة نظام التوحيد الذكي...');
    
    const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const credentials = JSON.parse(serviceAccountKey);

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.sheets = google.sheets({ version: 'v4', auth: auth });
    console.log('✅ تم تهيئة الاتصال مع Google Sheets');
  }

  async loadItemsData(): Promise<ItemData[]> {
    console.log('📖 قراءة البيانات من Google Sheets...');
    
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'DATA!A:E'
    });

    const rows = response.data.values || [];
    const items: ItemData[] = [];

    // معالجة البيانات بدءًا من الصف الثاني (تخطي العنوان)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      
      const currentId = row[0] || '';
      const lineItem = row[2] || '';
      const partNo = row[3] || '';
      const description = row[4] || '';

      // تخطي الصفوف الفارغة
      if (!lineItem && !partNo && !description) continue;

      items.push({
        rowIndex: i + 1, // +1 لأن Google Sheets يبدأ من 1
        currentId,
        partNo: partNo.toString().trim(),
        description: description.toString().trim(),
        lineItem: lineItem.toString().trim()
      });
    }

    console.log(`📊 تم تحميل ${items.length} صنف للمعالجة`);
    return items;
  }

  async compareItems(item1: ItemData, item2: ItemData): Promise<boolean> {
    try {
      // إذا كان PART NO متطابق تماماً ومليء
      if (item1.partNo && item2.partNo && 
          item1.partNo.toLowerCase() === item2.partNo.toLowerCase()) {
        return true;
      }

      // استخدام DeepSeek API لمقارنة التوصيف
      const prompt = `قم بمقارنة هذين الصنفين وحدد إذا كانا نفس المنتج:

الصنف الأول:
- رقم القطعة: "${item1.partNo}"
- التوصيف: "${item1.description}"

الصنف الثاني:
- رقم القطعة: "${item2.partNo}"
- التوصيف: "${item2.description}"

أجب بـ "نعم" إذا كانا نفس المنتج، أو "لا" إذا كانا مختلفين.
اعتبر الاختلافات البسيطة في الكتابة، المساحات، أو الأرقام التسلسلية كنفس المنتج.`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'test-key'}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "أنت خبير في مقارنة قطع الغيار والمنتجات. أجب بـ 'نعم' أو 'لا' فقط."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content?.trim().toLowerCase();
      return result === 'نعم' || result === 'yes';

    } catch (error: any) {
      console.error(`❌ خطأ في مقارنة AI: ${error.message}`);
      // fallback: مقارنة بسيطة بالنص
      const desc1 = item1.description.toLowerCase().trim();
      const desc2 = item2.description.toLowerCase().trim();
      
      // مقارنة أكثر ذكاءً
      if (desc1 === desc2) return true;
      
      // إزالة المساحات والرموز الخاصة للمقارنة
      const clean1 = desc1.replace(/[^\w\u0600-\u06FF]/g, '');
      const clean2 = desc2.replace(/[^\w\u0600-\u06FF]/g, '');
      
      if (clean1 === clean2) return true;
      
      // مقارنة بالكلمات الأساسية
      const words1 = desc1.split(/\s+/).filter(w => w.length > 2);
      const words2 = desc2.split(/\s+/).filter(w => w.length > 2);
      
      const commonWords = words1.filter(w => words2.includes(w));
      const similarity = commonWords.length / Math.max(words1.length, words2.length);
      
      return similarity > 0.7; // 70% تشابه
    }
  }

  async performIntelligentUnification() {
    console.log('🤖 بدء التوحيد الذكي باستخدام AI...');
    
    const items = await this.loadItemsData();
    const updates: any[] = [];
    const processedItems = new Set<number>();
    
    let unificationCount = 0;
    let currentIdCounter = 1;

    // معالجة كل صنف
    for (let i = 0; i < items.length; i++) {
      if (processedItems.has(i)) continue;

      const masterItem = items[i];
      const masterId = `P-${currentIdCounter.toString().padStart(7, '0')}`;
      
      console.log(`🔍 معالجة الصنف ${i + 1}/${items.length}: ${masterItem.description.substring(0, 50)}...`);

      // تعيين المعرف الرئيسي
      if (masterItem.currentId !== masterId) {
        updates.push({
          range: `DATA!A${masterItem.rowIndex}`,
          values: [[masterId]]
        });
        unificationCount++;
      }

      processedItems.add(i);

      // البحث عن المطابقات
      for (let j = i + 1; j < items.length; j++) {
        if (processedItems.has(j)) continue;

        const compareItem = items[j];
        
        // مقارنة باستخدام AI
        const isMatch = await this.compareItems(masterItem, compareItem);
        
        if (isMatch) {
          console.log(`✅ تطابق: "${compareItem.description.substring(0, 30)}..." → ${masterId}`);
          
          // تعيين نفس المعرف للصنف المطابق
          if (compareItem.currentId !== masterId) {
            updates.push({
              range: `DATA!A${compareItem.rowIndex}`,
              values: [[masterId]]
            });
            unificationCount++;
          }
          
          processedItems.add(j);
        }
      }

      currentIdCounter++;
      
      // انتظار قصير لتجنب حدود API
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📋 تم العثور على ${updates.length} تحديث مطلوب`);

    // تطبيق التحديثات في Google Sheets
    if (updates.length > 0) {
      console.log('💾 تطبيق التحديثات في Google Sheets...');
      
      const batchSize = 100;
      let appliedUpdates = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        try {
          await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
              valueInputOption: 'RAW',
              data: batch
            }
          });

          appliedUpdates += batch.length;
          console.log(`✅ تم تطبيق ${appliedUpdates}/${updates.length} تحديث`);

          // انتظار قصير لتجنب حدود API
          if (i + batchSize < updates.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (batchError: any) {
          console.error(`❌ خطأ في المجموعة: ${batchError.message}`);
        }
      }

      console.log(`🎉 تم الانتهاء من التوحيد الذكي!`);
      console.log(`📊 إحصائيات التوحيد:`);
      console.log(`  - أصناف تم معالجتها: ${items.length}`);
      console.log(`  - مجموعات فريدة: ${currentIdCounter - 1}`);
      console.log(`  - تحديثات مطبقة: ${unificationCount}`);
    } else {
      console.log('✅ جميع الأصناف موحدة بالفعل');
    }
  }
}

async function runIntelligentUnification() {
  const unifier = new AIIntelligentUnification();
  
  try {
    await unifier.initialize();
    await unifier.performIntelligentUnification();
  } catch (error: any) {
    console.error('❌ خطأ في التوحيد الذكي:', error.message);
  }
}

runIntelligentUnification();