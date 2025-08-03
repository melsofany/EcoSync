import XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function extractCorrectRFQNumbers() {
  console.log('🔍 استخراج أرقام طلبات التسعير الصحيحة من العمود F...');
  
  try {
    // Read Excel file
    const filePath = join(process.cwd(), '..', 'attached_assets', 'DP DEV_1754185119345.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('عدد الصفوف:', data.length);
    console.log('أول 5 صفوف:');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      console.log(`الصف ${i + 1}:`, data[i]);
    }
    
    // Extract RFQ numbers from column F (index 5)
    const rfqNumbers = new Set();
    const rfqDetails = [];
    
    for (let i = 1; i < data.length; i++) { // Skip header
      const row = data[i] as any[];
      if (!row || row.length < 6) continue;
      
      const rfqNumber = row[5]; // Column F (0-indexed = 5)
      if (rfqNumber && typeof rfqNumber === 'string' && rfqNumber.trim()) {
        rfqNumbers.add(rfqNumber.trim());
        
        // Store additional details
        rfqDetails.push({
          row: i + 1,
          rfq_number: rfqNumber.trim(),
          column_a: row[0], // عادة يكون رقم الصف أو ID
          column_b: row[1], // قد يكون الوصف
          column_c: row[2], // قد يكون الكمية
          column_d: row[3], // قد يكون السعر
          column_e: row[4], // قد يكون تاريخ أو معلومة أخرى
          column_g: row[6], // العمود بعد رقم RFQ
          column_h: row[7], // معلومات إضافية
          full_row: row
        });
      }
    }
    
    console.log(`تم العثور على ${rfqNumbers.size} رقم طلب تسعير مختلف`);
    console.log('أول 10 أرقام طلبات تسعير:');
    Array.from(rfqNumbers).slice(0, 10).forEach(rfq => console.log(rfq));
    
    // Save extracted data
    const outputData = {
      total_unique_rfq: rfqNumbers.size,
      rfq_numbers: Array.from(rfqNumbers),
      sample_details: rfqDetails.slice(0, 20), // أول 20 صف كعينة
      extraction_info: {
        total_rows: data.length,
        column_f_used: true,
        extraction_date: new Date().toISOString()
      }
    };
    
    const outputPath = join(process.cwd(), '..', 'attached_assets', 'correct_rfq_numbers.json');
    writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
    
    console.log('✅ تم حفظ البيانات المُستخرجة في:', outputPath);
    
    return outputData;
    
  } catch (error) {
    console.error('خطأ في استخراج أرقام طلبات التسعير:', error);
    throw error;
  }
}

extractCorrectRFQNumbers();