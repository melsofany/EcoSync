import { importQuotationsAndPOs } from './import-quotations-pos.js';

async function runImport() {
  console.log('🚀 بدء عملية الاستيراد الشاملة لطلبات التسعير وأوامر الشراء...');
  
  try {
    const result = await importQuotationsAndPOs();
    
    console.log('\n✅ نتائج الاستيراد:');
    console.log(`النجاح: ${result.success}`);
    console.log(`طلبات التسعير المُنشأة: ${result.quotationsCreated}`);
    console.log(`أوامر الشراء المُنشأة: ${result.purchaseOrdersCreated}`);
    console.log(`البنود المعالجة: ${result.itemsProcessed}`);
    console.log(`قيمة طلبات التسعير: ${result.totalRFQValue.toLocaleString()} جنيه`);
    console.log(`قيمة أوامر الشراء: ${result.totalPOValue.toLocaleString()} جنيه`);
    
    if (result.error) {
      console.log(`❌ خطأ: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاستيراد:', error);
  }
}

runImport();