/**
 * نظام المطابقة الذكية للبنود بدون AI
 * يقوم بمراجعة التوصيف و PART NO ومطابقة البنود المتشابهة
 */

import { normalizePartNumber } from "./item-normalizer.js";

export interface ItemMatch {
  itemId: string;
  partNumber: string;
  description: string;
  lineItem: string;
  similarity: number;
  matchReason: string;
}

export interface ItemGroup {
  unifiedId: string;
  items: ItemMatch[];
  confidence: number;
  groupReason: string;
}

/**
 * تطبيع النص العربي والإنجليزي للمقارنة
 */
function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .trim()
    .toUpperCase()
    // إزالة المسافات الزائدة
    .replace(/\s+/g, ' ')
    // إزالة الرموز الخاصة
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    // تطبيع الأحرف العربية
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و');
}

/**
 * حساب التشابه بين نصين باستخدام Levenshtein distance
 */
function calculateSimilarity(text1: string, text2: string): number {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  
  const len1 = norm1.length;
  const len2 = norm2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1.0 : (maxLen - distance) / maxLen;
}

/**
 * استخراج الكلمات المفتاحية من التوصيف
 */
function extractKeywords(description: string): string[] {
  const normalized = normalizeText(description);
  
  // كلمات مفتاحية مهمة في وصف قطع الغيار
  const keywords = normalized
    .split(' ')
    .filter(word => word.length > 2)
    .filter(word => {
      // إزالة الكلمات الشائعة غير المفيدة
      const stopWords = ['FOR', 'WITH', 'AND', 'THE', 'REF', 'PN', 'لل', 'مع', 'في', 'من'];
      return !stopWords.includes(word);
    });
  
  return keywords;
}

/**
 * مقارنة رقمين للقطع وتحديد مدى التشابه
 */
function comparePartNumbers(part1: string, part2: string): {similarity: number, reason: string} {
  const norm1 = normalizePartNumber(part1);
  const norm2 = normalizePartNumber(part2);
  
  // مطابقة تامة بعد التطبيع
  if (norm1 === norm2) {
    return { similarity: 1.0, reason: 'مطابقة تامة في رقم القطعة' };
  }
  
  // مطابقة جزئية
  const similarity = calculateSimilarity(norm1, norm2);
  
  if (similarity > 0.9) {
    return { similarity, reason: 'تشابه عالي في رقم القطعة' };
  } else if (similarity > 0.7) {
    return { similarity, reason: 'تشابه متوسط في رقم القطعة' };
  } else if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return { similarity: 0.8, reason: 'أحد الأرقام يحتوي على الآخر' };
  }
  
  return { similarity, reason: 'اختلاف في رقم القطعة' };
}

/**
 * مقارنة وصفين وتحديد مدى التشابه
 */
function compareDescriptions(desc1: string, desc2: string): {similarity: number, reason: string} {
  const keywords1 = extractKeywords(desc1);
  const keywords2 = extractKeywords(desc2);
  
  // حساب الكلمات المشتركة
  const commonKeywords = keywords1.filter(word => keywords2.includes(word));
  const totalKeywords = new Set([...keywords1, ...keywords2]).size;
  
  if (totalKeywords === 0) {
    return { similarity: 0, reason: 'لا يوجد كلمات مفتاحية' };
  }
  
  const keywordSimilarity = (commonKeywords.length * 2) / (keywords1.length + keywords2.length);
  const textSimilarity = calculateSimilarity(desc1, desc2);
  
  // الجمع بين تشابه الكلمات والنص
  const finalSimilarity = (keywordSimilarity * 0.7) + (textSimilarity * 0.3);
  
  let reason = '';
  if (finalSimilarity > 0.8) {
    reason = `تطابق عالي في الوصف (${commonKeywords.length} كلمة مشتركة)`;
  } else if (finalSimilarity > 0.6) {
    reason = `تشابه متوسط في الوصف (${commonKeywords.length} كلمة مشتركة)`;
  } else {
    reason = `اختلاف في الوصف (${commonKeywords.length} كلمة مشتركة فقط)`;
  }
  
  return { similarity: finalSimilarity, reason };
}

/**
 * مقارنة شاملة بين بندين
 */
