/**
 * Script التوحيد المتقدم للبنود المكررة
 * يستهدف البنود المتبقية التي لم يتم توحيدها في المرحلة الأولى
 */

import pg from 'pg';
const { Pool } = pg;

async function connectToDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

async function unifyByPartNumber(pool) {
  console.log('🔧 توحيد البنود بنفس part_number...');
  
  // الحصول على البنود المكررة بنفس part_number
  const duplicatesQuery = `
    SELECT 
      part_number,
      array_agg(id ORDER BY created_at) as item_ids,
      array_agg(item_number ORDER BY created_at) as item_numbers,
      array_agg(description ORDER BY LENGTH(description) DESC) as descriptions,
      COUNT(*) as count
    FROM items 
    WHERE part_number IS NOT NULL 
      AND part_number != '' 
      AND part_number != 'nan'
      AND LENGTH(part_number) > 2
    GROUP BY part_number
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `;
  
  const result = await pool.query(duplicatesQuery);
  console.log(`✅ تم العثور على ${result.rows.length} مجموعة مكررة بالـ part_number`);
  
  let totalUnified = 0;
  
  for (const group of result.rows) {
    try {
      const { part_number, item_ids, item_numbers, descriptions } = group;
      const masterItemId = item_ids[0]; // أول بند (الأقدم)
      const duplicateIds = item_ids.slice(1);
      
      if (duplicateIds.length === 0) continue;
      
      console.log(`🔗 توحيد ${part_number}: ${item_numbers.join(' + ')} → ${item_numbers[0]}`);
      
      await pool.query('BEGIN');
      
      // تحديث جميع الروابط
      for (const duplicateId of duplicateIds) {
        await pool.query('UPDATE quotation_items SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
        await pool.query('UPDATE purchase_order_items SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
        await pool.query('UPDATE supplier_pricing SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
        await pool.query('UPDATE customer_pricing SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
      }
      
      // اختيار أفضل وصف (الأطول والأكثر تفصيلاً)
      const bestDescription = descriptions[0];
      
      // تحديث البند الأساسي
      await pool.query(`
        UPDATE items 
        SET description = $1, ai_status = 'advanced_unified'
        WHERE id = $2
      `, [bestDescription, masterItemId]);
      
      // حذف البنود المكررة
      await pool.query('DELETE FROM items WHERE id = ANY($1)', [duplicateIds]);
      
      await pool.query('COMMIT');
      totalUnified += duplicateIds.length;
      
      console.log(`   ✅ تم توحيد ${duplicateIds.length} بند`);
      
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`   ❌ خطأ في التوحيد: ${error.message}`);
    }
  }
  
  return totalUnified;
}

async function unifyByLineItem(pool) {
  console.log('🔧 توحيد البنود بنفس line_item...');
  
  const duplicatesQuery = `
    SELECT 
      line_item,
      array_agg(id ORDER BY created_at) as item_ids,
      array_agg(item_number ORDER BY created_at) as item_numbers,
      array_agg(part_number) as part_numbers,
      array_agg(description ORDER BY LENGTH(description) DESC) as descriptions,
      COUNT(*) as count
    FROM items 
    WHERE line_item IS NOT NULL 
      AND line_item != '' 
      AND line_item != 'nan'
    GROUP BY line_item
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 30
  `;
  
  const result = await pool.query(duplicatesQuery);
  console.log(`✅ تم العثور على ${result.rows.length} مجموعة مكررة بالـ line_item`);
  
  let totalUnified = 0;
  
  for (const group of result.rows) {
    try {
      const { line_item, item_ids, item_numbers, part_numbers, descriptions } = group;
      const masterItemId = item_ids[0];
      const duplicateIds = item_ids.slice(1);
      
      if (duplicateIds.length === 0) continue;
      
      console.log(`🔗 توحيد ${line_item}: ${item_numbers.slice(0,3).join(' + ')}${item_numbers.length > 3 ? '...' : ''} → ${item_numbers[0]}`);
      
      await pool.query('BEGIN');
      
      // تحديث جميع الروابط
      for (const duplicateId of duplicateIds) {
        await pool.query('UPDATE quotation_items SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
        await pool.query('UPDATE purchase_order_items SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
        await pool.query('UPDATE supplier_pricing SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
        await pool.query('UPDATE customer_pricing SET item_id = $1 WHERE item_id = $2', [masterItemId, duplicateId]);
      }
      
      // اختيار أفضل part_number وأفضل وصف
      const bestPartNumber = part_numbers.find(pn => pn && pn !== '' && pn !== 'nan') || '';
      const bestDescription = descriptions[0];
      
      // تحديث البند الأساسي
      await pool.query(`
        UPDATE items 
        SET part_number = $1, description = $2, ai_status = 'line_unified'
        WHERE id = $3
      `, [bestPartNumber, bestDescription, masterItemId]);
      
      // حذف البنود المكررة
      await pool.query('DELETE FROM items WHERE id = ANY($1)', [duplicateIds]);
      
      await pool.query('COMMIT');
      totalUnified += duplicateIds.length;
      
      console.log(`   ✅ تم توحيد ${duplicateIds.length} بند`);
      
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`   ❌ خطأ في التوحيد: ${error.message}`);
    }
  }
  
  return totalUnified;
}

async function unifyByDescriptionSimilarity(pool) {
  console.log('🔧 توحيد البنود المتشابهة في الوصف...');
  
  // البحث عن البنود المتشابهة بقوة في الوصف مع نفس line_item أو part_number
  const similarQuery = `
    WITH similar_pairs AS (
      SELECT DISTINCT
        i1.id as id1,
        i1.item_number as num1,
        i1.description as desc1,
        i2.id as id2,
        i2.item_number as num2,
        i2.description as desc2,
        CASE 
          WHEN i1.part_number = i2.part_number AND i1.part_number != '' THEN 0.95
          WHEN i1.line_item = i2.line_item AND i1.line_item != '' THEN 0.90
          ELSE similarity(i1.description, i2.description)
        END as sim_score
      FROM items i1
      JOIN items i2 ON i1.id < i2.id
      WHERE (
        (i1.part_number = i2.part_number AND i1.part_number != '' AND i1.part_number != 'nan')
        OR (i1.line_item = i2.line_item AND i1.line_item != '' AND i1.line_item != 'nan')
        OR similarity(i1.description, i2.description) > 0.85
      )
      AND LENGTH(i1.description) > 10
      AND LENGTH(i2.description) > 10
    )
    SELECT * FROM similar_pairs
    WHERE sim_score > 0.85
    ORDER BY sim_score DESC
    LIMIT 100
  `;
  
  try {
    const result = await pool.query(similarQuery);
    console.log(`✅ تم العثور على ${result.rows.length} زوج من البنود المتشابهة`);
    
    let unifiedCount = 0;
    
    for (const row of result.rows) {
      try {
        // التحقق من وجود البندين
        const checkResult = await pool.query('SELECT id FROM items WHERE id IN ($1, $2)', [row.id1, row.id2]);
        if (checkResult.rows.length !== 2) continue;
        
        console.log(`🔗 توحيد متشابه (${(row.sim_score * 100).toFixed(1)}%): ${row.num1} + ${row.num2} → ${row.num1}`);
        
        await pool.query('BEGIN');
        
        // تحديث جميع الروابط
        await pool.query('UPDATE quotation_items SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        await pool.query('UPDATE purchase_order_items SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        await pool.query('UPDATE supplier_pricing SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        await pool.query('UPDATE customer_pricing SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        
        // اختيار أفضل وصف
        const bestDesc = row.desc1.length > row.desc2.length ? row.desc1 : row.desc2;
        
        // تحديث البند الأساسي
        await pool.query('UPDATE items SET description = $1, ai_status = $2 WHERE id = $3', 
                        [bestDesc, 'similarity_unified', row.id1]);
        
        // حذف البند المكرر
        await pool.query('DELETE FROM items WHERE id = $1', [row.id2]);
        
        await pool.query('COMMIT');
        unifiedCount++;
        
        console.log(`   ✅ تم التوحيد بنجاح`);
        
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`   ❌ خطأ في التوحيد: ${error.message}`);
      }
    }
    
    return unifiedCount;
    
  } catch (error) {
    console.error('⚠️ تجاهل البحث المتشابه بسبب عدم توفر pg_trgm');
    return 0;
  }
}

async function main() {
  console.log('🚀 بدء التوحيد المتقدم للبنود المكررة المتبقية...');
  
  let pool;
  try {
    pool = await connectToDatabase();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // إضافة extension للنصوص المتشابهة
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    } catch (error) {
      console.log('⚠️ pg_trgm extension غير متاح');
    }
    
    let totalUnified = 0;
    
    // المرحلة 1: توحيد بناءً على part_number
    const unifiedByPart = await unifyByPartNumber(pool);
    totalUnified += unifiedByPart;
    console.log(`📊 المرحلة 1: تم توحيد ${unifiedByPart} بند بناءً على part_number`);
    
    // المرحلة 2: توحيد بناءً على line_item
    const unifiedByLine = await unifyByLineItem(pool);
    totalUnified += unifiedByLine;
    console.log(`📊 المرحلة 2: تم توحيد ${unifiedByLine} بند بناءً على line_item`);
    
    // المرحلة 3: توحيد بناءً على التشابه في الوصف
    const unifiedBySimilarity = await unifyByDescriptionSimilarity(pool);
    totalUnified += unifiedBySimilarity;
    console.log(`📊 المرحلة 3: تم توحيد ${unifiedBySimilarity} بند بناءً على التشابه`);
    
    // إحصائيات نهائية
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN ai_status LIKE '%unified%' THEN 1 END) as unified_items
      FROM items
    `);
    
    console.log('🎉 تم الانتهاء من التوحيد المتقدم!');
    console.log(`📊 النتائج:`);
    console.log(`   إجمالي البنود المتبقية: ${finalStats.rows[0].total_items}`);
    console.log(`   البنود الموحدة في هذه الجولة: ${totalUnified}`);
    console.log(`   إجمالي البنود الموحدة: ${finalStats.rows[0].unified_items}`);
    
  } catch (error) {
    console.error('❌ خطأ في التوحيد المتقدم:', error);
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

export { main as advancedUnification };