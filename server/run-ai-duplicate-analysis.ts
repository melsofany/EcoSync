import { eq, and, isNull } from "drizzle-orm";
import { db } from "./db.js";
import { items } from "../shared/schema.js";
import { analyzeItemsForDuplicates } from "./ai-duplicate-detector.js";

async function runAIDuplicateAnalysis() {
  try {
    console.log("🚀 بدء تحليل التكرارات باستخدام AI...");

    // جلب جميع البنود التي لم يتم تحليلها بعد
    const pendingItems = await db
      .select()
      .from(items)
      .where(eq(items.aiStatus, "pending"));

    console.log(`📊 تم العثور على ${pendingItems.length} صنف في انتظار التحليل`);

    if (pendingItems.length === 0) {
      console.log("✅ لا توجد بنود تحتاج للتحليل");
      return;
    }

    // تحويل البيانات إلى الشكل المطلوب للتحليل
    const itemsForAnalysis = pendingItems.map(item => ({
      id: item.id,
      serial_number: item.itemNumber,
      part_number: item.partNumber || "",
      line_item: item.lineItem || "",
      description: item.description,
      category: item.category || "",
      unit: item.unit
    }));

    // تشغيل تحليل AI
    const analysisResult = await analyzeItemsForDuplicates(itemsForAnalysis);

    console.log(`📈 نتائج التحليل:`);
    console.log(`   - إجمالي البنود: ${analysisResult.totalItems}`);
    console.log(`   - البنود الفريدة: ${analysisResult.uniqueItems}`);
    console.log(`   - مجموعات التكرار: ${analysisResult.duplicateGroups.length}`);

    let deletedCount = 0;
    let updatedCount = 0;

    // معالجة مجموعات التكرار
    for (const duplicateGroup of analysisResult.duplicateGroups) {
      console.log(`\n🔍 معالجة مجموعة تكرار:`);
      console.log(`   البند الرئيسي: ${duplicateGroup.masterItem.description}`);
      console.log(`   البنود المكررة: ${duplicateGroup.duplicates.length}`);

      // تحديث البند الرئيسي
      await db
        .update(items)
        .set({ 
          aiStatus: "verified",
          aiMatchedItemId: null
        })
        .where(eq(items.id, duplicateGroup.masterItem.id));
      
      updatedCount++;

      // حذف البنود المكررة
      for (const duplicate of duplicateGroup.duplicates) {
        console.log(`   🗑️ حذف البند المكرر: ${duplicate.serial_number}`);
        
        await db
          .delete(items)
          .where(eq(items.id, duplicate.id));
        
        deletedCount++;
      }
    }

    // تحديث البنود غير المكررة
    const uniqueItemIds = itemsForAnalysis
      .filter(item => !analysisResult.duplicateGroups.some(group => 
        group.duplicates.some(dup => dup.id === item.id)
      ))
      .map(item => item.id);

    if (uniqueItemIds.length > 0) {
      for (const itemId of uniqueItemIds) {
        await db
          .update(items)
          .set({ aiStatus: "verified" })
          .where(eq(items.id, itemId));
      }
      updatedCount += uniqueItemIds.length;
    }

    console.log(`\n✅ تم الانتهاء من التحليل:`);
    console.log(`   - تم حذف ${deletedCount} صنف مكرر`);
    console.log(`   - تم تحديث ${updatedCount} صنف`);
    
    // إحصائيات نهائية
    const remainingItems = await db.select().from(items);
    console.log(`   - إجمالي البنود المتبقية: ${remainingItems.length}`);

  } catch (error) {
    console.error("❌ خطأ في تحليل التكرارات:", error);
    throw error;
  }
}

// تشغيل التحليل
runAIDuplicateAnalysis().catch(console.error);