/**
 * تحليل بند محدد في ملف Excel الأصلي مقابل قاعدة البيانات
 */
import fs from 'fs';

async function analyzeSpecificItem() {
  try {
    console.log('🔍 تحليل البند 0666.001.GENRAL.0027...');
    
    // قراءة ملف Excel الأصلي
    const rawData = JSON.parse(fs.readFileSync('attached_assets/complete_excel_data.json', 'utf8'));
    const dataArray = rawData.DATA || rawData;
    
    console.log(`📊 إجمالي الصفوف في Excel: ${dataArray.length}`);
    
    const targetItem = "0666.001.GENRAL.0027";
    const matchingRows = [];
    
    // البحث عن البند في كل الأعمدة
    dataArray.forEach((row, index) => {
      const rowValues = Object.values(row);
      const hasTargetItem = rowValues.some(value => 
        value && value.toString().includes(targetItem)
      );
      
      if (hasTargetItem) {
        // العثور على العمود الذي يحتوي على البند
        const columnName = Object.keys(row).find(key => 
          row[key] && row[key].toString().includes(targetItem)
        );
        
        matchingRows.push({
          rowIndex: index,
          columnName,
          itemCode: row[columnName],
          rfqNumber: row['Unnamed: 5'] || row.F,  // عمود F
          poNumber: row['Unnamed: 11'] || row.L,   // عمود L
          quantity: row['Unnamed: 6'] || row.G,    // عمود G
          description: row['Unnamed: 3'] || row.D, // عمود D
          lineItem: row['Unnamed: 1'] || row.B     // عمود B
        });
      }
    });
    
    console.log(`\n📋 النتائج:`);
    console.log(`   - إجمالي الصفوف التي تحتوي على البند: ${matchingRows.length}`);
    
    if (matchingRows.length > 0) {
      console.log(`\n🔍 أول 5 صفوف:`);
      matchingRows.slice(0, 5).forEach((row, i) => {
        console.log(`   ${i+1}. الصف ${row.rowIndex}:`);
        console.log(`      - العمود: ${row.columnName}`);
        console.log(`      - كود البند: ${row.itemCode}`);
        console.log(`      - RFQ: ${row.rfqNumber || 'غير محدد'}`);
        console.log(`      - PO: ${row.poNumber || 'غير محدد'}`);
        console.log(`      - الكمية: ${row.quantity || 'غير محدد'}`);
        console.log(`      - الوصف: ${row.description ? row.description.substring(0, 50) + '...' : 'غير محدد'}`);
        console.log();
      });
      
      // إحصائيات طلبات التسعير الفريدة
      const uniqueRfqs = new Set(matchingRows
        .map(r => r.rfqNumber)
        .filter(rfq => rfq && rfq !== 'undefined')
      );
      
      const uniquePos = new Set(matchingRows
        .map(r => r.poNumber)
        .filter(po => po && po !== 'undefined')
      );
      
      console.log(`📊 الإحصائيات:`);
      console.log(`   - طلبات التسعير الفريدة: ${uniqueRfqs.size}`);
      console.log(`   - أوامر الشراء الفريدة: ${uniquePos.size}`);
      console.log(`   - إجمالي السجلات: ${matchingRows.length}`);
      
      console.log(`\n📋 طلبات التسعير الفريدة:`);
      Array.from(uniqueRfqs).slice(0, 10).forEach(rfq => {
        const count = matchingRows.filter(r => r.rfqNumber === rfq).length;
        console.log(`   - ${rfq}: ${count} سجل`);
      });
    }
    
    // حفظ التحليل
    const analysisResult = {
      targetItem,
      totalExcelRows: dataArray.length,
      matchingRowsCount: matchingRows.length,
      uniqueRfqs: matchingRows.length > 0 ? Array.from(new Set(matchingRows.map(r => r.rfqNumber).filter(r => r))) : [],
      uniquePos: matchingRows.length > 0 ? Array.from(new Set(matchingRows.map(r => r.poNumber).filter(p => p))) : [],
      matchingRows: matchingRows.slice(0, 20) // أول 20 صف للمراجعة
    };
    
    fs.writeFileSync('attached_assets/specific_item_analysis.json', JSON.stringify(analysisResult, null, 2));
    console.log(`\n✅ تم حفظ التحليل في: attached_assets/specific_item_analysis.json`);
    
  } catch (error) {
    console.error('❌ خطأ في التحليل:', error);
  }
}

analyzeSpecificItem();