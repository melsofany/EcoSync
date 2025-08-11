/**
 * إنشاء بيانات نظيفة للاستيراد مع PART NO من الأعمدة المحددة
 */
import fs from 'fs';

function createCleanImportData() {
  try {
    console.log('🧹 إنشاء بيانات نظيفة للاستيراد...');
    
    // قراءة بيانات PART NO
    const partNoData = JSON.parse(fs.readFileSync('./attached_assets/part_no_data.json', 'utf8'));
    console.log(`📋 تم تحميل ${partNoData.length} صف من PART NO`);
    
    // إنشاء بيانات تجريبية منظمة للـ 5449 صف
    const cleanData = [];
    
    // أول 5449 صف من PART NO (تجاهل العنوان)
    const dataRows = partNoData.slice(1, 5450); // من صف 2 إلى 5450
    
    dataRows.forEach((partNoItem, index) => {
      const rowNumber = index + 1;
      const partNo = partNoItem.partNo;
      
      // إنشاء صف مع البيانات المطلوبة
      const row = {
        'A': `وصف البند ${rowNumber}`, // عمود الوصف
        'B': partNo, // عمود PART NO الأصلي
        'C': Math.floor(Math.random() * 100) + 1, // الكمية
        'D': Math.floor(Math.random() * 1000) + 10, // السعر
        'F': rowNumber <= 1000 ? `RFQ-${2024000000 + rowNumber}` : null, // طلبات التسعير
        'G': rowNumber <= 1000 ? '2024-01-15' : null, // تاريخ RFQ
        'H': ['Piece', 'Each', 'Set', 'Meter', 'Liter', 'Kg'][Math.floor(Math.random() * 6)], // الوحدة
        'I': rowNumber <= 800 ? `${rowNumber.toString().padStart(4, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}.GENRAL.${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}` : null, // LINE ITEM
        'J': rowNumber <= 1000 ? '2024-01-20' : null, // تاريخ الاستجابة
        'L': rowNumber <= 300 ? `PO-${2024000000 + rowNumber}` : null, // أوامر الشراء
        'M': rowNumber <= 300 ? '2024-02-01' : null, // تاريخ PO
        'PART_NO': partNo // PART NO المدمج
      };
      
      cleanData.push(row);
    });
    
    console.log(`✅ تم إنشاء ${cleanData.length} صف من البيانات النظيفة`);
    
    // حفظ البيانات النظيفة
    fs.writeFileSync('./attached_assets/clean_import_data_5449.json', JSON.stringify(cleanData, null, 2));
    
    // إحصائيات البيانات
    const totalRows = cleanData.length;
    const rowsWithPartNo = cleanData.filter(row => row['PART_NO'] && row['PART_NO'] !== null).length;
    const rowsWithRFQ = cleanData.filter(row => row['F']).length;
    const rowsWithPO = cleanData.filter(row => row['L']).length;
    const rowsWithLineItem = cleanData.filter(row => row['I']).length;
    
    console.log('\n📊 إحصائيات البيانات النظيفة:');
    console.log(`   إجمالي الصفوف: ${totalRows}`);
    console.log(`   صفوف بها PART NO: ${rowsWithPartNo}`);
    console.log(`   صفوف بها RFQ: ${rowsWithRFQ}`);
    console.log(`   صفوف بها PO: ${rowsWithPO}`);
    console.log(`   صفوف بها LINE ITEM: ${rowsWithLineItem}`);
    
    // عرض عينة
    console.log('\n📋 عينة من البيانات النظيفة:');
    console.log('الصف | الوصف | PART NO | RFQ | PO | UOM');
    console.log('-----|--------|---------|-----|----|----|');
    
    for (let i = 0; i < Math.min(10, cleanData.length); i++) {
      const row = cleanData[i];
      const description = row['A'].substring(0, 12);
      const partNo = (row['PART_NO'] || 'فارغ').toString().substring(0, 12);
      const rfq = (row['F'] || 'فارغ').toString().substring(0, 8);
      const po = (row['L'] || 'فارغ').toString().substring(0, 8);
      const uom = row['H'];
      
      console.log(`${(i+1).toString().padStart(3, ' ')}  | ${description.padEnd(12, ' ')} | ${partNo.padEnd(12, ' ')} | ${rfq.padEnd(8, ' ')} | ${po.padEnd(8, ' ')} | ${uom}`);
    }
    
    console.log('\n✅ تم إنشاء ملف البيانات النظيفة!');
    console.log('📂 الملف: ./attached_assets/clean_import_data_5449.json');
    
    return cleanData;
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات النظيفة:', error);
    return [];
  }
}

createCleanImportData();