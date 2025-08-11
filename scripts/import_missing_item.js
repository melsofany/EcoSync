/**
 * استيراد البند المفقود 0666.001.GENRAL.0027 بشكل صحيح
 */
import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';

const sql = neon(process.env.DATABASE_URL);

async function importMissingItem() {
  try {
    console.log('🔍 استيراد البند المفقود 0666.001.GENRAL.0027...');
    
    // قراءة تحليل البند من الملف السابق
    const analysis = JSON.parse(fs.readFileSync('attached_assets/specific_item_analysis.json', 'utf8'));
    
    console.log(`📊 البيانات من ملف Excel:`);
    console.log(`   - إجمالي السجلات: ${analysis.matching_rows_count}`);
    console.log(`   - طلبات التسعير الفريدة: ${analysis.unique_rfqs.length}`);
    
    // 1. فحص آخر رقم بند مستخدم
    const lastItem = await sql(`
      SELECT item_number
      FROM items 
      WHERE item_number LIKE 'P-%'
      ORDER BY CAST(SUBSTRING(item_number, 3) AS INTEGER) DESC
      LIMIT 1
    `);
    
    const lastNumber = lastItem.length > 0 
      ? parseInt(lastItem[0].item_number.substring(2))
      : 0;
    
    const itemId = 'item-' + nanoid(10);
    const itemNumber = 'P-' + String(lastNumber + 1).padStart(6, '0');
    
    // الحصول على أول مستخدم موجود
    const user = await sql('SELECT id FROM users LIMIT 1');
    const userId = user.length > 0 ? user[0].id : null;
    
    const itemData = {
      id: itemId,
      itemNumber: itemNumber,
      kItemId: '0666.001.GENRAL.0027',
      description: 'البند المستورد من Excel - 0666.001.GENRAL.0027',
      partNumber: null,
      lineItem: null,
      unit: 'قطعة',
      category: 'عام',
      createdAt: new Date(),
      createdBy: userId
    };
    
    // إدراج البند الجديد
    await sql(`
      INSERT INTO items (
        id, item_number, k_item_id, description, part_number,
        line_item, unit, category, created_at, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
    `, [
      itemData.id, itemData.itemNumber, itemData.kItemId, 
      itemData.description, itemData.partNumber, itemData.lineItem,
      itemData.unit, itemData.category, itemData.createdAt, itemData.createdBy
    ]);
    
    console.log(`✅ تم إنشاء البند الجديد: ${itemNumber}`);
    
    // 2. ربط البند بطلبات التسعير الصحيحة
    let successCount = 0;
    let errorCount = 0;
    
    for (const rfqNumber of analysis.unique_rfqs) {
      try {
        // البحث عن طلب التسعير
        const quotationRequest = await sql(
          'SELECT id FROM quotation_requests WHERE request_number = $1 OR custom_request_number = $1',
          [rfqNumber]
        );
        
        if (quotationRequest.length > 0) {
          const quotationId = quotationRequest[0].id;
          const count = analysis.rfq_counts[rfqNumber] || 1;
          
          // إنشاء quotation_items للبند
          for (let i = 0; i < count; i++) {
            const quotationItemId = nanoid(10);
            await sql(`
              INSERT INTO quotation_items (
                id, quotation_id, item_id, quantity, unit_price
              ) VALUES (
                $1, $2, $3, 1, NULL
              )
            `, [quotationItemId, quotationId, itemId]);
          }
          
          console.log(`✅ ربط البند مع طلب التسعير ${rfqNumber} (${count} سجل)`);
          successCount++;
        } else {
          console.log(`⚠️ لم يتم العثور على طلب التسعير: ${rfqNumber}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ خطأ في ربط ${rfqNumber}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 النتائج:`);
    console.log(`   ✅ نجح: ${successCount} طلب تسعير`);
    console.log(`   ❌ فشل: ${errorCount} طلب تسعير`);
    
    // 3. التحقق من النتائج
    const verification = await sql(`
      SELECT 
        COUNT(qi.id) as total_quotation_items,
        COUNT(DISTINCT qi.quotation_id) as unique_quotations
      FROM quotation_items qi
      WHERE qi.item_id = $1
    `, [itemId]);
    
    console.log(`\n🎯 التحقق من النتائج:`);
    console.log(`   - إجمالي السجلات في قاعدة البيانات: ${verification[0].total_quotation_items}`);
    console.log(`   - طلبات التسعير الفريدة: ${verification[0].unique_quotations}`);
    console.log(`   - المتوقع من Excel: ${analysis.matching_rows_count} سجل`);
    console.log(`   - طلبات التسعير المتوقعة: ${analysis.unique_rfqs.length}`);
    
    const isCorrect = verification[0].total_quotation_items == analysis.matching_rows_count;
    console.log(`\n${isCorrect ? '✅' : '⚠️'} التطابق: ${isCorrect ? 'صحيح' : 'يحتاج مراجعة'}`);
    
    return {
      itemId,
      itemNumber,
      expectedCount: analysis.matching_rows_count,
      actualCount: verification[0].total_quotation_items,
      success: successCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    throw error;
  }
}

importMissingItem().then((result) => {
  console.log('\n🎯 اكتمل استيراد البند المفقود');
  console.log(`🆔 معرف البند الجديد: ${result.itemId}`);
  console.log(`🔢 رقم البند: ${result.itemNumber}`);
}).catch(console.error);