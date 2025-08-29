// Script to debug why RFQ 25R000057 is not showing
import { google } from 'googleapis';

async function debugRFQ() {
  try {
    // Read credentials from local JSON file
    const fs = await import('fs');
    const credentialsFile = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const credentials = JSON.parse(credentialsFile);
    console.log('✅ تم تحميل المفتاح من الملف المحلي');
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // Read DATA sheet exactly as the system does
    console.log('\n📊 قراءة البيانات من DATA!A2:Z10000 (مثل النظام)...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A2:Z10000', // نفس النطاق المستخدم في النظام
    });

    const rows = response.data.values || [];
    console.log(`📋 تم قراءة ${rows.length} صف من ورقة DATA`);
    
    // Process data like the system does
    const quotationsMap = new Map();
    let rfq25R000057Items = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue; // Skip empty rows
      
      const rfqNumber = row[5] || ''; // Column F - RFQ NUMBER
      
      // Check if this is our target RFQ
      if (rfqNumber === '25R000057') {
        const item = {
          rowNumber: i + 2, // Actual row number in sheet
          itemNumber: row[0] || '', // Column A
          uom: row[1] || '', // Column B
          lineItem: row[2] || '', // Column C
          partNumber: row[3] || '', // Column D
          description: row[4] || '', // Column E
          rfqNumber: row[5] || '', // Column F
          requestDate: row[6] || '', // Column G
          quantity: row[7] || '', // Column H
          price: row[8] || '', // Column I
          responseDate: row[9] || '', // Column J
          poNumber: row[10] || '', // Column K
          poDate: row[11] || '', // Column L
          poQuantity: row[12] || '', // Column M
          poPrice: row[13] || '', // Column N
          totalValue: row[14] || '', // Column O
          clientName: row[15] || '', // Column P
          responsibleEmployee: row[16] || '', // Column Q
        };
        
        rfq25R000057Items.push(item);
        
        console.log(`\n✅ وجدت 25R000057 في الصف ${i + 2}:`);
        console.log(`  - LINE ITEM: ${item.lineItem}`);
        console.log(`  - اسم العميل: ${item.clientName}`);
        console.log(`  - التاريخ: ${item.requestDate}`);
        console.log(`  - الكمية: ${item.quantity}`);
      }
      
      // Process all RFQs (like system does)
      if (rfqNumber) {
        if (!quotationsMap.has(rfqNumber)) {
          quotationsMap.set(rfqNumber, {
            id: `rfq-sheets-${rfqNumber}`,
            requestNumber: rfqNumber,
            customRequestNumber: rfqNumber,
            clientName: row[15] && row[15].trim() && row[15].trim() !== '""' ? row[15].trim() : 'غير محدد',
            requestDate: row[6] || '',
            expiryDate: row[9] || null,
            responsibleEmployee: row[16] && row[16].trim() ? row[16].trim() : 'غير محدد',
            status: 'completed',
            notes: `طلب مستورد من Google Sheets`,
            totalItems: 0,
            totalValue: 0,
            items: [],
          });
        }
        
        const quotation = quotationsMap.get(rfqNumber);
        quotation.totalItems++;
      }
    }
    
    // Show results
    console.log('\n' + '='.repeat(60));
    console.log('📊 نتائج التحليل:');
    console.log('='.repeat(60));
    
    if (rfq25R000057Items.length > 0) {
      console.log(`\n✅ تم العثور على ${rfq25R000057Items.length} صنف للطلب 25R000057`);
      console.log('البيانات الكاملة:');
      rfq25R000057Items.forEach((item, index) => {
        console.log(`\nالصنف ${index + 1}:`);
        console.log(`  الصف في الشيت: ${item.rowNumber}`);
        console.log(`  رقم البند: ${item.itemNumber}`);
        console.log(`  LINE ITEM: ${item.lineItem}`);
        console.log(`  الوصف: ${item.description ? item.description.substring(0, 50) + '...' : 'فارغ'}`);
        console.log(`  اسم العميل: ${item.clientName || 'فارغ'}`);
        console.log(`  التاريخ: ${item.requestDate || 'فارغ'}`);
      });
      
      // Check if it's in the quotations map
      if (quotationsMap.has('25R000057')) {
        console.log('\n✅ الطلب موجود في قائمة الطلبات المعالجة');
        const quotation = quotationsMap.get('25R000057');
        console.log(`  - اسم العميل: ${quotation.clientName}`);
        console.log(`  - عدد الأصناف: ${quotation.totalItems}`);
      } else {
        console.log('\n❌ الطلب غير موجود في قائمة الطلبات المعالجة');
      }
    } else {
      console.log('\n❌ لم يتم العثور على الطلب 25R000057 في البيانات المقروءة');
    }
    
    // Show all unique RFQ numbers found
    const allRFQs = Array.from(quotationsMap.keys()).sort();
    console.log(`\n📋 إجمالي الطلبات الموجودة: ${allRFQs.length}`);
    
    // Show first 10 RFQs as sample
    console.log('\nعينة من أرقام الطلبات:');
    allRFQs.slice(0, 10).forEach(rfq => {
      const q = quotationsMap.get(rfq);
      console.log(`  - ${rfq}: ${q.clientName} (${q.totalItems} صنف)`);
    });
    
    // Check if 25R000057 is in the list
    if (allRFQs.includes('25R000057')) {
      console.log('\n✅ الطلب 25R000057 موجود في قائمة الطلبات');
      console.log(`موقعه في القائمة: ${allRFQs.indexOf('25R000057') + 1} من ${allRFQs.length}`);
    } else {
      console.log('\n❌ الطلب 25R000057 غير موجود في قائمة الطلبات');
      
      // Check for similar RFQ numbers
      const similar = allRFQs.filter(rfq => rfq.includes('25R00005'));
      if (similar.length > 0) {
        console.log('\nأرقام طلبات مشابهة:');
        similar.forEach(rfq => console.log(`  - ${rfq}`));
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ:', error);
    return false;
  }
}

// Run the debug
debugRFQ().then(success => {
  console.log('\n✨ انتهى التحليل');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ فشل:', error);
  process.exit(1);
});