export function compareItems(item1: any, item2: any): ItemMatch {
  // مقارنة رقم القطعة
  const partComparison = comparePartNumbers(item1.partNumber, item2.partNumber);
  
  // مقارنة الوصف
  const descComparison = compareDescriptions(item1.description, item2.description);
  
  // مقارنة LINE ITEM
  const lineItemSimilarity = calculateSimilarity(item1.lineItem || '', item2.lineItem || '');
  
  // حساب التشابه النهائي (وزن أكبر لرقم القطعة)
  const finalSimilarity = 
    (partComparison.similarity * 0.5) + 
    (descComparison.similarity * 0.3) + 
    (lineItemSimilarity * 0.2);
  
  // تحديد سبب المطابقة
  let matchReason = '';
  if (finalSimilarity > 0.8) {
    matchReason = `مطابقة عالية: ${partComparison.reason}, ${descComparison.reason}`;
  } else if (finalSimilarity > 0.6) {
    matchReason = `تشابه متوسط: ${partComparison.reason}, ${descComparison.reason}`;
  } else {
    matchReason = `تشابه ضعيف: ${partComparison.reason}, ${descComparison.reason}`;
  }
  
  return {
    itemId: item2.id,
    partNumber: item2.partNumber,
    description: item2.description,
    lineItem: item2.lineItem,
    similarity: finalSimilarity,
    matchReason
  };
}

/**
 * العثور على البنود المشابهة لبند معين
 */
export function findSimilarItems(targetItem: any, allItems: any[], threshold: number = 0.6): ItemMatch[] {
  const similarItems: ItemMatch[] = [];
  
  for (const item of allItems) {
    if (item.id === targetItem.id) continue; // تجاهل نفس البند
    
    const comparison = compareItems(targetItem, item);
    
    if (comparison.similarity >= threshold) {
      similarItems.push(comparison);
    }
  }
  
  // ترتيب حسب التشابه
  return similarItems.sort((a, b) => b.similarity - a.similarity);
}

/**
 * تجميع البنود المتشابهة في مجموعات
 */
export function groupSimilarItems(allItems: any[]): ItemGroup[] {
  const groups: ItemGroup[] = [];
  const processedItems = new Set<string>();
  
  for (const targetItem of allItems) {
    if (processedItems.has(targetItem.id)) continue;
    
    // العثور على البنود المشابهة
    const similarItems = findSimilarItems(targetItem, allItems, 0.7);
    
    if (similarItems.length > 0) {
      // إنشاء مجموعة جديدة
      const group: ItemGroup = {
        unifiedId: normalizePartNumber(targetItem.partNumber) || targetItem.id,
        items: [
          {
            itemId: targetItem.id,
            partNumber: targetItem.partNumber,
            description: targetItem.description,
            lineItem: targetItem.lineItem,
            similarity: 1.0,
            matchReason: 'البند الأساسي'
          },
          ...similarItems
        ],
        confidence: similarItems.reduce((sum, item) => sum + item.similarity, 1.0) / (similarItems.length + 1),
        groupReason: `${similarItems.length + 1} بنود متشابهة`
      };
      
      groups.push(group);
      
      // تسجيل البنود المعالجة
      processedItems.add(targetItem.id);
      similarItems.forEach(item => processedItems.add(item.itemId));
    }
  }
  
  return groups.sort((a, b) => b.confidence - a.confidence);
}

/**
 * تطبيق التوحيد على قاعدة البيانات
 */
export async function applyItemGrouping(groups: ItemGroup[], db: any, items: any, eq: any): Promise<{updated: number, groups: number}> {
  let updatedCount = 0;
  
  for (const group of groups) {
    if (group.confidence > 0.7) { // تطبيق التوحيد فقط للمجموعات عالية الثقة
      
      for (const item of group.items) {
        try {
          await db
            .update(items)
            .set({ 
              normalizedPartNumber: group.unifiedId,
              aiStatus: 'verified' // تم التحقق منه يدوياً
            })
            .where(eq(items.id, item.itemId));
          
          updatedCount++;
        } catch (error) {
          console.error(`خطأ في تحديث البند ${item.itemId}:`, error);
        }
      }
    }
  }
  
  return { updated: updatedCount, groups: groups.length };
}