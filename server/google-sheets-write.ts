import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

interface QuotationItem {
  description: string;
  partNumber?: string;
  lineItem?: string;
  uom?: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

interface NewQuotation {
  clientName: string;
  rfqNumber: string;
  requestDate: string;
  expiryDate?: string;
  responsibleEmployee: string;
  items: QuotationItem[];
}

export class GoogleSheetsWriter {
  private auth: GoogleAuth | null = null;
  private sheets: any = null;
  private spreadsheetId: string;

  constructor() {
    // استخدام معرف Google Sheets المباشر
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  }

  async initialize() {
    try {
      // محاولة تحميل المفتاح من متغير البيئة أو الملف
      let credentials;
      let credentialsLoaded = false;
      
      // أولاً: جرب متغير البيئة (Render/Railway)
      if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
        try {
          const decodedJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
          credentials = JSON.parse(decodedJson);
          if (!credentials.private_key || !credentials.client_email) throw new Error('مفتاح غير مكتمل');
          console.log('✅ تم تحميل مفاتيح Google Sheets من متغير البيئة');
          credentialsLoaded = true;
        } catch (envErr: any) { console.error('❌ خطأ في GOOGLE_SERVICE_ACCOUNT_BASE64:', envErr.message); }
      }
      // ثانياً: جرب الملف المحلي (للتطوير فقط)
      if (!credentialsLoaded) {
        const localPaths = ['./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', './google-service-account.json'];
        for (const p of localPaths) {
          if (fs.existsSync(p)) { credentials = JSON.parse(fs.readFileSync(p, 'utf8')); credentialsLoaded = true; break; }
        }
      }

      if (!credentialsLoaded) {
        throw new Error('فشل في تحميل مفاتيح Google Sheets. تأكد من وجود GOOGLE_SERVICE_ACCOUNT_BASE64 في متغيرات البيئة');
      }

      this.auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      // إضافة خيارات إضافية لحل مشاكل SSL/TLS
      this.sheets = google.sheets({ 
        version: 'v4', 
        auth: this.auth,
        timeout: 30000 // مهلة زمنية 30 ثانية
      });
      console.log('✅ تم تهيئة Google Sheets للكتابة');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets للكتابة:', error);
      console.error('❌ تفاصيل الخطأ:', (error as Error).stack);
      return false;
    }
  }

  /**
   * العثور على آخر صف فارغ في العمود F (RFQ Number)
   */
  async findNextEmptyRow(): Promise<number> {
    try {
      // محاولة مع إعدادات أمان محسنة
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!F:F', // العمود F فقط
      });

      const values = response.data.values || [];
      
      // العثور على آخر صف غير فارغ + 1
      let lastRow = 1; // البداية من الصف 2 (فهرس 1)
      
      for (let i = 0; i < values.length; i++) {
        if (values[i] && values[i][0] && values[i][0].trim()) {
          lastRow = i + 1;
        }
      }

