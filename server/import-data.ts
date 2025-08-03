import fs from 'fs';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { 
  users, clients, items, quotationRequests, quotationItems, 
  purchaseOrders, purchaseOrderItems, activities 
} from '../shared/schema.js';

interface ImportData {
  items: Array<{
    item_number: string;
    part_number: string;
    line_item: string;
    description: string;
    unit_of_measure: string;
    category: string;
  }>;
  quotations: Array<{
    custom_request_number: string;
    request_date: string;
    status: string;
    client_name: string;
  }>;
  quotation_items: Array<{
    quotation_index: number;
    item_index: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  purchase_orders: Array<{
    po_number: string;
    po_date: string;
    status: string;
    client_name: string;
  }>;
  purchase_order_items: Array<{
    po_index: number;
    item_index: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

async function importExcelData() {
  try {
    console.log('🚀 بدء عملية استيراد البيانات...');
    
    // قراءة البيانات المعالجة
    const data: ImportData = JSON.parse(
      fs.readFileSync('attached_assets/processed_import_data.json', 'utf-8')
    );
    
    console.log('📊 إحصائيات البيانات:');
    console.log(`- البنود: ${data.items.length}`);
    console.log(`- طلبات التسعير: ${data.quotations.length}`);
    console.log(`- بنود طلبات التسعير: ${data.quotation_items.length}`);
    console.log(`- أوامر الشراء: ${data.purchase_orders.length}`);
    console.log(`- بنود أوامر الشراء: ${data.purchase_order_items.length}`);
    
    // إنشاء عميل افتراضي
    let client = await db.select().from(clients).where(db.eq(clients.name, 'EDC')).limit(1);
    if (client.length === 0) {
      await db.insert(clients).values({
        id: nanoid(),
        name: 'EDC',
        contact_email: 'info@edc.com',
        contact_phone: '+1234567890',
        address: 'مصر'
      });
      client = await db.select().from(clients).where(db.eq(clients.name, 'EDC')).limit(1);
    }
    const clientId = client[0].id;
    
    // استيراد البنود
    console.log('📦 استيراد البنود...');
    const itemIds: string[] = [];
    for (const itemData of data.items) {
      const itemId = nanoid();
      await db.insert(items).values({
        id: itemId,
        item_number: itemData.item_number,
        part_number: itemData.part_number,
        line_item: itemData.line_item,
        description: itemData.description,
        unit_of_measure: itemData.unit_of_measure,
        category: itemData.category,
        supplier_price: 0,
        customer_price: 0,
        ai_processed: false
      });
      itemIds.push(itemId);
    }
    console.log(`✅ تم استيراد ${itemIds.length} بند`);
    
    // استيراد طلبات التسعير
    console.log('📋 استيراد طلبات التسعير...');
    const quotationIds: string[] = [];
    for (const quotationData of data.quotations) {
      const quotationId = nanoid();
      await db.insert(quotationRequests).values({
        id: quotationId,
        custom_request_number: quotationData.custom_request_number,
        client_id: clientId,
        request_date: new Date(quotationData.request_date),
        status: quotationData.status as any,
        urgent: false,
        notes: 'مستورد من Excel'
      });
      quotationIds.push(quotationId);
    }
    console.log(`✅ تم استيراد ${quotationIds.length} طلب تسعير`);
    
    // استيراد بنود طلبات التسعير
    console.log('📝 استيراد بنود طلبات التسعير...');
    for (const qiData of data.quotation_items) {
      await db.insert(quotationItems).values({
        id: nanoid(),
        quotation_id: quotationIds[qiData.quotation_index],
        item_id: itemIds[qiData.item_index],
        quantity: qiData.quantity,
        unit_price: qiData.unit_price,
        total_price: qiData.total_price,
        notes: 'مستورد من Excel'
      });
    }
    console.log(`✅ تم استيراد ${data.quotation_items.length} بند طلب تسعير`);
    
    // استيراد أوامر الشراء
    console.log('🛒 استيراد أوامر الشراء...');
    const poIds: string[] = [];
    for (const poData of data.purchase_orders) {
      const poId = nanoid();
      await db.insert(purchaseOrders).values({
        id: poId,
        po_number: poData.po_number,
        client_id: clientId,
        po_date: new Date(poData.po_date),
        status: poData.status as any,
        notes: 'مستورد من Excel'
      });
      poIds.push(poId);
    }
    console.log(`✅ تم استيراد ${poIds.length} أمر شراء`);
    
    // استيراد بنود أوامر الشراء
    console.log('📦 استيراد بنود أوامر الشراء...');
    for (const poiData of data.purchase_order_items) {
      await db.insert(purchaseOrderItems).values({
        id: nanoid(),
        po_id: poIds[poiData.po_index],
        item_id: itemIds[poiData.item_index],
        quantity: poiData.quantity,
        unit_price: poiData.unit_price,
        total_price: poiData.total_price
      });
    }
    console.log(`✅ تم استيراد ${data.purchase_order_items.length} بند أمر شراء`);
    
    // تحديث أسعار العملاء من بيانات طلبات التسعير
    console.log('💰 تحديث أسعار العملاء...');
    const priceUpdates = await db.select({
      itemId: quotationItems.item_id,
      avgPrice: db.sql<number>`AVG(${quotationItems.unit_price})`.as('avg_price')
    })
    .from(quotationItems)
    .groupBy(quotationItems.item_id)
    .where(db.gt(quotationItems.unit_price, 0));
    
    for (const update of priceUpdates) {
      await db.update(items)
        .set({ customer_price: update.avgPrice })
        .where(db.eq(items.id, update.itemId));
    }
    console.log(`✅ تم تحديث ${priceUpdates.length} سعر عميل`);
    
    console.log('🎉 تم الانتهاء من استيراد البيانات بنجاح!');
    
    return {
      success: true,
      stats: {
        items: itemIds.length,
        quotations: quotationIds.length,
        quotation_items: data.quotation_items.length,
        purchase_orders: poIds.length,
        purchase_order_items: data.purchase_order_items.length
      }
    };
    
  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error);
    throw error;
  }
}

// تشغيل الاستيراد
if (import.meta.url === `file://${process.argv[1]}`) {
  importExcelData()
    .then(result => {
      console.log('✅ نتيجة الاستيراد:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل الاستيراد:', error);
      process.exit(1);
    });
}

export { importExcelData };