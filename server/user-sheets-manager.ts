import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';

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
        const credentialsPath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
        const fileContent = readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(fileContent);
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
                  title: 'المستخدمين',
                  sheetId: 999
                }
              }
            }]
          }
        });
      } catch (error) {
        // الورقة موجودة بالفعل
        console.log('📝 ورقة المستخدمين موجودة بالفعل');
      }

      // إعداد العناوين
      const headers = [
        'المعرف', 'اسم المستخدم', 'كلمة المرور', 'الاسم الكامل', 'البريد الإلكتروني',
        'رقم الهاتف', 'الصورة الشخصية', 'الدور', 'الصلاحيات', 'نشط', 'متصل',
        'آخر تسجيل دخول', 'آخر نشاط', 'عنوان IP', 'تاريخ الإنشاء', 'تاريخ التحديث'
      ];

      // مسح البيانات القديمة
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'المستخدمين!A:P'
      });

      // إضافة العناوين
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'المستخدمين!A1:P1',
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
        'TRUE', // isActive
        'FALSE', // isOnline
        '', // lastLoginAt
        now, // lastActivityAt
        '', // ipAddress
        now, // createdAt
        now  // updatedAt
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'المستخدمين!A2:P2',
        valueInputOption: 'RAW',
        resource: { values: [adminUser] }
      });

      console.log('✅ تم إنشاء ورقة المستخدمين بنجاح مع مستخدم المدير الافتراضي');
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
        range: 'المستخدمين!A2:P1000'
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
    
    // إذا لم نجد المستخدم في Google Sheets وكان اسم المستخدم admin، استخدم المستخدم الاحتياطي
    if (!sheetUser && username === 'admin') {
      return this.getFallbackAdminUser();
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
          range: `المستخدمين!K${rowIndex}`, // isOnline
          values: [[isOnline ? 'TRUE' : 'FALSE']]
        },
        {
          range: `المستخدمين!M${rowIndex}`, // lastActivityAt
          values: [[now]]
        }
      ];

      if (isOnline) {
        updates.push({
          range: `المستخدمين!L${rowIndex}`, // lastLoginAt
          values: [[now]]
        });
      }

      if (ipAddress) {
        updates.push({
          range: `المستخدمين!N${rowIndex}`, // ipAddress
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

  // إضافة مستخدم جديد (لاستخدام routes.ts)
  async addUser(userData: {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    isActive?: boolean;
    canAccessBot?: boolean;
    profileImage?: string;
    permissions?: object;
  }): Promise<UserSheet | null> {
    return this.createUser(userData);
  }

  // إضافة مستخدم جديد
  async createUser(userData: {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    isActive?: boolean;
    canAccessBot?: boolean;
    profileImage?: string;
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
        userData.profileImage || '',
        userData.role,
        JSON.stringify(userData.permissions || {}),
        userData.isActive !== false ? 'TRUE' : 'FALSE',
        'FALSE', // isOnline - بدلاً من canAccessBot
        '', // lastLoginAt
        now, // lastActivityAt
        '', // ipAddress
        now, // createdAt
        now  // updatedAt
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'المستخدمين!A:P',
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