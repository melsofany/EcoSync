import fs from 'fs';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { eq, gt, sql } from 'drizzle-orm';
import { 
  clients, items, quotationRequests, quotationItems, 
  purchaseOrders, purchaseOrderItems
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
    
    // الحصول على مستخدم للعملية
    const systemUser = await db.select().from(quotationRequests).limit(1);
    let createdById = 'default-user';
    if (systemUser.length > 0) {
      createdById = systemUser[0].createdBy;
    }
    
    // إنشاء عميل افتراضي
    let client = await db.select().from(clients).where(eq(clients.name, 'EDC')).limit(1);
    if (client.length === 0) {
      await db.insert(clients).values({
        name: 'EDC',
        phone: '+1234567890',
        email: 'info@edc.com',
        address: 'مصر',
        createdBy: createdById
      });
      client = await db.select().from(clients).where(eq(clients.name, 'EDC')).limit(1);
    }
    const clientId = client[0].id;
    
    // استيراد البنود
    console.log('📦 استيراد البنود...');
    const itemIds: string[] = [];
    for (const itemData of data.items) {
      // التحقق من وجود البند
      const existing = await db.select().from(items).where(eq(items.itemNumber, itemData.item_number)).limit(1);
      if (existing.length > 0) {
        itemIds.push(existing[0].id);
        continue;
      }
      
      const inserted = await db.insert(items).values({
        itemNumber: itemData.item_number,
        partNumber: itemData.part_number,
        lineItem: itemData.line_item,
        description: itemData.description,
        unit: itemData.unit_of_measure || 'EACH',
        category: itemData.category,
        supplierPrice: '0',
        customerPrice: '0',
        aiProcessed: false,
        createdBy: createdById
      }).returning({ id: items.id });
      itemIds.push(inserted[0].id);
    }
    console.log(`✅ تم استيراد ${itemIds.length} بند`);
    
    // استيراد طلبات التسعير
    console.log('📋 استيراد طلبات التسعير...');
    const quotationIds: string[] = [];
    for (const quotationData of data.quotations) {
      const inserted = await db.insert(quotationRequests).values({
        requestNumber: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        customRequestNumber: quotationData.custom_request_number,
        clientId: clientId,
        requestDate: new Date(quotationData.request_date),
        status: quotationData.status as any,
        urgent: false,
        notes: 'مستورد من Excel',
        createdBy: createdById
      }).returning({ id: quotationRequests.id });
      quotationIds.push(inserted[0].id);
    }
    console.log(`✅ تم استيراد ${quotationIds.length} طلب تسعير`);
    
    // استيراد بنود طلبات التسعير
    console.log('📝 استيراد بنود طلبات التسعير...');
    for (const qiData of data.quotation_items) {
      await db.insert(quotationItems).values({
        quotationId: quotationIds[qiData.quotation_index],
        itemId: itemIds[qiData.item_index],
        quantity: qiData.quantity.toString(),
        unitPrice: qiData.unit_price.toString(),
        totalPrice: qiData.total_price.toString(),
        notes: 'مستورد من Excel'
      });
    }
    console.log(`✅ تم استيراد ${data.quotation_items.length} بند طلب تسعير`);
    
    // استيراد أوامر الشراء
    console.log('🛒 استيراد أوامر الشراء...');
    const poIds: string[] = [];
    for (const poData of data.purchase_orders) {
      // التحقق من وجود أمر الشراء
      const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.poNumber, poData.po_number)).limit(1);
      if (existing.length > 0) {
        poIds.push(existing[0].id);
        continue;
      }
      
      const inserted = await db.insert(purchaseOrders).values({
        poNumber: poData.po_number,
        quotationId: quotationIds[0], // ربط بأول طلب تسعير
        clientId: clientId,
        poDate: new Date(poData.po_date),
        status: poData.status as any,
        notes: 'مستورد من Excel',
        createdBy: createdById
      }).returning({ id: purchaseOrders.id });
      poIds.push(inserted[0].id);
    }
    console.log(`✅ تم استيراد ${poIds.length} أمر شراء`);
    
    // استيراد بنود أوامر الشراء
    console.log('📦 استيراد بنود أوامر الشراء...');
    for (const poiData of data.purchase_order_items) {
      await db.insert(purchaseOrderItems).values({
        poId: poIds[poiData.po_index],
        itemId: itemIds[poiData.item_index],
        quantity: poiData.quantity.toString(),
        unitPrice: poiData.unit_price.toString(),
        totalPrice: poiData.total_price.toString()
      });
    }
    console.log(`✅ تم استيراد ${data.purchase_order_items.length} بند أمر شراء`);
    
    // تحديث أسعار العملاء من بيانات طلبات التسعير
    console.log('💰 تحديث أسعار العملاء...');
    console.log('✅ تم تخطي تحديث الأسعار مؤقتاً');
    
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