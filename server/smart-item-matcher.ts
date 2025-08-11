import OpenAI from 'openai';
import { db } from './storage.js';
import { items } from '../shared/schema.js';
import { like, or, sql } from 'drizzle-orm';

// Initialize DeepSeek client
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

interface ItemToMatch {
  description: string;
  partNumber?: string;
  brand?: string;
  specifications?: string;
}

interface MatchedItem {
  id: string;
  itemNumber: string;
  description: string;
  partNumber?: string;
  brand?: string;
  matchScore: number;
  matchReason: string;
}

/**
 * البحث السريع عن البنود المشابهة في قاعدة البيانات
 */
async function findPotentialMatches(itemData: ItemToMatch): Promise<any[]> {
  const conditions = [];
  
  // البحث بناءً على رقم القطعة
  if (itemData.partNumber) {
    conditions.push(like(items.partNumber, `%${itemData.partNumber}%`));
  }
  
  // البحث بناءً على الكلمات المفتاحية في التوصيف
  const keywords = itemData.description.split(' ')
    .filter(word => word.length > 3)
    .slice(0, 5); // أول 5 كلمات مهمة
  
  for (const keyword of keywords) {
    conditions.push(like(items.description, `%${keyword}%`));
  }
  
  // البحث بناءً على العلامة التجارية
  if (itemData.brand) {
    conditions.push(like(items.brand, `%${itemData.brand}%`));
  }
  
  if (conditions.length === 0) {
    return [];
  }
  
  const potentialMatches = await db
    .select()
    .from(items)
    .where(or(...conditions))
    .limit(20);
    
  return potentialMatches;
}

/**
 * تحليل البنود باستخدام الذكاء الاصطناعي لتحديد التطابق
 */
async function analyzeItemMatch(newItem: ItemToMatch, existingItems: any[]): Promise<MatchedItem | null> {
  if (existingItems.length === 0) {
    return null;
  }

  const prompt = `
قم بتحليل البند الجديد ومقارنته مع البنود الموجودة لتحديد إذا كان هناك تطابق:

البند الجديد:
- التوصيف: ${newItem.description}
- رقم القطعة: ${newItem.partNumber || 'غير محدد'}
- العلامة التجارية: ${newItem.brand || 'غير محدد'}
- المواصفات: ${newItem.specifications || 'غير محدد'}

البنود الموجودة:
${existingItems.map((item, index) => 
  `${index + 1}. ID: ${item.id}
     رقم البند: ${item.itemNumber}
     التوصيف: ${item.description}
     رقم القطعة: ${item.partNumber || 'غير محدد'}
     العلامة التجارية: ${item.brand || 'غير محدد'}`
).join('\n\n')}

معايير التطابق:
1. رقم القطعة متطابق أو متشابه جداً (وزن 40%)
2. التوصيف متطابق في المعنى والمواصفات الأساسية (وزن 35%)
3. العلامة التجارية متطابقة (وزن 15%)
4. المواصفات الفنية متطابقة (وزن 10%)

المطلوب:
- إذا كان هناك تطابق بنسبة 80% أو أكثر، اختر البند الأفضل
- إذا لم يكن هناك تطابق كافي، أرجع null

أعطني النتيجة بصيغة JSON فقط:
{
  "match": {
    "id": "معرف البند المطابق",
    "itemNumber": "رقم البند",
    "description": "التوصيف",
    "partNumber": "رقم القطعة",
    "brand": "العلامة التجارية",
    "matchScore": نسبة التطابق بالنسبة المئوية,
    "matchReason": "سبب التطابق والاختلافات إن وجدت"
  }
}

أو إذا لم يكن هناك تطابق كافي:
{
  "match": null
}
`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return null;
    }

    // استخراج JSON من الاستجابة
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.match;
  } catch (error) {
    console.error('خطأ في تحليل تطابق البنود:', error);
    return null;
  }
}

/**
 * الدالة الرئيسية للبحث عن تطابق ذكي للبند
 */
export async function findSmartItemMatch(itemData: ItemToMatch): Promise<MatchedItem | null> {
  try {
    console.log(`🔍 البحث الذكي عن تطابق للبند: ${itemData.description.substring(0, 50)}...`);
    
    // البحث السريع عن البنود المحتملة
    const potentialMatches = await findPotentialMatches(itemData);
    
    if (potentialMatches.length === 0) {
      console.log('❌ لم يتم العثور على بنود محتملة للتطابق');
      return null;
    }
    
    console.log(`📊 تم العثور على ${potentialMatches.length} بند محتمل للتطابق`);
    
    // تحليل التطابق بالذكاء الاصطناعي
    const match = await analyzeItemMatch(itemData, potentialMatches);
    
    if (match && match.matchScore >= 80) {
      console.log(`✅ تم العثور على تطابق: ${match.itemNumber} (${match.matchScore}%)`);
      console.log(`📝 السبب: ${match.matchReason}`);
      return match;
    } else if (match) {
      console.log(`⚠️ تطابق ضعيف: ${match.matchScore}% - سيتم إنشاء بند جديد`);
    } else {
      console.log('❌ لم يتم العثور على تطابق كافي - سيتم إنشاء بند جديد');
    }
    
    return null;
  } catch (error) {
    console.error('❌ خطأ في البحث الذكي:', error);
    return null;
  }
}

/**
 * معالجة قائمة من البنود للبحث عن التطابقات
 */
export async function processBatchItemMatching(itemsData: ItemToMatch[]): Promise<{
  matches: { index: number; match: MatchedItem }[];
  newItems: { index: number; item: ItemToMatch }[];
  totalProcessed: number;
}> {
  const matches: { index: number; match: MatchedItem }[] = [];
  const newItems: { index: number; item: ItemToMatch }[] = [];
  
  console.log(`🚀 معالجة دفعة من ${itemsData.length} بند للتطابق الذكي`);
  
  for (let i = 0; i < itemsData.length; i++) {
    const item = itemsData[i];
    const match = await findSmartItemMatch(item);
    
    if (match) {
      matches.push({ index: i, match });
    } else {
      newItems.push({ index: i, item });
    }
    
    // تأخير قصير لتجنب تحميل API
    if (i < itemsData.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`📊 النتائج: ${matches.length} تطابق، ${newItems.length} بند جديد`);
  
  return {
    matches,
    newItems,
    totalProcessed: itemsData.length
  };
}

/**
 * تشغيل توحيد تلقائي للبنود المكررة الموجودة
 */
export async function runAutomaticUnification(): Promise<{
  itemsUnified: number;
  errors: string[];
}> {
  try {
    console.log('🔄 بدء التوحيد التلقائي للبنود المكررة...');
    
    const { unifyItemsWithAI } = await import('./item-unification.js');
    const result = await unifyItemsWithAI(100);
    
    console.log(`✅ تم توحيد ${result.itemsUnified} بند بنجاح`);
    
    return {
      itemsUnified: result.itemsUnified,
      errors: []
    };
  } catch (error) {
    console.error('❌ خطأ في التوحيد التلقائي:', error);
    return {
      itemsUnified: 0,
      errors: [error.message]
    };
  }
}