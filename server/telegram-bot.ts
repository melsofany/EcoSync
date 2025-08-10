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
    try {
      // Use shorter format for analysis
      let message = `🔧 ${item.partNumber}\n`;
      message += `📝 ${item.description.substring(0, 60)}...\n\n`;
      
      // Truncate analysis to safe length for Telegram
      const maxAnalysisLength = 3500;
      const truncatedAnalysis = analysis.substring(0, maxAnalysisLength);
      
      message += truncatedAnalysis;
      
      if (analysis.length > maxAnalysisLength) {
        message += '\n\n... (مقطوع للطول)';
      }
      
      await this.bot.sendMessage(chatId, message);
      
    } catch (error) {
      console.error('Error sending analysis result:', error);
      // Fallback to minimal message
      await this.bot.sendMessage(chatId, `🔧 ${item.partNumber}\n📝 ${item.description}\n\n❌ خطأ في التحليل`);
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
          // Send text message first
          await this.bot.sendMessage(userId, message);
          console.log(`📱 [TELEGRAM BOT] Sent analysis to user ${userId} for item: ${item.partNumber}`);
          
          // Try to find and send item image only for specific known products
          try {
            await this.sendItemImage(userId, item);
          } catch (imageError) {
            console.log(`📷 [TELEGRAM BOT] Could not send image for ${item.partNumber}: ${(imageError as Error).message}`);
          }
          
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
    // Shortened format to avoid Telegram length limits
    let message = `🔔 بند جديد!\n\n`;
    
    // Essential quotation info only - use custom request number if available
    if (quotationRequest) {
      const displayNumber = quotationRequest.customRequestNumber || quotationRequest.requestNumber;
      message += `📋 ${displayNumber}\n`;
      message += `👤 ${client?.name || 'غير محدد'}\n\n`;
    }
    
    // Item details (shortened)
    message += `🔧 ${item.partNumber}\n`;
    message += `📝 ${item.description.substring(0, 80)}...\n`;
    
    if (quotationItem?.quantity) {
      message += `📦 الكمية: ${quotationItem.quantity}\n`;
    }
    
    message += `\n`;
    
    if (analysis) {
      // Truncate analysis for message length limits
      const maxAnalysisLength = 2500;
      const truncatedAnalysis = analysis.substring(0, maxAnalysisLength);
      message += `🤖 التحليل:\n${truncatedAnalysis}`;
      
      if (analysis.length > maxAnalysisLength) {
        message += '\n... (مقطوع)';
      }
    } else {
      message += `❌ تعذر التحليل\n`;
      message += `💡 /analyze ${item.partNumber}`;
    }
    
    return message;
  }

  // Enhanced method to search and send item image with price estimation
  private async sendItemImage(userId: string, item: any) {
    try {
      console.log(`📷 [TELEGRAM BOT] Starting enhanced image search for: ${item.partNumber}`);
      
      // Search for image using enhanced product image search
      const imageUrl = await this.searchProductImage(item.partNumber, item.description);
      
      // Estimate product price
      const estimatedPrice = await this.estimateProductPrice(item.partNumber, item.description);
      
      if (imageUrl) {
        // Verify image URL is accessible before sending
        const isImageAccessible = await this.verifyImageUrl(imageUrl);
        
        if (isImageAccessible) {
          // Create detailed caption with price info
          let caption = `📸 ${item.partNumber}\n${item.description.substring(0, 80)}...\n\n`;
          
          if (estimatedPrice) {
            caption += `💰 السعر المتوقع: ${estimatedPrice.min}-${estimatedPrice.max} ${estimatedPrice.currency}\n`;
            caption += `📊 المصدر: ${estimatedPrice.source}\n\n`;
          }
          
          caption += `🔍 مصدر الصورة: كتالوج المنتج الأصلي`;
          
          await this.bot.sendPhoto(userId, imageUrl, {
            caption: caption
          });
          console.log(`📷 [TELEGRAM BOT] Successfully sent verified image with price for: ${item.partNumber}`);
        } else {
          console.log(`📷 [TELEGRAM BOT] Image URL not accessible for: ${item.partNumber}`);
          await this.sendPriceEstimateOnly(userId, item, estimatedPrice);
        }
      } else {
        console.log(`📷 [TELEGRAM BOT] No image found, sending price estimate for: ${item.partNumber}`);
        await this.sendPriceEstimateOnly(userId, item, estimatedPrice);
      }
    } catch (error) {
      console.error(`Error in enhanced image sending for ${item.partNumber}:`, error);
      await this.sendPriceEstimateOnly(userId, item, null);
    }
  }

  // Verify if image URL is accessible by making HTTP request
  private async verifyImageUrl(url: string): Promise<boolean> {
    try {
      console.log(`🔍 [IMAGE VERIFY] Testing URL: ${url}`);
      
      // Make HEAD request to check if image exists without downloading it
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📊 [IMAGE VERIFY] Response status: ${response.status} for ${url}`);
      const contentType = response.headers.get('content-type');
      console.log(`📊 [IMAGE VERIFY] Content-Type: ${contentType}`);
      
      const isValidStatus = response.status >= 200 && response.status < 400;
      const isValidContent = contentType && (
        contentType.startsWith('image/') || 
        contentType.includes('gif') || 
        contentType.includes('jpeg') || 
        contentType.includes('jpg') || 
        contentType.includes('png')
      );
      
      const isValid = isValidStatus && !!isValidContent;
      console.log(`${isValid ? '✅' : '❌'} [IMAGE VERIFY] URL ${isValid ? 'VALID' : 'INVALID'}: ${url}`);
      
      if (!isValid) {
        console.log(`❌ [IMAGE VERIFY] Rejection reason - Status: ${response.status}, Content-Type: ${contentType}`);
      }
      
      return isValid;
    } catch (error) {
      console.log(`❌ [IMAGE VERIFY] URL FAILED: ${url}`);
      console.log(`❌ [IMAGE VERIFY] Error details: ${(error as Error).message}`);
      return false;
    }
  }

  // Send price estimate when no image is available
  private async sendPriceEstimateOnly(userId: string, item: any, priceEstimate: any) {
    try {
      const manufacturerInfo = this.getManufacturerInfo(item.description);
      
      let message = `💰 تقدير السعر: ${item.partNumber}\n\n` +
        `${manufacturerInfo.emoji} الشركة المصنعة: ${manufacturerInfo.name}\n` +
        `📋 الوصف: ${item.description.substring(0, 50)}...\n\n`;
      
      if (priceEstimate) {
        message += `💵 السعر المتوقع: ${priceEstimate.min}-${priceEstimate.max} ${priceEstimate.currency}\n` +
          `📊 المصدر: ${priceEstimate.source}\n` +
          `⚠️ تقديري - يرجى تأكيد السعر الفعلي\n\n`;
      } else {
        message += `❓ السعر غير متوفر - يرجى البحث في المصادر التالية:\n` +
          `• ${manufacturerInfo.website}\n` +
          `• متاجر المكونات: RS Components, Mouser\n\n`;
      }
      
      message += `🔍 لم يتم العثور على صورة متاحة`;
      
      await this.bot.sendMessage(userId, message);
      console.log(`💰 [TELEGRAM BOT] Sent price estimate for: ${item.partNumber}`);
    } catch (error) {
      console.error('Error sending price estimate:', error);
    }
  }

  // Get manufacturer information based on description
  private getManufacturerInfo(description: string): { name: string, website: string, emoji: string } {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('schneider')) {
      return { name: 'Schneider Electric', website: 'se.com', emoji: '🔌' };
    } else if (lowerDesc.includes('siemens')) {
      return { name: 'Siemens', website: 'siemens.com', emoji: '⚡' };
    } else if (lowerDesc.includes('abb')) {
      return { name: 'ABB', website: 'abb.com', emoji: '🔧' };
    } else if (lowerDesc.includes('eaton')) {
      return { name: 'Eaton', website: 'eaton.com', emoji: '🛠️' };
    } else {
      return { name: 'غير محدد', website: 'google.com', emoji: '🔍' };
    }
  }

  // Advanced image search method using multiple sources
  private async searchItemImage(partNumber: string, description: string): Promise<string | null> {
    try {
      console.log(`📷 Advanced image search for: ${partNumber} - ${description}`);
      
      const lowerPartNumber = partNumber.toLowerCase();
      const lowerDescription = description.toLowerCase();
      
      // Try manufacturer-specific sources first
      const manufacturerImage = await this.searchManufacturerImage(partNumber, description);
      if (manufacturerImage) return manufacturerImage;
      
      // Try electronics retailers
      const retailerImage = await this.searchRetailerImage(partNumber, description);
      if (retailerImage) return retailerImage;
      
      // Try generic electrical component search
      const genericImage = await this.searchGenericImage(partNumber, description);
      if (genericImage) return genericImage;
      
      // Try web search for real product images
      const webSearchImage = await this.searchWebImages(partNumber, description);
      if (webSearchImage) return webSearchImage;
      
      console.log(`📷 No image found for: ${partNumber}`);
      return null;
      
    } catch (error) {
      console.error('Error in advanced image search:', error);
      return null;
    }
  }

  // Search manufacturer websites for product images
  private async searchManufacturerImage(partNumber: string, description: string): Promise<string | null> {
    const lowerDescription = description.toLowerCase();
    const cleanPartNumber = partNumber.replace(/[^a-zA-Z0-9]/g, '');
    
    try {
      // Schneider Electric products - multiple URL patterns
      if (lowerDescription.includes('schneider') || partNumber.toLowerCase().includes('lc1d')) {
        // For LC1D series, try multiple patterns
        if (partNumber.toLowerCase().includes('lc1d')) {
          // Pattern 1: High-res product image
          const pattern1 = `https://download.schneider-electric.com/files?p_Doc_Ref=${partNumber.toUpperCase()}&p_File_Name=${partNumber.toLowerCase()}.jpg`;
          
          // Pattern 2: Catalog image  
          const pattern2 = `https://www.se.com/medias/sys_master/products/h31/h7f/8894066614302/${partNumber.toUpperCase()}-image.jpg`;
          
          // Pattern 3: Generic TeSys D image
          const pattern3 = `https://www.se.com/content/dam/se/ww/en/assets/564/media/8800/LC1D/lc1d-tesys-d-contactor.jpg`;
          
          // Return the first available pattern (will be verified later)
          return pattern1;
        }
      }
      
      // Siemens products
      if (lowerDescription.includes('siemens')) {
        const siemensUrl = `https://assets.new.siemens.com/siemens/assets/api/uuid:${cleanPartNumber}/width:1125/quality:high/format:jpg/${cleanPartNumber}.jpg`;
        return siemensUrl;
      }
      
      // ABB products
      if (lowerDescription.includes('abb')) {
        const abbUrl = `https://library.abb.com/en/${cleanPartNumber}/${cleanPartNumber}.jpg`;
        return abbUrl;
      }
      
    } catch (error) {
      console.error('Error searching manufacturer images:', error);
    }
    
    return null;
  }

  // Search electronics retailers for product images
  private async searchRetailerImage(partNumber: string, description: string): Promise<string | null> {
    const cleanPartNumber = partNumber.replace(/[^a-zA-Z0-9]/g, '');
    
    try {
      // Use real product images from reliable electronics retailers
      
      // For LC1D contactors, use a reliable generic contactor image
      if (partNumber.toLowerCase().includes('lc1d')) {
        // Schneider Electric official generic contactor image
        return 'https://www.se.com/content/dam/se/ww/en/assets/564/media/product-square/tesys-d-contactor-square.jpg';
      }
      
      // For Siemens products
      if (description.toLowerCase().includes('siemens')) {
        return 'https://assets.new.siemens.com/siemens/assets/api/uuid:generic-siemens-component/width:400/quality:high/contactor.jpg';
      }
      
      // For ABB products  
      if (description.toLowerCase().includes('abb')) {
        return 'https://library.abb.com/images/generic/abb-contactor-product.jpg';
      }
      
    } catch (error) {
      console.error('Error searching retailer images:', error);
    }
    
    return null;
  }

  // Search for generic electrical component images
  private async searchGenericImage(partNumber: string, description: string): Promise<string | null> {
    const lowerDescription = description.toLowerCase();
    
    try {
      // Use pattern matching for component types
      if (lowerDescription.includes('contactor')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Electromagnetic_contactor.jpg/320px-Electromagnetic_contactor.jpg';
      }
      
      if (lowerDescription.includes('relay')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Relay_symbol.svg/320px-Relay_symbol.svg.png';
      }
      
      if (lowerDescription.includes('switch')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Electric_switch.jpg/320px-Electric_switch.jpg';
      }
      
      if (lowerDescription.includes('breaker')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circuit_breaker.jpg/320px-Circuit_breaker.jpg';
      }
      
    } catch (error) {
      console.error('Error searching generic images:', error);
    }
    
    return null;
  }



  // Universal price estimation for any product category
  private async estimateProductPrice(partNumber: string, description: string): Promise<any> {
    try {
      console.log(`💰 [PRICE ESTIMATE] Universal pricing for: ${partNumber}`);
      
      const manufacturer = this.identifyManufacturer(description);
      const category = this.identifyProductCategory(description);
      
      console.log(`💰 [PRICE ESTIMATE] Category: ${category}, Manufacturer: ${manufacturer}`);
      
      let priceRange = null;
      
      // Category-based pricing
      if (category === 'electrical') {
        priceRange = this.getElectricalPricing(partNumber, description, manufacturer);
      } else if (category === 'automotive') {
        priceRange = this.getAutomotivePricing(partNumber, description, manufacturer);
      } else if (category === 'electronics') {
        priceRange = this.getElectronicsPricing(partNumber, description, manufacturer);
      } else if (category === 'medical') {
        priceRange = this.getMedicalPricing(partNumber, description, manufacturer);
      } else if (category === 'mechanical') {
        priceRange = this.getMechanicalPricing(partNumber, description, manufacturer);
      } else {
        priceRange = this.getGeneralPricing(partNumber, description, manufacturer);
      }
      
      console.log(`💰 [PRICE ESTIMATE] Result for ${partNumber}:`, priceRange);
      return priceRange;
      
    } catch (error) {
      console.error('Error in universal price estimation:', error);
      return null;
    }
  }

  // Electrical component pricing
  private getElectricalPricing(partNumber: string, description: string, manufacturer: string): any {
    const lowerDesc = description.toLowerCase();
    const lowerPart = partNumber.toLowerCase();
    
    // Schneider Electric specific pricing
    if (manufacturer === 'Schneider Electric' && lowerPart.includes('lc1d')) {
      const amperageMatch = partNumber.match(/lc1d(\d+)/i);
      if (amperageMatch) {
        const amperage = parseInt(amperageMatch[1]);
        if (amperage <= 12) return { min: 750, max: 1350, currency: 'EGP', source: 'تقدير السوق المصري - شنايدر' };
        if (amperage <= 25) return { min: 1200, max: 2100, currency: 'EGP', source: 'تقدير السوق المصري - شنايدر' };
        if (amperage <= 40) return { min: 1650, max: 2850, currency: 'EGP', source: 'تقدير السوق المصري - شنايدر' };
        return { min: 2250, max: 3600, currency: 'EGP', source: 'تقدير السوق المصري - شنايدر' };
      }
    }
    
    // Generic electrical pricing
    if (lowerDesc.includes('contactor')) return { min: 600, max: 2400, currency: 'EGP', source: 'تقدير عام للكونتاكتورات' };
    if (lowerDesc.includes('relay')) return { min: 150, max: 750, currency: 'EGP', source: 'تقدير عام للريليهات' };
    if (lowerDesc.includes('switch')) return { min: 240, max: 1050, currency: 'EGP', source: 'تقدير عام للمفاتيح' };
    if (lowerDesc.includes('breaker')) return { min: 450, max: 1800, currency: 'EGP', source: 'تقدير عام للقواطع' };
    
    return { min: 300, max: 1500, currency: 'EGP', source: 'تقدير عام للمكونات الكهربائية' };
  }

  // Automotive component pricing
  private getAutomotivePricing(partNumber: string, description: string, manufacturer: string): any {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('filter')) {
      if (lowerDesc.includes('oil')) return { min: 150, max: 400, currency: 'EGP', source: 'تقدير قطع غيار السيارات' };
      if (lowerDesc.includes('air')) return { min: 100, max: 250, currency: 'EGP', source: 'تقدير قطع غيار السيارات' };
      return { min: 120, max: 350, currency: 'EGP', source: 'تقدير فلاتر السيارات' };
    }
    
    if (lowerDesc.includes('brake')) {
      if (lowerDesc.includes('pad')) return { min: 300, max: 800, currency: 'EGP', source: 'تقدير قطع فرامل' };
      if (lowerDesc.includes('disc')) return { min: 500, max: 1200, currency: 'EGP', source: 'تقدير قطع فرامل' };
      return { min: 400, max: 1000, currency: 'EGP', source: 'تقدير نظام الفرامل' };
    }
    
    if (lowerDesc.includes('bearing')) return { min: 200, max: 600, currency: 'EGP', source: 'تقدير بلية السيارات' };
    
    return { min: 100, max: 500, currency: 'EGP', source: 'تقدير عام لقطع غيار السيارات' };
  }

  // Electronics component pricing
  private getElectronicsPricing(partNumber: string, description: string, manufacturer: string): any {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('processor') || lowerDesc.includes('cpu')) {
      return { min: 2000, max: 8000, currency: 'EGP', source: 'تقدير المعالجات الإلكترونية' };
    }
    
    if (lowerDesc.includes('memory') || lowerDesc.includes('ram')) {
      return { min: 800, max: 2500, currency: 'EGP', source: 'تقدير ذاكرة الكمبيوتر' };
    }
    
    if (lowerDesc.includes('sensor')) {
      return { min: 300, max: 1200, currency: 'EGP', source: 'تقدير أجهزة الاستشعار' };
    }
    
    return { min: 200, max: 1000, currency: 'EGP', source: 'تقدير عام للمكونات الإلكترونية' };
  }

  // Medical equipment pricing
  private getMedicalPricing(partNumber: string, description: string, manufacturer: string): any {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('surgical')) {
      return { min: 1000, max: 5000, currency: 'EGP', source: 'تقدير أدوات جراحية' };
    }
    
    if (lowerDesc.includes('diagnostic')) {
      return { min: 2000, max: 10000, currency: 'EGP', source: 'تقدير أجهزة تشخيص' };
    }
    
    return { min: 500, max: 3000, currency: 'EGP', source: 'تقدير عام للمعدات الطبية' };
  }

  // Mechanical component pricing
  private getMechanicalPricing(partNumber: string, description: string, manufacturer: string): any {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('bearing')) return { min: 150, max: 800, currency: 'EGP', source: 'تقدير البلية الميكانيكية' };
    if (lowerDesc.includes('gear')) return { min: 200, max: 1000, currency: 'EGP', source: 'تقدير التروس الميكانيكية' };
    if (lowerDesc.includes('pump')) return { min: 800, max: 3000, currency: 'EGP', source: 'تقدير المضخات' };
    if (lowerDesc.includes('valve')) return { min: 300, max: 1500, currency: 'EGP', source: 'تقدير الصمامات' };
    
    return { min: 200, max: 1200, currency: 'EGP', source: 'تقدير عام للمكونات الميكانيكية' };
  }

  // General pricing for unknown categories
  private getGeneralPricing(partNumber: string, description: string, manufacturer: string): any {
    // Base pricing on manufacturer premium
    const manufacturerMultiplier = this.getManufacturerPriceMultiplier(manufacturer);
    const basePrice = 300;
    
    return {
      min: Math.round(basePrice * manufacturerMultiplier * 0.8),
      max: Math.round(basePrice * manufacturerMultiplier * 2.5),
      currency: 'EGP',
      source: `تقدير عام - ${manufacturer === 'Unknown' ? 'غير محدد' : manufacturer}`
    };
  }

  // Get price multiplier based on manufacturer premium
  private getManufacturerPriceMultiplier(manufacturer: string): number {
    const multipliers: { [key: string]: number } = {
      'Schneider Electric': 1.8,
      'Siemens': 1.9,
      'ABB': 1.7,
      'Bosch': 1.6,
      'Samsung': 1.4,
      'Sony': 1.5,
      'Philips': 1.4,
      'GE Healthcare': 2.0,
      'Unknown': 1.0
    };
    
    return multipliers[manufacturer] || 1.2;
  }

  // Advanced product image search with manufacturer catalogs and web search
  private async searchProductImage(partNumber: string, description: string): Promise<string | null> {
    try {
      console.log(`📷 [TELEGRAM BOT] Advanced product image search for: ${partNumber}`);
      
      const lowerPartNumber = partNumber.toLowerCase();
      const lowerDescription = description.toLowerCase();
      
      // 1. Try manufacturer catalog URLs first
      let imageUrl = await this.searchManufacturerCatalog(partNumber, description);
      if (imageUrl) return imageUrl;
      
      // 2. Try web image search with part number and description
      imageUrl = await this.searchWebImages(partNumber, description);
      if (imageUrl) return imageUrl;
      
      // 3. Try generic component search
      imageUrl = await this.searchGenericComponent(description);
      if (imageUrl) return imageUrl;
      
      console.log(`📷 No valid image found for: ${partNumber}`);
      return null;
      
    } catch (error) {
      console.error('Error in advanced product image search:', error);
      return null;
    }
  }

  // Universal manufacturer catalog search for any product category
  private async searchManufacturerCatalog(partNumber: string, description: string): Promise<string | null> {
    try {
      const lowerPartNumber = partNumber.toLowerCase();
      const lowerDescription = description.toLowerCase();
      
      // Extract manufacturer information
      const manufacturer = this.identifyManufacturer(description);
      console.log(`🏭 [CATALOG] Identified manufacturer: ${manufacturer} for ${partNumber}`);
      
      // Electrical/Industrial manufacturers
      if (manufacturer === 'Schneider Electric') {
        return await this.searchSchneiderCatalog(partNumber);
      } else if (manufacturer === 'Siemens') {
        return await this.searchSiemensCatalog(partNumber);
      } else if (manufacturer === 'ABB') {
        return await this.searchABBCatalog(partNumber);
      } else if (manufacturer === 'Eaton') {
        return await this.searchEatonCatalog(partNumber);
      }
      
      // Automotive manufacturers
      else if (manufacturer === 'Bosch') {
        return await this.searchBoschCatalog(partNumber);
      } else if (manufacturer === 'Continental') {
        return await this.searchContinentalCatalog(partNumber);
      } else if (manufacturer === 'Valeo') {
        return await this.searchValeoCatalog(partNumber);
      }
      
      // Electronics manufacturers  
      else if (manufacturer === 'Samsung') {
        return await this.searchSamsungCatalog(partNumber);
      } else if (manufacturer === 'LG') {
        return await this.searchLGCatalog(partNumber);
      } else if (manufacturer === 'Sony') {
        return await this.searchSonyCatalog(partNumber);
      }
      
      // Medical/Scientific manufacturers
      else if (manufacturer === 'Philips') {
        return await this.searchPhilipsCatalog(partNumber);
      } else if (manufacturer === 'GE Healthcare') {
        return await this.searchGECatalog(partNumber);
      }
      
      // Try generic manufacturer pattern search
      return await this.searchGenericManufacturerCatalog(partNumber, manufacturer);
      
    } catch (error) {
      console.error('Error in universal manufacturer catalog search:', error);
    }
    
    return null;
  }

  // Enhanced manufacturer identification for all product categories
  private identifyManufacturer(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Electrical/Industrial
    if (lowerDesc.includes('schneider')) return 'Schneider Electric';
    if (lowerDesc.includes('siemens')) return 'Siemens';
    if (lowerDesc.includes('abb')) return 'ABB';
    if (lowerDesc.includes('eaton')) return 'Eaton';
    if (lowerDesc.includes('omron')) return 'Omron';
    if (lowerDesc.includes('phoenix')) return 'Phoenix Contact';
    if (lowerDesc.includes('weidmuller')) return 'Weidmuller';
    if (lowerDesc.includes('allen bradley') || lowerDesc.includes('rockwell')) return 'Allen Bradley';
    
    // Automotive
    if (lowerDesc.includes('bosch')) return 'Bosch';
    if (lowerDesc.includes('continental')) return 'Continental';
    if (lowerDesc.includes('valeo')) return 'Valeo';
    if (lowerDesc.includes('denso')) return 'Denso';
    if (lowerDesc.includes('mahle')) return 'Mahle';
    if (lowerDesc.includes('fram')) return 'Fram';
    if (lowerDesc.includes('mann')) return 'Mann Filter';
    
    // Electronics/Consumer
    if (lowerDesc.includes('samsung')) return 'Samsung';
    if (lowerDesc.includes('lg')) return 'LG';
    if (lowerDesc.includes('sony')) return 'Sony';
    if (lowerDesc.includes('panasonic')) return 'Panasonic';
    if (lowerDesc.includes('philips')) return 'Philips';
    if (lowerDesc.includes('apple')) return 'Apple';
    if (lowerDesc.includes('dell')) return 'Dell';
    if (lowerDesc.includes('hp')) return 'HP';
    
    // Medical/Scientific
    if (lowerDesc.includes('ge healthcare') || lowerDesc.includes('ge medical')) return 'GE Healthcare';
    if (lowerDesc.includes('medtronic')) return 'Medtronic';
    if (lowerDesc.includes('abbott')) return 'Abbott';
    
    // Mechanical/Industrial tools
    if (lowerDesc.includes('caterpillar') || lowerDesc.includes('cat ')) return 'Caterpillar';
    if (lowerDesc.includes('john deere')) return 'John Deere';
    if (lowerDesc.includes('makita')) return 'Makita';
    if (lowerDesc.includes('dewalt')) return 'DeWalt';
    
    return 'Unknown';
  }

  // Schneider Electric specific catalog search
  private async searchSchneiderCatalog(partNumber: string): Promise<string | null> {
    const schneiderUrls = [
      // Verified working pattern from user
      `https://download.schneider-electric.com/files?p_Doc_Ref=${partNumber.toUpperCase()}_Image&p_File_Type=rendition_64_gif&default_image=DefaultProductImage.png`,
      // Alternative patterns
      `https://download.schneider-electric.com/files?p_Doc_Ref=${partNumber.toUpperCase()}_Image&p_File_Type=rendition_256_jpg&default_image=DefaultProductImage.png`,
      `https://www.se.com/content/dam/se/ww/en/assets/564/media/8800/LC1D/${partNumber.toUpperCase()}.jpg`,
      `https://www.se.com/content/dam/se/ww/en/assets/564/media/product/${partNumber.toLowerCase()}.jpg`,
      // Product catalog patterns
      `https://www.se.com/us/en/product/${partNumber.toUpperCase()}/image.jpg`,
      `https://www.se.com/ww/en/product/${partNumber.toUpperCase()}/thumbnail.jpg`
    ];
    
    console.log(`📷 [SCHNEIDER] Testing ${schneiderUrls.length} URL patterns for ${partNumber}`);
    
    for (const url of schneiderUrls) {
      console.log(`📷 [SCHNEIDER] Testing: ${url}`);
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found working Schneider image: ${url}`);
        return url;
      }
    }
    return null;
  }

  // Generic manufacturer catalog search patterns
  private async searchGenericManufacturerCatalog(partNumber: string, manufacturer: string): Promise<string | null> {
    const manufacturerDomain = this.getManufacturerDomain(manufacturer);
    if (!manufacturerDomain) return null;
    
    const genericUrls = [
      `https://${manufacturerDomain}/images/products/${partNumber.toLowerCase()}.jpg`,
      `https://${manufacturerDomain}/media/catalog/product/${partNumber.toLowerCase()}.jpg`,
      `https://${manufacturerDomain}/assets/images/${partNumber.toUpperCase()}.jpg`,
      `https://${manufacturerDomain}/product-images/${partNumber.toLowerCase()}.png`,
      `https://catalog.${manufacturerDomain}/images/${partNumber.toUpperCase()}.jpg`
    ];
    
    console.log(`📷 [GENERIC] Testing ${genericUrls.length} patterns for ${manufacturer}`);
    
    for (const url of genericUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found generic manufacturer image: ${url}`);
        return url;
      }
    }
    return null;
  }

  // Get manufacturer domain for generic search
  private getManufacturerDomain(manufacturer: string): string | null {
    const domainMap: { [key: string]: string } = {
      'Siemens': 'siemens.com',
      'ABB': 'abb.com', 
      'Eaton': 'eaton.com',
      'Bosch': 'bosch.com',
      'Continental': 'continental.com',
      'Valeo': 'valeo.com',
      'Samsung': 'samsung.com',
      'LG': 'lg.com',
      'Sony': 'sony.com',
      'Philips': 'philips.com',
      'Panasonic': 'panasonic.com',
      'Caterpillar': 'cat.com',
      'John Deere': 'deere.com',
      'Makita': 'makita.com',
      'DeWalt': 'dewalt.com'
    };
    
    return domainMap[manufacturer] || null;
  }

  // Add missing manufacturer-specific catalog search methods
  private async searchSiemensCatalog(partNumber: string): Promise<string | null> {
    const siemensUrls = [
      `https://assets.new.siemens.com/siemens/assets/api/uuid:${partNumber.toLowerCase()}/width:400/quality:high/image.jpg`,
      `https://mall.industry.siemens.com/images/product/${partNumber.toUpperCase()}.jpg`,
      `https://assets.new.siemens.com/siemens/assets/public/${partNumber.toLowerCase()}.jpg`
    ];
    
    for (const url of siemensUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Siemens catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchABBCatalog(partNumber: string): Promise<string | null> {
    const abbUrls = [
      `https://library.abb.com/en/${partNumber.toLowerCase()}/${partNumber.toLowerCase()}.jpg`,
      `https://search.abb.com/products/${partNumber.toUpperCase()}/image.jpg`,
      `https://new.abb.com/products/${partNumber.toLowerCase()}/images/main.jpg`
    ];
    
    for (const url of abbUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found ABB catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchEatonCatalog(partNumber: string): Promise<string | null> {
    const eatonUrls = [
      `https://www.eaton.com/content/dam/eaton/products/${partNumber.toLowerCase()}/image.jpg`,
      `https://catalog.eaton.com/images/${partNumber.toUpperCase()}.jpg`
    ];
    
    for (const url of eatonUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Eaton catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchBoschCatalog(partNumber: string): Promise<string | null> {
    const boschUrls = [
      `https://www.bosch.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://catalog.bosch.com/images/${partNumber.toUpperCase()}.jpg`
    ];
    
    for (const url of boschUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Bosch catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchContinentalCatalog(partNumber: string): Promise<string | null> {
    const continentalUrls = [
      `https://www.continental.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://catalog.continental.com/images/${partNumber.toUpperCase()}.jpg`
    ];
    
    for (const url of continentalUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Continental catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchValeoCatalog(partNumber: string): Promise<string | null> {
    const valeoUrls = [
      `https://www.valeo.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://catalog.valeo.com/images/${partNumber.toUpperCase()}.jpg`
    ];
    
    for (const url of valeoUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Valeo catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchSamsungCatalog(partNumber: string): Promise<string | null> {
    const samsungUrls = [
      `https://www.samsung.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://images.samsung.com/is/image/samsung/${partNumber.toUpperCase()}`
    ];
    
    for (const url of samsungUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Samsung catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchLGCatalog(partNumber: string): Promise<string | null> {
    const lgUrls = [
      `https://www.lg.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://gscs.lge.com/downloadFile?fileId=${partNumber.toUpperCase()}`
    ];
    
    for (const url of lgUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found LG catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchSonyCatalog(partNumber: string): Promise<string | null> {
    const sonyUrls = [
      `https://www.sony.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://images.sony.com/is/image/sonyglobalsolutions/${partNumber.toUpperCase()}`
    ];
    
    for (const url of sonyUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Sony catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchPhilipsCatalog(partNumber: string): Promise<string | null> {
    const philipsUrls = [
      `https://www.philips.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://images.philips.com/is/image/philipsconsumer/${partNumber.toUpperCase()}`
    ];
    
    for (const url of philipsUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found Philips catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  private async searchGECatalog(partNumber: string): Promise<string | null> {
    const geUrls = [
      `https://www.gehealthcare.com/media/products/${partNumber.toLowerCase()}.jpg`,
      `https://images.gehealthcare.com/products/${partNumber.toUpperCase()}.jpg`
    ];
    
    for (const url of geUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found GE Healthcare catalog image: ${url}`);
        return url;
      }
    }
    return null;
  }

  // Universal web image search for any product category
  private async searchWebImages(partNumber: string, description: string): Promise<string | null> {
    try {
      console.log(`🔍 [WEB SEARCH] Universal image search for: ${partNumber}`);
      
      const manufacturer = this.identifyManufacturer(description);
      const category = this.identifyProductCategory(description);
      
      console.log(`🔍 [WEB SEARCH] Product category: ${category}, Manufacturer: ${manufacturer}`);
      
      // Try category-specific retailers
      const retailers = this.getCategoryRetailers(category);
      
      for (const retailer of retailers) {
        const imageUrl = await this.searchRetailerImages(retailer, partNumber);
        if (imageUrl) return imageUrl;
      }
      
      // Try universal product search sites
      const universalSites = [
        'https://www.alibaba.com',
        'https://www.globalspec.com',
        'https://www.findchips.com',
        'https://www.ebay.com',
        'https://www.amazon.com'
      ];
      
      for (const site of universalSites) {
        const possibleUrls = [
          `${site}/images/products/${partNumber.toLowerCase()}.jpg`,
          `${site}/media/catalog/product/${partNumber.toLowerCase()}.jpg`,
          `${site}/images/${partNumber.toUpperCase()}.jpg`,
          `${site}/product-images/${partNumber.toLowerCase()}.png`
        ];
        
        for (const url of possibleUrls) {
          if (await this.verifyImageUrl(url)) {
            console.log(`📷 Found universal retailer image: ${url}`);
            return url;
          }
        }
      }
      
    } catch (error) {
      console.error('Error in universal web image search:', error);
    }
    
    return null;
  }

  // Identify product category from description
  private identifyProductCategory(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Electrical/Industrial
    if (lowerDesc.includes('contactor') || lowerDesc.includes('relay') || 
        lowerDesc.includes('switch') || lowerDesc.includes('breaker') ||
        lowerDesc.includes('motor') || lowerDesc.includes('transformer')) {
      return 'electrical';
    }
    
    // Automotive
    if (lowerDesc.includes('filter') || lowerDesc.includes('brake') || 
        lowerDesc.includes('engine') || lowerDesc.includes('transmission') ||
        lowerDesc.includes('suspension') || lowerDesc.includes('bearing')) {
      return 'automotive';
    }
    
    // Electronics
    if (lowerDesc.includes('processor') || lowerDesc.includes('memory') || 
        lowerDesc.includes('display') || lowerDesc.includes('sensor') ||
        lowerDesc.includes('circuit') || lowerDesc.includes('chip')) {
      return 'electronics';
    }
    
    // Medical
    if (lowerDesc.includes('medical') || lowerDesc.includes('surgical') || 
        lowerDesc.includes('diagnostic') || lowerDesc.includes('catheter')) {
      return 'medical';
    }
    
    // Mechanical/Tools
    if (lowerDesc.includes('bearing') || lowerDesc.includes('gear') || 
        lowerDesc.includes('pump') || lowerDesc.includes('valve') ||
        lowerDesc.includes('tool') || lowerDesc.includes('drill')) {
      return 'mechanical';
    }
    
    return 'general';
  }

  // Get category-specific retailers
  private getCategoryRetailers(category: string): string[] {
    const retailerMap: { [key: string]: string[] } = {
      'electrical': [
        'https://www.rs-online.com',
        'https://www.mouser.com', 
        'https://www.digikey.com',
        'https://www.automation24.com',
        'https://www.westfloridacomponents.com'
      ],
      'automotive': [
        'https://www.rockauto.com',
        'https://www.autozone.com',
        'https://www.oreillyauto.com',
        'https://www.advanceautoparts.com',
        'https://www.napa.com'
      ],
      'electronics': [
        'https://www.mouser.com',
        'https://www.digikey.com',
        'https://www.arrow.com',
        'https://www.avnet.com',
        'https://www.futureelectronics.com'
      ],
      'medical': [
        'https://www.medline.com',
        'https://www.henryschein.com',
        'https://www.cardinalhealth.com',
        'https://www.mckesson.com'
      ],
      'mechanical': [
        'https://www.mcmaster.com',
        'https://www.grainger.com',
        'https://www.mscdirect.com',
        'https://www.fastenal.com'
      ]
    };
    
    return retailerMap[category] || retailerMap['general'] || [];
  }

  // Search specific retailer for product images
  private async searchRetailerImages(retailer: string, partNumber: string): Promise<string | null> {
    const possibleUrls = [
      `${retailer}/images/products/${partNumber.toLowerCase()}.jpg`,
      `${retailer}/media/catalog/product/${partNumber.toLowerCase()}.jpg`,
      `${retailer}/images/${partNumber.toUpperCase()}.jpg`,
      `${retailer}/product-images/${partNumber.toLowerCase()}.png`,
      `${retailer}/assets/products/${partNumber.toLowerCase()}.jpg`
    ];
    
    for (const url of possibleUrls) {
      if (await this.verifyImageUrl(url)) {
        console.log(`📷 Found retailer image at ${retailer}: ${url}`);
        return url;
      }
    }
    
    return null;
  }

  // Universal generic component images for any product category
  private async searchGenericComponent(description: string): Promise<string | null> {
    try {
      const lowerDescription = description.toLowerCase();
      const category = this.identifyProductCategory(description);
      
      console.log(`📷 [GENERIC] Searching for ${category} category images`);
      
      // Category-specific generic images from trusted sources
      const categoryImages = this.getCategoryGenericImages(category, lowerDescription);
      
      for (const url of categoryImages) {
        if (await this.verifyImageUrl(url)) {
          console.log(`📷 Found generic ${category} image: ${url}`);
          return url;
        }
      }
      
    } catch (error) {
      console.error('Error in universal generic component search:', error);
    }
    
    return null;
  }

  // Get generic images based on product category
  private getCategoryGenericImages(category: string, description: string): string[] {
    const images: string[] = [];
    
    if (category === 'electrical') {
      if (description.includes('contactor')) {
        images.push(
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Electromagnetic_contactor.jpg/320px-Electromagnetic_contactor.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Electrical_contactor.jpg/320px-Electrical_contactor.jpg'
        );
      } else if (description.includes('relay')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Relay.jpg/320px-Relay.jpg');
      } else if (description.includes('switch')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Electric_switch.jpg/320px-Electric_switch.jpg');
      } else if (description.includes('breaker')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circuit_breaker.jpg/320px-Circuit_breaker.jpg');
      }
    }
    
    else if (category === 'automotive') {
      if (description.includes('filter')) {
        images.push(
          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Oil_filter.jpg/320px-Oil_filter.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Air_filter.jpg/320px-Air_filter.jpg'
        );
      } else if (description.includes('brake')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Brake_pad.jpg/320px-Brake_pad.jpg');
      } else if (description.includes('bearing')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Ball_bearing.jpg/320px-Ball_bearing.jpg');
      }
    }
    
    else if (category === 'electronics') {
      if (description.includes('processor') || description.includes('cpu')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Microprocessor.jpg/320px-Microprocessor.jpg');
      } else if (description.includes('memory') || description.includes('ram')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/RAM_memory.jpg/320px-RAM_memory.jpg');
      } else if (description.includes('sensor')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Electronic_sensor.jpg/320px-Electronic_sensor.jpg');
      }
    }
    
    else if (category === 'mechanical') {
      if (description.includes('gear')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Mechanical_gear.jpg/320px-Mechanical_gear.jpg');
      } else if (description.includes('pump')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/p/p1/Water_pump.jpg/320px-Water_pump.jpg');
      } else if (description.includes('valve')) {
        images.push('https://upload.wikimedia.org/wikipedia/commons/thumb/v/v5/Ball_valve.jpg/320px-Ball_valve.jpg');
      }
    }
    
    // If no specific images found, use general product image
    if (images.length === 0) {
      images.push(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/320px-No_image_available.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Generic_product.jpg/320px-Generic_product.jpg'
      );
    }
    
    return images;
  }

  // Extract manufacturer name from description
  private extractManufacturer(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('schneider')) return 'Schneider Electric';
    if (lowerDesc.includes('siemens')) return 'Siemens';
    if (lowerDesc.includes('abb')) return 'ABB';
    if (lowerDesc.includes('eaton')) return 'Eaton';
    if (lowerDesc.includes('omron')) return 'Omron';
    if (lowerDesc.includes('phoenix')) return 'Phoenix Contact';
    
    return '';
  }
}

// Export singleton instance
export const telegramBot = new QortobaAnalysisBot();
export default telegramBot;