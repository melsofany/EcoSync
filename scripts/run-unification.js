#!/usr/bin/env node

/**
 * تشغيل توحيد البنود مع المراقبة
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 بدء تشغيل نظام توحيد البنود...');
console.log('📁 مجلد المشروع:', projectRoot);

// تشغيل سكريبت التوحيد
const unificationScript = `
import { runUnificationWithMonitoring } from '../server/unification-monitor.js';

async function runUnification() {
  try {
    console.log('🔍 بدء توحيد البنود مع المراقبة الكاملة...');
    
    // توحيد أول 100 بند
    const result = await runUnificationWithMonitoring(100);
    
    console.log('\\n' + '='.repeat(60));
    console.log('📊 تقرير التوحيد النهائي:');
    console.log('='.repeat(60));
    
    result.detailedReport.forEach(line => console.log(line));
    
    console.log('\\n🎉 اكتمل التوحيد بنجاح!');
    
    if (result.itemsUnified > 0) {
      console.log('\\n🔄 تشغيل دورة ثانية للتحقق من المزيد...');
      setTimeout(async () => {
        const secondResult = await runUnificationWithMonitoring(50);
        console.log(\`✅ الدورة الثانية: \${secondResult.itemsUnified} بند إضافي تم توحيده\`);
      }, 5000);
    }
    
  } catch (error) {
    console.error('❌ خطأ في التوحيد:', error.message);
    if (error.detailedReport) {
      console.log('\\n📋 تقرير الخطأ:');
      error.detailedReport.forEach(line => console.log(line));
    }
  }
}

runUnification();
`;

// كتابة السكريبت المؤقت
import { writeFileSync, unlinkSync } from 'fs';
const tempScript = join(projectRoot, 'temp-unification.mjs');

try {
  writeFileSync(tempScript, unificationScript);
  console.log('📝 تم إنشاء سكريبت التوحيد المؤقت');
  
  // تشغيل السكريبت
  console.log('▶️ تشغيل عملية التوحيد...');
  console.log('='.repeat(60));
  
  const result = execSync(`cd "${projectRoot}" && node temp-unification.mjs`, {
    encoding: 'utf8',
    stdio: 'inherit',
    timeout: 300000 // 5 دقائق حد أقصى
  });
  
} catch (error) {
  console.error('❌ خطأ في تشغيل التوحيد:', error.message);
} finally {
  // حذف السكريبت المؤقت
  try {
    unlinkSync(tempScript);
    console.log('🗑️ تم حذف السكريبت المؤقت');
  } catch (e) {
    // تجاهل أخطاء الحذف
  }
}

console.log('✅ انتهى تشغيل نظام توحيد البنود');