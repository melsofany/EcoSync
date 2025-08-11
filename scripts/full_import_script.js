/**
 * Script الاستيراد الشامل لجميع البيانات من Excel مع توحيد البنود
 */

import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';
import { nanoid } from 'nanoid';

const { Pool } = pg;

async function connectToDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

async function clearAllData(pool) {
  console.log('🗑️ مسح جميع البيانات الحالية...');
  
  const clearQueries = [
    'TRUNCATE quotation_items CASCADE',
    'TRUNCATE quotation_requests CASCADE', 
    'TRUNCATE purchase_order_items CASCADE',
    'TRUNCATE purchase_orders CASCADE',
    'TRUNCATE items CASCADE',
    'TRUNCATE suppliers CASCADE',
    'TRUNCATE clients CASCADE'
  ];
  
  for (const query of clearQueries) {
    try {
      await pool.query(query);
    } catch (error) {
      console.error(`خطأ في تنفيذ: ${query}`, error.message);
    }
  }
  
  console.log('✅ تم مسح جميع البيانات');
}

async function createBasicEntities(pool) {
  console.log('🏗️ إنشاء البيانات الأساسية...');
  
  const userId = '195b4918-07ae-4dea-827d-384483b704c1';
  
  // إنشاء عميل افتراضي
  await pool.query(`
    INSERT INTO clients (id, name, phone, email, address, created_by) 
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING
  `, ['default-client', 'عميل افتراضي', '', '', '', userId]);
  
  // إنشاء مورد افتراضي
  await pool.query(`
    INSERT INTO suppliers (id, name, contact_person, phone, email, address, created_by) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO NOTHING
  `, ['default-supplier', 'مورد افتراضي', '', '', '', '', userId]);
  
  console.log('✅ تم إنشاء البيانات الأساسية');
}

async function importItems(pool, items) {
  console.log(`📦 استيراد ${items.length} بند...`);
  
  const userId = '195b4918-07ae-4dea-827d-384483b704c1';
  let successCount = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const itemId = `item-${(i + 1).toString().padStart(6, '0')}`;
      const itemNumber = `P-${(i + 1).toString().padStart(6, '0')}`;
      
      await pool.query(`
        INSERT INTO items (
          id, item_number, part_number, line_item, description, 
          unit, category, created_by, ai_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        itemId, itemNumber, item.part_number || '', 
        item.line_item || '', item.description || '',
        item.unit || 'EACH', item.category || 'ELEC',
        userId, 'imported'
      ]);
      
      successCount++;
      
      if (successCount % 100 === 0) {
        console.log(`✅ تم استيراد ${successCount} بند`);
      }
      
    } catch (error) {
      console.error(`❌ خطأ في استيراد البند ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ تم استيراد ${successCount} من ${items.length} بند بنجاح`);
  return successCount;
}

async function importQuotationRequests(pool, rfqData) {
  console.log(`📋 استيراد ${Object.keys(rfqData).length} طلب تسعير...`);
  
  const userId = '195b4918-07ae-4dea-827d-384483b704c1';
  let successCount = 0;
  
  const rfqEntries = Object.entries(rfqData);
  
  for (let i = 0; i < rfqEntries.length; i++) {
    const [rfqNumber, rfqInfo] = rfqEntries[i];
    try {
      const rfqId = `rfq-${(i + 1).toString().padStart(6, '0')}`;
      
      await pool.query(`
        INSERT INTO quotation_requests (
          id, request_number, custom_request_number, request_date, 
          status, created_by, client_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [
        rfqId, rfqNumber, rfqNumber, 
        rfqInfo.request_date, rfqInfo.status,
        userId, 'default-client'
      ]);
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ خطأ في استيراد طلب التسعير ${rfqNumber}:`, error.message);
    }
  }
  
  console.log(`✅ تم استيراد ${successCount} طلب تسعير`);
  return successCount;
}

async function importPurchaseOrders(pool, poData, rfqData) {
  console.log(`🛒 استيراد ${Object.keys(poData).length} أمر شراء...`);
  
  const userId = '195b4918-07ae-4dea-827d-384483b704c1';
  let successCount = 0;
  
  const poEntries = Object.entries(poData);
  const rfqKeys = Object.keys(rfqData);
  
  for (let i = 0; i < poEntries.length; i++) {
    const [poNumber, poInfo] = poEntries[i];
    try {
      const poId = `po-${(i + 1).toString().padStart(6, '0')}`;
      
      // البحث عن طلب التسعير المرتبط
      let quotationId = `rfq-${(i + 1).toString().padStart(6, '0')}`; // ربط افتراضي
      if (poInfo.rfq_number && rfqKeys.includes(poInfo.rfq_number)) {
        const rfqIndex = rfqKeys.indexOf(poInfo.rfq_number) + 1;
        quotationId = `rfq-${rfqIndex.toString().padStart(6, '0')}`;
      }
      
      await pool.query(`
        INSERT INTO purchase_orders (
          id, po_number, quotation_id, po_date, supplier_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [
        poId, poNumber, quotationId, 
        poInfo.po_date, 'default-supplier', userId
      ]);
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ خطأ في استيراد أمر الشراء ${poNumber}:`, error.message);
    }
  }
  
  console.log(`✅ تم استيراد ${successCount} أمر شراء`);
  return successCount;
}

async function createItemLinks(pool, originalData, rfqData) {
  console.log('🔗 ربط البنود بطلبات التسعير...');
  
  let linkCount = 0;
  const rfqKeys = Object.keys(rfqData);
  
  // تجميع البيانات بطلب التسعير
  const rfqItemsMap = {};
  
  for (const record of originalData) {
    const rfqNumber = record.rfq_number;
    if (!rfqNumber || !rfqKeys.includes(rfqNumber)) continue;
    
    if (!rfqItemsMap[rfqNumber]) {
      rfqItemsMap[rfqNumber] = [];
    }
    
    rfqItemsMap[rfqNumber].push(record);
  }
  
  for (const [rfqNumber, items] of Object.entries(rfqItemsMap)) {
    const rfqIndex = rfqKeys.indexOf(rfqNumber) + 1;
    const rfqId = `rfq-${rfqIndex.toString().padStart(6, '0')}`;
    
    for (let i = 0; i < items.length && i < 50; i++) { // حد أقصى 50 بند لكل طلب
      const record = items[i];
      try {
        const itemId = `item-${(linkCount + 1).toString().padStart(6, '0')}`;
        const qiId = `qi-${(linkCount + 1).toString().padStart(6, '0')}`;
        
        const quantity = parseFloat(record.rfq_quantity) || 0;
        const unitPrice = parseFloat(record.rfq_price) || 0;
        
        await pool.query(`
          INSERT INTO quotation_items (
            id, quotation_id, item_id, quantity, unit_price
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, [qiId, rfqId, itemId, quantity, unitPrice]);
        
        linkCount++;
        
      } catch (error) {
        console.error('خطأ في ربط البند:', error.message);
      }
    }
  }
  
  console.log(`✅ تم ربط ${linkCount} بند بطلبات التسعير`);
}

