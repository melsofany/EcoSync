#!/usr/bin/env node
// إصلاح توحيد التلفزيونات بنظام يدوي بدون AI

import { google } from 'googleapis';
import fs from 'fs';

const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

console.log('🔧 بدء إصلاح توحيد التلفزيونات...\n');

async function fixTVUnification() {
  try {
    // قراءة البيانات
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });
    
    const rows = response.data.values || [];
    console.log(`📖 تم قراءة ${rows.length} صف\n`);
    
    // البحث عن التلفزيونات مع P-0000014
    const tvRowsToFix = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const id = row[0] || '';
      const description = (row[4] || '').toLowerCase();
      
      if (id === 'P-0000014' && (description.includes('tv') || description.includes('t.v'))) {
        // استخراج الحجم
        const sizeMatch = description.match(/(\d+)\s*(?:"|''|inch)/i);
        const size = sizeMatch ? sizeMatch[1] : null;
        
        if (size) {
          tvRowsToFix.push({
            rowIndex: i + 1,
            size: size,
            description: row[4] || '',
            currentId: id
          });
        }
      }
    }
    
    console.log(`📺 تم العثور على ${tvRowsToFix.length} تلفزيون يحتاج إصلاح\n`);
    
    // تجميع حسب الحجم
    const sizeGroups = {};
    tvRowsToFix.forEach(tv => {
      if (!sizeGroups[tv.size]) sizeGroups[tv.size] = [];
      sizeGroups[tv.size].push(tv);
    });
    
    console.log('📊 التجميع حسب الحجم:');
    Object.entries(sizeGroups).forEach(([size, tvs]) => {
      console.log(`   ${size}" بوصة: ${tvs.length} تلفزيون`);
    });
    console.log();
    
    // إنشاء معرفات جديدة للأحجام المختلفة
    const newIds = {
      '32': 'P-0000014', // 32 بوصة يحتفظ بالمعرف الحالي
      '43': 'P-0001500', // 43 بوصة معرف جديد
      '50': 'P-0001501', // 50 بوصة معرف جديد
      '55': 'P-0001502'  // 55 بوصة معرف جديد
    };
    
    console.log('🆔 المعرفات الجديدة:');
    Object.entries(newIds).forEach(([size, id]) => {
      console.log(`   ${size}" = ${id}`);
    });
    console.log();
    
    // إعداد التحديثات
    const updates = [];
    
    Object.entries(sizeGroups).forEach(([size, tvs]) => {
      const newId = newIds[size];
      if (newId && newId !== 'P-0000014') { // لا نحدث 32 بوصة لأنه صحيح
        tvs.forEach(tv => {
          console.log(`🔄 تحديث الصف ${tv.rowIndex}: ${tv.size}" → ${newId}`);
          updates.push({
            range: `DATA!A${tv.rowIndex}`,
            values: [[newId]]
          });
        });
      }
    });
    
    if (updates.length === 0) {
      console.log('✅ لا توجد تحديثات مطلوبة - جميع التلفزيونات صحيحة');
      return;
    }
    
    console.log(`\n🔄 تطبيق ${updates.length} تحديث...`);
    
    // تطبيق التحديثات
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
    
    console.log('✅ تم الانتهاء من إصلاح التوحيد!\n');
    
    // عرض النتائج النهائية
    console.log('📊 النتائج النهائية:');
    console.log('   P-0000014 = تلفزيونات 32" فقط');
    console.log('   P-0001500 = تلفزيونات 43" فقط'); 
    console.log('   P-0001501 = تلفزيونات 50" فقط');
    console.log('   P-0001502 = تلفزيونات 55" فقط');
    
  } catch (error) {
    console.error('❌ خطأ في الإصلاح:', error.message);
  }
}

fixTVUnification();