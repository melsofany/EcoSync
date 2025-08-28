import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

export interface DuplicateItem {
  itemNumber: string;
  description: string;
  partNumber: string;
  lineItem: string;
  rowIndex: number;
}

export interface UnificationGroup {
  masterItem: DuplicateItem;
  duplicates: DuplicateItem[];
  reason: string;
}

export interface UnificationResult {
  totalProcessed: number;
  groupsFound: number;
  itemsUnified: number;
  details: UnificationGroup[];
}

export class SimpleIdentifierUnifier {
  private googleSheetsData: GoogleSheetsRealtimeData;
  private isRunning = false;
  private progress = 0;

  constructor() {
    this.googleSheetsData = new GoogleSheetsRealtimeData();
  }

  async unifyDuplicateIdentifiers(): Promise<UnificationResult> {
    if (this.isRunning) {
      throw new Error('عملية التوحيد قيد التشغيل بالفعل');
    }

    this.isRunning = true;
    this.progress = 0;

    try {
      console.log('🔄 بدء عملية توحيد المعرفات...');

      // 1. جلب جميع البيانات
      this.progress = 10;
      const allData = await this.getAllItems();
      console.log(`📊 تم جلب ${allData.length} بند`);

      // 2. العثور على المجموعات المكررة
      this.progress = 30;
      const duplicateGroups = this.findDuplicateGroups(allData);
      console.log(`🔍 تم العثور على ${duplicateGroups.length} مجموعة مكررة`);

      // 3. توحيد المعرفات
      this.progress = 50;
      let totalUnified = 0;
      
      for (const group of duplicateGroups) {
        await this.unifyGroup(group);
        totalUnified += group.duplicates.length;
        console.log(`✅ تم توحيد ${group.duplicates.length} بند تحت المعرف: ${group.masterItem.itemNumber}`);
      }

      this.progress = 100;
      this.isRunning = false;

      const result: UnificationResult = {
        totalProcessed: allData.length,
        groupsFound: duplicateGroups.length,
        itemsUnified: totalUnified,
        details: duplicateGroups
      };

      console.log(`🎯 انتهى التوحيد: ${totalUnified} بند تم توحيده في ${duplicateGroups.length} مجموعة`);
      return result;

    } catch (error) {
      this.isRunning = false;
      this.progress = 0;
      console.error('❌ خطأ في توحيد المعرفات:', error);
      throw error;
    }
  }

  private async getAllItems(): Promise<DuplicateItem[]> {
    const rawData = await this.googleSheetsData.readDataSheet();
    
    return rawData.map((row: any[], index: number) => ({
      itemNumber: row[0] || `P-${String(index + 2).padStart(7, '0')}`, // العمود A
      description: row[4] || '', // العمود E
      partNumber: row[1] || '', // العمود B
      lineItem: row[2] || '', // العمود C
      rowIndex: index + 2 // رقم الصف في Google Sheets
    })).filter(item => item.description.trim() !== '');
  }

  private findDuplicateGroups(items: DuplicateItem[]): UnificationGroup[] {
    const groups: UnificationGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      
      if (processed.has(currentItem.itemNumber)) continue;

      const duplicates: DuplicateItem[] = [];
      
      // البحث عن البنود المشابهة
      for (let j = i + 1; j < items.length; j++) {
        const otherItem = items[j];
        
        if (processed.has(otherItem.itemNumber)) continue;

        if (this.areItemsSimilar(currentItem, otherItem)) {
          duplicates.push(otherItem);
          processed.add(otherItem.itemNumber);
        }
      }

      if (duplicates.length > 0) {
        groups.push({
          masterItem: currentItem,
          duplicates,
          reason: this.getSimilarityReason(currentItem, duplicates[0])
        });
        processed.add(currentItem.itemNumber);
      }
    }