async function main() {
  console.log('🚀 بدء الاستيراد الشامل لجميع البيانات...');
  
  let pool;
  try {
    // الاتصال بقاعدة البيانات
    pool = await connectToDatabase();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // قراءة البيانات المعالجة
    const dataPath = path.join(process.cwd(), '..', 'attached_assets', 'final_import_data.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const importData = JSON.parse(rawData);
    
    console.log(`📊 البيانات المراد استيرادها:`);
    console.log(`   البنود: ${importData.items.length}`);
    console.log(`   طلبات التسعير: ${Object.keys(importData.rfq_data).length}`);
    console.log(`   أوامر الشراء: ${Object.keys(importData.po_data).length}`);
    
    // مسح البيانات الحالية
    await clearAllData(pool);
    
    // إنشاء البيانات الأساسية
    await createBasicEntities(pool);
    
    // استيراد البنود
    const itemsImported = await importItems(pool, importData.items);
    
    // استيراد طلبات التسعير
    const rfqsImported = await importQuotationRequests(pool, importData.rfq_data);
    
    // استيراد أوامر الشراء
    const posImported = await importPurchaseOrders(pool, importData.po_data, importData.rfq_data);
    
    // قراءة البيانات الأصلية لربط البنود
    const originalDataPath = path.join(process.cwd(), '..', 'attached_assets', 'new_complete_data.json');
    const originalRawData = await fs.readFile(originalDataPath, 'utf8');
    const originalData = JSON.parse(originalRawData);
    
    // ربط البنود بطلبات التسعير
    await createItemLinks(pool, originalData.slice(0, 1000), importData.rfq_data); // أول 1000 سجل
    
    console.log('🎉 تم الانتهاء من الاستيراد الشامل بنجاح!');
    console.log(`📊 الإحصائيات النهائية:`);
    console.log(`   البنود المستوردة: ${itemsImported}`);
    console.log(`   طلبات التسعير المستوردة: ${rfqsImported}`);
    console.log(`   أوامر الشراء المستوردة: ${posImported}`);
    
  } catch (error) {
    console.error('❌ خطأ في عملية الاستيراد:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// تشغيل Script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as fullImportScript };