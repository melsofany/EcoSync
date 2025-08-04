import { eq, sql, and } from "drizzle-orm";
import { db } from "./db.js";
import { items, quotationItems, purchaseOrderItems } from "../shared/schema.js";

async function smartDuplicateCleanup() {
  try {
    console.log("🚀 تنظيف ذكي للبنود المكررة مع حفظ الإشارات...");

    // البحث عن مجموعات البنود المكررة حسب الوصف
    const duplicateGroups = await db.execute(sql`
      WITH duplicate_groups AS (
        SELECT 
          description,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', id,
              'item_number', item_number,
              'created_at', created_at
            ) ORDER BY created_at ASC
          ) as items
        FROM items
        GROUP BY description
        HAVING COUNT(*) > 1
      )
      SELECT description, items FROM duplicate_groups
    `);

    console.log(`📊 تم العثور على ${duplicateGroups.rows.length} مجموعة مكررة`);

    let totalDeleted = 0;
    let totalMoved = 0;

    for (const group of duplicateGroups.rows) {
      const groupItems = group.items as any[];
      const masterItem = groupItems[0]; // البند الأقدم
      const duplicateItems = groupItems.slice(1); // البقية

      console.log(`\n🔍 معالجة مجموعة: ${group.description}`);
      console.log(`   البند الرئيسي: ${masterItem.item_number}`);
      console.log(`   البنود المكررة: ${duplicateItems.length}`);

      // نقل جميع الإشارات من البنود المكررة إلى البند الرئيسي
      for (const duplicateItem of duplicateItems) {
        // نقل إشارات quotation_items
        const quotationItemsToMove = await db
          .select()
          .from(quotationItems)
          .where(eq(quotationItems.itemId, duplicateItem.id));

        for (const quotationItem of quotationItemsToMove) {
          // تحقق من عدم وجود إشارة مكررة للبند الرئيسي في نفس التسعيرة
          const existingRef = await db
            .select()
            .from(quotationItems)
            .where(
              and(
                eq(quotationItems.quotationId, quotationItem.quotationId),
                eq(quotationItems.itemId, masterItem.id)
              )
            );

          if (existingRef.length === 0) {
            // نقل الإشارة إلى البند الرئيسي
            await db
              .update(quotationItems)
              .set({ itemId: masterItem.id })
              .where(eq(quotationItems.id, quotationItem.id));
            totalMoved++;
          } else {
            // إذا كانت الإشارة موجودة، احذف المكررة
            await db
              .delete(quotationItems)
              .where(eq(quotationItems.id, quotationItem.id));
          }
        }

        // نقل إشارات purchase_order_items
        const poItemsToMove = await db
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.itemId, duplicateItem.id));

        for (const poItem of poItemsToMove) {
          // تحقق من عدم وجود إشارة مكررة للبند الرئيسي في نفس أمر الشراء
          const existingRef = await db
            .select()
            .from(purchaseOrderItems)
            .where(
              and(
                eq(purchaseOrderItems.poId, poItem.poId),
                eq(purchaseOrderItems.itemId, masterItem.id)
              )
            );

          if (existingRef.length === 0) {
            // نقل الإشارة إلى البند الرئيسي
            await db
              .update(purchaseOrderItems)
              .set({ itemId: masterItem.id })
              .where(eq(purchaseOrderItems.id, poItem.id));
            totalMoved++;
          } else {
            // إذا كانت الإشارة موجودة، احذف المكررة
            await db
              .delete(purchaseOrderItems)
              .where(eq(purchaseOrderItems.id, poItem.id));
          }
        }

        // الآن يمكن حذف البند المكرر بأمان
        await db.delete(items).where(eq(items.id, duplicateItem.id));
        console.log(`   🗑️ حذف البند المكرر: ${duplicateItem.item_number}`);
        totalDeleted++;
      }
    }

    // البحث عن مجموعات البنود المكررة حسب رقم القطعة
    const duplicateByPartNumber = await db.execute(sql`
      WITH duplicate_groups AS (
        SELECT 
          part_number,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', id,
              'item_number', item_number,
              'created_at', created_at,
              'description', description
            ) ORDER BY created_at ASC
          ) as items
        FROM items
        WHERE part_number IS NOT NULL AND part_number != ''
        GROUP BY part_number
        HAVING COUNT(*) > 1
      )
      SELECT part_number, items FROM duplicate_groups
    `);

    console.log(`\n📊 تم العثور على ${duplicateByPartNumber.rows.length} مجموعة مكررة حسب رقم القطعة`);

    for (const group of duplicateByPartNumber.rows) {
      const groupItems = group.items as any[];
      const masterItem = groupItems[0]; // البند الأقدم
      const duplicateItems = groupItems.slice(1); // البقية

      console.log(`\n🔍 معالجة مجموعة برقم قطعة: ${group.part_number}`);
      console.log(`   البند الرئيسي: ${masterItem.item_number} - ${masterItem.description}`);
      console.log(`   البنود المكررة: ${duplicateItems.length}`);

      // نقل جميع الإشارات من البنود المكررة إلى البند الرئيسي
      for (const duplicateItem of duplicateItems) {
        // نقل إشارات quotation_items
        const quotationItemsToMove = await db
          .select()
          .from(quotationItems)
          .where(eq(quotationItems.itemId, duplicateItem.id));

        for (const quotationItem of quotationItemsToMove) {
          const existingRef = await db
            .select()
            .from(quotationItems)
            .where(
              and(
                eq(quotationItems.quotationId, quotationItem.quotationId),
                eq(quotationItems.itemId, masterItem.id)
              )
            );

          if (existingRef.length === 0) {
            await db
              .update(quotationItems)
              .set({ itemId: masterItem.id })
              .where(eq(quotationItems.id, quotationItem.id));
            totalMoved++;
          } else {
            await db
              .delete(quotationItems)
              .where(eq(quotationItems.id, quotationItem.id));
          }
        }

        // نقل إشارات purchase_order_items
        const poItemsToMove = await db
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.itemId, duplicateItem.id));

        for (const poItem of poItemsToMove) {
          const existingRef = await db
            .select()
            .from(purchaseOrderItems)
            .where(
              and(
                eq(purchaseOrderItems.poId, poItem.poId),
                eq(purchaseOrderItems.itemId, masterItem.id)
              )
            );

          if (existingRef.length === 0) {
            await db
              .update(purchaseOrderItems)
              .set({ itemId: masterItem.id })
              .where(eq(purchaseOrderItems.id, poItem.id));
            totalMoved++;
          } else {
            await db
              .delete(purchaseOrderItems)
              .where(eq(purchaseOrderItems.id, poItem.id));
          }
        }

        // حذف البند المكرر
        await db.delete(items).where(eq(items.id, duplicateItem.id));
        console.log(`   🗑️ حذف البند المكرر: ${duplicateItem.item_number} - ${duplicateItem.description}`);
        totalDeleted++;
      }
    }

    // تحديث حالة AI للبنود المتبقية
    await db.update(items).set({ aiStatus: "verified" });

    // إحصائيات نهائية
    const remainingItems = await db.select().from(items);
    const finalStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT description) as unique_descriptions,
        COUNT(DISTINCT part_number) as unique_part_numbers
      FROM items
    `);

    console.log(`\n✅ تم الانتهاء من التنظيف الذكي:`);
    console.log(`   - تم حذف ${totalDeleted} صنف مكرر`);
    console.log(`   - تم نقل ${totalMoved} إشارة`);
    console.log(`   - إجمالي البنود المتبقية: ${remainingItems.length}`);
    console.log(`\n📈 إحصائيات نهائية:`);
    console.log(`   - إجمالي البنود: ${finalStats.rows[0].total_items}`);
    console.log(`   - أوصاف فريدة: ${finalStats.rows[0].unique_descriptions}`);
    console.log(`   - أرقام قطع فريدة: ${finalStats.rows[0].unique_part_numbers}`);

  } catch (error) {
    console.error("❌ خطأ في التنظيف الذكي:", error);
    throw error;
  }
}

smartDuplicateCleanup().catch(console.error);