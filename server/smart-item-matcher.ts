import OpenAI from 'openai';
import { storage } from './storage.js';
import { unificationTracker } from './unification-progress-tracker.js';

// تهيئة عميل OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MatchResult {
  masterItemId: string;
  duplicateItemIds: string[];
  confidence: number;
  reason: string;
  suggestions?: string[];
}

export interface ItemData {
  id: string;
  description: string;
  partNumber?: string;
  category?: string;
  lineItem?: string;
  kItemId?: string;
}

export class SmartItemMatcher {
  private static instance: SmartItemMatcher;
  private matchingQueue: ItemData[] = [];
  private isProcessing = false;

  static getInstance(): SmartItemMatcher {
    if (!SmartItemMatcher.instance) {
      SmartItemMatcher.instance = new SmartItemMatcher();
    }
    return SmartItemMatcher.instance;
  }

  /**
   * بدء عملية التوحيد الذكي للبنود
   */
  async startUnification(startFromRow: number = 5, batchSize: number = 50): Promise<string> {
    if (this.isProcessing) {
      throw new Error('عملية التوحيد قيد التشغيل بالفعل');
    }

    try {
      // جلب جميع البنود من قاعدة البيانات
      const allItems = await storage.getAllItems();
      const itemsToProcess = allItems.slice(startFromRow - 1); // بدء من الصف المحدد

      console.log(`🚀 بدء توحيد البنود من الصف ${startFromRow}`);
      console.log(`📊 إجمالي البنود للمعالجة: ${itemsToProcess.length}`);

      // إنشاء جلسة جديدة لتتبع التقدم
      const sessionId = unificationTracker.startSession(itemsToProcess.length, 'system');

      this.isProcessing = true;
      this.matchingQueue = itemsToProcess.map(item => ({
        id: item.id,
        description: item.description || '',
        partNumber: item.partNumber || '',
        category: item.category || '',
        lineItem: item.lineItem || '',
        kItemId: item.kItemId || ''
      }));

      // بدء المعالجة بشكل غير متزامن
      this.processQueue(sessionId, batchSize).catch(error => {
        console.error('❌ خطأ في معالجة قائمة التوحيد:', error);
        unificationTracker.endSession('error');
        this.isProcessing = false;
      });

      return sessionId;
    } catch (error) {
      console.error('❌ خطأ في بدء عملية التوحيد:', error);
      this.isProcessing = false;
      throw error;
    }
  }

