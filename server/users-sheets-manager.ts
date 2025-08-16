import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import bcrypt from 'bcrypt';

interface UserData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  canAccessBot: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}

interface PermissionData {
  id: string;
  permissionName: string;
  displayName: string;
  category: string;
  description: string;
  isActive: boolean;
}

export class UsersGoogleSheetsManager {
  private auth: any;
  public sheets: any;
  public spreadsheetId: string;

  constructor() {
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      console.log('✅ تم تحميل المفتاح الجديد من الملف المحلي');
      const keyPath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
      const credentials = JSON.parse(readFileSync(keyPath, 'utf8'));
      
      console.log(`📧 البريد الإلكتروني: ${credentials.client_email}`);
      console.log(`🔐 طول المفتاح الخاص: ${credentials.private_key?.length || 0} حرف`);

      this.auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ تم تهيئة Google Sheets لإدارة المستخدمين');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets للمستخدمين:', error);
      throw error;
    }
  }

  // إنشاء ورقة المستخدمين إذا لم تكن موجودة
  async createUsersWorksheet() {
    try {
      // فحص الأوراق الموجودة
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const existingSheets = spreadsheet.data.sheets.map((sheet: any) => sheet.properties.title);
      
      // إنشاء ورقة المستخدمين
      if (!existingSheets.includes('USERS')) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'USERS',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 15
                  }
                }
              }
            }]
          }
        });

        // إضافة العناوين للمستخدمين
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'USERS!A1:N1',
          valueInputOption: 'RAW',
          resource: {
            values: [[
              'USER_ID', 'EMAIL', 'FULL_NAME', 'EMAIL_DUPLICATE', 'USERNAME', 
              'PHONE', 'ROLE', 'PERMISSIONS', 'IS_ACTIVE', 'CAN_ACCESS_BOT', 
              'LAST_LOGIN', 'CREATED_AT', 'UPDATED_AT', 'USER_ROLE'
            ]]
          }
        });

        console.log('✅ تم إنشاء ورقة المستخدمين في Google Sheets');
      }

      // إنشاء ورقة الصلاحيات
      if (!existingSheets.includes('PERMISSIONS')) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'PERMISSIONS',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 10
                  }
                }
              }
            }]
          }
        });

        // إضافة العناوين للصلاحيات
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'PERMISSIONS!A1:G1',
          valueInputOption: 'RAW',
          resource: {
            values: [[
              'Permission ID', 'Permission Name', 'Display Name', 
              'Category', 'Description', 'Is Active', 'Notes'
            ]]
          }
        });

        // إضافة الصلاحيات الافتراضية
        const defaultPermissions = [
          ['perm-001', 'view_dashboard', 'عرض لوحة التحكم', 'general', 'عرض الصفحة الرئيسية ولوحة التحكم', 'TRUE'],
          ['perm-002', 'view_items', 'عرض الأصناف', 'items', 'عرض قائمة الأصناف والبحث فيها', 'TRUE'],
          ['perm-003', 'create_items', 'إنشاء أصناف', 'items', 'إضافة أصناف جديدة للنظام', 'TRUE'],
          ['perm-004', 'edit_items', 'تعديل الأصناف', 'items', 'تعديل بيانات الأصناف الموجودة', 'TRUE'],
          ['perm-005', 'delete_items', 'حذف الأصناف', 'items', 'حذف الأصناف من النظام', 'FALSE'],
          ['perm-006', 'view_quotations', 'عرض طلبات التسعير', 'quotations', 'عرض قائمة طلبات التسعير', 'TRUE'],
          ['perm-007', 'create_quotations', 'إنشاء طلبات تسعير', 'quotations', 'إنشاء طلبات تسعير جديدة', 'TRUE'],
          ['perm-008', 'edit_quotations', 'تعديل طلبات التسعير', 'quotations', 'تعديل طلبات التسعير الموجودة', 'TRUE'],
          ['perm-009', 'access_bot', 'الوصول للبوت', 'bot', 'الوصول لصفحة البوت وإدارته', 'FALSE'],
          ['perm-010', 'manage_users', 'إدارة المستخدمين', 'admin', 'إنشاء وتعديل وحذف المستخدمين', 'FALSE'],
          ['perm-011', 'view_reports', 'عرض التقارير', 'reports', 'عرض التقارير والإحصائيات', 'TRUE'],
          ['perm-012', 'export_data', 'تصدير البيانات', 'data', 'تصدير البيانات إلى ملفات Excel', 'TRUE']
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'PERMISSIONS!A2:F13',
          valueInputOption: 'RAW',
          resource: {
            values: defaultPermissions
          }
        });

        console.log('✅ تم إنشاء ورقة الصلاحيات مع البيانات الافتراضية');
      }

      console.log('✅ تم التأكد من وجود أوراق المستخدمين والصلاحيات');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إنشاء أوراق المستخدمين:', error);
      throw error;
    }
  }

  // قراءة جميع المستخدمين
  async getAllUsers(): Promise<UserData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A2:N1000'
      });

      const rows = response.data.values || [];
      const users: UserData[] = [];

      for (const row of rows) {
        if (row[0]) { // فقط إذا كان هناك User ID
          users.push({
            id: row[0] || '',
            username: row[4] || '', // اسم المستخدم من العمود E (مكان كلمة السر سابقاً)
            fullName: row[2] || '',
            email: row[1] || '', // البريد الإلكتروني من العمود B (مكان اسم المستخدم سابقاً)
            password: row[4] || '', // نفس اسم المستخدم مؤقتاً
            phone: row[5] || '', // Phone
            role: row[13] || 'data_entry', // الدور من العمود N (مكان الصورة سابقاً)
            permissions: row[7] ? row[7].split(',').map((p: string) => p.trim()) : [],
            isActive: row[8] === 'TRUE',
            canAccessBot: row[9] === 'TRUE',
            lastLogin: row[10] || '',
            createdAt: row[11] || new Date().toISOString(),
            updatedAt: row[12] || new Date().toISOString(),
            profileImage: row[6] || '' // الدور في مكان الصورة الشخصية
          });
        }
      }

      console.log(`📋 تم قراءة ${users.length} مستخدم من Google Sheets`);
      return users;
    } catch (error) {
      console.error('❌ خطأ في قراءة المستخدمين:', error);
      return [];
    }
  }

  // قراءة جميع الصلاحيات
  async getAllPermissions(): Promise<PermissionData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'PERMISSIONS!A2:G1000'
      });

      const rows = response.data.values || [];
      const permissions: PermissionData[] = [];

      for (const row of rows) {
        if (row[0]) { // فقط إذا كان هناك Permission ID
          permissions.push({
            id: row[0] || '',
            permissionName: row[1] || '',
            displayName: row[2] || '',
            category: row[3] || '',
            description: row[4] || '',
            isActive: row[5] === 'TRUE'
          });
        }
      }

      console.log(`🔐 تم قراءة ${permissions.length} صلاحية من Google Sheets`);
      return permissions;
    } catch (error) {
      console.error('❌ خطأ في قراءة الصلاحيات:', error);
      return [];
    }
  }

  // إضافة مستخدم جديد
  async createUser(userData: Partial<UserData>): Promise<UserData> {
    try {
      const userId = `user-${Date.now()}`;
      const now = new Date().toISOString();
      
      const newUser: UserData = {
        id: userId,
        username: userData.username || '',
        fullName: userData.fullName || '',
        email: userData.email || '',
        password: userData.password || '',
        role: userData.role || 'data_entry',
        permissions: userData.permissions || [],
        isActive: userData.isActive !== false,
        canAccessBot: userData.canAccessBot || false,
        lastLogin: '',
        createdAt: now,
        updatedAt: now
      };

      // العثور على الصف التالي الفارغ
      const existingUsers = await this.getAllUsers();
      const nextRow = existingUsers.length + 2; // +2 لأن الصف الأول عناوين والصفوف تبدأ من 1

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!A${nextRow}:N${nextRow}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[
            newUser.id,
            newUser.email, // البريد الإلكتروني في مكان اسم المستخدم
            newUser.fullName,
            newUser.email,
            newUser.username, // اسم المستخدم في مكان كلمة السر
            '', // phone - يجب أن يكون فارغاً هنا
            newUser.role,
            newUser.permissions.join(', '),
            newUser.isActive ? 'TRUE' : 'FALSE',
            newUser.canAccessBot ? 'TRUE' : 'FALSE',
            newUser.lastLogin,
            newUser.createdAt,
            newUser.updatedAt,
            newUser.role // دور المستخدم في مكان الصورة الشخصية
          ]]
        }
      });

      console.log(`✅ تم إنشاء مستخدم جديد: ${newUser.username}`);
      return newUser;
    } catch (error) {
      console.error('❌ خطأ في إنشاء المستخدم:', error);
      throw error;
    }
  }

  // فحص صلاحية الوصول للبوت
  async checkBotAccess(username: string): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.username === username && u.isActive);
      
      if (!user) {
        console.log(`❌ المستخدم ${username} غير موجود أو غير نشط`);
        return false;
      }

      const hasAccess = user.canAccessBot || user.permissions.includes('access_bot');
      console.log(`🔍 فحص الوصول للبوت للمستخدم ${username}: ${hasAccess ? 'مسموح' : 'مرفوض'}`);
      
      return hasAccess;
    } catch (error) {
      console.error('❌ خطأ في فحص صلاحية الوصول للبوت:', error);
      return false;
    }
  }

  // تحديث صلاحية الوصول للبوت لمستخدم معين
  async updateBotAccess(username: string, canAccess: boolean): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      const rowNumber = userIndex + 2; // +2 لأن الصف الأول عناوين والصفوف تبدأ من 1

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!J${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[canAccess ? 'TRUE' : 'FALSE']]
        }
      });

      // تحديث وقت التعديل
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!M${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[new Date().toISOString()]]
        }
      });

      console.log(`✅ تم ${canAccess ? 'منح' : 'إلغاء'} صلاحية الوصول للبوت للمستخدم ${username}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث صلاحية الوصول للبوت:', error);
      return false;
    }
  }

  // تحديث صلاحيات المستخدم
  async updateUserPermissions(username: string, permissions: string[]): Promise<boolean> {
    try {
      console.log(`🔄 تحديث صلاحيات المستخدم ${username}...`);
      console.log(`📋 الصلاحيات المحددة:`, permissions);
      
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.username === username);
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      // تحديث الصلاحيات في Google Sheets (العمود H - فهرس 7)
      const rowNumber = userIndex + 2; // الصف الأول هو العناوين
      const permissionsString = permissions.join(',');

      console.log(`📝 تحديث الصف ${rowNumber} بالصلاحيات: ${permissionsString}`);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!H${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[permissionsString]]
        }
      });

      // تحديث وقت التعديل
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!M${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[new Date().toISOString()]]
        }
      });

      console.log(`✅ تم تحديث صلاحيات المستخدم ${username} بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث صلاحيات المستخدم:', error);
      console.error('تفاصيل الخطأ:', (error as Error).message);
      return false;
    }
  }

  // إضافة مستخدم جديد
  async addUser(userData: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    isActive: boolean;
    canAccessBot: boolean;
    profileImage?: string;
  }): Promise<UserData | null> {
    try {
      console.log(`👤 إضافة مستخدم جديد: ${userData.username}`);
      
      // التحقق من عدم تكرار اسم المستخدم
      const existingUsers = await this.getAllUsers();
      const userExists = existingUsers.some(user => user.username === userData.username);
      
      if (userExists) {
        throw new Error(`اسم المستخدم "${userData.username}" موجود بالفعل`);
      }

      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // إنشاء بيانات المستخدم الجديد
      const userId = `user-${Date.now()}`;
      const now = new Date().toISOString();
      
      const newUserRow = [
        userId,
        userData.email, // البريد الإلكتروني في مكان اسم المستخدم
        userData.fullName,
        userData.email,
        userData.username, // اسم المستخدم في مكان كلمة السر المشفرة
        userData.phone || '', // Phone
        userData.role,
        '', // صلاحيات فارغة في البداية
        userData.isActive ? 'TRUE' : 'FALSE',
        userData.canAccessBot ? 'TRUE' : 'FALSE',
        '', // Last Login
        now, // Created At
        now, // Updated At
        userData.role // دور المستخدم في مكان صورة المستخدم
      ];

      // إضافة المستخدم إلى Google Sheets
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A:N',
        valueInputOption: 'RAW',
        resource: {
          values: [newUserRow]
        }
      });

      console.log(`✅ تم إضافة المستخدم ${userData.username} بنجاح`);
      
      // إرجاع بيانات المستخدم الجديد
      return {
        id: userId,
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        permissions: [],
        isActive: userData.isActive,
        canAccessBot: userData.canAccessBot,
        lastLogin: '',
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('❌ خطأ في إضافة المستخدم:', error);
      throw error;
    }
  }

  // حذف مستخدم
  async deleteUser(userId: string): Promise<boolean> {
    try {
      console.log(`🗑️ حذف المستخدم: ${userId}`);
      
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${userId} غير موجود`);
        return false;
      }

      // حذف الصف من Google Sheets
      const rowNumber = userIndex + 2; // الصف الأول هو العناوين
      
      // بدلاً من حذف الصف، نمسح محتوياته فقط
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!A${rowNumber}:N${rowNumber}`
      });

      console.log(`✅ تم حذف المستخدم ${userId} بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في حذف المستخدم:', error);
      return false;
    }
  }
}

export const usersGoogleSheetsManager = new UsersGoogleSheetsManager();