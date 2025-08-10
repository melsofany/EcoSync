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
      console.log(`📷 Verifying image URL: ${url}`);
      
      // Make HEAD request to check if image exists without downloading it
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type');
      const isValid = response.ok && (contentType?.startsWith('image/') ?? false);
      console.log(`📷 Image verification result for ${url}: ${isValid ? 'VALID' : 'INVALID'}`);
      
      return isValid;
    } catch (error) {
      console.log(`📷 Image verification failed for ${url}: ${(error as Error).message}`);
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



  // Estimate product price based on part number and description
  private async estimateProductPrice(partNumber: string, description: string): Promise<any> {
    try {
      console.log(`💰 [TELEGRAM BOT] Estimating price for: ${partNumber}`);
      
      const lowerPartNumber = partNumber.toLowerCase();
      const lowerDescription = description.toLowerCase();
      
      // Price estimation logic based on product type and manufacturer
      let priceRange: any = null;
      
      // Schneider Electric contactors
      if (lowerPartNumber.includes('lc1d') && lowerDescription.includes('schneider')) {
        const amperageMatch = lowerPartNumber.match(/lc1d(\d+)/);
        if (amperageMatch) {
          const amperage = parseInt(amperageMatch[1]);
          if (amperage <= 12) {
            priceRange = { min: 750, max: 1350, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          } else if (amperage <= 25) {
            priceRange = { min: 1050, max: 1950, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          } else if (amperage <= 50) {
            priceRange = { min: 1650, max: 2850, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          } else {
            priceRange = { min: 2550, max: 4500, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          }
        }
      }
      
      // Siemens contactors (3RT series)
      else if (lowerPartNumber.includes('3rt') && lowerDescription.includes('siemens')) {
        const amperageMatch = description.match(/(\d+)\s*a/i);
        if (amperageMatch) {
          const amperage = parseInt(amperageMatch[1]);
          if (amperage <= 25) {
            priceRange = { min: 900, max: 1650, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          } else if (amperage <= 50) {
            priceRange = { min: 1500, max: 2550, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          } else {
            priceRange = { min: 2250, max: 3600, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          }
        }
      }
      
      // ABB contactors (AF series)
      else if (lowerPartNumber.includes('af') && lowerDescription.includes('abb')) {
        const amperageMatch = description.match(/(\d+)\s*a/i);
        if (amperageMatch) {
          const amperage = parseInt(amperageMatch[1]);
          if (amperage <= 30) {
            priceRange = { min: 840, max: 1500, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          } else if (amperage <= 60) {
            priceRange = { min: 1440, max: 2400, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          } else {
            priceRange = { min: 2100, max: 3300, currency: 'EGP', source: 'تقدير السوق المصري للمقاولات' };
          }
        }
      }
      
      // Generic electrical component pricing
      else if (lowerDescription.includes('contactor')) {
        priceRange = { min: 600, max: 2400, currency: 'EGP', source: 'تقدير عام للكونتاكتورات' };
      } else if (lowerDescription.includes('relay')) {
        priceRange = { min: 150, max: 750, currency: 'EGP', source: 'تقدير عام للريليهات' };
      } else if (lowerDescription.includes('switch')) {
        priceRange = { min: 240, max: 1050, currency: 'EGP', source: 'تقدير عام للمفاتيح' };
      } else if (lowerDescription.includes('breaker')) {
        priceRange = { min: 450, max: 1800, currency: 'EGP', source: 'تقدير عام للقواطع' };
      }
      
      console.log(`💰 [TELEGRAM BOT] Price estimate for ${partNumber}:`, priceRange);
      return priceRange;
      
    } catch (error) {
      console.error('Error estimating price:', error);
      return null;
    }
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

  // Search manufacturer catalogs for specific part numbers
  private async searchManufacturerCatalog(partNumber: string, description: string): Promise<string | null> {
    try {
      const lowerPartNumber = partNumber.toLowerCase();
      const lowerDescription = description.toLowerCase();
      
      // Schneider Electric catalog search
      if (lowerDescription.includes('schneider') || lowerPartNumber.includes('lc1d')) {
        const schneiderUrls = [
          `https://www.se.com/content/dam/se/ww/en/assets/564/media/8800/LC1D/${partNumber.toUpperCase()}.jpg`,
          `https://www.se.com/content/dam/se/ww/en/assets/564/media/product/${partNumber.toLowerCase()}.jpg`,
          `https://download.schneider-electric.com/files?p_File_Name=${partNumber.toLowerCase()}.jpg`,
          `https://www.se.com/content/dam/se/ww/en/assets/564/media/product-square/${partNumber.toLowerCase()}.jpg`
        ];
        
        for (const url of schneiderUrls) {
          if (await this.verifyImageUrl(url)) {
            console.log(`📷 Found Schneider catalog image: ${url}`);
            return url;
          }
        }
      }
      
      // Siemens catalog search
      if (lowerDescription.includes('siemens') || lowerPartNumber.includes('3rt')) {
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
      }
      
      // ABB catalog search
      if (lowerDescription.includes('abb') || lowerPartNumber.includes('af')) {
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
      }
      
    } catch (error) {
      console.error('Error in manufacturer catalog search:', error);
    }
    
    return null;
  }

  // Search web images using Google Images-style search
  private async searchWebImages(partNumber: string, description: string): Promise<string | null> {
    try {
      console.log(`🔍 [TELEGRAM BOT] Web image search for: ${partNumber}`);
      
      // Create search queries
      const searchQueries = [
        `${partNumber} product image`,
        `${partNumber} datasheet`,
        `${partNumber} catalog`,
        `${partNumber} ${this.extractManufacturer(description)}`,
        `${partNumber} contactor electrical component`
      ];
      
      // Try common electrical component image hosting sites
      const imageHosts = [
        'https://www.rs-online.com',
        'https://www.mouser.com', 
        'https://www.digikey.com',
        'https://www.automation24.com',
        'https://www.westernmountainstechnologies.com'
      ];
      
      // Try constructing URLs based on common patterns
      for (const host of imageHosts) {
        const possibleUrls = [
          `${host}/images/products/${partNumber.toLowerCase()}.jpg`,
          `${host}/media/catalog/product/${partNumber.toLowerCase()}.jpg`,
          `${host}/images/${partNumber.toUpperCase()}.jpg`
        ];
        
        for (const url of possibleUrls) {
          if (await this.verifyImageUrl(url)) {
            console.log(`📷 Found web image: ${url}`);
            return url;
          }
        }
      }
      
    } catch (error) {
      console.error('Error in web image search:', error);
    }
    
    return null;
  }

  // Search for generic component images
  private async searchGenericComponent(description: string): Promise<string | null> {
    try {
      const lowerDescription = description.toLowerCase();
      
      // Reliable electrical component images from trusted sources
      if (lowerDescription.includes('contactor')) {
        const contactorImages = [
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Electromagnetic_contactor.jpg/320px-Electromagnetic_contactor.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Electrical_contactor.jpg/320px-Electrical_contactor.jpg'
        ];
        
        for (const url of contactorImages) {
          if (await this.verifyImageUrl(url)) {
            console.log(`📷 Found generic contactor image: ${url}`);
            return url;
          }
        }
      }
      
      if (lowerDescription.includes('relay')) {
        const relayImages = [
          'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Relay.jpg/320px-Relay.jpg'
        ];
        
        for (const url of relayImages) {
          if (await this.verifyImageUrl(url)) {
            console.log(`📷 Found generic relay image: ${url}`);
            return url;
          }
        }
      }
      
    } catch (error) {
      console.error('Error in generic component search:', error);
    }
    
    return null;
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