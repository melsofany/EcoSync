import { google } from 'googleapis';
import { authenticateGoogle } from './google-auth.js';

// تعريف واجهة الحالة
interface Status {
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  total: number;
  processed: number;
  unified: number;
  currentItem: any;
  startTime: string;
  estimatedTimeRemaining: number;
  aiCallCount: number;
}

// تعريف واجهة استجابة DeepSeek
interface DeepSeekResponse {
  similar: boolean;
  score: number;
  reason: string;
}

// تعريف واجهة نتيجة التنفيذ
interface ExecutionResult {
  success: boolean;
  message: string;
  totalRows: number;
  processedRows: number;
  unifiedGroups: number;
  unifiedCount: number;
  aiCallsUsed: number;
  accuracy: number;
  sessionId: string;
}

// تعريف واجهة المنتج
interface Product {
  rowIndex: number;
  id?: string;
  description: string;
  unifiedId?: string;
}

/**
 * نظام التوحيد الدلالي الذكي المحسن
 * - مقارنة المعنى والمدلول وليس النص فقط
 * - استخدام DeepSeek API كمحرك أساسي للمقارنة
 * - التركيز الكامل على التوصيف والوظيفة
 */
export class SemanticUnificationService {
  private sheets: any;
  private spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  private deepSeekApiKey: string;
  private status: Status;
  private isStopped: boolean = false;
  private unifiedGroups: Map<string, Product[]> = new Map();
  private sessionId: string;
  private processedItems: Product[] = [];
  private nextId: number = 1;

  constructor(deepSeekApiKey?: string) {
    this.deepSeekApiKey = deepSeekApiKey || process.env.DEEPSEEK_API_KEY || '';
    this.sessionId = this.generateSessionId();
    
    // تهيئة الحالة الافتراضية
    this.status = {
      isRunning: false,
      isPaused: false,
      progress: 0,
      total: 0,
      processed: 0,
      unified: 0,
      currentItem: null,
      startTime: new Date().toISOString(),
      estimatedTimeRemaining: 0,
      aiCallCount: 0
    };
    
    console.log('🧠 تهيئة نظام التوحيد الدلالي الذكي المحسن...');
  }

