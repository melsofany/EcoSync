import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

export function readNewExcelFile(): any {
  try {
    console.log('📊 قراءة ملف Excel الجديد...');
    
    // قراءة الملف
    const workbook = XLSX.readFile('./attached_assets/im (2)_1755001355247.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // تحويل إلى JSON مع الاحتفاظ بالعناوين
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📋 عدد الصفوف الإجمالي:', rawData.length);
    
    // أول 10 صفوف لفهم التركيب
    const firstRows = rawData.slice(0, 10);
    console.log('🔍 أول 10 صفوف:');
    firstRows.forEach((row: any, index: number) => {
      console.log(`صف ${index + 1}:`, row);
    });
    
    // تحليل العناوين
    const headers = rawData[0] as string[];
    console.log('📝 العناوين الموجودة:');
    headers.forEach((header: string, index: number) => {
      console.log(`عمود ${String.fromCharCode(65 + index)} (${index + 1}): "${header}"`);
    });
    
    // عينة من البيانات الفعلية
    const sampleData = rawData.slice(1, 6);
    console.log('📊 عينة من البيانات:');
    sampleData.forEach((row: any, index: number) => {
      console.log(`بيانات صف ${index + 2}:`, row);
    });
    
    // حفظ التحليل
    const analysis = {
      totalRows: rawData.length,
      headers: headers.map((header: string, index: number) => ({
        column: String.fromCharCode(65 + index),
        index: index + 1,
        name: header,
        type: typeof rawData[1]?.[index]
      })),
      sampleData: sampleData,
      timestamp: new Date().toISOString(),
      fileName: 'im (2)_1755001355247.xlsx'
    };
    
    writeFileSync('./attached_assets/new_excel_analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('✅ تم تحليل الملف بنجاح');
    
    return {
      success: true,
      message: 'تم تحليل الملف الجديد',
      data: analysis
    };
    
  } catch (error) {
    console.error('❌ خطأ في قراءة الملف:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      message: 'فشل في قراءة ملف Excel'
    };
  }
}