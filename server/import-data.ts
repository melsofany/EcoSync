import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage.js';
import { nanoid } from 'nanoid';

interface ImportedItem {
  serial_number: number;
  description: string;
  part_number: string;
  line_item: string;
  uom: string;
  category: string;
  rfq: string;
  qty: number;
  price_rfq: number;
  po: string;
  qty_po: number;
  price_po: number;
  condition: string;
  buyer: string;
  note: string;
  date_rfq: string | null;
  date_po: string | null;
  res_date: string | null;
}

interface ImportedData {
  items: ImportedItem[];
  suppliers: string[];
  total_items: number;
}

export async function importExcelData() {
  try {
    console.log('بدء استيراد البيانات من ملف Excel...');
    
    // Use known admin user ID from database
    const adminUserId = '4964161e-b3a1-4e10-ac5b-9b728913bb6f';
    
    // Read processed data
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'processed_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const importData: ImportedData = JSON.parse(rawData);
    
    console.log(`جاري استيراد ${importData.items.length} بند...`);
    
    // Import suppliers first
    const supplierMap = new Map<string, string>();
    for (const supplierName of importData.suppliers) {
      if (supplierName && supplierName.trim()) {
        const supplierId = nanoid();
        await storage.createSupplier({
          name: supplierName,
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          notes: 'مستورد من ملف Excel'
        });
        supplierMap.set(supplierName, supplierId);
        console.log(`تم إنشاء المورد: ${supplierName}`);
      }
    }
    
    // Create a default client for imported data
    const defaultClientId = nanoid();
    await storage.createClient({
      name: 'العميل الافتراضي - بيانات مستوردة',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: 'عميل افتراضي للبيانات المستوردة من Excel'
    });
    
    // Import items
    let importedCount = 0;
    for (const itemData of importData.items) {
      try {
        const itemId = nanoid();
        
        // Create item
        await storage.createItem({
          createdBy: adminUserId,
          kItemId: `K${itemData.serial_number.toString().padStart(6, '0')}`,
          description: itemData.description || 'وصف غير متوفر',
          unit: itemData.uom || 'قطعة',
          brand: '',
          partNumber: itemData.part_number || '',
          lineItem: itemData.line_item || '',
          category: itemData.category || 'عام',
          notes: `${itemData.note ? itemData.note + ' - ' : ''}مستورد من Excel - الرقم التسلسلي: ${itemData.serial_number}`,
          status: 'pending'
        });
        
        // Add supplier pricing if available
        if (itemData.price_rfq > 0 && itemData.buyer && supplierMap.has(itemData.buyer)) {
          await storage.createSupplierPricing({
            createdBy: adminUserId,
            itemId: itemId,
            supplierId: supplierMap.get(itemData.buyer)!,
            unitPrice: itemData.price_rfq.toString(),
            priceReceivedDate: itemData.date_rfq || new Date().toISOString(),
            notes: `RFQ: ${itemData.rfq} - حالة: ${itemData.condition}`,
            currency: 'EGP',
            leadTime: '30 يوم',
            status: 'received'
          });
        }
        
        // Create quotation request if RFQ exists
        if (itemData.rfq && itemData.rfq !== '0') {
          // Check if quotation already exists
          const existingQuotations = await storage.getQuotationRequests();
          const existingQuotation = existingQuotations.find((q: any) => q.customRequestNumber === itemData.rfq);
          
          let quotationId: string;
          if (existingQuotation) {
            quotationId = existingQuotation.id;
          } else {
            quotationId = nanoid();
            await storage.createQuotationRequest({
              createdBy: adminUserId,
              clientId: defaultClientId,
              customRequestNumber: itemData.rfq,
              requestDate: itemData.date_rfq || new Date().toISOString(),
              status: itemData.condition === 'منتهي' ? 'completed' : 'pending',
              notes: `مستورد من Excel - تاريخ RFQ: ${itemData.date_rfq || 'غير محدد'}`
            });
          }
          
          // Add quotation item
          await storage.addItemToQuotation({
            quotationRequestId: quotationId,
            itemId: itemId,
            quantity: itemData.qty.toString(),
            notes: `PO: ${itemData.po || 'غير محدد'} - الكمية المطلوبة في PO: ${itemData.qty_po || 0}`
          });
        }
        
        importedCount++;
        if (importedCount % 10 === 0) {
          console.log(`تم استيراد ${importedCount} بند...`);
        }
        
      } catch (error) {
        console.error(`خطأ في استيراد البند ${itemData.serial_number}:`, error);
      }
    }
    
    console.log(`تم الانتهاء من الاستيراد. تم استيراد ${importedCount} بند بنجاح.`);
    console.log(`إجمالي البنود في الملف: ${importData.total_items}`);
    
    return {
      success: true,
      importedItems: importedCount,
      totalItems: importData.total_items,
      suppliersCreated: importData.suppliers.length
    };
    
  } catch (error) {
    console.error('خطأ في استيراد البيانات:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importExcelData().then(result => {
    console.log('نتيجة الاستيراد:', result);
    process.exit(0);
  }).catch(error => {
    console.error('فشل الاستيراد:', error);
    process.exit(1);
  });
}