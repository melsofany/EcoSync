/**
 * تحليل العلاقة بين طلبات التسعير (العمود F) وأوامر الشراء (العمود L)
 * من البيانات الأصلية المستوردة من الإكسل
 */
import fs from 'fs';

async function analyzeRfqPoRelationship() {
  try {
    console.log('🔍 تحليل العلاقة بين RFQ (العمود F) و PO (العمود L)...');
    
    // قراءة البيانات الأصلية مع تنظيف قيم NaN
    const fileContent = fs.readFileSync('attached_assets/complete_excel_data.json', 'utf8');
    const cleanedContent = fileContent.replace(/:\s*NaN/g, ': null');
    const rawData = JSON.parse(cleanedContent);
    
    console.log(`📊 نوع البيانات: ${typeof rawData}`);
    console.log(`📊 البيانات array؟ ${Array.isArray(rawData)}`);
    
    // استخراج البيانات من المصفوفة DATA
    let dataArray;
    if (rawData && rawData.DATA && Array.isArray(rawData.DATA)) {
      dataArray = rawData.DATA;
    } else if (Array.isArray(rawData)) {
      dataArray = rawData;
    } else if (typeof rawData === 'object' && rawData !== null) {
      dataArray = Object.values(rawData);
    } else {
      throw new Error('تنسيق البيانات غير مدعوم');
    }
    
    console.log(`📊 إجمالي الصفوف: ${dataArray.length}`);
    
    // تحليل العلاقات
    const relationships = new Map();
    const uniqueRfqs = new Set();
    const uniquePos = new Set();
    
    // فحص أول صف لرؤية أسماء الأعمدة
    if (dataArray.length > 0) {
      console.log('🔍 أسماء الأعمدة المتاحة:', Object.keys(dataArray[0]));
    }
    
    dataArray.forEach((row, index) => {
      // البحث عن الأعمدة F و L بأسماء مختلفة
      const rfqNumber = row.F || row['F'] || row['Unnamed: 5'] || row['REQUEST NO.'];
      const poNumber = row.L || row['L'] || row['Unnamed: 11'] || row['P.O NO.'];
      const quantity = parseFloat(row.G || row['G'] || row['Unnamed: 6'] || row['QTY']) || 0;
      
      const rfqStr = rfqNumber?.toString().trim();
      const poStr = poNumber?.toString().trim();
      
      if (rfqStr && rfqStr !== 'undefined' && rfqStr !== '' && rfqStr !== 'null') {
        uniqueRfqs.add(rfqStr);
        
        if (poStr && poStr !== 'undefined' && poStr !== '' && poStr !== 'null') {
          uniquePos.add(poStr);
          
          const key = `${rfqStr}->${poStr}`;
          if (!relationships.has(key)) {
            relationships.set(key, {
              rfq: rfqStr,
              po: poStr,
              rows: [],
              totalQuantity: 0,
              zeroQuantityRows: 0
            });
          }
          
          const rel = relationships.get(key);
          rel.rows.push(index + 1);
          rel.totalQuantity += quantity;
          if (quantity === 0) {
            rel.zeroQuantityRows++;
          }
        }
      }
    });
    
    console.log(`📈 إحصائيات:`);
    console.log(`   - طلبات التسعير الفريدة: ${uniqueRfqs.size}`);
    console.log(`   - أوامر الشراء الفريدة: ${uniquePos.size}`);
    console.log(`   - العلاقات المكتشفة: ${relationships.size}`);
    
    // أمثلة على العلاقات
    console.log(`\n🔗 أمثلة على العلاقات:`);
    let count = 0;
    for (const [key, rel] of relationships) {
      if (count >= 10) break;
      console.log(`   ${rel.rfq} -> ${rel.po} (${rel.rows.length} صف, كمية ${rel.totalQuantity}, صفرية ${rel.zeroQuantityRows})`);
      count++;
    }
    
    // البحث عن RFQ مع عدة PO
    console.log(`\n🔄 طلبات التسعير مع عدة أوامر شراء:`);
    const rfqToPoMap = new Map();
    
    for (const rel of relationships.values()) {
      if (!rfqToPoMap.has(rel.rfq)) {
        rfqToPoMap.set(rel.rfq, []);
      }
      rfqToPoMap.get(rel.rfq).push(rel.po);
    }
    
    let multiPoCount = 0;
    for (const [rfq, pos] of rfqToPoMap) {
      if (pos.length > 1) {
        console.log(`   ${rfq}: [${pos.join(', ')}]`);
        multiPoCount++;
        if (multiPoCount >= 10) break;
      }
    }
    
    // حفظ النتائج
    const analysisResult = {
      totalRows: dataArray.length,
      uniqueRfqs: uniqueRfqs.size,
      uniquePos: uniquePos.size,
      relationships: Array.from(relationships.values()),
      rfqToPoMapping: Object.fromEntries(rfqToPoMap),
      summary: {
        multiPoRfqs: Array.from(rfqToPoMap.entries())
          .filter(([rfq, pos]) => pos.length > 1)
          .length
      }
    };
    
    fs.writeFileSync('attached_assets/rfq_po_analysis.json', JSON.stringify(analysisResult, null, 2));
    console.log('\n✅ تم حفظ التحليل في: attached_assets/rfq_po_analysis.json');
    
    return analysisResult;
    
  } catch (error) {
    console.error('❌ خطأ في التحليل:', error);
    throw error;
  }
}

// تشغيل التحليل
analyzeRfqPoRelationship().then(() => {
  console.log('🎯 اكتمل التحليل بنجاح');
}).catch(console.error);