    return groups;
  }

  private areItemsSimilar(item1: DuplicateItem, item2: DuplicateItem): boolean {
    // 1. نفس LINE ITEM
    if (item1.lineItem && item2.lineItem && 
        this.normalizeText(item1.lineItem) === this.normalizeText(item2.lineItem)) {
      return true;
    }

    // 2. نفس رقم الجزء (مع التطبيع)
    if (item1.partNumber && item2.partNumber && 
        this.normalizePartNumber(item1.partNumber) === this.normalizePartNumber(item2.partNumber)) {
      return true;
    }

    // 3. أوصاف متشابهة جداً (نفس الكلمات الأساسية)
    if (this.getDescriptionSimilarity(item1.description, item2.description) > 0.9) {
      return true;
    }

    // 4. حالات خاصة مثل شنايدر LC1D 32M7
    if (this.isSpecialCase(item1, item2)) {
      return true;
    }

    return false;
  }

  private normalizeText(text: string): string {
    return text.toUpperCase().replace(/[^\w\d]/g, '').trim();
  }

  private normalizePartNumber(partNumber: string): string {
    return partNumber.toUpperCase()
      .replace(/[^\w\d]/g, '') // إزالة المسافات والرموز
      .replace(/\s+/g, '')     // إزالة المسافات
      .trim();
  }

  private getDescriptionSimilarity(desc1: string, desc2: string): number {
    const words1 = this.extractKeywords(desc1);
    const words2 = this.extractKeywords(desc2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private extractKeywords(text: string): string[] {
    return text.toUpperCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['THE', 'AND', 'FOR', 'WITH', 'من', 'في', 'إلى'].includes(word));
  }

  private isSpecialCase(item1: DuplicateItem, item2: DuplicateItem): boolean {
    const text1 = (item1.description + ' ' + item1.partNumber).toUpperCase();
    const text2 = (item2.description + ' ' + item2.partNumber).toUpperCase();
    
    // حالة شنايدر LC1D 32M7
    const hasLC1D32M7_1 = text1.includes('LC1D') && text1.includes('32') && text1.includes('M7');
    const hasLC1D32M7_2 = text2.includes('LC1D') && text2.includes('32') && text2.includes('M7');
    const has2102049_1 = text1.includes('2102049');
    const has2102049_2 = text2.includes('2102049');
    
    if ((hasLC1D32M7_1 || has2102049_1) && (hasLC1D32M7_2 || has2102049_2)) {
      return true;
    }

    return false;
  }

  private getSimilarityReason(item1: DuplicateItem, item2: DuplicateItem): string {
    if (item1.lineItem && item2.lineItem && 
        this.normalizeText(item1.lineItem) === this.normalizeText(item2.lineItem)) {
      return `نفس LINE ITEM: ${item1.lineItem}`;
    }

    if (item1.partNumber && item2.partNumber && 
        this.normalizePartNumber(item1.partNumber) === this.normalizePartNumber(item2.partNumber)) {
      return `نفس رقم الجزء: ${item1.partNumber}`;
    }

    if (this.isSpecialCase(item1, item2)) {
      return 'منتجات شنايدر LC1D 32M7 متطابقة';
    }

    return 'أوصاف متشابهة';
  }

  private async unifyGroup(group: UnificationGroup): Promise<void> {
    const masterItemNumber = group.masterItem.itemNumber;
    
    for (const duplicate of group.duplicates) {
      try {
        await this.googleSheetsData.updateItemId(duplicate.itemNumber, masterItemNumber);
        console.log(`   ✓ ${duplicate.itemNumber} → ${masterItemNumber}`);
        
        // انتظار قصير لتجنب تحميل الخادم
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`   ✗ فشل تحديث ${duplicate.itemNumber}:`, error);
      }
    }
  }

  getProgress(): number {
    return this.progress;
  }

  isOperationRunning(): boolean {
    return this.isRunning;
  }
}

export const simpleIdentifierUnifier = new SimpleIdentifierUnifier();