import { db } from './db.js';
import { quotationRequests } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

/**
 * تحديث حالات طلبات التسعير المستوردة لتبدأ من "في الانتظار"
 * هذا يضمن أن جميع الطلبات تتبع نفس سير العمل
 */
export async function updateImportedQuotationsStatus() {
  try {
    console.log('🔄 بدء تحديث حالات طلبات التسعير المستوردة...');
    
    // البحث عن طلبات التسعير المستوردة (التي تحتوي على كلمة "مستورد" في الملاحظات)
    const importedQuotations = await db
      .select()
      .from(quotationRequests)
      .where(eq(quotationRequests.notes, 'مستورد من Excel'));
    
    console.log(`🔍 تم العثور على ${importedQuotations.length} طلب مستورد`);
    
    let updatedCount = 0;
    
    for (const quotation of importedQuotations) {
      // تحديث الحالة إلى "في الانتظار" إذا لم تكن كذلك
      if (quotation.status !== 'pending') {
        await db
          .update(quotationRequests)
          .set({ 
            status: 'pending',
            notes: `طلب مستورد من Excel - يتبع سير العمل الموحد: تسعير الموردين ← تسعير العملاء ← اكتمال`,
            updatedAt: new Date()
          })
          .where(eq(quotationRequests.id, quotation.id));
        
        updatedCount++;
        console.log(`✅ تم تحديث طلب التسعير ${quotation.requestNumber} إلى حالة "في الانتظار"`);
      }
    }
    
    console.log(`🎉 تم تحديث ${updatedCount} طلب تسعير بنجاح`);
    console.log('📋 جميع طلبات التسعير المستوردة تتبع الآن نفس سير العمل اليدوي');
    
    return {
      success: true,
      totalFound: importedQuotations.length,
      totalUpdated: updatedCount,
      message: `تم تحديث ${updatedCount} من أصل ${importedQuotations.length} طلب تسعير مستورد`
    };
    
  } catch (error) {
    console.error('❌ خطأ في تحديث طلبات التسعير المستوردة:', error);
    throw error;
  }
}

// إضافة endpoint لتشغيل التحديث من واجهة الإدارة
export async function createQuotationStatusUpdateEndpoint(app: any) {
  app.post('/api/admin/update-imported-quotations', async (req: any, res: any) => {
    try {
      // التحقق من صلاحيات المستخدم (IT Admin فقط)
      if (!req.user || !['it_admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'غير مسموح - يتطلب صلاحيات مدير أو IT' });
      }
      
      const result = await updateImportedQuotationsStatus();
      res.json(result);
      
    } catch (error) {
      console.error('خطأ في تحديث طلبات التسعير:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء التحديث' });
    }
  });
}