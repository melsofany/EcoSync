#!/usr/bin/env node

// سكريبت اختبار الاتصال بقاعدة البيانات
import { createConnection } from './server/db.js';

async function testDatabaseConnection() {
  try {
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
    
    const db = createConnection();
    const result = await db.execute('SELECT 1 as test');
    
    if (result.rows && result.rows.length > 0) {
      console.log('✅ الاتصال بقاعدة البيانات ناجح');
      console.log('📊 النتيجة:', result.rows[0]);
    } else {
      console.log('⚠️  تم الاتصال ولكن لم يتم إرجاع بيانات');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:');
    console.error('   السبب:', error.message);
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 الحل: أنشئ قاعدة البيانات أولاً:');
      console.log('   createdb qortoba_supplies');
    } else if (error.message.includes('authentication')) {
      console.log('💡 الحل: تحقق من اسم المستخدم وكلمة المرور في DATABASE_URL');
    } else if (error.message.includes('connection refused')) {
      console.log('💡 الحل: تأكد من تشغيل PostgreSQL:');
      console.log('   sudo systemctl start postgresql');
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();