import OpenAI from 'openai';
import { db } from './storage.js';
import { items, quotationItems, purchaseOrderItems } from '../shared/schema.js';
import { eq, sql, inArray } from 'drizzle-orm';

// Initialize DeepSeek client
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

interface ItemForUnification {
  id: string;
  itemNumber: string;
  description: string;
  partNumber?: string | null;
  brand?: string | null;
}

interface UnificationGroup {
  masterItemId: string;
  duplicateItemIds: string[];
  confidence: number;
  reason: string;
  unifiedPartNumber?: string;
  unifiedDescription: string;
}

/**
 * تحليل البنود باستخدام DeepSeek AI لتحديد التطابقات
 */
async function analyzeItemsForUnification(items: ItemForUnification[]): Promise<UnificationGroup[]> {
  const prompt = `
تحليل قائمة البنود التالية وتحديد البنود المتطابقة التي يجب توحيدها:

البنود:
${items.map((item, index) => 
  `${index + 1}. ID: ${item.id}
     رقم البند: ${item.itemNumber}
     التوصيف: ${item.description}
     رقم القطعة: ${item.partNumber || 'غير محدد'}
     العلامة التجارية: ${item.brand || 'غير محدد'}
  `
).join('\n\n')}

معايير التطابق:
1. رقم القطعة (Part Number) متطابق أو متشابه جداً
2. التوصيف متطابق أو متشابه في المعنى
3. العلامة التجارية متطابقة
4. المواصفات الفنية متطابقة

المطلوب:
- تجميع البنود المتطابقة في مجموعات
- اختيار بند رئيسي (Master Item) لكل مجموعة
- تحديد درجة الثقة (0-100%)
- شرح سبب التطابق

أعطني النتيجة بصيغة JSON فقط:
{
  "unificationGroups": [
    {
      "masterItemId": "معرف البند الرئيسي",
      "duplicateItemIds": ["معرف البند المكرر 1", "معرف البند المكرر 2"],
      "confidence": درجة الثقة بالنسبة المئوية,
      "reason": "سبب التطابق",
      "unifiedPartNumber": "رقم القطعة الموحد",
      "unifiedDescription": "التوصيف الموحد"
    }
  ]
}
`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('لم يتم الحصول على استجابة من DeepSeek');
    }

    // استخراج JSON من الاستجابة
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('تنسيق JSON غير صحيح من DeepSeek');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.unificationGroups || [];
  } catch (error) {
    console.error('خطأ في تحليل البنود:', error);
    throw error;
  }
}

/**
 * توحيد البنود في قاعدة البيانات
 */
async function unifyDuplicateItems(unificationGroup: UnificationGroup): Promise<void> {
  const { masterItemId, duplicateItemIds, unifiedDescription, unifiedPartNumber } = unificationGroup;

  await db.transaction(async (tx) => {
    // تحديث البند الرئيسي بالبيانات الموحدة
    await tx
      .update(items)
      .set({
        description: unifiedDescription,
        partNumber: unifiedPartNumber || undefined
      })
      .where(eq(items.id, masterItemId));

    // نقل جميع العلاقات من البنود المكررة إلى البند الرئيسي
    for (const duplicateId of duplicateItemIds) {
      // نقل عناصر طلبات التسعير
      await tx
        .update(quotationItems)
        .set({ itemId: masterItemId })
        .where(eq(quotationItems.itemId, duplicateId));

      // نقل عناصر أوامر الشراء
      await tx
        .update(purchaseOrderItems)
        .set({ itemId: masterItemId })
        .where(eq(purchaseOrderItems.itemId, duplicateId));

      // حذف البند المكرر
      await tx
        .delete(items)
        .where(eq(items.id, duplicateId));
    }
  });

  console.log(`✅ تم توحيد ${duplicateItemIds.length} بنود مع البند الرئيسي ${masterItemId}`);
}

/**
 * الدالة الرئيسية لتوحيد البنود
 */
