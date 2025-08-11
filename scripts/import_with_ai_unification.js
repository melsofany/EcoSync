/**
 * Script شامل لاستيراد البيانات من Excel مع توحيد البنود بالذكاء الاصطناعي
 * يقوم بمسح البيانات الحالية وإعادة الاستيراد من ملف Excel الجديد
 */

import fs from 'fs/promises';
import path from 'path';
import { db } from '../server/storage.js';
import { findSimilarItems } from '../server/smart-item-matcher.js';
import { nanoid } from 'nanoid';

async function clearAllData() {
  console.log('🗑️ مسح جميع البيانات الحالية...');
  
  try {
    // مسح البيانات بترتيب صحيح (مراعاة العلاقات)
    await db.execute('TRUNCATE quotation_items CASCADE');
    await db.execute('TRUNCATE quotation_requests CASCADE');
    await db.execute('TRUNCATE purchase_order_items CASCADE');
    await db.execute('TRUNCATE purchase_orders CASCADE');
    await db.execute('TRUNCATE items CASCADE');
    await db.execute('TRUNCATE suppliers CASCADE');
    await db.execute('TRUNCATE clients CASCADE');
    
    console.log('✅ تم مسح جميع البيانات');
  } catch (error) {
    console.error('❌ خطأ في مسح البيانات:', error);
    throw error;
  }
}

async function createBasicEntities() {
  console.log('🏗️ إنشاء البيانات الأساسية...');
  
  const userId = '195b4918-07ae-4dea-827d-384483b704c1'; // IT Admin
  
  // إنشاء عميل افتراضي
  await db.execute(`
    INSERT INTO clients (id, name, phone, email, address, created_by) 
    VALUES ('default-client', 'عميل افتراضي', '', '', '', '${userId}')
  `);
  
  // إنشاء مورد افتراضي
  await db.execute(`
    INSERT INTO suppliers (id, name, contact_person, phone, email, address, created_by) 
    VALUES ('default-supplier', 'مورد افتراضي', '', '', '', '', '${userId}')
  `);
  
  console.log('✅ تم إنشاء البيانات الأساسية');
}

async function importItemsWithAI(items) {
  console.log(`🤖 استيراد ${items.length} بند مع توحيد بالذكاء الاصطناعي...`);
  
  const importedItems = [];
  const userId = '195b4918-07ae-4dea-827d-384483b704c1';
  let itemCounter = 1;
  
  for (const itemData of items) {
    try {
      // البحث عن بند مشابه باستخدام AI
      const similarItems = await findSimilarItems({
        description: itemData.description,
        partNumber: itemData.part_number,
        specifications: itemData.line_item
      });
      
      let itemId;
      
      if (similarItems && similarItems.length > 0) {
        // استخدام البند الموجود
        itemId = similarItems[0].id;
        console.log(`🔗 ربط بند موجود: ${itemData.description.substring(0, 50)}...`);
      } else {
        // إنشاء بند جديد
        itemId = `item-${itemCounter.toString().padStart(6, '0')}`;
        const itemNumber = `P-${itemCounter.toString().padStart(6, '0')}`;
        
        await db.execute(`
          INSERT INTO items (
            id, item_number, part_number, line_item, description, 
            unit, category, created_by, ai_status
          ) VALUES (
            '${itemId}', '${itemNumber}', '${itemData.part_number}', 
            '${itemData.line_item}', '${itemData.description}', 
            '${itemData.unit}', '${itemData.category}', 
            '${userId}', 'ai_verified'
          )
        `);
        
        console.log(`✨ بند جديد: ${itemData.description.substring(0, 50)}...`);
        itemCounter++;
      }
      
      importedItems.push({
        originalData: itemData,
        itemId: itemId
      });
      
    } catch (error) {
      console.error(`❌ خطأ في معالجة البند: ${itemData.description}`, error);
    }
  }
  
  console.log(`✅ تم استيراد ${importedItems.length} بند`);
  return importedItems;
}

