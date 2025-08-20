import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { EventEmitter } from 'events';

interface UnificationItem {
  rowIndex: number;
  lineItem: string;
  partNumber: string;
  description: string;
  currentId: string;
  newId?: string;
}

interface UnificationGroup {
  masterId: string;
  items: UnificationItem[];
  masterPartNumber: string;
  masterDescription: string;
}

export class SmartUnificationEngine extends EventEmitter {
  private sheets: any;
  private spreadsheetId: string;
  private isRunning = false;
  private currentItemName = '';
  private currentRowIndex = 0;
  private stats = {
    total: 0,
    processed: 0,
    unified: 0,
    duplicatesFound: 0,
    groupsCreated: 0,
    startTime: null as Date | null,
    endTime: null as Date | null,
    currentItem: '',
    currentRow: 0,
    progress: 0,
    remainingItems: 0,
    estimatedTimeRemaining: 0,
    elapsedTime: 0
  };

  constructor() {
    super();
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
    this.initializeSheets();
  }

  private async initializeSheets(): Promise<void> {
    try {
      // استخدام المفتاح الجديد من الملف المحلي
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      
      let credentials;
      try {
        const credentialsPath = resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
        const fileContent = readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(fileContent);
      } catch (fileError) {
        console.error('❌ خطأ في قراءة مفتاح Google Sheets:', fileError.message);
        throw fileError;
      }

      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ تم تهيئة محرك التوحيد الذكي بنجاح');
      this.emit('log', { message: '🔗 تم تهيئة محرك التوحيد الذكي', type: 'success' });
    } catch (error: any) {
      console.error('❌ خطأ في تهيئة المحرك:', error.message);
      this.emit('log', { message: `❌ خطأ في تهيئة المحرك: ${error.message}`, type: 'error' });
      throw error;
    }
  }

  // تحليل التشابه بين القطع
  private areItemsSimilar(item1: UnificationItem, item2: UnificationItem): boolean {
    // التحقق من PART NUMBER
    if (item1.partNumber && item2.partNumber) {
      const normalized1 = this.normalizePartNumber(item1.partNumber);
      const normalized2 = this.normalizePartNumber(item2.partNumber);
      
      if (normalized1 === normalized2) {
        return true;
      }
    }

    // التحقق من LINE ITEM
    if (item1.lineItem && item2.lineItem) {
      const normalized1 = item1.lineItem.trim().toUpperCase();
      const normalized2 = item2.lineItem.trim().toUpperCase();
      
      if (normalized1 === normalized2) {
        return true;
      }
    }

    // التحقق من التوصيف مع تجاهل الأحرف الخاصة
    if (item1.description && item2.description) {
      const desc1 = this.normalizeDescription(item1.description);
      const desc2 = this.normalizeDescription(item2.description);
      
      // إذا كان 90% من الكلمات متطابقة
      const similarity = this.calculateTextSimilarity(desc1, desc2);
      if (similarity >= 0.85) {
        return true;
      }
    }

    return false;
  }

  private normalizePartNumber(partNumber: string): string {
    return partNumber
      .trim()
      .toUpperCase()
      .replace(/[\s\-_\.\/\\]/g, '')
      .replace(/[^\w\d]/g, '');
  }

