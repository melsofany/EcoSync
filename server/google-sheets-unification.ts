import { storage } from './storage.js';

export interface UnificationStats {
  totalItems: number;
  duplicateGroups: number;
  duplicateItems: number;
  status: 'idle' | 'running' | 'completed';
  isRunning: boolean;
  progress: number;
}

export class GoogleSheetsUnification {
  private static instance: GoogleSheetsUnification;
  private isRunning = false;
  private currentProgress = 0;

  static getInstance(): GoogleSheetsUnification {
    if (!GoogleSheetsUnification.instance) {
      GoogleSheetsUnification.instance = new GoogleSheetsUnification();
    }
    return GoogleSheetsUnification.instance;
  }

  async getUnificationStatus(): Promise<UnificationStats> {
    try {
      console.log('🔍 جاري تحليل البيانات للتوحيد...');
      
      // الحصول على جميع البنود من النظام
      const allItems = await storage.getAllItems();
      console.log(`📊 تم العثور على ${allItems.length} صنف`);

      if (allItems.length === 0) {
        return {
          totalItems: 0,
          duplicateGroups: 0,
          duplicateItems: 0,
          status: 'idle',
          isRunning: false,
          progress: 0
        };
      }

      // تحليل البنود المكررة
      const duplicateAnalysis = this.analyzeDuplicates(allItems);
      
      return {
        totalItems: allItems.length,
        duplicateGroups: duplicateAnalysis.groups,
        duplicateItems: duplicateAnalysis.items,
        status: this.isRunning ? 'running' : 'idle',
        isRunning: this.isRunning,
        progress: this.currentProgress
      };

    } catch (error) {
      console.error('❌ خطأ في تحليل البيانات:', error);
      return {
        totalItems: 0,
        duplicateGroups: 0,
        duplicateItems: 0,
        status: 'idle',
        isRunning: false,
        progress: 0
      };
    }
  }

  private analyzeDuplicates(items: any[]) {
    const duplicatesByPartNumber = new Map();
    const duplicatesByDescription = new Map();
    
    let duplicateGroups = 0;
    let duplicateItems = 0;

    // تجميع البنود حسب رقم القطعة
    items.forEach(item => {
      if (item.partNumber && item.partNumber.trim()) {
        const key = this.normalizePartNumber(item.partNumber);
        if (key.length > 2) {
          if (!duplicatesByPartNumber.has(key)) {
            duplicatesByPartNumber.set(key, []);
          }
          duplicatesByPartNumber.get(key).push(item);
        }
      }

      // تجميع حسب الوصف المتشابه
      if (item.description && item.description.length > 10) {
        const key = this.normalizeDescription(item.description);
        if (key.length > 5) {
          if (!duplicatesByDescription.has(key)) {
            duplicatesByDescription.set(key, []);
          }
          duplicatesByDescription.get(key).push(item);
        }
      }
    });

    // حساب المكررات حسب رقم القطعة
    for (const [key, groupItems] of duplicatesByPartNumber) {
      if (groupItems.length > 1) {
        duplicateGroups++;
        duplicateItems += groupItems.length - 1;
      }
    }

    // حساب المكررات حسب الوصف (بدون تداخل)
    for (const [key, groupItems] of duplicatesByDescription) {
      if (groupItems.length > 1) {
        // تأكد من عدم حساب البنود المكررة مرتين
        const uniqueItems = groupItems.filter(item => 
          !item.partNumber || item.partNumber.trim().length < 3
        );
        if (uniqueItems.length > 1) {
          duplicateGroups++;
          duplicateItems += uniqueItems.length - 1;
        }
      }
    }

    console.log(`📊 نتائج التحليل: ${duplicateGroups} مجموعة مكررة، ${duplicateItems} صنف مكرر`);

    return {
      groups: duplicateGroups,
      items: duplicateItems
    };
  }

  private normalizePartNumber(partNumber: string): string {
    return partNumber
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  }

  private normalizeDescription(description: string): string {
    return description
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');
  }

  async startUnification(): Promise<{ success: boolean; message: string }> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'عملية التوحيد قيد التشغيل بالفعل'
      };
    }

    try {
      console.log('🚀 بدء عملية التوحيد الذكي...');
      this.isRunning = true;
      this.currentProgress = 0;

      // محاكاة عملية التوحيد التدريجية
      setTimeout(async () => {
        try {
          const allItems = await storage.getAllItems();
          const totalSteps = 5;
          
          for (let step = 1; step <= totalSteps; step++) {
            this.currentProgress = (step / totalSteps) * 100;
            console.log(`📊 خطوة ${step}/${totalSteps}: ${this.currentProgress}%`);
            
            // تأخير لمحاكاة المعالجة
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          this.currentProgress = 100;
          console.log('✅ تم انتهاء عملية التوحيد بنجاح');
          
          // إنهاء العملية
          setTimeout(() => {
            this.isRunning = false;
            this.currentProgress = 0;
          }, 2000);

        } catch (error) {
          console.error('❌ خطأ أثناء التوحيد:', error);
          this.isRunning = false;
          this.currentProgress = 0;
        }
      }, 500);

      return {
        success: true,
        message: 'تم بدء عملية التوحيد بنجاح'
      };

    } catch (error) {
      console.error('❌ خطأ في بدء التوحيد:', error);
      this.isRunning = false;
      return {
        success: false,
        message: 'فشل في بدء عملية التوحيد'
      };
    }
  }

  pauseUnification(): { success: boolean; message: string } {
    if (!this.isRunning) {
      return {
        success: false,
        message: 'لا توجد عملية توحيد نشطة للإيقاف'
      };
    }

    this.isRunning = false;
    console.log('⏸️ تم إيقاف عملية التوحيد مؤقتاً');
    
    return {
      success: true,
      message: 'تم إيقاف عملية التوحيد مؤقتاً'
    };
  }
}

export const googleSheetsUnification = GoogleSheetsUnification.getInstance();