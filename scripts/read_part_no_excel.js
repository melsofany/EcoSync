import XLSX from 'xlsx';
import fs from 'fs';

// قراءة ملف الـ Excel لعمود PART NO
function readPartNoExcel() {
  try {
    const workbook = XLSX.readFile('./attached_assets/PART NO_1754930159688.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📊 أول 20 صف من عمود PART NO:');
    console.log('الصف | PART NO');
    console.log('-----|--------');
    
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      const partNo = row[0] || 'فارغ'; // أول عمود
      console.log(`${(i+1).toString().padStart(3, ' ')}  | ${partNo}`);
    }
    
    console.log(`\n📋 إجمالي الصفوف: ${data.length}`);
    
    // حفظ البيانات في ملف JSON للمراجعة
    const partNoData = data.map((row, index) => ({
      rowNumber: index + 1,
      partNo: row[0] || null
    }));
    
    fs.writeFileSync('./attached_assets/part_no_data.json', JSON.stringify(partNoData, null, 2));
    console.log('✅ تم حفظ بيانات PART NO في part_no_data.json');
    
    return partNoData;
  } catch (error) {
    console.error('❌ خطأ في قراءة ملف Excel:', error);
    return [];
  }
}

readPartNoExcel();