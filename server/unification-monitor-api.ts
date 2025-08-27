import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { EventEmitter } from 'events';

export class UnificationMonitorAPI extends EventEmitter {
  private sheets: any;
  private spreadsheetId: string;
  private isRunning: boolean = false;
  private stats = {
    total: 0,
    processed: 0,
    unified: 0,
    startTime: null as Date | null,
    endTime: null as Date | null
  };

  constructor() {
    super();
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.initializeSheets();
  }

  private async initializeSheets() {
    try {
      const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
      const credentials = JSON.parse(serviceAccountKey);

      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: auth });
      this.emit('log', { message: '🔗 تم تهيئة الاتصال بـ Google Sheets', type: 'success' });
    } catch (error: any) {
      this.emit('log', { message: `❌ خطأ في تهيئة Google Sheets: ${error.message}`, type: 'error' });
    }
  }

  async getInitialStats() {
    try {
      this.emit('log', { message: '📊 قراءة إحصائيات البيانات...', type: 'info' });

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:O'
      });

      const rows = response.data.values || [];
      const dataRows = rows.slice(1); // تجاهل العناوين
      
      let totalItems = 0;
      let unifiedItems = 0;

      for (const row of dataRows) {
        if (row.length >= 3) {
          const currentColumnA = row[0] || '';
          const lineItem = row[2] ? row[2].toString().trim() : '';
          const partNumber = row[3] ? row[3].toString().trim() : '';
          const description = row[4] ? row[4].toString().trim() : '';

          // تخطي الصفوف الفارغة
          if (!lineItem && !partNumber && !description) continue;

          totalItems++;

          // التحقق من المعرفات الموحدة
          if (currentColumnA.match(/^P-\d{7}$/)) {
            unifiedItems++;
          }
        }
      }

      this.stats = {
        ...this.stats,
        total: totalItems,
        unified: unifiedItems,
        processed: totalItems
      };

      this.emit('log', { message: `📊 إجمالي الأصناف: ${totalItems}, موحد: ${unifiedItems}`, type: 'info' });
      return this.stats;

    } catch (error: any) {
      this.emit('log', { message: `❌ خطأ في قراءة الإحصائيات: ${error.message}`, type: 'error' });
      throw error;
    }
  }

  async startRealTimeUnification() {
    if (this.isRunning) {
      this.emit('log', { message: '⚠️ العملية قيد التشغيل بالفعل', type: 'warning' });
      return;
    }

    this.isRunning = true;
    this.stats.startTime = new Date();
    this.emit('log', { message: '🚀 بدء عملية التوحيد الحقيقية...', type: 'info' });

    try {
      // قراءة البيانات
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:O'
      });

      const rows = response.data.values || [];
      this.emit('log', { message: `📖 تم قراءة ${rows.length} صف من Google Sheets`, type: 'success' });

      if (rows.length < 2) {
        throw new Error('لا توجد بيانات كافية للمعالجة');
      }

      const updates = [];
      let unifiedCount = 0;
      let itemCounter = 1;
      let processedCount = 0;

      // معالجة البيانات تدريجياً
      for (let i = 1; i < rows.length && itemCounter <= 5000; i++) {
        if (!this.isRunning) {
          this.emit('log', { message: '⏹️ تم إيقاف العملية', type: 'warning' });
          break;
        }

        const row = rows[i] || [];

        if (row.length >= 3) {
          const currentColumnA = row[0] || '';
          const lineItem = row[2] ? row[2].toString().trim() : '';
          const partNumber = row[3] ? row[3].toString().trim() : '';
          const description = row[4] ? row[4].toString().trim() : '';

          // تخطي الصفوف الفارغة
          if (!lineItem && !partNumber && !description) continue;

          processedCount++;
          const newId = `P-${itemCounter.toString().padStart(7, '0')}`;

          // التحقق من الحاجة للتحديث
          if (!currentColumnA || !currentColumnA.startsWith('P-') || currentColumnA !== newId) {
            updates.push({
              range: `DATA!A${i + 1}`,
              values: [[newId]]
            });
            unifiedCount++;

            if (unifiedCount <= 10) {
              this.emit('log', { 
                message: `🆔 الصف ${i + 1}: ${currentColumnA || 'فارغ'} → ${newId}`, 
                type: 'info' 
              });
            }
          }

          itemCounter++;

          // تحديث الإحصائيات كل 100 صنف
          if (processedCount % 100 === 0) {
            this.stats.processed = processedCount;
            this.stats.unified = unifiedCount;
            this.emit('stats', this.stats);
            this.emit('log', { 
              message: `📊 تمت معالجة ${processedCount} صنف`, 
              type: 'info' 
            });
          }
        }
      }

      // تطبيق التحديثات
      if (updates.length > 0 && this.isRunning) {
        this.emit('log', { message: `📝 تطبيق ${updates.length} تحديث...`, type: 'info' });

        const batchSize = 100;
        let appliedUpdates = 0;

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

            appliedUpdates += batch.length;
            this.emit('log', { 
              message: `✅ تم تطبيق ${appliedUpdates}/${updates.length} تحديث`, 
              type: 'success' 
            });

            // انتظار قصير لتجنب حدود API
            if (i + batchSize < updates.length) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

          } catch (batchError: any) {
            this.emit('log', { 
              message: `❌ خطأ في المجموعة: ${batchError.message}`, 
              type: 'error' 
            });
          }
        }
      }

      // النتائج النهائية
      this.stats.endTime = new Date();
      this.stats.processed = processedCount;
      this.stats.unified = unifiedCount;
      
      const duration = this.stats.endTime.getTime() - this.stats.startTime!.getTime();
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);

      this.emit('log', { 
        message: `🎉 تم الانتهاء من التوحيد! ${unifiedCount} معرف في ${minutes}:${seconds.toString().padStart(2, '0')}`, 
        type: 'success' 
      });
      this.emit('stats', this.stats);

    } catch (error: any) {
      this.emit('log', { message: `❌ خطأ في التوحيد: ${error.message}`, type: 'error' });
    } finally {
      this.isRunning = false;
    }
  }

  stopUnification() {
    if (this.isRunning) {
      this.isRunning = false;
      this.emit('log', { message: '⏹️ تم إيقاف عملية التوحيد', type: 'warning' });
    }
  }

  getStats() {
    return this.stats;
  }

  isProcessRunning() {
    return this.isRunning;
  }
}