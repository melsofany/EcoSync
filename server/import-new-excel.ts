#!/usr/bin/env tsx

/**
 * سكريبت لاستيراد البيانات الجديدة من ملف Excel
 */

import XLSX from 'xlsx';
import * as fs from 'fs';
import { nanoid } from 'nanoid';

interface ExcelRow {
  [key: string]: any;
}

interface ImportedItem {
  id: string;
  partNumber: string;
  description: string;
  uom: string;
  lineItem: string;
  rfqNumber: string;
  requestDate: string;
  quantity: number;
  price: number;
  responseDate: string;
  poNumber: string;
  poDate: string;
  poQuantity: number;
  poPrice: number;
}

async function importNewExcelData() {
  try {
    console.log('🔄 بدء استيراد البيانات الجديدة من Excel...');
    
    const filePath = './attached_assets/im (2)_1754953923455.xlsx';
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ الملف غير موجود:', filePath);
      return;
    }

    // قراءة ملف Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // تحويل البيانات إلى JSON
    const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: ''
    });

    console.log(`📊 تم العثور على ${rawData.length} صف في الملف`);

    // تحليل البيانات وتنظيمها
    const importedItems: ImportedItem[] = [];
    const quotationRequests = new Map();
    const purchaseOrders = new Map();

    // تخطي الصف الأول إذا كان يحتوي على العناوين
    const dataRows = rawData.slice(1).filter(row => row && row.length > 0);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      if (!row || row.length < 5) continue;

      try {
        const item: ImportedItem = {
          id: `new-item-${nanoid()}`,
          partNumber: String(row[2] || '').trim(),
          description: String(row[3] || '').trim(),
          uom: String(row[0] || '').trim(),
          lineItem: String(row[1] || '').trim(),
          rfqNumber: String(row[4] || '').trim(),
          requestDate: String(row[5] || '').trim(),
          quantity: parseFloat(String(row[6] || '0')) || 0,
          price: parseFloat(String(row[7] || '0')) || 0,
          responseDate: String(row[8] || '').trim(),
          poNumber: String(row[9] || '').trim(),
          poDate: String(row[10] || '').trim(),
          poQuantity: parseFloat(String(row[11] || '0')) || 0,
          poPrice: parseFloat(String(row[12] || '0')) || 0
        };

        if (item.partNumber && item.description) {
          importedItems.push(item);
        }
      } catch (error) {
        console.log(`⚠️ خطأ في معالجة الصف ${i + 1}:`, error.message);
      }
    }

    console.log(`✅ تم استيراد ${importedItems.length} صنف بنجاح`);

    // حفظ البيانات المستوردة
    const outputData = {
      importedAt: new Date().toISOString(),
      totalItems: importedItems.length,
      items: importedItems
    };

    fs.writeFileSync('./attached_assets/new_excel_import_data.json', JSON.stringify(outputData, null, 2), 'utf8');
    
    console.log('📁 تم حفظ البيانات في: new_excel_import_data.json');
    
    // عرض عينة من البيانات
    console.log('\n📋 عينة من البيانات المستوردة:');
    importedItems.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.partNumber} - ${item.description}`);
      console.log(`   رقم الطلب: ${item.rfqNumber} | رقم الأمر: ${item.poNumber}`);
    });

    return outputData;

  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error);
  }
}

// تشغيل السكريبت
importNewExcelData().then(() => {
  console.log('✅ اكتمل استيراد البيانات');
  process.exit(0);
}).catch((error) => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});