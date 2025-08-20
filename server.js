// ملف تشغيل مبسط للنظام
const { execSync } = require('child_process');

console.log('🚀 تشغيل نظام قرطبة للتوريدات...');
console.log('📍 النظام سيعمل على: http://localhost:5000');
console.log('');

// تشغيل الأمر
execSync('npm run dev', { stdio: 'inherit' });