import { eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { items } from "../shared/schema.js";

async function quickDuplicateCleanup() {
  try {
    console.log("🚀 تنظيف سريع للبنود المكررة...");

    // العثور على البنود المكررة حسب الوصف والحفاظ على الأقدم
    const duplicatesByDescription = await db.execute(sql`
      WITH ranked_items AS (
        SELECT 
          id,
          description,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY description ORDER BY created_at ASC) as rn
        FROM items
      )
      SELECT id, description
      FROM ranked_items 
      WHERE rn > 1
    `);

    console.log(`📊 تم العثور على ${duplicatesByDescription.rows.length} صنف مكرر حسب الوصف`);

    // حذف البنود المكررة حسب الوصف
    for (const row of duplicatesByDescription.rows) {
      await db.delete(items).where(eq(items.id, row.id as string));
      console.log(`🗑️ حذف صنف مكرر: ${row.description}`);
    }

    // العثور على البنود المكررة حسب رقم القطعة والحفاظ على الأقدم
    const duplicatesByPartNumber = await db.execute(sql`
      WITH ranked_items AS (
        SELECT 
          id,
          part_number,
          description,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY part_number ORDER BY created_at ASC) as rn
        FROM items
        WHERE part_number IS NOT NULL AND part_number != ''
      )
      SELECT id, part_number, description
      FROM ranked_items 
      WHERE rn > 1
    `);

    console.log(`📊 تم العثور على ${duplicatesByPartNumber.rows.length} صنف مكرر حسب رقم القطعة`);

    // حذف البنود المكررة حسب رقم القطعة
    for (const row of duplicatesByPartNumber.rows) {
      await db.delete(items).where(eq(items.id, row.id as string));
      console.log(`🗑️ حذف صنف مكرر برقم قطعة: ${row.part_number} - ${row.description}`);
    }

    // تحديث حالة AI للبنود المتبقية
    await db.update(items).set({ aiStatus: "verified" });

    // إحصائيات نهائية
    const remainingItems = await db.select().from(items);
    console.log(`\n✅ تم الانتهاء من التنظيف:`);
    console.log(`   - تم حذف ${duplicatesByDescription.rows.length + duplicatesByPartNumber.rows.length} صنف مكرر`);
    console.log(`   - إجمالي البنود المتبقية: ${remainingItems.length}`);

    // فحص إحصائيات جديدة
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT description) as unique_descriptions,
        COUNT(DISTINCT part_number) as unique_part_numbers
      FROM items
    `);

    console.log(`📈 إحصائيات جديدة:`);
    console.log(`   - إجمالي البنود: ${stats.rows[0].total_items}`);
    console.log(`   - أوصاف فريدة: ${stats.rows[0].unique_descriptions}`);
    console.log(`   - أرقام قطع فريدة: ${stats.rows[0].unique_part_numbers}`);

  } catch (error) {
    console.error("❌ خطأ في تنظيف التكرارات:", error);
    throw error;
  }
}

quickDuplicateCleanup().catch(console.error);