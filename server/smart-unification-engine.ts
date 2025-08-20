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

  // تحليل التشابه بين القطع باستخدام DeepSeek AI
  private async areItemsSimilar(item1: UnificationItem, item2: UnificationItem): Promise<boolean> {
    // 1. الفحص السريع أولاً
    const quickCheck = this.quickSimilarityCheck(item1, item2);
    if (quickCheck) return true;
    
    // 2. استخدام DeepSeek AI للتحليل المتقدم
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        console.log('⚠️ DeepSeek API key غير موجود، استخدام المحرك البسيط');
        return this.fallbackSimilarityCheck(item1, item2);
      }
      
      const prompt = `أنت خبير في تحليل قطع الغيار والمنتجات الصناعية. قارن بين هذين البندين وحدد هل هما نفس المنتج أم لا.

البند الأول:
- Part Number: ${item1.partNumber || 'غير محدد'}
- الوصف: ${item1.description || 'غير محدد'}

البند الثاني:
- Part Number: ${item2.partNumber || 'غير محدد'}
- الوصف: ${item2.description || 'غير محدد'}

ركز على:
1. الموديل والرقم الفني
2. المواصفات الكهربائية (الفولت، الأمبير، القدرة)
3. الماركة والشركة المصنعة
4. الاستخدام والتطبيق

أجب بـ "نعم" إذا كانا نفس المنتج أو "لا" إذا كانا مختلفين.
أضف شرح مختصر جداً (كلمتين أو ثلاث) عن السبب.`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'أنت خبير فني متخصص في تحليل قطع الغيار الصناعية.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 50
        })
      });
      
      if (!response.ok) {
        console.log('⚠️ خطأ في DeepSeek API، استخدام المحرك البسيط');
        return this.fallbackSimilarityCheck(item1, item2);
      }
      
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';
      
      // تحليل الإجابة
      if (answer.includes('نعم') || answer.includes('yes')) {
        this.emit('log', { 
          message: `🤖 DeepSeek: تم توحيد البندين - ${answer}`, 
          type: 'success' 
        });
        return true;
      }
      
      return false;
      
    } catch (error: any) {
      console.log('⚠️ خطأ في استخدام DeepSeek:', error.message);
      return this.fallbackSimilarityCheck(item1, item2);
    }
  }
  
  // فحص سريع بدون AI
  private quickSimilarityCheck(item1: UnificationItem, item2: UnificationItem): boolean {
    // LINE ITEM متطابق تماماً
    if (item1.lineItem && item2.lineItem) {
      if (item1.lineItem.trim().toUpperCase() === item2.lineItem.trim().toUpperCase()) {
        return true;
      }
    }
    
    // PART NUMBER متطابق تماماً
    if (item1.partNumber && item2.partNumber) {
      const normalized1 = this.normalizePartNumber(item1.partNumber);
      const normalized2 = this.normalizePartNumber(item2.partNumber);
      if (normalized1 === normalized2) {
        return true;
      }
    }
    
    return false;
  }
  
  // المحرك الاحتياطي في حالة فشل AI
  private fallbackSimilarityCheck(item1: UnificationItem, item2: UnificationItem): boolean {
    // استخراج المعلومات المهمة من كلا البندين
    const info1 = this.extractProductInfo(item1);
    const info2 = this.extractProductInfo(item2);
    
    // التحقق من تطابق الموديل
    if (info1.model && info2.model && info1.model === info2.model) {
      const specsMatch = this.compareSpecs(info1.specs, info2.specs);
      if (specsMatch >= 0.8) {
        return true;
      }
    }
    
    // التحقق من المواصفات الكهربائية والماركة
    if (item1.description && item2.description) {
      const hasElectricalSpecs = this.haveSameElectricalSpecs(item1.description, item2.description);
      const sameBrand = this.haveSameBrand(item1.description, item2.description);
      
      if (hasElectricalSpecs && sameBrand) {
        return true;
      }
      
      // المقارنة العادية
      const desc1 = this.normalizeDescription(item1.description);
      const desc2 = this.normalizeDescription(item2.description);
      const similarity = this.calculateTextSimilarity(desc1, desc2);
      if (similarity >= 0.75) {
        return true;
      }
    }
    
    return false;
  }
  
  // استخراج معلومات المنتج
  private extractProductInfo(item: UnificationItem): { model: string; specs: string[] } {
    const text = `${item.partNumber || ''} ${item.description || ''}`.toUpperCase();
    
    // استخراج الموديل (مثل LC1D32M7)
    const modelMatch = text.match(/LC\d+D\s*\d+\s*[A-Z]\d+/gi) || 
                       text.match(/LC\d+D\d+[A-Z]\d+/gi);
    const model = modelMatch ? modelMatch[0].replace(/\s+/g, '') : '';
    
    // استخراج المواصفات
    const specs: string[] = [];
    
    // الفولتية
    const voltMatch = text.match(/\d+V/gi);
    if (voltMatch) specs.push(...voltMatch);
    
    // التردد
    const hzMatch = text.match(/\d+\s*HZ/gi);
    if (hzMatch) specs.push(...hzMatch.map(s => s.replace(/\s+/g, '')));
    
    // الأمبير
    const ampMatch = text.match(/\d+\s*A(?!\w)/gi);
    if (ampMatch) specs.push(...ampMatch.map(s => s.replace(/\s+/g, '')));
    
    // القدرة
    const kwMatch = text.match(/\d+\s*KW/gi);
    if (kwMatch) specs.push(...kwMatch.map(s => s.replace(/\s+/g, '')));
    
    return { model, specs };
  }
  
  // مقارنة المواصفات
  private compareSpecs(specs1: string[], specs2: string[]): number {
    if (specs1.length === 0 || specs2.length === 0) return 0;
    
    let matches = 0;
    for (const spec1 of specs1) {
      if (specs2.includes(spec1)) {
        matches++;
      }
    }
    
    return matches / Math.max(specs1.length, specs2.length);
  }
  
  // التحقق من المواصفات الكهربائية
  private haveSameElectricalSpecs(desc1: string, desc2: string): boolean {
    const extractSpecs = (text: string) => {
      const upper = text.toUpperCase();
      return {
        voltage: upper.match(/\d+V/g) || [],
        hz: upper.match(/\d+\s*HZ/g) || [],
        amp: upper.match(/\d+\s*A(?!\w)/g) || [],
        kw: upper.match(/\d+\s*KW/g) || []
      };
    };
    
    const specs1 = extractSpecs(desc1);
    const specs2 = extractSpecs(desc2);
    
    // مقارنة كل نوع من المواصفات
    const voltageMatch = JSON.stringify(specs1.voltage.sort()) === JSON.stringify(specs2.voltage.sort());
    const hzMatch = JSON.stringify(specs1.hz.sort()) === JSON.stringify(specs2.hz.sort());
    const ampMatch = JSON.stringify(specs1.amp.sort()) === JSON.stringify(specs2.amp.sort());
    const kwMatch = JSON.stringify(specs1.kw.sort()) === JSON.stringify(specs2.kw.sort());
    
    // يجب أن تتطابق على الأقل 3 من 4 مواصفات
    const matches = [voltageMatch, hzMatch, ampMatch, kwMatch].filter(m => m).length;
    return matches >= 3;
  }
  
  // التحقق من نفس الماركة
  private haveSameBrand(desc1: string, desc2: string): boolean {
    const brands = ['SCHNEIDER', 'SCHNIEDER', 'TELEMECANIQUE', 'ABB', 'SIEMENS', 'MITSUBISHI'];
    const upper1 = desc1.toUpperCase();
    const upper2 = desc2.toUpperCase();
    
    for (const brand of brands) {
      // Schneider و Telemecanique نفس الشركة
      if ((upper1.includes('SCHNEIDER') || upper1.includes('SCHNIEDER') || upper1.includes('TELEMECANIQUE')) &&
          (upper2.includes('SCHNEIDER') || upper2.includes('SCHNIEDER') || upper2.includes('TELEMECANIQUE'))) {
        return true;
      }
      
      if (upper1.includes(brand) && upper2.includes(brand)) {
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

  // عملية التجميع السريع بدون AI
  private async createUnificationGroupsFast(items: UnificationItem[]): Promise<UnificationGroup[]> {
    const groups: UnificationGroup[] = [];
    const processedItems = new Set<number>();
    let processedCount = 0;

    this.emit('log', { message: `🚀 بدء التجميع السريع لـ ${items.length} صنف...`, type: 'info' });

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
      processedCount++;

      // البحث السريع عن العناصر المشابهة
      for (let j = i + 1; j < items.length; j++) {
        if (processedItems.has(j)) continue;

        const compareItem = items[j];
        
        // مقارنة سريعة بدون AI
        if (this.quickMatch(currentItem, compareItem)) {
          group.items.push(compareItem);
          processedItems.add(j);
          processedCount++;
          
          if (compareItem.description.length > group.masterDescription.length) {
            group.masterDescription = compareItem.description;
          }
        }
      }

      groups.push(group);
      
      // تحديث التقدم بشكل تدريجي
      this.stats.processed = processedCount;
      this.stats.remainingItems = Math.max(0, this.stats.total - processedCount);
      this.stats.progress = Math.min(100, Math.round((processedCount / this.stats.total) * 100));
      
      // تحديث الوقت كل 50 عنصر
      if (processedCount % 50 === 0 && this.stats.startTime) {
        this.stats.elapsedTime = Math.floor((new Date().getTime() - this.stats.startTime.getTime()) / 1000);
        if (processedCount > 0) {
          const timePerItem = this.stats.elapsedTime / processedCount;
          this.stats.estimatedTimeRemaining = Math.ceil(timePerItem * this.stats.remainingItems);
        }
      }
      
      if (group.items.length > 1) {
        this.stats.duplicatesFound += group.items.length - 1;
        this.emit('log', { 
          message: `📦 مجموعة ${group.masterId}: ${group.items.length} عنصر مكرر`, 
          type: 'success' 
        });
      }
    }

    // التأكد من الإحصائيات النهائية
    this.stats.remainingItems = 0;
    this.stats.progress = 100;
    
    // حساب الوقت النهائي
    if (this.stats.startTime) {
      this.stats.elapsedTime = Math.floor((new Date().getTime() - this.stats.startTime.getTime()) / 1000);
      this.stats.estimatedTimeRemaining = 0;
    }
    
    this.emit('log', { 
      message: `✅ تم إنشاء ${groups.length} مجموعة، وفر ${this.stats.duplicatesFound} عنصر مكرر`, 
      type: 'success' 
    });

    return groups;
  }
  
  // مقارنة سريعة بدون AI
  private quickMatch(item1: UnificationItem, item2: UnificationItem): boolean {
    // 1. تطابق LINE ITEM
    if (item1.lineItem && item2.lineItem) {
      if (item1.lineItem.trim().toUpperCase() === item2.lineItem.trim().toUpperCase()) {
        return true;
      }
    }
    
    // 2. تطابق PART NUMBER بعد التنظيف
    if (item1.partNumber && item2.partNumber) {
      const clean1 = this.normalizePartNumber(item1.partNumber);
      const clean2 = this.normalizePartNumber(item2.partNumber);
      if (clean1 === clean2) {
        return true;
      }
      
      // تحقق من احتواء أحدهما على الآخر
      if (clean1.length > 4 && clean2.length > 4) {
        if (clean1.includes(clean2) || clean2.includes(clean1)) {
          // تحقق إضافي من الوصف
          if (item1.description && item2.description) {
            const desc1 = item1.description.toUpperCase();
            const desc2 = item2.description.toUpperCase();
            // البحث عن نفس الماركة
            const brands = ['SCHNEIDER', 'SCHNIEDER', 'TELEMECANIQUE', 'ABB', 'SIEMENS'];
            for (const brand of brands) {
              if (desc1.includes(brand) && desc2.includes(brand)) {
                return true;
              }
            }
          }
        }
      }
    }
    
    // 3. تطابق المواصفات للمنتجات الكهربائية
    if (item1.description && item2.description) {
      const info1 = this.extractProductInfo(item1);
      const info2 = this.extractProductInfo(item2);
      
      // إذا كان نفس الموديل
      if (info1.model && info2.model && info1.model === info2.model) {
        return true;
      }
      
      // إذا كانت المواصفات الكهربائية متطابقة
      const specs1 = info1.specs.sort().join(',');
      const specs2 = info2.specs.sort().join(',');
      if (specs1 && specs2 && specs1 === specs2) {
        // تحقق من الماركة
        if (this.haveSameBrand(item1.description, item2.description)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // عملية التجميع الذكي مع AI (بطيء)
  private async createUnificationGroups(items: UnificationItem[]): Promise<UnificationGroup[]> {
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
        
        const isSimilar = await this.areItemsSimilar(currentItem, compareItem);
        if (isSimilar) {
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
      console.log('📊 بدء التجميع الذكي للبنود...');

      // التجميع الذكي - معالجة سريعة بدون DeepSeek أولاً
      const groups = await this.createUnificationGroupsFast(items);
      this.stats.groupsCreated = groups.length;
      console.log(`✅ تم إنشاء ${groups.length} مجموعة`);

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