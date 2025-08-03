import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage.js';

async function importPurchaseOrders() {
  console.log('📦 بدء استيراد أوامر الشراء وربطها بطلبات التسعير...');
  
  try {
    // Read structured pricing data
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'structured_pricing_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const structuredData = JSON.parse(rawData);
    
    // Group data by RFQ and PO
    const rfqPoMapping = new Map<string, Map<string, any[]>>();
    
    for (const item of structuredData.items) {
      if (!item.rfq || !item.po) continue;
      
      const rfq = item.rfq;
      const po = item.po;
      
      if (!rfqPoMapping.has(rfq)) {
        rfqPoMapping.set(rfq, new Map());
      }
      
      if (!rfqPoMapping.get(rfq)!.has(po)) {
        rfqPoMapping.get(rfq)!.set(po, []);
      }
      
      rfqPoMapping.get(rfq)!.get(po)!.push(item);
    }
    
    console.log(`تم العثور على ${rfqPoMapping.size} طلب تسعير مرتبط بأوامر شراء`);
    
    // Get all quotations from database
    const quotations = await storage.getAllQuotationRequests();
    const quotationMap = new Map(quotations.map(q => [q.customRequestNumber!, q]));
    
    let createdPOs = 0;
    let totalPOItems = 0;
    let skippedRFQs = 0;
    
    for (const [rfqNumber, poData] of rfqPoMapping) {
      const quotation = quotationMap.get(rfqNumber);
      
      if (!quotation) {
        console.log(`⚠️ طلب التسعير غير موجود: ${rfqNumber}`);
        skippedRFQs++;
        continue;
      }
      
      console.log(`\n📋 معالجة طلب التسعير: ${rfqNumber}`);
      console.log(`   أوامر الشراء المرتبطة: ${poData.size}`);
      
      for (const [poNumber, poItems] of poData) {
        try {
          // Check if PO already exists
          const existingPOs = await storage.getAllPurchaseOrders();
          const existingPO = existingPOs.find(po => po.poNumber === poNumber);
          
          if (existingPO) {
            console.log(`   📦 أمر الشراء موجود مسبقاً: ${poNumber}`);
            continue;
          }
          
          // Calculate total value and get PO date
          const totalValue = poItems.reduce((sum, item) => 
            sum + ((item.price_po || 0) * (item.qty_po || 0)), 0);
          
          const poDate = poItems[0]?.date_po ? new Date(poItems[0].date_po) : new Date();
          
          // Create Purchase Order
          const newPO = await storage.createPurchaseOrder({
            poNumber: poNumber,
            quotationId: quotation.id,
            poDate: poDate.toISOString(),
            status: poItems[0]?.condition === 'منتهي' ? 'delivered' : 'pending',
            totalValue: totalValue.toString(),
            deliveryStatus: poItems[0]?.condition === 'منتهي',
            invoiceIssued: false,
            createdBy: '4964161e-b3a1-4e10-ac5b-9b728913bb6f'
          });
          
          console.log(`   ✅ تم إنشاء أمر الشراء: ${poNumber} (${totalValue.toFixed(2)} جنيه)`);
          createdPOs++;
          
          // Add PO items
          const allItems = await storage.getAllItems();
          let addedPOItems = 0;
          
          for (const itemData of poItems) {
            if (!itemData.qty_po || itemData.qty_po === 0) continue;
            
            // Find matching item by description and line_item
            const matchingItem = allItems.find(item => 
              item.description.includes(itemData.description.substring(0, 50)) &&
              item.lineItem === itemData.line_item
            );
            
            if (matchingItem) {
              await storage.addPurchaseOrderItem({
                poId: newPO.id,
                itemId: matchingItem.id,
                quantity: itemData.qty_po.toString(),
                unitPrice: (itemData.price_po || 0).toString(),
                totalPrice: ((itemData.price_po || 0) * itemData.qty_po).toString(),
                currency: 'EGP'
              });
              
              addedPOItems++;
              totalPOItems++;
            } else {
              console.log(`   ⚠️ لم يتم العثور على الصنف: ${itemData.description.substring(0, 30)}`);
            }
          }
          
          console.log(`     أصناف أمر الشراء: ${addedPOItems}`);
          
        } catch (error) {
          console.error(`   ❌ خطأ في إنشاء أمر الشراء ${poNumber}:`, error);
        }
      }
    }
    
    console.log(`\n🎉 اكتمل استيراد أوامر الشراء:`);
    console.log(`- أوامر الشراء المنشأة: ${createdPOs}`);
    console.log(`- أصناف أوامر الشراء: ${totalPOItems}`);
    console.log(`- طلبات التسعير المتجاهلة: ${skippedRFQs}`);
    console.log(`- تم ربط أوامر الشراء بطلبات التسعير بنجاح`);
    
  } catch (error) {
    console.error('خطأ في استيراد أوامر الشراء:', error);
  }
}

importPurchaseOrders();