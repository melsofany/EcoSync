import { storage } from './storage.js';
import { nanoid } from 'nanoid';

export interface UnificationSession {
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  totalItems: number;
  processedRows: number;
  unifiedItems: number;
  currentItemName: string;
  currentPartNumber: string;
  startedAt: Date;
  lastUpdateAt: Date;
  estimatedTimeRemaining: number;
  aiRequestsCount: number;
  successfulMatches: number;
  failedRequests: number;
  averageProcessingTime: number;
  userId: string;
}

export interface UnificationUpdate {
  processedRows?: number;
  unifiedItems?: number;
  currentItemName?: string;
  currentPartNumber?: string;
  estimatedTimeRemaining?: number;
}

export class UnificationProgressTracker {
  private static instance: UnificationProgressTracker;
  private currentSession: UnificationSession | null = null;
  private processingTimes: number[] = [];
  private sessionStartTime: number = 0;

  static getInstance(): UnificationProgressTracker {
    if (!UnificationProgressTracker.instance) {
      UnificationProgressTracker.instance = new UnificationProgressTracker();
    }
    return UnificationProgressTracker.instance;
  }

  /**
   * بدء جلسة توحيد جديدة
   */
  startSession(totalItems: number, userId: string): string {
    const sessionId = nanoid();
    const now = new Date();

    this.currentSession = {
      sessionId,
      status: 'running',
      totalItems,
      processedRows: 0,
      unifiedItems: 0,
      currentItemName: '',
      currentPartNumber: '',
      startedAt: now,
      lastUpdateAt: now,
      estimatedTimeRemaining: 0,
      aiRequestsCount: 0,
      successfulMatches: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      userId
    };

    this.sessionStartTime = Date.now();
    this.processingTimes = [];

    // حفظ في قاعدة البيانات
    this.saveToDatabase();

    console.log(`🚀 بدء جلسة توحيد جديدة: ${sessionId}`);
    console.log(`📊 إجمالي البنود: ${totalItems}`);

    return sessionId;
  }

  /**
   * تحديث تقدم الجلسة
   */
  updateProgress(updates: UnificationUpdate): void {
    if (!this.currentSession) return;

    const now = new Date();
    
    // تحديث البيانات
    Object.assign(this.currentSession, {
      ...updates,
      lastUpdateAt: now
    });

    // حساب الوقت المتبقي المتوقع
    if (this.currentSession.processedRows > 0) {
      const elapsed = Date.now() - this.sessionStartTime;
      const avgTimePerItem = elapsed / this.currentSession.processedRows;
      const remainingItems = this.currentSession.totalItems - this.currentSession.processedRows;
      this.currentSession.estimatedTimeRemaining = Math.round((remainingItems * avgTimePerItem) / 1000);
    }

    // حفظ في قاعدة البيانات
    this.saveToDatabase();
  }

  /**
   * تحديث البند الحالي قيد المعالجة
   */
  updateCurrentItem(itemName: string, partNumber?: string): void {
    if (!this.currentSession) return;

    this.currentSession.currentItemName = itemName;
    this.currentSession.currentPartNumber = partNumber || '';
    this.currentSession.lastUpdateAt = new Date();

    console.log(`🔄 معالجة: ${itemName} - ${partNumber || 'بدون رقم قطعة'}`);
  }

  /**
   * تسجيل طلب الذكاء الاصطناعي
   */
  recordAIRequest(success: boolean, errorMessage?: string): void {
    if (!this.currentSession) return;

    this.currentSession.aiRequestsCount++;
    
    if (success) {
      // حساب متوسط وقت المعالجة
      const processingTime = Date.now() - this.sessionStartTime;
      this.processingTimes.push(processingTime);
      
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-50); // الاحتفاظ بآخر 50 قيمة
      }

