import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage.js';

async function fixQuotationItems() {
  console.log('🔧 إصلاح ربط الأصناف بطلبات التسعير...');
  
  try {
    // Read structured pricing data
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'structured_pricing_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const structuredData = JSON.parse(rawData);
    
    // Get all quotations
    const allQuotations = await storage.getQuotations();
    console.log(`تم العثور على ${allQuotations.length} طلب تسعير`);
    
    // Get all items  
    const allItems = await storage.getAllItems();
    console.log(`تم العثور على ${allItems.length} صنف`);
    
    let itemsAdded = 0;
    let quotationsUpdated = 0;
    
    // Process each quotation from the data
    for (const quotationData of structuredData.quotations) {
      // Find matching quotation by RFQ number
      const quotation = allQuotations.find(
        (q: any) => q.customRequestNumber === quotationData.rfq_number
      );
      
      if (!quotation) {
        console.log(`لم يتم العثور على طلب التسعير: ${quotationData.rfq_number}`);
        continue;
      }
      
      // Check if quotation already has items
      const existingItems = await storage.getQuotationItems(quotation.id);
      if (existingItems.length > 0) {
        console.log(`طلب التسعير ${quotationData.rfq_number} يحتوي بالفعل على ${existingItems.length} صنف`);
        continue;
      }
      
      // Add items to quotation
      for (const itemData of quotationData.items) {
        // Find matching item
        let item = allItems.find(
          (i: any) => i.partNumber === itemData.part_number || 
          i.description === itemData.description
        );
        
        if (!item) {
          // Create new item if not found
          try {
            item = await storage.createItem({
              kItemId: await storage.getNextItemNumber(),
              partNumber: itemData.part_number || '',
              description: itemData.description || '',
              unit: itemData.uom || 'قطعة',
              category: itemData.category || 'عام',
              lineItem: itemData.line_item || '',
              createdBy: '4964161e-b3a1-4e10-ac5b-9b728913bb6f'
            });
            console.log(`تم إنشاء صنف جديد: ${itemData.description}`);
          } catch (error) {
            console.error(`خطأ في إنشاء الصنف: ${itemData.description}`, error);
            continue;
          }
        }
        
        // Add item to quotation
        try {
          await storage.addQuotationItem({
            quotationId: quotation.id,
            itemId: item.id,
            quantity: (itemData.qty || 1).toString(),
            unitPrice: (itemData.price_rfq || 0).toString(),
            totalPrice: ((itemData.price_rfq || 0) * (itemData.qty || 1)).toString(),
            currency: 'EGP'
          });
          
          itemsAdded++;
        } catch (error) {
          console.error(`خطأ في إضافة الصنف لطلب التسعير ${quotationData.rfq_number}:`, error);
        }
      }
      
      quotationsUpdated++;
      
      if (quotationsUpdated % 50 === 0) {
        console.log(`تم تحديث ${quotationsUpdated} طلب تسعير حتى الآن...`);
      }
    }
    
    console.log(`✅ تم الانتهاء من الإصلاح:`);
    console.log(`- طلبات التسعير المحدثة: ${quotationsUpdated}`);
    console.log(`- الأصناف المضافة: ${itemsAdded}`);
    
  } catch (error) {
    console.error('خطأ في إصلاح طلبات التسعير:', error);
  }
}

fixQuotationItems();