/**
 * نظام التوحيد في الخلفية
 * يعمل تلقائياً حتى لو تم إغلاق المتصفح
 */

import { SemanticUnificationService } from './semantic-unification.js';

class BackgroundUnificationService {
  private unificationService: SemanticUnificationService | null = null;
  private isAutoRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private startTime: Date | null = null;

  constructor() {
    console.log('🔄 تهيئة خدمة التوحيد في الخلفية...');
  }

  /**
   * بدء التشغيل التلقائي في الخلفية
   */
  async startAutoUnification() {
    if (this.isAutoRunning) {
      console.log('⚠️ التوحيد التلقائي يعمل بالفعل - إيقاف وإعادة بدء...');
      this.stopAutoUnification();
    }

    try {
      console.log('🚀 بدء التوحيد التلقائي في الخلفية...');
      
      // تهيئة خدمة التوحيد
      this.unificationService = new SemanticUnificationService();
      await this.unificationService.initialize();
      
      this.isAutoRunning = true;
      this.startTime = new Date();
      
      // بدء عملية التوحيد
      this.runUnificationProcess();
      
      // مراقبة دورية كل 30 ثانية
      this.checkInterval = setInterval(() => {
        this.monitorAndRestart();
      }, 30000);
      
      console.log('✅ تم بدء التوحيد التلقائي في الخلفية');
      
    } catch (error) {
      console.error('❌ فشل في بدء التوحيد التلقائي:', error);
      this.isAutoRunning = false;
    }
  }

  /**
   * تشغيل عملية التوحيد
   */
  private async runUnificationProcess() {
    try {
      if (!this.unificationService) return;
      
      console.log('🧠 بدء عملية التوحيد الذكي...');
      const result = await this.unificationService.runSemanticUnification();
      
      if (result.success) {
        console.log(`✅ اكتمل التوحيد: ${result.unifiedCount} بند موحد من ${result.totalRows}`);
        
        // انتظار قبل إعادة التشغيل (ساعة واحدة)
        setTimeout(() => {
          if (this.isAutoRunning) {
            console.log('🔄 إعادة تشغيل التوحيد التلقائي...');
            this.runUnificationProcess();
          }
        }, 60 * 60 * 1000); // ساعة واحدة
        
      } else {
        console.error('❌ فشل في التوحيد:', result.message);
        // إعادة المحاولة بعد 5 دقائق في حالة الفشل
        setTimeout(() => {
          if (this.isAutoRunning) {
            this.runUnificationProcess();
          }
        }, 5 * 60 * 1000);
      }
      
    } catch (error) {
      console.error('❌ خطأ في عملية التوحيد:', error);
      // إعادة المحاولة بعد 5 دقائق
      setTimeout(() => {
        if (this.isAutoRunning) {
          this.runUnificationProcess();
        }
      }, 5 * 60 * 1000);
    }
  }

  /**
   * مراقبة وإعادة تشغيل إذا لزم الأمر
   */
  private async monitorAndRestart() {
    try {
      if (!this.unificationService || !this.isAutoRunning) return;
      
      const status = this.unificationService.getStatus();
      
      // إذا توقفت العملية، أعد تشغيلها
      if (!status.isRunning && !status.isPaused) {
        console.log('🔄 إعادة تشغيل التوحيد المتوقف...');
        this.runUnificationProcess();
      }
      
      // طباعة حالة دورية
      if (status.isRunning) {
        const elapsed = this.startTime ? 
          Math.round((Date.now() - this.startTime.getTime()) / 1000 / 60) : 0;
        
        console.log(`📊 حالة التوحيد التلقائي: ${status.progress.toFixed(1)}% - ${status.processed}/${status.total} - مدة العمل: ${elapsed}د`);
      }
      
    } catch (error) {
      console.error('❌ خطأ في المراقبة:', error);
    }
  }

  /**
   * إيقاف التشغيل التلقائي
   */
  stopAutoUnification() {
    console.log('🛑 إيقاف التوحيد التلقائي...');
    
    this.isAutoRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.unificationService) {
      this.unificationService.stop();
    }
    
    console.log('✅ تم إيقاف التوحيد التلقائي');
  }

  /**
   * الحصول على حالة التشغيل التلقائي
   */
  getAutoStatus() {
    const status = this.unificationService?.getStatus() || {
      isRunning: false,
      isPaused: false,
      progress: 0,
      total: 0,
      processed: 0,
      unified: 0
    };

    return {
      ...status,
      autoRunning: this.isAutoRunning,
      startTime: this.startTime?.toISOString() || null,
      uptime: this.startTime ? 
        Math.round((Date.now() - this.startTime.getTime()) / 1000 / 60) : 0
    };
  }

  /**
   * إيقاف مؤقت
   */
  pauseAutoUnification() {
    if (this.unificationService) {
      this.unificationService.pause();
      console.log('⏸️ تم إيقاف التوحيد التلقائي مؤقتاً');
    }
  }

  /**
   * استئناف
   */
  resumeAutoUnification() {
    if (this.unificationService) {
      this.unificationService.resume();
      console.log('▶️ تم استئناف التوحيد التلقائي');
    }
  }
}

// إنشاء مثيل واحد للخدمة
export const backgroundUnification = new BackgroundUnificationService();

// بدء التشغيل التلقائي عند بدء الخادم - معطل مؤقتاً
console.log('🔄 تهيئة التوحيد التلقائي في الخلفية - معطل حتى يتم الطلب صراحة...');
// setTimeout(() => {
//   backgroundUnification.startAutoUnification();
// }, 10000); // بدء بعد 10 ثواني من تشغيل الخادم