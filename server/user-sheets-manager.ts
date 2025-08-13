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
  private sheets: any;
  private spreadsheetId: string;
  private isInitialized = false;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
  }

  // تهيئة الاتصال بـ Google Sheets
  async initialize() {
    try {
      const credentials = {
        type: "service_account",
        project_id: "cortoba-supp-sys",
        private_key_id: "75c0919d127e568d06729547b79f62f3b83322bd",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLRiY5TEiNxTqU\nSKp94TnwbJh4L+bc8WylNB7qeXqFF8+obb1ErPy8kfq21vLRZNM7bY6R8zT+R96O\n+lFgemZrCg98jI9eZo/z2sdZZ8sBowGQpOC2S/+1bnqVtR/uBr5lSZNTXdxd0NBL\nRqSUrY79C7e5xBYQ/k60sRv3cGvwu0p2yuflca5Nq8B8ONCDTKdXMZNLyf3LYc2o\nXXDH4j+RdGkS7OAj3dUMYSt4yUa923ERYaSoaUkuUxyxy40c205MFkzPQRfcU3f4\nsoDLGcXq90lj5HvMkO9iFc6rXJoLAsKYkwBOQrabOIADw8snPXOxy0Pg4DAnbFX6\nkZ28acaVAgMBAAECggEABuzMNJDYD+xeLdsOjodJFVsTE//Ib6fR5GGS2WNrZx6u\ni7W2svY/DfWIgwjDm5qXD6Pl2Cxe681q/u1MLxXnE1JzwJx77eK0mMF6n8hyGWDX\nls6R0TlkQWa9dQgx9Eaf3zd9y2NGifOpL5yn0rYu9DPyqGN5FPnKQ0xIAEqrgrdE\ncwAvDiJ9jtj/7hUtL9E/Py3awxtqGrqfqAWyDMhlwqkPpQ/Ci9UT5LPGKU6PgGDA\nzOUNh0N3zreN4zjHaKGezdW+9wVAGkuJKOu4JtOkU6SJvKyQt4wHzrglQNjkl65C\nfCZl9ci9YTr+UD24LhAiA8yyQ9IYrDWn5dCeELjaAQKBgQD4L5wDoRvkPi42e3qg\n+sOpxiErPhyHl4keYW+DMPulad8qgXF+WUc5A9youEzj6D0EiXI0OrxuKw7Bhwkl\nbuisoLWeENsf8Djsa+xtDwwm+1IEIXi8xpVYhH83OY+o06Mw3JEB2K+Ci6SG0AUf\nFtzhvk02XSNQSfTF01K0Dke3wQKBgQDRrIwkl+/aQ/DzrDm4oWexdZJwWgWJESKi\nlx0Vb8nMVNFx2JBLmAcV1B4OvmpoAFHsr5/3/3x/pRa6Zk6GZluSrE7u3bbd6Hna\nTtUW4eo/2XR+/HFlbAWZwsNQAvHZ1gsBv+GlnT5zNE2fs4zI1KQigiAtGg4mnTga\n4KHDsD6j1QKBgHnfNyd5F68u8ZaDcCZYvXhC+Mq5R102BnlKs22iwg/qO1IuGkNH\nJ/hRcyvOxMMtqbjunYwUQ699qVNTMiSVn+AVUtn5wQCf//Po00KCnx8NTqsEnLtm\ncLP07Ft8ApWOx5YY2YQkmZrrY7FnuPwZSAH6ZwQJHGwyxOXX7cbJNGKBAoGAMqh3\nq5ex8ZActSLVR1Bn1y5K1S5KzBUBwzqzYiyCGwYbHGBwbHMssw9uu60x1DLPmFnO\nUoK9t7FRTnPNYRd15HgREhErT24NkrsdLMwkZozJYqznUNPKfp3ZxokPmcvnGOMd\nR4A4SGlIn98nkpYdmeDKmVsENDwkBAplyvvYBokCgYEA9uA3IUMaZ5G5KHgA+C4F\nmU+pwnOGs60BLTgK+EUXaUQ4f0HDsqCz0UXrI146bWW1sxU4TyddNUscc4SX/60k\nU86A4nrFQk0FkIcrhFS9KYkuWzqgBuY1N8AmgfI7tRIaqsRXb0281uhHmyN1MGBT\nx78kvtrLVv33tSBmTfs2m3k=\n-----END PRIVATE KEY-----\n",
        client_email: "cortoba-sys@cortoba-supp-sys.iam.gserviceaccount.com",
        client_id: "108486641505877917440",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/cortoba-sys%40cortoba-supp-sys.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };

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
    return users.find(user => user.username === username && user.isActive);
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