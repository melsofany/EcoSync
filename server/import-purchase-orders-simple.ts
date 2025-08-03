import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { quotationRequests, purchaseOrders, purchaseOrderItems, items, suppliers } from '../shared/schema';
import { eq } from 'drizzle-orm';

export async function importPurchaseOrdersSimple() {
  try {
    console.log('بدء استيراد أوامر الشراء...');
    
    // قراءة البيانات المهيكلة
    const dataPath = join(process.cwd(), '..', 'attached_assets', 'structured_pricing_data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const structuredData = JSON.parse(rawData);
    
    // استخراج أوامر الشراء الفريدة
    const uniquePOs = new Map<string, any>();
    const poItems = [];
    
    for (const item of structuredData.items) {
      if (item.po && item.po.trim() && item.qty_po > 0) {
        // إضافة أمر الشراء إلى القائمة الفريدة
        if (!uniquePOs.has(item.po)) {
          uniquePOs.set(item.po, {
            poNumber: item.po,
            date: item.date_po,
            condition: item.condition,
            buyer: item.buyer
          });
        }
        
        // إضافة بند أمر الشراء
        poItems.push({
          poNumber: item.po,
          rfqNumber: item.rfq,
          description: item.description,
          partNumber: item.part_number,
          lineItem: item.line_item,
          quantity: item.qty_po,
          unitPrice: item.price_po,
          totalPrice: item.total_po || (item.qty_po * item.price_po),
          condition: item.condition,
          buyer: item.buyer
        });
      }
    }
    
    console.log(`تم العثور على ${uniquePOs.size} أمر شراء فريد`);
    console.log(`تم العثور على ${poItems.length} بند أمر شراء`);
    
    // البحث عن مستخدم النظام
    const adminUserId = '4964161e-b3a1-4e10-ac5b-9b728913bb6f';
    
    let createdPOs = 0;
    let createdPOItems = 0;
    
    // إنشاء أوامر الشراء
    for (const [poNumber, poData] of uniquePOs) {
      try {
        // التحقق من وجود أمر الشراء
        const existingPO = await db.select().from(purchaseOrders).where(eq(purchaseOrders.poNumber, poNumber)).limit(1);
        
        if (existingPO.length > 0) {
          console.log(`أمر الشراء ${poNumber} موجود مسبقاً`);
          continue;
        }
        
        // البحث عن طلب التسعير المرتبط
        const relatedItems = poItems.filter(item => item.poNumber === poNumber);
        const firstRFQ = relatedItems[0]?.rfqNumber;
        
        let quotationId = null;
        if (firstRFQ) {
          const quotation = await db.select().from(quotationRequests)
            .where(eq(quotationRequests.customRequestNumber, firstRFQ))
            .limit(1);
          
          if (quotation.length > 0) {
            quotationId = quotation[0].id;
          }
        }
        
        // حساب القيمة الإجمالية
        const totalValue = relatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        
        // تحديد حالة التسليم
        const deliveryStatus = poData.condition === 'منتهي';
        
        // إنشاء أمر الشراء
        const insertedPO = await db.insert(purchaseOrders).values({
          poNumber: poNumber,
          quotationId: quotationId,
          poDate: poData.date ? new Date(poData.date) : new Date(),
          status: deliveryStatus ? 'delivered' : 'pending',
          totalValue: totalValue.toString(),
          deliveryStatus: deliveryStatus,
          createdBy: adminUserId
        }).returning({ id: purchaseOrders.id });
        
        const poId = insertedPO[0].id;
        createdPOs++;
        
        // إضافة بنود أمر الشراء
        for (const poItem of relatedItems) {
          try {
            // البحث عن البند في كتالوج الأصناف
            let itemId = null;
            
            // البحث بـ LINE ITEM أولاً
            if (poItem.lineItem) {
              const foundItem = await db.select().from(items)
                .where(eq(items.lineItem, poItem.lineItem))
                .limit(1);
              
              if (foundItem.length > 0) {
                itemId = foundItem[0].id;
              }
            }
            
            // إذا لم يوجد، البحث بالوصف
            if (!itemId) {
              const foundItem = await db.select().from(items)
                .where(eq(items.description, poItem.description))
                .limit(1);
              
              if (foundItem.length > 0) {
                itemId = foundItem[0].id;
              }
            }
            
            if (itemId) {
              await db.insert(purchaseOrderItems).values({
                poId: poId,
                itemId: itemId,
                quantity: poItem.quantity.toString(),
                unitPrice: poItem.unitPrice.toString(),
                totalPrice: (poItem.quantity * poItem.unitPrice).toString(),
                currency: 'EGP'
              });
              
              createdPOItems++;
            } else {
              console.log(`لم يتم العثور على البند: ${poItem.description}`);
            }
          } catch (error) {
            console.error(`خطأ في إضافة بند أمر الشراء:`, error);
          }
        }
        
        console.log(`تم إنشاء أمر الشراء ${poNumber} بقيمة ${totalValue} جنيه`);
        
      } catch (error) {
        console.error(`خطأ في إنشاء أمر الشراء ${poNumber}:`, error);
      }
    }
    
    console.log(`✅ تم إنشاء ${createdPOs} أمر شراء`);
    console.log(`✅ تم إنشاء ${createdPOItems} بند أمر شراء`);
    
    return {
      success: true,
      purchaseOrdersCreated: createdPOs,
      purchaseOrderItemsCreated: createdPOItems
    };
    
  } catch (error) {
    console.error('خطأ في استيراد أوامر الشراء:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// تشغيل الاستيراد مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  importPurchaseOrdersSimple().then(result => {
    console.log('نتيجة الاستيراد:', result);
    process.exit(0);
  }).catch(error => {
    console.error('فشل الاستيراد:', error);
    process.exit(1);
  });
}