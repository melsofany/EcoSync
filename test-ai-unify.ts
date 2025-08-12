import { aiItemUnifier } from './server/ai-item-unifier.js';

async function testAIUnification() {
  console.log('🧪 اختبار نظام توحيد المعرفات بالذكاء الاصطناعي...');
  
  try {
    const result = await aiItemUnifier.unifyItemsInSheets();
    
    console.log('\n📊 نتائج التوحيد:');
    console.log(`✅ النجاح: ${result.success}`);
    console.log(`📋 إجمالي الأصناف: ${result.totalItems}`);
    console.log(`🔗 مجموعات التوحيد: ${result.unifiedGroups}`);
    console.log(`🗑️ الأصناف المحذوفة: ${result.duplicatesRemoved}`);
    
    if (result.unifiedItems && result.unifiedItems.length > 0) {
      console.log('\n🎯 تفاصيل التوحيد:');
      result.unifiedItems.forEach((item, index) => {
        console.log(`${index + 1}. الصف الرئيسي: ${item.masterRow}, المعرف: ${item.masterId}`);
        console.log(`   الصفوف المحذوفة: [${item.duplicateRows.join(', ')}]`);
        console.log(`   السبب: ${item.reason}`);
      });
    }
    
    if (result.error) {
      console.error('❌ خطأ:', result.error);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testAIUnification();