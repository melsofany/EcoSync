import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';
import { analyzeItemsForDuplicates, DuplicateGroup, ItemForAnalysis } from './ai-duplicate-detector.js';

export interface UnificationResult {
  totalProcessed: number;
  unifiedGroups: number;
  itemsUnified: number;
  unificationDetails: UnificationGroup[];
}

export interface UnificationGroup {
  masterItemNumber: string;
  masterDescription: string;
  unifiedItems: {
    oldItemNumber: string;
    description: string;
    rowIndex: number;
  }[];
  reason: string;
}

export class IdentifierUnificationService {
  private isRunning = false;
  private currentProgress = 0;
  private googleSheetsData: GoogleSheetsRealtimeData;

  constructor() {
    this.googleSheetsData = new GoogleSheetsRealtimeData();
  }

  async startUnification(): Promise<UnificationResult> {
    if (this.isRunning) {
      throw new Error('عملية التوحيد قيد التشغيل بالفعل');
    }

    this.isRunning = true;
    this.currentProgress = 0;

    try {
      console.log('🔄 بدء عملية توحيد المعرفات الشاملة...');

      // 1. جلب جميع البيانات من Google Sheets
      const allItems = await this.getAllItemsForAnalysis();
      console.log(`📊 تم جلب ${allItems.length} بند للتحليل`);

      this.currentProgress = 20;

      // 2. تحليل التكرارات باستخدام الذكاء الاصطناعي
      const duplicateAnalysis = await analyzeItemsForDuplicates(allItems);
      console.log(`🔍 تم العثور على ${duplicateAnalysis.duplicateGroups.length} مجموعة مكررة`);

      this.currentProgress = 60;

      // 3. تطبيق التوحيد
      const unificationResult = await this.applyUnification(duplicateAnalysis.duplicateGroups);
      console.log(`✅ تم توحيد ${unificationResult.itemsUnified} بند في ${unificationResult.unifiedGroups} مجموعة`);

      this.currentProgress = 100;
      this.isRunning = false;

      return unificationResult;

    } catch (error) {
      this.isRunning = false;
      console.error('❌ خطأ في عملية التوحيد:', error);
      throw error;
    }
  }

  private async getAllItemsForAnalysis(): Promise<ItemForAnalysis[]> {
    const rawData = await this.googleSheetsData.readDataSheet();
    
    return rawData.map((row: any[], index: number) => ({
      id: `item_${index}`,
      serial_number: index + 2, // صف Google Sheets (بدءاً من 2)
      description: row[4] || '', // العمود E - الوصف
      part_number: row[1] || '', // العمود B - رقم الجزء  
      line_item: row[2] || '', // العمود C - LINE ITEM
      category: row[5] || '' // العمود F - الفئة
    }));
  }

  private async applyUnification(duplicateGroups: DuplicateGroup[]): Promise<UnificationResult> {
    const unificationDetails: UnificationGroup[] = [];
    let totalItemsUnified = 0;

    for (const group of duplicateGroups) {
      if (group.duplicates.length === 0) continue;

      console.log(`🔄 توحيد مجموعة: ${group.masterItem.description}`);

      // تحديد المعرف الرئيسي (الأقدم أو الأكثر اكتمالاً)
      const masterItemNumber = await this.determineMasterIdentifier(group);
      
      // جمع المعرفات التي سيتم توحيدها
      const itemsToUnify = group.duplicates.map(duplicate => ({
        oldItemNumber: this.getItemNumber(duplicate.serial_number),
        description: duplicate.description,
        rowIndex: duplicate.serial_number
      }));

      // تطبيق التوحيد في Google Sheets
      await this.updateItemNumbers(itemsToUnify, masterItemNumber);

      unificationDetails.push({
        masterItemNumber,
        masterDescription: group.masterItem.description,
        unifiedItems: itemsToUnify,
        reason: group.reason
      });

      totalItemsUnified += itemsToUnify.length;
    }

    return {
      totalProcessed: duplicateGroups.length,
      unifiedGroups: unificationDetails.length,
      itemsUnified: totalItemsUnified,
      unificationDetails
    };
  }

  private async determineMasterIdentifier(group: DuplicateGroup): Promise<string> {
    // استخدام العنصر الرئيسي المحدد من تحليل الذكاء الاصطناعي
    const masterItem = group.masterItem;
    return this.getItemNumber(masterItem.serial_number);
  }

  private getItemNumber(serialNumber: number): string {
    // استخراج رقم المعرف من رقم الصف
    // هذا يحتاج للتكيف مع هيكل البيانات الفعلي
    return `P-${String(serialNumber).padStart(7, '0')}`;
  }

  private async updateItemNumbers(itemsToUnify: any[], masterItemNumber: string): Promise<void> {
    try {
      for (const item of itemsToUnify) {
        // تحديث رقم المعرف في Google Sheets
        const rowIndex = item.rowIndex;
        const range = `DATA!A${rowIndex}:A${rowIndex}`;
        
        await this.googleSheetsData.updateItemId(item.oldItemNumber, masterItemNumber);
        console.log(`✅ تم توحيد ${item.oldItemNumber} → ${masterItemNumber}`);
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث أرقام المعرفات:', error);
      throw error;
    }
  }

  getProgress(): number {
    return this.currentProgress;
  }

  isOperationRunning(): boolean {
    return this.isRunning;
  }

  async stopUnification(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 تم إيقاف عملية التوحيد');
  }
}

export const identifierUnificationService = new IdentifierUnificationService();