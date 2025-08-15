import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Permission {
  id: string;
  section: string;
  subsection: string;
  name: string;
  description: string;
  type: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'admin';
  category: 'data' | 'screen' | 'feature' | 'admin';
  isActive: boolean;
}

export interface UserPermission {
  userId: string;
  username: string;
  permissionId: string;
  granted: boolean;
  grantedBy: string;
  grantedAt: string;
  updatedAt: string;
}

export class PermissionsManager {
  private sheets: any;
  private spreadsheetId: string;
  private isInitialized = false;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
  }

  async initialize() {
    try {
      let credentials;
      try {
        const credentialsPath = path.resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
        const fileContent = readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(fileContent);
        console.log('✅ تم تحميل مفتاح Google Sheets للصلاحيات بنجاح');
      } catch (fileError) {
        console.error('❌ خطأ في قراءة مفتاح Google Sheets:', (fileError as Error).message);
        throw fileError;
      }

      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isInitialized = true;

      console.log(`🔗 تم الاتصال بـ Google Sheets للصلاحيات: ${this.spreadsheetId}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تهيئة مدير الصلاحيات:', (error as Error).message);
      return false;
    }
  }

  // إنشاء ورقة الصلاحيات
  async createPermissionsSheet() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // إنشاء ورقة PERMISSIONS
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'PERMISSIONS',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 10
                  }
                }
              }
            }
          ]
        }
      });

      // إضافة رؤوس الأعمدة للصلاحيات
      const permissionHeaders = [
        'ID', 'SECTION', 'SUBSECTION', 'NAME', 'DESCRIPTION', 
        'TYPE', 'CATEGORY', 'IS_ACTIVE', 'CREATED_AT', 'UPDATED_AT'
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'PERMISSIONS!A1:J1',
        valueInputOption: 'RAW',
        resource: { values: [permissionHeaders] }
      });

      // إنشاء ورقة USER_PERMISSIONS
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'USER_PERMISSIONS',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 8
                  }
                }
              }
            }
          ]
        }
      });

      // إضافة رؤوس الأعمدة لصلاحيات المستخدمين
      const userPermissionHeaders = [
        'USER_ID', 'USERNAME', 'PERMISSION_ID', 'GRANTED', 
        'GRANTED_BY', 'GRANTED_AT', 'UPDATED_AT', 'NOTES'
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'USER_PERMISSIONS!A1:H1',
        valueInputOption: 'RAW',
        resource: { values: [userPermissionHeaders] }
      });

      console.log('✅ تم إنشاء أوراق الصلاحيات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إنشاء أوراق الصلاحيات:', error);
      return false;
    }
  }

  // إضافة الصلاحيات الافتراضية
  async addDefaultPermissions() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const now = new Date().toISOString();
      
      const defaultPermissions = [
        // لوحة التحكم
        ['perm-001', 'dashboard', 'main', 'عرض لوحة التحكم', 'الوصول إلى الشاشة الرئيسية', 'view', 'screen', 'TRUE', now, now],
        ['perm-002', 'dashboard', 'statistics', 'عرض الإحصائيات', 'مشاهدة الإحصائيات والمؤشرات', 'view', 'data', 'TRUE', now, now],
        
        // طلبات التسعير
        ['perm-003', 'quotations', 'view', 'عرض طلبات التسعير', 'مشاهدة قائمة طلبات التسعير', 'view', 'screen', 'TRUE', now, now],
        ['perm-004', 'quotations', 'create', 'إنشاء طلب تسعير', 'إضافة طلب تسعير جديد', 'create', 'feature', 'TRUE', now, now],
        ['perm-005', 'quotations', 'edit', 'تعديل طلب تسعير', 'تحرير طلبات التسعير الموجودة', 'edit', 'feature', 'TRUE', now, now],
        ['perm-006', 'quotations', 'delete', 'حذف طلب تسعير', 'إزالة طلبات التسعير', 'delete', 'feature', 'TRUE', now, now],
        ['perm-007', 'quotations', 'export', 'تصدير طلبات التسعير', 'تصدير البيانات إلى Excel', 'export', 'feature', 'TRUE', now, now],

        // إدارة الأصناف
        ['perm-008', 'items', 'view', 'عرض الأصناف', 'مشاهدة قائمة الأصناف', 'view', 'screen', 'TRUE', now, now],
        ['perm-009', 'items', 'create', 'إضافة صنف', 'إنشاء أصناف جديدة', 'create', 'feature', 'TRUE', now, now],
        ['perm-010', 'items', 'edit', 'تعديل صنف', 'تحرير بيانات الأصناف', 'edit', 'feature', 'TRUE', now, now],
        ['perm-011', 'items', 'delete', 'حذف صنف', 'إزالة الأصناف', 'delete', 'feature', 'TRUE', now, now],
        ['perm-012', 'items', 'unification', 'توحيد الأصناف', 'استخدام نظام التوحيد الذكي', 'admin', 'feature', 'TRUE', now, now],

        // إدارة العملاء
        ['perm-013', 'clients', 'view', 'عرض العملاء', 'مشاهدة قائمة العملاء', 'view', 'screen', 'TRUE', now, now],
        ['perm-014', 'clients', 'create', 'إضافة عميل', 'إنشاء عملاء جدد', 'create', 'feature', 'TRUE', now, now],
        ['perm-015', 'clients', 'edit', 'تعديل عميل', 'تحرير بيانات العملاء', 'edit', 'feature', 'TRUE', now, now],
        ['perm-016', 'clients', 'delete', 'حذف عميل', 'إزالة العملاء', 'delete', 'feature', 'TRUE', now, now],

        // إدارة الموردين
        ['perm-017', 'suppliers', 'view', 'عرض الموردين', 'مشاهدة قائمة الموردين', 'view', 'screen', 'TRUE', now, now],
        ['perm-018', 'suppliers', 'create', 'إضافة مورد', 'إنشاء موردين جدد', 'create', 'feature', 'TRUE', now, now],
        ['perm-019', 'suppliers', 'edit', 'تعديل مورد', 'تحرير بيانات الموردين', 'edit', 'feature', 'TRUE', now, now],
        ['perm-020', 'suppliers', 'delete', 'حذف مورد', 'إزالة الموردين', 'delete', 'feature', 'TRUE', now, now],

        // التسعير
        ['perm-021', 'pricing', 'view_supplier', 'عرض أسعار الموردين', 'مشاهدة أسعار الموردين', 'view', 'data', 'TRUE', now, now],
        ['perm-022', 'pricing', 'view_customer', 'عرض أسعار العملاء', 'مشاهدة أسعار العملاء', 'view', 'data', 'TRUE', now, now],
        ['perm-023', 'pricing', 'edit_supplier', 'تحرير أسعار الموردين', 'تعديل أسعار الموردين', 'edit', 'feature', 'TRUE', now, now],
        ['perm-024', 'pricing', 'edit_customer', 'تحرير أسعار العملاء', 'تعديل أسعار العملاء', 'edit', 'feature', 'TRUE', now, now],

        // أوامر الشراء
        ['perm-025', 'purchase_orders', 'view', 'عرض أوامر الشراء', 'مشاهدة قائمة أوامر الشراء', 'view', 'screen', 'TRUE', now, now],
        ['perm-026', 'purchase_orders', 'create', 'إنشاء أمر شراء', 'إضافة أوامر شراء جديدة', 'create', 'feature', 'TRUE', now, now],
        ['perm-027', 'purchase_orders', 'edit', 'تعديل أمر شراء', 'تحرير أوامر الشراء', 'edit', 'feature', 'TRUE', now, now],
        ['perm-028', 'purchase_orders', 'delete', 'حذف أمر شراء', 'إزالة أوامر الشراء', 'delete', 'feature', 'TRUE', now, now],

        // التقارير والإحصائيات
        ['perm-029', 'reports', 'view', 'عرض التقارير', 'مشاهدة التقارير المختلفة', 'view', 'screen', 'TRUE', now, now],
        ['perm-030', 'reports', 'export', 'تصدير التقارير', 'تصدير التقارير إلى Excel/PDF', 'export', 'feature', 'TRUE', now, now],
        ['perm-031', 'analytics', 'view', 'عرض الإحصائيات المتقدمة', 'مشاهدة الإحصائيات والتحليلات', 'view', 'screen', 'TRUE', now, now],

        // الإدارة العامة
        ['perm-032', 'admin', 'user_management', 'إدارة المستخدمين', 'إنشاء وتعديل وحذف المستخدمين', 'admin', 'admin', 'TRUE', now, now],
        ['perm-033', 'admin', 'permissions', 'إدارة الصلاحيات', 'تعديل صلاحيات المستخدمين', 'admin', 'admin', 'TRUE', now, now],
        ['perm-034', 'admin', 'system_settings', 'إعدادات النظام', 'تحكم في إعدادات النظام العامة', 'admin', 'admin', 'TRUE', now, now],
        ['perm-035', 'admin', 'backup_restore', 'النسخ الاحتياطي', 'إنشاء واستعادة النسخ الاحتياطية', 'admin', 'admin', 'TRUE', now, now],
        ['perm-036', 'admin', 'data_import', 'استيراد البيانات', 'استيراد البيانات من ملفات Excel', 'admin', 'feature', 'TRUE', now, now],
        ['perm-037', 'admin', 'telegram_bot', 'إدارة بوت تليجرام', 'تحكم في إعدادات البوت', 'admin', 'admin', 'TRUE', now, now],

        // سجل النشاطات
        ['perm-038', 'activity', 'view', 'عرض سجل النشاطات', 'مشاهدة نشاطات المستخدمين', 'view', 'screen', 'TRUE', now, now],
        ['perm-039', 'activity', 'export', 'تصدير سجل النشاطات', 'تصدير النشاطات إلى ملفات', 'export', 'feature', 'TRUE', now, now],

        // الإعدادات
        ['perm-040', 'settings', 'profile', 'إعدادات الملف الشخصي', 'تعديل البيانات الشخصية', 'edit', 'feature', 'TRUE', now, now],
        ['perm-041', 'settings', 'notifications', 'إعدادات التنبيهات', 'تحكم في التنبيهات', 'edit', 'feature', 'TRUE', now, now],

        // بوت التليجرام
        ['perm-042', 'telegram', 'view_bot', 'عرض بوت التليجرام', 'مشاهدة إعدادات وحالة البوت', 'view', 'screen', 'TRUE', now, now],
        ['perm-043', 'telegram', 'manage_bot', 'إدارة بوت التليجرام', 'تشغيل وإيقاف وإعادة تشغيل البوت', 'admin', 'admin', 'TRUE', now, now],
        ['perm-044', 'telegram', 'view_users', 'عرض مستخدمي التليجرام', 'مشاهدة قائمة مستخدمي البوت', 'view', 'data', 'TRUE', now, now],
        ['perm-045', 'telegram', 'manage_users', 'إدارة مستخدمي التليجرام', 'إضافة وحذف مستخدمي البوت', 'admin', 'admin', 'TRUE', now, now],
        ['perm-046', 'telegram', 'view_messages', 'عرض رسائل التليجرام', 'مشاهدة سجل الرسائل والتفاعلات', 'view', 'data', 'TRUE', now, now],
        ['perm-047', 'telegram', 'send_messages', 'إرسال رسائل تليجرام', 'إرسال رسائل وتنبيهات عبر البوت', 'create', 'feature', 'TRUE', now, now],
        ['perm-048', 'telegram', 'view_analytics', 'عرض إحصائيات التليجرام', 'مشاهدة إحصائيات استخدام البوت', 'view', 'data', 'TRUE', now, now],
        ['perm-049', 'telegram', 'bot_settings', 'إعدادات بوت التليجرام', 'تحكم في إعدادات البوت المتقدمة', 'admin', 'admin', 'TRUE', now, now]
      ];

      // إضافة الصلاحيات إلى الورقة
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'PERMISSIONS!A:J',
        valueInputOption: 'RAW',
        resource: { values: defaultPermissions }
      });

      console.log('✅ تم إضافة الصلاحيات الافتراضية بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إضافة الصلاحيات الافتراضية:', error);
      return false;
    }
  }

  // جلب جميع الصلاحيات
  async getAllPermissions(): Promise<Permission[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'PERMISSIONS!A2:J1000'
      });

      if (!response.data.values) return [];

      return response.data.values.map((row: string[]) => ({
        id: row[0] || '',
        section: row[1] || '',
        subsection: row[2] || '',
        name: row[3] || '',
        description: row[4] || '',
        type: row[5] as 'view' | 'create' | 'edit' | 'delete' | 'export' | 'admin',
        category: row[6] as 'data' | 'screen' | 'feature' | 'admin',
        isActive: row[7] === 'TRUE',
      }));
    } catch (error) {
      console.error('❌ خطأ في جلب الصلاحيات:', error);
      return [];
    }
  }

  // جلب صلاحيات مستخدم معين
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USER_PERMISSIONS!A2:H1000'
      });

      if (!response.data.values) return [];

      return response.data.values
        .filter((row: string[]) => row[0] === userId)
        .map((row: string[]) => ({
          userId: row[0] || '',
          username: row[1] || '',
          permissionId: row[2] || '',
          granted: row[3] === 'TRUE',
          grantedBy: row[4] || '',
          grantedAt: row[5] || '',
          updatedAt: row[6] || '',
        }));
    } catch (error) {
      console.error('❌ خطأ في جلب صلاحيات المستخدم:', error);
      return [];
    }
  }

  // منح صلاحية لمستخدم
  async grantPermission(userId: string, username: string, permissionId: string, grantedBy: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const now = new Date().toISOString();
      
      const permissionData = [
        userId,
        username,
        permissionId,
        'TRUE',
        grantedBy,
        now,
        now,
        'منحت تلقائياً'
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USER_PERMISSIONS!A:H',
        valueInputOption: 'RAW',
        resource: { values: [permissionData] }
      });

      // تحديث ورقة USERS أيضاً
      await this.updateUserPermissionsInUsersSheet(userId, username);

      return true;
    } catch (error) {
      console.error('❌ خطأ في منح الصلاحية:', error);
      return false;
    }
  }

  // تحديث صلاحيات المستخدم في ورقة USERS
  async updateUserPermissionsInUsersSheet(userId: string, username: string): Promise<boolean> {
    try {
      // جلب صلاحيات المستخدم الحالية
      const userPermissions = await this.getUserPermissions(userId);
      const grantedPermissions = userPermissions.filter(p => p.granted).map(p => p.permissionId);
      
      // جلب بيانات المستخدمين من ورقة USERS
      const usersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A2:P1000'
      });

      if (!usersResponse.data.values) return false;

      // العثور على المستخدم
      const userRowIndex = usersResponse.data.values.findIndex((row: string[]) => row[0] === userId);
      if (userRowIndex === -1) return false;

      // تحديث عمود الصلاحيات (العمود I - العمود التاسع)
      const permissionsString = JSON.stringify(grantedPermissions);
      const actualRowNumber = userRowIndex + 2; // +2 لأن البيانات تبدأ من الصف الثاني

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!I${actualRowNumber}`,
        valueInputOption: 'RAW',
        resource: { values: [[permissionsString]] }
      });

      console.log(`✅ تم تحديث صلاحيات المستخدم ${username} في ورقة USERS`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث ورقة USERS:', error);
      return false;
    }
  }

  // منح صلاحيات متعددة لمستخدم
  async grantMultiplePermissions(userId: string, username: string, permissionIds: string[], grantedBy: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const now = new Date().toISOString();
      
      // تحضير البيانات لجميع الصلاحيات
      const permissionsData = permissionIds.map(permissionId => [
        userId,
        username,
        permissionId,
        'TRUE',
        grantedBy,
        now,
        now,
        'منحت تلقائياً'
      ]);

      // إضافة جميع الصلاحيات دفعة واحدة
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USER_PERMISSIONS!A:H',
        valueInputOption: 'RAW',
        resource: { values: permissionsData }
      });

      // تحديث ورقة USERS
      await this.updateUserPermissionsInUsersSheet(userId, username);

      console.log(`✅ تم منح ${permissionIds.length} صلاحية للمستخدم ${username}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في منح الصلاحيات المتعددة:', error);
      return false;
    }
  }

  // إلغاء صلاحية من مستخدم
  async revokePermission(userId: string, username: string, permissionId: string, revokedBy: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // جلب صلاحيات المستخدم
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USER_PERMISSIONS!A2:H1000'
      });

      if (!response.data.values) return false;

      // العثور على الصلاحية المطلوب إلغاؤها
      const permissionRowIndex = response.data.values.findIndex((row: string[]) => 
        row[0] === userId && row[2] === permissionId && row[3] === 'TRUE'
      );

      if (permissionRowIndex === -1) return false;

      // تحديث حالة الصلاحية إلى FALSE
      const actualRowNumber = permissionRowIndex + 2;
      const now = new Date().toISOString();

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USER_PERMISSIONS!D${actualRowNumber}:G${actualRowNumber}`,
        valueInputOption: 'RAW',
        resource: { values: [['FALSE', revokedBy, now, now]] }
      });

      // تحديث ورقة USERS
      await this.updateUserPermissionsInUsersSheet(userId, username);

      console.log(`✅ تم إلغاء الصلاحية ${permissionId} من المستخدم ${username}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في إلغاء الصلاحية:', error);
      return false;
    }
  }
}

export const permissionsManager = new PermissionsManager();