import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface UserSheet {
  id: string;
  username: string;
  password: string; // hashed
  fullName: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  role: string;
  permissions?: string;
  isActive: boolean;
  isOnline: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export class UserSheetsManager {
  public sheets: any;
  public spreadsheetId: string;
  private isInitialized = false;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
  }

  // تهيئة الاتصال بـ Google Sheets
  async initialize() {
    try {
      // استخدام المفتاح الجديد من الملف المحلي
      let credentials;
      try {
        const credentialsPath = path.resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
        const fileContent = readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(fileContent);
        console.log('✅ تم تحميل مفتاح Google Sheets للمستخدمين بنجاح');
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

      console.log(`🔗 تم الاتصال بـ Google Sheets لإدارة المستخدمين: ${this.spreadsheetId}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets للمستخدمين:', (error as Error).message);
      this.isInitialized = false;
      return false;
    }
  }

  // إضافة المستخدمين الافتراضيين 
  async addDefaultUsers() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const now = new Date().toISOString();
      
      // مستخدمين افتراضيين
      const defaultUsers = [
        // المدير العام
        ['admin-001', 'admin', await bcrypt.hash('admin123', 10), 'مدير النظام', 'admin@qurtoba.com', '', '', 'manager', JSON.stringify({ 
          dashboard: true, 
          quotations: { view: true, create: true, edit: true, delete: true },
          admin: { userManagement: true, systemSettings: true, generalAdmin: true },
          user_management: true,
          admin_panel: true
        }), 'TRUE', 'FALSE', '', now, '', now, now],
        
        // مدير تقنية المعلومات
        ['it-001', 'it_manager', await bcrypt.hash('itmanager123', 10), 'مدير تقنية المعلومات', 'it@qurtoba.com', '', '', 'it_admin', JSON.stringify({ dashboard: true, admin: { userManagement: true, systemSettings: true, backupRestore: true } }), 'TRUE', 'FALSE', '', now, '', now, now],
        
        // مدير المشتريات
        ['pm-001', 'purchase_manager', await bcrypt.hash('purchase123', 10), 'مدير المشتريات', 'purchase@qurtoba.com', '', '', 'purchasing', JSON.stringify({ dashboard: true, purchaseOrders: { view: true, create: true, edit: true, delete: true } }), 'TRUE', 'FALSE', '', now, '', now, now]
      ];

      // إضافة المستخدمين
      for (const userData of defaultUsers) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'USERS!A:P',
          valueInputOption: 'RAW',
          resource: { values: [userData] }
        });
      }

      console.log('✅ تم إضافة المستخدمين الافتراضيين بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إضافة المستخدمين الافتراضيين:', error);
      return false;
    }
  }

  // إنشاء ورقة المستخدمين في Google Sheets
  async createUserSheet() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      console.log('📋 إنشاء ورقة المستخدمين...');

      // إنشاء الورقة إذا لم تكن موجودة
      try {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'USERS',
                  sheetId: 999
                }
              }
            }]
          }
        });
      } catch (error) {
        // الورقة موجودة بالفعل
        console.log('📝 ورقة USERS موجودة بالفعل');
      }

      // إعداد العناوين المحسّنة لتناسب النظام
      const headers = [
        'ID', 'USERNAME', 'PASSWORD', 'FULL_NAME', 'EMAIL',
        'PHONE', 'PROFILE_IMAGE', 'ROLE', 'PERMISSIONS', 'IS_ACTIVE', 'IS_ONLINE',
        'LAST_LOGIN', 'LAST_ACTIVITY', 'IP_ADDRESS', 'CREATED_AT', 'UPDATED_AT'
      ];

      // مسح البيانات القديمة
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A:P'
      });

      // إضافة العناوين
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A1:P1',
        valueInputOption: 'RAW',
        resource: { values: [headers] }
      });

      // إضافة مستخدم مدير افتراضي
      const now = new Date().toISOString();
      const adminPassword = await bcrypt.hash('admin123', 10);

      const adminUser = [
        'admin-001',
        'admin',
        adminPassword,
        'مدير النظام',
        'admin@qurtoba.com',
        '',
        '',
        'manager',
        JSON.stringify({
          dashboard: true,
          quotations: { view: true, create: true, edit: true, delete: true },
          items: { view: true, create: true, edit: true, delete: true },
          clients: { view: true, create: true, edit: true, delete: true },
          suppliers: { view: true, create: true, edit: true, delete: true },
          purchaseOrders: { view: true, create: true, edit: true, delete: true },
          supplierPricing: { view: true, create: true, edit: true, delete: true },
          customerPricing: { view: true, create: true, edit: true, delete: true },
          reports: { view: true, export: true },
          analytics: { view: true },
          admin: { userManagement: true, systemSettings: true, backupRestore: true },
          import: { quotations: true, items: true, purchaseOrders: true },
          activity: { view: true },
          pricing: { viewSalePrices: true, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: true }
        }),
        'TRUE',
        'FALSE',
        '',
        now,
        '',
        now,
        now
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A2:P2',
        valueInputOption: 'RAW',
        resource: { values: [adminUser] }
      });

      console.log('✅ تم إنشاء ورقة USERS بتنسيق محسّن مع مستخدم المدير الافتراضي');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إنشاء ورقة المستخدمين:', (error as Error).message);
      return false;
    }
  }

  // جلب جميع المستخدمين
  async getAllUsers(): Promise<UserSheet[]> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A2:P1000'
      });

      if (!response.data.values || response.data.values.length === 0) {
        return [];
      }

      const users = response.data.values.map((row: string[]) => ({
        id: row[0] || '',
        username: row[1] || '',
        password: row[2] || '',
        fullName: row[3] || '',
        email: row[4] || undefined,
        phone: row[5] || undefined,
        profileImage: row[6] || undefined,
        role: row[7] || 'data_entry',
        permissions: row[8] || undefined,
        isActive: row[9] === 'TRUE',
        isOnline: row[10] === 'TRUE',
        lastLoginAt: row[11] || undefined,
        lastActivityAt: row[12] || undefined,
        ipAddress: row[13] || undefined,
        createdAt: row[14] || new Date().toISOString(),
        updatedAt: row[15] || new Date().toISOString()
      }));

      return users;
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', (error as Error).message);
      return [];
    }
  }

  // البحث عن المستخدم باسم المستخدم
  async getUserByUsername(username: string): Promise<UserSheet | undefined> {
    const users = await this.getAllUsers();
    const sheetUser = users.find(user => user.username === username && user.isActive);
    
    // إذا لم نجد المستخدم في Google Sheets، استخدم المستخدمين الاحتياطيين
    if (!sheetUser && username === 'admin') {
      return this.getFallbackAdminUser();
    }
    
    if (!sheetUser && username === 'it_admin') {
      return this.getFallbackITAdminUser();
    }
    
    return sheetUser;
  }

  // مستخدم admin احتياطي عندما تكون Google Sheets غير متاحة
  private getFallbackAdminUser(): UserSheet {
    return {
      id: 'admin-001',
      username: 'admin',
      password: '$2b$10$CwTycUXWue0Thq9StjUM0urJmfnJ2uqLyss1aj6tbbNc8hfGv8uh.',  // admin123
      fullName: 'مدير النظام',
      email: 'admin@qurtoba.com',
      role: 'manager',
      permissions: JSON.stringify({
        dashboard: true,
        quotations: { view: true, create: true, edit: true, delete: true },
        items: { view: true, create: true, edit: true, delete: true },
        clients: { view: true, create: true, edit: true, delete: true },
        suppliers: { view: true, create: true, edit: true, delete: true },
        purchaseOrders: { view: true, create: true, edit: true, delete: true },
        supplierPricing: { view: true, create: true, edit: true, delete: true },
        customerPricing: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, export: true },
        analytics: { view: true },
        admin: { userManagement: true, systemSettings: true, backupRestore: true },
        import: { quotations: true, items: true, purchaseOrders: true },
        activity: { view: true },
        pricing: { viewSalePrices: true, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: true }
      }),
      isActive: true,
      isOnline: false,
      lastLoginAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      ipAddress: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // مستخدم it_admin احتياطي عندما تكون Google Sheets غير متاحة
  private getFallbackITAdminUser(): UserSheet {
    return {
      id: 'it-admin-001',
      username: 'it_admin',
      password: '$2b$10$atHb3PJhWHlNLcG88UfOluAEpNBO3W6bqona22dDkvU8hTHa9AXzC',  // it123456
      fullName: 'مدير تقنية المعلومات',
      email: 'it@qurtoba.com',
      role: 'it_admin',
      permissions: JSON.stringify({
        dashboard: true,
        quotations: { view: true, create: true, edit: true, delete: true },
        items: { view: true, create: true, edit: true, delete: true },
        clients: { view: true, create: true, edit: true, delete: true },
        suppliers: { view: true, create: true, edit: true, delete: true },
        purchaseOrders: { view: true, create: true, edit: true, delete: true },
        supplierPricing: { view: true, create: true, edit: true, delete: true },
        customerPricing: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, export: true },
        analytics: { view: true },
        admin: { userManagement: true, systemSettings: true, backupRestore: true },
        import: { quotations: true, items: true, purchaseOrders: true },
        activity: { view: true },
        pricing: { viewSalePrices: true, viewSupplierPrices: true, viewPurchaseOrderPrices: true, viewCosts: true, viewMargins: true },
        telegramBot: { manage: true, viewUsers: true, analytics: true }
      }),
      isActive: true,
      isOnline: false,
      lastLoginAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      ipAddress: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // تحديث كلمة مرور المستخدم
  async updateUserPassword(username: string, hashedPassword: string): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      // جلب جميع المستخدمين للعثور على الصف المناسب
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A2:P1000'
      });

      if (!response.data.values) return false;

      const users = response.data.values;
      const userRowIndex = users.findIndex(row => row[1] === username); // العمود B = USERNAME

      if (userRowIndex === -1) return false;

      const actualRowNumber = userRowIndex + 2; // +2 لأن البيانات تبدأ من الصف 2

      // تحديث كلمة المرور في العمود C
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!C${actualRowNumber}`,
        valueInputOption: 'RAW',
        resource: { values: [[hashedPassword]] }
      });

      // تحديث تاريخ التحديث في العمود P
      const now = new Date().toISOString();
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!P${actualRowNumber}`,
        valueInputOption: 'RAW',
        resource: { values: [[now]] }
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث كلمة المرور:', error);
      return false;
    }
  }

  // البحث عن المستخدم بالبريد الإلكتروني
  async getUserByEmail(email: string): Promise<UserSheet | undefined> {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email && user.isActive);
  }

  // البحث عن المستخدم بالمعرف
  async getUserById(id: string): Promise<UserSheet | undefined> {
    const users = await this.getAllUsers();
    return users.find(user => user.id === id);
  }

  // تحديث حالة الاتصال للمستخدم
  async updateUserOnlineStatus(userId: string, isOnline: boolean, ipAddress?: string): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) return false;

      const rowIndex = userIndex + 2; // +2 because row 1 is headers and array is 0-indexed
      const now = new Date().toISOString();

      // تحديث الحقول المحددة
      const updates = [
        {
          range: `USERS!K${rowIndex}`, // isOnline
          values: [[isOnline ? 'TRUE' : 'FALSE']]
        },
        {
          range: `USERS!M${rowIndex}`, // lastActivityAt
          values: [[now]]
        }
      ];

      if (isOnline) {
        updates.push({
          range: `USERS!L${rowIndex}`, // lastLoginAt
          values: [[now]]
        });
      }

      if (ipAddress) {
        updates.push({
          range: `USERS!N${rowIndex}`, // ipAddress
          values: [[ipAddress]]
        });
      }

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data: updates
        }
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة المستخدم:', (error as Error).message);
      return false;
    }
  }

  // إضافة مستخدم جديد
  async createUser(userData: {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    permissions?: object;
  }): Promise<UserSheet | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      // التحقق من عدم وجود المستخدم
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser) {
        throw new Error('اسم المستخدم موجود بالفعل');
      }

      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const now = new Date().toISOString();
      const userId = `user-${Date.now()}`;

      const newUser = [
        userId,
        userData.username,
        hashedPassword,
        userData.fullName,
        userData.email || '',
        userData.phone || '',
        '',
        userData.role,
        JSON.stringify(userData.permissions || {}),
        'TRUE',
        'FALSE',
        '',
        now,
        '',
        now,
        now
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A:P',
        valueInputOption: 'RAW',
        resource: { values: [newUser] }
      });

      console.log(`✅ تم إنشاء المستخدم: ${userData.username}`);

      return {
        id: userId,
        username: userData.username,
        password: hashedPassword,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        permissions: JSON.stringify(userData.permissions || {}),
        isActive: true,
        isOnline: false,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('❌ خطأ في إنشاء المستخدم:', (error as Error).message);
      return null;
    }
  }
}

export const userSheetsManager = new UserSheetsManager();