import { runAutomaticUnification } from './smart-item-matcher.js';

/**
 * تشغيل توحيد تلقائي للبنود المكررة عند بدء التطبيق
 */
export async function initializeAutoUnification() {
  console.log('🚀 بدء التوحيد التلقائي للبنود...');
  
  try {
    const result = await runAutomaticUnification();
    console.log(`✅ تم توحيد ${result.itemsUnified} بند بنجاح`);
    
    if (result.errors.length > 0) {
      console.warn('⚠️ أخطاء في التوحيد:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('❌ خطأ في التوحيد التلقائي:', error);
    return { itemsUnified: 0, errors: [error.message] };
  }
}

// تشغيل التوحيد عند تحميل الوحدة (إذا لم يتم تشغيله من قبل)
if (process.env.NODE_ENV === 'development') {
  // تشغيل بعد تأخير قصير لضمان تحميل قاعدة البيانات
  setTimeout(() => {
    initializeAutoUnification().catch(console.error);
  }, 5000);
}