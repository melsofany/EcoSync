import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

// واجهات البيانات
export interface ProductItem {
  itemNumber: string;
  description: string;
  partNumber: string;
  lineItem: string;
  uom: string;
  rfq: string;
}

export interface UnificationGroup {
  masterId: string;
  masterDescription: string;
  items: ProductItem[];
  similarity: number;
  reason: string;
}

export interface UnificationResult {
  success: boolean;
  totalItems: number;
  groupsFound: number;
  groups: UnificationGroup[];
  message?: string;
  processedCount?: number;
}

export class SemanticProductUnifier {
  private dataService: GoogleSheetsRealtimeData;
  private progressCallback?: (progress: number, message: string) => void;

  constructor(dataService: GoogleSheetsRealtimeData) {
    this.dataService = dataService;
  }

  // تعيين دالة متابعة التقدم
  setProgressCallback(callback: (progress: number, message: string) => void) {
    this.progressCallback = callback;
  }

  // الدالة الرئيسية للتوحيد
  async unifyItems(): Promise<UnificationResult> {
    try {
      this.updateProgress(0, 'بدء تحميل البيانات...');
      
      // تحميل البيانات
      const items = await this.dataService.getAllItems();
      console.log(`📊 تم تحميل ${items.length} بند للتحليل`);

      if (items.length === 0) {
        return {
          success: false,
          totalItems: 0,
          groupsFound: 0,
          groups: [],
          message: 'لا توجد بيانات للتوحيد'
        };
      }

      this.updateProgress(10, 'تحليل وفلترة البيانات...');
      
      // تنظيف وفلترة البيانات
      const cleanedItems = this.cleanAndFilterItems(items);
      console.log(`✨ تم تنظيف البيانات: ${cleanedItems.length} بند صالح للتحليل`);

      if (cleanedItems.length < 2) {
        return {
          success: false,
          totalItems: items.length,
          groupsFound: 0,
          groups: [],
          message: 'عدد البنود الصالحة للتحليل قليل جداً'
        };
      }

      this.updateProgress(20, 'بدء عملية التحليل الدلالي...');
      
      // البحث عن المجموعات المتطابقة
      const groups = await this.findSimilarGroups(cleanedItems);
      
      this.updateProgress(100, 'تم الانتهاء من التحليل');
      console.log(`✅ تم العثور على ${groups.length} مجموعة متطابقة`);

      return {
        success: true,
        totalItems: items.length,
        groupsFound: groups.length,
        groups: groups,
        processedCount: cleanedItems.length,
        message: groups.length > 0 ? 
          `تم العثور على ${groups.length} مجموعة منتجات متطابقة` :
          'لم يتم العثور على منتجات متطابقة'
      };

    } catch (error) {
      console.error('❌ خطأ في التوحيد:', error);
      return {
        success: false,
        totalItems: 0,
        groupsFound: 0,
        groups: [],
        message: `خطأ في التوحيد: ${(error as Error).message}`
      };
    }
  }

  // تنظيف وفلترة البيانات
  private cleanAndFilterItems(items: any[]): ProductItem[] {
    const uniqueItems = new Map<string, ProductItem>();
    let processedCount = 0;

    for (const item of items) {
      processedCount++;
      
      // تحديث التقدم
      if (processedCount % 500 === 0) {
        const progress = 10 + (processedCount / items.length) * 10;
        this.updateProgress(progress, `فلترة البيانات... ${processedCount}/${items.length}`);
      }

      // تجاهل البنود الفارغة أو قصيرة التوصيف
      const description = (item.description || '').trim();
      if (description.length < 10) continue;

      // تجاهل البنود المكررة بناءً على التوصيف
      const normalizedDesc = this.normalizeDescription(description);
      if (uniqueItems.has(normalizedDesc)) continue;

      // إنشاء بند منتج نظيف
      const productItem: ProductItem = {
        itemNumber: item.itemNumber || item.id || `ITEM-${processedCount}`,
        description: description,
        partNumber: (item.partNumber || '').trim(),
        lineItem: (item.lineItem || '').trim(),
        uom: (item.uom || '').trim(),
        rfq: (item.rfqNumber || '').trim()
      };

      uniqueItems.set(normalizedDesc, productItem);
    }

    return Array.from(uniqueItems.values());
  }

