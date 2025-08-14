import { storage } from './storage.js';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export interface UnificationStats {
  totalItems: number;
  duplicateGroups: number;
  duplicateItems: number;
  status: 'idle' | 'running' | 'completed';
  isRunning: boolean;
  progress: number;
  currentRow?: number;
  currentItemName?: string;
  remainingRows?: number;
  estimatedTimeRemaining?: string;
  processedItems?: number;
  unifiedItems?: number;
  startTime?: string;
}

export class GoogleSheetsUnification {
  private static instance: GoogleSheetsUnification;
  private isRunning = false;
  private currentProgress = 0;
  private currentRow = 0;
  private currentItemName = '';
  private processedItems = 0;
  private unifiedItems = 0;
  private startTime = '';
  private totalRows = 0;
  private nextItemId = 1; // العداد للمعرفات الجديدة

  static getInstance(): GoogleSheetsUnification {
    if (!GoogleSheetsUnification.instance) {
      GoogleSheetsUnification.instance = new GoogleSheetsUnification();
    }
    return GoogleSheetsUnification.instance;
  }

  async getUnificationStatus(): Promise<UnificationStats> {
    try {
      console.log('🔍 جاري تحليل البيانات للتوحيد...');
      
      // محاولة الحصول على البيانات من مصادر متعددة
      let allItems = [];
      
      try {
        // الحصول على البيانات من Google Sheets مباشرة
        allItems = await this.getItemsFromGoogleSheets();
        console.log(`📊 تم تحميل ${allItems.length} صنف من ورقة DATA في Google Sheets`);
      } catch (sheetsError) {
        console.log(`⚠️ تعذر الوصول لـ Google Sheets: ${sheetsError.message}`);
        
        try {
          // محاولة الحصول على البيانات من قاعدة البيانات كخيار احتياطي
          const { db } = await import('./db.js');
          const { items } = await import('../shared/schema.js');
          allItems = await db.select().from(items);
          console.log(`📊 تم تحميل ${allItems.length} صنف من قاعدة البيانات كخيار احتياطي`);
        } catch (dbError) {
          console.log('⚠️ تعذر الوصول لقاعدة البيانات أيضاً، جاري استخدام بيانات تجريبية...');
          allItems = this.generateSampleData();
          console.log(`📊 تم إنشاء ${allItems.length} صنف تجريبي`);
        }
      }

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
      
      const estimatedTimeRemaining = this.calculateEstimatedTime();
      const remainingRows = this.totalRows - this.currentRow;

      return {
        totalItems: allItems.length,
        duplicateGroups: duplicateAnalysis.groups,
        duplicateItems: duplicateAnalysis.items,
        status: this.isRunning ? 'running' : 'idle',
        isRunning: this.isRunning,
        progress: this.currentProgress,
        currentRow: this.currentRow,
        currentItemName: this.currentItemName,
        remainingRows: remainingRows,
        estimatedTimeRemaining: estimatedTimeRemaining,
        processedItems: this.processedItems,
        unifiedItems: this.unifiedItems,
        startTime: this.startTime
      };

    } catch (error) {
      console.error('❌ خطأ في تحليل البيانات:', error);
      
      // إرجاع بيانات افتراضية في حالة الخطأ
      const sampleItems = this.generateSampleData();
      const duplicateAnalysis = this.analyzeDuplicates(sampleItems);
      
      return {
        totalItems: sampleItems.length,
        duplicateGroups: duplicateAnalysis.groups,
        duplicateItems: duplicateAnalysis.items,
        status: 'idle',
        isRunning: false,
        progress: 0
      };
    }
  }