  /**
   * معالجة قائمة البنود بشكل متتالي
   */
  private async processQueue(sessionId: string, batchSize: number): Promise<void> {
    let processedCount = 0;
    let unifiedCount = 0;

    while (this.matchingQueue.length > 0 && this.isProcessing) {
      const currentBatch = this.matchingQueue.splice(0, batchSize);
      
      for (const item of currentBatch) {
        if (!this.isProcessing) break;

        try {
          // تحديث البند الحالي قيد المعالجة
          unificationTracker.updateCurrentItem(item.description, item.partNumber);

          // البحث عن مطابقات محتملة
          const matches = await this.findPotentialMatches(item);
          
          if (matches.length > 0) {
            // استخدام الذكاء الاصطناعي لتحليل المطابقات
            const aiResult = await this.analyzeWithAI(item, matches);
            
            if (aiResult && aiResult.confidence >= 85) {
              // تطبيق التوحيد
              await this.applyUnification(aiResult);
              unifiedCount += aiResult.duplicateItemIds.length;
              
              // تسجيل النجاح
              unificationTracker.recordUnification(
                aiResult.masterItemId,
                aiResult.duplicateItemIds,
                aiResult.confidence
              );
            }
            
            unificationTracker.recordAIRequest(true);
          }

          processedCount++;
          
          // تحديث التقدم
          unificationTracker.updateProgress({
            processedRows: processedCount,
            unifiedItems: unifiedCount
          });

          // توقف قصير لمنع الحمل الزائد
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ خطأ في معالجة البند ${item.id}:`, error);
          unificationTracker.recordAIRequest(false, error.message);
        }
      }
    }

    // إنهاء الجلسة
    this.isProcessing = false;
    unificationTracker.endSession('completed');
    
    console.log(`✅ اكتمل التوحيد: ${processedCount} بند معالج، ${unifiedCount} بند موحد`);
  }

  /**
   * البحث عن مطابقات محتملة باستخدام قواعد النصوص
   */
  private async findPotentialMatches(targetItem: ItemData): Promise<ItemData[]> {
    const allItems = await storage.getAllItems();
    const potentialMatches: ItemData[] = [];

    for (const item of allItems) {
      if (item.id === targetItem.id) continue;

      const itemData: ItemData = {
        id: item.id,
        description: item.description || '',
        partNumber: item.partNumber || '',
        category: item.category || '',
        lineItem: item.lineItem || '',
        kItemId: item.kItemId || ''
      };

      // قواعد المطابقة الأولية
      if (this.isTextuallySimilar(targetItem, itemData)) {
        potentialMatches.push(itemData);
      }
    }

    return potentialMatches.slice(0, 5); // أقصى 5 مطابقات لتحليل الذكاء الاصطناعي
  }

  /**
   * التحقق من التشابه النصي بين البنود
   */
  private isTextuallySimilar(item1: ItemData, item2: ItemData): boolean {
    // مطابقة رقم القطعة (أهم مؤشر)
    if (item1.partNumber && item2.partNumber && 
        this.normalizeText(item1.partNumber) === this.normalizeText(item2.partNumber)) {
      return true;
    }

    // مطابقة الوصف (مع تطبيع النص)
    if (item1.description && item2.description) {
      const desc1 = this.normalizeText(item1.description);
      const desc2 = this.normalizeText(item2.description);
      
      // تشابه عالي في الوصف
      if (this.calculateSimilarity(desc1, desc2) >= 0.8) {
        return true;
      }
    }

    // مطابقة K Item ID
    if (item1.kItemId && item2.kItemId && 
        this.normalizeText(item1.kItemId) === this.normalizeText(item2.kItemId)) {
      return true;
    }

    return false;
  }

  /**
   * تطبيع النص للمقارنة
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // إزالة علامات الترقيم
      .replace(/\s+/g, ' '); // توحيد المسافات
  }

  /**
   * حساب نسبة التشابه بين نصين
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * تحليل المطابقات باستخدام الذكاء الاصطناعي
   */
  private async analyzeWithAI(targetItem: ItemData, candidates: ItemData[]): Promise<MatchResult | null> {
    try {
      const prompt = this.buildAnalysisPrompt(targetItem, candidates);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `أنت خبير في توحيد بيانات قطع الغيار والمعدات الصناعية. مهمتك تحليل البنود وتحديد ما إذا كانت متطابقة أم لا.

قواعد التحليل:
1. رقم القطعة (Part Number) هو أهم مؤشر للتطابق
2. الوصف التقني للبند مهم جداً
3. الفئة (Category) يجب أن تكون متوافقة
4. تجاهل الاختلافات البسيطة في التنسيق أو المسافات
5. كن حذراً من البنود المختلفة التي قد تبدو متشابهة

يجب أن تعود بـ JSON صالح فقط بهذا التنسيق:
{
  "isMatch": boolean,
  "confidence": number,
  "masterItemId": "string",
  "duplicateItemIds": ["string"],
  "reason": "string"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const result = JSON.parse(content);
      
      if (result.isMatch && result.confidence >= 85) {
        return {
          masterItemId: result.masterItemId,
          duplicateItemIds: result.duplicateItemIds,
          confidence: result.confidence,
          reason: result.reason
        };
      }

      return null;
    } catch (error) {
      console.error('❌ خطأ في تحليل الذكاء الاصطناعي:', error);
      throw error;
    }
  }

  /**
   * بناء نص التحليل للذكاء الاصطناعي
   */
  private buildAnalysisPrompt(targetItem: ItemData, candidates: ItemData[]): string {
    let prompt = `تحليل البند المستهدف:\n`;
    prompt += `- المعرف: ${targetItem.id}\n`;
    prompt += `- الوصف: ${targetItem.description}\n`;
    prompt += `- رقم القطعة: ${targetItem.partNumber || 'غير محدد'}\n`;
    prompt += `- الفئة: ${targetItem.category || 'غير محدد'}\n`;
    prompt += `- K Item ID: ${targetItem.kItemId || 'غير محدد'}\n\n`;

    prompt += `البنود المرشحة للمطابقة:\n`;
    candidates.forEach((candidate, index) => {
      prompt += `${index + 1}. معرف: ${candidate.id}\n`;
      prompt += `   الوصف: ${candidate.description}\n`;
      prompt += `   رقم القطعة: ${candidate.partNumber || 'غير محدد'}\n`;
      prompt += `   الفئة: ${candidate.category || 'غير محدد'}\n`;
      prompt += `   K Item ID: ${candidate.kItemId || 'غير محدد'}\n\n`;
    });

    prompt += `هل يوجد تطابق بين البند المستهدف وأي من البنود المرشحة؟ إذا كان الجواب نعم، حدد البند الرئيسي والبنود المكررة مع درجة الثقة والسبب.`;

    return prompt;
  }

  /**
   * تطبيق التوحيد في قاعدة البيانات
   */
  private async applyUnification(result: MatchResult): Promise<void> {
    try {
      // هنا يمكن تطبيق منطق التوحيد الفعلي
      // مثل: دمج البيانات، تحديث المراجع، وضع علامات على البنود المكررة
      
      console.log(`🔄 تطبيق التوحيد:`);
      console.log(`   البند الرئيسي: ${result.masterItemId}`);
      console.log(`   البنود المكررة: ${result.duplicateItemIds.join(', ')}`);
      console.log(`   درجة الثقة: ${result.confidence}%`);
      console.log(`   السبب: ${result.reason}`);

      // يمكن إضافة تحديثات قاعدة البيانات هنا
      // مثل: تحديث حقول unified_with_id أو marking_duplicate
      
    } catch (error) {
      console.error('❌ خطأ في تطبيق التوحيد:', error);
      throw error;
    }
  }

  /**
   * إيقاف عملية التوحيد
   */
  stopUnification(): void {
    this.isProcessing = false;
    console.log('⏹️ تم إيقاف عملية التوحيد');
  }

  /**
   * إيقاف مؤقت لعملية التوحيد
   */
  pauseUnification(): void {
    this.isProcessing = false;
    unificationTracker.pauseSession();
    console.log('⏸️ تم إيقاف عملية التوحيد مؤقتاً');
  }

  /**
   * استئناف عملية التوحيد
   */
  resumeUnification(): void {
    if (this.matchingQueue.length > 0) {
      this.isProcessing = true;
      unificationTracker.resumeSession();
      console.log('▶️ تم استئناف عملية التوحيد');
    }
  }

  /**
   * الحصول على حالة المعالجة
   */
  getProcessingStatus(): { isProcessing: boolean; queueLength: number } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.matchingQueue.length
    };
  }
}

// تصدير مثيل واحد للاستخدام العام
export const smartItemMatcher = SmartItemMatcher.getInstance();