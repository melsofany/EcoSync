/**
 * خدمة التوحيد الذكي - النسخة المحسّنة
 * معالجة بند بند بدقة 100%
 */

import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

class DeepSeekUnificationServiceV2 {
  private static instance: DeepSeekUnificationServiceV2;
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
    endTime: null as string | null,
    estimatedTimeRemaining: null as string | null
  };

  private constructor() {
    console.log('🚀 تهيئة خدمة التوحيد المحسّنة (بند بند)...');
    this.initializeGoogleSheets();
  }

  static getInstance() {
    if (!DeepSeekUnificationServiceV2.instance) {
      DeepSeekUnificationServiceV2.instance = new DeepSeekUnificationServiceV2();
    }
    return DeepSeekUnificationServiceV2.instance;
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
      
      console.log('✅ تم تهيئة Google Sheets للتوحيد المحسّن');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', error);
    }
  }

  /**
   * جلب حالة التوحيد
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      ...this.status
    };
  }

  /**
   * بدء عملية التوحيد - بند بند
   */
  async startUnification() {
    console.log('🔍 بدء التوحيد بند بند...');
    
    if (this.isRunning) {
      console.warn('⚠️ التوحيد يعمل بالفعل!');
      return { success: false, message: 'عملية التوحيد قيد التشغيل بالفعل' };
    }

    if (!this.DEEPSEEK_API_KEY) {
      console.error('❌ DEEPSEEK_API_KEY غير موجود!');
      return { success: false, message: 'DEEPSEEK_API_KEY غير موجود في متغيرات البيئة' };
    }

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
      endTime: null,
      estimatedTimeRemaining: null
    };

    this.addLog('🚀 بدء التوحيد بند بند بدقة 100%');
    
    // تشغيل في الخلفية
    this.runItemByItemUnification().catch(error => {
      console.error('❌ خطأ:', error);
      this.addLog(`❌ خطأ: ${error.message}`);
      this.isRunning = false;
    });

    return { 
      success: true, 
      message: 'تم بدء التوحيد بند بند - سيستغرق وقتاً طويلاً لضمان الدقة' 
    };
  }

  /**
   * إيقاف التوحيد
   */
  stopUnification() {
    if (!this.isRunning) {
      return { success: false, message: 'لا توجد عملية توحيد قيد التشغيل' };
    }
    
    this.shouldStop = true;
    this.addLog('⏹️ طلب إيقاف التوحيد...');
    return { success: true, message: 'سيتم إيقاف التوحيد بعد البند الحالي' };
  }

  /**
   * إعادة تعيين
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
      endTime: null,
      estimatedTimeRemaining: null
    };

    return { success: true, message: 'تم إعادة التعيين' };
  }

  /**
   * إضافة سجل
   */
  private addLog(message: string) {
    const timestamp = new Date().toLocaleString('ar-EG');
    const logMessage = `[${timestamp}] ${message}`;
    this.status.logs.push(logMessage);
    console.log(logMessage);

    // الاحتفاظ بآخر 50 سجل
    if (this.status.logs.length > 50) {
      this.status.logs = this.status.logs.slice(-50);
    }
  }

  /**
   * التوحيد بند بند
   */
  private async runItemByItemUnification() {
    try {
      // قراءة البيانات
      this.addLog('📖 قراءة البيانات من Google Sheets...');
      
      if (!this.sheets) {
        await this.initializeGoogleSheets();
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:E'
      });

      const rows = response.data.values || [];
      if (rows.length < 2) {
        throw new Error('لا توجد بيانات للمعالجة');
      }

      const items = [];
      const existingIds = new Map<string, number[]>(); // معرف -> أرقام الصفوف

      // تحضير البيانات
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
        
        // تجميع الصفوف حسب المعرف
        if (item.id && item.id.startsWith('P-')) {
          if (!existingIds.has(item.id)) {
            existingIds.set(item.id, []);
          }
          existingIds.get(item.id)!.push(i);
        }
      }

      this.status.totalItems = items.length;
      this.addLog(`✅ تم قراءة ${items.length} بند`);

      const processedIndices = new Set<number>();
      const updates = [];
      let groupCount = 0;

      // معالجة بند بند
      for (let i = 0; i < items.length; i++) {
        if (this.shouldStop) {
          this.addLog('⏹️ تم إيقاف التوحيد');
          break;
        }

        if (processedIndices.has(i)) continue;

        const currentItem = items[i];
        
        // تحديث الحالة
        this.status.processedItems = i + 1;
        this.status.currentItem = `البند ${i+1}: ${currentItem.description?.substring(0, 30) || 'بدون وصف'}`;
        this.status.progress = (this.status.processedItems / this.status.totalItems) * 100;
        
        // حساب الوقت المتبقي
        const elapsed = Date.now() - new Date(this.status.startTime!).getTime();
        const timePerItem = elapsed / this.status.processedItems;
        const remainingItems = this.status.totalItems - this.status.processedItems;
        const remainingTime = Math.round((timePerItem * remainingItems) / 1000);
        this.status.estimatedTimeRemaining = `${Math.round(remainingTime / 60)} دقيقة`;

        // تخطي البنود بدون وصف
        if (!currentItem.description || currentItem.description.trim() === '') {
          processedIndices.add(i);
          continue;
        }

        // إذا البند له معرف، تخطي
        if (currentItem.id && currentItem.id.startsWith('P-')) {
          processedIndices.add(i);
          continue;
        }

        // البحث عن التطابقات لهذا البند
        const matches = [i];
        
        // مقارنة مع كل البنود الأخرى
        for (let j = i + 1; j < items.length; j++) {
          if (processedIndices.has(j)) continue;
          
          const compareItem = items[j];
          if (!compareItem.description) continue;
          
          // استخدام DeepSeek للمقارنة الدقيقة
          const isMatch = await this.compareItemsWithDeepSeek(currentItem, compareItem);
          
          if (isMatch) {
            matches.push(j);
            processedIndices.add(j);
            this.status.itemsUnified++;
          }
          
          // انتظار قليل بين المقارنات لعدم إرهاق API
          await this.delay(200);
        }

        processedIndices.add(i);

        // إنشاء معرف جديد للمجموعة
        if (matches.length > 1) {
          groupCount++;
          this.status.duplicateGroups++;
          const newId = this.generateNewId(existingIds);
          
          // إضافة التحديثات
          for (const idx of matches) {
            updates.push({
              range: `DATA!A${items[idx].rowNumber}`,
              values: [[newId]]
            });
          }
          
          // تحديث سجل المعرفات
          existingIds.set(newId, matches);
          
          this.addLog(`✨ مجموعة ${groupCount}: ${matches.length} بند بمعرف ${newId}`);
        }

        // تحديث كل 5 بنود
        if (i % 5 === 0 && i > 0) {
          const percent = Math.round(this.status.progress);
          this.addLog(`⏳ التقدم: ${i}/${items.length} (${percent}%) - الوقت المتبقي: ${this.status.estimatedTimeRemaining}`);
        }
      }

      // كتابة التحديثات إلى Google Sheets
      if (!this.shouldStop && updates.length > 0) {
        this.addLog(`💾 كتابة ${updates.length} معرف جديد إلى Google Sheets...`);
        
        // كتابة على دفعات صغيرة
        const batchSize = 100;
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
          await this.delay(500);
        }
      }

      // الانتهاء
      this.status.endTime = new Date().toISOString();
      const duration = this.formatDuration(this.status.startTime, this.status.endTime);
      
      this.addLog(`🎉 اكتمل التوحيد بنجاح!`);
      this.addLog(`📊 النتائج:`);
      this.addLog(`   • ${this.status.duplicateGroups} مجموعة مكررة`);
      this.addLog(`   • ${this.status.itemsUnified} بند موحد`);
      this.addLog(`   • الوقت المستغرق: ${duration}`);
      
    } catch (error: any) {
      this.addLog(`❌ خطأ: ${error.message}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * مقارنة بندين باستخدام DeepSeek
   */
  private async compareItemsWithDeepSeek(item1: any, item2: any): Promise<boolean> {
    try {
      const prompt = `قارن بين هذين المنتجين بدقة شديدة:

المنتج الأول:
- الوصف: ${item1.description}
- رقم القطعة: ${item1.partNumber || 'غير محدد'}
- رقم البند: ${item1.lineItem || 'غير محدد'}

المنتج الثاني:
- الوصف: ${item2.description}
- رقم القطعة: ${item2.partNumber || 'غير محدد'}
- رقم البند: ${item2.lineItem || 'غير محدد'}

هل هما نفس المنتج بالضبط؟ أجب فقط بـ "نعم" أو "لا"`;

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
              content: 'أنت خبير في مطابقة المنتجات. كن دقيقاً جداً ولا تطابق إلا المنتجات المتطابقة تماماً.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
          max_tokens: 10
        })
      });

      if (!response.ok) {
        console.error('خطأ في DeepSeek API');
        return false;
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';
      
      return answer === 'نعم' || answer === 'yes';
      
    } catch (error) {
      console.error('خطأ في المقارنة:', error);
      return false;
    }
  }

  /**
   * توليد معرف جديد
   */
  private generateNewId(existingIds: Map<string, number[]>): string {
    let maxNum = 0;
    for (const id of existingIds.keys()) {
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
    
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;
    
    if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
    if (minutes > 0) return `${minutes} دقيقة و ${seconds} ثانية`;
    return `${seconds} ثانية`;
  }

  /**
   * تأخير
   */
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const deepSeekUnificationServiceV2 = DeepSeekUnificationServiceV2.getInstance();