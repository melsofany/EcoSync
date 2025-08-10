import { unifyItemsWithAI } from './item-unification.js';

/**
 * مراقب عملية التوحيد مع تقارير مفصلة
 */
export async function runUnificationWithMonitoring(batchSize: number = 50): Promise<{
  totalItemsAnalyzed: number;
  itemsUnified: number;
  unificationGroups: any[];
  confidence: number;
  detailedReport: string[];
  timing: { startTime: Date; endTime: Date; duration: string };
}> {
  const startTime = new Date();
  console.log(`🚀 بدء توحيد البنود - ${startTime.toLocaleString('ar-EG')}`);
  console.log(`📊 حجم الدفعة: ${batchSize} بند`);
  
  const report: string[] = [];
  report.push(`🕐 بدء التوحيد: ${startTime.toLocaleString('ar-EG')}`);
  report.push(`📦 حجم الدفعة: ${batchSize} بند`);
  report.push('═══════════════════════════════════════');
  
  try {
    // تشغيل عملية التوحيد
    console.log('🔍 تحليل البنود بالذكاء الاصطناعي...');
    report.push('🔍 بدء تحليل البنود بالذكاء الاصطناعي...');
    
    const result = await unifyItemsWithAI(batchSize);
    
    const endTime = new Date();
    const duration = `${Math.round((endTime.getTime() - startTime.getTime()) / 1000)} ثانية`;
    
    // تقرير النتائج
    console.log(`✅ اكتمل التوحيد في ${duration}`);
    console.log(`📊 البنود المحللة: ${result.totalItemsAnalyzed}`);
    console.log(`🔄 البنود الموحدة: ${result.itemsUnified}`);
    console.log(`🎯 نسبة الثقة: ${result.confidence}%`);
    
    report.push('');
    report.push('📈 نتائج التوحيد:');
    report.push(`   • البنود المحللة: ${result.totalItemsAnalyzed}`);
    report.push(`   • البنود الموحدة: ${result.itemsUnified}`);
    report.push(`   • نسبة الثقة: ${result.confidence}%`);
    report.push(`   • مجموعات التوحيد: ${result.unificationGroups.length}`);
    report.push('');
    
    // تفاصيل كل مجموعة توحيد
    if (result.unificationGroups.length > 0) {
      console.log(`🔍 تفاصيل ${result.unificationGroups.length} مجموعة توحيد:`);
      report.push('🔍 تفاصيل مجموعات التوحيد:');
      
      result.unificationGroups.forEach((group, index) => {
        const groupInfo = `المجموعة ${index + 1}: ${group.reason} (${group.confidence}% ثقة)`;
        console.log(`   ${groupInfo}`);
        report.push(`   ${groupInfo}`);
        report.push(`      البند الرئيسي: ${group.masterItemId}`);
        report.push(`      البنود المدمجة: ${group.duplicateItemIds.length} بند`);
        report.push(`      التوصيف الموحد: ${group.unifiedDescription.substring(0, 80)}...`);
        if (group.unifiedPartNumber) {
          report.push(`      رقم القطعة: ${group.unifiedPartNumber}`);
        }
        report.push('');
      });
    }
    
    report.push('═══════════════════════════════════════');
    report.push(`🕐 انتهاء التوحيد: ${endTime.toLocaleString('ar-EG')}`);
    report.push(`⏱️ المدة الإجمالية: ${duration}`);
    
    return {
      ...result,
      detailedReport: report,
      timing: {
        startTime,
        endTime,
        duration
      }
    };
    
  } catch (error) {
    const endTime = new Date();
    const duration = `${Math.round((endTime.getTime() - startTime.getTime()) / 1000)} ثانية`;
    
    console.error('❌ خطأ في عملية التوحيد:', error);
    report.push('');
    report.push('❌ خطأ في العملية:');
    report.push(`   ${error.message}`);
    report.push(`🕐 وقت الخطأ: ${endTime.toLocaleString('ar-EG')}`);
    report.push(`⏱️ المدة قبل الخطأ: ${duration}`);
    
    throw {
      ...error,
      detailedReport: report,
      timing: {
        startTime,
        endTime,
        duration
      }
    };
  }
}

/**
 * تشغيل توحيد تدريجي مع مراقبة
 */
export async function runProgressiveUnification(totalLimit: number = 200): Promise<void> {
  const batchSize = 50;
  const batches = Math.ceil(totalLimit / batchSize);
  
  console.log(`🎯 بدء التوحيد التدريجي - ${batches} دفعة، ${batchSize} بند لكل دفعة`);
  
  let totalUnified = 0;
  let totalAnalyzed = 0;
  
  for (let i = 0; i < batches; i++) {
    console.log(`\n📦 الدفعة ${i + 1}/${batches}`);
    
    try {
      const result = await runUnificationWithMonitoring(batchSize);
      totalUnified += result.itemsUnified;
      totalAnalyzed += result.totalItemsAnalyzed;
      
      console.log(`✅ الدفعة ${i + 1} مكتملة - وحد ${result.itemsUnified} بند`);
      
      // تأخير بين الدفعات لتجنب تحميل النظام
      if (i < batches - 1) {
        console.log('⏳ انتظار 3 ثوان...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.error(`❌ خطأ في الدفعة ${i + 1}:`, error.message);
      break;
    }
  }
  
  console.log(`\n🎉 التوحيد التدريجي مكتمل:`);
  console.log(`   📊 إجمالي البنود المحللة: ${totalAnalyzed}`);
  console.log(`   🔄 إجمالي البنود الموحدة: ${totalUnified}`);
}