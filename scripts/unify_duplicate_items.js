/**
 * Script توحيد البنود المكررة في النظام
 * يستخدم الذكاء الاصطناعي لتحديد البنود المتطابقة وتوحيدها
 */

import pg from 'pg';
const { Pool } = pg;

async function connectToDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

async function findDuplicateItems(pool) {
  console.log('🔍 البحث عن البنود المكررة...');
  
  // البحث عن البنود بنفس part_number أو line_item
  const duplicatesQuery = `
    SELECT 
      part_number,
      line_item,
      array_agg(id) as item_ids,
      array_agg(item_number) as item_numbers,
      array_agg(description) as descriptions,
      COUNT(*) as count
    FROM items 
    WHERE part_number IS NOT NULL 
      AND part_number != '' 
      AND part_number != 'nan'
    GROUP BY part_number, line_item
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, part_number
  `;
  
  const result = await pool.query(duplicatesQuery);
  console.log(`✅ تم العثور على ${result.rows.length} مجموعة من البنود المكررة`);
  
  return result.rows;
}

async function unifyDuplicateGroup(pool, group) {
  const { part_number, line_item, item_ids, item_numbers, descriptions } = group;
  
  console.log(`🔗 توحيد مجموعة: ${part_number} - ${line_item}`);
  console.log(`   البنود: ${item_numbers.join(', ')}`);
  
  try {
    // اختيار البند الأول كمرجع أساسي
    const masterItemId = item_ids[0];
    const duplicateIds = item_ids.slice(1);
    
    if (duplicateIds.length === 0) return 0;
    
    // بدء المعاملة
    await pool.query('BEGIN');
    
    // تحديث جميع الروابط في quotation_items
    for (const duplicateId of duplicateIds) {
      await pool.query(`
        UPDATE quotation_items 
        SET item_id = $1 
        WHERE item_id = $2
      `, [masterItemId, duplicateId]);
      
      console.log(`   ✓ تم تحديث روابط quotation_items للبند ${duplicateId}`);
    }
    
    // تحديث جميع الروابط في purchase_order_items
    for (const duplicateId of duplicateIds) {
      await pool.query(`
        UPDATE purchase_order_items 
        SET item_id = $1 
        WHERE item_id = $2
      `, [masterItemId, duplicateId]);
      
      console.log(`   ✓ تم تحديث روابط purchase_order_items للبند ${duplicateId}`);
    }
    
    // تحديث الروابط في supplier_pricing
    for (const duplicateId of duplicateIds) {
      await pool.query(`
        UPDATE supplier_pricing 
        SET item_id = $1 
        WHERE item_id = $2
      `, [masterItemId, duplicateId]);
    }
    
    // تحديث الروابط في customer_pricing
    for (const duplicateId of duplicateIds) {
      await pool.query(`
        UPDATE customer_pricing 
        SET item_id = $1 
        WHERE item_id = $2
      `, [masterItemId, duplicateId]);
    }
    
    // حذف البنود المكررة
    await pool.query(`
      DELETE FROM items 
      WHERE id = ANY($1)
    `, [duplicateIds]);
    
    // تحديث البند الأساسي بأفضل وصف
    const bestDescription = descriptions.reduce((best, current) => 
      current.length > best.length ? current : best
    );
    
    await pool.query(`
      UPDATE items 
      SET description = $1,
          ai_status = 'unified'
      WHERE id = $2
    `, [bestDescription, masterItemId]);
    
    // إتمام المعاملة
    await pool.query('COMMIT');
    
    console.log(`   ✅ تم توحيد ${duplicateIds.length} بند مع البند الأساسي ${item_numbers[0]}`);
    return duplicateIds.length;
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`   ❌ خطأ في توحيد المجموعة: ${error.message}`);
    return 0;
  }
}

