// إصلاح ترتيب الأعمدة في البيانات المدمجة
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

// دمج البيانات بالترتيب الصحيح
const correctedData = [];
for (let i = 0; i < columnA.length; i++) {
  correctedData.push({
    UOM: columnA[i],                    // A = وحدة القياس
    LINE_ITEM: columnB[i],              // B = رقم البند
    PART_NO: columnC[i],                // C = رقم القطعة
    DESCRIPTION: columnD[i],            // D = الوصف
    RFQ_NUMBER: columnE[i],             // E = رقم طلب العرض
    REQUEST_DATE: columnF[i],           // F = تاريخ الطلب
    QUANTITY: columnG[i],               // G = الكمية
    PRICE: columnH[i],                  // H = السعر
    RESPONSE_DATE: columnI[i],          // I = تاريخ الاستجابة
    PO_NUMBER: columnJ[i],              // J = رقم أمر الشراء
    PO_DATE: columnK[i],                // K = تاريخ أمر الشراء
    PO_QUANTITY: columnL[i],            // L = كمية أمر الشراء
    PO_PRICE: columnM[i]                // M = سعر أمر الشراء
  });
}

// حفظ البيانات المصححة
fs.writeFileSync('./attached_assets/corrected_data_5449.json', JSON.stringify(correctedData, null, 2));

console.log('✅ تم إنشاء ملف البيانات المصحح: corrected_data_5449.json');
console.log('عرض أول 3 سجلات:');
console.log(JSON.stringify(correctedData.slice(0, 3), null, 2));