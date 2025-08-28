import { Router } from 'express';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { EventEmitter } from 'events';

interface ItemData {
  rowIndex: number;
  currentId: string;
  partNo: string;
  description: string;
  lineItem: string;
}

interface UnificationStatus {
  isRunning: boolean;
  total: number;
  processed: number;
  currentRow: number;
  currentItem: ItemData | null;
  startTime: Date | null;
  endTime: Date | null;
  logs: string[];
  quotaExceeded?: boolean; // لتتبع نفاد الرصيد
  pauseReason?: string; // سبب الإيقاف
}

class AIUnificationMonitor extends EventEmitter {
  private sheets: any;
  private spreadsheetId: string;
  private status: UnificationStatus;
  private shouldStop: boolean = false;

  constructor() {
    super();
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.status = {
      isRunning: false,
      total: 0,
      processed: 0,
      currentRow: 0,
      currentItem: null,
      startTime: null,
      endTime: null,
      logs: []
    };
  }

  async initialize() {
    try {
      const serviceAccountKey = readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
      const credentials = JSON.parse(serviceAccountKey);

      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: auth });
      this.addLog('تم تهيئة الاتصال مع Google Sheets بنجاح');
      
      // تحديث العدد الإجمالي
      await this.updateTotalItems();
      
    } catch (error: any) {
      this.addLog(`خطأ في التهيئة: ${error.message}`, 'error');
      throw error;
    }
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
      this.addLog(`تم تحديد إجمالي ${validItems} صنف للمعالجة`);
      
    } catch (error: any) {
      this.addLog(`خطأ في قراءة البيانات: ${error.message}`, 'error');
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

  async compareItems(item1: ItemData, item2: ItemData): Promise<boolean> {
    try {
      // مقارنة PART NO أولاً
      if (item1.partNo && item2.partNo && 
          item1.partNo.toLowerCase() === item2.partNo.toLowerCase()) {
        return true;
      }

      // استخدام DeepSeek API لمقارنة التوصيف
      const prompt = `قم بمقارنة هذين الصنفين وحدد إذا كانا نفس المنتج:

الصنف الأول:
- رقم القطعة: "${item1.partNo}"
- التوصيف: "${item1.description}"

الصنف الثاني:
- رقم القطعة: "${item2.partNo}"
- التوصيف: "${item2.description}"

أجب بـ "نعم" إذا كانا نفس المنتج، أو "لا" إذا كانا مختلفين.`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "أنت خبير في مقارنة قطع الغيار والمنتجات. أجب بـ 'نعم' أو 'لا' فقط."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content?.trim().toLowerCase();
      return result === 'نعم' || result === 'yes';

    } catch (error: any) {
      // fallback: مقارنة ذكية محلية
      const desc1 = item1.description.toLowerCase().trim();
      const desc2 = item2.description.toLowerCase().trim();
      
      if (desc1 === desc2) return true;
      
      const clean1 = desc1.replace(/[^\w\u0600-\u06FF]/g, '');
      const clean2 = desc2.replace(/[^\w\u0600-\u06FF]/g, '');
      
      if (clean1 === clean2) return true;
      
      const words1 = desc1.split(/\s+/).filter(w => w.length > 2);
      const words2 = desc2.split(/\s+/).filter(w => w.length > 2);
      
      const commonWords = words1.filter(w => words2.includes(w));
      const similarity = commonWords.length / Math.max(words1.length, words2.length);
      
      return similarity > 0.8;
    }
  }

  async startUnification() {
    if (this.status.isRunning) {
      this.addLog('التوحيد قيد التشغيل بالفعل', 'warning');
      return;
    }

    this.status.isRunning = true;
    this.status.processed = 0;
    this.status.currentRow = 0;
    this.status.startTime = new Date();
    this.status.endTime = null;
    this.shouldStop = false;

    this.addLog('بدء التوحيد الذكي باستخدام DeepSeek AI', 'success');

    try {
      const items = await this.loadItemsData();
      this.status.total = items.length;
      
      const updates: any[] = [];
      const processedItems = new Set<number>();
      let currentIdCounter = 1;

      for (let i = 0; i < items.length && !this.shouldStop; i++) {
        if (processedItems.has(i)) continue;

        const masterItem = items[i];
        this.status.currentItem = masterItem;
        this.status.currentRow = i + 1;
        
        const masterId = `P-${currentIdCounter.toString().padStart(7, '0')}`;
        
        this.addLog(`معالجة الصف ${i + 1}: ${masterItem.description.substring(0, 50)}...`);

        // تعيين المعرف الرئيسي
        if (masterItem.currentId !== masterId) {
          updates.push({
            range: `DATA!A${masterItem.rowIndex}`,
            values: [[masterId]]
          });
        }

        processedItems.add(i);

        // البحث عن المطابقات
        for (let j = i + 1; j < items.length && !this.shouldStop; j++) {
          if (processedItems.has(j)) continue;

          const compareItem = items[j];
          
          const isMatch = await this.compareItems(masterItem, compareItem);
          
          if (isMatch) {
            this.addLog(`✅ تطابق: ${compareItem.description.substring(0, 30)}... → ${masterId}`);
            
            if (compareItem.currentId !== masterId) {
              updates.push({
                range: `DATA!A${compareItem.rowIndex}`,
                values: [[masterId]]
              });
            }
            
            processedItems.add(j);
          }
        }

        currentIdCounter++;
        this.status.processed = processedItems.size;

        // انتظار قصير لتجنب حدود API
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // تطبيق التحديثات في Google Sheets
      if (updates.length > 0 && !this.shouldStop) {
        this.addLog(`تطبيق ${updates.length} تحديث في Google Sheets...`);
        
        const batchSize = 100;
        for (let i = 0; i < updates.length; i += batchSize) {
          if (this.shouldStop) break;
          
          const batch = updates.slice(i, i + batchSize);
          
          await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
              valueInputOption: 'RAW',
              data: batch
            }
          });

          this.addLog(`تم تطبيق ${Math.min(i + batchSize, updates.length)}/${updates.length} تحديث`);
          
          if (i + batchSize < updates.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      this.status.isRunning = false;
      this.status.endTime = new Date();
      this.status.currentItem = null;

      if (this.shouldStop) {
        this.addLog('تم إيقاف التوحيد بواسطة المستخدم', 'warning');
      } else {
        this.addLog(`اكتمل التوحيد! تم معالجة ${this.status.processed} صنف`, 'success');
      }

    } catch (error: any) {
      this.status.isRunning = false;
      this.addLog(`خطأ في التوحيد: ${error.message}`, 'error');
    }
  }

  stopUnification() {
    if (!this.status.isRunning) {
      this.addLog('التوحيد غير قيد التشغيل', 'warning');
      return;
    }

    this.shouldStop = true;
    this.addLog('جاري إيقاف التوحيد...', 'warning');
  }

  getStatus() {
    return {
      ...this.status,
      logs: this.status.logs.slice(-20) // آخر 20 رسالة
    };
  }

  private addLog(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const logEntry = `[${timestamp}] ${message}`;
    
    this.status.logs.push(logEntry);
    
    // احتفظ بآخر 100 رسالة فقط
    if (this.status.logs.length > 100) {
      this.status.logs = this.status.logs.slice(-100);
    }

    console.log(`🤖 ${logEntry}`);
  }
}

// إنشاء مثيل واحد للمراقب
const aiMonitor = new AIUnificationMonitor();

// تهيئة المراقب
aiMonitor.initialize().catch(console.error);

const router = Router();

// الحصول على حالة التوحيد
router.get('/status', (req, res) => {
  res.json(aiMonitor.getStatus());
});

// بدء التوحيد
router.post('/start', async (req, res) => {
  try {
    // تشغيل التوحيد في الخلفية
    setImmediate(() => aiMonitor.startUnification());
    res.json({ success: true, message: 'تم بدء التوحيد الذكي' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إيقاف التوحيد
router.post('/stop', (req, res) => {
  try {
    aiMonitor.stopUnification();
    res.json({ success: true, message: 'تم إيقاف التوحيد' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;