import TelegramBot from 'node-telegram-bot-api';
import { realTimeDataManager } from './google-sheets-realtime-data';
import { telegramUsersSheetsManager } from './telegram-users-sheets-manager';

// Configuration
const TELEGRAM_BOT_TOKEN = '7864221250:AAHNT7210rnkhaUx95seHlk9yqoineAY6Lo';
let AUTHORIZED_USERS: string[] = [
  // Add your Telegram user ID here for testing (replace with actual ID)
  // Example: '123456789'
];

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

class QortobaAnalysisBotGoogleSheets {
  private bot: TelegramBot;
  constructor() {
    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    this.setupHandlers();
    this.loadInitialAuthorizedUsers();
  }

  private setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!this.isAuthorizedUser(userId)) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت\nيجب أن تكون مدير تقنية معلومات مخول');
        return;
      }
      
      this.bot.sendMessage(chatId, `
🏢 مرحباً بك في بوت تحليل البنود - قرطبة للتوريدات
📊 نظام Google Sheets المحدث

📋 الأوامر المتاحة:
/latest - آخر 5 طلبات تسعير
/analyze [PART_NO] - تحليل بند معين
/stats - إحصائيات النظام
/help - المساعدة

💡 سيتم إرسال تحليل تلقائي لكل بند جديد
      `);
    });

    // Latest quotations command
    this.bot.onText(/\/latest/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!this.isAuthorizedUser(userId)) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت');
        return;
      }
      
      await this.sendLatestQuotations(chatId);
    });

    // Analyze specific part
    this.bot.onText(/\/analyze (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!this.isAuthorizedUser(userId)) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت');
        return;
      }
      
      const partNumber = match?.[1];
      if (partNumber) {
        await this.analyzePartNumber(chatId, partNumber);
      }
    });

    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!this.isAuthorizedUser(userId)) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت');
        return;
      }
      
      await this.sendSystemStats(chatId);
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      this.bot.sendMessage(chatId, `
🔧 مساعدة بوت تحليل البنود

📋 الأوامر:
• /start - بدء التشغيل
• /latest - آخر 5 طلبات تسعير
• /analyze [رقم القطعة] - تحليل بند معين
• /stats - إحصائيات النظام
• /help - هذه المساعدة

💡 ميزات البوت:
✅ تحليل تلقائي للبنود الجديدة
✅ تكامل مع Google Sheets
✅ تحليل بالذكاء الاصطناعي (DeepSeek)
✅ تقدير الأسعار
✅ بحث الصور والمواصفات

📞 للدعم: اتصل بإدارة تقنية المعلومات
      `);
    });
  }

  private async isAuthorizedUser(userId?: number): Promise<boolean> {
    if (!userId) return false;
    const userIdStr = userId.toString();
    
    // التحقق من القائمة المحلية أولاً
    if (AUTHORIZED_USERS.includes(userIdStr)) {
      return true;
    }
    
    // التحقق من Google Sheets
    try {
      const activeUsers = await telegramUsersSheetsManager.getActiveUsers();
      return activeUsers.includes(userIdStr);
    } catch (error) {
      console.error('❌ خطأ في التحقق من المستخدم في Google Sheets:', (error as Error).message);
      return false;
    }
  }

  private async loadInitialAuthorizedUsers() {
    // Add default authorized users (can be expanded)
    // These could be loaded from environment variables or a config file
    console.log('📱 [TELEGRAM BOT] Loading authorized users...');
    console.log('📱 [TELEGRAM BOT] Current authorized users:', AUTHORIZED_USERS.length);
  }

  async sendLatestQuotations(chatId: number) {
    try {
      const data = await realTimeDataManager.getAllData();
      
      // Get unique quotations from last 7 days
      const recentQuotations = new Map();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      for (const row: any of data.slice(-100)) { // Check last 100 rows
        if (row.rfqNumber && row.requestDate) {
          const requestDate = new Date(row.requestDate);
          if (requestDate >= cutoffDate && !recentQuotations.has(row.rfqNumber)) {
            recentQuotations.set(row.rfqNumber, {
              rfqNumber: row.rfqNumber,
              requestDate: row.requestDate,
              clientName: row.clientName || 'غير محدد'
            });
          }
        }
      }
      
      const quotationsList = Array.from(recentQuotations.values())
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
        .slice(0, 5);

      let message = '📋 آخر 5 طلبات تسعير (من Google Sheets):\n\n';
      
      for (const req of quotationsList) {
        message += `🔹 رقم الطلب: ${req.rfqNumber}\n`;
        message += `📅 التاريخ: ${req.requestDate}\n`;
        message += `👤 العميل: ${req.clientName}\n`;
        message += `\n`;
      }
      
      if (quotationsList.length === 0) {
        message += '❌ لا توجد طلبات تسعير حديثة';
      }
      
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error sending latest quotations:', error);
      this.bot.sendMessage(chatId, '❌ خطأ في جلب البيانات من Google Sheets');
    }
  }

  async sendSystemStats(chatId: number) {
    try {
      const data = await realTimeDataManager.getAllData();
      
      // Calculate stats
      const totalItems = data.length;
      const uniquePartNumbers = new Set(data.map(row => row.partNumber).filter(Boolean)).size;
      const uniqueRfqNumbers = new Set(data.map(row => row.rfqNumber).filter(Boolean)).size;
      const itemsWithPricing = data.filter(row => row.price && parseFloat(row.price) > 0).length;
      
      // Recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentItems = data.filter((row: any) => {
        if (!row.requestDate) return false;
        const itemDate = new Date(row.requestDate);
        return itemDate >= yesterday;
      }).length;

      const message = `
📊 إحصائيات نظام قرطبة للتوريدات

📦 إجمالي البنود: ${totalItems.toLocaleString()}
🔧 أرقام قطع فريدة: ${uniquePartNumbers.toLocaleString()}
📋 طلبات تسعير: ${uniqueRfqNumbers.toLocaleString()}
💰 بنود مسعرة: ${itemsWithPricing.toLocaleString()}

🕐 النشاط الحديث (24 ساعة):
📥 بنود جديدة: ${recentItems}

🔄 مصدر البيانات: Google Sheets
✅ حالة البوت: نشط
🤖 AI محلل: DeepSeek ${DEEPSEEK_API_KEY ? '✅' : '❌'}
      `;
      
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error sending system stats:', error);
      this.bot.sendMessage(chatId, '❌ خطأ في جلب الإحصائيات');
    }
  }

  async analyzePartNumber(chatId: number, partNumber: string) {
    try {
      const data = await realTimeDataManager.getAllData();
      const items = data.filter((row: any) => 
        row.partNumber && row.partNumber.toLowerCase().includes(partNumber.toLowerCase())
      );
      
      if (items.length === 0) {
        this.bot.sendMessage(chatId, `❌ لم يتم العثور على رقم القطعة: ${partNumber}`);
        return;
      }
      
      const item = items[0]; // Get first match
      
      // Send basic info first
      let message = `🔍 تحليل البند: ${item.partNumber}\n\n`;
      message += `📝 الوصف: ${item.description || 'غير محدد'}\n`;
      message += `📊 الكمية: ${item.quantity || 'غير محدد'}\n`;
      message += `📋 RFQ: ${item.rfqNumber || 'غير محدد'}\n`;
      message += `👤 العميل: ${item.clientName || 'غير محدد'}\n`;
      
      if (item.price) {
        message += `💰 السعر: ${item.price} ج.م\n`;
      }
      
      message += `\n🤖 جاري التحليل بالذكاء الاصطناعي...`;
      
      await this.bot.sendMessage(chatId, message);
      
      // AI Analysis
      if (DEEPSEEK_API_KEY && item.description) {
        try {
          const analysis = await this.analyzeWithDeepSeek(item);
          const aiMessage = `🤖 تحليل AI للبند: ${item.partNumber}\n\n${analysis}`;
          
          // Split long messages
          const chunks = this.splitMessage(aiMessage, 4000);
          for (const chunk of chunks) {
            await this.bot.sendMessage(chatId, chunk);
          }
        } catch (aiError) {
          console.error('AI analysis failed:', aiError);
          this.bot.sendMessage(chatId, '⚠️ فشل التحليل بالذكاء الاصطناعي، لكن البيانات الأساسية متوفرة أعلاه');
        }
      }
      
    } catch (error) {
      console.error('Error analyzing part number:', error);
      this.bot.sendMessage(chatId, '❌ خطأ في تحليل رقم القطعة');
    }
  }

  private async analyzeWithDeepSeek(item: any): Promise<string> {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured');
    }
    
    const prompt = `
تحليل فني مفصل للبند التالي من نظام إدارة التوريدات:

رقم القطعة: ${item.partNumber}
الوصف: ${item.description}
الكمية المطلوبة: ${item.quantity}

يرجى تقديم تحليل شامل يتضمن:
1. نوع المنتج وفئته
2. الاستخدام المتوقع والتطبيقات
3. المواصفات الفنية المحتملة
4. الشركة المصنعة المحتملة
5. متوسط الأسعار في السوق المصري
6. البدائل المتاحة
7. نصائح للشراء والتخزين
8. مستوى الأولوية للشراء

يرجى الإجابة بالعربية بشكل مفصل ومفيد للفريق التجاري.
    `;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private splitMessage(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '\n' : '') + line;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = line;
      }
    }
    
    if (currentChunk) chunks.push(currentChunk);
    
    return chunks;
  }

  // Method to send automatic analysis for new quotation items
  async sendNewQuotationAnalysis(quotationData: any) {
    try {
      if (AUTHORIZED_USERS.length === 0) {
        console.log('📱 [TELEGRAM BOT] No authorized users configured');
        return;
      }

      for (const item of quotationData.items) {
        const message = await this.formatNewQuotationMessage(quotationData, item);
        
        // Send to all authorized users
        for (const userId of AUTHORIZED_USERS) {
          try {
            await this.bot.sendMessage(userId, message);
            console.log(`📱 [TELEGRAM BOT] Sent analysis to user ${userId} for quotation: ${quotationData.rfqNumber}`);
            
            // AI Analysis if configured
            if (DEEPSEEK_API_KEY && item.description) {
              try {
                const analysis = await this.analyzeWithDeepSeek(item);
                const aiMessage = `🤖 تحليل AI تلقائي:\n\n${analysis}`;
                
                const chunks = this.splitMessage(aiMessage, 4000);
                for (const chunk of chunks) {
                  await this.bot.sendMessage(userId, chunk);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
                }
              } catch (aiError) {
                console.error('AI analysis failed for new item:', aiError);
              }
            }
          } catch (error) {
            console.error(`Error sending to user ${userId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending new quotation analysis:', error);
    }
  }

  private async formatNewQuotationMessage(quotation: any, item: any): Promise<string> {
    return `
🆕 طلب تسعير جديد - نظام قرطبة للتوريدات

📋 رقم الطلب: ${quotation.rfqNumber}
👤 العميل: ${quotation.clientName}
📅 التاريخ: ${quotation.requestDate}
👨‍💼 المسؤول: ${quotation.responsibleEmployee || 'غير محدد'}

📦 تفاصيل البند:
🔧 رقم القطعة: ${item.partNumber || 'غير محدد'}
📝 الوصف: ${item.description}
📊 الكمية: ${item.quantity}
📏 الوحدة: ${item.uom || 'EACH'}
${item.lineItem ? `📋 رقم السطر: ${item.lineItem}` : ''}

⏰ انتهاء العرض: ${quotation.expiryDate || 'غير محدد'}

🤖 سيتم إرسال تحليل AI تفصيلي خلال لحظات...
    `;
  }

  // Add external user by Telegram ID
  addExternalUser(telegramUserId: string) {
    try {
      if (AUTHORIZED_USERS.includes(telegramUserId)) {
        return { success: false, message: 'المستخدم موجود مسبقاً' };
      }
      
      AUTHORIZED_USERS.push(telegramUserId);
      console.log(`📱 [TELEGRAM BOT] Added external user: ${telegramUserId}`);
      return { success: true, message: 'تم إضافة المستخدم الخارجي بنجاح' };
    } catch (error) {
      console.error('Error adding external user:', error);
      return { success: false, message: 'حدث خطأ في إضافة المستخدم' };
    }
  }

  // Remove external user
  removeExternalUser(telegramUserId: string) {
    try {
      const index = AUTHORIZED_USERS.indexOf(telegramUserId);
      if (index > -1) {
        AUTHORIZED_USERS.splice(index, 1);
        console.log(`📱 [TELEGRAM BOT] Removed external user: ${telegramUserId}`);
        return { success: true, message: 'تم حذف المستخدم الخارجي بنجاح' };
      }
      return { success: false, message: 'المستخدم غير موجود' };
    } catch (error) {
      console.error('Error removing external user:', error);
      return { success: false, message: 'حدث خطأ في حذف المستخدم' };
    }
  }

  // Get current authorized users
  getAuthorizedUsers() {
    return {
      users: AUTHORIZED_USERS,
      count: AUTHORIZED_USERS.length
    };
  }
}

export const telegramBotGoogleSheets = new QortobaAnalysisBotGoogleSheets();
export default telegramBotGoogleSheets;