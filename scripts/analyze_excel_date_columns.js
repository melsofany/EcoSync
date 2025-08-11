/**
 * تحليل أعمدة التواريخ في ملف Excel
 */
import fs from 'fs';

async function analyzeExcelDates() {
  console.log('🔍 تحليل أعمدة التواريخ في ملف Excel...');
  
  try {
    const rawData = fs.readFileSync('attached_assets/complete_excel_data.json', 'utf8');
    const cleanData = rawData.replace(/NaN/g, 'null');
    const data = JSON.parse(cleanData);
    const dataArray = data.DATA || data;
    
    console.log(`📋 إجمالي الصفوف: ${dataArray.length}`);
    
    // تحليل أول 5 صفوف لفهم هيكل البيانات
    console.log('\n📊 تحليل أول 5 صفوف:');
    for (let i = 0; i < Math.min(5, dataArray.length); i++) {
      const row = dataArray[i];
      console.log(`\nالصف ${i + 1}:`);
      
      // إظهار جميع الأعمدة مع قيمها
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (value && typeof value === 'string' && (
          value.includes('/') || 
          value.includes('-') || 
          value.match(/\d{4}/) ||
          key.toLowerCase().includes('date') ||
          key.toLowerCase().includes('تاريخ')
        )) {
          console.log(`  ${key}: ${value} (محتمل تاريخ)`);
        } else if (value) {
          console.log(`  ${key}: ${value}`);
        }
      });
    }
    
    // البحث عن أعمدة التواريخ
    console.log('\n🗓️ البحث عن أعمدة التواريخ:');
    const allColumns = new Set();
    const dateColumns = new Set();
    
    dataArray.slice(0, 100).forEach(row => {
      Object.keys(row).forEach(key => {
        allColumns.add(key);
        const value = row[key];
        
        if (value && typeof value === 'string') {
          // تحقق من تنسيقات التاريخ المختلفة
          if (
            value.includes('/') ||
            value.includes('-') ||
            value.match(/\d{1,2}\/\d{1,2}\/\d{4}/) ||
            value.match(/\d{4}-\d{2}-\d{2}/) ||
            value.match(/\d{1,2}-\d{1,2}-\d{4}/) ||
            key.toLowerCase().includes('date') ||
            key.toLowerCase().includes('تاريخ')
          ) {
            dateColumns.add(key);
          }
        }
      });
    });
    
    console.log('\n📋 جميع الأعمدة:');
    Array.from(allColumns).sort().forEach(col => {
      console.log(`  - ${col}`);
    });
    
    console.log('\n🗓️ أعمدة التواريخ المحتملة:');
    Array.from(dateColumns).forEach(col => {
      console.log(`  ✓ ${col}`);
      
      // إظهار عينة من القيم
      const sampleValues = dataArray.slice(0, 20)
        .map(row => row[col])
        .filter(val => val && val !== 'null')
        .slice(0, 5);
      
      console.log(`    عينة القيم: ${sampleValues.join(', ')}`);
    });
    
    // تحليل أعمدة معينة قد تحتوي على تواريخ
    const potentialDateColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
    console.log('\n🔍 تحليل الأعمدة A-N للبحث عن تواريخ:');
    
    potentialDateColumns.forEach(col => {
      const unnamedCol = `Unnamed: ${potentialDateColumns.indexOf(col)}`;
      const colData = dataArray.slice(0, 20)
        .map(row => row[unnamedCol] || row[col])
        .filter(val => val && val !== 'null')
        .slice(0, 5);
      
      if (colData.length > 0) {
        console.log(`  العمود ${col} (${unnamedCol}): ${colData.join(' | ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ خطأ في تحليل التواريخ:', error);
  }
}

analyzeExcelDates();