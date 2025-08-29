import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';
import { promises as fs } from 'fs';
import { EventEmitter } from 'events';

// حالة العمل في الخلفية
interface BackgroundUnificationState {
  isRunning: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalItems: number;
  processedItems: number;
  unifiedItems: number;
  startTime: Date | null;
  lastSaveTime: Date | null;
  quotaExceeded: boolean;
  errorCount: number;
  logs: string[];
}

// بيانات البند للمعالجة
interface ProcessingItem {
  id: string;
  description: string;
  partNumber: string;
  rowIndex: number;
  processed: boolean;
}

export class AIBackgroundUnifier extends EventEmitter {
  private dataService: GoogleSheetsRealtimeData;
  private state: BackgroundUnificationState;
  private items: ProcessingItem[] = [];
  private deepSeekApiKey: string;
  private stateFilePath = './unification-state.json';
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(dataService: GoogleSheetsRealtimeData) {
    super();
    this.dataService = dataService;
    this.deepSeekApiKey = process.env.DEEPSEEK_API_KEY || '';
    
    this.state = {
      isRunning: false,
      isPaused: false,
      currentIndex: 0,
      totalItems: 0,
      processedItems: 0,
      unifiedItems: 0,
      startTime: null,
      lastSaveTime: null,
      quotaExceeded: false,
      errorCount: 0,
      logs: []
    };
  }

  // بدء عملية التوحيد في الخلفية
  async startBackgroundUnification(): Promise<void> {
    try {
      this.addLog('🚀 بدء عملية التوحيد في الخلفية');

      // محاولة استعادة الحالة المحفوظة
      await this.loadSavedState();

      // تحميل البيانات إذا لم تكن محملة
      if (this.items.length === 0) {
        await this.loadItems();
      }

      if (this.items.length === 0) {
        throw new Error('لا توجد بيانات للمعالجة');
      }

      // تحديث الحالة
      this.state.isRunning = true;
      this.state.isPaused = false;
      this.state.quotaExceeded = false;
      this.state.startTime = this.state.startTime || new Date();

      this.addLog(`📊 بدء المعالجة من البند ${this.state.currentIndex + 1} من ${this.state.totalItems}`);

      // بدء المعالجة في الخلفية
      this.startProcessing();

      // حفظ الحالة كل دقيقة
      this.startAutoSave();

    } catch (error: any) {
      this.addLog(`❌ خطأ في بدء التوحيد: ${error.message}`, 'error');
      throw error;
    }
  }

  // تحميل البيانات من Google Sheets
  private async loadItems(): Promise<void> {
    this.addLog('📋 تحميل البيانات من Google Sheets...');
    
    const rawItems = await this.dataService.getAllItems();
    
    // تنظيف وفلترة البيانات
    this.items = rawItems
      .map((item, index) => ({
        id: item.itemNumber || item.id || `ITEM-${index}`,
        description: (item.description || '').trim(),
        partNumber: (item.partNumber || '').trim(),
        rowIndex: index + 2, // Google Sheets rows start from 2
        processed: false
      }))
      .filter(item => 
        item.description.length > 10 && 
        !item.id.startsWith('P-') // تجاهل البنود الموحدة مسبقاً
      );

    this.state.totalItems = this.items.length;
    this.addLog(`✅ تم تحميل ${this.items.length} بند للمعالجة`);
  }

  // بدء المعالجة
  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (!this.state.isRunning || this.state.isPaused || this.state.quotaExceeded) {
        return;
      }

