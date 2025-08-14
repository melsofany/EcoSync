import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import { sheets_v4, google } from 'googleapis';

export async function createDataSheet(): Promise<any> {
  try {
    console.log('📊 إنشاء صفحة DATA مع معرف البند...');
    
    // تحميل البيانات النهائية
    const finalData = JSON.parse(readFileSync('./attached_assets/final_correct_data.json', 'utf8'));
    
    // إعداد المصادقة
    console.log('🔑 قراءة مفتاح الخدمة من الملف...');
    const keyFile = readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const serviceAccountKey = JSON.parse(keyFile);
    console.log('✅ تم تحليل مفتاح الخدمة بنجاح');
    
    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    console.log('🔗 الاتصال بـ Google Sheets...');
    
    // التحقق من وجود صفحة DATA وتحديثها أو إنشاؤها
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingDataSheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'DATA');
    
    if (existingDataSheet) {
      console.log('📋 صفحة DATA موجودة، سيتم تحديث البيانات...');
      // مسح البيانات الموجودة
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'DATA!A:Z'
      });
    } else {
      console.log('📋 إنشاء صفحة DATA جديدة...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'DATA',
                gridProperties: {
                  rowCount: 6000,
                  columnCount: 15
                }
              }
            }
          }]
        }
      });
    }
    
    console.log('📋 تحضير البيانات مع معرف البند...');
    
    // إنشاء البيانات مع معرف البند في العمود A
    const dataHeader = [
      'معرف البند',        // A: Item ID
      'رقم الصنف',        // B: LINE ITEM  
      'رقم القطعة',       // C: PART NO
      'الوصف',           // D: DESCRIPTION
      'الوحدة',          // E: UOM
      'رقم طلب التسعير',  // F: RFQ NUMBER
      'تاريخ RFQ',       // G: RFQ DATE
      'كمية RFQ',        // H: RFQ QTY
      'سعر RFQ',         // I: RFQ PRICE
      'رقم أمر الشراء',   // J: PO NUMBER
      'تاريخ PO',        // K: PO DATE
      'كمية PO',         // L: PO QTY
      'سعر PO',          // M: PO PRICE
      'قيمة PO'          // N: PO VALUE
    ];
    
    // إنشاء البيانات مع معرف فريد لكل بند
    const dataRows = finalData.items.map((item: any, index: number) => [
      `P-${String(index + 1).padStart(7, '0')}`, // A: معرف البند P-0000001
      item.lineItem,                              // B: رقم الصنف
      item.partNumber,                            // C: رقم القطعة
      item.description,                           // D: الوصف
      item.uom,                                   // E: الوحدة
      item.rfqNumber,                             // F: رقم طلب التسعير
      item.rfqDate,                               // G: تاريخ RFQ
      item.quantity,                              // H: كمية RFQ
      item.rfqPrice,                              // I: سعر RFQ
      item.poNumber,                              // J: رقم أمر الشراء
      item.poDate,                                // K: تاريخ PO
      item.poQuantity,                            // L: كمية PO
      item.poPrice,                               // M: سعر PO
      item.totalPOValue                           // N: قيمة PO
    ]);
    
    const completeData = [dataHeader, ...dataRows];
    
    console.log('📤 رفع البيانات إلى صفحة DATA...');
    
    // رفع البيانات على دفعات
    const batchSize = 1000;
    for (let i = 0; i < completeData.length; i += batchSize) {
      const batch = completeData.slice(i, i + batchSize);
      const startRow = i + 1;
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `DATA!A${startRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: batch }
      });
      
      console.log(`📊 تم رفع دفعة ${Math.floor(i/batchSize) + 1} من البيانات`);
    }
    
    console.log('🎨 تطبيق التنسيق على صفحة DATA...');
    
    // الحصول على معرف الصفحة المحدثة
    const updatedSpreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const dataSheet = updatedSpreadsheet.data.sheets?.find(s => s.properties?.title === 'DATA');
    const dataSheetId = dataSheet?.properties?.sheetId;
    
    if (dataSheetId) {
      // تنسيق العناوين
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: dataSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 14
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 1 },
                    textFormat: { 
                      bold: true, 
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      fontSize: 12
                    },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat'
              }
            },
            {
              // تنسيق عمود معرف البند (A) بلون مميز
              repeatCell: {
                range: {
                  sheetId: dataSheetId,
                  startRowIndex: 1,
                  endRowIndex: finalData.items.length + 1,
                  startColumnIndex: 0,
                  endColumnIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.95, blue: 1 },
                    textFormat: { 
                      bold: true,
                      foregroundColor: { red: 0.1, green: 0.3, blue: 0.8 },
                      fontFamily: 'Courier New'
                    },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat'
              }
            },
            {
              // تثبيت الصف الأول
              updateSheetProperties: {
                properties: {
                  sheetId: dataSheetId,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                },
                fields: 'gridProperties.frozenRowCount'
              }
            }
          ]
        }
      });
    }
    
    const summary = {
      success: true,
      message: 'تم إنشاء صفحة DATA بنجاح مع معرف البند',
      sheetName: 'DATA',
      itemsWithIds: finalData.items.length,
      idFormat: 'P-0000001 إلى P-' + String(finalData.items.length).padStart(7, '0'),
      columns: {
        A: 'معرف البند (P-0000001)',
        B: 'رقم الصنف',
        C: 'رقم القطعة', 
        D: 'الوصف',
        E: 'الوحدة',
        F: 'رقم طلب التسعير',
        G: 'تاريخ RFQ',
        H: 'كمية RFQ',
        I: 'سعر RFQ',
        J: 'رقم أمر الشراء',
        K: 'تاريخ PO',
        L: 'كمية PO',
        M: 'سعر PO',
        N: 'قيمة PO'
      },
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${dataSheetId}`,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ تم إنشاء صفحة DATA بنجاح!');
    console.log(`📊 ${finalData.items.length} بند مع معرفات من P-0000001 إلى P-${String(finalData.items.length).padStart(7, '0')}`);
    console.log(`🔗 الرابط المباشر: ${summary.spreadsheetUrl}`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء صفحة DATA:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      message: 'فشل في إنشاء صفحة DATA'
    };
  }
}