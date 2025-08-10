/**
 * تشغيل توحيد مباشر للبنود
 */

import { db } from './db/index.js';
import { items } from './db/schema.js';
import { sql } from 'drizzle-orm';

export async function runDirectUnification() {
  console.log('🚀 بدء التوحيد المباشر للبنود...');
  
  try {
    // الحصول على إحصائيات البنود
    const allItems = await db.select().from(items);
    console.log(`📦 إجمالي البنود في النظام: ${allItems.length}`);
    
    // البحث عن البنود المتشابهة بناءً على part number
    const duplicatesByPartNumber = new Map();
    const duplicatesByDescription = new Map();
    
    allItems.forEach(item => {
      // تجميع حسب part number
      if (item.partNumber && item.partNumber.trim()) {
        const key = item.partNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!duplicatesByPartNumber.has(key)) {
          duplicatesByPartNumber.set(key, []);
        }
        duplicatesByPartNumber.get(key).push(item);
      }
      
      // تجميع حسب كلمات التوصيف
      if (item.description && item.description.length > 10) {
        const words = item.description.toUpperCase()
          .replace(/[^A-Z0-9\s]/g, '')
          .split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3) // أول 3 كلمات مهمة
          .join(' ');
        
        if (words.length > 5) {
          if (!duplicatesByDescription.has(words)) {
            duplicatesByDescription.set(words, []);
          }
          duplicatesByDescription.get(words).push(item);
        }
      }
    });
    
    // العثور على المجموعات المكررة
    let partNumberDuplicates = 0;
    let descriptionDuplicates = 0;
    
    for (const [key, itemGroup] of duplicatesByPartNumber) {
      if (itemGroup.length > 1) {
        partNumberDuplicates += itemGroup.length - 1;
        console.log(`🔍 مجموعة مكررة (رقم قطعة): ${key} - ${itemGroup.length} بند`);
        itemGroup.forEach(item => {
          console.log(`   • ${item.itemNumber}: ${item.description.substring(0, 50)}...`);
        });
      }
    }
    
    for (const [key, itemGroup] of duplicatesByDescription) {
      if (itemGroup.length > 1) {
        descriptionDuplicates += itemGroup.length - 1;
        console.log(`🔍 مجموعة مكررة (توصيف): ${key} - ${itemGroup.length} بند`);
        itemGroup.forEach(item => {
          console.log(`   • ${item.itemNumber}: ${item.partNumber || 'لا يوجد رقم قطعة'}`);
        });
      }
    }
    
    console.log('');
    console.log('📊 تقرير التحليل:');
    console.log('═'.repeat(50));
    console.log(`📦 إجمالي البنود: ${allItems.length}`);
    console.log(`🔄 مكررات رقم القطعة: ${partNumberDuplicates} بند`);
    console.log(`📝 مكررات التوصيف: ${descriptionDuplicates} بند`);
    console.log(`📈 مجموعات رقم القطعة: ${Array.from(duplicatesByPartNumber.values()).filter(g => g.length > 1).length}`);
    console.log(`📈 مجموعات التوصيف: ${Array.from(duplicatesByDescription.values()).filter(g => g.length > 1).length}`);
    
    // تحليل البنود الأكثر تكراراً
    const topDuplicatesByPart = Array.from(duplicatesByPartNumber.entries())
      .filter(([_, items]) => items.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
    
    if (topDuplicatesByPart.length > 0) {
      console.log('');
      console.log('🏆 أكثر البنود تكراراً (رقم القطعة):');
      topDuplicatesByPart.forEach(([partNum, items], index) => {
        console.log(`${index + 1}. ${partNum}: ${items.length} بند مكرر`);
      });
    }
    
    const result = {
      totalItems: allItems.length,
      partNumberDuplicates,
      descriptionDuplicates,
      duplicateGroupsByPart: Array.from(duplicatesByPartNumber.values()).filter(g => g.length > 1).length,
      duplicateGroupsByDescription: Array.from(duplicatesByDescription.values()).filter(g => g.length > 1).length,
      topDuplicates: topDuplicatesByPart.map(([key, items]) => ({
        key,
        count: items.length,
        items: items.map(item => ({
          id: item.id,
          itemNumber: item.itemNumber,
          description: item.description?.substring(0, 50) + '...'
        }))
      }))
    };
    
    console.log('✅ تم الانتهاء من تحليل التكرارات');
    return result;
    
  } catch (error) {
    console.error('❌ خطأ في التوحيد المباشر:', error);
    throw error;
  }
}

// تشغيل مباشر
if (import.meta.url === `file://${process.argv[1]}`) {
  runDirectUnification().catch(console.error);
}