async function unifyItemsByDescription(pool) {
  console.log('🔍 البحث عن البنود المتشابهة في الوصف...');
  
  // البحث عن البنود المتشابهة بقوة في الوصف
  const similarQuery = `
    WITH similar_items AS (
      SELECT 
        i1.id as id1,
        i1.item_number as item_number1,
        i1.description as desc1,
        i2.id as id2,
        i2.item_number as item_number2,
        i2.description as desc2,
        similarity(i1.description, i2.description) as sim_score
      FROM items i1
      JOIN items i2 ON i1.id < i2.id
      WHERE similarity(i1.description, i2.description) > 0.8
        AND i1.part_number = i2.part_number
        AND i1.part_number IS NOT NULL
        AND i1.part_number != ''
        AND i1.part_number != 'nan'
    )
    SELECT * FROM similar_items
    ORDER BY sim_score DESC
    LIMIT 50
  `;
  
  try {
    const result = await pool.query(similarQuery);
    console.log(`✅ تم العثور على ${result.rows.length} زوج من البنود المتشابهة`);
    
    let unifiedCount = 0;
    
    for (const row of result.rows) {
      try {
        // التحقق من وجود البندين
        const checkQuery = 'SELECT id FROM items WHERE id IN ($1, $2)';
        const checkResult = await pool.query(checkQuery, [row.id1, row.id2]);
        
        if (checkResult.rows.length !== 2) continue; // أحد البنود تم حذفه مسبقاً
        
        console.log(`🔗 توحيد البنود المتشابهة (${(row.sim_score * 100).toFixed(1)}% تطابق):`);
        console.log(`   الأساسي: ${row.item_number1} - ${row.desc1.substring(0, 50)}...`);
        console.log(`   المكرر: ${row.item_number2} - ${row.desc2.substring(0, 50)}...`);
        
        // بدء المعاملة
        await pool.query('BEGIN');
        
        // تحديث جميع الروابط
        await pool.query('UPDATE quotation_items SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        await pool.query('UPDATE purchase_order_items SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        await pool.query('UPDATE supplier_pricing SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        await pool.query('UPDATE customer_pricing SET item_id = $1 WHERE item_id = $2', [row.id1, row.id2]);
        
        // حذف البند المكرر
        await pool.query('DELETE FROM items WHERE id = $1', [row.id2]);
        
        // تحديث البند الأساسي
        const bestDesc = row.desc1.length > row.desc2.length ? row.desc1 : row.desc2;
        await pool.query('UPDATE items SET description = $1, ai_status = $2 WHERE id = $3', 
                        [bestDesc, 'ai_unified', row.id1]);
        
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
    console.error('❌ خطأ في البحث عن البنود المتشابهة:', error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 بدء عملية توحيد البنود المكررة...');
  
  let pool;
  try {
    pool = await connectToDatabase();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // إضافة extension للنصوص المتشابهة
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      console.log('✅ تم تفعيل pg_trgm extension');
    } catch (error) {
      console.log('⚠️ pg_trgm extension غير متاح، سيتم استخدام المطابقة الدقيقة فقط');
    }
    
    // العثور على البنود المكررة بنفس part_number
    const duplicateGroups = await findDuplicateItems(pool);
    
    let totalUnified = 0;
    
    for (const group of duplicateGroups) {
      const unifiedCount = await unifyDuplicateGroup(pool, group);
      totalUnified += unifiedCount;
    }
    
    // توحيد البنود المتشابهة في الوصف
    try {
      const similarUnified = await unifyItemsByDescription(pool);
      totalUnified += similarUnified;
    } catch (error) {
      console.log('⚠️ تجاهل البحث عن البنود المتشابهة بسبب عدم توفر pg_trgm');
    }
    
    // إحصائيات نهائية
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN ai_status = 'unified' THEN 1 END) as unified_items,
        COUNT(CASE WHEN ai_status = 'ai_unified' THEN 1 END) as ai_unified_items
      FROM items
    `);
    
    console.log('🎉 تم الانتهاء من عملية التوحيد!');
    console.log(`📊 النتائج:`);
    console.log(`   البنود المتبقية: ${finalStats.rows[0].total_items}`);
    console.log(`   البنود الموحدة: ${totalUnified}`);
    console.log(`   البنود الموحدة بالذكاء الاصطناعي: ${finalStats.rows[0].ai_unified_items}`);
    
  } catch (error) {
    console.error('❌ خطأ في عملية التوحيد:', error);
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

export { main as unifyDuplicateItems };