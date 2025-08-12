#!/usr/bin/env tsx

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

async function checkColumnAStatus() {
  try {
    console.log('🔍 فحص حالة العمود A في Google Sheets...');
    
    const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
    const credentials = JSON.parse(serviceAccountKey);

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth: auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

    // قراءة العمود A فقط
    console.log('📖 قراءة العمود A...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'DATA!A:A'
    });

    const columnA = response.data.values || [];
    console.log(`📊 تم قراءة ${columnA.length} خلية من العمود A`);

    // تحليل أول 20 قيمة
    console.log('\n📋 أول 20 قيمة من العمود A:');
    for (let i = 0; i < Math.min(20, columnA.length); i++) {
      const value = columnA[i] ? columnA[i][0] : 'فارغ';
      console.log(`الصف ${i + 1}: "${value}"`);
    }

    // إحصائيات التوحيد
    let totalNonEmpty = 0;
    let unifiedCount = 0;
    let emptyCount = 0;
    let otherPatterns = [];

    for (let i = 1; i < columnA.length; i++) { // تخطي العنوان
      const value = columnA[i] ? columnA[i][0] : '';
      
      if (!value || value.trim() === '') {
        emptyCount++;
      } else {
        totalNonEmpty++;
        if (value.match(/^P-\d{7}$/)) {
          unifiedCount++;
        } else {
          if (otherPatterns.length < 10) {
            otherPatterns.push(`الصف ${i + 1}: "${value}"`);
          }
        }
      }
    }

    console.log('\n📊 إحصائيات العمود A:');
    console.log(`- إجمالي الصفوف: ${columnA.length - 1}`);
    console.log(`- خلايا فارغة: ${emptyCount}`);
    console.log(`- خلايا غير فارغة: ${totalNonEmpty}`);
    console.log(`- معرفات موحدة (P-0000000): ${unifiedCount}`);
    console.log(`- معرفات غير موحدة: ${totalNonEmpty - unifiedCount}`);

    if (otherPatterns.length > 0) {
      console.log('\n🔍 أمثلة على المعرفات غير الموحدة:');
      otherPatterns.forEach(pattern => console.log(`  ${pattern}`));
    }

    // اقتراح العمل المطلوب
    const needsUnification = totalNonEmpty - unifiedCount;
    if (needsUnification > 0) {
      console.log(`\n⚠️ يحتاج ${needsUnification} معرف للتوحيد`);
    } else {
      console.log('\n✅ جميع المعرفات موحدة');
    }

  } catch (error: any) {
    console.error('❌ خطأ في الفحص:', error.message);
  }
}

checkColumnAStatus();