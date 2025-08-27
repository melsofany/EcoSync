/**
 * خدمة التوحيد الذكي باستخدام DeepSeek API
 * نظام متقدم بـ 3 مستويات للوصول لدقة 100%
 */

import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

class DeepSeekUnificationService {
  private static instance: DeepSeekUnificationService;
  private sheets: any;
  private spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  private DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  
  // حالة التوحيد
  private isRunning = false;
  private shouldStop = false;
  private status = {
    totalItems: 0,
    processedItems: 0,
    itemsUnified: 0,
    duplicateGroups: 0,
    currentItem: null as string | null,
    progress: 0,
    logs: [] as string[],
    startTime: null as string | null,
    endTime: null as string | null
  };

  // إحصائيات المستويات
  private levelStats = {
    level1Matches: 0,
    level2Matches: 0,
    level3Matches: 0,
    totalApiCalls: 0,
    failedCalls: 0
  };

  private constructor() {
    console.log('🚀 تهيئة خدمة التوحيد الذكي بـ DeepSeek (3 مستويات)...');
    this.initializeGoogleSheets();
  }

  static getInstance() {
    if (!DeepSeekUnificationService.instance) {
      DeepSeekUnificationService.instance = new DeepSeekUnificationService();
    }
    return DeepSeekUnificationService.instance;
  }

