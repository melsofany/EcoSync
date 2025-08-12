import { google } from 'googleapis';

interface ItemData {
  rowIndex: number;
  currentId: string;
  partNo: string;
  description: string;
  lineItem: string;
}

class SimpleAIUnifier {
  private sheets: any;
  private spreadsheetId: string;
  private status = {
    isRunning: false,
    total: 0,
    processed: 0,
    currentRow: 0,
    currentItem: null as ItemData | null,
    startTime: null as Date | null,
    endTime: null as Date | null,
    logs: [] as string[]
  };
  private shouldStop = false;

  constructor() {
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.init();
  }

  async init() {
    try {
      const serviceAccountPath = './attached_assets/cortoba-supp-sys-75c0919d127e.json';
      const { readFileSync } = await import('fs');
      const credentials = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.addLog('✅ تم تهيئة الاتصال مع Google Sheets');
      
      await this.updateTotalItems();
      
    } catch (error: any) {
      this.addLog(`❌ خطأ في التهيئة: ${error.message}`);
    }
  }

  addLog(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const logMessage = `[${timeStr}] ${message}`;
    this.status.logs.push(logMessage);
    
    // احتفظ بآخر 50 رسالة فقط
    if (this.status.logs.length > 50) {
      this.status.logs = this.status.logs.slice(-50);
    }
    
    console.log(`🤖 ${logMessage}`);
  }

