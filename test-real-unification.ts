#!/usr/bin/env tsx

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

async function performRealUnification() {
  try {
    console.log('🔍 بدء عملية التوحيد الحقيقية...');
    
    // قراءة مفتاح الخدمة
    const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const credentials = JSON.parse(serviceAccountKey);

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth: auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

    // قراءة البيانات الحالية
    console.log('📖 قراءة البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'DATA!A:O'
    });

    const rows = response.data.values || [];
    console.log(`📊 تم قراءة ${rows.length} صف`);

    if (rows.length < 2) {
      throw new Error('لا توجد بيانات كافية');
    }

    // تحليل البيانات وإعداد التحديثات
    const updates = [];
    let itemCounter = 1;
    let unifiedCount = 0;

    console.log('🔄 تحليل البيانات...');
    
    for (let i = 1; i < rows.length && itemCounter <= 5000; i++) {
      const row = rows[i] || [];

      if (row.length >= 3) {
        const currentColumnA = row[0] || '';
        const lineItem = row[2] ? row[2].toString().trim() : '';
        const partNumber = row[3] ? row[3].toString().trim() : '';
        const description = row[4] ? row[4].toString().trim() : '';

        // تخطي الصفوف الفارغة
        if (!lineItem && !partNumber && !description) continue;

        const newId = `P-${itemCounter.toString().padStart(7, '0')}`;

        // التحقق من الحاجة للتحديث
        if (!currentColumnA || currentColumnA !== newId) {
          updates.push({
            range: `DATA!A${i + 1}`,
            values: [[newId]]
          });
          unifiedCount++;
          
          if (unifiedCount <= 10) {
            console.log(`🆔 الصف ${i + 1}: "${currentColumnA}" → "${newId}"`);
          }
        }

        itemCounter++;
      }
    }

    console.log(`📋 تم العثور على ${updates.length} تحديث مطلوب`);

    if (updates.length > 0) {
      console.log('💾 تطبيق التحديثات في Google Sheets...');

      // تطبيق التحديثات بمجموعات
      const batchSize = 100;
      let appliedUpdates = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        try {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetId,
            requestBody: {
              valueInputOption: 'RAW',
              data: batch
            }
          });

          appliedUpdates += batch.length;
          console.log(`✅ تم تطبيق ${appliedUpdates}/${updates.length} تحديث`);

          // انتظار قصير لتجنب حدود API
          if (i + batchSize < updates.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (batchError: any) {
          console.error(`❌ خطأ في المجموعة: ${batchError.message}`);
        }
      }

      console.log(`🎉 تم الانتهاء! تم توحيد ${unifiedCount} معرف`);
    } else {
      console.log('✅ جميع المعرفات موحدة بالفعل');
    }

  } catch (error: any) {
    console.error('❌ خطأ في التوحيد:', error.message);
  }
}

performRealUnification();