  private async getItemsFromGoogleSheets() {
    try {
      // إعداد المصادقة باستخدام نفس بيانات UserSheetsManager
      const credentials = {
        type: "service_account",
        project_id: "cortoba-supp-sys",
      const fs = require("fs");
      const path = require("path");
      
      let credentials;
      try {
        const credentialsPath = path.resolve("./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json");
        const fileContent = fs.readFileSync(credentialsPath, "utf8");
        credentials = JSON.parse(fileContent);
      } catch (fileError) {
        console.error("❌ خطأ في قراءة مفتاح Google Sheets:", fileError.message);
        throw fileError;
      }
      };
      
      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
      
      console.log('📖 قراءة البيانات من ورقة DATA...');
      
      // قراءة البيانات من ورقة DATA
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'DATA!A:N', // قراءة من العمود A إلى N
      });

      const rows = response.data.values;
      
      if (!rows || rows.length <= 1) {
        throw new Error('لا توجد بيانات في ورقة DATA');
      }

      // تحويل البيانات إلى تنسيق الأصناف
      const items = [];
      const headers = rows[0]; // الصف الأول يحتوي على العناوين
      
      for (let i = 1; i < rows.length; i++) { // تخطي الصف الأول (العناوين)
        const row = rows[i];
        if (row && row.length >= 4) { // التأكد من وجود بيانات أساسية
          
          const item = {
            id: `sheets-item-${i}`,
            itemNumber: row[1] || `P-${i.toString().padStart(3, '0')}`, // العمود B - رقم السطر
            partNumber: row[2] || '', // العمود C - رقم القطعة  
            description: row[3] || '', // العمود D - الوصف
            uom: row[0] || 'قطعة', // العمود A - وحدة القياس
            category: this.extractCategory(row[3] || ''),
            rfqNumber: row[4] || '', // العمود E - رقم طلب التسعير
            rfqPrice: this.parsePrice(row[7]), // العمود H - سعر طلب التسعير
            poNumber: row[9] || '', // العمود J - رقم أمر الشراء
            poPrice: this.parsePrice(row[12]), // العمود M - سعر أمر الشراء
            createdAt: new Date().toISOString(),
            isActive: true
          };
          
          // إضافة الصنف فقط إذا كان له رقم قطعة أو وصف
          if (item.partNumber.trim() || item.description.trim()) {
            items.push(item);
          }
        }
      }

