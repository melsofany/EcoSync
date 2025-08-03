import { storage } from './storage';
import type { InsertNotification } from '@shared/schema';

export class NotificationService {
  // Create notification for a specific user
  static async notify(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', relatedEntityType?: string, relatedEntityId?: string) {
    const notification: InsertNotification = {
      userId,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
      isRead: false,
    };

    return await storage.createNotification(notification);
  }

  // Create notification for all users
  static async notifyAll(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', relatedEntityType?: string, relatedEntityId?: string) {
    const users = await storage.getAllUsers();
    const notifications = users.map(user => ({
      userId: user.id,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
      isRead: false,
    } as InsertNotification));

    // Create all notifications
    for (const notification of notifications) {
      await storage.createNotification(notification);
    }
  }

  // Create notification for specific role
  static async notifyByRole(role: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', relatedEntityType?: string, relatedEntityId?: string) {
    const users = await storage.getAllUsers();
    const roleUsers = users.filter(user => user.role === role);

    for (const user of roleUsers) {
      await this.notify(user.id, title, message, type, relatedEntityType, relatedEntityId);
    }
  }

  // Notification templates for common actions
  static async notifyQuotationCreated(quotationId: string, quotationNumber: string, createdBy: string) {
    const users = await storage.getAllUsers();
    const managersAndPurchasing = users.filter(user => 
      user.role === 'manager' || user.role === 'purchasing'
    );

    const creator = await storage.getUser(createdBy);
    const creatorName = creator?.fullName?.split(' ').slice(0, 2).join(' ') || 'مستخدم غير معروف';

    for (const user of managersAndPurchasing) {
      await this.notify(
        user.id,
        'طلب تسعير جديد',
        `تم إنشاء طلب تسعير جديد رقم ${quotationNumber} بواسطة ${creatorName}`,
        'info',
        'quotation',
        quotationId
      );
    }
  }

  static async notifyUserLogin(userId: string, userName: string) {
    await this.notifyByRole(
      'manager',
      'مستخدم جديد متصل',
      `${userName} قام بتسجيل الدخول إلى النظام`,
      'info',
      'user',
      userId
    );
  }

  static async notifyItemDuplicate(itemId: string, itemDescription: string) {
    await this.notifyByRole(
      'it_admin',
      'صنف مكرر محتمل',
      `تم اكتشاف صنف مكرر محتمل: ${itemDescription}`,
      'warning',
      'item',
      itemId
    );
  }

  static async notifyPurchaseOrderCreated(poId: string, poNumber: string, createdBy: string) {
    const users = await storage.getAllUsers();
    const managers = users.filter(user => user.role === 'manager');

    const creator = await storage.getUser(createdBy);
    const creatorName = creator?.fullName?.split(' ').slice(0, 2).join(' ') || 'مستخدم غير معروف';

    for (const user of managers) {
      await this.notify(
        user.id,
        'أمر شراء جديد',
        `تم إنشاء أمر شراء جديد رقم ${poNumber} بواسطة ${creatorName}`,
        'success',
        'purchase_order',
        poId
      );
    }
  }

  static async notifySystemMaintenance(title: string, message: string) {
    await this.notifyAll(title, message, 'warning', 'system');
  }
}