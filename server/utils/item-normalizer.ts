/**
 * وظائف توحيد معرف البند
 * تحويل الأسماء المختلفة لنفس البند إلى معرف موحد
 */

import { sql } from 'drizzle-orm';

/**
 * توحيد رقم القطعة بإزالة المسافات والرموز الإضافية
 * @param partNumber رقم القطعة الأصلي
 * @returns رقم القطعة الموحد
 */
export function normalizePartNumber(partNumber: string | null | undefined): string {
  if (!partNumber) return '';
  
  return partNumber
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '') // إزالة جميع المسافات
    .replace(/[^A-Z0-9]/g, '') // الاحتفاظ بالأحرف والأرقام فقط
    .replace(/^0+/, ''); // إزالة الأصفار في البداية
}

/**
 * إنشاء معرف البند الموحد من رقم القطعة و LINE ITEM
 * @param partNumber رقم القطعة
 * @param lineItem رقم LINE ITEM
 * @returns معرف البند الموحد
 */
export function createUnifiedItemId(
  partNumber: string | null | undefined, 
  lineItem: string | null | undefined
): string {
  const normalizedPart = normalizePartNumber(partNumber);
  const normalizedLine = normalizePartNumber(lineItem);
  
  if (normalizedPart && normalizedLine) {
    return `${normalizedPart}_${normalizedLine}`;
  } else if (normalizedPart) {
    return normalizedPart;
  } else if (normalizedLine) {
    return normalizedLine;
  }
  
  return 'UNKNOWN';
}

/**
 * البحث عن البنود المتشابهة باستخدام المعرف الموحد
 * @param normalizedId المعرف الموحد للبحث عنه
 * @returns قائمة بالمعرفات المتشابهة
 */
export function findSimilarItems(normalizedId: string): string[] {
  const similar: string[] = [];
  
  // البحث عن التشابهات المختلفة
  similar.push(normalizedId);
  
  // إضافة نسخ بمسافات مختلفة
  const parts = normalizedId.split('_');
  if (parts.length === 2) {
    similar.push(`${parts[0]} ${parts[1]}`);
    similar.push(`${parts[0]}_${parts[1]}`);
  }
  
  return Array.from(new Set(similar)); // إزالة التكرارات
}

/**
 * تطبيق توحيد البنود على قاعدة البيانات
 * @param db اتصال قاعدة البيانات
 */
export async function updateAllItemsWithNormalizedIds(db: any, items: any, eq: any) {
  try {
    // جلب جميع البنود
    const allItems = await db.select().from(items);
    
    console.log(`بدء تحديث ${allItems.length} بند...`);
    
    let updateCount = 0;
    
    for (const item of allItems) {
      const normalizedId = createUnifiedItemId(item.partNumber, item.lineItem);
      
      // تحديث البند بالمعرف الموحد
      await db
        .update(items)
        .set({ 
          normalizedPartNumber: normalizedId,
        })
        .where(eq(items.id, item.id));
      
      updateCount++;
      
      if (updateCount % 100 === 0) {
        console.log(`تم تحديث ${updateCount} بند...`);
      }
    }
    
    console.log(`تم تحديث ${updateCount} بند بنجاح`);
    
    // عرض إحصائيات البنود المكررة
    const duplicates = await findDuplicateItems(db);
    console.log(`تم العثور على ${duplicates.length} مجموعة من البنود المكررة`);
    
    return { 
      updated: updateCount, 
      duplicateGroups: duplicates.length 
    };
    
  } catch (error) {
    console.error('خطأ في تحديث البنود:', error);
    throw error;
  }
}

/**
 * البحث عن البنود المكررة باستخدام المعرف الموحد
 */
export async function findDuplicateItems(db: any) {
  const query = sql`
    SELECT 
      normalized_part_number,
      COUNT(*) as count,
      array_agg(id) as item_ids,
      array_agg(part_number) as part_numbers,
      array_agg(line_item) as line_items
    FROM items 
    WHERE normalized_part_number IS NOT NULL 
      AND normalized_part_number != ''
      AND normalized_part_number != 'UNKNOWN'
    GROUP BY normalized_part_number 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;
  
  return await db.execute(query);
}