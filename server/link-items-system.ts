import fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';

// نظام ربط الأصناف بطلبات التسعير وأوامر الشراء
class ItemLinkingSystem {
  private unifiedData: any[] = [];
  private itemsMap = new Map();
  private quotationsMap = new Map();
  private purchaseOrdersMap = new Map();

  constructor() {
    this.loadUnifiedData();
    this.buildMappings();
  }

  // تحميل البيانات الموحدة
  private loadUnifiedData() {
    console.log('📊 تحميل البيانات الموحدة...');
    this.unifiedData = JSON.parse(readFileSync('./attached_assets/database_records_unified.json', 'utf8'));
    console.log(`✅ تم تحميل ${this.unifiedData.length} عنصر موحد`);
  }

  // بناء خرائط الربط
  private buildMappings() {
    console.log('🔗 بناء خرائط الربط...');

    this.unifiedData.forEach((record, index) => {
      const itemId = `unified-item-${index + 1}`;
      const lineItem = record.lineItem || '';
      const partNo = record.partNumber || '';
      const description = record.description || '';
      const rfqNumber = record.rfqNumber || '';
      const poNumber = record.poNumber || '';

      // إنشاء معرف فريد للصنف
      const uniqueItemKey = `${lineItem}_${partNo}_${description.substring(0, 50)}`;

      // خريطة الأصناف
      if (!this.itemsMap.has(uniqueItemKey)) {
        this.itemsMap.set(uniqueItemKey, {
          id: itemId,
          lineItem: lineItem,
          partNumber: partNo,
          description: description,
          uom: record.uom || 'EACH',
          quotations: new Set(),
          purchaseOrders: new Set(),
          totalRFQs: 0,
          totalPOs: 0,
          averageRFQPrice: 0,
          averagePOPrice: 0,
          rfqPrices: [],
          poPrices: []
        });
      }

      const item = this.itemsMap.get(uniqueItemKey);

      // ربط طلبات التسعير
      if (rfqNumber && rfqNumber.trim()) {
        const rfqId = rfqNumber.trim();
        item.quotations.add(rfqId);
        item.totalRFQs++;
        
        const rfqPrice = parseFloat(record.rfqPrice || '0');
        const rfqQuantity = parseFloat(record.rfqQuantity || '0');
        
        if (rfqPrice > 0) {
          item.rfqPrices.push(rfqPrice);
        }

        // خريطة طلبات التسعير
        if (!this.quotationsMap.has(rfqId)) {
          this.quotationsMap.set(rfqId, {
            id: `rfq-${rfqId}`,
            rfqNumber: rfqId,
            requestDate: this.parseDate(record.rfqDate),
            responseDate: this.parseDate(record.rfqResponseDate),
            status: poNumber ? 'completed' : 'quoted',
            items: new Set(),
            totalItems: 0,
            totalValue: 0,
            linkedPOs: new Set()
          });
        }

        const quotation = this.quotationsMap.get(rfqId);
        quotation.items.add(itemId);
        quotation.totalItems++;
        quotation.totalValue += (rfqPrice * rfqQuantity);

        // ربط PO بـ RFQ إذا وجد
        if (poNumber && poNumber.trim()) {
          quotation.linkedPOs.add(poNumber.trim());
        }
      }

      // ربط أوامر الشراء
      if (poNumber && poNumber.trim()) {
        const poId = poNumber.trim();
        item.purchaseOrders.add(poId);
        item.totalPOs++;
        
        const poPrice = parseFloat(record.poPrice || '0');
        const poQuantity = parseFloat(record.poQuantity || '0');
        
        if (poPrice > 0) {
          item.poPrices.push(poPrice);
        }

        // خريطة أوامر الشراء
        if (!this.purchaseOrdersMap.has(poId)) {
          this.purchaseOrdersMap.set(poId, {
            id: `po-${poId}`,
            poNumber: poId,
            quotationNumber: rfqNumber || '',
            orderDate: this.parseDate(record.poDate),
            status: 'confirmed',
            items: new Set(),
            totalItems: 0,
            totalAmount: 0,
            supplierName: 'مورد من البيانات',
            currency: 'EGP'
          });
        }

        const purchaseOrder = this.purchaseOrdersMap.get(poId);
        purchaseOrder.items.add(itemId);
        purchaseOrder.totalItems++;
        purchaseOrder.totalAmount += (poPrice * poQuantity);
      }
    });

    // حساب المتوسطات
    this.itemsMap.forEach(item => {
      if (item.rfqPrices.length > 0) {
        item.averageRFQPrice = item.rfqPrices.reduce((sum, price) => sum + price, 0) / item.rfqPrices.length;
      }
      if (item.poPrices.length > 0) {
        item.averagePOPrice = item.poPrices.reduce((sum, price) => sum + price, 0) / item.poPrices.length;
      }
    });

    console.log(`✅ تم بناء الخرائط:`);
    console.log(`📦 الأصناف: ${this.itemsMap.size}`);
    console.log(`📋 طلبات التسعير: ${this.quotationsMap.size}`);
    console.log(`🛒 أوامر الشراء: ${this.purchaseOrdersMap.size}`);
  }

