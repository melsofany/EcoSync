#!/usr/bin/env tsx

/**
 * مزامنة البيانات المحفوظة من قاعدة البيانات المؤقتة إلى Google Sheets
 */

import { readFileSync } from 'fs';
import { googleSheetsStorage } from './google-sheets-storage';

interface SavedRecord {
  id: string;
  uom?: string;
  lineItem?: string;
  description?: string;
  rfqNumber?: string;
  rfqDate?: string;
  rfqQuantity?: string;
  rfqPrice?: string;
  rfqResponseDate?: string;
  poNumber?: string;
  poDate?: string;
  poQuantity?: string;
  poPrice?: string;
}

async function syncSavedDataToSheets() {
  try {
    console.log('🔄 بدء مزامنة البيانات المحفوظة إلى Google Sheets...');

    // قراءة البيانات المحفوظة من قاعدة البيانات المؤقتة
    let savedData: SavedRecord[] = [];
    
    try {
      const tempDbData = readFileSync('./attached_assets/database_records.json', 'utf8');
      const parsedData = JSON.parse(tempDbData);
      savedData = parsedData || [];
      console.log(`📊 تم العثور على ${savedData.length} سجل محفوظ`);
    } catch (error) {
      console.log('❌ لا توجد بيانات محفوظة في قاعدة البيانات المؤقتة');
      return;
    }

    if (savedData.length === 0) {
      console.log('📭 لا توجد بيانات للمزامنة');
      return;
    }

    // تحويل البيانات إلى صيغة مناسبة لـ Google Sheets
    const itemsData = savedData.map((record, index) => ({
      id: record.id || `item-${index}`,
      itemNumber: `P-${(index + 1).toString().padStart(6, '0')}`,
      lineItem: record.lineItem || '',
      partNumber: '', // سيتم استخراجه من الوصف إذا لزم الأمر
      description: record.description || '',
      uom: record.uom || 'EACH',
      category: 'مستورد من قاعدة البيانات',
      createdAt: new Date().toISOString(),
      isActive: true
    }));

    // إنشاء طلبات التسعير وأوامر الشراء
    const rfqMap = new Map();
    const poMap = new Map();

    savedData.forEach((record, index) => {
      // طلبات التسعير
      const rfqNumber = record.rfqNumber;
      if (rfqNumber && rfqNumber.trim()) {
        const rfqId = rfqNumber.trim();
        if (!rfqMap.has(rfqId)) {
          rfqMap.set(rfqId, {
            id: `rfq-${rfqId}`,
            rfqNumber: rfqId,
            customRequestNumber: rfqId,
            requestDate: parseExcelDate(record.rfqDate),
            status: record.poNumber ? 'completed' : 'quoted',
            clientName: 'عميل من قاعدة البيانات',
            totalItems: 0,
            totalValue: 0,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            notes: 'طلب من قاعدة البيانات المحفوظة'
          });
        }
        
        const rfq = rfqMap.get(rfqId);
        rfq.totalItems++;
        const price = parseFloat(record.rfqPrice || '0');
        const quantity = parseFloat(record.rfqQuantity || '0');
        rfq.totalValue += (price * quantity);
      }

      // أوامر الشراء
      const poNumber = record.poNumber;
      if (poNumber && poNumber.trim()) {
        const poId = poNumber.trim();
        if (!poMap.has(poId)) {
          poMap.set(poId, {
            id: `po-${poId}`,
            poNumber: poId,
            quotationNumber: record.rfqNumber,
            orderDate: parseExcelDate(record.poDate),
            status: 'confirmed',
            supplierName: 'مورد من قاعدة البيانات',
            currency: 'EGP',
            deliveryStatus: 'pending',
            totalAmount: 0,
            itemsCount: 0
          });
        }
        
        const po = poMap.get(poId);
        const poPrice = parseFloat(record.poPrice || '0');
        const poQuantity = parseFloat(record.poQuantity || '0');
        po.totalAmount += (poPrice * poQuantity);
        po.itemsCount++;
      }
    });

    const quotationRequests = Array.from(rfqMap.values());
    const purchaseOrders = Array.from(poMap.values());

    console.log(`📋 إنشاء ${quotationRequests.length} طلب تسعير`);
    console.log(`🛒 إنشاء ${purchaseOrders.length} أمر شراء`);
    console.log(`📦 إنشاء ${itemsData.length} صنف`);

    // حفظ البيانات في Google Sheets
    console.log('🔄 بدء رفع البيانات إلى Google Sheets...');

    // رفع الأصناف
    if (itemsData.length > 0) {
      await googleSheetsStorage.saveItems(itemsData);
      console.log(`✅ تم رفع ${itemsData.length} صنف`);
    }

    // رفع طلبات التسعير
    if (quotationRequests.length > 0) {
      await googleSheetsStorage.saveQuotationRequests(quotationRequests);
      console.log(`✅ تم رفع ${quotationRequests.length} طلب تسعير`);
    }

    // رفع أوامر الشراء
    if (purchaseOrders.length > 0) {
      await googleSheetsStorage.savePurchaseOrders(purchaseOrders);
      console.log(`✅ تم رفع ${purchaseOrders.length} أمر شراء`);
    }

    console.log('🎉 اكتملت مزامنة جميع البيانات إلى Google Sheets');
    console.log('📊 يمكنك الآن مراجعة البيانات في Google Sheets');
    
    return {
      success: true,
      itemsCount: itemsData.length,
      quotationsCount: quotationRequests.length,
      purchaseOrdersCount: purchaseOrders.length
    };

  } catch (error) {
    console.error('❌ خطأ في مزامنة البيانات:', error);
    return {
      success: false,
      error: error.message || 'خطأ غير معروف'
    };
  }
}

// تحويل تاريخ Excel مع دعم صيغ متعددة
function parseExcelDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  // إذا كان نص تاريخ
  if (typeof dateValue === 'string') {
    const cleanDate = dateValue.trim();
    
    // صيغة MM/DD/YY مثل "1/5/25"
    const mmddyy = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (mmddyy) {
      const [, month, day, year] = mmddyy;
      const fullYear = `20${year}`; // تحويل 25 إلى 2025
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // صيغة MM/DD/YYYY مثل "1/5/2025"
    const mmddyyyy = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // محاولة تحليل التاريخ بطريقة عادية
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // إذا كان رقم (Excel date serial)
  if (typeof dateValue === 'number') {
    if (dateValue > 25000 && dateValue < 50000) {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

// تصدير دالة المزامنة للاستخدام من routes أخرى
export { syncSavedDataToSheets };

// تشغيل المزامنة عند تشغيل هذا الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  syncSavedDataToSheets().then(() => {
    console.log('✅ اكتملت عملية المزامنة');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ خطأ:', error);
    process.exit(1);
  });
}