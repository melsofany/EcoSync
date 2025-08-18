// Script to add RFQ 25R000057 to the quotations sheet
import { google } from 'googleapis';

async function addRFQToQuotations() {
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
    
    // First, get items for this RFQ from DATA sheet
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:O',
    });

    const dataRows = dataResponse.data.values || [];
    console.log(`📋 تم قراءة ${dataRows.length} صف من ورقة DATA`);
    
    // Find all items for RFQ 25R000057
    const rfqItems = [];
    for (let i = 1; i < dataRows.length; i++) {
      const rfqValue = dataRows[i][5]; // Column F - RFQ number
      if (rfqValue && rfqValue.includes('25R000057')) {
        rfqItems.push({
          row: i + 1,
          lineItem: dataRows[i][2] || '', // Column C
          partNumber: dataRows[i][2] || '', // Column C (using LINE ITEM as part number)
          description: dataRows[i][3] || '', // Column D
          uom: dataRows[i][4] || 'EACH', // Column E
          quantity: dataRows[i][7] || '1', // Column H
        });
      }
    }
    
    if (rfqItems.length === 0) {
      console.log('⚠️ لم يتم العثور على أصناف للطلب 25R000057');
      return false;
    }
    
    console.log(`✅ تم العثور على ${rfqItems.length} صنف للطلب 25R000057:`);
    rfqItems.forEach(item => {
      console.log(`  - ${item.lineItem}: ${item.description || 'بدون وصف'}`);
    });
    
    // Check if طلبات_التسعير sheet exists
    try {
      const sheetsInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title'
      });
      
      const sheetNames = sheetsInfo.data.sheets.map(s => s.properties.title);
      console.log(`\n📋 الأوراق الموجودة: ${sheetNames.join(', ')}`);
      
      // Find the quotations sheet (could be طلبات_التسعير or QUOTATIONS)
      let quotationsSheetName = null;
      if (sheetNames.includes('طلبات_التسعير')) {
        quotationsSheetName = 'طلبات_التسعير';
      } else if (sheetNames.includes('QUOTATIONS')) {
        quotationsSheetName = 'QUOTATIONS';
      } else {
        // Create new sheet
        console.log('📝 إنشاء ورقة طلبات_التسعير جديدة...');
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'طلبات_التسعير'
                }
              }
            }]
          }
        });
        
        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'طلبات_التسعير!A1:H1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'رقم الطلب',
              'التاريخ',
              'العميل',
              'عدد الأصناف',
              'الحالة',
              'المسؤول',
              'ملاحظات',
              'الأصناف'
            ]]
          }
        });
        
        quotationsSheetName = 'طلبات_التسعير';
        console.log('✅ تم إنشاء ورقة طلبات_التسعير');
      }
      
      // Check if RFQ already exists
      const quotationsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${quotationsSheetName}!A:A`,
      });
      
      const existingRFQs = quotationsResponse.data.values || [];
      const rfqExists = existingRFQs.some(row => row[0] === '25R000057');
      
      if (rfqExists) {
        console.log('⚠️ الطلب 25R000057 موجود بالفعل في ورقة طلبات_التسعير');
        return true;
      }
      
      // Add the RFQ to quotations sheet
      const today = new Date().toLocaleDateString('en-GB');
      const itemsJSON = JSON.stringify(rfqItems.map(item => ({
        partNumber: item.partNumber,
        description: item.description || 'CARRIER ITEM',
        quantity: item.quantity,
        unit: item.uom
      })));
      
      const newRow = [
        '25R000057', // رقم الطلب
        today, // التاريخ
        'CARRIER', // العميل (based on LINE ITEM)
        rfqItems.length.toString(), // عدد الأصناف
        'sent_for_pricing', // الحالة
        'admin', // المسؤول
        'طلب مضاف آلياً من DATA sheet', // ملاحظات
        itemsJSON // الأصناف كـ JSON
      ];
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${quotationsSheetName}!A:H`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [newRow]
        }
      });
      
      console.log('\n✅ تم إضافة الطلب 25R000057 إلى ورقة طلبات_التسعير بنجاح');
      console.log('📝 تفاصيل الطلب:');
      console.log(`  - رقم الطلب: 25R000057`);
      console.log(`  - العميل: CARRIER`);
      console.log(`  - عدد الأصناف: ${rfqItems.length}`);
      console.log(`  - الحالة: sent_for_pricing`);
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ في معالجة الأوراق:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الطلب:', error);
    return false;
  }
}

// Run the script
addRFQToQuotations().then(success => {
  if (success) {
    console.log('\n✨ اكتمل الإضافة - قم بتحديث الصفحة لرؤية الطلب 25R000057');
  } else {
    console.log('\n❌ فشل في إضافة الطلب');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ فشل:', error);
  process.exit(1);
});