  // تحليل الروابط
  analyzeLinks() {
    console.log('\n🔍 تحليل الروابط...');

    const linkStats = {
      totalItems: this.itemsMap.size,
      itemsWithRFQs: 0,
      itemsWithPOs: 0,
      itemsWithBoth: 0,
      totalRFQs: this.quotationsMap.size,
      totalPOs: this.purchaseOrdersMap.size,
      linkedRFQPairs: 0,
      averageItemsPerRFQ: 0,
      averageItemsPerPO: 0
    };

    // تحليل الأصناف
    this.itemsMap.forEach(item => {
      if (item.totalRFQs > 0) linkStats.itemsWithRFQs++;
      if (item.totalPOs > 0) linkStats.itemsWithPOs++;
      if (item.totalRFQs > 0 && item.totalPOs > 0) linkStats.itemsWithBoth++;
    });

    // تحليل الروابط بين RFQ و PO
    this.quotationsMap.forEach(rfq => {
      if (rfq.linkedPOs.size > 0) {
        linkStats.linkedRFQPairs++;
      }
    });

    // حساب المتوسطات
    let totalRFQItems = 0;
    let totalPOItems = 0;
    
    this.quotationsMap.forEach(rfq => totalRFQItems += rfq.totalItems);
    this.purchaseOrdersMap.forEach(po => totalPOItems += po.totalItems);
    
    linkStats.averageItemsPerRFQ = linkStats.totalRFQs > 0 ? totalRFQItems / linkStats.totalRFQs : 0;
    linkStats.averageItemsPerPO = linkStats.totalPOs > 0 ? totalPOItems / linkStats.totalPOs : 0;

    console.log('📊 إحصائيات الروابط:');
    console.log(`📦 الأصناف الإجمالية: ${linkStats.totalItems}`);
    console.log(`📋 أصناف مع طلبات تسعير: ${linkStats.itemsWithRFQs} (${((linkStats.itemsWithRFQs / linkStats.totalItems) * 100).toFixed(1)}%)`);
    console.log(`🛒 أصناف مع أوامر شراء: ${linkStats.itemsWithPOs} (${((linkStats.itemsWithPOs / linkStats.totalItems) * 100).toFixed(1)}%)`);
    console.log(`🔗 أصناف مع كلاهما: ${linkStats.itemsWithBoth} (${((linkStats.itemsWithBoth / linkStats.totalItems) * 100).toFixed(1)}%)`);
    console.log(`📋 طلبات التسعير: ${linkStats.totalRFQs}`);
    console.log(`🛒 أوامر الشراء: ${linkStats.totalPOs}`);
    console.log(`🔗 طلبات تسعير مربوطة بأوامر شراء: ${linkStats.linkedRFQPairs}`);
    console.log(`📊 متوسط الأصناف لكل طلب تسعير: ${linkStats.averageItemsPerRFQ.toFixed(1)}`);
    console.log(`📊 متوسط الأصناف لكل أمر شراء: ${linkStats.averageItemsPerPO.toFixed(1)}`);

    return linkStats;
  }