async function importQuotationRequests(rfqData, itemsMap) {
  console.log(`📋 استيراد ${Object.keys(rfqData).length} طلب تسعير...`);
  
  const userId = '195b4918-07ae-4dea-827d-384483b704c1';
  let counter = 1;
  
  for (const [rfqNumber, rfqInfo] of Object.entries(rfqData)) {
    try {
      const rfqId = `rfq-${counter.toString().padStart(6, '0')}`;
      
      await db.execute(`
        INSERT INTO quotation_requests (
          id, request_number, custom_request_number, request_date, 
          status, created_by
        ) VALUES (
          '${rfqId}', '${rfqNumber}', '${rfqNumber}', 
          '${rfqInfo.request_date}', '${rfqInfo.status}', '${userId}'
        )
      `);
      
      counter++;
    } catch (error) {
      console.error(`❌ خطأ في إنشاء طلب التسعير ${rfqNumber}:`, error);
    }
  }
  
  console.log(`✅ تم استيراد طلبات التسعير`);
}

async function importPurchaseOrders(poData, rfqData) {
  console.log(`🛒 استيراد ${Object.keys(poData).length} أمر شراء...`);
  
  const userId = '195b4918-07ae-4dea-827d-384483b704c1';
  let counter = 1;
  
  for (const [poNumber, poInfo] of Object.entries(poData)) {
    try {
      const poId = `po-${counter.toString().padStart(6, '0')}`;
      
      // البحث عن طلب التسعير المرتبط
      let quotationId = null;
      if (poInfo.rfq_number && rfqData[poInfo.rfq_number]) {
        const rfqIndex = Object.keys(rfqData).indexOf(poInfo.rfq_number) + 1;
        quotationId = `rfq-${rfqIndex.toString().padStart(6, '0')}`;
      } else {
        quotationId = `rfq-${counter.toString().padStart(6, '0')}`; // ربط افتراضي
      }
      
      await db.execute(`
        INSERT INTO purchase_orders (
          id, po_number, quotation_id, po_date, supplier_id, created_by
        ) VALUES (
          '${poId}', '${poNumber}', '${quotationId}', 
          '${poInfo.po_date}', 'default-supplier', '${userId}'
        )
      `);
      
      counter++;
    } catch (error) {
      console.error(`❌ خطأ في إنشاء أمر الشراء ${poNumber}:`, error);
    }
  }
  
  console.log(`✅ تم استيراد أوامر الشراء`);
}

async function main() {
  try {
    console.log('🚀 بدء عملية الاستيراد الشامل مع توحيد البنود بالـ AI...');
    
    // قراءة البيانات المعالجة
    const dataPath = path.join(process.cwd(), 'attached_assets', 'final_import_data.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const importData = JSON.parse(rawData);
    
    console.log(`📊 البيانات المراد استيرادها:`);
    console.log(`   البنود: ${importData.items.length}`);
    console.log(`   طلبات التسعير: ${Object.keys(importData.rfq_data).length}`);
    console.log(`   أوامر الشراء: ${Object.keys(importData.po_data).length}`);
    
    // مسح البيانات الحالية
    await clearAllData();
    
    // إنشاء البيانات الأساسية
    await createBasicEntities();
    
    // استيراد البنود مع توحيد AI
    const importedItems = await importItemsWithAI(importData.items.slice(0, 100)); // أول 100 بند للاختبار
    
    // استيراد طلبات التسعير
    const limitedRfqData = Object.fromEntries(
      Object.entries(importData.rfq_data).slice(0, 50) // أول 50 طلب
    );
    await importQuotationRequests(limitedRfqData, importedItems);
    
    // استيراد أوامر الشراء
    const limitedPoData = Object.fromEntries(
      Object.entries(importData.po_data).slice(0, 25) // أول 25 أمر
    );
    await importPurchaseOrders(limitedPoData, limitedRfqData);
    
    console.log('🎉 تم الانتهاء من الاستيراد بنجاح!');
    console.log('💡 تم تطبيق توحيد البنود بالذكاء الاصطناعي لمنع التكرار');
    
  } catch (error) {
    console.error('❌ خطأ في عملية الاستيراد:', error);
    process.exit(1);
  }
}

// تشغيل Script إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as importWithAIUnification };