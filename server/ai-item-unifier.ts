import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

interface ItemData {
  row: number;
  uniqueId: string;
  unit: string;
  lineItem: string;
  partNo: string;
  description: string;
}

interface UnificationResult {
  success: boolean;
  totalItems: number;
  unifiedGroups: number;
  duplicatesRemoved: number;
  unifiedItems: Array<{
    masterRow: number;
    masterId: string;
    duplicateRows: number[];
    reason: string;
  }>;
  error?: string;
}

/**
 * نظام توحيد المعرفات الذكي باستخدام AI
 * يقوم بمطابقة الأصناف بناءً على PART NO والتوصيف
 */
export class AIItemUnifier {
  private sheetsService: GoogleSheetsRealtimeData;

  constructor() {
    this.sheetsService = new GoogleSheetsRealtimeData();
  }

  /**
   * توحيد المعرفات في Google Sheets
   */
  async unifyItemsInSheets(): Promise<UnificationResult> {
    try {
      console.log('🤖 بدء عملية توحيد المعرفات بالذكاء الاصطناعي...');
      
      // قراءة البيانات من Google Sheets
      const sheetsData = await this.sheetsService.readDataSheet();
      if (!sheetsData || sheetsData.length === 0) {
        return {
          success: false,
          totalItems: 0,
          unifiedGroups: 0,
          duplicatesRemoved: 0,
          unifiedItems: [],
          error: 'فشل في قراءة البيانات من Google Sheets'
        };
      }

      const items = this.parseItemsFromSheets(sheetsData);
      console.log(`📊 تم العثور على ${items.length} صنف للتحليل`);

      // تحليل المطابقات باستخدام الذكاء الاصطناعي
      const matches = await this.findDuplicatesWithAI(items);
      console.log(`🔍 تم العثور على ${matches.length} مجموعة مطابقة`);

      // تطبيق التوحيد
      const unificationResult = await this.applyUnification(matches);
      
      return {
        success: true,
        totalItems: items.length,
        unifiedGroups: matches.length,
        duplicatesRemoved: unificationResult.duplicatesRemoved,
        unifiedItems: unificationResult.unifiedItems
      };

    } catch (error) {
      console.error('❌ خطأ في عملية التوحيد:', error);
      return {
        success: false,
        totalItems: 0,
        unifiedGroups: 0,
        duplicatesRemoved: 0,
        unifiedItems: [],
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  /**
   * تحويل بيانات الشيت إلى كائنات أصناف
   */
  private parseItemsFromSheets(data: any[][]): ItemData[] {
    const items: ItemData[] = [];
    
    // تجاهل الصف الأول (العناوين) والبدء من الصف الثاني
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length >= 5) {
        items.push({
          row: i + 1, // +1 لأن Google Sheets يبدأ من 1
          uniqueId: row[0] || '',
          unit: row[1] || '',
          lineItem: row[2] || '',
          partNo: row[3] || '',
          description: row[4] || ''
        });
      }
    }

    return items;
  }

  /**
   * البحث عن المطابقات المكررة باستخدام الذكاء الاصطناعي
   */
  private async findDuplicatesWithAI(items: ItemData[]): Promise<Array<{
    master: ItemData;
    duplicates: ItemData[];
    reason: string;
  }>> {
    const matches: Array<{
      master: ItemData;
      duplicates: ItemData[];
      reason: string;
    }> = [];
    
    const processedRows = new Set<number>();

    for (let i = 0; i < items.length; i++) {
      if (processedRows.has(items[i].row)) continue;
      
      const masterItem = items[i];
      const duplicates: ItemData[] = [];

      // البحث عن المطابقات
      for (let j = i + 1; j < items.length; j++) {
        if (processedRows.has(items[j].row)) continue;
        
        const compareItem = items[j];
        const matchResult = await this.compareItems(masterItem, compareItem);
        
        if (matchResult.isMatch) {
          duplicates.push(compareItem);
          processedRows.add(compareItem.row);
        }
      }

      if (duplicates.length > 0) {
        matches.push({
          master: masterItem,
          duplicates,
          reason: `مطابقة بناءً على ${duplicates.length > 1 ? 'عدة عوامل' : 'عامل واحد'}`
        });
        processedRows.add(masterItem.row);
      }
    }

    return matches;
  }

  /**
   * مقارنة صنفين باستخدام خوارزميات ذكية
   */
  private async compareItems(item1: ItemData, item2: ItemData): Promise<{
    isMatch: boolean;
    confidence: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let confidence = 0;

    // 1. مطابقة PART NO المباشرة
    if (item1.partNo && item2.partNo && this.normalizePartNo(item1.partNo) === this.normalizePartNo(item2.partNo)) {
      reasons.push('PART NO متطابق');
      confidence += 0.8;
    }

    // 2. مطابقة التوصيف بالتشابه النصي
    const descriptionSimilarity = this.calculateTextSimilarity(item1.description, item2.description);
    if (descriptionSimilarity > 0.85) {
      reasons.push(`التوصيف متشابه بنسبة ${Math.round(descriptionSimilarity * 100)}%`);
      confidence += 0.6 * descriptionSimilarity;
    }

    // 3. مطابقة PART NO الجزئية
    const partNoSimilarity = this.calculatePartNoSimilarity(item1.partNo, item2.partNo);
    if (partNoSimilarity > 0.7) {
      reasons.push(`PART NO متشابه جزئياً بنسبة ${Math.round(partNoSimilarity * 100)}%`);
      confidence += 0.4 * partNoSimilarity;
    }

    // 4. مطابقة الوحدة
    if (item1.unit && item2.unit && item1.unit.toLowerCase() === item2.unit.toLowerCase()) {
      reasons.push('الوحدة متطابقة');
      confidence += 0.1;
    }

    return {
      isMatch: confidence >= 0.7, // عتبة المطابقة
      confidence,
      reasons
    };
  }

  /**
   * تطبيع PART NO للمقارنة
   */
  private normalizePartNo(partNo: string): string {
    return partNo
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // إزالة الرموز والمسافات
      .trim();
  }

  /**
   * حساب التشابه النصي بين التوصيفات
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const normalize = (text: string) => text.toLowerCase().replace(/[^\u0600-\u06FF\w\s]/g, '').trim();
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);
    
    if (norm1 === norm2) return 1;
    
    // خوارزمية Jaccard للتشابه
    const words1 = new Set(norm1.split(/\s+/));
    const words2 = new Set(norm2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * حساب التشابه بين PART NO
   */
  private calculatePartNoSimilarity(partNo1: string, partNo2: string): number {
    if (!partNo1 || !partNo2) return 0;
    
    const norm1 = this.normalizePartNo(partNo1);
    const norm2 = this.normalizePartNo(partNo2);
    
    if (norm1 === norm2) return 1;
    if (norm1.length === 0 || norm2.length === 0) return 0;
    
    // التحقق من الاحتواء
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return 0.8;
    }
    
    // خوارزمية Levenshtein للمسافة النصية
    return 1 - (this.levenshteinDistance(norm1, norm2) / Math.max(norm1.length, norm2.length));
  }