  // تصدير البيانات المربوطة
  exportLinkedData() {
    console.log('\n💾 تصدير البيانات المربوطة...');

    // تحويل الخرائط إلى مصفوفات
    const items = Array.from(this.itemsMap.values()).map(item => ({
      ...item,
      quotations: Array.from(item.quotations),
      purchaseOrders: Array.from(item.purchaseOrders)
    }));

    const quotations = Array.from(this.quotationsMap.values()).map(rfq => ({
      ...rfq,
      items: Array.from(rfq.items),
      linkedPOs: Array.from(rfq.linkedPOs)
    }));

    const purchaseOrders = Array.from(this.purchaseOrdersMap.values()).map(po => ({
      ...po,
      items: Array.from(po.items)
    }));

    const linkedSystemData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalItems: items.length,
        totalQuotations: quotations.length,
        totalPurchaseOrders: purchaseOrders.length,
        linkingMethod: 'unified_data_mapping'
      },
      items: items,
      quotations: quotations,
      purchaseOrders: purchaseOrders
    };

    // حفظ البيانات المربوطة
    writeFileSync('./attached_assets/linked_system_data.json', JSON.stringify(linkedSystemData, null, 2));
    
    console.log('✅ تم تصدير البيانات المربوطة إلى linked_system_data.json');
    return linkedSystemData;
  }

  // تحديث النظام بالبيانات المربوطة
  async updateSystemStorage() {
    console.log('\n🔄 تحديث تخزين النظام...');

    const linkedData = this.exportLinkedData();
    
    // إنشاء تحديث لملف التخزين
    const systemUpdate = `
// تحديث تلقائي للنظام - البيانات المربوطة
// تم إنشاؤه في: ${new Date().toISOString()}

export const LINKED_ITEMS_COUNT = ${linkedData.items.length};
export const LINKED_QUOTATIONS_COUNT = ${linkedData.quotations.length};
export const LINKED_PURCHASE_ORDERS_COUNT = ${linkedData.purchaseOrders.length};

// إحصائيات الربط
export const LINKING_STATS = {
  totalItems: ${linkedData.items.length},
  totalQuotations: ${linkedData.quotations.length},
  totalPurchaseOrders: ${linkedData.purchaseOrders.length},
  lastUpdated: '${new Date().toISOString()}'
};

// البيانات المربوطة متاحة في: ./attached_assets/linked_system_data.json
`;

    writeFileSync('./attached_assets/system_linking_update.ts', systemUpdate);
    
    console.log('✅ تم تحديث النظام بالبيانات المربوطة');
    console.log('📁 ملفات الإخراج:');
    console.log('   - linked_system_data.json: البيانات المربوطة الكاملة');
    console.log('   - system_linking_update.ts: تحديث النظام');
  }

  // تحليل تفصيلي للروابط المعقدة
  analyzeComplexLinks() {
    console.log('\n🔬 تحليل تفصيلي للروابط المعقدة...');

    const complexAnalysis = {
      multiRFQItems: [],
      multiPOItems: [],
      highValueItems: [],
      orphanRFQs: [],
      orphanPOs: []
    };

    // الأصناف مع طلبات تسعير متعددة
    this.itemsMap.forEach(item => {
      if (item.totalRFQs > 1) {
        complexAnalysis.multiRFQItems.push({
          id: item.id,
          lineItem: item.lineItem,
          rfqCount: item.totalRFQs,
          averagePrice: item.averageRFQPrice
        });
      }

      if (item.totalPOs > 1) {
        complexAnalysis.multiPOItems.push({
          id: item.id,
          lineItem: item.lineItem,
          poCount: item.totalPOs,
          averagePrice: item.averagePOPrice
        });
      }

      if (item.averageRFQPrice > 1000 || item.averagePOPrice > 1000) {
        complexAnalysis.highValueItems.push({
          id: item.id,
          lineItem: item.lineItem,
          rfqPrice: item.averageRFQPrice,
          poPrice: item.averagePOPrice
        });
      }
    });

    // طلبات التسعير بدون أوامر شراء
    this.quotationsMap.forEach(rfq => {
      if (rfq.linkedPOs.size === 0) {
        complexAnalysis.orphanRFQs.push({
          rfqNumber: rfq.rfqNumber,
          totalValue: rfq.totalValue,
          itemsCount: rfq.totalItems
        });
      }
    });

    console.log('🔬 نتائج التحليل المعقد:');
    console.log(`📦 أصناف مع طلبات تسعير متعددة: ${complexAnalysis.multiRFQItems.length}`);
    console.log(`🛒 أصناف مع أوامر شراء متعددة: ${complexAnalysis.multiPOItems.length}`);
    console.log(`💎 أصناف عالية القيمة: ${complexAnalysis.highValueItems.length}`);
    console.log(`📋 طلبات تسعير بدون أوامر شراء: ${complexAnalysis.orphanRFQs.length}`);

    writeFileSync('./attached_assets/complex_links_analysis.json', JSON.stringify(complexAnalysis, null, 2));
    console.log('✅ تم حفظ التحليل المعقد في complex_links_analysis.json');

    return complexAnalysis;
  }

  // تشغيل النظام الكامل
  async runCompleteAnalysis() {
    console.log('🚀 تشغيل النظام الكامل لربط الأصناف...');
    
    const linkStats = this.analyzeLinks();
    const linkedData = this.exportLinkedData();
    const complexAnalysis = this.analyzeComplexLinks();
    await this.updateSystemStorage();

    console.log('\n🎯 ملخص النظام الكامل:');
    console.log(`📊 تم ربط ${linkStats.totalItems} صنف موحد`);
    console.log(`🔗 معدل الربط: ${((linkStats.itemsWithBoth / linkStats.totalItems) * 100).toFixed(1)}%`);
    console.log(`📋 ${linkStats.totalRFQs} طلب تسعير`);
    console.log(`🛒 ${linkStats.totalPOs} أمر شراء`);
    console.log(`✅ النظام جاهز للاستخدام مع البيانات المربوطة`);

    return {
      linkStats,
      linkedData,
      complexAnalysis
    };
  }

  private parseDate(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      if (typeof dateValue === 'string') {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0');
          const day = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      
      if (typeof dateValue === 'number') {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      return new Date(dateValue).toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }
}

export default ItemLinkingSystem;

// تشغيل مباشر
if (import.meta.url === `file://${process.argv[1]}`) {
  const linkingSystem = new ItemLinkingSystem();
  linkingSystem.runCompleteAnalysis().then(() => {
    console.log('🎯 اكتمل ربط الأصناف بالنظام!');
  }).catch(error => {
    console.error('❌ خطأ في ربط الأصناف:', error.message);
  });
}