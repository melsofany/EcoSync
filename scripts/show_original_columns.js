/**
 * عرض الأعمدة الأصلية من الملفات المرسلة فقط
 */
import fs from 'fs';

function showOriginalColumns() {
  try {
    console.log('🔍 البحث عن البيانات الأصلية المرسلة...');
    
    // البحث في الملفات المتاحة
    const files = [
      './attached_assets/complete_excel_data.json',
      './attached_assets/excel_data.json',
      './attached_assets/final_import_data.json',
      './attached_assets/processed_data.json'
    ];
    
    let originalData = null;
    let sourceFile = null;
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        try {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          if (data && Array.isArray(data) && data.length > 0) {
            originalData = data;
            sourceFile = file;
            console.log(`✅ تم العثور على البيانات في: ${file}`);
            break;
          }
        } catch (e) {
          console.log(`⚠️ خطأ في قراءة ${file}`);
        }
      }
    }
    
    if (!originalData) {
      console.log('❌ لم يتم العثور على بيانات أصلية');
      return;
    }
    
    console.log(`📊 المصدر: ${sourceFile}`);
    console.log(`📊 عدد الصفوف: ${originalData.length}`);
    
    // عرض الأعمدة الأصلية
    const firstRow = originalData[0];
    const originalColumns = Object.keys(firstRow);
    
    console.log('\n📂 الأعمدة الأصلية المرسلة:');
    console.log('===============================');
    
    originalColumns.forEach((column, index) => {
      const value = firstRow[column];
      const sampleValue = value ? value.toString().substring(0, 50) : 'فارغ';
      console.log(`${(index + 1).toString().padStart(2, ' ')}. عمود "${column}": ${sampleValue}`);
    });
    
    // عرض عينة من البيانات الأصلية
    console.log('\n📋 عينة من البيانات الأصلية (أول 3 صفوف):');
    console.log('===========================================');
    
    for (let i = 0; i < Math.min(3, originalData.length); i++) {
      const row = originalData[i];
      console.log(`\n🔸 الصف ${i + 1}:`);
      
      originalColumns.forEach(column => {
        const value = row[column];
        const displayValue = value ? value.toString().substring(0, 80) : 'فارغ';
        console.log(`   "${column}": ${displayValue}`);
      });
    }
    
    // إحصائيات سريعة للأعمدة الأصلية
    console.log('\n📊 إحصائيات الأعمدة الأصلية:');
    console.log('===============================');
    
    originalColumns.forEach(column => {
      const filledRows = originalData.filter(row => {
        const value = row[column];
        return value !== null && value !== undefined && value.toString().trim() !== '';
      }).length;
      
      const percentage = ((filledRows / originalData.length) * 100).toFixed(1);
      console.log(`"${column}": ${filledRows}/${originalData.length} صف (${percentage}%)`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في عرض الأعمدة الأصلية:', error);
  }
}

showOriginalColumns();