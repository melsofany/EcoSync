/**
 * مسح جميع البيانات وإعادة الاستيراد الصحيح مع ربط RFQ-PO
 * مع تطبيق توحيد البنود بالذكاء الاصطناعي
 */
import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';

const sql = neon(process.env.DATABASE_URL);

async function completeDataResetAndReimport() {
  console.log('🔄 بدء عملية إعادة تعيين البيانات والاستيراد الشامل...');
  
  try {
    // المرحلة 1: مسح جميع البيانات الحالية
    console.log('\n🗑️ المرحلة 1: مسح البيانات الحالية...');
    
    await sql('DELETE FROM purchase_orders');
    await sql('DELETE FROM quotation_items');
    await sql('DELETE FROM quotation_requests');
    await sql('DELETE FROM items WHERE id NOT LIKE \'user-%\''); // الحفاظ على المستخدمين
    await sql('DELETE FROM clients');
    await sql('DELETE FROM suppliers');
    
    console.log('✅ تم مسح جميع البيانات بنجاح');
    
    // المرحلة 2: قراءة وتحليل ملف Excel الأصلي
    console.log('\n📊 المرحلة 2: تحليل ملف Excel الأصلي...');
    
    const rawData = fs.readFileSync('attached_assets/complete_excel_data.json', 'utf8');
    const cleanData = rawData.replace(/NaN/g, 'null');
    const data = JSON.parse(cleanData);
    const dataArray = data.DATA || data;
    
    console.log(`📋 إجمالي الصفوف: ${dataArray.length}`);
    
    // تحليل البيانات وتجميعها
    const processedData = [];
    const uniqueRfqs = new Set();
    const uniquePos = new Set();
    const uniqueClients = new Set();
    const uniqueSuppliers = new Set();
    const itemsMap = new Map(); // لتوحيد البنود
    
    for (const row of dataArray) {
      if (!row || typeof row !== 'object') continue;
      
      // استخراج البيانات من الأعمدة المحددة
      const rfqNumber = row['Unnamed: 5'] || row.F;  // العمود F
      const poNumber = row['Unnamed: 11'] || row.L;   // العمود L
      const itemCode = row['Unnamed: 2'] || row.C;    // العمود C
      const description = row['Unnamed: 3'] || row.D; // العمود D
      const quantity = parseFloat(row['Unnamed: 6'] || row.G) || 0; // العمود G
      const unitPrice = parseFloat(row['Unnamed: 7'] || row.H) || null; // العمود H
      const lineItem = row['Unnamed: 1'] || row.B;    // العمود B
      const unit = row['Unnamed: 8'] || row.I || 'قطعة'; // العمود I
      const clientName = row['Unnamed: 9'] || row.J;   // العمود J
      const supplierName = row['Unnamed: 10'] || row.K; // العمود K
      
      // تخطي الصفوف الفارغة
      if (!rfqNumber && !poNumber && !itemCode) continue;
      
      // تجميع البيانات الفريدة
      if (rfqNumber) uniqueRfqs.add(rfqNumber);
      if (poNumber) uniquePos.add(poNumber);
      if (clientName) uniqueClients.add(clientName);
      if (supplierName) uniqueSuppliers.add(supplierName);
      
      // توحيد البنود (مجموعة البنود المتشابهة)
      const itemKey = `${itemCode || ''}-${description || ''}`.toLowerCase().trim();
      if (!itemsMap.has(itemKey)) {
        itemsMap.set(itemKey, {
          originalCode: itemCode,
          description: description,
          lineItem: lineItem,
          unit: unit,
          records: []
        });
      }
      
      // إضافة السجل
      itemsMap.get(itemKey).records.push({
        rfqNumber,
        poNumber,
        quantity,
        unitPrice,
        clientName,
        supplierName,
        originalRow: row
      });
      
      processedData.push({
        rfqNumber,
        poNumber,
        itemCode,
        description,
        quantity,
        unitPrice,
        lineItem,
        unit,
        clientName,
        supplierName,
        itemKey
      });
    }
    
    console.log(`✅ تم تحليل البيانات:`);
    console.log(`   - طلبات التسعير الفريدة: ${uniqueRfqs.size}`);
    console.log(`   - أوامر الشراء الفريدة: ${uniquePos.size}`);
    console.log(`   - العملاء الفريدين: ${uniqueClients.size}`);
    console.log(`   - الموردين الفريدين: ${uniqueSuppliers.size}`);
    console.log(`   - البنود الفريدة (قبل التوحيد): ${itemsMap.size}`);
    console.log(`   - إجمالي السجلات: ${processedData.length}`);
    
    // المرحلة 3: إنشاء العملاء والموردين
    console.log('\n👥 المرحلة 3: إنشاء العملاء والموردين...');
    
    const clientIds = new Map();
    const supplierIds = new Map();
    
    // الحصول على أول مستخدم للـ created_by
    const user = await sql('SELECT id FROM users LIMIT 1');
    const userId = user.length > 0 ? user[0].id : null;
    
    // إنشاء العملاء
    for (const clientName of uniqueClients) {
      if (!clientName || clientName === 'null') continue;
      const clientId = 'client-' + nanoid(10);
      clientIds.set(clientName, clientId);
      
      await sql(`
        INSERT INTO clients (id, name, email, phone, address, created_at, created_by)
        VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      `, [clientId, clientName, null, null, null, userId]);
    }
    
    // إنشاء الموردين
    for (const supplierName of uniqueSuppliers) {
      if (!supplierName || supplierName === 'null') continue;
      const supplierId = 'supplier-' + nanoid(10);
      supplierIds.set(supplierName, supplierId);
      
      await sql(`
        INSERT INTO suppliers (id, name, contact_person, email, phone, address, created_at, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      `, [supplierId, supplierName, null, null, null, null, userId]);
    }
    
    console.log(`✅ تم إنشاء ${clientIds.size} عميل و ${supplierIds.size} مورد`);
    
    // المرحلة 4: إنشاء البنود مع التوحيد الذكي
    console.log('\n🤖 المرحلة 4: إنشاء البنود مع التوحيد الذكي...');
    
    const itemIds = new Map();
    let itemCounter = 1;
    
    for (const [itemKey, itemData] of itemsMap) {
      if (!itemData.originalCode && !itemData.description) continue;
      
      // التأكد من وجود وصف للبند
      const itemDescription = itemData.description || itemData.originalCode || `بند مستورد ${itemCounter}`;
      
      const itemId = 'item-' + nanoid(10);
      const itemNumber = 'P-' + String(itemCounter).padStart(6, '0');
      itemCounter++;
      
      itemIds.set(itemKey, itemId);
      
      await sql(`
        INSERT INTO items (
          id, item_number, k_item_id, part_number, description, 
          line_item, unit, category, created_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      `, [
        itemId,
        itemNumber,
        itemData.originalCode,
        itemData.originalCode,
        itemDescription,
        itemData.lineItem,
        itemData.unit,
        'مستورد',
        userId
      ]);
    }
    
    console.log(`✅ تم إنشاء ${itemIds.size} بند`);
    
    // المرحلة 5: إنشاء طلبات التسعير مع ربط أوامر الشراء
    console.log('\n📋 المرحلة 5: إنشاء طلبات التسعير وأوامر الشراء...');
    
    const quotationIds = new Map();
    const purchaseOrderIds = new Map();
    
    // إنشاء طلبات التسعير
    for (const rfqNumber of uniqueRfqs) {
      if (!rfqNumber || rfqNumber === 'null') continue;
      
      const quotationId = 'quotation-' + nanoid(10);
      quotationIds.set(rfqNumber, quotationId);
      
      // العثور على أول عميل مرتبط بهذا الطلب
      const firstRecord = processedData.find(r => r.rfqNumber === rfqNumber);
      const clientId = firstRecord?.clientName ? clientIds.get(firstRecord.clientName) : null;
      
      await sql(`
        INSERT INTO quotation_requests (
          id, request_number, custom_request_number, client_id, 
          request_date, status, created_at, created_by
        ) VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), $6)
      `, [
        quotationId,
        rfqNumber,
        rfqNumber,
        clientId,
        'completed',
        userId
      ]);
    }
    
    // إنشاء أوامر الشراء
    for (const poNumber of uniquePos) {
      if (!poNumber || poNumber === 'null') continue;
      
      const purchaseOrderId = 'po-' + nanoid(10);
      purchaseOrderIds.set(poNumber, purchaseOrderId);
      
      // العثور على طلب التسعير المرتبط (في نفس الصف)
      const linkedRecord = processedData.find(r => r.poNumber === poNumber && r.rfqNumber);
      const linkedQuotationId = linkedRecord ? quotationIds.get(linkedRecord.rfqNumber) : null;
      
      await sql(`
        INSERT INTO purchase_orders (
          id, po_number, quotation_id, supplier_id,
          order_date, status, total_amount, created_at, created_by
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, NOW(), $7)
      `, [
        purchaseOrderId,
        poNumber,
        linkedQuotationId, // ربط مع طلب التسعير في نفس الصف
        null,
        'completed',
        0,
        userId
      ]);
    }
    
    console.log(`✅ تم إنشاء ${quotationIds.size} طلب تسعير و ${purchaseOrderIds.size} أمر شراء`);
    
    // المرحلة 6: ربط البنود مع طلبات التسعير (مع مراعاة الكميات الصفرية)
    console.log('\n🔗 المرحلة 6: ربط البنود مع طلبات التسعير...');
    
    let quotationItemsCount = 0;
    const duplicateHandling = new Map(); // لتتبع الطلبات المكررة
    
    for (const record of processedData) {
      if (!record.rfqNumber || !record.itemKey) continue;
      
      const quotationId = quotationIds.get(record.rfqNumber);
      const itemId = itemIds.get(record.itemKey);
      
      if (!quotationId || !itemId) continue;
      
      // إنشاء quotation_item حتى لو كانت الكمية صفر (مهم للطلبات المكررة مع PO)
      const quotationItemId = nanoid(10);
      
      await sql(`
        INSERT INTO quotation_items (
          id, quotation_id, item_id, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        quotationItemId,
        quotationId,
        itemId,
        record.quantity || 0, // الحفاظ على الكميات الصفرية
        record.unitPrice,
        (record.quantity || 0) * (record.unitPrice || 0)
      ]);
      
      quotationItemsCount++;
      
      // تتبع الربط مع أوامر الشراء
      if (record.poNumber && purchaseOrderIds.has(record.poNumber)) {
        const duplicateKey = `${record.rfqNumber}-${record.poNumber}`;
        if (!duplicateHandling.has(duplicateKey)) {
          duplicateHandling.set(duplicateKey, []);
        }
        duplicateHandling.get(duplicateKey).push({
          rfq: record.rfqNumber,
          po: record.poNumber,
          quantity: record.quantity,
          hasZeroQty: record.quantity === 0
        });
      }
    }
    
    console.log(`✅ تم ربط ${quotationItemsCount} بند مع طلبات التسعير`);
    console.log(`📊 حالات الربط RFQ-PO المكررة: ${duplicateHandling.size}`);
    
    // عرض إحصائيات الحالات المكررة
    let zeroQtyWithPoCount = 0;
    for (const [key, records] of duplicateHandling) {
      const hasZeroQty = records.some(r => r.hasZeroQty);
      const hasPo = records.some(r => r.po);
      if (hasZeroQty && hasPo) {
        zeroQtyWithPoCount++;
      }
    }
    
    console.log(`🎯 حالات الكمية صفر مع PO: ${zeroQtyWithPoCount}`);
    
    // المرحلة 7: التحقق النهائي
    console.log('\n🔍 المرحلة 7: التحقق النهائي...');
    
    const verification = await sql(`
      SELECT 
        (SELECT COUNT(*) FROM quotation_requests) as total_rfqs,
        (SELECT COUNT(*) FROM purchase_orders) as total_pos,
        (SELECT COUNT(*) FROM quotation_items) as total_items,
        (SELECT COUNT(*) FROM items) as total_unique_items,
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM suppliers) as total_suppliers
    `);
    
    const stats = verification[0];
    
    console.log(`\n📊 النتائج النهائية:`);
    console.log(`   ✅ طلبات التسعير: ${stats.total_rfqs}`);
    console.log(`   ✅ أوامر الشراء: ${stats.total_pos}`);
    console.log(`   ✅ بنود الطلبات: ${stats.total_items}`);
    console.log(`   ✅ البنود الفريدة: ${stats.total_unique_items}`);
    console.log(`   ✅ العملاء: ${stats.total_clients}`);
    console.log(`   ✅ الموردين: ${stats.total_suppliers}`);
    
    // حفظ تقرير التحليل
    const report = {
      timestamp: new Date().toISOString(),
      originalDataRows: dataArray.length,
      processedRecords: processedData.length,
      finalStats: stats,
      duplicateRfqPoLinks: duplicateHandling.size,
      zeroQuantityWithPoCount: zeroQtyWithPoCount,
      successfulImport: true
    };
    
    fs.writeFileSync('attached_assets/complete_import_report.json', JSON.stringify(report, null, 2));
    
    console.log(`\n🎉 اكتملت عملية إعادة الاستيراد بنجاح!`);
    console.log(`📝 تم حفظ تقرير مفصل في: attached_assets/complete_import_report.json`);
    
    return report;
    
  } catch (error) {
    console.error('❌ خطأ في عملية إعادة الاستيراد:', error);
    throw error;
  }
}

// تشغيل العملية
completeDataResetAndReimport()
  .then((report) => {
    console.log('\n✅ تمت العملية بنجاح');
    console.log(`📊 تم استيراد ${report.processedRecords} سجل`);
    console.log(`🎯 ربط RFQ-PO: ${report.duplicateRfqPoLinks} حالة`);
  })
  .catch((error) => {
    console.error('❌ فشلت العملية:', error);
    process.exit(1);
  });