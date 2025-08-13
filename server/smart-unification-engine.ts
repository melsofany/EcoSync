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
  private stats = {
    total: 0,
    processed: 0,
    unified: 0,
    duplicatesFound: 0,
    groupsCreated: 0,
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
      const credentials = {
        type: "service_account",
        project_id: "cortoba-supp-sys",
        private_key_id: "75c0919d127e568d06729547b79f62f3b83322bd",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLRiY5TEiNxTqU\nSKp94TnwbJh4L+bc8WylNB7qeXqFF8+obb1ErPy8kfq21vLRZNM7bY6R8zT+R96O\n+lFgemZrCg98jI9eZo/z2sdZZ8sBowGQpOC2S/+1bnqVtR/uBr5lSZNTXdxd0NBL\nRqSUrY79C7e5xBYQ/k60sRv3cGvwu0p2yuflca5Nq8B8ONCDTKdXMZNLyf3LYc2o\nXXDH4j+RdGkS7OAj3dUMYSt4yUa923ERYaSoaUkuUxyxy40c205MFkzPQRfcU3f4\nsoDLGcXq90lj5HvMkO9iFc6rXJoLAsKYkwBOQrabOIADw8snPXOxy0Pg4DAnbFX6\nkZ28acaVAgMBAAECggEABuzMNJDYD+xeLdsOjodJFVsTE//Ib6fR5GGS2WNrZx6u\ni7W2svY/DfWIgwjDm5qXD6Pl2Cxe681q/u1MLxXnE1JzwJx77eK0mMF6n8hyGWDX\nls6R0TlkQWa9dQgx9Eaf3zd9y2NGifOpL5yn0rYu9DPyqGN5FPnKQ0xIAEqrgrdE\ncwAvDiJ9jtj/7hUtL9E/Py3awxtqGrqfqAWyDMhlwqkPpQ/Ci9UT5LPGKU6PgGDA\nzOUNh0N3zreN4zjHaKGezdW+9wVAGkuJKOu4JtOkU6SJvKyQt4wHzrglQNjkl65C\nfCZl9ci9YTr+UD24LhAiA8yyQ9IYrDWn5dCeELjaAQKBgQD4L5wDoRvkPi42e3qg\n+sOpxiErPhyHl4keYW+DMPulad8qgXF+WUc5A9youEzj6D0EiXI0OrxuKw7Bhwkl\nbuisoLWeENsf8Djsa+xtDwwm+1IEIXi8xpVYhH83OY+o06Mw3JEB2K+Ci6SG0AUf\nFtzhvk02XSNQSfTF01K0Dke3wQKBgQDRrIwkl+/aQ/DzrDm4oWexdZJwWgWJESKi\nlx0Vb8nMVNFx2JBLmAcV1B4OvmpoAFHsr5/3/3x/pRa6Zk6GZluSrE7u3bbd6Hna\nTtUW4eo/2XR+/HFlbAWZwsNQAvHZ1gsBv+GlnT5zNE2fs4zI1KQigiAtGg4mnTga\n4KHDsD6j1QKBgHnfNyd5F68u8ZaDcCZYvXhC+Mq5R102BnlKs22iwg/qO1IuGkNH\nJ/hRcyvOxMMtqbjunYwUQ699qVNTMiSVn+AVUtn5wQCf//Po00KCnx8NTqsEnLtm\ncLP07Ft8ApWOx5YY2YQkmZrrY7FnuPwZSAH6ZwQJHGwyxOXX7cbJNGKBAoGAMqh3\nq5ex8ZActSLVR1Bn1y5K1S5KzBUBwzqzYiyCGwYbHGBwbHMssw9uu60x1DLPmFnO\nUoK9t7FRTnPNYRd15HgREhErT24NkrsdLMwkZozJYqznUNPKfp3ZxokPmcvnGOMd\nR4A4SGlIn98nkpYdmeDKmVsENDwkBAplyvvYBokCgYEA9uA3IUMaZ5G5KHgA+C4F\nmU+pwnOGs60BLTgK+EUXaUQ4f0HDsqCz0UXrI146bWW1sxU4TyddNUscc4SX/60k\nU86A4nrFQk0FkIcrhFS9KYkuWzqgBuY1N8AmgfI7tRIaqsRXb0281uhHmyN1MGBT\nx78kvtrLVv33tSBmTfs2m3k=\n-----END PRIVATE KEY-----\n",
        client_email: "cortoba-sys@cortoba-supp-sys.iam.gserviceaccount.com",
        client_id: "108486641505877917440",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/cortoba-sys%40cortoba-supp-sys.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };

      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.emit('log', { message: '🔗 تم تهيئة محرك التوحيد الذكي', type: 'success' });
    } catch (error: any) {
      this.emit('log', { message: `❌ خطأ في تهيئة المحرك: ${error.message}`, type: 'error' });
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

    this.isRunning = true;
    this.stats.startTime = new Date();
    this.emit('log', { message: '🚀 بدء التوحيد الذكي المتقدم...', type: 'info' });

    try {
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
      this.emit('log', { message: `📊 تم تحميل ${items.length} صنف للمعالجة`, type: 'info' });

      // التجميع الذكي
      const groups = this.createUnificationGroups(items);
      this.stats.groupsCreated = groups.length;

      // إعداد التحديثات
      const updates: Array<{ range: string; values: any[][] }> = [];
      let unifiedCount = 0;

      for (const group of groups) {
        for (const item of group.items) {
          if (item.currentId !== group.masterId) {
            updates.push({
              range: `DATA!A${item.rowIndex}`,
              values: [[group.masterId]]
            });
            unifiedCount++;
          }
        }
        
        this.stats.processed += group.items.length;
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
    return this.stats;
  }

  isProcessRunning(): boolean {
    return this.isRunning;
  }
}