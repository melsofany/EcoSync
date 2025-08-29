/**
 * نظام توحيد بسيط وفعال للمنتجات
 * يركز على الوصف بدلاً من أرقام القطع الفارغة
 */

interface SimpleItem {
  id: string;
  description: string;
  partNumber: string;
  lineItem: string;
}

interface UnificationGroup {
  masterId: string;
  items: SimpleItem[];
  reason: string;
  confidence: number;
}

export class SimpleUnificationEngine {
  private isRunning = false;
  private progress = 0;
  private totalItems = 0;
  private processedItems = 0;
  private foundGroups: UnificationGroup[] = [];

  async unifyItems(items: SimpleItem[]): Promise<{
    totalProcessed: number;
    groupsFound: number;
    itemsUnified: number;
    groups: UnificationGroup[];
  }> {
    this.isRunning = true;
    this.progress = 0;
    this.totalItems = items.length;
    this.processedItems = 0;
    this.foundGroups = [];

    console.log(`🚀 بدء التوحيد البسيط لـ ${items.length} منتج...`);

    // تجميع المنتجات حسب الوصف المنظف
    const groups = new Map<string, SimpleItem[]>();
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.processedItems = i + 1;
      this.progress = Math.round((i / items.length) * 100);

      if (i % 500 === 0) {
        console.log(`📊 معالجة: ${i + 1}/${items.length} (${this.progress}%)`);
      }

      // تنظيف الوصف للمقارنة
      const cleanDescription = this.cleanDescription(item.description);
      
      // تخطي الأوصاف الفارغة أو القصيرة جداً
      if (cleanDescription.length < 10) continue;

      // إضافة للمجموعة
      if (!groups.has(cleanDescription)) {
        groups.set(cleanDescription, []);
      }
      groups.get(cleanDescription)!.push(item);
    }

    // العثور على المجموعات التي بها أكثر من منتج واحد
    let totalUnified = 0;
    for (const [cleanDesc, groupItems] of groups) {
      if (groupItems.length > 1) {
        // اختيار المنتج الأول كمعرف رئيسي
        const masterId = groupItems[0].id;
        
        const group: UnificationGroup = {
          masterId,
          items: groupItems,
          reason: `وصف متطابق: ${groupItems.length} منتج`,
          confidence: 95
        };
        
        this.foundGroups.push(group);
        totalUnified += groupItems.length;
        
        console.log(`🔗 مجموعة جديدة: ${groupItems.length} منتج تحت ${masterId}`);
        console.log(`   الوصف: ${cleanDesc.substring(0, 50)}...`);
      }
    }

    this.progress = 100;
    this.isRunning = false;

    console.log(`✅ انتهى التوحيد: وُجدت ${this.foundGroups.length} مجموعة`);
    console.log(`📊 تم توحيد ${totalUnified} منتج`);

    return {
      totalProcessed: this.processedItems,
      groupsFound: this.foundGroups.length,
      itemsUnified: totalUnified,
      groups: this.foundGroups
    };
  }

  /**
   * تنظيف الوصف للمقارنة
   */
  private cleanDescription(description: string): string {
    if (!description) return '';
    
    return description
      .toLowerCase()
      .trim()
      // إزالة أرقام الكميات والوحدات
      .replace(/\b\d+\s*(pcs?|pieces?|قطعة|قطع)\b/gi, '')
      // إزالة المسافات الزائدة والرموز
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * حالة النظام
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      progress: this.progress,
      totalItems: this.totalItems,
      processedItems: this.processedItems,
      groupsFound: this.foundGroups.length
    };
  }

  /**
   * إيقاف النظام
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 تم إيقاف نظام التوحيد البسيط');
  }
}