  // إنشاء معرف جلسة فريد
  private generateSessionId(): string {
    return `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // تهيئة الاتصال بـ Google Sheets API
  async initialize(): Promise<void> {
    try {
      const auth = await authenticateGoogle();
      this.sheets = google.sheets({ version: 'v4', auth: auth as any });
      
      if (this.deepSeekApiKey) {
        console.log('✅ تم تهيئة DeepSeek API للمقارنة الدلالية الذكية');
      } else {
        console.warn('⚠️ لم يتم ضبط DEEPSEEK_API_KEY - سيتم استخدام المقارنة النصية فقط');
      }
      
      console.log('✅ تم تهيئة نظام التوحيد الدلالي المحسن بنجاح');
    } catch (error) {
      console.error('فشل في تهيئة النظام:', error);
      throw error;
    }
  }

  // مقارنة أوصاف المنتجات باستخدام DeepSeek API
  private async compareDescriptions(description1: string, description2: string): Promise<DeepSeekResponse> {
    // فلترة سريعة للقيم غير الصالحة
    const ignoredTerms = ['EACH', 'PCS', '', 'N/A', 'NULL', '-', '0'];
    const desc1 = description1.trim();
    const desc2 = description2.trim();
    
    if (ignoredTerms.includes(desc1.toUpperCase()) || 
        ignoredTerms.includes(desc2.toUpperCase()) ||
        desc1.length < 3 || desc2.length < 3) {
      return {
        similar: false,
        score: 0,
        reason: 'وصف غير صالح للمقارنة'
      };
    }

    // فحص سريع للتطابق الكامل
    if (desc1.toLowerCase() === desc2.toLowerCase()) {
      return {
        similar: true,
        score: 1.0,
        reason: 'تطابق كامل'
      };
    }

    try {
      this.status.aiCallCount++;
      
      const prompt = `مقارنة سريعة للمنتجات:
1: "${desc1}"
2: "${desc2}"

قواعد:
- التوصيف والوظيفة أولاً
- تجاهل الاختلافات اللغوية
- كونتاكتور 25A = Contactor 25A ✅
- كونتاكتور 25A ≠ 40A ❌

JSON فقط:
{"similar":true/false,"score":0.0-1.0,"reason":"سبب"}`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.deepSeekApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages: [
            {
              role: 'system',
              content: 'أنت مساعد مفيد في توحيد المنتجات الصناعية. يجب أن تجيب فقط بـ JSON بدون أي نص إضافي.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      try {
        const result: DeepSeekResponse = JSON.parse(content);
        return result;
      } catch (parseError) {
        // إذا فشل تحليل JSON، حاول استخراج البيانات من النص
        console.log('فشل تحليل JSON، محاولة استخراج البيانات:', content);
        
        const similar = content.toLowerCase().includes('true') || 
                       content.includes('متشابه') || 
                       content.includes('نفس');
        
        return {
          similar,
          score: similar ? 0.8 : 0.2,
          reason: 'تحليل نصي بديل'
        };
      }

    } catch (error) {
      console.error('فشل في استدعاء DeepSeek API:', error);
      // Fallback إلى المقارنة النصية البسيطة
      return this.fallbackComparison(description1, description2);
    }
  }

  // Fallback للمقارنة النصية إذا فشل DeepSeek
  private fallbackComparison(description1: string, description2: string): DeepSeekResponse {
    // تنظيف النص وإزالة المسافات الزائدة والحروف الصغيرة
    const cleanDesc1 = description1.trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanDesc2 = description2.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // إذا كانا متطابقين تماماً
    if (cleanDesc1 === cleanDesc2) {
      return {
        similar: true,
        score: 1.0,
        reason: 'نفس الوصف تماماً'
      };
    }
    
    // حساب نسبة التشابه باستخدام خوارزمية بسيطة
    const words1 = cleanDesc1.split(' ');
    const words2 = cleanDesc2.split(' ');
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return {
      similar: similarity >= 0.7,
      score: similarity,
      reason: `مقارنة نصية بديلة: ${Math.round(similarity * 100)}% تشابه`
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // إيقاف مؤقت للعملية
  pause(): void {
    if (this.status.isRunning && !this.status.isPaused) {
      this.status.isPaused = true;
      console.log('تم إيقاف العملية مؤقتاً');
    }
  }

  // استئناف العملية
  resume(): void {
    if (this.status.isRunning && this.status.isPaused) {
      this.status.isPaused = false;
      console.log('تم استئناف العملية');
    }
  }

  // إيقاف نهائي للعملية
  stop(): void {
    this.isStopped = true;
    this.status.isRunning = false;
    this.status.isPaused = false;
    console.log('تم إيقاف العملية');
  }

  // الحصول على حالة النظام الحالية
  getStatus(): Status {
    return { ...this.status };
  }

  // مسح العمود A
  private async clearColumnA(): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:A',
      });
    } catch (error) {
      console.error('فشل في مسح العمود A:', error);
      throw error;
    }
  }

  // كتابة المعرف الموحد في الخلية
  private async writeUnifiedId(rowIndex: number, unifiedId: string): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `DATA!A${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[unifiedId]]
        }
      });
    } catch (error) {
      console.error(`فشل في كتابة المعرف الموحد للصف ${rowIndex}:`, error);
      // يمكن إضافة آلية إعادة المحاولة هنا
    }
  }

  // حساب دقة التوحيد
  private calculateAccuracy(): number {
    if (this.status.processed === 0) return 0;
    
    // يمكن تحسين هذه الخوارزمية بناءً على متطلبات محددة
    const accuracy = (this.status.unified / this.status.processed) * 100;
    return Math.min(100, Math.max(0, accuracy));
  }

  // الوظيفة الرئيسية للتوحيد الدلالي
  async runSemanticUnification(): Promise<ExecutionResult> {
    if (this.status.isRunning) {
      return {
        success: false,
        message: 'النظام يعمل بالفعل',
        totalRows: 0,
        processedRows: 0,
        unifiedGroups: 0,
        unifiedCount: 0,
        aiCallsUsed: 0,
        accuracy: 0,
        sessionId: this.sessionId
      };
    }

    this.isStopped = false;
    this.status.isRunning = true;
    this.status.isPaused = false;
    this.status.startTime = new Date().toISOString();

    try {
      // 1. قراءة البيانات من Google Sheets
      console.log('جاري قراءة البيانات من Google Sheets...');
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:E',
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        throw new Error('لا توجد بيانات في الورقة');
      }

      this.status.total = rows.length;
      console.log(`تم تحميل ${rows.length} عنصرًا للمعالجة`);

      // 2. مسح العمود A قبل البدء
      console.log('جاري مسح العمود A...');
      await this.clearColumnA();

      // 3. معالجة كل عنصر
      const products: Product[] = rows.map((row: any[], index: number) => ({
        rowIndex: index + 2, // الصفوف تبدأ من 2 لأن العنوان في الصف 1
        description: row[4] || '', // العمود E للتوصيف
      }));

      // 4. معالجة كل منتج
      for (let i = 0; i < products.length; i++) {
        if (this.isStopped) break;
        
        while (this.status.isPaused && !this.isStopped) {
          // انتظار حتى يتم استئناف العملية
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (this.isStopped) break;

        const product = products[i];
        this.status.currentItem = product;
        this.status.processed = i + 1;
        this.status.progress = (this.status.processed / this.status.total) * 100;

        // تحديث الوقت المتبقي المقدر (بالثواني)
        if (i > 10) { // بدء التقدير بعد 10 عناصر لدقة أفضل
          const elapsedTime = new Date().getTime() - new Date(this.status.startTime).getTime();
          const avgTimePerItem = elapsedTime / i;
          const remainingItems = products.length - i;
          this.status.estimatedTimeRemaining = Math.round((remainingItems * avgTimePerItem) / 1000); // بالثواني
        } else {
          this.status.estimatedTimeRemaining = 0;
        }

        // عرض التقدم كل 250 بند مع سرعة والوقت المتبقي
        if (i % 250 === 0 && i > 0) {
          const elapsed = Date.now() - new Date(this.status.startTime).getTime();
          const speed = Math.round((i / elapsed) * 1000 * 60); // عناصر/دقيقة
          const remainingMinutes = Math.round(this.status.estimatedTimeRemaining / 60);
          console.log(`⚡ معالجة سريعة: ${i}/${products.length} (${speed} بند/دقيقة) - متبقي: ${remainingMinutes}م - AI: ${this.status.aiCallCount}`);
        }

        // البحث السريع عن تطابق مع التحسينات
        let matched = false;
        let bestMatchId: string | null = null;
        let bestMatchScore = 0;

        // مرحلة 1: فلترة سريعة بناء على طول النص
        const productDesc = product.description.toLowerCase().trim();
        if (productDesc.length < 3) {
          // تخطي الأوصاف القصيرة جداً
        } else {
          // مرحلة 2: مقارنة مع ممثل واحد فقط لكل مجموعة
          for (const [unifiedId, groupProducts] of this.unifiedGroups.entries()) {
            const representative = groupProducts[0]; // فقط الممثل الأول
            
            // فحص سريع للطول أولاً
            const repDesc = representative.description.toLowerCase().trim();
            if (Math.abs(productDesc.length - repDesc.length) > productDesc.length * 0.5) {
              continue; // تخطي إذا كان الفرق في الطول كبير جداً
            }

            // استخدام DeepSeek للمقارنة الدقيقة
            const comparisonResult = await this.compareDescriptions(
              product.description,
              representative.description
            );

            if (comparisonResult.similar && comparisonResult.score > bestMatchScore) {
              bestMatchScore = comparisonResult.score;
              bestMatchId = unifiedId;
            }

            // إذا وجدنا تطابق عالي، توقف
            if (bestMatchScore >= 0.85) {
              break;
            }
          }
        }

        // إذا وجد تطابق، أضف إلى المجموعة الموجودة
        if (bestMatchId && bestMatchScore >= 0.7) {
          product.unifiedId = bestMatchId;
          this.unifiedGroups.get(bestMatchId)!.push(product);
          this.status.unified++;
          matched = true;
        }

        // إذا لم يتم العثور على تطابق، إنشاء مجموعة جديدة
        if (!matched) {
          const newUnifiedId = `P-${this.nextId.toString().padStart(7, '0')}`;
          this.nextId++;
          product.unifiedId = newUnifiedId;
          this.unifiedGroups.set(newUnifiedId, [product]);
        }

        this.processedItems.push(product);

        // تجميع الكتابة للعمليات المجمعة (كل 100 بند)
        if (i % 100 === 99 || i === products.length - 1) {
          // كتابة مجمعة للآخر 100 بند
          const batchUpdates = this.processedItems.slice(-Math.min(100, this.processedItems.length))
            .map(item => [item.unifiedId]);
          
          const startRow = Math.max(2, product.rowIndex - batchUpdates.length + 1);
          
          try {
            await this.sheets.spreadsheets.values.update({
              spreadsheetId: this.spreadsheetId,
              range: `DATA!A${startRow}:A${product.rowIndex}`,
              valueInputOption: 'RAW',
              resource: { values: batchUpdates }
            });
          } catch (error) {
            console.error('فشل في الكتابة المجمعة:', error);
            // fallback للكتابة الفردية
            await this.writeUnifiedId(product.rowIndex, product.unifiedId!);
          }
        }
      }

      // إعداد النتيجة النهائية
      const result: ExecutionResult = {
        success: true,
        message: 'تم الانتهاء من توحيد المنتجات بنجاح',
        totalRows: this.status.total,
        processedRows: this.status.processed,
        unifiedGroups: this.unifiedGroups.size,
        unifiedCount: this.status.unified,
        aiCallsUsed: this.status.aiCallCount,
        accuracy: this.calculateAccuracy(),
        sessionId: this.sessionId
      };

      this.status.isRunning = false;
      return result;

    } catch (error: any) {
      console.error('حدث خطأ أثناء التنفيذ:', error);
      
      this.status.isRunning = false;
      return {
        success: false,
        message: `فشل في التنفيذ: ${error.message}`,
        totalRows: this.status.total,
        processedRows: this.status.processed,
        unifiedGroups: this.unifiedGroups.size,
        unifiedCount: this.status.unified,
        aiCallsUsed: this.status.aiCallCount,
        accuracy: this.calculateAccuracy(),
        sessionId: this.sessionId
      };
    }
  }
}

// إنشاء النظام الدلالي المحسن
export const semanticUnification = new SemanticUnificationService();

// تهيئة النظام
semanticUnification.initialize()
  .then(() => {
    console.log('✅ نظام التوحيد الدلالي المحسن جاهز');
    console.log('🧠 DeepSeek API جاهز للمقارنة الدلالية الذكية');
  })
  .catch(err => console.error('❌ خطأ في تهيئة التوحيد الدلالي:', err));

// تصدير الواجهات للاستخدام الخارجي
export { Status, DeepSeekResponse, ExecutionResult, Product };