  /**
   * حساب مسافة Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * تطبيق التوحيد على Google Sheets - نسخة محسنة مع تحكم بالمعدل
   */
  private async applyUnification(matches: Array<{
    master: ItemData;
    duplicates: ItemData[];
    reason: string;
  }>): Promise<{
    duplicatesRemoved: number;
    unifiedItems: Array<{
      masterRow: number;
      masterId: string;
      duplicateRows: number[];
      reason: string;
    }>;
  }> {
    const unifiedItems: Array<{
      masterRow: number;
      masterId: string;
      duplicateRows: number[];
      reason: string;
    }> = [];
    
    let duplicatesRemoved = 0;
    let operationCount = 0;
    const maxOperationsPerBatch = 15; // حد أقصى للعمليات قبل التوقف المؤقت
    const delayBetweenBatches = 120000; // دقيقتان

    // معالجة أول 20 مطابقة فقط لتجنب تجاوز الحدود
    const limitedMatches = matches.slice(0, 20);
    console.log(`🔧 معالجة ${limitedMatches.length} مجموعة من ${matches.length} مجموعة مطابقة`);

    for (const match of limitedMatches) {
      try {
        // إنشاء معرف موحد جديد
        const unifiedId = await this.generateUnifiedId();
        
        // تحديث الصف الرئيسي
        await this.updateRowInSheets(match.master.row, unifiedId);
        operationCount++;
        
        // تسجيل الصفوف المكررة
        const duplicateRows = match.duplicates.map(d => d.row);
        for (const duplicateRow of duplicateRows) {
          if (operationCount >= maxOperationsPerBatch) {
            console.log(`⏸️ توقف مؤقت للحد من عدد العمليات...`);
            await this.delay(delayBetweenBatches);
            operationCount = 0;
          }
          
          await this.updateRowInSheets(duplicateRow, `DUPLICATE-${unifiedId}`);
          duplicatesRemoved++;
          operationCount++;
          
          // تأخير أطول بين العمليات
          await this.delay(2000);
        }
        
        unifiedItems.push({
          masterRow: match.master.row,
          masterId: unifiedId,
          duplicateRows,
          reason: match.reason
        });
        
        console.log(`✅ تم توحيد المجموعة ${unifiedItems.length}/${limitedMatches.length}: ${unifiedId}`);
        
      } catch (error) {
        console.error(`❌ خطأ في معالجة المطابقة:`, error);
        // تخطي هذه المطابقة والمتابعة
        continue;
      }
    }

    console.log(`🎯 تم توحيد ${unifiedItems.length} مجموعة و ${duplicatesRemoved} صنف مكرر`);
    return {
      duplicatesRemoved,
      unifiedItems
    };
  }

  /**
   * تأخير لمدة محددة بالميلي ثانية
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * توليد معرف موحد جديد
   */
  private async generateUnifiedId(): Promise<string> {
    // استخدام نفس نظام P-format المستخدم في النظام
    const timestamp = Date.now().toString().slice(-6);
    return `P-${timestamp.padStart(7, '0')}`;
  }

  /**
   * تحديث صف في Google Sheets
   */
  private async updateRowInSheets(row: number, newId: string): Promise<void> {
    try {
      await this.sheetsService.updateCellValue(`A${row}`, newId);
      console.log(`✅ تم تحديث الصف ${row} بالمعرف ${newId}`);
    } catch (error) {
      console.error(`❌ خطأ في تحديث الصف ${row}:`, error);
    }
  }

  /**
   * تحديد صف كمكرر في Google Sheets (بدلاً من الحذف)
   */
  private async markRowAsDuplicate(row: number, masterId: string): Promise<void> {
    try {
      await this.sheetsService.updateCellValue(`A${row}`, `DUPLICATE-${masterId}`);
      console.log(`✅ تم تحديد الصف ${row} كمكرر للمعرف ${masterId}`);
    } catch (error) {
      console.error(`❌ خطأ في تحديد الصف ${row} كمكرر:`, error);
    }
  }
}

export const aiItemUnifier = new AIItemUnifier();