#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';

console.log('🔍 فحص مشكلة التوحيد للبند LC1D 32M7...\n');

// الاتصال
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

// البحث عن البنود المتطابقة
const res = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: 'DATA!A:E'
});

const rows = res.data.values || [];
console.log('📊 تم قراءة ' + rows.length + ' صف من Google Sheets\n');

// البحث عن البنود مع LINE ITEM: 1531.032.GENRAL.7513
const targetLine = '1531.032.GENRAL.7513';
const targetPart = 'LC1D 32M7';
const matching = [];

for (let i = 1; i < rows.length; i++) {
  const [id, unit, line, part, desc] = rows[i] || [];
  
  // تنظيف النصوص للمقارنة
  const cleanLine = (line || '').replace(/\s+/g, '').toUpperCase();
  const cleanPart = (part || '').replace(/\s+/g, '').toUpperCase();
  const targetLineClean = targetLine.replace(/\s+/g, '').toUpperCase();
  const targetPartClean = targetPart.replace(/\s+/g, '').toUpperCase();
  
  if (cleanLine.includes(targetLineClean) || cleanPart.includes(targetPartClean)) {
    matching.push({
      row: i + 1,
      id: id || '',
      line: line || '',
      part: part || '',
      desc: (desc || '').substring(0, 80)
    });
  }
}

console.log('✅ وجدت ' + matching.length + ' بند متطابق\n');

// عرض البنود المتطابقة
console.log('📋 البنود المتطابقة:');
console.log('=====================================\n');

for (let i = 0; i < Math.min(30, matching.length); i++) {
  const item = matching[i];
  console.log('الصف ' + item.row + ':');
  console.log('  المعرف: ' + item.id);
  console.log('  LINE: ' + item.line);
  console.log('  PART: ' + item.part);
  console.log('  الوصف: ' + item.desc);
  console.log('');
}

// التحقق من المعرفات الفريدة
const uniqueIds = [...new Set(matching.map(m => m.id))];
console.log('\n⚠️ التحليل:');
console.log('=========');
console.log('عدد البنود المتطابقة: ' + matching.length);
console.log('عدد المعرفات المختلفة: ' + uniqueIds.length);
console.log('\nالمعرفات الفريدة:');
uniqueIds.slice(0, 20).forEach(id => console.log('  - ' + id));

if (uniqueIds.length > 1) {
  console.log('\n❌ المشكلة: هذه البنود يجب أن يكون لها معرف واحد موحد!');
  console.log('🔧 سأقوم الآن بتوحيد هذه البنود...\n');
  
  // توحيد المعرفات
  const unifiedId = 'P-UNIFIED-001';
  const updates = [];
  
  for (const item of matching) {
    updates.push({
      range: 'DATA!A' + item.row,
      values: [[unifiedId]]
    });
  }
  
  console.log('📝 كتابة المعرف الموحد ' + unifiedId + ' لـ ' + updates.length + ' صف...');
  
  // الكتابة على دفعات
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: batch
      }
    });
    
    console.log('  ✅ تمت كتابة ' + Math.min(i + batchSize, updates.length) + '/' + updates.length);
  }
  
  console.log('\n✅ تم توحيد جميع البنود بنجاح!');
} else {
  console.log('\n✅ البنود موحدة بالفعل!');
}