      try {
        await this.processNextItem();
      } catch (error: any) {
        if (error.message.includes('QUOTA_EXCEEDED')) {
          this.handleQuotaExceeded();
        } else {
          this.state.errorCount++;
          this.addLog(`⚠️ خطأ في المعالجة: ${error.message}`, 'error');
          
          // إيقاف العملية إذا تكررت الأخطاء
          if (this.state.errorCount > 10) {
            this.pauseUnification();
            this.addLog('❌ تم إيقاف العملية بسبب تكرار الأخطاء', 'error');
          }
        }
      }
    }, 2000); // معالجة كل ثانيتين لتجنب rate limiting
  }

  // معالجة البند التالي
  private async processNextItem(): Promise<void> {
    if (this.state.currentIndex >= this.items.length) {
      await this.completeUnification();
      return;
    }

    const currentItem = this.items[this.state.currentIndex];
    if (currentItem.processed) {
      this.state.currentIndex++;
      return;
    }

    this.addLog(`🔍 معالجة البند ${this.state.currentIndex + 1}: ${currentItem.description.substring(0, 50)}...`);

    // البحث عن بنود مشابهة باستخدام AI
    const similarItems = await this.findSimilarItems(currentItem);

    if (similarItems.length > 0) {
      // توليد معرف موحد جديد
      const unifiedId = await this.generateUnifiedId();
      
      // تطبيق التوحيد على Google Sheets
      await this.applyUnification(currentItem, similarItems, unifiedId);
      
      this.state.unifiedItems += similarItems.length + 1;
      this.addLog(`✅ تم توحيد ${similarItems.length + 1} بند تحت المعرف ${unifiedId}`);
    }

    // تحديث الحالة
    currentItem.processed = true;
    this.state.processedItems++;
    this.state.currentIndex++;

    // إرسال إشعار للواجهة
    this.emit('progress', {
      processed: this.state.processedItems,
      total: this.state.totalItems,
      unified: this.state.unifiedItems,
      current: currentItem.description.substring(0, 50)
    });
  }

  // البحث عن بنود مشابهة باستخدام DeepSeek
  private async findSimilarItems(targetItem: ProcessingItem): Promise<ProcessingItem[]> {
    const similarItems: ProcessingItem[] = [];

    // البحث في البنود المتبقية
    for (let i = this.state.currentIndex + 1; i < this.items.length; i++) {
      const compareItem = this.items[i];
      if (compareItem.processed) continue;

      try {
        const similarity = await this.calculateAISimilarity(targetItem, compareItem);
        
        if (similarity.score >= 0.8) { // عتبة التشابه العالية
          similarItems.push(compareItem);
          compareItem.processed = true; // تمييزها كمُعالجة
          this.addLog(`🎯 تطابق: ${targetItem.id} ↔ ${compareItem.id} (${similarity.score.toFixed(2)})`);
        }
      } catch (error: any) {
        if (error.message.includes('QUOTA_EXCEEDED')) {
          throw error; // إعادة رمي خطأ نفاد الرصيد
        }
        // تجاهل أخطاء المقارنة الفردية
        console.warn(`تحذير: فشل في مقارنة البند ${compareItem.id}:`, error.message);
      }
    }

    return similarItems;
  }

  // حساب التشابه باستخدام DeepSeek AI
  private async calculateAISimilarity(item1: ProcessingItem, item2: ProcessingItem): Promise<{score: number, reason: string}> {
    if (!this.deepSeekApiKey) {
      // استخدام المقارنة البسيطة إذا لم يتوفر API key
      return this.calculateBasicSimilarity(item1, item2);
    }

    const prompt = `قارن بين هذين المنتجين وحدد مدى التطابق:

المنتج الأول:
- التوصيف: ${item1.description}
- رقم القطعة: ${item1.partNumber || 'غير محدد'}

المنتج الثاني:
- التوصيف: ${item2.description}
- رقم القطعة: ${item2.partNumber || 'غير محدد'}

أجب بـ JSON فقط: {"score": 0.0-1.0, "reason": "السبب بالعربية"}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.deepSeekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 429) {
        throw new Error('QUOTA_EXCEEDED');
      }
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    try {
      const result = JSON.parse(content);
      return {
        score: result.score || 0,
        reason: result.reason || 'تحليل AI'
      };
    } catch {
      // في حالة فشل parsing، استخدم المقارنة البسيطة
      return this.calculateBasicSimilarity(item1, item2);
    }
  }

  // المقارنة البسيطة كبديل
  private calculateBasicSimilarity(item1: ProcessingItem, item2: ProcessingItem): {score: number, reason: string} {
    let score = 0;

    // مقارنة رقم القطعة
    if (item1.partNumber && item2.partNumber && item1.partNumber === item2.partNumber) {
      score += 0.6;
    }

    // مقارنة الكلمات المفتاحية
    const words1 = item1.description.toLowerCase().split(/\s+/);
    const words2 = item2.description.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
    
    const wordSimilarity = (commonWords.length * 2) / (words1.length + words2.length);
    score += wordSimilarity * 0.4;

    return {
      score: Math.min(score, 1.0),
      reason: score > 0.5 ? 'تطابق نصي' : 'تطابق ضعيف'
    };
  }

  // توليد معرف موحد جديد
  private async generateUnifiedId(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `P-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
  }

  // تطبيق التوحيد على Google Sheets
  private async applyUnification(masterItem: ProcessingItem, similarItems: ProcessingItem[], unifiedId: string): Promise<void> {
    const updates = [];

    // تحديث البند الرئيسي
    updates.push({
      range: `DATA!A${masterItem.rowIndex}`,
      values: [[unifiedId]]
    });

    // تحديث البنود المشابهة
    for (const item of similarItems) {
      updates.push({
        range: `DATA!A${item.rowIndex}`,
        values: [[unifiedId]]
      });
    }

    // تطبيق التحديثات
    if (updates.length > 0) {
      await this.dataService.batchUpdate(updates);
    }
  }

  // معالجة نفاد رصيد API
  private handleQuotaExceeded(): void {
    this.state.quotaExceeded = true;
    this.state.isPaused = true;
    this.addLog('🚫 تم نفاد رصيد DeepSeek API - تم إيقاف العملية مؤقتاً', 'warning');
    this.addLog('💡 سيتم استخدام المقارنة البسيطة أو يمكن الاستئناف لاحقاً', 'info');
    
    // حفظ الحالة الحالية
    this.saveState();
    
    // إيقاف المعالجة
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // إرسال إشعار للواجهة
    this.emit('quotaExceeded', {
      processedCount: this.state.processedItems,
      remainingCount: this.state.totalItems - this.state.processedItems
    });
  }

  // إكمال عملية التوحيد
  private async completeUnification(): Promise<void> {
    this.state.isRunning = false;
    this.state.isPaused = false;
    
    const duration = this.state.startTime ? 
      Math.round((Date.now() - this.state.startTime.getTime()) / 1000) : 0;

    this.addLog(`🎉 تم إكمال التوحيد بنجاح!`, 'success');
    this.addLog(`📊 الإحصائيات النهائية:`);
    this.addLog(`   - إجمالي البنود: ${this.state.totalItems}`);
    this.addLog(`   - تمت معالجتها: ${this.state.processedItems}`);
    this.addLog(`   - تم توحيدها: ${this.state.unifiedItems}`);
    this.addLog(`   - وقت المعالجة: ${duration} ثانية`);

    // تنظيف الملفات المؤقتة
    await this.cleanup();

    // إرسال إشعار الإكمال
    this.emit('completed', {
      totalItems: this.state.totalItems,
      processedItems: this.state.processedItems,
      unifiedItems: this.state.unifiedItems,
      duration: duration
    });
  }

  // إيقاف مؤقت
  pauseUnification(): void {
    this.state.isPaused = true;
    this.addLog('⏸️ تم إيقاف العملية مؤقتاً');
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.saveState();
  }

  // استئناف العمل
  resumeUnification(): void {
    if (!this.state.isRunning) return;
    
    this.state.isPaused = false;
    this.state.quotaExceeded = false;
    this.addLog('▶️ تم استئناف العملية');
    
    this.startProcessing();
  }

  // إيقاف نهائي
  stopUnification(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.addLog('🛑 تم إيقاف العملية نهائياً');
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.cleanup();
  }

  // الحصول على الحالة الحالية
  getStatus() {
    return {
      ...this.state,
      progress: this.state.totalItems > 0 ? 
        Math.round((this.state.processedItems / this.state.totalItems) * 100) : 0
    };
  }

  // حفظ الحالة
  private async saveState(): Promise<void> {
    try {
      const stateData = {
        state: this.state,
        items: this.items
      };
      
      await fs.writeFile(this.stateFilePath, JSON.stringify(stateData, null, 2));
      this.state.lastSaveTime = new Date();
    } catch (error) {
      console.error('خطأ في حفظ الحالة:', error);
    }
  }

  // استعادة الحالة المحفوظة
  private async loadSavedState(): Promise<void> {
    try {
      const stateData = await fs.readFile(this.stateFilePath, 'utf8');
      const parsed = JSON.parse(stateData);
      
      this.state = { ...this.state, ...parsed.state };
      this.items = parsed.items || [];
      
      this.addLog(`🔄 تم استعادة الحالة المحفوظة - البند ${this.state.currentIndex + 1} من ${this.state.totalItems}`);
    } catch (error) {
      // لا توجد حالة محفوظة - هذا طبيعي للتشغيل الأول
      this.addLog('📋 بدء جديد - لا توجد حالة محفوظة');
    }
  }

  // بدء الحفظ التلقائي
  private startAutoSave(): void {
    setInterval(() => {
      if (this.state.isRunning) {
        this.saveState();
      }
    }, 60000); // حفظ كل دقيقة
  }

  // تنظيف الملفات المؤقتة
  private async cleanup(): Promise<void> {
    try {
      await fs.unlink(this.stateFilePath);
    } catch (error) {
      // تجاهل أخطاء الحذف
    }
  }

  // إضافة سجل
  private addLog(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const logMessage = `[${timestamp}] ${message}`;
    
    this.state.logs.push(logMessage);
    
    // الاحتفاظ بآخر 100 رسالة فقط
    if (this.state.logs.length > 100) {
      this.state.logs = this.state.logs.slice(-100);
    }
    
    console.log(logMessage);
    
    // إرسال السجل للواجهة
    this.emit('log', { message: logMessage, type });
  }
}