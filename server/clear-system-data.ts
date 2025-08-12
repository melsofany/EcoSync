// مسح البيانات من النظام
export function clearSystemData() {
  // إعادة تعيين البيانات المحلية
  const emptyData = {
    items: [],
    quotations: [],
    purchaseOrders: [],
    statistics: {
      totalItems: 0,
      totalQuotations: 0,
      totalPurchaseOrders: 0,
      totalValue: 0
    },
    lastUpdated: new Date().toISOString(),
    status: 'cleared'
  };
  
  return emptyData;
}

// تنظيف ذاكرة النظام
export function resetSystemMemory() {
  // إعادة تعيين المتغيرات العامة
  if (global.cachedData) {
    global.cachedData = null;
  }
  
  if (global.syncedItems) {
    global.syncedItems = [];
  }
  
  if (global.loadedQuotations) {
    global.loadedQuotations = [];
  }
  
  if (global.loadedPurchaseOrders) {
    global.loadedPurchaseOrders = [];
  }
  
  console.log('🧹 تم تنظيف ذاكرة النظام');
  return true;
}