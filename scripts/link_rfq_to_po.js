/**
 * ربط طلبات التسعير مع أوامر الشراء المقابلة في قاعدة البيانات
 * بناءً على التحليل المستخرج من ملف الإكسل
 */
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function linkRfqToPo() {
  try {
    console.log('🔗 بدء ربط طلبات التسعير بأوامر الشراء...');
    
    // قراءة نتائج التحليل
    const analysisData = JSON.parse(fs.readFileSync('attached_assets/rfq_po_analysis.json', 'utf8'));
    
    console.log(`📊 إجمالي العلاقات المكتشفة: ${analysisData.relationships.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // ربط كل علاقة RFQ -> PO
    for (const relationship of analysisData.relationships) {
      try {
        const { rfq, po, rows, totalQuantity, zeroQuantityRows } = relationship;
        
        if (!rfq || !po || rfq === 'RFQ' || po === 'PO') continue;
        
        // البحث عن طلب التسعير
        const quotationRequest = await sql(
          'SELECT id FROM quotation_requests WHERE request_number = $1', 
          [rfq]
        );
        
        if (quotationRequest.length === 0) {
          console.log(`⚠️ لم يتم العثور على طلب التسعير: ${rfq}`);
          continue;
        }
        
        const quotationId = quotationRequest[0].id;
        
        // تحديث أو إنشاء أمر الشراء مع ربطه بطلب التسعير
        const existingPo = await sql(
          'SELECT id FROM purchase_orders WHERE po_number = $1',
          [po]
        );
        
        if (existingPo.length > 0) {
          // تحديث أمر الشراء الموجود
          await sql(
            'UPDATE purchase_orders SET quotation_id = $1, quotation_number = $2 WHERE po_number = $3',
            [quotationId, rfq, po]
          );
          console.log(`✅ تم ربط ${rfq} -> ${po} (موجود مسبقاً)`);
        } else {
          // إنشاء أمر شراء جديد
          const newPoId = `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await sql(
            `INSERT INTO purchase_orders (
              id, po_number, quotation_id, quotation_number, 
              po_date, status, total_value, delivery_status, 
              invoice_issued, created_at
            ) VALUES (
              $1, $2, $3, $4, NOW(), 'pending', 0, false, false, NOW()
            )`,
            [newPoId, po, quotationId, rfq]
          );
          console.log(`✅ تم إنشاء وربط ${rfq} -> ${po} (جديد)`);
        }
        
        successCount++;
        
        // تأخير قصير لتجنب تحميل قاعدة البيانات
        if (successCount % 50 === 0) {
          console.log(`📈 تم معالجة ${successCount} علاقة...`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        errorCount++;
        errors.push(`${relationship.rfq} -> ${relationship.po}: ${error.message}`);
        console.error(`❌ خطأ في ربط ${relationship.rfq} -> ${relationship.po}:`, error.message);
      }
    }
    
    console.log(`\n🎯 اكتملت عملية الربط:`);
    console.log(`   ✅ نجح: ${successCount}`);
    console.log(`   ❌ فشل: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️ الأخطاء:`);
      errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
      if (errors.length > 10) {
        console.log(`   ... و ${errors.length - 10} خطأ آخر`);
      }
    }
    
    // إحصائيات نهائية
    const finalStats = await sql(`
      SELECT 
        COUNT(*) as total_pos,
        COUNT(quotation_id) as linked_pos,
        COUNT(*) - COUNT(quotation_id) as unlinked_pos
      FROM purchase_orders
    `);
    
    console.log(`\n📊 الإحصائيات النهائية:`);
    console.log(`   - إجمالي أوامر الشراء: ${finalStats[0].total_pos}`);
    console.log(`   - مرتبطة بطلبات التسعير: ${finalStats[0].linked_pos}`);
    console.log(`   - غير مرتبطة: ${finalStats[0].unlinked_pos}`);
    
    return {
      success: successCount,
      errors: errorCount,
      errorDetails: errors,
      finalStats: finalStats[0]
    };
    
  } catch (error) {
    console.error('❌ خطأ عام في عملية الربط:', error);
    throw error;
  }
}

// تشغيل عملية الربط
linkRfqToPo().then((result) => {
  console.log('🏁 اكتملت عملية ربط RFQ مع PO بنجاح');
  process.exit(0);
}).catch((error) => {
  console.error('💥 فشلت عملية الربط:', error);
  process.exit(1);
});