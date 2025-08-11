import XLSX from 'xlsx';
import fs from 'fs';

// قراءة ملف الـ Excel لعمود التوصيف
function readDescriptionExcel() {
  try {
    const workbook = XLSX.readFile('./attached_assets/DES_1754930902255.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📊 أول 20 صف من عمود التوصيف:');
    console.log('الصف | التوصيف');
    console.log('-----|--------');
    
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      const description = row[0] || 'فارغ';
      console.log(`${(i+1).toString().padStart(3, ' ')}  | ${description.toString().substring(0, 60)}`);
    }
    
    console.log(`\n📋 إجمالي الصفوف: ${data.length}`);
    
    // حفظ البيانات في ملف JSON للمراجعة
    const descriptionData = data.map((row, index) => ({
      rowNumber: index + 1,
      description: row[0] || null
    }));
    
    fs.writeFileSync('./attached_assets/description_data.json', JSON.stringify(descriptionData, null, 2));
    console.log('✅ تم حفظ بيانات التوصيف في description_data.json');
    
    return descriptionData;
  } catch (error) {
    console.error('❌ خطأ في قراءة ملف Excel:', error);
    return [];
  }
}

readDescriptionExcel();