export async function unifyItemsWithAI(limit = 50): Promise<{
  totalItemsAnalyzed: number;
  unificationGroups: UnificationGroup[];
  itemsUnified: number;
  confidence: number;
}> {
  try {
    console.log('🔍 بدء تحليل البنود للتوحيد...');

    // جلب البنود للتحليل - مع التحقق من القيم الفارغة
    const itemsToAnalyze = await db
      .select({
        id: items.id,
        itemNumber: items.itemNumber,
        description: items.description,
        partNumber: items.partNumber,
        brand: items.brand
      })
      .from(items)
      .where(sql`${items.id} NOT LIKE 'user-%'`)
      .limit(limit)
      .orderBy(items.createdAt);

    if (itemsToAnalyze.length < 2) {
      return {
        totalItemsAnalyzed: itemsToAnalyze.length,
        unificationGroups: [],
        itemsUnified: 0,
        confidence: 0
      };
    }

    console.log(`📊 تحليل ${itemsToAnalyze.length} بند...`);

    // تحليل البنود باستخدام DeepSeek
    const unificationGroups = await analyzeItemsForUnification(itemsToAnalyze);

    // تطبيق التوحيد للمجموعات عالية الثقة (أكثر من 80%)
    const highConfidenceGroups = unificationGroups.filter(group => group.confidence >= 80);
    let totalItemsUnified = 0;

    for (const group of highConfidenceGroups) {
      try {
        await unifyDuplicateItems(group);
        totalItemsUnified += group.duplicateItemIds.length;
        console.log(`✅ ${group.reason} - ثقة: ${group.confidence}%`);
      } catch (error) {
        console.error(`❌ خطأ في توحيد المجموعة:`, error);
      }
    }

    const averageConfidence = unificationGroups.length > 0 
      ? unificationGroups.reduce((sum, group) => sum + group.confidence, 0) / unificationGroups.length
      : 0;

    console.log(`🎯 تم توحيد ${totalItemsUnified} بند بنجاح`);

    return {
      totalItemsAnalyzed: itemsToAnalyze.length,
      unificationGroups,
      itemsUnified: totalItemsUnified,
      confidence: Math.round(averageConfidence)
    };

  } catch (error) {
    console.error('❌ خطأ في عملية توحيد البنود:', error);
    throw error;
  }
}

/**
 * تحليل البنود حسب معايير محددة
 */
export async function analyzeItemsDuplication(criteria: {
  partNumberSimilarity?: boolean;
  descriptionSimilarity?: boolean;
  brandMatching?: boolean;
}): Promise<{
  totalDuplicatesFound: number;
  duplicateGroups: any[];
  recommendations: string[];
}> {
  const duplicateGroups: any[] = [];
  const recommendations: string[] = [];

  // البحث عن التكرارات بناءً على رقم القطعة
  if (criteria.partNumberSimilarity) {
    const partNumberDuplicates = await db
      .select({
        partNumber: items.partNumber,
        items: sql<any[]>`json_agg(json_build_object('id', ${items.id}, 'itemNumber', ${items.itemNumber}, 'description', ${items.description}))`
      })
      .from(items)
      .where(sql`${items.partNumber} IS NOT NULL AND ${items.partNumber} != ''`)
      .groupBy(items.partNumber)
      .having(sql`COUNT(*) > 1`);

    duplicateGroups.push(...partNumberDuplicates.map(group => ({
      type: 'Part Number',
      key: group.partNumber,
      items: group.items,
      count: group.items.length
    })));
  }

  const totalDuplicatesFound = duplicateGroups.reduce((sum, group) => sum + group.count - 1, 0);

  if (totalDuplicatesFound > 0) {
    recommendations.push(`تم العثور على ${totalDuplicatesFound} بند مكرر`);
    recommendations.push('ينصح بتشغيل عملية التوحيد التلقائي');
    recommendations.push('مراجعة البنود المكررة قبل التوحيد');
  }

  return {
    totalDuplicatesFound,
    duplicateGroups,
    recommendations
  };
}