import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage.js';

async function fixQuotation25R000244() {
  console.log('🔧 إصلاح الأصناف الصحيحة للطلب 25R000244...');
  
  try {
    // Read structured pricing data
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'structured_pricing_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const structuredData = JSON.parse(rawData);
    
    // Get correct items for 25R000244
    const correctItems = structuredData.items.filter((item: any) => item.rfq === '25R000244');
    console.log(`الأصناف الصحيحة للطلب 25R000244: ${correctItems.length} صنف`);
    
    // Get quotation ID
    const quotations = await storage.getAllQuotationRequests();
    const quotation = quotations.find(q => q.customRequestNumber === '25R000244');
    
    if (!quotation) {
      console.error('لم يتم العثور على طلب التسعير 25R000244');
      return;
    }
    
    console.log(`معرف طلب التسعير: ${quotation.id}`);
    
    // Delete all current items for this quotation
    const currentItems = await storage.getQuotationItems(quotation.id);
    console.log(`حذف ${currentItems.length} صنف حالي...`);
    
    for (const item of currentItems) {
      await storage.removeQuotationItem(item.id);
    }
    
    // Add correct items
    console.log('إضافة الأصناف الصحيحة...');
    let addedItems = 0;
    
    for (const itemData of correctItems) {
      if (!itemData.qty || itemData.qty === 0) continue; // Skip items with 0 quantity
      
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
        
        console.log(`✅ أُضيف: ${itemData.description.substring(0, 50)}... | QTY: ${itemData.qty} | PRICE: ${itemData.price_rfq}`);
        addedItems++;
        
      } catch (error) {
        console.error(`خطأ في إضافة الصنف: ${itemData.description.substring(0, 50)}`, error);
      }
    }
    
    console.log(`\n✅ تم الانتهاء من إصلاح طلب التسعير 25R000244:`);
    console.log(`- الأصناف المضافة: ${addedItems}`);
    console.log(`- تم حذف الأصناف الخاطئة وإضافة الأصناف الصحيحة من الشيت الأصلي`);
    
  } catch (error) {
    console.error('خطأ في إصلاح طلب التسعير:', error);
  }
}

fixQuotation25R000244();