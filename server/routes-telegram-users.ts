import { Express } from 'express';
import { requireAuth } from './user-sheets-manager';

export function addTelegramUsersRoutes(app: Express) {
  // Telegram Bot Management Routes
  app.get('/api/telegram-bot/status', requireAuth, async (req, res) => {
    try {
      const { telegramBotGoogleSheets } = await import('./telegram-bot-google-sheets');
      const { telegramUsersSheetsManager } = await import('./telegram-users-sheets-manager');
      
      const localUsers = telegramBotGoogleSheets.getAuthorizedUsers().length;
      const sheetsUsers = await telegramUsersSheetsManager.getActiveUsers();
      const userStats = await telegramUsersSheetsManager.getUsersStats();
      
      res.json({
        status: 'active',
        botName: '@Req_item_bot',
        authorizedUsers: localUsers + sheetsUsers.length,
        localUsers,
        sheetsUsers: sheetsUsers.length,
        userStats,
        deepSeekConfigured: !!process.env.DEEPSEEK_API_KEY
      });
    } catch (error) {
      console.error('Error getting bot status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/telegram-bot/users', requireAuth, async (req, res) => {
    try {
      const { telegramBotGoogleSheets } = await import('./telegram-bot-google-sheets');
      const { telegramUsersSheetsManager } = await import('./telegram-users-sheets-manager');
      
      const localUsers = telegramBotGoogleSheets.getAuthorizedUsers();
      const sheetsUsers = await telegramUsersSheetsManager.getActiveUsers();
      const userStats = await telegramUsersSheetsManager.getUsersStats();
      
      res.json({ 
        localUsers, 
        sheetsUsers, 
        userStats,
        users: [...new Set([...localUsers, ...sheetsUsers])], // دمج القوائم دون تكرار
        count: [...new Set([...localUsers, ...sheetsUsers])].length 
      });
    } catch (error) {
      console.error('Error getting bot users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // إضافة endpoint للحصول على تفاصيل مستخدم معين
  app.get('/api/telegram-bot/user/:userId', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { telegramUsersSheetsManager } = await import('./telegram-users-sheets-manager');
      
      const userDetails = await telegramUsersSheetsManager.getUser(userId);
      
      if (!userDetails) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }
      
      res.json(userDetails);
    } catch (error) {
      console.error('Error getting user details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // إضافة endpoint لإحصائيات شاملة عن المستخدمين
  app.get('/api/telegram-bot/stats', requireAuth, async (req, res) => {
    try {
      const { telegramUsersSheetsManager } = await import('./telegram-users-sheets-manager');
      const stats = await telegramUsersSheetsManager.getUsersStats();
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/telegram-bot/add-user', requireAuth, async (req, res) => {
    try {
      const { telegramUserId, userInfo } = req.body;
      
      if (!telegramUserId) {
        return res.status(400).json({ error: 'Telegram user ID is required' });
      }
      
      // إضافة إلى القائمة المحلية
      const { telegramBotGoogleSheets } = await import('./telegram-bot-google-sheets');
      await telegramBotGoogleSheets.addAuthorizedUser(telegramUserId);
      
      // إضافة إلى ورقة Google Sheets
      const { telegramUsersSheetsManager } = await import('./telegram-users-sheets-manager');
      await telegramUsersSheetsManager.addUser(telegramUserId, userInfo || {});
      
      res.json({ success: true, message: 'تم إضافة المستخدم بنجاح إلى النظام وورقة Google Sheets' });
    } catch (error) {
      console.error('Error adding user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/telegram-bot/remove-user/:userId', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { telegramBotGoogleSheets } = await import('./telegram-bot-google-sheets');
      const { telegramUsersSheetsManager } = await import('./telegram-users-sheets-manager');
      
      // إزالة من القائمة المحلية
      await telegramBotGoogleSheets.removeAuthorizedUser(userId);
      
      // تعطيل في ورقة Google Sheets
      await telegramUsersSheetsManager.deactivateUser(userId);
      
      res.json({ success: true, message: 'تم إزالة المستخدم بنجاح' });
    } catch (error) {
      console.error('Error removing user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}