  // البحث عن المجموعات المتشابهة
  private async findSimilarGroups(items: ProductItem[]): Promise<UnificationGroup[]> {
    const groups: UnificationGroup[] = [];
    const processedItems = new Set<string>();
    let comparisons = 0;
    const maxComparisons = Math.min(items.length * 10, 5000); // تحديد عدد المقارنات

    console.log(`🔍 بدء البحث في ${items.length} منتج (حد أقصى ${maxComparisons} مقارنة)`);

    for (let i = 0; i < items.length && comparisons < maxComparisons; i++) {
      const item1 = items[i];
      
      if (processedItems.has(item1.itemNumber)) continue;

      const similarItems = [item1];
      processedItems.add(item1.itemNumber);

      // البحث عن منتجات مشابهة
      for (let j = i + 1; j < items.length && comparisons < maxComparisons; j++) {
        const item2 = items[j];
        
        if (processedItems.has(item2.itemNumber)) continue;

        comparisons++;
        
        // تحديث التقدم
        if (comparisons % 100 === 0) {
          const progress = 20 + (comparisons / maxComparisons) * 70;
          this.updateProgress(progress, `تحليل المنتجات... ${comparisons}/${maxComparisons}`);
        }

        // حساب التشابه
        const similarity = this.calculateSimilarity(item1, item2);
        
        if (similarity.score >= 0.7) { // عتبة التشابه
          console.log(`🎯 تطابق: ${item1.itemNumber} ↔ ${item2.itemNumber} (${similarity.score.toFixed(2)})`);
          similarItems.push(item2);
          processedItems.add(item2.itemNumber);
        }
      }

      // إنشاء مجموعة إذا وُجدت منتجات مشابهة
      if (similarItems.length > 1) {
        groups.push({
          masterId: item1.itemNumber,
          masterDescription: item1.description,
          items: similarItems,
          similarity: 0.9,
          reason: `${similarItems.length} منتج متشابه`
        });
      }
    }

    console.log(`📊 إجمالي المقارنات: ${comparisons}`);
    console.log(`📊 المجموعات المكتشفة: ${groups.length}`);

    return groups;
  }

  // حساب التشابه بين منتجين
  private calculateSimilarity(item1: ProductItem, item2: ProductItem): {score: number, reason: string} {
    let score = 0;
    const reasons: string[] = [];

    // مقارنة رقم القطعة (وزن 40%)
    if (item1.partNumber && item2.partNumber) {
      const partSim = this.comparePartNumbers(item1.partNumber, item2.partNumber);
      if (partSim > 0.8) {
        score += 0.4;
        reasons.push('رقم قطعة متطابق');
      }
    }

    // مقارنة التوصيف (وزن 60%)
    const descSim = this.compareDescriptions(item1.description, item2.description);
    score += descSim * 0.6;
    
    if (descSim > 0.7) {
      reasons.push('توصيف متشابه');
    }

    return {
      score,
      reason: reasons.length > 0 ? reasons.join(' + ') : 'تشابه ضعيف'
    };
  }

  // مقارنة أرقام القطع
  private comparePartNumbers(part1: string, part2: string): number {
    const norm1 = part1.replace(/[\s\-\_\.]/g, '').toUpperCase();
    const norm2 = part2.replace(/[\s\-\_\.]/g, '').toUpperCase();
    
    if (norm1 === norm2) return 1.0;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    return 0;
  }

  // مقارنة التوصيف
  private compareDescriptions(desc1: string, desc2: string): number {
    const words1 = this.extractKeywords(desc1);
    const words2 = this.extractKeywords(desc2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = (2 * commonWords.length) / (words1.length + words2.length);
    
    return Math.min(similarity, 1.0);
  }

  // استخراج الكلمات المفتاحية
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  // الكلمات المستبعدة
  private isStopWord(word: string): boolean {
    const stopWords = ['and', 'or', 'for', 'with', 'the', 'من', 'إلى', 'في', 'على', 'عن'];
    return stopWords.includes(word);
  }

  // تطبيع التوصيف
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // تحديث التقدم
  private updateProgress(progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback(Math.min(progress, 100), message);
    }
    console.log(`📈 ${progress.toFixed(0)}% - ${message}`);
  }
}