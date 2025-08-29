#!/usr/bin/env node

// ملف التشغيل البسيط لنظام قرطبة للتوريدات
// Simple startup file for Qortoba Supplies System

const { spawn } = require('child_process');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════');
console.log('        🚀 بدء تشغيل نظام قرطبة للتوريدات');
console.log('        Qortoba Supplies System Starting...');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// تشغيل الخادم
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// معالجة إشارات الإيقاف
process.on('SIGINT', () => {
  console.log('\n\n🛑 إيقاف النظام...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 إيقاف النظام...');
  server.kill('SIGTERM');
  process.exit(0);
});

// معالجة الأخطاء
server.on('error', (error) => {
  console.error('❌ خطأ في تشغيل النظام:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ توقف النظام برمز خطأ: ${code}`);
    process.exit(code);
  }
});

console.log('✅ النظام يعمل على المنفذ 5000');
console.log('📌 افتح المتصفح على: http://localhost:5000');
console.log('');
console.log('للإيقاف: اضغط Ctrl+C');
console.log('═══════════════════════════════════════════════════════════════');