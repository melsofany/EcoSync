/**
 * استخراج بيانات PART NO من الصورة المرفقة ودمجها مع البيانات الأساسية
 */
import fs from 'fs';

// قراءة البيانات الأساسية
function mergePartNoData() {
  try {
    console.log('📊 دمج بيانات PART NO مع البيانات الأساسية...');
    
    // قراءة البيانات الأساسية من Excel
    const excelData = JSON.parse(fs.readFileSync('./attached_assets/complete_excel_data.json', 'utf8'));
    console.log(`📋 البيانات الأساسية: ${excelData.length} صف`);
    
    // قراءة بيانات PART NO من الملف المستخرج سابقاً
    const partNoData = JSON.parse(fs.readFileSync('./attached_assets/part_no_data.json', 'utf8'));
    console.log(`📋 بيانات PART NO: ${partNoData.length} صف`);
    
    // دمج البيانات - إضافة عمود PART NO للبيانات الأساسية
    const mergedData = excelData.map((row, index) => {
      // البحث عن PART NO المقابل لهذا الصف
      const partNoItem = partNoData.find(item => item.rowNumber === index + 2); // +2 لأن الصف الأول عنوان
      
      return {
        ...row,
        'PART_NO': partNoItem ? partNoItem.partNo : null // إضافة عمود PART NO
      };
    });
    
    console.log(`✅ تم دمج البيانات: ${mergedData.length} صف`);
    
    // حفظ البيانات المدمجة
    fs.writeFileSync('./attached_assets/complete_data_with_part_no.json', JSON.stringify(mergedData, null, 2));
    
    // عرض عينة من البيانات المدمجة
    console.log('\n📋 عينة من البيانات المدمجة:');
    console.log('الصف | الوصف | PART NO | LINE ITEM | UOM');
    console.log('-----|--------|---------|-----------|----');
    
    for (let i = 0; i < Math.min(10, mergedData.length); i++) {
      const row = mergedData[i];
      const description = (row['A'] || '').substring(0, 20);
      const partNo = row['PART_NO'] || 'فارغ';
      const lineItem = (row['I'] || 'فارغ').toString().substring(0, 15);
      const uom = row['H'] || 'فارغ';
      
      console.log(`${(i+1).toString().padStart(3, ' ')}  | ${description.padEnd(20, ' ')} | ${partNo.toString().padEnd(15, ' ')} | ${lineItem.padEnd(15, ' ')} | ${uom}`);
    }
    
    // إحصائيات PART NO
    const totalRows = mergedData.length;
    const rowsWithPartNo = mergedData.filter(row => row['PART_NO'] && row['PART_NO'] !== null).length;
    const rowsWithoutPartNo = totalRows - rowsWithPartNo;
    
    console.log('\n📊 إحصائيات PART NO:');
    console.log(`   إجمالي الصفوف: ${totalRows}`);
    console.log(`   صفوف بها PART NO: ${rowsWithPartNo}`);
    console.log(`   صفوف بدون PART NO: ${rowsWithoutPartNo}`);
    console.log(`   نسبة التغطية: ${((rowsWithPartNo / totalRows) * 100).toFixed(1)}%`);
    
    return mergedData;
  } catch (error) {
    console.error('❌ خطأ في دمج البيانات:', error);
    return [];
  }
}

mergePartNoData();