#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface SavedRecord {
  [key: string]: any;
  rfqDate?: string;
  rfqResponseDate?: string;
  poDate?: string;
}

// دالة تصحيح التواريخ المحسنة
function correctDateFormat(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  // إذا كان نص تاريخ
  if (typeof dateValue === 'string') {
    const cleanDate = dateValue.trim();
    
    // صيغة MM/DD/YY مثل "1/5/25"
    const mmddyy = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (mmddyy) {
      const [, month, day, year] = mmddyy;
      const fullYear = `20${year}`; // تحويل 25 إلى 2025
      const correctedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log(`📅 تصحيح: ${cleanDate} → ${correctedDate}`);
      return correctedDate;
    }
    
    // صيغة MM/DD/YYYY مثل "1/5/2025"
    const mmddyyyy = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy;
      const correctedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log(`📅 تصحيح: ${cleanDate} → ${correctedDate}`);
      return correctedDate;
    }
    
    // إذا كان التاريخ صحيح بالفعل
    if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return cleanDate;
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

async function fixDatesInSavedData() {
  try {
    const dataPath = path.join(process.cwd(), 'attached_assets', 'database_records.json');
    
    console.log('🔍 قراءة البيانات المحفوظة...');
    const savedData: SavedRecord[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📊 تم العثور على ${savedData.length} سجل`);
    
    let correctedCount = 0;
    
    console.log('🔄 بدء تصحيح التواريخ...');
    
    savedData.forEach((record, index) => {
      let recordCorrected = false;
      
      // تصحيح تاريخ طلب التسعير
      if (record.rfqDate) {
        const originalDate = record.rfqDate;
        const correctedDate = correctDateFormat(originalDate);
        if (originalDate !== correctedDate) {
          record.rfqDate = correctedDate;
          recordCorrected = true;
        }
      }
      
      // تصحيح تاريخ رد طلب التسعير
      if (record.rfqResponseDate) {
        const originalDate = record.rfqResponseDate;
        const correctedDate = correctDateFormat(originalDate);
        if (originalDate !== correctedDate) {
          record.rfqResponseDate = correctedDate;
          recordCorrected = true;
        }
      }
      
      // تصحيح تاريخ أمر الشراء
      if (record.poDate) {
        const originalDate = record.poDate;
        const correctedDate = correctDateFormat(originalDate);
        if (originalDate !== correctedDate) {
          record.poDate = correctedDate;
          recordCorrected = true;
        }
      }
      
      if (recordCorrected) {
        correctedCount++;
      }
    });
    
    console.log(`✅ تم تصحيح ${correctedCount} سجل`);
    
    // حفظ البيانات المصححة
    const correctedDataPath = path.join(process.cwd(), 'attached_assets', 'database_records_corrected.json');
    fs.writeFileSync(correctedDataPath, JSON.stringify(savedData, null, 2));
    
    // استبدال الملف الأصلي
    fs.writeFileSync(dataPath, JSON.stringify(savedData, null, 2));
    
    console.log('💾 تم حفظ البيانات المصححة');
    console.log('🎉 اكتمل تصحيح التواريخ في البيانات المحفوظة');
    
    return {
      success: true,
      totalRecords: savedData.length,
      correctedRecords: correctedCount
    };
    
  } catch (error) {
    console.error('❌ خطأ في تصحيح التواريخ:', error);
    return {
      success: false,
      error: error.message || 'خطأ غير معروف'
    };
  }
}

// تشغيل التصحيح
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDatesInSavedData().then((result) => {
    if (result.success) {
      console.log('✅ اكتمل تصحيح التواريخ بنجاح');
      process.exit(0);
    } else {
      console.error('❌ فشل في تصحيح التواريخ:', result.error);
      process.exit(1);
    }
  });
}

export { fixDatesInSavedData };