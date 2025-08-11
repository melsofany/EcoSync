#!/usr/bin/env tsx

/**
 * سكريبت لمسح جميع البيانات من Google Sheets
 */

import { googleSheetsStorage } from './google-sheets-storage.js';

async function clearAllGoogleSheetsData() {
  console.log('🔄 بدء مسح جميع البيانات من Google Sheets...');
  
  try {
    // مسح جميع البيانات
    await googleSheetsStorage.clearAllData();
    
    console.log('✅ تم مسح جميع البيانات من Google Sheets بنجاح');
    console.log('🔄 Google Sheets جاهز الآن لاستقبال بيانات جديدة');
    
  } catch (error) {
    console.error('❌ خطأ في مسح البيانات:', error);
  }
  
  process.exit(0);
}

// تشغيل السكريبت
clearAllGoogleSheetsData();