  private async initializeGoogleSheets() {
    try {
      const keyFile = JSON.parse(
        fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8')
      );
      
      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      console.log('✅ تم تهيئة Google Sheets لخدمة التوحيد الذكي بـ DeepSeek');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error);
    }
  }

  /**
   * جلب حالة التوحيد الحالية
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      ...this.status,
      levelStats: this.levelStats
    };
  }

  /**
   * بدء عملية التوحيد
   */
  async startUnification(batchSize: number = 50) {
    console.log('🔍 محاولة بدء التوحيد الذكي...');
    
    if (this.isRunning) {
      console.warn('⚠️ التوحيد يعمل بالفعل!');
      throw new Error('عملية التوحيد قيد التشغيل بالفعل');
    }

    if (!this.DEEPSEEK_API_KEY) {
      console.error('❌ DEEPSEEK_API_KEY غير موجود!');
      throw new Error('DEEPSEEK_API_KEY غير موجود في متغيرات البيئة');
    }
    
    console.log('✅ DEEPSEEK_API_KEY موجود ومُعد بشكل صحيح');
    console.log(`📦 بدء التوحيد بحجم دفعة: ${batchSize}`);

    this.isRunning = true;
    this.shouldStop = false;
    this.status = {
      totalItems: 0,
      processedItems: 0,
      itemsUnified: 0,
      duplicateGroups: 0,
      currentItem: null,
      progress: 0,
      logs: [],
      startTime: new Date().toISOString(),
      endTime: null
    };

    this.levelStats = {
      level1Matches: 0,
      level2Matches: 0,
      level3Matches: 0,
      totalApiCalls: 0,
      failedCalls: 0
    };

    this.addLog('🚀 بدء التوحيد الذكي بـ DeepSeek API (3 مستويات)');
    
    // تشغيل التوحيد في الخلفية
    this.runUnificationProcess(batchSize).catch(error => {
      console.error('❌ خطأ في عملية التوحيد:', error);
      this.addLog(`❌ خطأ: ${error.message}`);
      this.isRunning = false;
      this.status.endTime = new Date().toISOString();
    });

    return { success: true, message: 'تم بدء عملية التوحيد الذكي' };
  }

  /**
   * إيقاف عملية التوحيد
   */
  stopUnification() {
    if (!this.isRunning) {
      return { success: false, message: 'لا توجد عملية توحيد قيد التشغيل' };
    }

    this.shouldStop = true;
    this.addLog('⏹️ تم طلب إيقاف التوحيد');
    
    return { success: true, message: 'تم إيقاف عملية التوحيد' };
  }

  /**
   * إعادة تعيين الحالة
   */
  resetUnification() {
    if (this.isRunning) {
      return { success: false, message: 'لا يمكن إعادة التعيين أثناء التشغيل' };
    }

    this.status = {
      totalItems: 0,
      processedItems: 0,
      itemsUnified: 0,
      duplicateGroups: 0,
      currentItem: null,
      progress: 0,
      logs: [],
      startTime: null,
      endTime: null
    };

    this.levelStats = {
      level1Matches: 0,
      level2Matches: 0,
      level3Matches: 0,
      totalApiCalls: 0,
      failedCalls: 0
    };

    return { success: true, message: 'تم إعادة تعيين الحالة' };
  }

  /**
   * إضافة سجل
   */
  private addLog(message: string) {
    const timestamp = new Date().toLocaleString('ar-EG');
    const logMessage = `[${timestamp}] ${message}`;
    this.status.logs.push(logMessage);
    console.log(logMessage);

    // الاحتفاظ بآخر 100 سجل فقط
    if (this.status.logs.length > 100) {
      this.status.logs = this.status.logs.slice(-100);
    }
  }

  /**
   * تشغيل عملية التوحيد
   */
  private async runUnificationProcess(batchSize: number) {
    try {
      // قراءة البيانات من Google Sheets
      this.addLog('📖 قراءة البيانات من Google Sheets...');
      
      if (!this.sheets) {
        await this.initializeGoogleSheets();
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:E'
      });

      const rows = response.data.values || [];
      const items = [];
      const existingIds = new Set();

      // تحضير البيانات (البدء من الصف الثاني)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const item = {
          rowNumber: i + 1,
          id: row[0] || '',
          uom: row[1] || '',
          lineItem: row[2] || '',
          partNumber: row[3] || '',
          description: row[4] || ''
        };
        
        items.push(item);
        
        if (item.id && item.id.startsWith('P-')) {
          existingIds.add(item.id);
        }
      }

      this.status.totalItems = items.length;
      this.addLog(`✅ تم قراءة ${items.length} بند من Google Sheets`);

      // إنشاء المجموعات
      const groups = [];
      const processedIndices = new Set();
      let unifiedCount = 0;

      for (let i = 0; i < items.length; i++) {
        if (this.shouldStop) {
          this.addLog('⏹️ تم إيقاف التوحيد بناء على طلب المستخدم');
          break;
        }

        if (processedIndices.has(i)) continue;

        const currentItem = items[i];
        
        // تحديث الحالة
        this.status.processedItems = i + 1;
        this.status.currentItem = currentItem.description ? 
          currentItem.description.substring(0, 50) + '...' : 'بند #' + currentItem.rowNumber;
        this.status.progress = (this.status.processedItems / this.status.totalItems) * 100;

        // تخطي البنود بدون وصف
        if (!currentItem.description) {
          processedIndices.add(i);
          continue;
        }

        // إذا البند له معرف، تخطي
        if (currentItem.id && currentItem.id.startsWith('P-')) {
          processedIndices.add(i);
          continue;
        }

        // إنشاء مجموعة جديدة
        const group = {
          id: currentItem.id || null,
          items: [i],
          description: currentItem.description,
          matchLevel: 0
        };

        // البحث عن البنود المتطابقة
        for (let j = i + 1; j < items.length; j++) {
          if (processedIndices.has(j)) continue;
          
          const compareItem = items[j];
          if (!compareItem.description) continue;

          // التوحيد بـ 3 مستويات
          let matchResult = { match: false, confidence: 0, level: 0 };
          
          // مطابقة سريعة أولاً
          if (currentItem.description === compareItem.description) {
            matchResult = { match: true, confidence: 100, level: 0 };
          } else {
            // استخدام DeepSeek للمطابقة الذكية
            matchResult = await this.compareWithDeepSeekMultiLevel(currentItem, compareItem);
          }

          if (matchResult.match) {
            group.items.push(j);
            processedIndices.add(j);
            unifiedCount++;
            
            // تحديث إحصائيات المستوى
            if (matchResult.level === 1) this.levelStats.level1Matches++;
            else if (matchResult.level === 2) this.levelStats.level2Matches++;
            else if (matchResult.level === 3) this.levelStats.level3Matches++;
            
            if (group.matchLevel < matchResult.level) {
              group.matchLevel = matchResult.level;
            }
            
            // تحديث المعرف
            if (!group.id && compareItem.id) {
              group.id = compareItem.id;
            }
          }
        }

        processedIndices.add(i);
        groups.push(group);

        // تحديث الإحصائيات
        if (group.items.length > 1) {
          this.status.duplicateGroups++;
          this.status.itemsUnified += group.items.length;
        }

        // معالجة على دفعات مع تحديث اللوج
        if (i % 10 === 0 && i > 0) {
          const percentComplete = Math.round(this.status.progress);
          this.addLog(`⏳ المعالجة: ${i}/${items.length} (${percentComplete}%) | L1:${this.levelStats.level1Matches} L2:${this.levelStats.level2Matches} L3:${this.levelStats.level3Matches}`);
          await this.delay(100);
        }
      }

      // كتابة النتائج إلى Google Sheets
      if (!this.shouldStop) {
        this.addLog('💾 كتابة المعرفات الموحدة إلى Google Sheets...');
        const updates = [];

        for (const group of groups) {
          let groupId = group.id;
          
          if (!groupId || !groupId.startsWith('P-')) {
            groupId = this.generateNewId(existingIds);
            existingIds.add(groupId);
          }

          for (const itemIndex of group.items) {
            const item = items[itemIndex];
            if (item.id !== groupId) {
              updates.push({
                range: `DATA!A${item.rowNumber}`,
                values: [[groupId]]
              });
            }
          }
        }

        // كتابة التحديثات
        if (updates.length > 0) {
          const batchSize = 500;
          for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            await this.sheets.spreadsheets.values.batchUpdate({
              spreadsheetId: this.spreadsheetId,
              requestBody: {
                data: batch,
                valueInputOption: 'RAW'
              }
            });
            this.addLog(`✅ تم تحديث ${Math.min(i + batchSize, updates.length)}/${updates.length} صف`);
          }
        }
      }

      // الانتهاء
      this.status.endTime = new Date().toISOString();
      const duration = this.formatDuration(this.status.startTime, this.status.endTime);
      
      this.addLog(`🎉 اكتمل التوحيد الذكي!`);
      this.addLog(`📊 النتائج النهائية:`);
      this.addLog(`   • ${this.status.duplicateGroups} مجموعة مكررة`);
      this.addLog(`   • ${this.status.itemsUnified} بند موحد`);
      this.addLog(`   • المستوى 1: ${this.levelStats.level1Matches} تطابق`);
      this.addLog(`   • المستوى 2: ${this.levelStats.level2Matches} تطابق`);
      this.addLog(`   • المستوى 3: ${this.levelStats.level3Matches} تطابق`);
      this.addLog(`   • إجمالي استدعاءات API: ${this.levelStats.totalApiCalls}`);
      this.addLog(`   • استدعاءات فاشلة: ${this.levelStats.failedCalls}`);
      this.addLog(`   • الوقت المستغرق: ${duration}`);
      
    } catch (error: any) {
      this.addLog(`❌ خطأ: ${error.message}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * مقارنة متعددة المستويات باستخدام DeepSeek
   */
  private async compareWithDeepSeekMultiLevel(item1: any, item2: any): Promise<{match: boolean, confidence: number, level: number}> {
    try {
      this.levelStats.totalApiCalls++;
      
      // تحضير البيانات للمقارنة
      const comparison = {
        item1: {
          description: item1.description || '',
          partNumber: item1.partNumber || '',
          lineItem: item1.lineItem || ''
        },
        item2: {
          description: item2.description || '',
          partNumber: item2.partNumber || '',
          lineItem: item2.lineItem || ''
        }
      };

      // المستوى 1: الوصف فقط (عتبة 85%)
      if (comparison.item1.description && comparison.item2.description) {
        const level1Result = await this.compareLevel(comparison, 1);
        if (level1Result.match && level1Result.confidence >= 85) {
          return { ...level1Result, level: 1 };
        }
      }

      // المستوى 2: الوصف + رقم القطعة (عتبة 80%)
      if (comparison.item1.partNumber && comparison.item2.partNumber) {
        const level2Result = await this.compareLevel(comparison, 2);
        if (level2Result.match && level2Result.confidence >= 80) {
          return { ...level2Result, level: 2 };
        }
      }

      // المستوى 3: كل الحقول (عتبة 75%)
      if (comparison.item1.lineItem && comparison.item2.lineItem) {
        const level3Result = await this.compareLevel(comparison, 3);
        if (level3Result.match && level3Result.confidence >= 75) {
          return { ...level3Result, level: 3 };
        }
      }

      return { match: false, confidence: 0, level: 0 };
      
    } catch (error) {
      this.levelStats.failedCalls++;
      return { match: false, confidence: 0, level: 0 };
    }
  }

  /**
   * مقارنة مستوى واحد
   */
  private async compareLevel(comparison: any, level: number) {
    try {
      let prompt = '';
      
      if (level === 1) {
        prompt = `قارن بين هذين الوصفين فقط:
الوصف 1: ${comparison.item1.description}
الوصف 2: ${comparison.item2.description}

هل هما نفس المنتج؟ أجب بـ JSON فقط: {"match": true/false, "confidence": 0-100}`;
      
      } else if (level === 2) {
        prompt = `قارن بين هذين المنتجين (الوصف + رقم القطعة):
المنتج 1:
- الوصف: ${comparison.item1.description}
- رقم القطعة: ${comparison.item1.partNumber}

المنتج 2:
- الوصف: ${comparison.item2.description}
- رقم القطعة: ${comparison.item2.partNumber}

هل هما نفس المنتج؟ أجب بـ JSON فقط: {"match": true/false, "confidence": 0-100}`;
      
      } else if (level === 3) {
        prompt = `قارن بين هذين المنتجين بكل التفاصيل:
المنتج 1:
- الوصف: ${comparison.item1.description}
- رقم القطعة: ${comparison.item1.partNumber}
- رقم البند: ${comparison.item1.lineItem}

المنتج 2:
- الوصف: ${comparison.item2.description}
- رقم القطعة: ${comparison.item2.partNumber}
- رقم البند: ${comparison.item2.lineItem}

هل هما نفس المنتج؟ أجب بـ JSON فقط: {"match": true/false, "confidence": 0-100}`;
      }

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: 'أنت خبير في مطابقة المنتجات. قارن بدقة عالية واعط النتيجة كـ JSON فقط.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        this.levelStats.failedCalls++;
        return { match: false, confidence: 0 };
      }

      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content || '{}';
      
      try {
        const result = JSON.parse(resultText);
        return {
          match: result.match === true,
          confidence: parseInt(result.confidence) || 0
        };
      } catch (e) {
        return { match: false, confidence: 0 };
      }
    } catch (error) {
      this.levelStats.failedCalls++;
      return { match: false, confidence: 0 };
    }
  }

  /**
   * توليد معرف جديد
   */
  private generateNewId(existingIds: Set<string>) {
    let maxNum = 0;
    for (const id of existingIds) {
      if (id && id.startsWith('P-')) {
        const num = parseInt(id.substring(2));
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `P-${String(maxNum + 1).padStart(7, '0')}`;
  }

  /**
   * تنسيق المدة
   */
  private formatDuration(startTime: string | null, endTime: string | null): string {
    if (!startTime || !endTime) return '-';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffInSeconds = Math.round((end - start) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} ثانية`;
    if (diffInSeconds < 3600) return `${Math.round(diffInSeconds / 60)} دقيقة`;
    return `${Math.round(diffInSeconds / 3600)} ساعة`;
  }

  /**
   * تأخير
   */
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const deepSeekUnificationService = DeepSeekUnificationService.getInstance();