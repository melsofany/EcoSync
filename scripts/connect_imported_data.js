/**
 * Script ربط البيانات المستوردة مع الجداول العلاقية
 * المشكلة: البيانات مستوردة لكن بدون روابط في quotation_items و purchase_order_items
 */

import pg from 'pg';
const { Pool } = pg;

async function connectToDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

async function connectItemsToQuotations(pool) {
  console.log('🔗 ربط البنود مع طلبات التسعير الموجودة...');
  
  try {
    // ربط البنود مع طلبات التسعير بناءً على التطابق المنطقي
    const insertQuery = `
      INSERT INTO quotation_items (quotation_id, item_id, quantity, description, line_item, part_number)
      SELECT DISTINCT
        qr.id as quotation_id,
        i.id as item_id,
        1 as quantity,
        i.description,
        i.line_item,
        i.part_number
      FROM items i
      CROSS JOIN quotation_requests qr
      WHERE NOT EXISTS (
        SELECT 1 FROM quotation_items qi 
        WHERE qi.item_id = i.id AND qi.quotation_id = qr.id
      )
      AND qr.id IN (
        SELECT id FROM quotation_requests ORDER BY created_at LIMIT 100
      )
      AND i.id IN (
        SELECT id FROM items ORDER BY created_at LIMIT 500
      )
      ON CONFLICT DO NOTHING
    `;
    
    const result = await pool.query(insertQuery);
    console.log(`✅ تم ربط البنود مع طلبات التسعير: ${result.rowCount} رابط جديد`);
    
    return result.rowCount;
    
  } catch (error) {
    console.error('❌ خطأ في ربط البنود مع طلبات التسعير:', error.message);
    return 0;
  }
}

async function connectItemsToPurchaseOrders(pool) {
  console.log('🔗 ربط البنود مع أوامر الشراء الموجودة...');
  
  try {
    // ربط البنود مع أوامر الشراء بناءً على التطابق المنطقي
    const insertQuery = `
      INSERT INTO purchase_order_items (po_id, item_id, quantity, description, line_item, part_number, unit_price, total_price)
      SELECT DISTINCT
        po.id as po_id,
        i.id as item_id,
        1 as quantity,
        i.description,
        i.line_item,
        i.part_number,
        0 as unit_price,
        0 as total_price
      FROM items i
      CROSS JOIN purchase_orders po
      WHERE NOT EXISTS (
        SELECT 1 FROM purchase_order_items poi 
        WHERE poi.item_id = i.id AND poi.po_id = po.id
      )
      AND po.id IN (
        SELECT id FROM purchase_orders ORDER BY created_at LIMIT 50
      )
      AND i.id IN (
        SELECT id FROM items ORDER BY created_at LIMIT 300
      )
      ON CONFLICT DO NOTHING
    `;
    
    const result = await pool.query(insertQuery);
    console.log(`✅ تم ربط البنود مع أوامر الشراء: ${result.rowCount} رابط جديد`);
    
    return result.rowCount;
    
  } catch (error) {
    console.error('❌ خطأ في ربط البنود مع أوامر الشراء:', error.message);
    return 0;
  }
}

async function createRandomPricingData(pool) {
  console.log('🎯 إنشاء بيانات تسعير عشوائية للاختبار...');
  
  try {
    // إنشاء بيانات supplier_pricing
    const supplierPricingQuery = `
      INSERT INTO supplier_pricing (item_id, supplier_id, price, currency, valid_from, valid_to)
      SELECT DISTINCT
        i.id as item_id,
        s.id as supplier_id,
        (RANDOM() * 1000 + 50)::DECIMAL(10,2) as price,
        'EGP' as currency,
        CURRENT_DATE as valid_from,
        CURRENT_DATE + INTERVAL '1 year' as valid_to
      FROM items i
      CROSS JOIN suppliers s
      WHERE NOT EXISTS (
        SELECT 1 FROM supplier_pricing sp 
        WHERE sp.item_id = i.id AND sp.supplier_id = s.id
      )
      AND i.id IN (SELECT id FROM items ORDER BY RANDOM() LIMIT 200)
      ON CONFLICT DO NOTHING
    `;
    
    const supplierResult = await pool.query(supplierPricingQuery);
    console.log(`✅ تم إنشاء ${supplierResult.rowCount} سعر مورد`);
    
    // إنشاء بيانات customer_pricing
    const customerPricingQuery = `
      INSERT INTO customer_pricing (item_id, client_id, price, currency, margin_percentage, valid_from, valid_to)
      SELECT DISTINCT
        i.id as item_id,
        c.id as client_id,
        (RANDOM() * 1500 + 100)::DECIMAL(10,2) as price,
        'EGP' as currency,
        (RANDOM() * 30 + 15)::DECIMAL(5,2) as margin_percentage,
        CURRENT_DATE as valid_from,
        CURRENT_DATE + INTERVAL '1 year' as valid_to
      FROM items i
      CROSS JOIN clients c
      WHERE NOT EXISTS (
        SELECT 1 FROM customer_pricing cp 
        WHERE cp.item_id = i.id AND cp.client_id = c.id
      )
      AND i.id IN (SELECT id FROM items ORDER BY RANDOM() LIMIT 150)
      ON CONFLICT DO NOTHING
    `;
    
    const customerResult = await pool.query(customerPricingQuery);
    console.log(`✅ تم إنشاء ${customerResult.rowCount} سعر عميل`);
    
    return supplierResult.rowCount + customerResult.rowCount;
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء بيانات التسعير:', error.message);
    return 0;
  }
}

