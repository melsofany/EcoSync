#!/usr/bin/env tsx

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

async function fixDuplicateIds() {
  try {
    console.log('🔧 إصلاح المعرفات المتكررة...');
    
    const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const credentials = JSON.parse(serviceAccountKey);

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth: auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

    // قراءة البيانات الكاملة
    console.log('📖 قراءة البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'DATA!A:O'
    });

    const rows = response.data.values || [];
    console.log(`📊 تم قراءة ${rows.length} صف`);

    // العثور على آخر معرف موحد
    let lastValidId = 0;
    for (let i = 1; i < rows.length; i++) {
      const columnA = rows[i] ? rows[i][0] : '';
      if (columnA && columnA.match(/^P-\d{7}$/)) {
        const idNumber = parseInt(columnA.substring(2));
        if (idNumber > lastValidId) {
          lastValidId = idNumber;
        }
      }
    }

    console.log(`🔢 آخر معرف موحد: P-${lastValidId.toString().padStart(7, '0')}`);

    // البحث عن المعرفات المتكررة وإصلاحها
    const updates = [];
    let nextId = lastValidId + 1;
    let fixedCount = 0;

    console.log('🔍 البحث عن المعرفات المتكررة...');

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const columnA = row[0] || '';

      // التحقق من المعرفات التي تحتاج إصلاح
      if (columnA.startsWith('DUPLICATE-P-') || !columnA.match(/^P-\d{7}$/)) {
        const lineItem = row[2] ? row[2].toString().trim() : '';
        const partNumber = row[3] ? row[3].toString().trim() : '';
        const description = row[4] ? row[4].toString().trim() : '';

        // تخطي الصفوف الفارغة
        if (!lineItem && !partNumber && !description) continue;

        const newId = `P-${nextId.toString().padStart(7, '0')}`;
        
        updates.push({
          range: `DATA!A${i + 1}`,
          values: [[newId]]
        });

        console.log(`🔧 الصف ${i + 1}: "${columnA}" → "${newId}"`);
        
        nextId++;
        fixedCount++;
      }
    }

    console.log(`📋 تم العثور على ${updates.length} معرف يحتاج إصلاح`);

    if (updates.length > 0) {
      console.log('💾 تطبيق الإصلاحات في Google Sheets...');

      try {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: updates
          }
        });

        console.log(`✅ تم إصلاح ${fixedCount} معرف بنجاح!`);
        console.log(`🎯 المعرفات الجديدة: P-${(lastValidId + 1).toString().padStart(7, '0')} إلى P-${(nextId - 1).toString().padStart(7, '0')}`);

      } catch (updateError: any) {
        console.error(`❌ خطأ في تطبيق التحديثات: ${updateError.message}`);
      }

    } else {
      console.log('✅ لا توجد معرفات تحتاج إصلاح');
    }

  } catch (error: any) {
    console.error('❌ خطأ في العملية:', error.message);
  }
}

fixDuplicateIds();