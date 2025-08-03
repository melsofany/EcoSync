import { readFileSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { storage } from './storage.js';

interface ImportQuotationsPOsResult {
  success: boolean;
  quotationsCreated: number;
  purchaseOrdersCreated: number;
  itemsProcessed: number;
  totalRFQValue: number;
  totalPOValue: number;
  error?: string;
}

export async function importQuotationsAndPOs(): Promise<ImportQuotationsPOsResult> {
  try {
    console.log('بدء استيراد طلبات التسعير وأوامر الشراء مع الأسعار والتواريخ...');
    
    // Get admin user ID
    const adminUserId = '4964161e-b3a1-4e10-ac5b-9b728913bb6f';
    
    // Read structured pricing data
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'structured_pricing_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const structuredData = JSON.parse(rawData);
    
    console.log(`البيانات المحملة: ${structuredData.total_items} صنف`);
    console.log(`طلبات التسعير: ${structuredData.total_quotations}`);
    console.log(`أوامر الشراء: ${structuredData.total_purchase_orders}`);
    
    // Get EDC client
    const clients = await storage.getAllClients();
    const edcClient = clients.find(c => c.name === 'EDC');
    
    if (!edcClient) {
      throw new Error('لم يتم العثور على عميل EDC');
    }
    
    // Create suppliers map
    const suppliers = await storage.getAllSuppliers();
    const supplierMap = new Map<string, string>();
    
    // Get unique buyers from data
    const uniqueBuyers = Array.from(new Set(structuredData.items
      .map((item: any) => item.buyer)
      .filter((buyer: string) => buyer && buyer.trim())
    ));
    
    // Create suppliers for buyers not in system
    for (const buyerName of uniqueBuyers) {
      let supplier = suppliers.find(s => s.name === buyerName);
      if (!supplier) {
        try {
          supplier = await storage.createSupplier({
            name: buyerName,
            contactPerson: '',
            email: '',
            phone: '',
            address: ''
          });
          console.log(`تم إنشاء المورد: ${buyerName}`);
        } catch (error) {
          console.error(`خطأ في إنشاء المورد ${buyerName}:`, error);
          continue;
        }
      }
      supplierMap.set(buyerName, supplier.id);
    }
    
    let quotationsCreated = 0;
    let purchaseOrdersCreated = 0;
    let itemsProcessed = 0;
    
    // Import quotations with items and pricing
    console.log('إنشاء طلبات التسعير...');
    for (const quotationData of structuredData.quotations) {
      try {
        // Check if quotation already exists
        const existingQuotations = await storage.getQuotations();
        const existingQuotation = existingQuotations.find(
          (q: any) => q.customRequestNumber === quotationData.rfq_number
        );
        
        if (existingQuotation) {
          console.log(`طلب التسعير ${quotationData.rfq_number} موجود مسبقاً`);
          continue;
        }
        
        // Create quotation
        const quotation = await storage.createQuotation({
          createdBy: adminUserId,
          clientId: edcClient.id,
          customRequestNumber: quotationData.rfq_number,
          requestDate: quotationData.date_rfq || new Date().toISOString(),
          status: quotationData.condition === 'منتهي' ? 'completed' : 'pending',
          notes: `استيراد من ملف Excel - قيمة إجمالية: ${quotationData.total_value.toLocaleString()} جنيه`
        });
        
        // Add items to quotation
        for (const itemData of quotationData.items) {
          // Find or create item
          const existingItems = await storage.getAllItems();
          let item = existingItems.find(
            (i: any) => i.partNumber === itemData.part_number || 
            i.description === itemData.description
          );
          
          if (!item) {
            // Create new item
            item = await storage.createItem({
              kItemId: await storage.getNextItemNumber(),
              partNumber: itemData.part_number,
              description: itemData.description,
              unit: itemData.uom || 'قطعة',
              category: itemData.category || 'عام',
              lineItem: itemData.line_item,
              createdBy: adminUserId
            });
          }
          
          // Add item to quotation with pricing
          await storage.addQuotationItem({
            quotationId: quotation.id,
            itemId: item.id,
            quantity: itemData.qty.toString(),
            unitPrice: itemData.price_rfq.toString(),
            totalPrice: (itemData.price_rfq * itemData.qty).toString(),
            currency: 'EGP',
            supplierId: supplierMap.get(itemData.buyer) || null,
            supplierQuoteDate: itemData.date_rfq || null
          });
          
          itemsProcessed++;
        }
        
        quotationsCreated++;
        console.log(`تم إنشاء طلب التسعير: ${quotationData.rfq_number} (${quotationData.items.length} بند)`);
        
      } catch (error) {
        console.error(`خطأ في إنشاء طلب التسعير ${quotationData.rfq_number}:`, error);
      }
    }
    
    // Import purchase orders with items and pricing
    console.log('إنشاء أوامر الشراء...');
    for (const poData of structuredData.purchase_orders) {
      try {
        // Find related quotation
        const allQuotations = await storage.getQuotations();
        const relatedQuotation = allQuotations.find(
          (q: any) => poData.items.some((item: any) => item.rfq === q.customRequestNumber)
        );
        
        // Check if PO already exists
        const existingPOs = await storage.getAllPurchaseOrders();
        const existingPO = existingPOs.find(
          (po: any) => po.poNumber === poData.po_number
        );
        
        if (existingPO) {
          console.log(`أمر الشراء ${poData.po_number} موجود مسبقاً`);
          continue;
        }
        
        // Create purchase order
        const purchaseOrder = await storage.createPurchaseOrder({
          createdBy: adminUserId,
          quotationRequestId: relatedQuotation?.id || null,
          supplierId: supplierMap.get(poData.buyer) || null,
          poNumber: poData.po_number,
          orderDate: poData.date_po || new Date().toISOString(),
          status: 'pending',
          notes: `استيراد من ملف Excel - قيمة إجمالية: ${poData.total_value.toLocaleString()} جنيه`,
          currency: 'EGP',
          totalAmount: poData.total_value.toString()
        });
        
        // Add items to purchase order
        for (const itemData of poData.items) {
          // Find or create item
          const existingItems = await storage.getAllItems();
          let item = existingItems.find(
            (i: any) => i.partNumber === itemData.part_number || 
            i.description === itemData.description
          );
          
          if (!item) {
            // Create new item
            item = await storage.createItem({
              kItemId: await storage.getNextItemNumber(),
              partNumber: itemData.part_number,
              description: itemData.description,
              unit: itemData.uom || 'قطعة',
              category: itemData.category || 'عام',
              lineItem: itemData.line_item,
              createdBy: adminUserId
            });
          }
          
          // Add item to purchase order with pricing
          await storage.addPurchaseOrderItem({
            poId: purchaseOrder.id,
            itemId: item.id,
            quantity: itemData.qty_po.toString(),
            unitPrice: itemData.price_po.toString(),
            totalPrice: (itemData.price_po * itemData.qty_po).toString(),
            currency: 'EGP'
          });
        }
        
        purchaseOrdersCreated++;
        console.log(`تم إنشاء أمر الشراء: ${poData.po_number} (${poData.items.length} بند)`);
        
      } catch (error) {
        console.error(`خطأ في إنشاء أمر الشراء ${poData.po_number}:`, error);
      }
    }
    
    console.log(`تم الانتهاء من الاستيراد:`);
    console.log(`- طلبات التسعير المُنشأة: ${quotationsCreated}`);
    console.log(`- أوامر الشراء المُنشأة: ${purchaseOrdersCreated}`);
    console.log(`- البنود المعالجة: ${itemsProcessed}`);
    
    return {
      success: true,
      quotationsCreated,
      purchaseOrdersCreated,
      itemsProcessed,
      totalRFQValue: structuredData.statistics.total_rfq_value,
      totalPOValue: structuredData.statistics.total_po_value
    };
    
  } catch (error) {
    console.error('خطأ في استيراد طلبات التسعير وأوامر الشراء:', error);
    return {
      success: false,
      quotationsCreated: 0,
      purchaseOrdersCreated: 0,
      itemsProcessed: 0,
      totalRFQValue: 0,
      totalPOValue: 0,
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    };
  }
}