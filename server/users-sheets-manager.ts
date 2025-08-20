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
          range: 'USERS!A1:P1',
          valueInputOption: 'RAW',
          resource: {
            values: [[
              'ID', 'USERNAME', 'PASSWORD', 'FULL_NAME', 'EMAIL', 
              'PHONE', 'PROFILE_IMAGE', 'ROLE', 'PERMISSIONS', 'IS_ACTIVE', 
              'IS_ONLINE', 'LAST_LOGIN', 'LAST_ACTIVITY', 'IP_ADDRESS', 'CREATED_AT', 'UPDATED_AT'
            ]]
          }
        });

        console.log('✅ تم إنشاء ورقة المستخدمين في Google Sheets');
      }

      // إنشاء ورقة مستخدمي البوت
      if (!existingSheets.includes('BOT_USERS')) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'BOT_USERS',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 10
                  }
                }
              }
            }]
          }
        });

        // إضافة العناوين لمستخدمي البوت
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'BOT_USERS!A1:H1',
          valueInputOption: 'RAW',
          resource: {
            values: [[
              'TELEGRAM_ID', 'FIRST_NAME', 'LAST_NAME', 
              'FULL_NAME', 'PHONE', 'STATUS', 'ADDED_DATE', 'NOTES'
            ]]
          }
        });

        console.log('✅ تم إنشاء ورقة مستخدمي البوت في Google Sheets');
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
        range: 'USERS!A2:P1000'
      });

      const rows = response.data.values || [];
      const users: UserData[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0]) { // فقط إذا كان هناك User ID
          // تسجيل تفصيلي لكل مستخدم
          const profileImage = row[6];
          const role = row[7];
          const username = row[1];
          
          console.log(`👤 المستخدم ${username} (صف ${i + 2}):`);
          console.log(`   - الدور: ${role || 'غير محدد'}`);
          console.log(`   - الحالة: ${row[9] === 'TRUE' ? 'نشط' : 'محظور'}`);
          
          if (profileImage) {
            if (profileImage.startsWith('data:image/')) {
              console.log(`   - صورة: Base64 (${profileImage.length} حرف)`);
            } else {
              console.log(`   - صورة: ${profileImage}`);
            }
          } else {
            console.log(`   - صورة: لا توجد`);
          }
          
          users.push({
            id: row[0] || '', // A: ID
            username: row[1] || '', // B: USERNAME
            fullName: row[3] || '', // D: FULL_NAME
            email: row[4] || '', // E: EMAIL
            password: row[2] || '', // C: PASSWORD
            phone: row[5] || '', // F: PHONE
            role: row[7] || 'data_entry', // H: ROLE
            permissions: row[8] ? row[8].split(',').map((p: string) => p.trim()) : [], // I: PERMISSIONS
            isActive: row[9] === 'TRUE', // J: IS_ACTIVE
            canAccessBot: row[10] === 'TRUE', // K: IS_ONLINE (مستخدم لـ canAccessBot)
            lastLogin: row[11] || '', // L: LAST_LOGIN
            createdAt: row[14] || new Date().toISOString(), // O: CREATED_AT
            updatedAt: row[15] || new Date().toISOString(), // P: UPDATED_AT
            profileImage: row[6] || '' // G: PROFILE_IMAGE
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

  // البحث عن مستخدم باستخدام رمز إعادة التعيين
  async findUserByResetToken(token: string): Promise<UserData | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A2:R1000' // نضيف الأعمدة Q و R للرمز وتاريخ انتهاء الصلاحية
      });

      const rows = response.data.values || [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[16] === token) { // العمود Q (index 16) للرمز
          const tokenExpiry = row[17]; // العمود R (index 17) لتاريخ انتهاء الصلاحية
          
          // التحقق من أن الرمز لم ينته
          if (tokenExpiry && new Date(tokenExpiry) > new Date()) {
            return {
              id: row[0] || '',
              username: row[1] || '',
              fullName: row[3] || '',
              email: row[4] || '',
              password: row[2] || '',
              phone: row[5] || '',
              role: row[7] || 'data_entry',
              permissions: row[8] ? row[8].split(',').map((p: string) => p.trim()) : [],
              isActive: row[9] === 'TRUE',
              canAccessBot: row[10] === 'TRUE',
              lastLogin: row[11] || '',
              createdAt: row[14] || new Date().toISOString(),
              updatedAt: row[15] || new Date().toISOString(),
              profileImage: row[6] || ''
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ خطأ في البحث عن مستخدم بالرمز:', error);
      return null;
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
      // إزالة المسافات الزائدة من أسماء المستخدمين عند المقارنة
      const userIndex = users.findIndex(user => user.username.trim() === username.trim());
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      // تحديث الصلاحيات في Google Sheets (العمود I - فهرس 8 للصلاحيات، ليس العمود H الذي هو للدور)
      const rowNumber = userIndex + 2; // الصف الأول هو العناوين
      const permissionsString = permissions.join(',');

      console.log(`📝 تحديث الصف ${rowNumber} بالصلاحيات: ${permissionsString}`);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!I${rowNumber}`,  // العمود I للصلاحيات، ليس H للدور
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

  // إصلاح دور المستخدم (نقل الصلاحيات من العمود H إلى I ووضع الدور الصحيح)
  async fixUserRole(username: string, correctRole: string): Promise<boolean> {
    try {
      console.log(`🔧 إصلاح دور المستخدم ${username}...`);
      
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.username.trim() === username.trim());
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      const rowNumber = userIndex + 2;
      const user = users[userIndex];
      
      // التحقق من أن الدور الحالي يحتوي على صلاحيات (يبدأ بـ perm-)
      if (user.role && user.role.includes('perm-')) {
        console.log(`📋 نقل الصلاحيات من العمود H إلى العمود I`);
        
        // نقل الصلاحيات من العمود H إلى العمود I
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `USERS!I${rowNumber}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[user.role]] // الصلاحيات التي كانت في العمود H
          }
        });
        
        // وضع الدور الصحيح في العمود H
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `USERS!H${rowNumber}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[correctRole]]
          }
        });
        
        // تحديث وقت التعديل
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `USERS!P${rowNumber}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[new Date().toISOString()]]
          }
        });
        
        console.log(`✅ تم إصلاح دور المستخدم ${username} إلى ${correctRole}`);
        console.log(`📋 تم نقل الصلاحيات إلى العمود الصحيح`);
        return true;
      } else {
        console.log(`⚠️ دور المستخدم ${username} صحيح بالفعل: ${user.role}`);
        return true;
      }
    } catch (error) {
      console.error('❌ خطأ في إصلاح دور المستخدم:', error);
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
        userId, // A: ID
        userData.username, // B: USERNAME
        hashedPassword, // C: PASSWORD
        userData.fullName, // D: FULL_NAME
        userData.email, // E: EMAIL
        userData.phone || '', // F: PHONE
        userData.profileImage || '', // G: PROFILE_IMAGE
        userData.role, // H: ROLE
        '', // I: PERMISSIONS - فارغة في البداية
        userData.isActive ? 'TRUE' : 'FALSE', // J: IS_ACTIVE
        'FALSE', // K: IS_ONLINE
        '', // L: LAST_LOGIN
        now, // M: LAST_ACTIVITY
        '', // N: IP_ADDRESS
        now, // O: CREATED_AT
        now  // P: UPDATED_AT
      ];

      // إضافة المستخدم إلى Google Sheets
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A:P',
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

  // تحديث حالة تفعيل المستخدم (Active/Inactive)
  async updateUserActiveStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex((user: UserSheet) => user.id === userId);
      
      if (userIndex === -1) {
        console.error(`❌ المستخدم ${userId} غير موجود`);
        return false;
      }

      const rowIndex = userIndex + 2; // +2 because row 1 is headers and array is 0-indexed
      const now = new Date().toISOString();

      console.log(`🔄 تحديث حالة المستخدم ${users[userIndex].username} إلى ${isActive ? 'نشط' : 'محظور'}`);

      // تحديث حقل isActive في العمود J
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!J${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[isActive ? 'TRUE' : 'FALSE']]
        }
      });

      // تحديث updatedAt في العمود P
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!P${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[now]]
        }
      });

      console.log(`✅ تم تحديث حالة المستخدم ${users[userIndex].username} بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة تفعيل المستخدم:', (error as Error).message);
      return false;
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

      const userName = users[userIndex].username;
      const rowNumber = userIndex + 2; // الصف الأول هو العناوين
      
      // الحصول على sheetId لورقة USERS
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const usersSheet = spreadsheet.data.sheets.find((sheet: any) => 
        sheet.properties.title === 'USERS'
      );
      
      if (!usersSheet) {
        console.error('❌ ورقة USERS غير موجودة');
        return false;
      }
      
      const sheetId = usersSheet.properties.sheetId;
      
      // حذف الصف بالكامل من Google Sheets
      const request = {
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber
              }
            }
          }]
        }
      };

      await this.sheets.spreadsheets.batchUpdate(request);

      console.log(`✅ تم حذف المستخدم ${userName} (${userId}) بنجاح من الصف ${rowNumber}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في حذف المستخدم:', error);
      console.error('تفاصيل الخطأ:', (error as Error).message);
      return false;
    }
  }

  // ربط معرف التليجرام بمستخدم موجود في Google Sheets
  async linkTelegramId(username: string, telegramUserId: string): Promise<boolean> {
    try {
      console.log(`📱 ربط معرف التليجرام ${telegramUserId} بالمستخدم ${username}`);
      
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.username === username && user.isActive);
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${username} غير موجود أو غير نشط`);
        return false;
      }

      // تحديث معرف التليجرام في العمود G (PROFILE_IMAGE) مؤقتاً
      const rowNumber = userIndex + 2;
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!G${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[telegramUserId]]
        }
      });

      // تحديث وقت التعديل
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!P${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[new Date().toISOString()]]
        }
      });

      console.log(`✅ تم ربط معرف التليجرام ${telegramUserId} بالمستخدم ${username}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في ربط معرف التليجرام:', error);
      return false;
    }
  }

  // تحديث كلمة المرور
  async updatePassword(username: string, hashedPassword: string): Promise<boolean> {
    try {
      console.log(`🔐 تحديث كلمة المرور للمستخدم ${username}...`);
      
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.username.trim() === username.trim());
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      const rowNumber = userIndex + 2; // +2 لأن الصف الأول عناوين والصفوف تبدأ من 1
      
      // تحديث كلمة المرور في العمود C (index 2)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!C${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[hashedPassword]]
        }
      });

      // تحديث وقت التعديل
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!P${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[new Date().toISOString()]]
        }
      });

      console.log(`✅ تم تحديث كلمة المرور للمستخدم ${username} بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث كلمة المرور:', error);
      return false;
    }
  }

  // تحديث كلمة مرور المستخدم (دالة مساعدة لإعادة التعيين)
  async updateUserPassword(username: string, newPassword: string): Promise<UserData | null> {
    try {
      console.log(`🔐 إعادة تعيين كلمة المرور للمستخدم ${username}...`);
      
      // تشفير كلمة المرور الجديدة
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // تحديث كلمة المرور في Google Sheets
      const success = await this.updatePassword(username, hashedPassword);
      
      if (success) {
        // الحصول على بيانات المستخدم المحدثة
        const users = await this.getAllUsers();
        const updatedUser = users.find(user => user.username.trim() === username.trim());
        
        console.log(`✅ تم إعادة تعيين كلمة المرور للمستخدم ${username} إلى: ${newPassword}`);
        console.log(`📝 بيانات تسجيل الدخول المحدثة:`);
        console.log(`   اسم المستخدم: ${username}`);
        console.log(`   كلمة المرور: ${newPassword}`);
        
        // التحقق من الكلمة الجديدة
        if (updatedUser && await bcrypt.compare(newPassword, updatedUser.password)) {
          console.log('✅ تم التحقق من كلمة مرور المستخدم', username);
        }
        
        return updatedUser || null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
      return null;
    }
  }

  // تحديث رمز إعادة تعيين كلمة المرور
  async updateUser(username: string, updates: { resetToken?: string; resetTokenExpiry?: string }): Promise<boolean> {
    try {
      console.log(`💾 تحديث بيانات المستخدم ${username}...`);
      
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.username.trim() === username.trim());
      
      if (userIndex === -1) {
        console.log(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      const rowNumber = userIndex + 2; // +2 لأن الصف الأول عناوين والصفوف تبدأ من 1
      
      // استخدام العمود Q للرمز (RESET_TOKEN) والعمود R لوقت انتهاء الصلاحية (RESET_TOKEN_EXPIRY)
      if (updates.resetToken !== undefined) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `USERS!Q${rowNumber}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[updates.resetToken || '']]
          }
        });
      }
      
      if (updates.resetTokenExpiry !== undefined) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `USERS!R${rowNumber}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[updates.resetTokenExpiry || '']]
          }
        });
      }

      // تحديث وقت التعديل
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!P${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[new Date().toISOString()]]
        }
      });

      console.log(`✅ تم تحديث بيانات المستخدم ${username} بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
      return false;
    }
  }

  // إضافة مستخدم تليجرام خارجي جديد
  async addTelegramUser(telegramUserId: string, fullName?: string): Promise<UserData | null> {
    try {
      console.log(`📱 إضافة مستخدم تليجرام خارجي: ${telegramUserId}`);
      
      // التحقق من عدم وجود المستخدم مسبقاً
      const users = await this.getAllUsers();
      const existingUser = users.find(user => user.profileImage === telegramUserId);
      
      if (existingUser) {
        console.log(`❌ معرف التليجرام ${telegramUserId} مرتبط بالفعل بالمستخدم ${existingUser.username}`);
        return null;
      }

      // إنشاء بيانات المستخدم الجديد
      const userId = `telegram-${telegramUserId}`;
      const username = `telegram_${telegramUserId}`;
      const displayName = fullName || `مستخدم تليجرام ${telegramUserId}`;
      const now = new Date().toISOString();
      
      const newUserRow = [
        userId, // A: ID
        username, // B: USERNAME
        '', // C: PASSWORD - فارغة للمستخدمين الخارجيين
        displayName, // D: FULL_NAME
        `${telegramUserId}@telegram.user`, // E: EMAIL - إيميل وهمي
        '', // F: PHONE
        telegramUserId, // G: PROFILE_IMAGE - نحفظ معرف التليجرام هنا
        'external_telegram', // H: ROLE
        'access_bot', // I: PERMISSIONS - صلاحية الوصول للبوت فقط
        'TRUE', // J: IS_ACTIVE
        'FALSE', // K: IS_ONLINE
        '', // L: LAST_LOGIN
        now, // M: LAST_ACTIVITY
        '', // N: IP_ADDRESS
        now, // O: CREATED_AT
        now  // P: UPDATED_AT
      ];

      // إضافة المستخدم إلى Google Sheets
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A:P',
        valueInputOption: 'RAW',
        resource: {
          values: [newUserRow]
        }
      });

      console.log(`✅ تم إضافة مستخدم تليجرام خارجي: ${telegramUserId}`);
      
      return {
        id: userId,
        username: username,
        fullName: displayName,
        email: `${telegramUserId}@telegram.user`,
        password: '',
        role: 'external_telegram',
        permissions: ['access_bot'],
        isActive: true,
        canAccessBot: true,
        lastLogin: '',
        createdAt: now,
        updatedAt: now,
        profileImage: telegramUserId
      };
    } catch (error) {
      console.error('❌ خطأ في إضافة مستخدم تليجرام خارجي:', error);
      return null;
    }
  }

  // قراءة جميع مستخدمي البوت من ورقة BOT_USERS
  async getAllBotUsers(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'BOT_USERS!A2:H1000'
      });

      const rows = response.data.values || [];
      const botUsers: any[] = [];

      for (const row of rows) {
        if (row[0]) { // فقط إذا كان هناك TELEGRAM_ID
          botUsers.push({
            telegramId: row[0] || '',
            firstName: row[1] || '',
            lastName: row[2] || '',
            fullName: row[3] || '',
            phone: row[4] || '',
            status: row[5] || 'نشط',
            addedDate: row[6] || '',
            notes: row[7] || ''
          });
        }
      }

      console.log(`📱 تم قراءة ${botUsers.length} مستخدم من ورقة BOT_USERS`);
      return botUsers;
    } catch (error) {
      console.error('❌ خطأ في قراءة مستخدمي البوت:', error);
      return [];
    }
  }

  // إضافة مستخدم تليجرام في ورقة BOT_USERS المنفصلة
  async addTelegramBotUser(telegramUserId: string, userData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<any> {
    try {
      console.log(`📱 إضافة مستخدم تليجرام في ورقة BOT_USERS: ${telegramUserId}`);
      
      // التحقق من عدم وجود المستخدم مسبقاً في ورقة BOT_USERS
      const existingBotUsers = await this.getAllBotUsers();
      const existingUser = existingBotUsers.find(user => user.telegramId === telegramUserId);
      
      if (existingUser) {
        console.log(`❌ معرف التليجرام ${telegramUserId} موجود بالفعل في ورقة BOT_USERS`);
        return existingUser;
      }

      // إنشاء بيانات المستخدم الجديد
      const firstName = userData?.firstName || '';
      const lastName = userData?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || `مستخدم ${telegramUserId}`;
      const phone = userData?.phone || '';
      const now = new Date().toISOString();
      
      const newBotUserRow = [
        telegramUserId, // A: TELEGRAM_ID
        firstName, // B: FIRST_NAME
        lastName, // C: LAST_NAME
        fullName, // D: FULL_NAME
        phone, // E: PHONE
        'نشط', // F: STATUS
        now, // G: ADDED_DATE
        '' // H: NOTES
      ];

      // إضافة المستخدم إلى ورقة BOT_USERS
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'BOT_USERS!A:H',
        valueInputOption: 'RAW',
        resource: {
          values: [newBotUserRow]
        }
      });

      console.log(`✅ تم إضافة مستخدم تليجرام في ورقة BOT_USERS: ${telegramUserId}`);
      
      return {
        telegramId: telegramUserId,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        phone: phone,
        status: 'نشط',
        addedDate: now,
        notes: ''
      };
    } catch (error) {
      console.error('❌ خطأ في إضافة مستخدم تليجرام في ورقة BOT_USERS:', error);
      return null;
    }
  }

  // إعادة تعيين كلمة مرور المدير
  async resetAdminPassword(): Promise<boolean> {
    try {
      const newPassword = 'admin123';
      const user = await this.updateUserPassword('admin', newPassword);
      
      if (user) {
        console.log('✅ تم إعادة تعيين كلمة المرور للمستخدم admin إلى:', newPassword);
        console.log('📝 بيانات تسجيل الدخول:');
        console.log('   اسم المستخدم: admin');
        console.log('   كلمة المرور: admin123');
        return true;
      } else {
        console.log('⚠️ لم يتم العثور على المستخدم admin');
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في إعادة تعيين كلمة مرور المدير:', error);
      return false;
    }
  }

  // الحصول على جميع مستخدمي التليجرام (الداخليين والخارجيين)
  async getAllTelegramUsers(): Promise<{internal: UserData[], external: any[]}> {
    try {
      const users = await this.getAllUsers();
      const botUsers = await this.getAllBotUsers();
      
      const internal = users.filter(user => 
        user.isActive && 
        user.profileImage && 
        user.profileImage.match(/^\d{8,}$/) && 
        user.role !== 'external_telegram'
      );

      console.log(`📱 مستخدمو التليجرام: ${internal.length} داخلي، ${botUsers.length} خارجي`);
      
      return { internal, external: botUsers };
    } catch (error) {
      console.error('❌ خطأ في جلب مستخدمي التليجرام:', error);
      return { internal: [], external: [] };
    }
  }

  // حذف مستخدم تليجرام خارجي
  async removeTelegramUser(telegramUserId: string): Promise<boolean> {
    try {
      console.log(`🗑️ حذف مستخدم تليجرام خارجي: ${telegramUserId}`);
      
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => 
        user.profileImage === telegramUserId && 
        user.role === 'external_telegram'
      );
      
      if (userIndex === -1) {
        console.log(`❌ مستخدم التليجرام ${telegramUserId} غير موجود`);
        return false;
      }

      // حذف الصف من Google Sheets
      const rowNumber = userIndex + 2;
      
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!A${rowNumber}:P${rowNumber}`
      });

      console.log(`✅ تم حذف مستخدم التليجرام ${telegramUserId} بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في حذف مستخدم التليجرام:', error);
      return false;
    }
  }
}

export const usersGoogleSheetsManager = new UsersGoogleSheetsManager();