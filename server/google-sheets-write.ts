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
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
  }

  async initialize() {
    try {
      // محاولة تحميل المفتاح من متغير البيئة أو الملف
      let credentials;
      
      // استخدام الملف المحلي مباشرة لتجنب مشاكل تحليل JSON
      let useLocalFile = true;
      
      if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY && !useLocalFile) {
        try {
          const keyData = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY.trim();
          credentials = JSON.parse(keyData);
          console.log('🔑 تم تحميل مفاتيح Google Sheets من متغير البيئة');
        } catch (parseError) {
          console.error('❌ خطأ في تحليل مفتاح Google Sheets:', (parseError as Error).message);
          console.log('🔄 التبديل لاستخدام الملف المحلي...');
          useLocalFile = true;
        }
      }
      
      if (useLocalFile) {
        // محاولة تحميل من الملف
        try {
          const credentialsPath = path.resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
          const fileContent = fs.readFileSync(credentialsPath, 'utf8');
          credentials = JSON.parse(fileContent);
          
          // التحقق من وجود المفتاح الخاص
          if (!credentials.private_key || !credentials.client_email) {
            throw new Error('ملف المفاتيح غير مكتمل - المفتاح الخاص أو البريد الإلكتروني مفقود');
          }
          
          // التحقق من طول المفتاح الخاص
          if (credentials.private_key.length < 1000) {
            throw new Error(`المفتاح الخاص مقطوع أو غير مكتمل - الطول الحالي: ${credentials.private_key.length} حرف، المطلوب: أكثر من 1000 حرف`);
          }
          
          console.log('🔑 تم تحميل مفاتيح Google Sheets من الملف المحلي');
          console.log(`📧 البريد الإلكتروني: ${credentials.client_email}`);
          console.log(`🔐 طول المفتاح الخاص: ${credentials.private_key.length} حرف`);
        } catch (fileError) {
          console.error('❌ خطأ في تحميل ملف مفاتيح Google Sheets:', (fileError as Error).message);
          throw new Error('فشل في تحميل مفاتيح Google Sheets');
        }
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
   * مطابقة البند مع البنود الموجودة باستخدام AI
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
      
      // مطابقة بـ AI باستخدام DeepSeek
      const matchResult = await this.findSimilarItemWithAI(description, partNumber, existingItems);
      
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
   * استخدام DeepSeek AI لمطابقة البنود
   */
  private async findSimilarItemWithAI(description: string, partNumber: string | undefined, existingItems: any[]): Promise<{found: boolean, itemId: string}> {
    try {
      if (!process.env.DEEPSEEK_API_KEY) {
        console.log('⚠️ DeepSeek API Key غير متوفر، سيتم استخدام المطابقة النصية البسيطة');
        return await this.findSimilarItemSimple(description, partNumber, existingItems);
      }

      // إذا لم توجد بنود للمقارنة
      if (existingItems.length === 0) {
        console.log('📋 لا توجد بنود موجودة للمقارنة');
        return { found: false, itemId: '' };
      }

      // فلترة البنود الأكثر تشابهاً أولاً للمقارنة
      const filteredItems = this.getRelevantItemsForAI(description, partNumber, existingItems, 15);
      console.log(`🤖 مقارنة مع ${filteredItems.length} بند باستخدام DeepSeek AI (من أصل ${existingItems.length})`);
      
      // طباعة البنود المختارة للمقارنة
      console.log(`📋 البنود المختارة للمقارنة:`, filteredItems.slice(0, 5).map(item => `${item.id}: ${item.description} | Part: ${item.partNumber || 'N/A'}`));

      const prompt = `
قارن هذا البند الجديد مع البنود الموجودة:

البند الجديد:
- الوصف: ${description}
- رقم القطعة: ${partNumber || 'غير محدد'}

البنود الموجودة:
${filteredItems.map(item => `- ${item.id}: ${item.description} | Part: ${item.partNumber || 'غير محدد'}`).join('\n')}

هل يوجد بند مطابق أو مشابه جداً؟ إذا كان الجواب نعم، أعطني معرف البند فقط.
إذا كان الجواب لا، أجب بـ "لا يوجد".

الإجابة:`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.error(`❌ خطأ في API DeepSeek: ${response.status} - ${response.statusText}`);
        return await this.findSimilarItemSimple(description, partNumber, existingItems);
      }

      const data = await response.json();
      const aiResult = data.choices?.[0]?.message?.content?.trim();
      
      console.log(`🤖 DeepSeek Response:`, JSON.stringify(data.choices?.[0]?.message, null, 2));

      console.log(`🤖 نتيجة AI: ${aiResult}`);

      // تحليل نتيجة AI
      if (aiResult && aiResult !== 'لا يوجد' && aiResult.includes('P-')) {
        // استخراج معرف البند من النتيجة
        const match = aiResult.match(/P-\d{7}/);
        if (match) {
          const itemId = match[0];
          // التحقق من وجود المعرف في القائمة
          const foundItem = existingItems.find(item => item.id === itemId);
          if (foundItem) {
            console.log(`✅ AI وجد مطابقة: ${itemId} - ${foundItem.description}`);
            return { found: true, itemId };
          }
        }
      }

      console.log(`❌ AI لم يجد مطابقة مقبولة. نتيجة AI: "${aiResult}"`);
      return { found: false, itemId: '' };
    } catch (error) {
      console.error('❌ خطأ في مطابقة AI:', (error as Error).message);
      // العودة للمطابقة البسيطة
      return await this.findSimilarItemSimple(description, partNumber, existingItems);
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
   * فلترة البنود الأكثر تشابهاً للمقارنة مع AI
   */
  private getRelevantItemsForAI(description: string, partNumber: string | undefined, allItems: any[], maxItems: number = 15): any[] {
    console.log(`🎯 بحث ذكي عن المطابقات للبند: "${description}" | Part: "${partNumber}"`);
    console.log(`📊 إجمالي البنود المتاحة للبحث: ${allItems.length}`);
    const relevantItems: Array<{item: any, score: number}> = [];
    
    // تحويل النص للبحث
    const searchDesc = description.toLowerCase();
    const searchPart = partNumber?.toLowerCase() || '';
    
    for (const item of allItems) {
      let score = 0;
      
      // مطابقة رقم القطعة (أولوية عالية)
      if (searchPart && item.partNumber) {
        const itemPart = item.partNumber.toLowerCase();
        if (itemPart === searchPart) {
          score += 1000; // مطابقة كاملة
        } else if (itemPart.includes(searchPart) || searchPart.includes(itemPart)) {
          score += 500; // مطابقة جزئية
        }
      }
      
      // مطابقة الوصف
      if (item.description) {
        const itemDesc = item.description.toLowerCase();
        
        // البحث عن كلمات مشتركة
        const descWords = searchDesc.split(/\s+/).filter(w => w.length > 2);
        const itemWords = itemDesc.split(/\s+/).filter(w => w.length > 2);
        
        let commonWords = 0;
        for (const word of descWords) {
          if (itemWords.some(iw => iw.includes(word) || word.includes(iw))) {
            commonWords++;
            score += 10;
          }
        }
        
        // مكافأة إضافية للمطابقات الدقيقة للكلمات المهمة
        const importantWords = ['contactor', 'schneider', 'lc1d', 'switch', 'relay'];
        for (const word of importantWords) {
          if (searchDesc.includes(word) && itemDesc.includes(word)) {
            score += 50;
          }
        }
      }
      
      if (score > 0) {
        relevantItems.push({ item, score });
      }
    }
    
    // ترتيب حسب النقاط وإرجاع أفضل العناصر
    return relevantItems
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(ri => ri.item);
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
          '', '', '', '',                           // M, N, O, P - فارغة
          quotation.clientName,                     // Q - CLIENT NAME
          quotation.responsibleEmployee || ''       // R - RESPONSIBLE EMPLOYEE
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
        'Supplier Name', 'Unit Price', 'Total Price', 'Currency',
        'Delivery Time', 'Notes', 'Status'
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
          '',                                                // J - Supplier Name (فارغ للتعبئة)
          '',                                                // K - Unit Price (فارغ للتعبئة)
          '',                                                // L - Total Price (فارغ للحساب التلقائي)
          '',                                                // M - Currency (فارغ للتعبئة)
          '',                                                // N - Delivery Time (فارغ للتعبئة)
          '',                                                // O - Notes (فارغ للتعبئة)
          'جديد'                                             // P - Status (جديد/معتمد/مرفوض)
        ];
        rows.push(row);
      }

      // البحث عن آخر صف فارغ في صفحة تسعير الموردين
      const supplierLastRow = await this.findLastRowInSheet(supplierSheetName);
      const supplierRange = `${supplierSheetName}!A${supplierLastRow + 1}:P${supplierLastRow + rows.length}`;

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
        'Profit Margin %', 'Currency', 'Notes', 'Status'
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
          'في انتظار تسعير الموردين'                        // P - Status
        ];
        rows.push(row);
      }

      // البحث عن آخر صف فارغ في صفحة تسعير العملاء
      const customerLastRow = await this.findLastRowInSheet(customerSheetName);
      const customerRange = `${customerSheetName}!A${customerLastRow + 1}:P${customerLastRow + rows.length}`;

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
      }
    } catch (error) {
      console.error(`❌ خطأ في إنشاء صفحة ${sheetName}:`, error);
    }
  }


}