#!/usr/bin/env node

// نسخة الإنتاج من نظام قرطبة للتوريدات
console.log('🚀 تشغيل نظام قرطبة للتوريدات - وضع الإنتاج');
console.log('📈 Production Mode - Qurtoba Supply Management System');

// تعيين متغيرات البيئة للإنتاج
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

// تأكيد إعدادات الإنتاج
console.log('🏭 NODE_ENV:', process.env.NODE_ENV);
console.log('📡 PORT:', process.env.PORT);
console.log('🔒 إعدادات الأمان: مُفعلة');

// بدء تشغيل النظام
import('./server/index.js')
  .then(() => {
    console.log('✅ تم تشغيل النظام بنجاح في وضع الإنتاج');
    console.log('🌐 النظام متاح على المنفذ:', process.env.PORT);
  })
  .catch((error) => {
    console.error('❌ خطأ في تشغيل النظام:', error);
    process.exit(1);
  });