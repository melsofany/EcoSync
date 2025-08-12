import { writeFileSync } from 'fs';

export function clearAllData(): any {
  try {
    console.log('🧹 مسح جميع البيانات الخاطئة...');
    
    // إنشاء بيانات فارغة
    const emptyData = {
      quotations: [],
      purchaseOrders: [],
      items: [],
      statistics: {
        totalRFQs: 0,
        totalPOs: 0,
        totalItems: 0,
        totalValue: 0
      },
      timestamp: new Date().toISOString(),
      message: 'تم مسح جميع البيانات بناء على طلب المستخدم'
    };
    
    // حفظ البيانات الفارغة
    writeFileSync('./attached_assets/empty_data.json', JSON.stringify(emptyData, null, 2));
    
    console.log('✅ تم مسح جميع البيانات بنجاح');
    
    return {
      success: true,
      message: 'تم مسح جميع البيانات الخاطئة',
      data: emptyData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ خطأ في مسح البيانات:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      message: 'فشل في مسح البيانات'
    };
  }
}