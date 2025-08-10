import TelegramBot from 'node-telegram-bot-api';
import { db } from './db';
import { items, quotationRequests, quotationItems, clients, users } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Configuration
const TELEGRAM_BOT_TOKEN = '7864221250:AAHNT7210rnkhaUx95seHlk9yqoineAY6Lo';
let AUTHORIZED_USERS: string[] = [
  // Will be loaded from database
];

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY; // Will be added to env

class QortobaAnalysisBot {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    this.setupHandlers();
  }

  private setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!(await this.isAuthorizedUser(userId))) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت\nيجب أن تكون مدير تقنية معلومات مخول');
        return;
      }
      
      this.bot.sendMessage(chatId, `
🏢 مرحباً بك في بوت تحليل البنود - قرطبة للتوريدات

📋 الأوامر المتاحة:
/latest - آخر 5 طلبات تسعير
/analyze [PART_NO] - تحليل بند معين
/pending - البنود المعلقة

💡 سيتم إرسال تحليل تلقائي لكل بند جديد
      `);
    });

    // Latest quotations command
    this.bot.onText(/\/latest/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!(await this.isAuthorizedUser(userId))) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت');
        return;
      }
      
      await this.sendLatestQuotations(chatId);
    });

    // Analyze specific part
    this.bot.onText(/\/analyze (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!(await this.isAuthorizedUser(userId))) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت');
        return;
      }
      
      const partNumber = match?.[1];
      if (partNumber) {
        await this.analyzePartNumber(chatId, partNumber);
      }
    });

    // Pending items command
    this.bot.onText(/\/pending/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!(await this.isAuthorizedUser(userId))) {
        this.bot.sendMessage(chatId, '🚫 غير مصرح لك باستخدام هذا البوت');
        return;
      }
      
      await this.sendPendingItems(chatId);
    });
  }

  private async isAuthorizedUser(userId?: number): Promise<boolean> {
    if (!userId) return false;
    
    // Load authorized users from database if empty
    if (AUTHORIZED_USERS.length === 0) {
      await this.loadAuthorizedUsers();
    }
    
    return AUTHORIZED_USERS.includes(userId.toString());
  }

  private async loadAuthorizedUsers() {
    try {
      const { users } = await import('../shared/schema');
      const authorizedUsers = await db
        .select({ telegramUserId: users.telegramUserId })
        .from(users)
        .where(eq(users.role, 'it_admin'));
      
      AUTHORIZED_USERS = authorizedUsers
        .filter(user => user.telegramUserId)
        .map(user => user.telegramUserId!);
      
      console.log('📱 [TELEGRAM BOT] Loaded authorized users:', AUTHORIZED_USERS.length);
    } catch (error) {
      console.error('Error loading authorized users:', error);
    }
  }

  async sendLatestQuotations(chatId: number) {
    try {
      const latestQuotations = await db
        .select({
          rfqNumber: quotationRequests.customRequestNumber,
          requestDate: quotationRequests.requestDate,
          clientName: clients.name
        })
        .from(quotationRequests)
        .leftJoin(clients, eq(quotationRequests.clientId, clients.id))
        .orderBy(quotationRequests.requestDate)
        .limit(5);

      let message = '📋 آخر 5 طلبات تسعير:\n\n';
      
      for (const req of latestQuotations) {
        message += `🔹 رقم الطلب: ${req.rfqNumber}\n`;
        message += `📅 التاريخ: ${new Date(req.requestDate).toLocaleDateString('ar-EG')}\n`;
        message += `👤 العميل: ${req.clientName || 'غير محدد'}\n`;
        message += `\n`;
      }
      
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error sending latest quotations:', error);
      this.bot.sendMessage(chatId, '❌ خطأ في جلب البيانات');
    }
  }

  async sendPendingItems(chatId: number) {
    try {
      const pendingItems = await db
        .select({
          partNumber: items.partNumber,
          description: items.description,
          rfqNumber: quotationRequests.customRequestNumber,
          requestDate: quotationRequests.requestDate
        })
        .from(items)
        .innerJoin(quotationItems, eq(items.id, quotationItems.itemId))
        .innerJoin(quotationRequests, eq(quotationItems.quotationId, quotationRequests.id))
        .where(eq(quotationRequests.status, 'pending'))
        .limit(10);

      let message = '⏳ البنود المعلقة (بحاجة لتسعير):\n\n';
      
      for (const item of pendingItems) {
        message += `🔧 رقم القطعة: ${item.partNumber}\n`;
        message += `📝 الوصف: ${item.description}\n`;
        message += `📋 RFQ: ${item.rfqNumber}\n`;
        message += `📅 ${new Date(item.requestDate).toLocaleDateString('ar-EG')}\n\n`;
      }
      
      this.bot.sendMessage(chatId, message || '✅ لا توجد بنود معلقة');
    } catch (error) {
      console.error('Error sending pending items:', error);
      this.bot.sendMessage(chatId, '❌ خطأ في جلب البنود المعلقة');
    }
  }

  async analyzePartNumber(chatId: number, partNumber: string) {
    try {
      this.bot.sendMessage(chatId, '🔍 جاري تحليل البند...');
      
      // Get item from database
      const itemData = await db
        .select()
        .from(items)
        .where(eq(items.partNumber, partNumber))
        .limit(1);

      if (!itemData.length) {
        this.bot.sendMessage(chatId, `❌ لم يتم العثور على البند: ${partNumber}`);
        return;
      }

      const item = itemData[0];
      
      // Analyze with DeepSeek AI
      const analysis = await this.analyzeWithDeepSeek(item);
      
      // Send analysis result
      await this.sendAnalysisResult(chatId, item, analysis);
      
    } catch (error) {
      console.error('Error analyzing part number:', error);
      this.bot.sendMessage(chatId, '❌ خطأ في تحليل البند');
    }
  }

  private async analyzeWithDeepSeek(item: any): Promise<string> {
    try {
      const prompt = `
تحليل شامل للبند التالي بالعربية:

رقم القطعة: ${item.partNumber}
الوصف: ${item.description}
الفئة: ${item.category}
الوحدة: ${item.unit}

المطلوب تحليل شامل يشمل:
1. الاسم السوقي والتجاري للمنتج
2. الوصف التقني التفصيلي
3. الاستخدامات والتطبيقات
4. الموردين الرئيسيين في مصر
5. متوسط الأسعار في السوق المصري
6. المواصفات الفنية
7. البدائل المتاحة
8. نصائح للشراء

يرجى الإجابة بالعربية بشكل مفصل ومفيد.
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
      
    } catch (error) {
      console.error('DeepSeek analysis error:', error);
      return 'خطأ في التحليل - تعذر الاتصال بخدمة الذكاء الاصطناعي';
    }
  }

  private async sendAnalysisResult(chatId: number, item: any, analysis: string) {
    // Split analysis into chunks if too long for Telegram
    const maxLength = 4000;
    
    let header = `🔧 تحليل شامل للبند\n\n`;
    header += `📋 رقم القطعة: ${item.partNumber}\n`;
    header += `📝 الوصف: ${item.description}\n`;
    header += `🏷️ الفئة: ${item.category}\n`;
    header += `📏 الوحدة: ${item.unit}\n\n`;
    header += `🤖 تحليل الذكاء الاصطناعي:\n`;
    header += `${'='.repeat(30)}\n\n`;

    const fullMessage = header + analysis;
    
    if (fullMessage.length <= maxLength) {
      this.bot.sendMessage(chatId, fullMessage);
    } else {
      // Send header first
      this.bot.sendMessage(chatId, header);
      
      // Split analysis into chunks
      const chunks = this.splitMessage(analysis, maxLength - 100);
      for (let i = 0; i < chunks.length; i++) {
        const chunkHeader = chunks.length > 1 ? `📄 الجزء ${i + 1}/${chunks.length}\n\n` : '';
        this.bot.sendMessage(chatId, chunkHeader + chunks[i]);
      }
    }
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

  // Method to send automatic analysis for new items
  async sendNewItemAnalysis(itemId: string) {
    try {
      // Load authorized users if empty
      if (AUTHORIZED_USERS.length === 0) {
        await this.loadAuthorizedUsers();
      }

      // Get item with quotation request details
      const itemData = await db
        .select({
          item: items,
          quotationRequest: quotationRequests,
          quotationItem: quotationItems,
          client: clients
        })
        .from(items)
        .leftJoin(quotationItems, eq(items.id, quotationItems.itemId))
        .leftJoin(quotationRequests, eq(quotationItems.quotationId, quotationRequests.id))
        .leftJoin(clients, eq(quotationRequests.clientId, clients.id))
        .where(eq(items.id, itemId))
        .limit(1);

      if (!itemData.length) return;

      const { item, quotationRequest, quotationItem, client } = itemData[0];
      
      // Skip if no part number
      if (!item.partNumber) {
        console.log('Skipping item analysis - no part number:', item.id);
        return;
      }

      let analysis = null;
      try {
        analysis = await this.analyzeWithDeepSeek(item);
      } catch (error) {
        console.error('DeepSeek analysis failed, sending basic notification:', error);
        analysis = null; // Will use fallback message
      }

      // Format message with quotation request details
      const message = await this.formatNewItemMessage(item, quotationRequest, quotationItem, client, analysis);
      
      // Send to all authorized users
      for (const userId of AUTHORIZED_USERS) {
        try {
          await this.bot.sendMessage(userId, message);
          console.log(`📱 [TELEGRAM BOT] Sent analysis to user ${userId} for item: ${item.partNumber}`);
        } catch (error) {
          console.error(`Failed to send to user ${userId}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Error sending new item analysis:', error);
    }
  }

  // Add method to get bot status
  async getBotStatus() {
    try {
      const botInfo = await this.bot.getMe();
      return {
        status: 'active',
        botName: botInfo.first_name,
        username: botInfo.username,
        authorized_users: AUTHORIZED_USERS.length,
        deepseek_configured: !!DEEPSEEK_API_KEY
      };
    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message,
        deepseek_configured: !!DEEPSEEK_API_KEY
      };
    }
  }

  // Add method to reload authorized users
  async reloadAuthorizedUsers() {
    AUTHORIZED_USERS = []; // Clear current list
    await this.loadAuthorizedUsers();
  }

  // Add external user by Telegram ID only
  async addExternalUser(telegramUserId: string) {
    try {
      // Check if already exists
      if (AUTHORIZED_USERS.includes(telegramUserId)) {
        return { success: false, message: 'المستخدم موجود مسبقاً' };
      }
      
      // Add to authorized users list
      AUTHORIZED_USERS.push(telegramUserId);
      
      console.log(`📱 [TELEGRAM BOT] Added external user: ${telegramUserId}`);
      return { success: true, message: 'تم إضافة المستخدم الخارجي بنجاح' };
    } catch (error) {
      console.error('Error adding external user:', error);
      return { success: false, message: 'حدث خطأ في إضافة المستخدم' };
    }
  }

  // Remove external user
  async removeExternalUser(telegramUserId: string) {
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

  // Get all authorized users (both internal and external)
  async getAllAuthorizedUsers() {
    // Get internal users with Telegram IDs
    const internalUsers = await db
      .select({
        telegramUserId: users.telegramUserId,
        fullName: users.fullName,
        role: users.role
      })
      .from(users)
      .where(sql`${users.telegramUserId} IS NOT NULL`);

    // External users (those in AUTHORIZED_USERS but not in database)
    const internalTelegramIds = internalUsers.map(u => u.telegramUserId);
    const externalUsers = AUTHORIZED_USERS
      .filter(id => !internalTelegramIds.includes(id))
      .map(id => ({
        telegramUserId: id,
        fullName: 'مستخدم خارجي',
        role: 'external',
        type: 'external'
      }));

    return {
      internal: internalUsers.map(u => ({...u, type: 'internal'})),
      external: externalUsers,
      all: [...internalUsers.map(u => ({...u, type: 'internal'})), ...externalUsers]
    };
  }

  private async formatNewItemMessage(
    item: any, 
    quotationRequest: any, 
    quotationItem: any, 
    client: any, 
    analysis: string | null
  ): Promise<string> {
    let message = `🔔 بند جديد تم إضافته للنظام!\n\n`;
    
    // Quotation Request Details
    if (quotationRequest) {
      message += `📋 بيانات طلب التسعير:\n`;
      message += `• رقم الطلب: ${quotationRequest.requestNumber}\n`;
      message += `• العميل: ${client?.name || quotationRequest.clientName || 'غير محدد'}\n`;
      message += `• تاريخ الطلب: ${quotationRequest.requestDate}\n`;
      message += `• تاريخ الانتهاء: ${quotationRequest.expiryDate || 'غير محدد'}\n`;
      message += `• الموظف المسؤول: ${quotationRequest.responsibleEmployee || 'غير محدد'}\n`;
      
      if (quotationRequest.customRequestNumber) {
        message += `• رقم طلب العميل: ${quotationRequest.customRequestNumber}\n`;
      }
      
      if (quotationRequest.notes) {
        message += `• ملاحظات: ${quotationRequest.notes}\n`;
      }
      message += `\n`;
    }
    
    // Item Details
    message += `🔧 تفاصيل البند:\n`;
    message += `• رقم القطعة: ${item.partNumber}\n`;
    message += `• رقم البند: ${item.itemNumber}\n`;
    message += `• الوصف: ${item.description}\n`;
    message += `• الوحدة: ${item.unit}\n`;
    
    if (item.lineItem) {
      message += `• LINE ITEM: ${item.lineItem}\n`;
    }
    
    if (quotationItem?.quantity) {
      message += `• الكمية المطلوبة: ${quotationItem.quantity}\n`;
    }
    
    if (item.category) {
      message += `• الفئة: ${item.category}\n`;
    }
    
    message += `\n${'='.repeat(30)}\n\n`;
    
    if (analysis) {
      message += `🤖 التحليل الذكي:\n\n${analysis}`;
    } else {
      message += `📝 ملاحظة: تعذر تحليل البند بالذكاء الاصطناعي حاليًا\n`;
      message += `💡 يمكنك طلب التحليل لاحقاً باستخدام الأمر: /analyze ${item.partNumber}`;
    }
    
    return message;
  }
}

// Export singleton instance
export const telegramBot = new QortobaAnalysisBot();
export default telegramBot;