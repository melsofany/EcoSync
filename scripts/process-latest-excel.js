// استخراج البيانات من آخر ملف Excel مرسل
import XLSX from 'xlsx';
import fs from 'fs';

try {
  // قراءة آخر ملف Excel
  const latestExcelFile = './attached_assets/im (2)_1754942698217.xlsx';
  console.log('📄 معالجة الملف:', latestExcelFile);
  
  const workbook = XLSX.readFile(latestExcelFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // تحويل إلى JSON مع الحفاظ على الخلايا الفارغة
  const rawData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: null,
    raw: false
  });
  
  console.log(`📊 إجمالي الصفوف المقروءة: ${rawData.length}`);
  
  // تحديد نطاق البيانات الفعلية (تجاهل الصفوف الفارغة)
  const dataRows = rawData.filter(row => 
    row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
  );
  
  console.log(`📊 الصفوف التي تحتوي على بيانات: ${dataRows.length}`);
  
  // استخراج البيانات حسب الهيكل المطلوب
  const processedData = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    const record = {
      rowNumber: i + 1,
      // A - UOM (وحدة القياس)
      uom: row[0] || null,
      // B - LINE ITEM (رقم البند) 
      lineItem: row[1] || null,
      // C - PART NO (رقم القطعة)
      partNo: row[2] || null,
      // D - DESCRIPTION (الوصف)
      description: row[3] || null,
      // E - RFQ NUMBER (رقم طلب التسعير)
      rfq: {
        number: row[4] || null,
        // F - DATE/RFQ (تاريخ طلب التسعير)
        date: row[5] || null,
        // G - QTY OF RFQ (كمية طلب التسعير)
        quantity: row[6] || null,
        // H - PRICE OF RFQ (سعر طلب التسعير)
        price: row[7] || null,
        // I - RESPONSE DATE (تاريخ الاستجابة)
        responseDate: row[8] || null
      },
      // J, K, L, M - معلومات طلب الشراء
      po: {
        // J - PO NUMBER (رقم طلب الشراء)
        number: row[9] || null,
        // K - DATE OF PO (تاريخ طلب الشراء)
        date: row[10] || null,
        // L - QUANTITY OF PO (كمية طلب الشراء)
        quantity: row[11] || null,
        // M - PRICE OF PO (سعر طلب الشراء)
        price: row[12] || null
      },
      // حالة الربط
      linkStatus: {
        isLinked: !!(row[4] && row[9]), // هل مربوط RFQ → PO؟
        rfqToPo: (row[4] && row[9]) ? `${row[4]} → ${row[9]}` : null,
        hasCompleteFlow: !!(row[4] && row[5] && row[9] && row[10]) // دورة كاملة
      }
    };
    
    processedData.push(record);
  }
  
  // حفظ البيانات الجديدة
  const outputFile = './attached_assets/latest_excel_data_processed.json';
  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));
  
  // إحصائيات البيانات الجديدة
  const stats = {
    totalRecords: processedData.length,
    linkedRecords: processedData.filter(r => r.linkStatus.isLinked).length,
    completeFlowRecords: processedData.filter(r => r.linkStatus.hasCompleteFlow).length,
    uniqueRfqs: [...new Set(processedData.map(r => r.rfq.number).filter(Boolean))].length,
    uniquePos: [...new Set(processedData.map(r => r.po.number).filter(Boolean))].length
  };
  
  fs.writeFileSync('./attached_assets/latest_excel_statistics.json', JSON.stringify(stats, null, 2));
  
  console.log('\n✅ تم معالجة الملف الجديد بنجاح!');
  console.log(`📊 إجمالي السجلات: ${stats.totalRecords}`);
  console.log(`🔗 السجلات المربوطة: ${stats.linkedRecords} (${(stats.linkedRecords/stats.totalRecords*100).toFixed(1)}%)`);
  console.log(`⚡ دورة كاملة: ${stats.completeFlowRecords} (${(stats.completeFlowRecords/stats.totalRecords*100).toFixed(1)}%)`);
  console.log(`📋 طلبات تسعير فريدة: ${stats.uniqueRfqs}`);
  console.log(`🛒 طلبات شراء فريدة: ${stats.uniquePos}`);
  
  // عرض عينة من البيانات
  console.log('\n📋 عينة من البيانات:');
  console.log(JSON.stringify(processedData.slice(0, 3), null, 2));
  
} catch (error) {
  console.error('❌ خطأ في معالجة الملف:', error);
}