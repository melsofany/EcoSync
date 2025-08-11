/**
 * Script إصلاح الروابط بين البنود وطلبات التسعير وأوامر الشراء
 * المشكلة: البيانات مستوردة في الجداول الأساسية لكن بدون روابط في الجداول العلاقية
 */

import pg from 'pg';
const { Pool } = pg;

async function connectToDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

async function linkQuotationItems(pool) {
  console.log('🔗 ربط البنود مع طلبات التسعير...');
  
  // البحث عن البنود التي لها quotation_numbers لكن بدون روابط في quotation_items
  const unlinkItemsQuery = `
    SELECT DISTINCT
      i.id as item_id,
      i.item_number,
      i.part_number,
      i.line_item,
      i.description,
      qr.id as quotation_id,
      qr.request_number
    FROM items i
    JOIN quotation_requests qr ON i.quotation_number = qr.request_number
    WHERE NOT EXISTS (
      SELECT 1 FROM quotation_items qi 
      WHERE qi.item_id = i.id AND qi.quotation_id = qr.id
    )
    ORDER BY qr.request_number, i.item_number
    LIMIT 100
  `;
  
  try {
    const result = await pool.query(unlinkItemsQuery);
    console.log(`✅ تم العثور على ${result.rows.length} بند يحتاج ربط مع طلبات التسعير`);
    
    let linkedCount = 0;
    
    for (const row of result.rows) {
      try {
        // إدراج البند في quotation_items
        await pool.query(`
          INSERT INTO quotation_items (quotation_id, item_id, quantity, description, line_item, part_number)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [
          row.quotation_id,
          row.item_id,
          1, // كمية افتراضية
          row.description,
          row.line_item,
          row.part_number
        ]);
        
        linkedCount++;
        
        if (linkedCount % 50 === 0) {
          console.log(`   ✓ تم ربط ${linkedCount} بند...`);
        }
        
      } catch (error) {
        console.error(`   ❌ خطأ في ربط البند ${row.item_number}: ${error.message}`);
      }
    }
    
    console.log(`📊 تم ربط ${linkedCount} بند مع طلبات التسعير`);
    return linkedCount;
    
  } catch (error) {
    console.error('❌ خطأ في ربط البنود مع طلبات التسعير:', error.message);
    return 0;
  }
}

async function linkPurchaseOrderItems(pool) {
  console.log('🔗 ربط البنود مع أوامر الشراء...');
  
  // البحث عن البنود التي لها po_numbers لكن بدون روابط في purchase_order_items
  const unlinkItemsQuery = `
    SELECT DISTINCT
      i.id as item_id,
      i.item_number,
      i.part_number,
      i.line_item,
      i.description,
      po.id as po_id,
      po.po_number
    FROM items i
    JOIN purchase_orders po ON i.po_number = po.po_number
    WHERE NOT EXISTS (
      SELECT 1 FROM purchase_order_items poi 
      WHERE poi.item_id = i.id AND poi.po_id = po.id
    )
    ORDER BY po.po_number, i.item_number
    LIMIT 100
  `;
  
  try {
    const result = await pool.query(unlinkItemsQuery);
    console.log(`✅ تم العثور على ${result.rows.length} بند يحتاج ربط مع أوامر الشراء`);
    
    let linkedCount = 0;
    
    for (const row of result.rows) {
      try {
        // إدراج البند في purchase_order_items
        await pool.query(`
          INSERT INTO purchase_order_items (po_id, item_id, quantity, description, line_item, part_number, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          row.po_id,
          row.item_id,
          1, // كمية افتراضية
          row.description,
          row.line_item,
          row.part_number,
          0, // سعر افتراضي
          0  // إجمالي افتراضي
        ]);
        
        linkedCount++;
        
        if (linkedCount % 50 === 0) {
          console.log(`   ✓ تم ربط ${linkedCount} بند...`);
        }
        
      } catch (error) {
        console.error(`   ❌ خطأ في ربط البند ${row.item_number}: ${error.message}`);
      }
    }
    
    console.log(`📊 تم ربط ${linkedCount} بند مع أوامر الشراء`);
    return linkedCount;
    
  } catch (error) {
    console.error('❌ خطأ في ربط البنود مع أوامر الشراء:', error.message);
    return 0;
  }
}

async function createMissingColumns(pool) {
  console.log('🔧 التحقق من الأعمدة المطلوبة...');
  
  try {
    // إضافة أعمدة quotation_number و po_number للبنود إذا لم تكن موجودة
    await pool.query(`
      ALTER TABLE items 
      ADD COLUMN IF NOT EXISTS quotation_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS po_number VARCHAR(50)
    `);
    
    console.log('✅ تم التحقق من الأعمدة المطلوبة');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الأعمدة:', error.message);
  }
}

async function testItemConnections(pool) {
  console.log('🧪 اختبار الروابط للبنود...');
  
  try {
    // اختبار عينة من البنود
    const testQuery = `
      SELECT 
        i.item_number,
        COUNT(qi.id) as quotation_items_count,
        COUNT(poi.id) as po_items_count
      FROM items i
      LEFT JOIN quotation_items qi ON i.id = qi.item_id
      LEFT JOIN purchase_order_items poi ON i.id = poi.item_id
      GROUP BY i.item_number
      HAVING COUNT(qi.id) > 0 OR COUNT(poi.id) > 0
      ORDER BY COUNT(qi.id) + COUNT(poi.id) DESC
      LIMIT 10
    `;
    
    const result = await pool.query(testQuery);
    
    if (result.rows.length > 0) {
      console.log('✅ عينة من البنود المرتبطة:');
      result.rows.forEach(row => {
        console.log(`   ${row.item_number}: ${row.quotation_items_count} طلب تسعير، ${row.po_items_count} أمر شراء`);
      });
    } else {
      console.log('⚠️ لا توجد بنود مرتبطة بعد');
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار الروابط:', error.message);
  }
}

async function main() {
  console.log('🚀 بدء إصلاح الروابط بين البنود والطلبات...');
  
  let pool;
  try {
    pool = await connectToDatabase();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // إضافة الأعمدة المطلوبة
    await createMissingColumns(pool);
    
    // ربط البنود مع طلبات التسعير
    const quotationLinked = await linkQuotationItems(pool);
    
    // ربط البنود مع أوامر الشراء
    const poLinked = await linkPurchaseOrderItems(pool);
    
    // اختبار الروابط
    await testItemConnections(pool);
    
    // إحصائيات نهائية
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM quotation_items) as total_quotation_items,
        (SELECT COUNT(*) FROM purchase_order_items) as total_po_items,
        (SELECT COUNT(DISTINCT item_id) FROM quotation_items) as unique_items_with_quotes,
        (SELECT COUNT(DISTINCT item_id) FROM purchase_order_items) as unique_items_with_pos
    `);
    
    console.log('🎉 تم الانتهاء من إصلاح الروابط!');
    console.log(`📊 النتائج:`);
    console.log(`   بنود طلبات التسعير: ${finalStats.rows[0].total_quotation_items}`);
    console.log(`   بنود أوامر الشراء: ${finalStats.rows[0].total_po_items}`);
    console.log(`   بنود فريدة مع طلبات: ${finalStats.rows[0].unique_items_with_quotes}`);
    console.log(`   بنود فريدة مع أوامر: ${finalStats.rows[0].unique_items_with_pos}`);
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الروابط:', error);
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

export { main as fixItemRelationships };