  private normalizeDescription(description: string): string {
    return description
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\d]/g, ' ')
      .trim();
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ').filter(w => w.length > 2);
    const words2 = text2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  // عملية التجميع الذكي
  private createUnificationGroups(items: UnificationItem[]): UnificationGroup[] {
    const groups: UnificationGroup[] = [];
    const processedItems = new Set<number>();

    this.emit('log', { message: `🔍 بدء تحليل ${items.length} صنف للتجميع الذكي...`, type: 'info' });

    for (let i = 0; i < items.length; i++) {
      if (processedItems.has(i)) continue;

      const currentItem = items[i];
      const group: UnificationGroup = {
        masterId: `P-${(groups.length + 1).toString().padStart(7, '0')}`,
        items: [currentItem],
        masterPartNumber: currentItem.partNumber,
        masterDescription: currentItem.description
      };

      processedItems.add(i);

      // البحث عن العناصر المشابهة
      for (let j = i + 1; j < items.length; j++) {
        if (processedItems.has(j)) continue;

        const compareItem = items[j];
        
        if (this.areItemsSimilar(currentItem, compareItem)) {
          group.items.push(compareItem);
          processedItems.add(j);
          
          // استخدام أفضل توصيف
          if (compareItem.description.length > group.masterDescription.length) {
            group.masterDescription = compareItem.description;
          }
        }
      }

      groups.push(group);

      // تسجيل المجموعات المكررة
      if (group.items.length > 1) {
        this.emit('log', { 
          message: `📦 مجموعة ${group.masterId}: ${group.items.length} عنصر مكرر`, 
          type: 'success' 
        });
      }
    }

    const totalDuplicates = groups.reduce((sum, group) => sum + (group.items.length > 1 ? group.items.length - 1 : 0), 0);
    this.emit('log', { 
      message: `✅ تم إنشاء ${groups.length} مجموعة، وفر ${totalDuplicates} عنصر مكرر`, 
      type: 'success' 
    });

    return groups;
  }

  async startSmartUnification(): Promise<void> {
    if (this.isRunning) {
      this.emit('log', { message: '⚠️ العملية قيد التشغيل بالفعل', type: 'warning' });
      return;
    }

    // إعادة تعيين جميع الإحصائيات
    this.stats = {
      total: 0,
      processed: 0,
      unified: 0,
      duplicatesFound: 0,
      groupsCreated: 0,
      startTime: new Date(),
      endTime: null,
      currentItem: '',
      currentRow: 0,
      progress: 0,
      remainingItems: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0
    };

    this.isRunning = true;
    this.currentItemName = '';
    this.currentRowIndex = 0;
    this.emit('log', { message: '🚀 بدء التوحيد الذكي المتقدم...', type: 'info' });

    try {
      // التأكد من تهيئة Google Sheets
      if (!this.sheets) {
        await this.initializeSheets();
        // انتظار قليل للتأكد من التهيئة
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!this.sheets) {
        throw new Error('فشل في تهيئة الاتصال مع Google Sheets');
      }

      // قراءة البيانات
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:O'
      });

      const rows = response.data.values || [];
      if (rows.length < 2) {
        throw new Error('لا توجد بيانات كافية للمعالجة');
      }

      // تحضير البيانات
      const items: UnificationItem[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        
        if (row.length >= 3) {
          const lineItem = row[2] ? row[2].toString().trim() : '';
          const partNumber = row[3] ? row[3].toString().trim() : '';
          const description = row[4] ? row[4].toString().trim() : '';

          if (lineItem || partNumber || description) {
            items.push({
              rowIndex: i + 1,
              lineItem,
              partNumber,
              description,
              currentId: row[0] || ''
            });
          }
        }
      }

      this.stats.total = items.length;
      this.stats.remainingItems = items.length;
      this.emit('log', { message: `📊 تم تحميل ${items.length} صنف للمعالجة`, type: 'info' });

      // التجميع الذكي
      const groups = this.createUnificationGroups(items);
      this.stats.groupsCreated = groups.length;

      // إعداد التحديثات
      const updates: Array<{ range: string; values: any[][] }> = [];
      let unifiedCount = 0;

      let groupIndex = 0;
      for (const group of groups) {
        groupIndex++;
        
        // تحديث البند الحالي
        this.currentItemName = group.masterDescription || group.masterPartNumber || `مجموعة ${groupIndex}`;
        this.stats.currentItem = this.currentItemName;
        
        for (const item of group.items) {
          if (item.currentId !== group.masterId) {
            updates.push({
              range: `DATA!A${item.rowIndex}`,
              values: [[group.masterId]]
            });
            unifiedCount++;
          }
          
          // تحديث الصف الحالي
          this.currentRowIndex = item.rowIndex;
          this.stats.currentRow = item.rowIndex;
        }
        
        this.stats.processed += group.items.length;
        this.stats.remainingItems = Math.max(0, this.stats.total - this.stats.processed);
        
        // حساب نسبة التقدم
        this.stats.progress = Math.round((this.stats.processed / this.stats.total) * 100);
        
        // حساب الوقت المستغرق
        if (this.stats.startTime) {
          this.stats.elapsedTime = Math.floor((new Date().getTime() - this.stats.startTime.getTime()) / 1000);
          
          // حساب الوقت المتبقي المتوقع
          if (this.stats.processed > 0) {
            const timePerItem = this.stats.elapsedTime / this.stats.processed;
            this.stats.estimatedTimeRemaining = Math.ceil(timePerItem * this.stats.remainingItems);
          }
        }
        
        if (group.items.length > 1) {
          this.stats.duplicatesFound += group.items.length - 1;
        }
      }

      this.stats.unified = unifiedCount;

      // تطبيق التحديثات
      if (updates.length > 0 && this.isRunning) {
        this.emit('log', { message: `📝 تطبيق ${updates.length} تحديث...`, type: 'info' });

        const batchSize = 100;
        for (let i = 0; i < updates.length; i += batchSize) {
          if (!this.isRunning) break;

          const batch = updates.slice(i, i + batchSize);
          
          try {
            await this.sheets.spreadsheets.values.batchUpdate({
              spreadsheetId: this.spreadsheetId,
              requestBody: {
                valueInputOption: 'RAW',
                data: batch
              }
            });

            this.emit('log', { 
              message: `✅ تم تطبيق ${Math.min(i + batchSize, updates.length)}/${updates.length} تحديث`, 
              type: 'success' 
            });

            // انتظار لتجنب حدود API
            if (i + batchSize < updates.length) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          } catch (error: any) {
            this.emit('log', { 
              message: `❌ خطأ في التحديث: ${error.message}`, 
              type: 'error' 
            });
          }
        }
      }

      this.stats.endTime = new Date();
      this.isRunning = false;

      this.emit('log', { 
        message: `🎉 اكتمل التوحيد الذكي! تم توحيد ${this.stats.duplicatesFound} عنصر في ${this.stats.groupsCreated} مجموعة`, 
        type: 'success' 
      });

    } catch (error: any) {
      this.isRunning = false;
      this.emit('log', { message: `❌ فشل التوحيد: ${error.message}`, type: 'error' });
      throw error;
    }
  }

  stopUnification(): void {
    this.isRunning = false;
    this.emit('log', { message: '⏹️ تم إيقاف التوحيد الذكي', type: 'warning' });
  }

  getStats() {
    // تحديث الوقت المستغرق إذا كانت العملية قيد التشغيل
    if (this.isRunning && this.stats.startTime) {
      this.stats.elapsedTime = Math.floor((new Date().getTime() - this.stats.startTime.getTime()) / 1000);
      
      // حساب الوقت المتبقي المتوقع
      if (this.stats.processed > 0) {
        const timePerItem = this.stats.elapsedTime / this.stats.processed;
        this.stats.estimatedTimeRemaining = Math.ceil(timePerItem * this.stats.remainingItems);
      }
    }
    
    return {
      ...this.stats,
      isRunning: this.isRunning,
      progressPercentage: this.stats.progress
    };
  }

  isProcessRunning(): boolean {
    return this.isRunning;
  }
}