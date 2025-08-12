import { readFileSync } from 'fs';
import path from 'path';

// نظام التخزين المربوط للأصناف وطلبات التسعير وأوامر الشراء
class LinkedStorage {
  private linkedData: any = null;
  private dataPath = './attached_assets/linked_system_original_complete.json';

  constructor() {
    this.loadLinkedData();
  }

  // تحميل البيانات المربوطة
  private loadLinkedData() {
    try {
      const data = readFileSync(this.dataPath, 'utf8');
      const parsedData = JSON.parse(data);
      
      // التحقق من حالة البيانات
      if (parsedData.status === 'completely_empty' || !parsedData.items || parsedData.items.length === 0) {
        console.log('🚫 البيانات المربوطة فارغة');
        this.linkedData = { items: [], quotations: [], purchaseOrders: [], summary: { totalItems: 0 } };
        return;
      }
      
      this.linkedData = parsedData;
      console.log(`🔗 تم تحميل البيانات المربوطة: ${this.linkedData.summary?.totalItems || 0} صنف`);
    } catch (error) {
      console.log('📭 البيانات المربوطة فارغة');
      this.linkedData = { items: [], quotations: [], purchaseOrders: [], summary: { totalItems: 0 } };
    }
  }

  // الحصول على جميع الأصناف
  async getAllItems() {
    return this.linkedData?.items || [];
  }

  // الحصول على صنف بالمعرف
  async getItem(id: string) {
    const items = this.linkedData?.items || [];
    return items.find((item: any) => item.id === id);
  }

  // البحث في الأصناف
  async searchItems(searchTerm: string) {
    const items = this.linkedData?.items || [];
    const term = searchTerm.toLowerCase();
    
    return items.filter((item: any) => 
      item.lineItem?.toLowerCase().includes(term) ||
      item.partNumber?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }

  // الحصول على جميع طلبات التسعير
  async getAllQuotationRequests() {
    return this.linkedData?.quotations || [];
  }

  // الحصول على طلب تسعير بالمعرف
  async getQuotationRequest(id: string) {
    const quotations = this.linkedData?.quotations || [];
    return quotations.find((rfq: any) => rfq.id === id || rfq.rfqNumber === id);
  }

  // الحصول على أصناف طلب التسعير
  async getQuotationItems(quotationId: string) {
    const quotation = await this.getQuotationRequest(quotationId);
    if (!quotation) return [];

    const items = this.linkedData?.items || [];
    return quotation.items.map((itemId: string) => 
      items.find((item: any) => item.id === itemId)
    ).filter(Boolean);
  }

  // الحصول على جميع أوامر الشراء
  async getAllPurchaseOrders() {
    return this.linkedData?.purchaseOrders || [];
  }

  // الحصول على أمر شراء بالمعرف
  async getPurchaseOrder(id: string) {
    const orders = this.linkedData?.purchaseOrders || [];
    return orders.find((po: any) => po.id === id || po.poNumber === id);
  }

  // الحصول على أصناف أمر الشراء
  async getPurchaseOrderItems(orderId: string) {
    const order = await this.getPurchaseOrder(orderId);
    if (!order) return [];

    const items = this.linkedData?.items || [];
    return order.items.map((itemId: string) => 
      items.find((item: any) => item.id === itemId)
    ).filter(Boolean);
  }

  // إحصائيات النظام
  async getSystemStatistics() {
    const items = this.linkedData?.items || [];
    const quotations = this.linkedData?.quotations || [];
    const purchaseOrders = this.linkedData?.purchaseOrders || [];

    const itemsWithRFQ = items.filter((item: any) => item.totalRFQs > 0).length;
    const itemsWithPO = items.filter((item: any) => item.totalPOs > 0).length;
    const itemsWithBoth = items.filter((item: any) => item.totalRFQs > 0 && item.totalPOs > 0).length;

    const linkedRFQs = quotations.filter((rfq: any) => rfq.linkedPOs.length > 0).length;

    return {
      totalItems: items.length,
      totalQuotations: quotations.length,
      totalPurchaseOrders: purchaseOrders.length,
      itemsWithRFQ,
      itemsWithPO,
      itemsWithBoth,
      linkedRFQs,
      linkingRate: items.length > 0 ? (itemsWithBoth / items.length * 100).toFixed(1) : 0,
      lastUpdated: this.linkedData?.timestamp || new Date().toISOString()
    };
  }

  // البحث المتقدم
  async advancedSearch(filters: any) {
    const items = this.linkedData?.items || [];
    let results = [...items];

    if (filters.partNumber) {
      results = results.filter((item: any) => 
        item.partNumber?.toLowerCase().includes(filters.partNumber.toLowerCase())
      );
    }

    if (filters.hasRFQ !== undefined) {
      results = results.filter((item: any) => 
        filters.hasRFQ ? item.totalRFQs > 0 : item.totalRFQs === 0
      );
    }

    if (filters.hasPO !== undefined) {
      results = results.filter((item: any) => 
        filters.hasPO ? item.totalPOs > 0 : item.totalPOs === 0
      );
    }

    if (filters.priceRange) {
      results = results.filter((item: any) => {
        const price = item.averageRFQPrice || item.averagePOPrice || 0;
        return price >= (filters.priceRange.min || 0) && 
               price <= (filters.priceRange.max || Infinity);
      });
    }

    return results;
  }

  // تحليل الروابط
  async analyzeLinkage() {
    const items = this.linkedData?.items || [];
    const quotations = this.linkedData?.quotations || [];
    const purchaseOrders = this.linkedData?.purchaseOrders || [];

    // أصناف عالية القيمة
    const highValueItems = items
      .filter((item: any) => item.averageRFQPrice > 1000 || item.averagePOPrice > 1000)
      .sort((a: any, b: any) => (b.averageRFQPrice || 0) - (a.averageRFQPrice || 0));

    // طلبات تسعير بدون أوامر شراء
    const orphanQuotations = quotations.filter((rfq: any) => rfq.linkedPOs.length === 0);

    // أوامر شراء كبيرة
    const largeOrders = purchaseOrders
      .filter((po: any) => po.totalAmount > 5000)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount);

    return {
      highValueItems: highValueItems.slice(0, 10),
      orphanQuotations: orphanQuotations.slice(0, 20),
      largeOrders: largeOrders.slice(0, 10),
      summary: {
        totalHighValue: highValueItems.length,
        totalOrphans: orphanQuotations.length,
        totalLargeOrders: largeOrders.length
      }
    };
  }

  // إعادة تحميل البيانات
  async reloadData() {
    this.loadLinkedData();
    return await this.getSystemStatistics();
  }
}

export const linkedStorage = new LinkedStorage();
export default LinkedStorage;