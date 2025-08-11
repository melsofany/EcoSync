// إنشاء البيانات بالهيكل المطلوب مع ربط طلبات الشراء بالتسعير
import fs from 'fs';

// قراءة البيانات من الملفات المنفصلة
const columnA = JSON.parse(fs.readFileSync('./attached_assets/column_A_UOM.json', 'utf8'));
const columnB = JSON.parse(fs.readFileSync('./attached_assets/column_B_LINE_ITEM.json', 'utf8'));
const columnC = JSON.parse(fs.readFileSync('./attached_assets/column_C_PART_NO.json', 'utf8'));
const columnD = JSON.parse(fs.readFileSync('./attached_assets/column_D_DESCRIPTION.json', 'utf8'));
const columnE = JSON.parse(fs.readFileSync('./attached_assets/column_E_RFQ_NUMBER.json', 'utf8'));
const columnF = JSON.parse(fs.readFileSync('./attached_assets/column_F_REQUEST_DATE.json', 'utf8'));
const columnG = JSON.parse(fs.readFileSync('./attached_assets/column_G_QUANTITY.json', 'utf8'));
const columnH = JSON.parse(fs.readFileSync('./attached_assets/column_H_PRICE.json', 'utf8'));
const columnI = JSON.parse(fs.readFileSync('./attached_assets/column_I_RESPONSE_DATE.json', 'utf8'));
const columnJ = JSON.parse(fs.readFileSync('./attached_assets/column_J_PO_NUMBER.json', 'utf8'));
const columnK = JSON.parse(fs.readFileSync('./attached_assets/column_K_PO_DATE.json', 'utf8'));
const columnL = JSON.parse(fs.readFileSync('./attached_assets/column_L_PO_QUANTITY.json', 'utf8'));
const columnM = JSON.parse(fs.readFileSync('./attached_assets/column_M_PO_PRICE.json', 'utf8'));

console.log('✅ تم تحميل جميع الأعمدة');
console.log(`إجمالي الصفوف: ${columnA.length}`);

// إنشاء البيانات المهيكلة مع ربط RFQ و PO
const structuredData = [];
const rfqToPoMapping = new Map(); // ربط طلبات التسعير بطلبات الشراء

for (let i = 0; i < columnA.length; i++) {
  const record = {
    // معلومات البند الأساسية
    rowNumber: i + 1,
    uom: columnA[i],                    // A - وحدة القياس
    lineItem: columnB[i],               // B - رقم البند
    partNo: columnC[i],                 // C - رقم القطعة
    description: columnD[i],            // D - الوصف
    
    // معلومات طلب التسعير (RFQ)
    rfq: {
      number: columnE[i],               // E - رقم طلب التسعير
      date: columnF[i],                 // F - تاريخ الطلب
      quantity: columnG[i],             // G - كمية طلب التسعير
      price: columnH[i],                // H - سعر طلب التسعير
      responseDate: columnI[i]          // I - تاريخ الاستجابة
    },
    
    // معلومات طلب الشراء (PO) - مربوط بالتسعير
    po: {
      number: columnJ[i],               // J - رقم طلب الشراء
      date: columnK[i],                 // K - تاريخ طلب الشراء
      quantity: columnL[i],             // L - كمية طلب الشراء
      price: columnM[i]                 // M - سعر طلب الشراء
    },
    
    // حالة الربط بين RFQ و PO
    linkStatus: {
      isLinked: !!(columnE[i] && columnJ[i]), // هل مربوط؟
      rfqToPo: columnE[i] && columnJ[i] ? `${columnE[i]} → ${columnJ[i]}` : null,
      hasCompleteFlow: !!(columnE[i] && columnF[i] && columnJ[i] && columnK[i]) // دورة كاملة
    }
  };
  
  structuredData.push(record);
  
  // إنشاء خريطة الربط
  if (columnE[i] && columnJ[i]) {
    if (!rfqToPoMapping.has(columnE[i])) {
      rfqToPoMapping.set(columnE[i], []);
    }
    rfqToPoMapping.get(columnE[i]).push({
      poNumber: columnJ[i],
      poDate: columnK[i],
      rowNumber: i + 1
    });
  }
}

// إحصائيات الربط
const linkingStats = {
  totalRecords: structuredData.length,
  linkedRecords: structuredData.filter(r => r.linkStatus.isLinked).length,
  completeFlowRecords: structuredData.filter(r => r.linkStatus.hasCompleteFlow).length,
  uniqueRfqs: rfqToPoMapping.size,
  rfqToPoMappings: Object.fromEntries(rfqToPoMapping)
};

console.log('📊 إحصائيات الربط:');
console.log(`- إجمالي السجلات: ${linkingStats.totalRecords}`);
console.log(`- السجلات المربوطة: ${linkingStats.linkedRecords}`);
console.log(`- سجلات الدورة الكاملة: ${linkingStats.completeFlowRecords}`);
console.log(`- طلبات تسعير فريدة: ${linkingStats.uniqueRfqs}`);

// حفظ البيانات المهيكلة
fs.writeFileSync('./attached_assets/structured_data_with_linking_5449.json', JSON.stringify(structuredData, null, 2));

// حفظ إحصائيات الربط
fs.writeFileSync('./attached_assets/linking_statistics.json', JSON.stringify(linkingStats, null, 2));

// عرض أمثلة من البيانات المهيكلة
console.log('\n📋 أمثلة من البيانات المهيكلة:');
console.log(JSON.stringify(structuredData.slice(0, 3), null, 2));

console.log('\n✅ تم إنشاء الملفات:');
console.log('- structured_data_with_linking_5449.json');
console.log('- linking_statistics.json');