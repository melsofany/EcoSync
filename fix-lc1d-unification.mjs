#!/usr/bin/env node

/**
 * إصلاح توحيد بنود LC1D 32M7 المتطابقة
 * يوحد جميع البنود التي تحتوي على LC1D 32 M7 تحت معرف واحد
 */

import { google } from 'googleapis';
import fs from 'fs';

// التكوين
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

async function fixLC1DUnification() {
  console.log('🔧 إصلاح توحيد بنود LC1D 32M7...\n');
  
  try {
    // قراءة البيانات
    console.log('📖 قراءة البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });
    
    const rows = response.data.values || [];
    console.log(`✅ تم قراءة ${rows.length} صف\n`);
    
    // البحث عن جميع بنود LC1D 32M7
    console.log('🔍 البحث عن بنود LC1D 32M7...');
    const lc1dRows = [];
    const uniqueIds = new Set();
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const id = row[0] || '';
      const description = row[4] || '';
      const partNumber = row[3] || '';
      
      // البحث عن LC1D 32 M7 في الوصف أو رقم القطعة
      if (description.includes('LC1D 32 M7') || 
          description.includes('LC1D 32M7') || 
          description.includes('LC1D32M7') ||
          partNumber.includes('LC1D') ||
          partNumber === '2102049') {
        
        lc1dRows.push({
          row: i + 1,
          id: id,
          lineItem: row[2] || '',
          partNumber: partNumber,
          description: description
        });
        
        if (id) {
          uniqueIds.add(id);
        }
      }
    }
    
    console.log(`\n📊 النتائج:`);
    console.log(`   • وجدت ${lc1dRows.length} بند LC1D 32M7`);
    console.log(`   • المعرفات الفريدة: ${Array.from(uniqueIds).join(', ')}`);
    console.log(`   • عدد المعرفات المختلفة: ${uniqueIds.size}\n`);
    
    if (uniqueIds.size <= 1) {
      console.log('✅ البنود موحدة بالفعل!');
      return;
    }
    
    // عرض عينة من البنود
    console.log('📋 عينة من البنود:');
    for (let i = 0; i < Math.min(5, lc1dRows.length); i++) {
      const item = lc1dRows[i];
      console.log(`   الصف ${item.row}: ${item.id} | ${item.partNumber} | ${item.description.substring(0, 50)}...`);
    }
    
    // اختيار المعرف الموحد (P-0000016 لأنه الأكثر تكراراً)
    const unifiedId = 'P-0000016';
    console.log(`\n🎯 سيتم توحيد جميع البنود تحت المعرف: ${unifiedId}`);
    
    // تحديث Google Sheets
    console.log('\n💾 تحديث Google Sheets...');
    
    const updates = [];
    let updateCount = 0;
    
    for (const item of lc1dRows) {
      if (item.id !== unifiedId) {
        updates.push({
          range: `DATA!A${item.row}`,
          values: [[unifiedId]]
        });
        updateCount++;
      }
    }
    
    if (updates.length > 0) {
      // تحديث دفعة واحدة
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          data: updates,
          valueInputOption: 'RAW'
        }
      });
      
      console.log(`✅ تم تحديث ${updateCount} صف`);
    } else {
      console.log('✅ لا توجد تحديثات مطلوبة');
    }
    
    // إحصائيات نهائية
    console.log('\n🎉 اكتمل الإصلاح!');
    console.log(`   • إجمالي بنود LC1D 32M7: ${lc1dRows.length}`);
    console.log(`   • تم توحيدها تحت: ${unifiedId}`);
    console.log(`   • عدد التحديثات: ${updateCount}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response?.data) {
      console.error('تفاصيل:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// تشغيل البرنامج
console.log('=====================================');
console.log('   إصلاح توحيد LC1D 32M7');
console.log('=====================================\n');

fixLC1DUnification();