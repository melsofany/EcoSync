#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 إعداد متغيرات البيئة لـ Render.com');
console.log('=====================================\n');

// قراءة ملف مفتاح Google
const keyPath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';

if (!fs.existsSync(keyPath)) {
  console.error('❌ الملف غير موجود:', keyPath);
  process.exit(1);
}

try {
  // قراءة وتحليل ملف المفتاح
  const keyContent = fs.readFileSync(keyPath, 'utf8');
  const keyJson = JSON.parse(keyContent);
  
  // التحقق من صحة المفتاح
  if (!keyJson.client_email || !keyJson.private_key) {
    console.error('❌ ملف المفتاح غير صالح');
    process.exit(1);
  }
  
  // تحويل إلى Base64
  const base64Key = Buffer.from(keyContent).toString('base64');
  
  console.log('✅ تم قراءة مفتاح Google بنجاح');
  console.log('📧 البريد الإلكتروني للخدمة:', keyJson.client_email);
  console.log('🔑 معرف المشروع:', keyJson.project_id);
  console.log('\n');
  
  // معرف Google Sheets
  const sheetsId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  
  console.log('📋 متغيرات البيئة المطلوبة لـ Render.com:');
  console.log('==========================================\n');
  
  console.log('1. GOOGLE_SERVICE_ACCOUNT_BASE64:');
  console.log('   (انسخ القيمة التالية بالكامل)');
  console.log('   ⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️');
  console.log(base64Key);
  console.log('   ⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️\n');
  
  console.log('2. GOOGLE_SHEETS_ID:');
  console.log('   ' + sheetsId);
  console.log('\n');
  
  console.log('3. SESSION_SECRET:');
  console.log('   ' + 'cortoba-2025-secure-session-key');
  console.log('\n');
  
  console.log('4. DATABASE_URL:');
  console.log('   (سيتم إنشاؤه تلقائياً بواسطة Render)\n');
  
  console.log('5. NODE_ENV:');
  console.log('   production\n');
  
  console.log('📝 كيفية إضافة هذه المتغيرات في Render.com:');
  console.log('=============================================');
  console.log('1. افتح لوحة تحكم Render.com');
  console.log('2. اختر تطبيقك');
  console.log('3. اذهب إلى تبويب "Environment"');
  console.log('4. أضف كل متغير بيئة مع قيمته');
  console.log('5. اضغط "Save Changes"');
  console.log('6. سيتم إعادة نشر التطبيق تلقائياً');
  console.log('\n');
  
  // إنشاء ملف .env.production للاختبار المحلي
  const envContent = `# متغيرات البيئة للإنتاج
GOOGLE_SERVICE_ACCOUNT_BASE64=${base64Key}
GOOGLE_SHEETS_ID=${sheetsId}
SESSION_SECRET=cortoba-2025-secure-session-key
NODE_ENV=production
`;
  
  fs.writeFileSync('.env.production', envContent);
  console.log('✅ تم إنشاء ملف .env.production للاختبار المحلي');
  
  console.log('\n✨ اكتمل الإعداد بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}