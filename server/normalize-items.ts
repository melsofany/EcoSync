/**
 * سكريپت تطبيق نظام توحيد البنود
 */

import { storage } from './storage.js';
import { items } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import { updateAllItemsWithNormalizedIds, findDuplicateItems, createUnifiedItemId } from './utils/item-normalizer.js';

async function main() {
  try {
    console.log('🚀 بدء تطبيق نظام توحيد البنود...');
    
    // تطبيق التوحيد على جميع البنود
    const result = await updateAllItemsWithNormalizedIds(storage.db, items, eq);
    
    console.log(`✅ تم تحديث ${result.updated} بند`);
    console.log(`🔍 تم العثور على ${result.duplicateGroups} مجموعة من البنود المكررة`);
    
    // عرض تفاصيل البنود المكررة
    const duplicates = await findDuplicateItems(storage.db);
    
    if (duplicates.length > 0) {
      console.log('\n📋 تفاصيل البنود المكررة:');
      for (const dup of duplicates.slice(0, 10)) { // عرض أول 10 مجموعات
        console.log(`\n• المعرف الموحد: ${dup.normalized_part_number}`);
        console.log(`  عدد البنود: ${dup.count}`);
        console.log(`  أرقام القطع: ${dup.part_numbers.join(', ')}`);
      }
    }
    
    // إحصائيات خاصة بـ LC1D32M7
    const lc1dStats = await storage.db.execute(sql`
      SELECT 
        normalized_part_number,
        COUNT(*) as count,
        array_agg(part_number) as part_numbers,
        array_agg(line_item) as line_items
      FROM items 
      WHERE part_number LIKE '%LC1D%32M7%' 
         OR normalized_part_number LIKE '%LC1D32M7%'
      GROUP BY normalized_part_number
    `);
    
    console.log('\n🔍 إحصائيات LC1D32M7:');
    for (const stat of lc1dStats) {
      console.log(`معرف موحد: ${stat.normalized_part_number} - عدد البنود: ${stat.count}`);
      console.log(`أرقام القطع: ${stat.part_numbers.join(', ')}`);
    }
    
    console.log('\n✅ تم الانتهاء من تطبيق نظام توحيد البنود');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل السكريپت
main();