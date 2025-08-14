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

      // مطابقة بـ AI باستخدام DeepSeek
      const matchResult = await this.findSimilarItemWithAI(description, partNumber, existingItems);
      
      if (matchResult.found) {
        console.log(`🔍 تم العثور على بند مطابق: ${matchResult.itemId}`);
        return matchResult.itemId;
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

      const prompt = `
قارن هذا البند الجديد مع البنود الموجودة:

البند الجديد:
- الوصف: ${description}
- رقم القطعة: ${partNumber || 'غير محدد'}

البنود الموجودة:
${existingItems.map(item => `- ${item.id}: ${item.description} | Part: ${item.partNumber}`).join('\n')}

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

      const data = await response.json();
      const aiResult = data.choices?.[0]?.message?.content?.trim();

      console.log(`🤖 نتيجة AI: ${aiResult}`);

      // تحليل نتيجة AI
      if (aiResult && aiResult !== 'لا يوجد' && aiResult.startsWith('P-')) {
        const itemId = aiResult.split(':')[0].trim();
        // التحقق من وجود المعرف في القائمة
        const foundItem = existingItems.find(item => item.id === itemId);
        if (foundItem) {
          return { found: true, itemId };
        }
      }

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
   * إدراج طلب تسعير جديد في Google Sheets
   */
  async insertNewQuotation(quotation: NewQuotation): Promise<boolean> {
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
      
      for (let i = 0; i < quotation.items.length; i++) {
        const item = quotation.items[i];
        const itemId = await this.findOrCreateItemId(item.description, item.partNumber);
        
        // تولید خودکار LINE ITEM اگر خالی باشد
        const lineItemValue = item.lineItem && item.lineItem.trim() 
          ? item.lineItem.trim() 
          : `${i + 1}`.padStart(4, '0'); // 0001, 0002, etc.
        
        const row = [
          itemId,                                    // A - Item Number
          item.uom || 'EACH',                       // B - UOM
          lineItemValue,                            // C - LINE ITEM (تولید خودکار)
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
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في إدراج طلب التسعير:', (error as Error).message);
      return false;
    }
  }
}