  async updateTotalItems() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:E'
      });

      const rows = response.data.values || [];
      let validItems = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const lineItem = row[2] || '';
        const partNo = row[3] || '';
        const description = row[4] || '';

        if (lineItem || partNo || description) {
          validItems++;
        }
      }

      this.status.total = validItems;
      this.addLog(`📊 تم تحديد إجمالي ${validItems} صنف للمعالجة`);
      
    } catch (error: any) {
      this.addLog(`❌ خطأ في قراءة البيانات: ${error.message}`, 'error');
    }
  }

  async loadItemsData(): Promise<ItemData[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'DATA!A:E'
    });

    const rows = response.data.values || [];
    const items: ItemData[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      
      const currentId = row[0] || '';
      const lineItem = row[2] || '';
      const partNo = row[3] || '';
      const description = row[4] || '';

      if (!lineItem && !partNo && !description) continue;

      items.push({
        rowIndex: i + 1,
        currentId,
        partNo: partNo.toString().trim(),
        description: description.toString().trim(),
        lineItem: lineItem.toString().trim()
      });
    }

    return items;
  }

  async quickCompare(item1: ItemData, item2: ItemData): Promise<boolean> {
    // مقارنة PART NO أولاً
    if (item1.partNo && item2.partNo) {
      const part1 = item1.partNo.toLowerCase().replace(/[^a-z0-9]/g, '');
      const part2 = item2.partNo.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (part1 === part2) return true;
    }

    // مقارنة التوصيف
    const desc1 = item1.description.toLowerCase().trim();
    const desc2 = item2.description.toLowerCase().trim();
    
    if (desc1 === desc2) return true;
    
    // إزالة الرموز والمقارنة
    const clean1 = desc1.replace(/[^\w\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
    const clean2 = desc2.replace(/[^\w\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (clean1 === clean2) return true;
    
    // مقارنة الكلمات المفتاحية
    const words1 = clean1.split(' ').filter(w => w.length > 2);
    const words2 = clean2.split(' ').filter(w => w.length > 2);
    
    if (words1.length < 2 || words2.length < 2) return false;
    
    const commonWords = words1.filter(w => words2.includes(w));
    const similarity = commonWords.length / Math.min(words1.length, words2.length);
    
    return similarity > 0.85; // نسبة تشابه عالية
  }

  async writeUpdatesToSheets(updates: any[]) {
    if (updates.length === 0) return;

    try {
      // كتابة كل تحديث بشكل منفصل لضمان الدقة
      let successCount = 0;
      for (const update of updates) {
        try {
          this.addLog(`🔄 كتابة ${update.range} = ${update.values[0][0]}`);
          
          const result = await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: update.range,
            valueInputOption: 'RAW',
            resource: {
              values: update.values
            }
          });
          
          this.addLog(`✅ نجحت كتابة ${update.range} - خلايا محدثة: ${result.data.updatedCells}`);
          successCount++;
          
          // انتظار قصير بين التحديثات
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (updateError: any) {
          this.addLog(`❌ خطأ في كتابة ${update.range}: ${updateError.message}`, 'error');
        }
      }
      
      if (successCount > 0) {
        this.addLog(`🎯 تم كتابة ${successCount} من ${updates.length} تحديث بنجاح`);
      }
      
    } catch (error: any) {
      this.addLog(`❌ خطأ عام في كتابة التحديثات: ${error.message}`, 'error');
    }
  }

  async startUnification() {
    if (this.status.isRunning) {
      this.addLog('⚠️ التوحيد قيد التشغيل بالفعل', 'warning');
      return;
    }

    this.status.isRunning = true;
    this.status.processed = 0;
    this.status.currentRow = 0;
    this.status.currentItem = null;
    this.status.startTime = new Date();
    this.status.endTime = null;
    this.shouldStop = false;
    
    this.addLog('🚀 بدء التوحيد الذكي السريع', 'success');

    try {
      const items = await this.loadItemsData();
      this.status.total = items.length;
      
      const updates: any[] = [];
      const processedItems = new Set<number>();
      let currentIdCounter = 12016; // البدء من آخر رقم تم استخدامه

      // البحث عن آخر رقم P موجود
      for (const item of items) {
        if (item.currentId && item.currentId.startsWith('P-')) {
          const num = parseInt(item.currentId.replace('P-', ''));
          if (num >= currentIdCounter) {
            currentIdCounter = num + 1;
          }
        }
      }

      this.addLog(`🔢 بدء التوحيد من رقم P-${currentIdCounter.toString().padStart(7, '0')}`);

      for (let i = 0; i < items.length && !this.shouldStop; i++) {
        if (processedItems.has(i)) continue;

        const masterItem = items[i];
        this.status.currentItem = masterItem;
        this.status.currentRow = i + 1;
        
        const masterId = `P-${currentIdCounter.toString().padStart(7, '0')}`;
        
        this.addLog(`🔍 معالجة الصف ${i + 1}: ${masterItem.description.substring(0, 40)}...`);

        // تعيين المعرف الرئيسي إذا لم يكن موجوداً
        if (!masterItem.currentId || !masterItem.currentId.startsWith('P-')) {
          updates.push({
            range: `DATA!A${masterItem.rowIndex}`,
            values: [[masterId]]
          });
          masterItem.currentId = masterId;
        }

        processedItems.add(i);

        // البحث عن المطابقات السريع
        let matchCount = 0;
        for (let j = i + 1; j < items.length && !this.shouldStop; j++) {
          if (processedItems.has(j)) continue;

          const compareItem = items[j];
          
          // تخطي البنود التي لديها معرف بالفعل
          if (compareItem.currentId && compareItem.currentId.startsWith('P-')) {
            continue;
          }
          
          const isMatch = await this.quickCompare(masterItem, compareItem);
          
          if (isMatch) {
            matchCount++;
            this.addLog(`✅ تطابق ${matchCount}: ${compareItem.description.substring(0, 30)}... → ${masterId}`);
            
            updates.push({
              range: `DATA!A${compareItem.rowIndex}`,
              values: [[masterId]]
            });
            
            processedItems.add(j);
          }
        }

        if (matchCount > 0) {
          this.addLog(`🎯 تم توحيد ${matchCount + 1} صنف تحت المعرف ${masterId}`);
        }

        currentIdCounter++;
        this.status.processed = processedItems.size;

        // كتابة التحديثات كل 5 عناصر لمراقبة أفضل
        if (updates.length >= 5) {
          await this.writeUpdatesToSheets(updates);
          updates.length = 0; // مسح المصفوفة
        }

        // انتظار قصير
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // كتابة التحديثات المتبقية
      if (updates.length > 0) {
        await this.writeUpdatesToSheets(updates);
      }

      this.status.endTime = new Date();
      this.addLog('🎉 تم انتهاء التوحيد الذكي بنجاح', 'success');
      
    } catch (error: any) {
      this.addLog(`❌ خطأ في التوحيد: ${error.message}`, 'error');
    } finally {
      this.status.isRunning = false;
    }
  }

  stopUnification() {
    this.shouldStop = true;
    this.addLog('⏹️ جاري إيقاف التوحيد...', 'warning');
  }

  getStatus() {
    return this.status;
  }
}

export const simpleAIUnifier = new SimpleAIUnifier();