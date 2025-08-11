/**
 * عرض الأعمدة المتوفرة في البيانات بنفس الترتيب
 */
import fs from 'fs';

function showColumns() {
  try {
    console.log('📋 عرض الأعمدة المتوفرة في البيانات...');
    
    const authenticData = JSON.parse(fs.readFileSync('./attached_assets/authentic_import_data_5449.json', 'utf8'));
    console.log(`📊 إجمالي الصفوف: ${authenticData.length}`);
    
    // الحصول على الأعمدة من الصف الأول
    const firstRow = authenticData[0];
    const columns = Object.keys(firstRow);
    
    console.log('\n📂 الأعمدة المتوفرة بالترتيب:');
    console.log('==================================');
    
    columns.forEach((column, index) => {
      const value = firstRow[column];
      const sampleValue = value ? value.toString().substring(0, 30) : 'فارغ';
      console.log(`${(index + 1).toString().padStart(2, ' ')}. عمود ${column}: ${sampleValue}`);
    });
    
    // عرض عينة من البيانات مع قيم الأعمدة
    console.log('\n📋 عينة من البيانات (أول 5 صفوف):');
    console.log('==========================================');
    
    for (let i = 0; i < Math.min(5, authenticData.length); i++) {
      const row = authenticData[i];
      console.log(`\n🔸 الصف ${i + 1}:`);
      
      columns.forEach(column => {
        const value = row[column];
        const displayValue = value ? value.toString() : 'فارغ';
        console.log(`   ${column}: ${displayValue}`);
      });
    }
    
    // إحصائيات الأعمدة المليئة
    console.log('\n📊 إحصائيات الأعمدة:');
    console.log('====================');
    
    columns.forEach(column => {
      const filledRows = authenticData.filter(row => row[column] && row[column].toString().trim() !== '').length;
      const percentage = ((filledRows / authenticData.length) * 100).toFixed(1);
      console.log(`عمود ${column}: ${filledRows}/${authenticData.length} صف (${percentage}%)`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في عرض الأعمدة:', error);
  }
}

showColumns();