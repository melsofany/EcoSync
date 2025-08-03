/**
 * سكريپت التحليل اليدوي للبنود بدون AI
 */

import { storage } from './storage.js';
import { items } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { groupSimilarItems, applyItemGrouping } from './utils/smart-item-matcher.js';

async function main() {
  try {
    console.log('🔍 بدء التحليل اليدوي الذكي للبنود...');
    
    // جلب جميع البنود من قاعدة البيانات
    const allItems = await storage.db.select({
      id: items.id,
      partNumber: items.partNumber,
      description: items.description,
      lineItem: items.lineItem,
      category: items.category,
      normalizedPartNumber: items.normalizedPartNumber
    }).from(items);
    
    console.log(`📊 تم جلب ${allItems.length} بند للتحليل`);
    
    // تجميع البنود المتشابهة
    console.log('🔄 تجميع البنود المتشابهة...');
    const groups = groupSimilarItems(allItems);
    
    console.log(`📋 تم إنشاء ${groups.length} مجموعة من البنود المتشابهة`);
    
    // عرض أهم 10 مجموعات
    console.log('\n🎯 أهم 10 مجموعات متشابهة:');
    for (let i = 0; i < Math.min(10, groups.length); i++) {
      const group = groups[i];
      console.log(`\n${i + 1}. المعرف الموحد: ${group.unifiedId}`);
      console.log(`   الثقة: ${(group.confidence * 100).toFixed(1)}%`);
      console.log(`   السبب: ${group.groupReason}`);
      console.log('   البنود:');
      
      for (const item of group.items.slice(0, 3)) { // عرض أول 3 بنود فقط
        console.log(`     - ${item.partNumber} | ${item.description.substring(0, 50)}...`);
        console.log(`       التشابه: ${(item.similarity * 100).toFixed(1)}% | ${item.matchReason}`);
      }
      
      if (group.items.length > 3) {
        console.log(`     ... و ${group.items.length - 3} بند إضافي`);
      }
    }
    
    // تطبيق التوحيد
    console.log('\n⚡ تطبيق التوحيد على قاعدة البيانات...');
    const result = await applyItemGrouping(groups, storage.db, items, eq);
    
    console.log(`\n✅ تم الانتهاء من التحليل:`);
    console.log(`📦 إجمالي البنود: ${allItems.length}`);
    console.log(`🔗 المجموعات المكتشفة: ${result.groups}`);
    console.log(`⚡ البنود الموحدة: ${result.updated}`);
    
    // إحصائيات خاصة بـ LC1D32M7
    console.log('\n🔍 البحث عن مجموعة LC1D32M7:');
    const lc1dGroup = groups.find(g => g.unifiedId.includes('LC1D32M7'));
    
    if (lc1dGroup) {
      console.log(`✅ تم العثور على مجموعة LC1D32M7:`);
      console.log(`   الثقة: ${(lc1dGroup.confidence * 100).toFixed(1)}%`);
      console.log(`   عدد البنود: ${lc1dGroup.items.length}`);
      console.log('   تفاصيل البنود:');
      
      for (const item of lc1dGroup.items) {
        console.log(`     - PART NO: ${item.partNumber}`);
        console.log(`       LINE ITEM: ${item.lineItem}`);
        console.log(`       DESCRIPTION: ${item.description.substring(0, 80)}...`);
        console.log(`       التشابه: ${(item.similarity * 100).toFixed(1)}%`);
        console.log('');
      }
    } else {
      console.log('❌ لم يتم العثور على مجموعة LC1D32M7');
    }
    
    // عرض إحصائيات نهائية
    const finalStats = await storage.db.execute(`
      SELECT 
        normalized_part_number,
        COUNT(*) as count,
        string_agg(DISTINCT part_number, ', ') as part_numbers
      FROM items 
      WHERE normalized_part_number IS NOT NULL 
        AND normalized_part_number != 'UNKNOWN'
        AND ai_status = 'verified'
      GROUP BY normalized_part_number 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 5
    `);
    
    console.log('\n📈 أهم 5 مجموعات موحدة:');
    for (const stat of finalStats) {
      console.log(`   ${stat.normalized_part_number}: ${stat.count} بنود`);
      console.log(`   الأرقام: ${stat.part_numbers}`);
    }
    
    console.log('\n🎉 تم الانتهاء من التحليل بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في التحليل:', error);
    process.exit(1);
  }
}

// تشغيل السكريپت
main();