      const nextRow = lastRow + 1;
      console.log(`📍 آخر صف فارغ في العمود F: ${nextRow}`);
      return nextRow;
    } catch (error) {
      console.error('❌ خطأ في العثور على الصف الفارغ:', (error as Error).message);
      return 2; // افتراضي: الصف الثاني
    }
  }

  /**
   * مطابقة البند مع البنود الموجودة بطريقة سريعة ومبسطة
   */
  async findOrCreateItemId(description: string, partNumber?: string): Promise<string> {
    console.log(`🔧 [DEBUG] تم استدعاء findOrCreateItemId للبند: "${description}" | Part: "${partNumber}"`);
    try {
      // قراءة البنود الموجودة
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:E', // الأعمدة A-E
      });

      const rows = response.data.values || [];
      const existingItems = rows.slice(1) // تخطي الرأس
        .filter((row: any[]) => row[0] && row[0].startsWith('P-')) // البنود التي لها معرف
        .map((row: any[], index: number) => ({
          id: row[0],
          uom: row[1] || '',
          lineItem: row[2] || '',
          partNumber: row[3] || '',
          description: row[4] || '',
          rowIndex: index + 2
        }));

      console.log(`🔍 بحث عن مطابقة للبند: ${description} | Part: ${partNumber || 'غير محدد'}`);
      console.log(`📊 عدد البنود الموجودة للمقارنة: ${existingItems.length}`);
      
      // مطابقة سريعة مع AI محسن
      const matchResult = await this.findSimilarItemWithOptimizedAI(description, partNumber, existingItems);
      
      if (matchResult.found) {
        console.log(`🔍 ✅ تم العثور على بند مطابق: ${matchResult.itemId}`);
        return matchResult.itemId;
      } else {
        console.log(`🔍 ❌ لم يتم العثور على مطابقة، سيتم إنشاء بند جديد`);
      }

      // إنشاء معرف جديد
      const newItemId = await this.generateNewItemId(existingItems);
      console.log(`🆕 إنشاء معرف جديد: ${newItemId}`);
      return newItemId;

    } catch (error) {
      console.error('❌ خطأ في مطابقة البند:', (error as Error).message);
      // إنشاء معرف جديد كخطة احتياطية
      return await this.generateNewItemId([]);
    }
  }



  /**
   * نظام مطابقة محسن مع AI - أسرع وأدق
   */
  private async findSimilarItemWithOptimizedAI(description: string, partNumber: string | undefined, existingItems: any[]): Promise<{found: boolean, itemId: string}> {
    // أولاً: مطابقة دقيقة برقم القطعة
    if (partNumber && partNumber.trim()) {
      const normalizedPart = partNumber.replace(/[\s\-_\.]/g, '').toUpperCase();
      const partMatch = existingItems.find(item => {
        if (!item.partNumber) return false;
        const itemPart = item.partNumber.replace(/[\s\-_\.]/g, '').toUpperCase();
        return itemPart === normalizedPart;
      });
      
      if (partMatch) {
        console.log(`🎯 مطابقة دقيقة برقم القطعة: ${partMatch.id}`);
        return { found: true, itemId: partMatch.id };
      }
    }

    // ثانياً: فلترة البنود المرشحة للمطابقة (أفضل 8 بنود فقط)
    const candidateItems = this.getTopCandidateItems(description, partNumber, existingItems, 8);
    
    if (candidateItems.length === 0) {
      console.log('📋 لا توجد بنود مرشحة للمقارنة');
      return { found: false, itemId: '' };
    }

    console.log(`🤖 مقارنة AI مع ${candidateItems.length} بند مرشح فقط`);
    
    // ثالثاً: استخدام AI للمطابقة الذكية مع البنود المرشحة فقط
    return await this.runOptimizedAIComparison(description, partNumber, candidateItems);
  }

  /**
   * اختيار أفضل البنود المرشحة للمقارنة
   */
  private getTopCandidateItems(description: string, partNumber: string | undefined, allItems: any[], maxItems: number): any[] {
    const candidates: Array<{item: any, score: number}> = [];
    const searchDesc = description.toLowerCase();
    const searchPart = partNumber?.toLowerCase() || '';
    
    for (const item of allItems) {
      let score = 0;
      
      // نقاط المطابقة برقم القطعة
      if (searchPart && item.partNumber) {
        const itemPart = item.partNumber.toLowerCase();
        if (itemPart.includes(searchPart) || searchPart.includes(itemPart)) {
          score += 100;
        }
      }
      
      // نقاط المطابقة بالوصف
      if (item.description) {
        const itemDesc = item.description.toLowerCase();
        const descWords = searchDesc.split(/\s+/).filter(w => w.length > 2);
        
        for (const word of descWords) {
          if (itemDesc.includes(word)) {
            score += 10;
          }
        }
        
        // نقاط إضافية للكلمات المهمة
        const importantWords = ['contactor', 'schneider', 'lc1d', 'switch', 'relay', 'كونتاكتور', 'مرحل'];
        for (const word of importantWords) {
          if (searchDesc.includes(word) && itemDesc.includes(word)) {
            score += 50;
          }
        }
      }
      
      if (score > 0) {
        candidates.push({ item, score });
      }
    }
    
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(c => c.item);
  }

  /**
   * تشغيل مقارنة AI محسنة مع البنود المرشحة
   */
  private async runOptimizedAIComparison(description: string, partNumber: string | undefined, candidateItems: any[]): Promise<{found: boolean, itemId: string}> {
    try {
      if (!process.env.DEEPSEEK_API_KEY) {
        console.log('⚠️ DeepSeek API Key غير متوفر، استخدام المطابقة النصية');
        return this.findSimilarItemSimple(description, partNumber, candidateItems);
      }

      const itemsList = candidateItems.map(item => 
        `${item.id}: ${item.description} | Part: ${item.partNumber || 'غير محدد'}`
      ).join('\n');

      const prompt = `قارن هذا البند الجديد مع البنود الموجودة:

البند الجديد:
- Part Number: ${partNumber || 'غير محدد'}
- الوصف: ${description}

البنود الموجودة للمقارنة:
${itemsList}

إذا وجدت مطابقة دقيقة، أرجع فقط معرف البند (مثل: P-0123456)
إذا لم تجد مطابقة دقيقة، أرجع: "لا يوجد"

قواعد المطابقة الصارمة:
1. Part Number متطابق تماماً = مطابقة مؤكدة
2. نفس النوع والمواصفات والشركة المصنعة = مطابقة مؤكدة  
3. أي اختلاف في المواصفات = لا توجد مطابقة`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.log('❌ فشل في استدعاء DeepSeek API');
        return this.findSimilarItemSimple(description, partNumber, candidateItems);
      }

      const data = await response.json();
      const aiResult = data.choices[0].message.content.trim();
      console.log(`🤖 نتيجة AI المحسنة: ${aiResult}`);

      // تحليل نتيجة AI
      if (aiResult.startsWith('P-') && candidateItems.find(item => item.id === aiResult)) {
        console.log(`✅ AI وجد مطابقة محققة: ${aiResult}`);
        return { found: true, itemId: aiResult };
      } else {
        console.log(`❌ AI لم يجد مطابقة دقيقة: ${aiResult}`);
        return { found: false, itemId: '' };
      }

    } catch (error) {
      console.error('❌ خطأ في AI المحسن:', error);
      return this.findSimilarItemSimple(description, partNumber, candidateItems);
    }
  }

  /**
   * مطابقة نصية بسيطة كاحتياطي
   */
  private async findSimilarItemSimple(description: string, partNumber: string | undefined, existingItems: any[]): Promise<{found: boolean, itemId: string}> {
    // مطابقة برقم القطعة إذا كان متوفراً
    if (partNumber && partNumber.trim()) {
      const partMatch = existingItems.find(item => 
        item.partNumber && item.partNumber.toLowerCase().trim() === partNumber.toLowerCase().trim()
      );
      if (partMatch) {
        console.log(`🎯 مطابقة برقم القطعة: ${partMatch.id}`);
        return { found: true, itemId: partMatch.id };
      }
    }

    // مطابقة جزئية بالوصف (الكلمات الرئيسية)
    const descWords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    for (const item of existingItems) {
      if (!item.description) continue;
      
      const itemWords = item.description.toLowerCase().split(/\s+/);
      const matchingWords = descWords.filter(word => itemWords.some((iw: string) => iw.includes(word)));
      
      // إذا كان 60% من الكلمات متطابقة
      if (matchingWords.length / descWords.length > 0.6) {
        console.log(`📝 مطابقة بالوصف: ${item.id}`);
        return { found: true, itemId: item.id };
      }
    }

    return { found: false, itemId: '' };
  }

  /**
   * إنشاء معرف بند جديد
   */
  private async generateNewItemId(existingItems: any[]): Promise<string> {
    // العثور على أكبر رقم موجود
    let maxNumber = 0;
    
    existingItems.forEach(item => {
      if (item.id && item.id.startsWith('P-')) {
        const numberPart = item.id.substring(2);
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    const newId = `P-${nextNumber.toString().padStart(7, '0')}`;
    
    return newId;
  }

  /**
   * إدراج طلب تسعير جديد في Google Sheets
   */
  async insertNewQuotation(quotation: NewQuotation): Promise<{ success: boolean; itemIds: string[] }> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      const startRow = await this.findNextEmptyRow();
      console.log(`📝 إدراج طلب التسعير من الصف ${startRow}`);

      // تحضير البيانات للإدراج
      const rows = [];
      const createdItemIds: string[] = [];
      
      for (let i = 0; i < quotation.items.length; i++) {
        const item = quotation.items[i];
        const itemId = await this.findOrCreateItemId(item.description, item.partNumber);
        createdItemIds.push(itemId); // حفظ معرف البند الحقيقي
        
        const row = [
          itemId,                                    // A - Item Number
          item.uom || 'EACH',                       // B - UOM
          item.lineItem || '',                      // C - LINE ITEM (يملؤه المستخدم)
          item.partNumber || '',                    // D - PART NO
          item.description,                         // E - DESCRIPTION
          quotation.rfqNumber,                      // F - RFQ NUMBER
          quotation.requestDate,                    // G - REQUEST DATE
          item.quantity.toString(),                 // H - QUANTITY
          '',                                       // I - فارغ
          quotation.expiryDate || '',               // J - EXPIRY DATE (تاريخ انتهاء العرض)
          '', '',                                   // K, L - فارغة
          '', '', '',                               // M, N, O - فارغة
          quotation.clientName,                     // P - CLIENT NAME
          quotation.responsibleEmployee || '',      // Q - RESPONSIBLE EMPLOYEE
          ''                                        // R - فارغ
        ];
        rows.push(row);
      }

      // إدراج البيانات - توسيع النطاق ليشمل العمود R
      const range = `DATA!A${startRow}:R${startRow + rows.length - 1}`;
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });

      console.log(`✅ تم إدراج ${rows.length} بند في Google Sheets`);
      console.log(`📊 طلب التسعير: ${quotation.rfqNumber} | العميل: ${quotation.clientName}`);
      console.log(`🆔 معرفات البنود المنشأة: ${createdItemIds.join(', ')}`);
      
      // إرسال البنود تلقائياً إلى صفحات التسعير
      const enrichedItems = quotation.items.map((item, index) => ({
        item: {
          itemNumber: createdItemIds[index],
          partNumber: item.partNumber,
          description: item.description,
          unit: item.uom || 'EACH'
        },
        quantity: item.quantity,
        quotation: quotation
      }));
      
      console.log(`📋 إرسال ${enrichedItems.length} بند إلى صفحات التسعير...`);
      await this.sendItemsToSupplierPricing(enrichedItems, quotation, createdItemIds);
      await this.sendItemsToCustomerPricing(enrichedItems, quotation, createdItemIds);
      console.log(`✅ تم إرسال البنود إلى كلا صفحتي التسعير بنجاح`);
      
      return { success: true, itemIds: createdItemIds };
    } catch (error) {
      console.error('❌ خطأ في إدراج طلب التسعير:', (error as Error).message);
      return { success: false, itemIds: [] };
    }
  }

  /**
   * إرسال البنود إلى صفحة تسعير الموردين
   */
  async sendItemsToSupplierPricing(quotationItems: any[], quotation?: NewQuotation, createdItemIds: string[] = []): Promise<void> {
    try {
      console.log(`📤 إرسال ${quotationItems.length} بند إلى صفحة تسعير الموردين...`);

      // البحث عن صفحة تسعير الموردين أو إنشاؤها
      const supplierSheetName = 'تسعير_الموردين';
      const supplierHeaders = [
        'Item Number', 'Part Number', 'Description', 'UOM', 'Quantity',
        'RFQ Number', 'Client Name', 'Request Date', 'Expiry Date',
        'Supplier Name', 'Contact Person', 'Phone', 'Email', 'Address',
        'Unit Price', 'Total Price', 'Currency', 
        'VAT Included', 'VAT Rate', 'Price Before VAT', 'VAT Amount',
        'Delivery Time', 'Payment Terms', 'Warranty Period', 'Notes', 'Status'
      ];
      
      await this.createPricingSheetIfNotExists(supplierSheetName, supplierHeaders);
      
      // إنشاء البيانات للإدراج
      const rows = [];
      
      for (const quotationItem of quotationItems) {
        // جلب معلومات البند والطلب
        const itemInfo = quotationItem.item || {};
        const quotationInfo = quotationItem.quotation || quotation || {};
        
        const row = [
          itemInfo.itemNumber || itemInfo.id || createdItemIds[0] || '',           // A - Item Number
          itemInfo.partNumber || '',                          // B - Part Number
          itemInfo.description || '',                         // C - Description
          itemInfo.unit || 'EACH',                           // D - UOM
          quotationItem.quantity?.toString() || '1',         // E - Quantity
          quotationInfo.rfqNumber || '',                     // F - RFQ Number
          quotationInfo.clientName || '',                    // G - Client Name
          quotationInfo.requestDate || '',                   // H - Request Date
          quotationInfo.expiryDate || '',                    // I - Expiry Date
          // بيانات المورد المحسنة
          '',                                                // J - Supplier Name (فارغ للتعبئة)
          '',                                                // K - Contact Person (فارغ للتعبئة)
          '',                                                // L - Phone (فارغ للتعبئة)
          '',                                                // M - Email (فارغ للتعبئة)
          '',                                                // N - Address (فارغ للتعبئة)
          // بيانات التسعير
          '',                                                // O - Unit Price (فارغ للتعبئة)
          '',                                                // P - Total Price (فارغ للحساب التلقائي)
          '',                                                // Q - Currency (فارغ للتعبئة)
          // معلومات ضريبة القيمة المضافة
          'لا',                                              // R - VAT Included (افتراضي: لا)
          '14%',                                             // S - VAT Rate (افتراضي: 14%)
          '',                                                // T - Price Before VAT (فارغ للحساب)
          '',                                                // U - VAT Amount (فارغ للحساب)
          // تفاصيل إضافية
          '',                                                // V - Delivery Time (فارغ للتعبئة)
          '',                                                // W - Payment Terms (فارغ للتعبئة)
          '',                                                // X - Warranty Period (فارغ للتعبئة)
          '',                                                // Y - Notes (فارغ للتعبئة)
          'جديد'                                             // Z - Status (جديد/معتمد/مرفوض)
        ];
        rows.push(row);
      }

      // البحث عن آخر صف فارغ في صفحة تسعير الموردين
      const supplierLastRow = await this.findLastRowInSheet(supplierSheetName);
      const supplierRange = `${supplierSheetName}!A${supplierLastRow + 1}:Z${supplierLastRow + rows.length}`;

      // إدراج البيانات
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: supplierRange,
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });

      console.log(`✅ تم إرسال ${rows.length} بند إلى صفحة تسعير الموردين`);
    } catch (error) {
      console.error('❌ خطأ في إرسال البنود إلى تسعير الموردين:', error);
    }
  }

  /**
   * إرسال البنود إلى صفحة تسعير العملاء
   */
  async sendItemsToCustomerPricing(quotationItems: any[], quotation?: NewQuotation, createdItemIds: string[] = []): Promise<void> {
    try {
      console.log(`📤 إرسال ${quotationItems.length} بند إلى صفحة تسعير العملاء...`);

      // البحث عن صفحة تسعير العملاء أو إنشاؤها
      const customerSheetName = 'تسعير_العملاء';
      const customerHeaders = [
        'Item Number', 'Part Number', 'Description', 'UOM', 'Quantity',
        'RFQ Number', 'Client Name', 'Request Date', 'Expiry Date',
        'Customer Unit Price', 'Customer Total Price', 'Supplier Unit Price',
        'Profit Margin %', 'Currency', 'Notes', 'Status', 'Employee Name'
      ];
      
      await this.createPricingSheetIfNotExists(customerSheetName, customerHeaders);
      
      // إنشاء البيانات للإدراج
      const rows = [];
      
      for (const quotationItem of quotationItems) {
        // جلب معلومات البند والطلب
        const itemInfo = quotationItem.item || {};
        const quotationInfo = quotationItem.quotation || quotation || {};
        
        const row = [
          itemInfo.itemNumber || itemInfo.id || createdItemIds[0] || '',           // A - Item Number
          itemInfo.partNumber || '',                          // B - Part Number
          itemInfo.description || '',                         // C - Description
          itemInfo.unit || 'EACH',                           // D - UOM
          quotationItem.quantity?.toString() || '1',         // E - Quantity
          quotationInfo.rfqNumber || '',                     // F - RFQ Number
          quotationInfo.clientName || '',                    // G - Client Name
          quotationInfo.requestDate || '',                   // H - Request Date
          quotationInfo.expiryDate || '',                    // I - Expiry Date
          '',                                                // J - Customer Unit Price (فارغ للتعبئة)
          '',                                                // K - Customer Total Price (فارغ للحساب التلقائي)
          '',                                                // L - Supplier Unit Price (مرجع من تسعير الموردين)
          '',                                                // M - Profit Margin % (فارغ للتعبئة)
          '',                                                // N - Currency (فارغ للتعبئة)
          '',                                                // O - Notes (فارغ للتعبئة)
          'في انتظار تسعير الموردين',                       // P - Status
          ''                                                 // Q - Employee Name (فارغ للتعبئة عند التسعير)
        ];
        rows.push(row);
      }

      // البحث عن آخر صف فارغ في صفحة تسعير العملاء
      const customerLastRow = await this.findLastRowInSheet(customerSheetName);
      const customerRange = `${customerSheetName}!A${customerLastRow + 1}:Q${customerLastRow + rows.length}`;

      // إدراج البيانات
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: customerRange,
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });

      console.log(`✅ تم إرسال ${rows.length} بند إلى صفحة تسعير العملاء`);
    } catch (error) {
      console.error('❌ خطأ في إرسال البنود إلى تسعير العملاء:', error);
    }
  }

  /**
   * العثور على آخر صف في صفحة محددة
   */
  private async findLastRowInSheet(sheetName: string): Promise<number> {
    try {
      // التأكد من تهيئة sheets
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`
      });

      const values = response.data.values || [];
      
      // العثور على آخر صف غير فارغ
      let lastRow = 1; // البداية من الصف 2 (إذا كان الصف 1 يحتوي على العناوين)
      
      for (let i = 0; i < values.length; i++) {
        if (values[i] && values[i][0] && values[i][0].trim()) {
          lastRow = i + 1;
        }
      }

      return lastRow;
    } catch (error) {
      console.error(`❌ خطأ في العثور على آخر صف في ${sheetName}:`, error);
      return 1; // إرجاع الصف الثاني إذا فشل
    }
  }

  /**
   * إنشاء صفحة تسعير جديدة إذا لم تكن موجودة
   */
  private async createPricingSheetIfNotExists(sheetName: string, headers: string[]): Promise<void> {
    try {
      // التأكد من تهيئة sheets
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      // التحقق من وجود الصفحة
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheetExists = spreadsheet.data.sheets.some((sheet: any) => 
        sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        console.log(`📄 إنشاء صفحة جديدة: ${sheetName}`);
        
        // إنشاء الصفحة
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          }
        });

        // إضافة العناوين
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
          valueInputOption: 'RAW',
          resource: {
            values: [headers]
          }
        });

        console.log(`✅ تم إنشاء صفحة ${sheetName} مع العناوين`);
      } else {
        console.log(`📋 الصفحة ${sheetName} موجودة بالفعل`);
      }
    } catch (error) {
      console.error(`❌ خطأ في إنشاء صفحة ${sheetName}:`, error);
      throw error; // إعادة رمي الخطأ للتعامل معه في المستوى الأعلى
    }
  }

  /**
   * مسح جميع البنود من صفحات التسعير
   */
  async clearAllPricingSheets(): Promise<void> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      console.log('🗑️ بدء مسح البنود من صفحات التسعير...');

      // مسح صفحة تسعير الموردين
      await this.clearSupplierPricing();
      
      // مسح صفحة تسعير العملاء  
      await this.clearCustomerPricing();

      console.log('✅ تم مسح جميع البنود من صفحات التسعير بنجاح');
    } catch (error) {
      console.error('❌ خطأ في مسح صفحات التسعير:', (error as Error).message);
      throw error;
    }
  }

  /**
   * مسح البنود من صفحة تسعير الموردين
   */
  private async clearSupplierPricing(): Promise<void> {
    try {
      const sheetName = 'تسعير_الموردين';
      
      // قراءة البيانات الحالية لمعرفة عدد الصفوف
      const readResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Z1000`
      });

      const existingRows = readResponse.data.values || [];
      if (existingRows.length === 0) {
        console.log('📋 صفحة تسعير الموردين فارغة بالفعل');
        return;
      }

      // مسح البيانات من الصف 2 إلى آخر صف
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Z${existingRows.length + 1}`
      });

      console.log(`🗑️ تم مسح ${existingRows.length} صف من صفحة تسعير الموردين`);
    } catch (error) {
      console.error('❌ خطأ في مسح صفحة تسعير الموردين:', (error as Error).message);
      throw error;
    }
  }

  /**
   * مسح البنود من صفحة تسعير العملاء
   */
  private async clearCustomerPricing(): Promise<void> {
    try {
      const sheetName = 'تسعير_العملاء';
      
      // قراءة البيانات الحالية لمعرفة عدد الصفوف
      const readResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Q1000`
      });

      const existingRows = readResponse.data.values || [];
      if (existingRows.length === 0) {
        console.log('📋 صفحة تسعير العملاء فارغة بالفعل');
        return;
      }

      // مسح البيانات من الصف 2 إلى آخر صف
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Q${existingRows.length + 1}`
      });

      console.log(`🗑️ تم مسح ${existingRows.length} صف من صفحة تسعير العملاء`);
    } catch (error) {
      console.error('❌ خطأ في مسح صفحة تسعير العملاء:', (error as Error).message);
      throw error;
    }
  }

  /**
   * إعداد رؤوس ورقة تسعير الموردين مع جميع الحقول الجديدة
   */
  async setupSupplierPricingSheetHeaders(): Promise<void> {
    try {
      const sheetName = 'تسعير_الموردين';
      const headers = [
        'رقم البند',              // A - Item Number
        'PART NO',              // B - Part Number  
        'الوصف',                 // C - Description
        'UOM',                  // D - Unit of Measure
        'الكمية',                // E - Quantity
        'رقم RFQ',              // F - RFQ Number
        'اسم العميل',            // G - Client Name
        'تاريخ الطلب',           // H - Request Date
        'تاريخ الانتهاء',        // I - Expiry Date
        'اسم المورد',            // J - Supplier Name
        'الشخص المسؤول',         // K - Contact Person
        'الهاتف',               // L - Phone
        'البريد الإلكتروني',     // M - Email
        'العنوان',              // N - Address
        'سعر الوحدة',           // O - Unit Price
        'السعر الإجمالي',        // P - Total Price
        'العملة',               // Q - Currency
        'يشمل ضريبة القيمة المضافة', // R - VAT Included
        'معدل ضريبة القيمة المضافة', // S - VAT Rate
        'السعر قبل الضريبة',     // T - Price Before VAT
        'مبلغ الضريبة',          // U - VAT Amount
        'مدة التسليم',          // V - Delivery Time
        'شروط الدفع',           // W - Payment Terms
        'فترة الضمان',          // X - Warranty Period
        'ملاحظات',              // Y - Notes
        'الحالة',               // Z - Status
        'اسم الموظف'            // AA - Employee Name
      ];

      // التحقق من وجود الورقة وإنشاؤها إذا لم تكن موجودة
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const existingSheet = sheetsResponse.data.sheets?.find(
        (sheet: any) => sheet.properties?.title === sheetName
      );

      if (!existingSheet) {
        // إنشاء الورقة الجديدة
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 26
                  }
                }
              }
            }]
          }
        });
        console.log(`✅ تم إنشاء ورقة ${sheetName} الجديدة`);
      }

      // تحديث خصائص الورقة لتشمل العمود الجديد
      if (existingSheet) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              updateSheetProperties: {
                properties: {
                  sheetId: existingSheet.properties?.sheetId,
                  gridProperties: {
                    columnCount: 27 // A إلى AA (27 عمود)
                  }
                },
                fields: 'gridProperties.columnCount'
              }
            }]
          }
        });
      }

      // إضافة الرؤوس
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:AA1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });

      console.log(`✅ تم تحديث رؤوس ورقة ${sheetName} بنجاح مع جميع الحقول الجديدة`);
    } catch (error) {
      console.error('❌ خطأ في إعداد رؤوس ورقة تسعير الموردين:', error);
      throw error;
    }
  }

  /**
   * تحديث صف تسعير المورد مع البيانات المحسنة
   * @param itemId - معرف البند
   * @param rfqNumber - رقم طلب التسعير للمطابقة
   * @param quantity - الكمية للمطابقة
   * @param pricingData - بيانات التسعير
   */
  async updateSupplierPricingRow(itemId: string, rfqNumber: string, quantity: string, pricingData: any): Promise<void> {
    try {
      if (!this.sheets) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('فشل في تهيئة Google Sheets');
        }
      }

      const sheetName = 'تسعير_الموردين';
      console.log(`🔄 تحديث بيانات تسعير المورد للبند: ${itemId}`);

      // البحث عن الصف الخاص بهذا البند
      const readResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Z1000`
      });

      const rows = readResponse.data.values || [];
      let targetRowIndex = -1;

      // البحث عن الصف الذي يحتوي على معرف البند ورقم الطلب والكمية المطابقة
      console.log(`🔍 البحث عن البند ${itemId} مع RFQ: ${rfqNumber} والكمية: ${quantity}`);
      
      for (let i = 0; i < rows.length; i++) {
        // المطابقة بناءً على:
        // العمود A (index 0) - Item Number
        // العمود F (index 5) - RFQ Number
        // العمود E (index 4) - Quantity
        if (rows[i][0] === itemId && 
            rows[i][5] === rfqNumber && 
            rows[i][4] === quantity.toString()) {
          targetRowIndex = i + 2; // +2 لأن الصفوف تبدأ من 1 والرؤوس في الصف 1
          console.log(`✅ وجدت الصف المطابق في السطر ${targetRowIndex}`);
          break;
        }
      }
      
      // إذا لم نجد تطابق كامل، نبحث عن صف بنفس البند والـ RFQ فقط
      if (targetRowIndex === -1) {
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][0] === itemId && rows[i][5] === rfqNumber) {
            targetRowIndex = i + 2;
            console.log(`⚠️ وجدت صف مطابق جزئياً (البند و RFQ فقط) في السطر ${targetRowIndex}`);
            break;
          }
        }
      }
      
      // إذا لم نجد أي تطابق، نبحث عن أول صف للبند
      if (targetRowIndex === -1) {
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][0] === itemId) {
            targetRowIndex = i + 2;
            console.log(`⚠️ وجدت صف للبند فقط في السطر ${targetRowIndex}`);
            break;
          }
        }
      }

      if (targetRowIndex === -1) {
        // إنشاء البند إذا لم يكن موجوداً
        console.log(`📝 البند ${itemId} غير موجود، إنشاء صف جديد...`);
        
        // الحصول على معلومات البند من صفحة البيانات الرئيسية
        const itemResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `DATA!A2:R1000`
        });
        
        const dataRows = itemResponse.data.values || [];
        let itemInfo = null;
        
        // البحث عن البند في صفحة البيانات الرئيسية
        for (const row of dataRows) {
          if (row[0] === itemId) { // العمود A يحتوي على Item Number
            itemInfo = row;
            break;
          }
        }
        
        if (!itemInfo) {
          console.error(`❌ لم يتم العثور على البند ${itemId} في صفحة البيانات الرئيسية`);
          throw new Error(`Item ${itemId} not found in main data sheet`);
        }
        
        // إنشاء صف جديد في صفحة تسعير الموردين
        const newRowNumber = rows.length + 2; // +2 للترقيم من الصف 1 ووجود الرؤوس
        const newRow = [
          itemId,                              // A - Item Number
          itemInfo[3] || '',                   // B - Part Number (من العمود D في DATA)
          itemInfo[4] || '',                   // C - Description (من العمود E في DATA)
          itemInfo[1] || 'EACH',               // D - UOM (من العمود B في DATA)
          quantity || itemInfo[7] || '1',      // E - Quantity (استخدام الكمية المرسلة أو من العمود H في DATA)
          rfqNumber || itemInfo[5] || '',      // F - RFQ Number (استخدام RFQ المرسل أو من العمود F في DATA)
          itemInfo[16] || '',                  // G - Client Name (من العمود Q في DATA)
          itemInfo[6] || '',                   // H - Request Date (من العمود G في DATA)
          itemInfo[9] || '',                   // I - Expiry Date (من العمود J في DATA)
          pricingData.supplierName || '',      // J - Supplier Name
          pricingData.supplierContact || '',   // K - Contact Person
          pricingData.supplierPhone || '',     // L - Phone
          pricingData.supplierEmail || '',     // M - Email
          pricingData.supplierAddress || '',   // N - Address
          pricingData.unitPrice || '',         // O - Unit Price
          pricingData.totalPrice || '',        // P - Total Price
          pricingData.currency || 'EGP',       // Q - Currency
          pricingData.vatIncluded || 'لا',     // R - VAT Included
          pricingData.vatRate || '14%',        // S - VAT Rate
          pricingData.priceBeforeVat || '',    // T - Price Before VAT
          pricingData.vatAmount || '',         // U - VAT Amount
          pricingData.deliveryTime || '',      // V - Delivery Time
          pricingData.paymentTerms || '',      // W - Payment Terms
          pricingData.warrantyPeriod || '',    // X - Warranty Period
          pricingData.notes || '',             // Y - Notes
          pricingData.status || 'مُسعّر',      // Z - Status
          pricingData.employeeName || ''       // AA - Employee Name
        ];

        // إضافة الصف الجديد
        const range = `${sheetName}!A${newRowNumber}:AA${newRowNumber}`;
        const createResponse = await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [newRow]
          }
        });

        console.log(`✅ تم إنشاء صف جديد للبند ${itemId} في الصف ${newRowNumber}`);
        console.log(`📊 نتيجة الإنشاء:`, createResponse.data);
        return;
      }

      // تحديث الصف بالبيانات الجديدة
      // التطابق مع ترتيب الأعمدة في sendItemsToSupplierPricing
      const updatedRow = [
        itemId,                                    // A - Item Number
        rows[targetRowIndex - 2][1] || '',         // B - Part Number (keep existing)
        rows[targetRowIndex - 2][2] || '',         // C - Description (keep existing)
        rows[targetRowIndex - 2][3] || 'EACH',     // D - UOM (keep existing)
        rows[targetRowIndex - 2][4] || '1',        // E - Quantity (keep existing)
        rows[targetRowIndex - 2][5] || '',         // F - RFQ Number (keep existing)
        rows[targetRowIndex - 2][6] || '',         // G - Client Name (keep existing)
        rows[targetRowIndex - 2][7] || '',         // H - Request Date (keep existing)
        rows[targetRowIndex - 2][8] || '',         // I - Expiry Date (keep existing)
        pricingData.supplierName || '',            // J - Supplier Name
        pricingData.supplierContact || '',         // K - Contact Person
        pricingData.supplierPhone || '',           // L - Phone
        pricingData.supplierEmail || '',           // M - Email
        pricingData.supplierAddress || '',         // N - Address
        pricingData.unitPrice || '',               // O - Unit Price
        pricingData.totalPrice || '',              // P - Total Price
        pricingData.currency || 'EGP',             // Q - Currency
        pricingData.vatIncluded || 'لا',           // R - VAT Included
        pricingData.vatRate || '14%',              // S - VAT Rate
        pricingData.priceBeforeVat || '',          // T - Price Before VAT
        pricingData.vatAmount || '',               // U - VAT Amount
        pricingData.deliveryTime || '',            // V - Delivery Time
        pricingData.paymentTerms || '',            // W - Payment Terms
        pricingData.warrantyPeriod || '',          // X - Warranty Period
        pricingData.notes || '',                   // Y - Notes
        pricingData.status || 'مُسعّر',            // Z - Status
        pricingData.employeeName || ''             // AA - Employee Name
      ];

      // تحديث الصف في Google Sheets
      const range = `${sheetName}!A${targetRowIndex}:AA${targetRowIndex}`;
      const updateResponse = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [updatedRow]
        }
      });

      console.log(`✅ تم تحديث بيانات تسعير المورد للبند ${itemId} في الصف ${targetRowIndex}`);
      console.log(`📊 نتيجة التحديث:`, updateResponse.data);
    } catch (error) {
      console.error('❌ خطأ في تحديث تسعير المورد:', (error as Error).message);
      throw error;
    }
  }

  /**
   * حفظ بيانات أمر الشراء في Google Sheets
   * يحفظ رقم أمر الشراء في العمود K، التاريخ في L، الكمية في M، السعر في N
   */
  // ===== Helper methods for reliable Google Sheets API calls =====

    private async sheetsApiWithRetry<T>(fn: () => Promise<T>, opName = 'Sheets API'): Promise<T> {
      const maxRetries = 4;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          const status = error?.status || error?.code || error?.response?.status;
          const isTransient = status === 429 || status === 500 || status === 503 || status === 502
            || (error?.message && (error.message.includes('Quota exceeded') || error.message.includes('ECONNRESET') || error.message.includes('socket hang up') || error.message.includes('ETIMEDOUT')));
          if (isTransient && attempt < maxRetries) {
            const delay = attempt * 1500;
            console.warn(`⚠️ ${opName} خطأ مؤقت (status=${status}) - إعادة المحاولة بعد ${delay}ms (محاولة ${attempt}/${maxRetries})`);
            await new Promise(r => setTimeout(r, delay));
          } else {
            throw error;
          }
        }
      }
      throw new Error(`${opName}: تجاوز الحد الأقصى لعدد المحاولات`);
    }

    private async sheetsGetWithRetry(range: string) {
      return this.sheetsApiWithRetry(
        () => this.sheets.spreadsheets.values.get({ spreadsheetId: this.spreadsheetId, range }),
        `GET ${range}`
      );
    }

    private async sheetsBatchUpdateWithRetry(data: { range: string; values: any[][] }[]) {
      return this.sheetsApiWithRetry(
        () => this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data
          }
        }),
        'batchUpdate'
      );
    }

    private async sheetsAppendWithRetry(range: string, values: any[][]) {
      return this.sheetsApiWithRetry(
        () => this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values }
        }),
        `APPEND ${range}`
      );
    }

      async savePurchaseOrderToSheets(poData: {
      poNumber: string;
      poDate: string;
      items: Array<{
        itemNumber?: string;
        lineItem?: string;
        rfqNumber?: string;
        quantity: number;
        unitPrice: number;
      }>;
    }): Promise<void> {
      try {
        console.log(`📦 حفظ أمر الشراء ${poData.poNumber} مع ${poData.items.length} بند`);

        if (!this.sheets || !this.spreadsheetId) {
          const ok = await this.initialize();
          if (!ok) throw new Error('فشل في تهيئة Google Sheets');
        }

        const processedItems = poData.items.filter(item => item.lineItem || item.itemNumber);
        if (processedItems.length === 0) {
          console.warn('⚠️ لا توجد بنود صالحة للحفظ');
          return;
        }

        // قراءة ورقة DATA مرة واحدة فقط لجميع البنود
        console.log('📖 قراءة بيانات ورقة DATA...');
        const readResponse = await this.sheetsGetWithRetry('DATA!A:O');
        const sheetValues: any[][] = readResponse.data.values || [];
        console.log(`📊 عدد الصفوف: ${sheetValues.length}`);

        // تحديد الصف المستهدف لكل بند
        const batchData: { range: string; values: any[][] }[] = [];
        const appendRows: any[][] = [];

        for (const item of processedItems) {
          const searchValue = (item.lineItem || item.itemNumber || '').trim();
          const rfqNumber   = (item.rfqNumber || '').trim();
          const totalPrice  = item.quantity * item.unitPrice;
          const newCells    = [poData.poNumber, poData.poDate, String(item.quantity), String(item.unitPrice), String(totalPrice)];

          let bestRow = -1;     // صف يطابق البند + RFQ + بدون PO
          let fallbackRow = -1; // أي صف يطابق البند

          for (let i = 1; i < sheetValues.length; i++) {
            const row = sheetValues[i];
            if (!row) continue;
            const rowLineItem = (row[2] || '').toString().trim();
            if (rowLineItem !== searchValue) continue;

            const rowRFQ   = (row[5] || '').toString().trim();
            const rowPO    = (row[10] || '').toString().trim();
            const rfqMatch = !rfqNumber || !rowRFQ || rowRFQ === rfqNumber;

            if (rfqMatch && !rowPO && bestRow === -1) {
              bestRow = i + 1; // 1-based
            }
            if (rfqMatch && fallbackRow === -1) fallbackRow = i + 1;
            if (bestRow !== -1 && fallbackRow !== -1) break;
          }

          const targetRow = bestRow > 0 ? bestRow : fallbackRow;

          if (targetRow > 0) {
            console.log(`✅ تحديث الصف ${targetRow} للبند: ${searchValue}`);
            batchData.push({ range: `DATA!K${targetRow}:O${targetRow}`, values: [newCells] });
          } else {
            console.log(`➕ إضافة صف جديد للبند: ${searchValue}`);
            appendRows.push(['', '', searchValue, '', '', rfqNumber, '', '', '', '', ...newCells]);
          }
        }

        // تنفيذ كل التحديثات في طلب batchUpdate واحد
        if (batchData.length > 0) {
          console.log(`📝 إرسال batchUpdate لـ ${batchData.length} بند...`);
          await this.sheetsBatchUpdateWithRetry(batchData);
          console.log(`✅ batchUpdate نجح`);
        }

        // إضافة الصفوف الجديدة
        for (const row of appendRows) {
          await this.sheetsAppendWithRetry('DATA!A:O', [row]);
        }

        console.log(`✅ تم حفظ أمر الشراء ${poData.poNumber}: ${batchData.length} تحديث، ${appendRows.length} إضافة جديدة`);
      } catch (error) {
        console.error('❌ خطأ في حفظ أمر الشراء:', (error as Error).message);
        console.error('❌ Stack:', (error as Error).stack);
        throw error;
      }
    }

    private async insertNewRowAfter(afterRow: number, rowData: any[]): Promise<void> {
    try {
      // أولاً، احصل على معرف الورقة
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const dataSheet = spreadsheet.data.sheets.find((sheet: any) => 
        sheet.properties.title === 'DATA'
      );
      
      if (!dataSheet) {
        throw new Error('لم يتم العثور على ورقة DATA');
      }
      
      const sheetId = dataSheet.properties.sheetId;
      
      // إدراج صف فارغ جديد
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: afterRow, // إدراج بعد هذا الصف (0-based)
                endIndex: afterRow + 1
              }
            }
          }]
        }
      });
      
      console.log(`✅ تم إدراج صف فارغ بعد الصف ${afterRow}`);
      
      // إضافة البيانات في الصف الجديد
      const newRowNumber = afterRow + 1;
      
      // طباعة البيانات التي سيتم كتابتها
      console.log(`📝 البيانات التي سيتم كتابتها في الصف ${newRowNumber}:`);
      console.log(`   العمود C (LINE ITEM): ${rowData[2]}`);
      console.log(`   العمود E (التوصيف): ${rowData[4]}`);
      console.log(`   العمود H (الكمية RFQ): ${rowData[7]}`);
      console.log(`   العمود K (PO): ${rowData[10]}`);
      console.log(`   العمود M (PO QTY): ${rowData[12]}`);
      console.log(`   العمود N (PO PRICE): ${rowData[13]}`);
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `DATA!A${newRowNumber}:AA${newRowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      
      console.log(`✅ تم ملء البيانات في الصف الجديد ${newRowNumber}`);
    } catch (error) {
      console.error('❌ خطأ في إدراج صف جديد:', error);
      throw error;
    }
  }
}

export const googleSheetsWriter = new GoogleSheetsWriter();