      this.currentSession.averageProcessingTime = 
        this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length / 1000;
    } else {
      this.currentSession.failedRequests++;
      console.error(`❌ فشل طلب AI: ${errorMessage}`);
    }

    this.currentSession.lastUpdateAt = new Date();
  }

  /**
   * تسجيل توحيد ناجح
   */
  recordUnification(masterItemId: string, duplicateItemIds: string[], confidence: number): void {
    if (!this.currentSession) return;

    this.currentSession.successfulMatches++;
    this.currentSession.unifiedItems += duplicateItemIds.length;
    this.currentSession.lastUpdateAt = new Date();

    console.log(`✅ توحيد ناجح: ${masterItemId} مع ${duplicateItemIds.length} بند (ثقة: ${confidence}%)`);
  }

  /**
   * إيقاف الجلسة مؤقتاً
   */
  pauseSession(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'paused';
    this.currentSession.lastUpdateAt = new Date();

    console.log('⏸️ تم إيقاف الجلسة مؤقتاً');
    this.saveToDatabase();
  }

  /**
   * استئناف الجلسة
   */
  resumeSession(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'running';
    this.currentSession.lastUpdateAt = new Date();

    console.log('▶️ تم استئناف الجلسة');
    this.saveToDatabase();
  }

  /**
   * إنهاء الجلسة
   */
  endSession(status: 'completed' | 'error'): void {
    if (!this.currentSession) return;

    this.currentSession.status = status;
    this.currentSession.lastUpdateAt = new Date();

    const duration = Date.now() - this.sessionStartTime;
    const durationMinutes = Math.round(duration / 60000);

    console.log(`🏁 انتهت الجلسة: ${this.currentSession.sessionId}`);
    console.log(`📊 النتائج النهائية:`);
    console.log(`   - المعالج: ${this.currentSession.processedRows}/${this.currentSession.totalItems}`);
    console.log(`   - الموحد: ${this.currentSession.unifiedItems} بند`);
    console.log(`   - طلبات AI: ${this.currentSession.aiRequestsCount}`);
    console.log(`   - مطابقات ناجحة: ${this.currentSession.successfulMatches}`);
    console.log(`   - المدة: ${durationMinutes} دقيقة`);

    this.saveToDatabase();
    this.currentSession = null;
  }

  /**
   * الحصول على الجلسة الحالية
   */
  getCurrentSession(): UnificationSession | null {
    return this.currentSession;
  }

  /**
   * الحصول على تقدم الجلسة كنسبة مئوية
   */
  getProgressPercentage(): number {
    if (!this.currentSession || this.currentSession.totalItems === 0) return 0;
    return (this.currentSession.processedRows / this.currentSession.totalItems) * 100;
  }

  /**
   * الحصول على إحصائيات الجلسة
   */
  getSessionStats(): {
    totalTime: number;
    avgTimePerItem: number;
    successRate: number;
    unificationRate: number;
  } | null {
    if (!this.currentSession) return null;

    const totalTime = Date.now() - this.sessionStartTime;
    const avgTimePerItem = this.currentSession.processedRows > 0 
      ? totalTime / this.currentSession.processedRows / 1000 
      : 0;
    
    const successRate = this.currentSession.aiRequestsCount > 0 
      ? ((this.currentSession.aiRequestsCount - this.currentSession.failedRequests) / this.currentSession.aiRequestsCount) * 100
      : 0;
    
    const unificationRate = this.currentSession.processedRows > 0 
      ? (this.currentSession.unifiedItems / this.currentSession.processedRows) * 100
      : 0;

    return {
      totalTime: Math.round(totalTime / 1000),
      avgTimePerItem,
      successRate,
      unificationRate
    };
  }

  /**
   * حفظ الجلسة في قاعدة البيانات
   */
  private async saveToDatabase(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // التحقق من وجود الجلسة في قاعدة البيانات
      const existingProgress = await storage.getUnificationProgressBySession(this.currentSession.sessionId);

      if (existingProgress) {
        // تحديث الجلسة الموجودة
        await storage.updateUnificationProgress(this.currentSession.sessionId, {
          status: this.currentSession.status,
          processedRows: this.currentSession.processedRows,
          unifiedItems: this.currentSession.unifiedItems,
          currentItemName: this.currentSession.currentItemName,
          currentPartNumber: this.currentSession.currentPartNumber,
          estimatedTimeRemaining: this.currentSession.estimatedTimeRemaining,
          aiRequestsCount: this.currentSession.aiRequestsCount,
          successfulMatches: this.currentSession.successfulMatches,
          failedRequests: this.currentSession.failedRequests,
          averageProcessingTime: this.currentSession.averageProcessingTime,
          lastUpdateAt: this.currentSession.lastUpdateAt
        });
      } else {
        // إنشاء جلسة جديدة
        await storage.createUnificationProgress({
          sessionId: this.currentSession.sessionId,
          status: this.currentSession.status,
          totalItems: this.currentSession.totalItems,
          processedRows: this.currentSession.processedRows,
          unifiedItems: this.currentSession.unifiedItems,
          currentItemName: this.currentSession.currentItemName,
          currentPartNumber: this.currentSession.currentPartNumber,
          startedAt: this.currentSession.startedAt,
          lastUpdateAt: this.currentSession.lastUpdateAt,
          estimatedTimeRemaining: this.currentSession.estimatedTimeRemaining,
          aiRequestsCount: this.currentSession.aiRequestsCount,
          successfulMatches: this.currentSession.successfulMatches,
          failedRequests: this.currentSession.failedRequests,
          averageProcessingTime: this.currentSession.averageProcessingTime,
          userId: this.currentSession.userId
        });
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ تقدم التوحيد:', error);
    }
  }

  /**
   * استرداد آخر جلسة من قاعدة البيانات
   */
  async restoreLatestSession(): Promise<void> {
    try {
      const latestProgress = await storage.getLatestUnificationProgress();
      
      if (latestProgress && (latestProgress.status === 'running' || latestProgress.status === 'paused')) {
        this.currentSession = {
          sessionId: latestProgress.sessionId,
          status: latestProgress.status,
          totalItems: latestProgress.totalItems,
          processedRows: latestProgress.processedRows,
          unifiedItems: latestProgress.unifiedItems,
          currentItemName: latestProgress.currentItemName,
          currentPartNumber: latestProgress.currentPartNumber,
          startedAt: new Date(latestProgress.startedAt),
          lastUpdateAt: new Date(latestProgress.lastUpdateAt),
          estimatedTimeRemaining: latestProgress.estimatedTimeRemaining,
          aiRequestsCount: latestProgress.aiRequestsCount,
          successfulMatches: latestProgress.successfulMatches,
          failedRequests: latestProgress.failedRequests,
          averageProcessingTime: latestProgress.averageProcessingTime,
          userId: latestProgress.userId
        };

        this.sessionStartTime = new Date(latestProgress.startedAt).getTime();
        
        console.log(`🔄 تم استرداد الجلسة: ${latestProgress.sessionId} (${latestProgress.status})`);
      }
    } catch (error) {
      console.error('❌ خطأ في استرداد الجلسة:', error);
    }
  }

  /**
   * حذف جلسة معينة
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await storage.deleteUnificationProgress(sessionId);
      
      if (this.currentSession && this.currentSession.sessionId === sessionId) {
        this.currentSession = null;
      }

      console.log(`🗑️ تم حذف الجلسة: ${sessionId}`);
    } catch (error) {
      console.error('❌ خطأ في حذف الجلسة:', error);
    }
  }

  /**
   * تنظيف الجلسات القديمة
   */
  async cleanupOldSessions(daysOld: number = 7): Promise<void> {
    // يمكن تنفيذ هذه الدالة لحذف الجلسات القديمة
    console.log(`🧹 تنظيف الجلسات الأقدم من ${daysOld} أيام`);
    // تنفيذ منطق التنظيف هنا
  }
}

// تصدير مثيل واحد للاستخدام العام
export const unificationTracker = UnificationProgressTracker.getInstance();