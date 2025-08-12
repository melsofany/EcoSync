import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

export function importCorrectExcel(): any {
  try {
    console.log('📊 استيراد الملف الصحيح...');
    
    // قراءة الملف
    const workbook = XLSX.readFile('./attached_assets/im (2)_1755001355247.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📋 إجمالي الصفوف: ${rawData.length} (تتضمن العناوين)`);
    
    // استخراج البيانات الفعلية (بدون العناوين)
    const dataRows = rawData.slice(1);
    
    const quotations: any[] = [];
    const purchaseOrders: any[] = [];
    const items: any[] = [];
    
    let totalRFQValue = 0;
    let totalPOValue = 0;
    
    // معالجة كل صف
    dataRows.forEach((row: any, index: number) => {
      if (!row || row.length === 0) return;
      
      const [
        uom,           // A: UOM
        lineItem,      // B: LINE ITEM  
        partNo,        // C: PART NO
        description,   // D: DESCREPTION
        rfqNumber,     // E: RFQ
        rfqDate,       // F: DATE/RFQ
        qty,           // G: QTY
        rfqPrice,      // H: PRICE/RFQ
        responseDate,  // I: RES. DATE
        poNumber,      // J: PO
        poDate,        // K: DATE /PO
        poQty,         // L: Quantity/PO
        poPrice,       // M: PRICE/PO
        column1        // N: Column1
      ] = row;
      
      // تحويل التواريخ
      const formatDate = (dateValue: any) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'number') {
          // Excel date serial number
          const date = new Date((dateValue - 25569) * 86400 * 1000);
          return date.toISOString().split('T')[0];
        }
        return String(dateValue);
      };
      
      // إنشاء صنف
      const item = {
        id: `item-${index + 1}`,
        lineItem: String(lineItem || ''),
        partNumber: String(partNo || ''),
        description: String(description || '').replace(/\r\n/g, ' '),
        uom: String(uom || ''),
        rfqNumber: String(rfqNumber || ''),
        rfqDate: formatDate(rfqDate),
        quantity: parseFloat(qty) || 0,
        rfqPrice: parseFloat(rfqPrice) || 0,
        responseDate: formatDate(responseDate),
        poNumber: String(poNumber || ''),
        poDate: formatDate(poDate),
        poQuantity: parseFloat(poQty) || 0,
        poPrice: parseFloat(poPrice) || 0,
        totalRFQValue: (parseFloat(qty) || 0) * (parseFloat(rfqPrice) || 0),
        totalPOValue: (parseFloat(poQty) || 0) * (parseFloat(poPrice) || 0)
      };
      
      items.push(item);
      
      // إضافة إلى إجمالي القيم
      totalRFQValue += item.totalRFQValue;
      totalPOValue += item.totalPOValue;
      
      // إنشاء طلب تسعير فريد
      if (rfqNumber && !quotations.find(q => q.rfqNumber === rfqNumber)) {
        quotations.push({
          id: `rfq-${rfqNumber}`,
          rfqNumber: String(rfqNumber),
          requestDate: formatDate(rfqDate),
          responseDate: formatDate(responseDate),
          status: responseDate ? 'completed' : 'pending',
          clientName: 'عميل غير محدد',
          totalValue: 0 // سيتم حسابه لاحقاً
        });
      }
      
      // إنشاء أمر شراء فريد
      if (poNumber && !purchaseOrders.find(p => p.poNumber === poNumber)) {
        purchaseOrders.push({
          id: `po-${poNumber}`,
          poNumber: String(poNumber),
          orderDate: formatDate(poDate),
          status: 'confirmed',
          supplierName: 'مورد غير محدد',
          currency: 'EGP',
          totalAmount: 0 // سيتم حسابه لاحقاً
        });
      }
    });
    
    // حساب القيم الإجمالية لكل طلب تسعير وأمر شراء
    quotations.forEach(rfq => {
      const rfqItems = items.filter(item => item.rfqNumber === rfq.rfqNumber);
      rfq.totalValue = rfqItems.reduce((sum, item) => sum + item.totalRFQValue, 0);
    });
    
    purchaseOrders.forEach(po => {
      const poItems = items.filter(item => item.poNumber === po.poNumber);
      po.totalAmount = poItems.reduce((sum, item) => sum + item.totalPOValue, 0);
    });
    
    // إحصائيات نهائية
    const statistics = {
      totalItems: items.length,
      totalRFQs: quotations.length,
      totalPOs: purchaseOrders.length,
      totalRFQValue: Math.round(totalRFQValue * 100) / 100,
      totalPOValue: Math.round(totalPOValue * 100) / 100,
      linkingRate: ((items.filter(item => item.rfqNumber && item.poNumber).length / items.length) * 100).toFixed(1)
    };
    
    const finalData = {
      items,
      quotations,
      purchaseOrders,
      statistics,
      timestamp: new Date().toISOString(),
      source: 'im (2)_1755001355247.xlsx'
    };
    
    // حفظ البيانات المستوردة
    writeFileSync('./attached_assets/correct_imported_data.json', JSON.stringify(finalData, null, 2));
    
    console.log('✅ تم الاستيراد بنجاح');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - الأصناف: ${statistics.totalItems}`);
    console.log(`   - طلبات التسعير: ${statistics.totalRFQs}`);
    console.log(`   - أوامر الشراء: ${statistics.totalPOs}`);
    console.log(`   - قيمة طلبات التسعير: ${statistics.totalRFQValue.toLocaleString()} جنيه`);
    console.log(`   - قيمة أوامر الشراء: ${statistics.totalPOValue.toLocaleString()} جنيه`);
    console.log(`   - معدل الربط: ${statistics.linkingRate}%`);
    
    return {
      success: true,
      message: 'تم استيراد البيانات الصحيحة بنجاح',
      data: finalData,
      summary: {
        totalItems: statistics.totalItems,
        uniqueRFQs: statistics.totalRFQs,
        uniquePOs: statistics.totalPOs,
        totalRFQValue: statistics.totalRFQValue,
        totalPOValue: statistics.totalPOValue,
        linkingRate: statistics.linkingRate + '%'
      }
    };
    
  } catch (error) {
    console.error('❌ خطأ في الاستيراد:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      message: 'فشل في استيراد البيانات'
    };
  }
}