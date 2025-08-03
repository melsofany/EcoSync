import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage.js';
import { nanoid } from 'nanoid';
import { analyzeItemsForDuplicates, type ItemForAnalysis, type AIAnalysisResult } from './ai-duplicate-detector.js';

interface ComprehensiveImportResult {
  success: boolean;
  totalProcessed: number;
  uniqueItemsImported: number;
  duplicatesDetected: number;
  suppliersCreated: number;
  aiAnalysis?: AIAnalysisResult;
  error?: string;
  batches: {
    processed: number;
    total: number;
  };
}

export async function importAllItemsWithAIAnalysis(): Promise<ComprehensiveImportResult> {
  try {
    console.log('بدء الاستيراد الشامل مع تحليل الذكاء الاصطناعي...');
    
    // Get admin user ID
    const adminUserId = '4964161e-b3a1-4e10-ac5b-9b728913bb6f';
    
    // Read complete processed data
    const dataPath = join(process.cwd(), 'attached_assets', 'complete_excel_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const completeData = JSON.parse(rawData);
    
    console.log(`البيانات المحملة: ${completeData.total_items} صنف`);
    console.log(`مرشحات التكرار: ${completeData.duplicate_candidates?.length || 0}`);
    
    // Create suppliers first
    const supplierMap = new Map<string, string>();
    let suppliersCreated = 0;
    
    for (const supplierName of completeData.suppliers) {
      if (supplierName && supplierName.trim()) {
        try {
          const supplier = await storage.createSupplier({
            name: supplierName,
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            notes: 'مستورد من ملف Excel شامل'
          });
          supplierMap.set(supplierName, supplier.id);
          suppliersCreated++;
          console.log(`تم إنشاء المورد: ${supplierName}`);
        } catch (error) {
          console.error(`خطأ في إنشاء المورد ${supplierName}:`, error);
        }
      }
    }
    
    // Create default client
    const defaultClient = await storage.createClient({
      name: 'العميل الافتراضي - استيراد شامل',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: 'عميل افتراضي للبيانات المستوردة الشاملة'
    });
    
    // Prepare items for AI analysis
    const itemsForAI: ItemForAnalysis[] = completeData.items.map((item: any) => ({
      id: nanoid(),
      serial_number: item.serial_number,
      description: item.description || '',
      part_number: item.part_number || '',
      line_item: item.line_item || '',
      category: item.category || 'عام'
    }));
    
    console.log('بدء تحليل الذكاء الاصطناعي للتكرارات...');
    
    // Process in smaller batches for AI analysis (100 items at a time)
    const batchSize = 100;
    let totalProcessed = 0;
    let uniqueItemsImported = 0;
    let duplicatesDetected = 0;
    const totalBatches = Math.ceil(itemsForAI.length / batchSize);
    
    // Track processed items to avoid duplicates
    const processedDescriptions = new Set<string>();
    const masterItems = new Map<string, string>(); // normalized description -> item ID
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, itemsForAI.length);
      const batch = itemsForAI.slice(batchStart, batchEnd);
      
      console.log(`معالجة الدفعة ${batchIndex + 1}/${totalBatches} (${batch.length} صنف)`);
      
      try {
        // Analyze current batch for duplicates
        const aiResult = await analyzeItemsForDuplicates(batch);
        
        // Process each item in the batch
        for (const aiItem of batch) {
          const originalItem = completeData.items.find((item: any) => item.serial_number === aiItem.serial_number);
          if (!originalItem) continue;
          
          // Create normalized description for duplicate checking
          const normalizedDesc = aiItem.description.toLowerCase().trim();
          
          // Check if this is a duplicate we should skip
          const duplicateGroup = aiResult.duplicateGroups.find(group => 
            group.duplicates.some(dup => dup.serial_number === aiItem.serial_number)
          );
          
          if (duplicateGroup) {
            // This is a duplicate, skip it but count it
            duplicatesDetected++;
            console.log(`تم تخطي التكرار: ${aiItem.description.substring(0, 50)}...`);
            continue;
          }
          
          // Check against previously processed items
          if (processedDescriptions.has(normalizedDesc)) {
            duplicatesDetected++;
            console.log(`تكرار محلي تم تخطيه: ${aiItem.description.substring(0, 50)}...`);
            continue;
          }
          
          try {
            // Create the item
            const newItem = await storage.createItem({
              createdBy: adminUserId,
              kItemId: `K${originalItem.serial_number.toString().padStart(6, '0')}`,
              description: originalItem.description || 'وصف غير متوفر',
              unit: originalItem.uom || 'قطعة',
              brand: '',
              partNumber: originalItem.part_number || '',
              lineItem: originalItem.line_item || '',
              category: originalItem.category || 'عام',
              notes: `مستورد شامل - رقم: ${originalItem.serial_number}${originalItem.note ? ' - ' + originalItem.note : ''}`,
              status: 'pending'
            });
            
            processedDescriptions.add(normalizedDesc);
            masterItems.set(normalizedDesc, newItem.id);
            uniqueItemsImported++;
            
            // Add supplier pricing if available
            if (originalItem.price_rfq > 0 && originalItem.buyer && supplierMap.has(originalItem.buyer)) {
              await storage.createSupplierPricing({
                createdBy: adminUserId,
                itemId: newItem.id,
                supplierId: supplierMap.get(originalItem.buyer)!,
                unitPrice: originalItem.price_rfq.toString(),
                priceReceivedDate: originalItem.date_rfq || new Date().toISOString(),
                notes: `RFQ: ${originalItem.rfq} - حالة: ${originalItem.condition}`,
                currency: 'EGP',
                leadTime: '30 يوم',
                status: 'received'
              });
            }
            
            // Create quotation if RFQ exists
            if (originalItem.rfq && originalItem.rfq !== '0') {
              try {
                const existingQuotations = await storage.getQuotations();
                let quotation = existingQuotations.find((q: any) => q.customRequestNumber === originalItem.rfq);
                
                if (!quotation) {
                  quotation = await storage.createQuotation({
                    createdBy: adminUserId,
                    clientId: defaultClient.id,
                    customRequestNumber: originalItem.rfq,
                    requestDate: originalItem.date_rfq || new Date().toISOString(),
                    status: originalItem.condition === 'منتهي' ? 'completed' : 'pending',
                    notes: `استيراد شامل - RFQ: ${originalItem.rfq}`
                  });
                }
                
                await storage.addQuotationItem({
                  quotationId: quotation.id,
                  itemId: newItem.id,
                  quantity: originalItem.qty.toString(),
                  notes: `PO: ${originalItem.po || 'غير محدد'}`
                });
              } catch (quotationError) {
                console.error(`خطأ في إنشاء طلب عرض أسعار للصنف ${originalItem.serial_number}:`, quotationError);
              }
            }
            
          } catch (itemError) {
            console.error(`خطأ في إنشاء الصنف ${originalItem.serial_number}:`, itemError);
          }
          
          totalProcessed++;
          
          // Progress logging every 50 items
          if (totalProcessed % 50 === 0) {
            console.log(`تم معالجة ${totalProcessed} صنف (${uniqueItemsImported} فريد، ${duplicatesDetected} تكرار)`);
          }
        }
        
      } catch (batchError) {
        console.error(`خطأ في معالجة الدفعة ${batchIndex + 1}:`, batchError);
      }
    }
    
    console.log(`انتهى الاستيراد الشامل:`);
    console.log(`- إجمالي المعالج: ${totalProcessed}`);
    console.log(`- الأصناف الفريدة المستوردة: ${uniqueItemsImported}`);
    console.log(`- التكرارات المكتشفة: ${duplicatesDetected}`);
    console.log(`- الموردين المنشأين: ${suppliersCreated}`);
    
    return {
      success: true,
      totalProcessed,
      uniqueItemsImported,
      duplicatesDetected,
      suppliersCreated,
      batches: {
        processed: totalBatches,
        total: totalBatches
      }
    };
    
  } catch (error: any) {
    console.error('خطأ في الاستيراد الشامل:', error);
    return {
      success: false,
      totalProcessed: 0,
      uniqueItemsImported: 0,
      duplicatesDetected: 0,
      suppliersCreated: 0,
      error: error.message || 'خطأ غير معروف',
      batches: {
        processed: 0,
        total: 0
      }
    };
  }
}

// Run comprehensive import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importAllItemsWithAIAnalysis().then(result => {
    console.log('نتيجة الاستيراد الشامل:', result);
    process.exit(0);
  }).catch(error => {
    console.error('فشل الاستيراد الشامل:', error);
    process.exit(1);
  });
}