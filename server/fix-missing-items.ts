import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage.js';

async function fixMissingQuotationItems() {
  console.log('🔧 إصلاح الأصناف المفقودة في طلبات التسعير...');
  
  try {
    // Read structured pricing data
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'structured_pricing_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const structuredData = JSON.parse(rawData);
    
    console.log(`البيانات المحملة: ${structuredData.items?.length || 0} صنف`);
    console.log(`طلبات التسعير: ${structuredData.quotations?.length || 0}`);
    
    // Get quotations without items
    const quotationsWithoutItems = await storage.getAllQuotationRequests();
    let fixedQuotations = 0;
    let addedItems = 0;
    
    // Process each quotation without items
    for (const quotation of quotationsWithoutItems) {
      const existingItems = await storage.getQuotationItems(quotation.id);
      if (existingItems.length > 0) continue; // Skip if already has items
      
      // Find matching quotation in structured data
      const quotationData = structuredData.quotations?.find(
        (q: any) => q.rfq_number === quotation.customRequestNumber
      );
      
      if (!quotationData || !quotationData.items?.length) continue;
      
      console.log(`إضافة ${quotationData.items.length} صنف لطلب التسعير ${quotation.customRequestNumber}`);
      
      // Add items to quotation
      for (const itemData of quotationData.items) {
        try {
          // Find or create item
          const allItems = await storage.getAllItems();
          let item = allItems.find(i => i.partNumber === itemData.part_number);
          if (!item) {
            item = allItems.find(i => i.description === itemData.description);
          }
          
          if (!item) {
            // Create new item
            item = await storage.createItem({
              kItemId: await storage.getNextItemNumber(),
              partNumber: itemData.part_number || '',
              description: itemData.description || '',
              unit: itemData.uom || 'قطعة', 
              category: itemData.category || 'عام',
              lineItem: itemData.line_item || '',
              createdBy: '4964161e-b3a1-4e10-ac5b-9b728913bb6f'
            });
          }
          
          // Add to quotation
          await storage.addQuotationItem({
            quotationId: quotation.id,
            itemId: item.id,
            quantity: (itemData.qty || 1).toString(),
            unitPrice: (itemData.price_rfq || 0).toString(),
            totalPrice: ((itemData.price_rfq || 0) * (itemData.qty || 1)).toString(),
            currency: 'EGP'
          });
          
          addedItems++;
        } catch (error) {
          console.error(`خطأ في إضافة الصنف: ${itemData.description}`, error);
        }
      }
      
      fixedQuotations++;
      
      if (fixedQuotations % 20 === 0) {
        console.log(`تم إصلاح ${fixedQuotations} طلب تسعير حتى الآن...`);
      }
      
      // Break after fixing 50 quotations to avoid timeout
      if (fixedQuotations >= 50) break;
    }
    
    console.log(`✅ تم الانتهاء من الإصلاح:`);
    console.log(`- طلبات التسعير المُصلحة: ${fixedQuotations}`);
    console.log(`- الأصناف المضافة: ${addedItems}`);
    
  } catch (error) {
    console.error('خطأ في إصلاح طلبات التسعير:', error);
  }
}

fixMissingQuotationItems();