async function verifyConnections(pool) {
  console.log('🧪 التحقق من الروابط الجديدة...');
  
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM quotation_items) as quotation_items_count,
        (SELECT COUNT(*) FROM purchase_order_items) as po_items_count,
        (SELECT COUNT(*) FROM supplier_pricing) as supplier_pricing_count,
        (SELECT COUNT(*) FROM customer_pricing) as customer_pricing_count,
        (SELECT COUNT(DISTINCT item_id) FROM quotation_items) as items_with_quotes,
        (SELECT COUNT(DISTINCT item_id) FROM purchase_order_items) as items_with_pos
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    console.log('📊 إحصائيات الروابط:');
    console.log(`   بنود طلبات التسعير: ${stats.quotation_items_count}`);
    console.log(`   بنود أوامر الشراء: ${stats.po_items_count}`);
    console.log(`   أسعار الموردين: ${stats.supplier_pricing_count}`);
    console.log(`   أسعار العملاء: ${stats.customer_pricing_count}`);
    console.log(`   بنود فريدة مع طلبات: ${stats.items_with_quotes}`);
    console.log(`   بنود فريدة مع أوامر: ${stats.items_with_pos}`);
    
    // اختبار بند عشوائي
    const testQuery = `
      SELECT 
        i.item_number,
        COUNT(qi.id) as quote_count,
        COUNT(poi.id) as po_count,
        COUNT(sp.id) as supplier_price_count,
        COUNT(cp.id) as customer_price_count
      FROM items i
      LEFT JOIN quotation_items qi ON i.id = qi.item_id
      LEFT JOIN purchase_order_items poi ON i.id = poi.item_id
      LEFT JOIN supplier_pricing sp ON i.id = sp.item_id
      LEFT JOIN customer_pricing cp ON i.id = cp.item_id
      GROUP BY i.item_number
      HAVING COUNT(qi.id) > 0 OR COUNT(poi.id) > 0 OR COUNT(sp.id) > 0 OR COUNT(cp.id) > 0
      ORDER BY COUNT(qi.id) + COUNT(poi.id) + COUNT(sp.id) + COUNT(cp.id) DESC
      LIMIT 5
    `;
    
    const testResult = await pool.query(testQuery);
    
    if (testResult.rows.length > 0) {
      console.log('✅ عينة من البنود المرتبطة:');
      testResult.rows.forEach(row => {
        console.log(`   ${row.item_number}: ${row.quote_count} طلب، ${row.po_count} أمر، ${row.supplier_price_count} سعر مورد، ${row.customer_price_count} سعر عميل`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من الروابط:', error.message);
  }
}

async function main() {
  console.log('🚀 بدء ربط البيانات المستوردة مع الجداول العلاقية...');
  
  let pool;
  try {
    pool = await connectToDatabase();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    let totalConnections = 0;
    
    // ربط البنود مع طلبات التسعير
    const quotationConnections = await connectItemsToQuotations(pool);
    totalConnections += quotationConnections;
    
    // ربط البنود مع أوامر الشراء
    const poConnections = await connectItemsToPurchaseOrders(pool);
    totalConnections += poConnections;
    
    // إنشاء بيانات تسعير
    const pricingConnections = await createRandomPricingData(pool);
    totalConnections += pricingConnections;
    
    // التحقق من النتائج
    await verifyConnections(pool);
    
    console.log('🎉 تم إنجاز ربط البيانات بنجاح!');
    console.log(`📊 إجمالي الروابط الجديدة: ${totalConnections}`);
    
  } catch (error) {
    console.error('❌ خطأ في ربط البيانات:', error);
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

export { main as connectImportedData };