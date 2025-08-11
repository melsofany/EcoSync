/**
 * تحديث البيانات النظيفة لتشمل التوصيفات الحقيقية
 */
import fs from 'fs';

function updateDataWithDescriptions() {
  try {
    console.log('📝 تحديث البيانات بالتوصيفات الحقيقية...');
    
    // قراءة البيانات النظيفة الحالية
    const cleanData = JSON.parse(fs.readFileSync('./attached_assets/clean_import_data_5449.json', 'utf8'));
    console.log(`📋 البيانات الحالية: ${cleanData.length} صف`);
    
    // قراءة بيانات التوصيف
    const descriptionData = JSON.parse(fs.readFileSync('./attached_assets/description_data.json', 'utf8'));
    console.log(`📋 بيانات التوصيف: ${descriptionData.length} صف`);
    
    // تحديث البيانات بالتوصيفات الحقيقية
    const updatedData = cleanData.map((row, index) => {
      // العثور على التوصيف المقابل
      const descriptionItem = descriptionData.find(item => item.rowNumber === index + 1);
      const realDescription = descriptionItem ? descriptionItem.description : `وصف البند ${index + 1}`;
      
      return {
        ...row,
        'A': realDescription || `وصف البند ${index + 1}` // تحديث عمود الوصف
      };
    });
    
    console.log(`✅ تم تحديث ${updatedData.length} صف بالتوصيفات الحقيقية`);
    
    // حفظ البيانات المحدثة
    fs.writeFileSync('./attached_assets/final_import_data_5449.json', JSON.stringify(updatedData, null, 2));
    
    // إحصائيات التوصيفات
    const totalRows = updatedData.length;
    const rowsWithRealDesc = updatedData.filter(row => 
      row['A'] && !row['A'].startsWith('وصف البند')
    ).length;
    
    console.log('\n📊 إحصائيات التوصيفات:');
    console.log(`   إجمالي الصفوف: ${totalRows}`);
    console.log(`   صفوف بتوصيف حقيقي: ${rowsWithRealDesc}`);
    console.log(`   نسبة التغطية: ${((rowsWithRealDesc / totalRows) * 100).toFixed(1)}%`);
    
    // عرض عينة من التوصيفات المحدثة
    console.log('\n📋 عينة من التوصيفات المحدثة:');
    console.log('الصف | التوصيف | PART NO | RFQ | PO');
    console.log('-----|---------|---------|-----|----');
    
    for (let i = 0; i < Math.min(10, updatedData.length); i++) {
      const row = updatedData[i];
      const description = (row['A'] || '').substring(0, 25);
      const partNo = (row['PART_NO'] || 'فارغ').toString().substring(0, 12);
      const rfq = (row['F'] || 'فارغ').toString().substring(0, 8);
      const po = (row['L'] || 'فارغ').toString().substring(0, 8);
      
      console.log(`${(i+1).toString().padStart(3, ' ')}  | ${description.padEnd(25, ' ')} | ${partNo.padEnd(12, ' ')} | ${rfq.padEnd(8, ' ')} | ${po.padEnd(8, ' ')}`);
    }
    
    console.log('\n✅ تم إنشاء ملف البيانات النهائي!');
    console.log('📂 الملف: ./attached_assets/final_import_data_5449.json');
    
    return updatedData;
  } catch (error) {
    console.error('❌ خطأ في تحديث التوصيفات:', error);
    return [];
  }
}

updateDataWithDescriptions();