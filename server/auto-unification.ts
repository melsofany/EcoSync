import { runAutomaticUnification } from './smart-item-matcher.js';

/**
 * تشغيل توحيد تلقائي للبنود المكررة عند بدء التطبيق
 */
export async function initializeAutoUnification() {
  console.log('⏸️ تم تعطيل التوحيد التلقائي مؤقتاً بسبب مشاكل الاتصال بقاعدة البيانات');
  
  try {
    // Temporarily disabled due to database connection issues
    // const result = await runAutomaticUnification();
    // console.log(`✅ تم توحيد ${result.itemsUnified} بند بنجاح`);
    
    return { itemsUnified: 0, errors: [] };
  } catch (error) {
    console.error('❌ خطأ في التوحيد التلقائي:', error);
    return { itemsUnified: 0, errors: [error.message] };
  }
}

// Temporarily disabled auto-unification during startup
// تشغيل التوحيد عند تحميل الوحدة (إذا لم يتم تشغيله من قبل)
// if (process.env.NODE_ENV === 'development') {
//   // تشغيل بعد تأخير قصير لضمان تحميل قاعدة البيانات
//   setTimeout(() => {
//     initializeAutoUnification().catch(console.error);
//   }, 5000);
// }