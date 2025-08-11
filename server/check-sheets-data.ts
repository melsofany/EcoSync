#!/usr/bin/env tsx

import { googleSheetsStorage } from './google-sheets-storage.js';

async function checkSheetsData() {
  try {
    console.log('🔍 فحص بيانات Google Sheets...');
    
    // فحص الأصناف
    console.log('\n📦 فحص ورقة الأصناف:');
    const items = await googleSheetsStorage.getAllItems();
    console.log(`عدد الأصناف: ${items.length}`);
    
    if (items.length > 0) {
      console.log('\n📋 عينة من أول 5 أصناف:');
      items.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. رقم الصنف: ${item.itemNumber || 'غير محدد'}`);
        console.log(`   رقم القطعة: ${item.partNumber || 'فارغ'}`);
        console.log(`   LINE ITEM: ${item.lineItem || 'فارغ'}`);
        console.log(`   الوصف: ${item.description?.substring(0, 80) || 'فارغ'}...`);
        console.log('---');
      });
      
      // إحصائيات أرقام القطع
      const itemsWithPartNumbers = items.filter(item => item.partNumber && item.partNumber !== '' && item.partNumber !== 'فارغ');
      const itemsWithoutPartNumbers = items.filter(item => !item.partNumber || item.partNumber === '' || item.partNumber === 'فارغ');
      
      console.log(`\n📊 إحصائيات أرقام القطع:`);
      console.log(`✅ أصناف لها أرقام قطع: ${itemsWithPartNumbers.length}`);
      console.log(`❌ أصناف بدون أرقام قطع: ${itemsWithoutPartNumbers.length}`);
      
      if (itemsWithoutPartNumbers.length > 0) {
        console.log('\n❌ عينة من الأصناف بدون أرقام قطع:');
        itemsWithoutPartNumbers.slice(0, 3).forEach((item, index) => {
          console.log(`${index + 1}. ${item.itemNumber}: "${item.partNumber}" - ${item.lineItem}`);
        });
      }
    }
    
    // فحص طلبات التسعير
    console.log('\n📋 فحص ورقة طلبات التسعير:');
    const quotations = await googleSheetsStorage.getAllQuotationRequests();
    console.log(`عدد طلبات التسعير: ${quotations.length}`);
    
    if (quotations.length > 0) {
      console.log('\n📋 عينة من أول 3 طلبات تسعير:');
      quotations.slice(0, 3).forEach((rfq, index) => {
        console.log(`${index + 1}. ${rfq.rfqNumber}: ${rfq.requestDate}`);
      });
    }
    
    // فحص أوامر الشراء
    console.log('\n🛒 فحص ورقة أوامر الشراء:');
    const purchaseOrders = await googleSheetsStorage.getAllPurchaseOrders();
    console.log(`عدد أوامر الشراء: ${purchaseOrders.length}`);
    
    if (purchaseOrders.length > 0) {
      console.log('\n🛒 عينة من أول 3 أوامر شراء:');
      purchaseOrders.slice(0, 3).forEach((po, index) => {
        console.log(`${index + 1}. ${po.poNumber}: ${po.orderDate}`);
      });
    }
    
    console.log('\n✅ انتهى فحص Google Sheets');
    
  } catch (error) {
    console.error('❌ خطأ في فحص Google Sheets:', error);
  }
}

// تشغيل الفحص
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSheetsData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ خطأ:', error);
    process.exit(1);
  });
}

export { checkSheetsData };