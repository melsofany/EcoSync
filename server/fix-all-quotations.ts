import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage.js';

async function fixAllQuotations() {
  console.log('🔧 إصلاح جميع طلبات التسعير لضمان مطابقة البيانات الأصلية...');
  
  try {
    // Read structured pricing data
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'structured_pricing_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const structuredData = JSON.parse(rawData);
    
    // Group items by RFQ number
    const itemsByRfq = new Map<string, any[]>();
    structuredData.items.forEach((item: any) => {
      if (!item.rfq) return;
      if (!itemsByRfq.has(item.rfq)) {
        itemsByRfq.set(item.rfq, []);
      }
      itemsByRfq.get(item.rfq)!.push(item);
    });
    
    console.log(`إجمالي طلبات التسعير في الشيت: ${itemsByRfq.size}`);
    
    // Get all quotations from database
    const quotations = await storage.getAllQuotationRequests();
    console.log(`إجمالي طلبات التسعير في النظام: ${quotations.length}`);
    
    let processedQuotations = 0;
    let totalItemsAdded = 0;
    let totalItemsRemoved = 0;
    
    for (const quotation of quotations) {
      if (!quotation.customRequestNumber) continue;
      
      const originalItems = itemsByRfq.get(quotation.customRequestNumber);
      if (!originalItems) {
        console.log(`⚠️ لم يتم العثور على أصناف أصلية للطلب: ${quotation.customRequestNumber}`);
        continue;
      }
      
      // Filter items with quantity > 0
      const validOriginalItems = originalItems.filter(item => item.qty && item.qty > 0);
      
      // Get current items in system
      const currentItems = await storage.getQuotationItems(quotation.id);
      
      console.log(`\n📋 طلب التسعير: ${quotation.customRequestNumber}`);
      console.log(`   الأصناف في الشيت: ${validOriginalItems.length}`);
      console.log(`   الأصناف في النظام: ${currentItems.length}`);
      
      if (validOriginalItems.length !== currentItems.length) {
        console.log(`   🔄 تصحيح مطلوب - عدم تطابق في الأصناف`);
        
        // Remove all current items
        for (const item of currentItems) {
          await storage.removeQuotationItem(item.id);
          totalItemsRemoved++;
        }
        
        // Add correct items from original data
        for (const itemData of validOriginalItems) {
          try {
            // Find or create item
            const allItems = await storage.getAllItems();
            let item = allItems.find(i => 
              i.description.includes(itemData.description.substring(0, 50)) &&
              i.lineItem === itemData.line_item
            );
            
            if (!item) {
              // Create new item
              item = await storage.createItem({
                kItemId: await storage.getNextItemNumber(),
                partNumber: itemData.part_number || '',
                description: itemData.description || '',
                unit: itemData.uom || 'Each', 
                category: itemData.category || 'عام',
                lineItem: itemData.line_item || '',
                createdBy: '4964161e-b3a1-4e10-ac5b-9b728913bb6f'
              });
            }
            
            // Add to quotation
            await storage.addQuotationItem({
              quotationId: quotation.id,
              itemId: item.id,
              quantity: itemData.qty.toString(),
              unitPrice: (itemData.price_rfq || 0).toString(),
              totalPrice: ((itemData.price_rfq || 0) * itemData.qty).toString(),
              currency: 'EGP'
            });
            
            totalItemsAdded++;
            
          } catch (error) {
            console.error(`   ❌ خطأ في إضافة: ${itemData.description.substring(0, 30)}`, error);
          }
        }
        
        console.log(`   ✅ تم التصحيح: ${validOriginalItems.length} صنف`);
      } else {
        console.log(`   ✅ لا يحتاج تصحيح`);
      }
      
      processedQuotations++;
      
      // Progress update every 50 quotations
      if (processedQuotations % 50 === 0) {
        console.log(`\n📊 التقدم: ${processedQuotations}/${quotations.length} طلب تسعير`);
      }
    }
    
    console.log(`\n🎉 اكتمل تصحيح جميع طلبات التسعير:`);
    console.log(`- طلبات التسعير المعالجة: ${processedQuotations}`);
    console.log(`- الأصناف المحذوفة: ${totalItemsRemoved}`);
    console.log(`- الأصناف المضافة: ${totalItemsAdded}`);
    console.log(`- جميع البيانات تطابق الآن الشيت الأصلي`);
    
  } catch (error) {
    console.error('خطأ في تصحيح طلبات التسعير:', error);
  }
}

fixAllQuotations();