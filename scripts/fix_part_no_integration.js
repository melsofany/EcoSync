/**
 * إصلاح دمج بيانات PART NO مع البيانات الأساسية
 */
import fs from 'fs';

function fixPartNoIntegration() {
  try {
    console.log('🔧 إصلاح دمج بيانات PART NO...');
    
    // تحقق من ملف البيانات الأساسي
    if (!fs.existsSync('./attached_assets/complete_excel_data.json')) {
      console.error('❌ ملف البيانات الأساسي غير موجود');
      return;
    }
    
    // قراءة البيانات الأساسية بحذر
    let excelData;
    try {
      const rawData = fs.readFileSync('./attached_assets/complete_excel_data.json', 'utf8');
      // تنظيف البيانات من أي أخطاء JSON
      const cleanData = rawData.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
      excelData = JSON.parse(cleanData);
    } catch (parseError) {
      console.error('❌ خطأ في قراءة البيانات الأساسية:', parseError.message);
      return;
    }
    
    console.log(`📋 البيانات الأساسية: ${excelData.length} صف`);
    
    // قراءة بيانات PART NO
    let partNoData;
    try {
      partNoData = JSON.parse(fs.readFileSync('./attached_assets/part_no_data.json', 'utf8'));
    } catch (parseError) {
      console.error('❌ خطأ في قراءة بيانات PART NO:', parseError.message);
      return;
    }
    
    console.log(`📋 بيانات PART NO: ${partNoData.length} صف`);
    
    // إنشاء خريطة PART NO للوصول السريع
    const partNoMap = {};
    partNoData.forEach(item => {
      if (item.rowNumber && item.rowNumber > 1) { // تجاهل العنوان
        partNoMap[item.rowNumber - 2] = item.partNo; // -2 لمطابقة الفهرسة
      }
    });
    
    // دمج البيانات بشكل آمن
    const mergedData = excelData.map((row, index) => {
      const partNo = partNoMap[index] || null;
      
      return {
        ...row,
        'PART_NO': partNo
      };
    });
    
    console.log(`✅ تم دمج البيانات: ${mergedData.length} صف`);
    
    // حفظ البيانات المدمجة
    fs.writeFileSync('./attached_assets/complete_data_with_part_no.json', JSON.stringify(mergedData, null, 2));
    
    // إحصائيات التطابق
    const totalRows = mergedData.length;
    const rowsWithPartNo = mergedData.filter(row => row['PART_NO'] && row['PART_NO'] !== null).length;
    const rowsWithoutPartNo = totalRows - rowsWithPartNo;
    
    console.log('\n📊 إحصائيات الدمج:');
    console.log(`   إجمالي الصفوف: ${totalRows}`);
    console.log(`   صفوف بها PART NO: ${rowsWithPartNo}`);
    console.log(`   صفوف بدون PART NO: ${rowsWithoutPartNo}`);
    console.log(`   نسبة التطابق: ${((rowsWithPartNo / totalRows) * 100).toFixed(1)}%`);
    
    // عرض عينة للتحقق
    console.log('\n📋 عينة من البيانات المدمجة:');
    console.log('الصف | الوصف | PART NO | RFQ | PO');
    console.log('-----|--------|---------|-----|----');
    
    for (let i = 0; i < Math.min(10, mergedData.length); i++) {
      const row = mergedData[i];
      const description = (row['A'] || '').toString().substring(0, 15);
      const partNo = (row['PART_NO'] || 'فارغ').toString().substring(0, 12);
      const rfq = row['F'] || 'فارغ';
      const po = row['L'] || 'فارغ';
      
      console.log(`${(i+1).toString().padStart(3, ' ')}  | ${description.padEnd(15, ' ')} | ${partNo.padEnd(12, ' ')} | ${rfq.toString().padEnd(8, ' ')} | ${po.toString().padEnd(8, ' ')}`);
    }
    
    console.log('\n✅ تم إنشاء ملف البيانات المدمج بنجاح!');
    console.log('📂 الملف: ./attached_assets/complete_data_with_part_no.json');
    
    return true;
  } catch (error) {
    console.error('❌ خطأ عام في العملية:', error);
    return false;
  }
}

fixPartNoIntegration();