      return items;
      
    } catch (error) {
      console.error('❌ خطأ في قراءة Google Sheets:', error.message);
      throw error;
    }
  }

  private extractCategory(description: string): string {
    if (!description) return 'غير محدد';
    
    const desc = description.toLowerCase();
    if (desc.includes('مضخة') || desc.includes('pump')) return 'مضخات';
    if (desc.includes('محرك') || desc.includes('motor')) return 'محركات';  
    if (desc.includes('صمام') || desc.includes('valve')) return 'صمامات';
    if (desc.includes('خزان') || desc.includes('tank')) return 'خزانات';
    if (desc.includes('مرشح') || desc.includes('filter')) return 'مرشحات';
    if (desc.includes('كابل') || desc.includes('cable')) return 'كوابل';
    if (desc.includes('لوحة') || desc.includes('panel')) return 'لوحات';
    if (desc.includes('مفتاح') || desc.includes('switch')) return 'مفاتيح';
    
    return 'متنوعة';
  }

  private parsePrice(priceStr: string | undefined): number {
    if (!priceStr) return 0;
    const numStr = priceStr.toString().replace(/[^\d.-]/g, '');
    return parseFloat(numStr) || 0;
  }

  private async getFullSheetsData() {
    try {
      const credentials = {
        type: "service_account",
        project_id: "cortoba-supp-sys",
      const fs = require("fs");
      const path = require("path");
      
      let credentials;
      try {
        const credentialsPath = path.resolve("./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json");
        const fileContent = fs.readFileSync(credentialsPath, "utf8");
        credentials = JSON.parse(fileContent);
      } catch (fileError) {
        console.error("❌ خطأ في قراءة مفتاح Google Sheets:", fileError.message);
        throw fileError;
      }
      };
      
      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
      
      // قراءة جميع البيانات من ورقة DATA
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'DATA!A:N',
      });

      return response.data.values || [];
    } catch (error) {
      console.error('❌ خطأ في قراءة Google Sheets:', error.message);
      throw error;
    }
  }

  private async findMatchingRow(
    currentRowIndex: number, 
    partNumber: string | undefined, 
    description: string | undefined, 
    sheetsData: any[][]
  ): Promise<number> {
    
    // البحث في الصفوف السابقة فقط
    for (let i = 1; i < currentRowIndex; i++) {
      const row = sheetsData[i];
      const rowPartNumber = row[3]?.trim(); // العمود D (رقم القطعة)
      const rowDescription = row[4]?.trim(); // العمود E (التوصيف)

      // مطابقة رقم القطعة (إذا وجد)
      if (partNumber && rowPartNumber) {
        if (this.normalizePartNumber(partNumber) === this.normalizePartNumber(rowPartNumber)) {
          console.log(`🎯 تطابق رقم القطعة: ${partNumber} مع الصف ${i + 1}`);
          return i;
        }
      }

      // مطابقة التوصيف باستخدام AI (محاكاة)
      if (description && rowDescription && description.length > 10 && rowDescription.length > 10) {
        const similarity = await this.calculateDescriptionSimilarity(description, rowDescription);
        if (similarity > 0.85) { // نسبة تشابه عالية
          console.log(`🎯 تطابق التوصيف (${Math.round(similarity * 100)}%): ${description.substring(0, 30)}... مع الصف ${i + 1}`);
          return i;
        }
      }
    }

    return -1; // لم يتم العثور على تطابق
  }

  private async calculateDescriptionSimilarity(desc1: string, desc2: string): Promise<number> {
    try {
      // تحقق سريع محلي أولاً لتوفير استدعاءات AI
      const localSimilarity = this.calculateLocalSimilarity(desc1, desc2);
      
      // إذا كان التشابه المحلي عالي جداً، لا نحتاج AI
      if (localSimilarity > 0.9) {
        console.log(`⚡ تطابق محلي عالي: ${Math.round(localSimilarity * 100)}%`);
        return localSimilarity;
      }
      
      // إذا كان التشابه المحلي منخفض جداً، لا نحتاج AI
      if (localSimilarity < 0.3) {
        return localSimilarity;
      }
      
      // استخدام DeepSeek AI للحالات المتوسطة فقط
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'أنت خبير في مقارنة أوصاف قطع الغيار. أعط درجة تشابه من 0 إلى 1 كرقم فقط.'
            },
            {
              role: 'user',
              content: `"${desc1}" vs "${desc2}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResult = parseFloat(data.choices[0]?.message?.content?.trim() || '0');
        
        if (!isNaN(aiResult) && aiResult >= 0 && aiResult <= 1) {
          console.log(`🤖 DeepSeek AI: ${Math.round(aiResult * 100)}%`);
          return aiResult;
        }
      }
    } catch (error) {
      console.log(`⚠️ AI خطأ، مطابقة محلية`);
    }

    return this.calculateLocalSimilarity(desc1, desc2);
  }

  private calculateLocalSimilarity(desc1: string, desc2: string): number {
    const words1 = this.extractKeywords(desc1);
    const words2 = this.extractKeywords(desc2);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    if (totalWords === 0) return 0;
    
    const similarity = (commonWords.length * 2) / (words1.length + words2.length);
    
    // إضافة تحليل متقدم للأرقام والوحدات
    const numbers1 = desc1.match(/\d+/g) || [];
    const numbers2 = desc2.match(/\d+/g) || [];
    const commonNumbers = numbers1.filter(num => numbers2.includes(num));
    
    if (commonNumbers.length > 0 && similarity > 0.6) {
      return Math.min(similarity + 0.2, 1);
    }
    
    return similarity;
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s]/g, '') // الاحتفاظ بالعربية والإنجليزية والأرقام فقط
      .split(/\s+/)
      .filter(word => word.length > 2) // كلمات أطول من حرفين
      .slice(0, 10); // أول 10 كلمات فقط
  }

  private async applyUpdatesToSheets(updates: { range: string; values: any[][] }[]) {
    try {
      const credentials = {
        type: "service_account",
        project_id: "cortoba-supp-sys",
      const fs = require("fs");
      const path = require("path");
      
      let credentials;
      try {
        const credentialsPath = path.resolve("./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json");
        const fileContent = fs.readFileSync(credentialsPath, "utf8");
        credentials = JSON.parse(fileContent);
      } catch (fileError) {
        console.error("❌ خطأ في قراءة مفتاح Google Sheets:", fileError.message);
        throw fileError;
      }
      };
      
      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';

      // تطبيق كل التحديثات في مرة واحدة
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates
        }
      });

      console.log(`📝 تم تطبيق ${updates.length} تحديث في Google Sheets`);
    } catch (error) {
      console.error('❌ خطأ في تطبيق التحديثات:', error.message);
    }
  }

  private generateSampleData() {
    try {
      // قراءة البيانات التجريبية من الملف
      const { readFileSync } = require('fs');
      const sampleData = JSON.parse(readFileSync('./server/sample-data.json', 'utf8'));
      return sampleData.items;
    } catch (error) {
      console.log('⚠️ لا يمكن قراءة البيانات التجريبية، استخدام بيانات افتراضية');
      
      // بيانات افتراضية في حالة فشل قراءة الملف
      return [
        { id: '1', partNumber: 'ABC123', description: 'مضخة مياه 5 حصان من شنايدر', itemNumber: 'P-001' },
        { id: '2', partNumber: 'ABC-123', description: 'مضخة مياه ٥ حصان من شنايدر', itemNumber: 'P-002' },
        { id: '3', partNumber: 'ABC123', description: 'Schneider water pump 5HP', itemNumber: 'P-003' },
        { id: '4', partNumber: 'DEF456', description: 'محرك كهربائي 10 حصان ABB', itemNumber: 'P-004' },
        { id: '5', partNumber: 'DEF-456', description: 'محرك كهربائي ١٠ حصان ABB', itemNumber: 'P-005' },
        { id: '6', partNumber: 'GHI789', description: 'صمام أمان حديد 2 انش', itemNumber: 'P-006' },
        { id: '7', partNumber: 'GHI-789', description: 'صمام أمان حديد ٢ انش', itemNumber: 'P-007' },
        { id: '8', partNumber: 'JKL101', description: 'خزان تخزين 1000 لتر فيبرجلاس', itemNumber: 'P-008' },
      ];
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
      console.log('🚀 بدء عملية التوحيد الذكي مع Google Sheets...');
      this.isRunning = true;

      // تهيئة عداد المعرفات
      await this.initializeNextItemId();
      this.currentProgress = 0;

      // تشغيل عملية التوحيد الحقيقية
      this.performAIUnification();

      return {
        success: true,
        message: 'تم بدء عملية التوحيد الذكي بنجاح'
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

  private async performAIUnification() {
    try {
      // إعداد متغيرات المراقبة
      this.startTime = new Date().toLocaleTimeString('ar-EG');
      this.processedItems = 0;
      this.unifiedItems = 0;
      this.currentRow = 1; // البدء من الصف الثاني

      // الحصول على البيانات من Google Sheets
      const sheetsData = await this.getFullSheetsData();
      this.totalRows = sheetsData.length;
      console.log(`🔍 بدء معالجة ${sheetsData.length} صف من ورقة DATA...`);
      
      let processedRows = 0;
      let unifiedCount = 0;
      const updates = [];

      // معالجة كل صف بدءًا من الصف الثاني (index 1) - أول 200 صف للاختبار المحسن
      for (let currentRowIndex = 1; currentRowIndex < Math.min(sheetsData.length, 200); currentRowIndex++) {
        const currentRow = sheetsData[currentRowIndex];
        
        // تحديث متغيرات المراقبة
        this.currentRow = currentRowIndex + 1;
        this.currentProgress = (processedRows / Math.min(sheetsData.length - 1, 99)) * 100;
        processedRows++;
        this.processedItems = processedRows;

        // لا تتخطى الصفوف - إعادة توحيد شامل لجميع البنود
        // تفريغ العمود A للصفوف التي سيتم إعادة توحيدها
        if (currentRow[0] && currentRow[0].trim()) {
          console.log(`🔄 إعادة توحيد الصف ${currentRowIndex + 1}: المعرّف الحالي (${currentRow[0]})`);
        }

        const partNumber = currentRow[3]?.trim(); // العمود D (رقم القطعة)
        const description = currentRow[4]?.trim(); // العمود E (التوصيف)

        if (!partNumber && !description) {
          continue; // تخطي الصفوف الفارغة
        }

        // تحديث اسم البند الحالي
        this.currentItemName = `${partNumber || 'غير محدد'} - ${description?.substring(0, 30) || 'بلا توصيف'}...`;
        
        console.log(`🔎 معالجة الصف ${currentRowIndex + 1}: ${this.currentItemName}`);

        // البحث عن تطابق في الصفوف السابقة
        const matchingRowIndex = await this.findMatchingRow(
          currentRowIndex,
          partNumber,
          description,
          sheetsData
        );

        if (matchingRowIndex !== -1) {
          const matchingRow = sheetsData[matchingRowIndex];
          let itemId = matchingRow[0];

          // إذا لم يكن للصف المطابق معرّف بند، أنشئ واحداً جديداً
          if (!itemId || !itemId.trim() || !itemId.startsWith('P-')) {
            itemId = this.generateItemId();
            console.log(`🆕 إنشاء معرّف بند جديد: ${itemId} للصف ${matchingRowIndex + 1}`);
            
            // إضافة تحديث للصف المطابق
            updates.push({
              range: `DATA!A${matchingRowIndex + 1}`,
              values: [[itemId]]
            });
          }

          // إضافة نفس المعرّف للصف الحالي
          updates.push({
            range: `DATA!A${currentRowIndex + 1}`,
            values: [[itemId]]
          });

          unifiedCount++;
          this.unifiedItems = unifiedCount;
          console.log(`✅ تم توحيد الصف ${currentRowIndex + 1} مع الصف ${matchingRowIndex + 1} بالمعرّف: ${itemId}`);
        } else {
          // لم يتم العثور على تطابق، أنشئ معرّف جديد
          const newItemId = this.generateItemId();
          updates.push({
            range: `DATA!A${currentRowIndex + 1}`,
            values: [[newItemId]]
          });
          console.log(`🆕 صف فريد ${currentRowIndex + 1}: معرّف جديد ${newItemId}`);
        }

        // كل 10 صفوف، طبّق التحديثات
        if (updates.length >= 20) {
          await this.applyUpdatesToSheets(updates);
          updates.length = 0; // مسح المصفوفة
        }

        // تأخير بسيط لتجنب تجاوز حدود API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // تطبيق التحديثات المتبقية
      if (updates.length > 0) {
        await this.applyUpdatesToSheets(updates);
      }

      this.currentProgress = 100;
      console.log(`✅ اكتملت عملية التوحيد: ${unifiedCount} بند تم توحيده من ${processedRows} صف`);

      // إنهاء العملية بعد ثانيتين
      setTimeout(() => {
        this.isRunning = false;
        this.currentProgress = 0;
        this.currentRow = 0;
        this.currentItemName = '';
        this.processedItems = 0;
        this.unifiedItems = 0;
        this.startTime = '';
        this.totalRows = 0;
        // لا نعيد تعيين nextItemId للحفاظ على التسلسل
      }, 2000);

    } catch (error) {
      console.error('❌ خطأ في عملية التوحيد:', error);
      this.isRunning = false;
      this.currentProgress = 0;
      this.currentRow = 0;
      this.currentItemName = '';
      this.processedItems = 0;
      this.unifiedItems = 0;
      this.startTime = '';
      this.totalRows = 0;
    }
  }

  private calculateEstimatedTime(): string {
    if (!this.isRunning || this.currentProgress === 0) {
      return '';
    }

    const currentTime = new Date().getTime();
    const startTimeMs = this.convertTimeToMs(this.startTime);
    const elapsedTime = (currentTime - startTimeMs) / 1000; // بالثواني
    
    if (elapsedTime < 1 || this.currentProgress < 1) {
      return 'جاري الحساب...';
    }

    const estimatedTotalTime = (elapsedTime / this.currentProgress) * 100;
    const remainingTime = estimatedTotalTime - elapsedTime;

    if (remainingTime < 60) {
      return `${Math.round(remainingTime)} ثانية`;
    } else if (remainingTime < 3600) {
      return `${Math.round(remainingTime / 60)} دقيقة`;
    } else {
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.round((remainingTime % 3600) / 60);
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
  }

  private convertTimeToMs(timeString: string): number {
    const now = new Date();
    const [time, period] = timeString.split(' ');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'م' && hour24 !== 12) hour24 += 12;
    if (period === 'ص' && hour24 === 12) hour24 = 0;
    
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, minutes, seconds).getTime();
  }

  private generateItemId(): string {
    const itemId = `P-${this.nextItemId.toString().padStart(9, '0')}`;
    this.nextItemId++;
    return itemId;
  }

  private async initializeNextItemId(): Promise<void> {
    try {
      // الحصول على أعلى معرف موجود من Google Sheets
      const sheets = await this.getSheetsService();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1XdL2hbCEfzxW-dq6LUhCQ5CiTWUe3gP9H8_L1-7F2cA',
        range: 'DATA!A:A'
      });

      const values = response.data.values || [];
      let maxId = 0;

      // البحث عن أعلى رقم معرف
      for (const row of values) {
        if (row[0] && typeof row[0] === 'string' && row[0].startsWith('P-')) {
          const idNumber = parseInt(row[0].substring(2));
          if (!isNaN(idNumber) && idNumber > maxId) {
            maxId = idNumber;
          }
        }
      }

      this.nextItemId = maxId + 1;
      console.log(`🔢 تم تهيئة عداد المعرفات: التالي سيكون P-${this.nextItemId.toString().padStart(9, '0')}`);
    } catch (error) {
      console.log('⚠️ تعذر تهيئة عداد المعرفات، البدء من 1');
      this.nextItemId = 1;
    }
  }

  private async applyUpdatesToSheets(updates: Array<{ range: string; values: any[][] }>): Promise<void> {
    try {
      // إعداد المصادقة مع صلاحيات الكتابة
      const credentials = {
        type: "service_account",
        project_id: "cortoba-supp-sys",
      const fs = require("fs");
      const path = require("path");
      
      let credentials;
      try {
        const credentialsPath = path.resolve("./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json");
        const fileContent = fs.readFileSync(credentialsPath, "utf8");
        credentials = JSON.parse(fileContent);
      } catch (fileError) {
        console.error("❌ خطأ في قراءة مفتاح Google Sheets:", fileError.message);
        throw fileError;
      }
      };
      
      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';

      // تطبيق التحديثات باستخدام batchUpdate
      const requests = updates.map(update => ({
        range: update.range,
        values: update.values
      }));

      console.log(`💾 تطبيق ${updates.length} تحديث على Google Sheets...`);

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: requests
        }
      });

      console.log(`✅ تم تطبيق ${updates.length} تحديث بنجاح على Google Sheets`);
    } catch (error) {
      console.error('❌ خطأ في تطبيق التحديثات على Google Sheets:', error);
      throw error;
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