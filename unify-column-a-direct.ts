#!/usr/bin/env tsx

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

async function unifyColumnADirectly() {
  try {
    console.log('🆔 بدء توحيد المعرفات في العمود A مباشرة...');

    // قراءة مفتاح الخدمة
    const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const credentials = JSON.parse(serviceAccountKey);

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth: auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

    console.log('📖 قراءة البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'DATA!A:O'
    });

    const rows = response.data.values || [];
    console.log(`📊 تم قراءة ${rows.length} صف من Google Sheets`);

    if (rows.length < 2) {
      console.log("❌ لا توجد بيانات كافية للمعالجة");
      return;
    }

    const updates = [];
    let unifiedCount = 0;
    let itemCounter = 1;

    // البدء من الصف 2 (تجاهل العناوين)
    for (let i = 1; i < rows.length && itemCounter <= 3000; i++) {
      const row = rows[i] || [];

      if (row.length >= 3) {
        const currentColumnA = row[0] || '';
        const lineItem = row[2] ? row[2].toString().trim() : '';
        const partNumber = row[3] ? row[3].toString().trim() : '';
        const description = row[4] ? row[4].toString().trim() : '';

        // تخطي الصفوف الفارغة تماماً
        if (!lineItem && !partNumber && !description) continue;

        // إنشاء معرف موحد جديد بتنسيق P-0000001
        const newId = `P-${itemCounter.toString().padStart(7, '0')}`;

        // تحديث العمود A إذا كان فارغاً أو مختلف
        if (!currentColumnA || !currentColumnA.startsWith('P-') || currentColumnA !== newId) {
          updates.push({
            range: `DATA!A${i + 1}`,
            values: [[newId]]
          });
          unifiedCount++;

          if (unifiedCount <= 20) { // عرض أول 20 تحديث فقط
            console.log(`🆔 الصف ${i + 1}: ${currentColumnA || 'فارغ'} → ${newId}`);
          }
        }

        itemCounter++;
      }
    }

    // تطبيق التحديثات على Google Sheets
    if (updates.length > 0) {
      console.log(`📝 تطبيق ${updates.length} تحديث على Google Sheets...`);

      // تقسيم التحديثات إلى مجموعات صغيرة لتجنب حدود API
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

          // انتظار قصير بين المجموعات لتجنب حدود السرعة
          if (i + batchSize < updates.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (batchError: any) {
          console.error(`❌ خطأ في تطبيق المجموعة ${i / batchSize + 1}:`, batchError.message);
        }
      }
    }

    const message = unifiedCount > 0
      ? `✅ تم توحيد ${unifiedCount} معرف في العمود A بنجاح`
      : `✅ العمود A محدث بالفعل - لا حاجة لتحديثات`;

    console.log(`${message}`);
    console.log(`📊 تمت معالجة ${itemCounter - 1} صنف إجمالاً`);

  } catch (error: any) {
    console.error('❌ خطأ في توحيد المعرفات:', error.message);
  }
}

// تشغيل الدالة مباشرة
unifyColumnADirectly().then(() => {
  console.log('🔚 انتهت عملية التوحيد');
  process.exit(0);
}).catch((error) => {
  console.error('❌ فشل في التوحيد:', error);
  process.exit(1);
});