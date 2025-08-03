/**
 * نظام المطابقة الذكية للبنود باستخدام الذكاء الاصطناعي
 * يقوم بمراجعة التوصيف و PART NO ومطابقة البنود المتشابهة
 */

import OpenAI from "openai";
import { normalizePartNumber } from "./item-normalizer.js";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ItemMatchResult {
  isMatch: boolean;
  confidence: number;
  reason: string;
  normalizedId: string;
}

export interface ItemToAnalyze {
  id: string;
  partNumber: string;
  description: string;
  lineItem: string;
  category?: string;
}

/**
 * تحليل مجموعة من البنود لإيجاد المطابقات باستخدام AI
 */
export async function analyzeItemsWithAI(items: ItemToAnalyze[]): Promise<{[key: string]: ItemMatchResult}> {
  try {
    if (!items || items.length === 0) {
      return {};
    }

    const prompt = `
أنت خبير في قطع الغيار والمعدات الكهربائية. قم بتحليل القائمة التالية من البنود وتحديد أي منها يمثل نفس القطعة.

البنود للتحليل:
${items.map((item, index) => `
${index + 1}. PART NO: ${item.partNumber}
   DESCRIPTION: ${item.description}
   LINE ITEM: ${item.lineItem}
   CATEGORY: ${item.category || 'غير محدد'}
`).join('\n')}

المطلوب:
1. ابحث عن البنود التي تمثل نفس القطعة الفعلية (نفس المنتج، نفس الشركة المصنعة، نفس المواصفات)
2. لكل مجموعة متطابقة، اقترح معرف موحد
3. اعتبر الاختلافات التالية كنفس البند:
   - اختلاف المسافات (LC1D32M7 vs LC1D 32M7)
   - اختلاف الخط المائل (-) 
   - اختلاف أحرف كبيرة/صغيرة
   - اختلاف طفيف في التوصيف لكن نفس PART NO

أرجع النتيجة في صيغة JSON:
{
  "matches": [
    {
      "group_id": "معرف المجموعة",
      "normalized_id": "المعرف الموحد المقترح",
      "items": ["id1", "id2", "id3"],
      "confidence": 0.95,
      "reason": "سبب المطابقة"
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "أنت خبير في تحليل قطع الغيار الكهربائية ومطابقة البنود المتشابهة. يجب أن تكون دقيقاً في تحديد البنود المتطابقة."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent results
    });

    const result = JSON.parse(response.choices[0].message.content || '{"matches": []}');
    
    // تحويل النتيجة لصيغة مناسبة للاستخدام
    const itemMatches: {[key: string]: ItemMatchResult} = {};
    
    for (const match of result.matches || []) {
      for (const itemId of match.items || []) {
        itemMatches[itemId] = {
          isMatch: true,
          confidence: match.confidence || 0.8,
          reason: match.reason || 'تطابق AI',
          normalizedId: match.normalized_id || normalizePartNumber(match.group_id)
        };
      }
    }

    return itemMatches;

  } catch (error) {
    console.error('خطأ في تحليل البنود بالذكاء الاصطناعي:', error);
    return {};
  }
}

/**
 * مقارنة بندين محددين باستخدام AI
 */
export async function compareItemsWithAI(item1: ItemToAnalyze, item2: ItemToAnalyze): Promise<ItemMatchResult> {
  try {
    const prompt = `
قارن بين هذين البندين وحدد إذا كانا يمثلان نفس القطعة:

البند الأول:
PART NO: ${item1.partNumber}
DESCRIPTION: ${item1.description}
LINE ITEM: ${item1.lineItem}

البند الثاني:
PART NO: ${item2.partNumber}
DESCRIPTION: ${item2.description}
LINE ITEM: ${item2.lineItem}

أرجع النتيجة في JSON:
{
  "is_same_item": true/false,
  "confidence": 0.0-1.0,
  "reason": "سبب القرار",
  "normalized_id": "المعرف الموحد المقترح"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "أنت خبير في قطع الغيار الكهربائية. قم بمقارنة البنود بدقة."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      isMatch: result.is_same_item || false,
      confidence: result.confidence || 0,
      reason: result.reason || 'تحليل AI',
      normalizedId: result.normalized_id || normalizePartNumber(item1.partNumber)
    };

  } catch (error) {
    console.error('خطأ في مقارنة البنود:', error);
    return {
      isMatch: false,
      confidence: 0,
      reason: 'خطأ في التحليل',
      normalizedId: normalizePartNumber(item1.partNumber)
    };
  }
}

/**
 * تحليل شامل لجميع البنود في قاعدة البيانات
 */
export async function runComprehensiveItemAnalysis(db: any, items: any, eq: any) {
  try {
    console.log('🔍 بدء التحليل الشامل للبنود باستخدام الذكاء الاصطناعي...');

    // جلب جميع البنود من قاعدة البيانات
    const allItems = await db.select({
      id: items.id,
      partNumber: items.partNumber,
      description: items.description,
      lineItem: items.lineItem,
      category: items.category,
      normalizedPartNumber: items.normalizedPartNumber
    }).from(items);

    console.log(`📊 تم جلب ${allItems.length} بند للتحليل`);

    // تجميع البنود حسب PART NUMBER للتحليل
    const partGroups: {[key: string]: ItemToAnalyze[]} = {};
    
    for (const item of allItems) {
      const basePart = normalizePartNumber(item.partNumber);
      if (!partGroups[basePart]) {
        partGroups[basePart] = [];
      }
      partGroups[basePart].push(item);
    }

    // تحليل المجموعات التي تحتوي على أكثر من بند واحد
    const groupsToAnalyze = Object.entries(partGroups).filter(([_, items]) => items.length > 1);
    
    console.log(`🎯 وجدت ${groupsToAnalyze.length} مجموعة تحتاج تحليل`);

    let totalMatches = 0;
    let processedGroups = 0;

    for (const [groupKey, groupItems] of groupsToAnalyze) {
      console.log(`\n📋 تحليل مجموعة: ${groupKey} (${groupItems.length} بنود)`);
      
      try {
        // تحليل المجموعة بالذكاء الاصطناعي
        const analysisResult = await analyzeItemsWithAI(groupItems);
        
        // تطبيق النتائج على قاعدة البيانات
        for (const [itemId, matchResult] of Object.entries(analysisResult)) {
          if (matchResult.isMatch && matchResult.confidence > 0.7) {
            await db
              .update(items)
              .set({ 
                normalizedPartNumber: matchResult.normalizedId,
                aiStatus: 'processed'
              })
              .where(eq(items.id, itemId));
            
            totalMatches++;
          }
        }

        processedGroups++;
        console.log(`✅ تم تحليل المجموعة ${processedGroups}/${groupsToAnalyze.length}`);

        // تأخير بسيط لتجنب rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ خطأ في تحليل مجموعة ${groupKey}:`, error);
      }
    }

    console.log(`\n🎉 انتهى التحليل الشامل:`);
    console.log(`📈 تم معالجة ${processedGroups} مجموعة`);
    console.log(`🔗 تم توحيد ${totalMatches} بند`);

    return {
      processedGroups,
      totalMatches,
      totalItems: allItems.length
    };

  } catch (error) {
    console.error('❌ خطأ في التحليل الشامل:', error);
    throw error;
  }
}