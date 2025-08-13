import { google } from 'googleapis';
import { readFileSync } from 'fs';
import bcrypt from 'bcrypt';

interface GoogleSheetsUser {
  username: string;
  fullName: string;
  email: string;
  role: string;
  plainPassword: string;
  hashedPassword: string;
  department: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  permissions: string;
}

class GoogleSheetsUsersManager {
  private sheets: any;
  private spreadsheetId: string = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

  constructor() {
    this.initializeGoogleSheets();
  }

  private async initializeGoogleSheets() {
    try {
      const credentials = JSON.parse(readFileSync('./attached_assets/cortoba-supp-sys-75c0919d127e.json', 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ تم تهيئة مدير المستخدمين مع Google Sheets');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets للمستخدمين:', (error as Error).message);
    }
  }

  async getAllUsers(): Promise<GoogleSheetsUser[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A2:K1000' // تخطي الهيدر
      });

      const rows = response.data.values || [];
      
      return rows.map((row: any[]) => ({
        username: row[0] || '',
        fullName: row[1] || '',
        email: row[2] || '',
        role: row[3] || '',
        plainPassword: row[4] || '',
        hashedPassword: row[5] || '',
        department: row[6] || '',
        status: row[7] || '',
        lastLogin: row[8] || '',
        createdAt: row[9] || '',
        permissions: row[10] || ''
      }));
    } catch (error) {
      console.error('❌ خطأ في قراءة المستخدمين من Google Sheets:', (error as Error).message);
      return [];
    }
  }

  async addUser(userData: Partial<GoogleSheetsUser>): Promise<boolean> {
    try {
      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(userData.plainPassword || 'temp123', 10);
      
      const newRow = [
        userData.username,
        userData.fullName,
        userData.email,
        userData.role,
        userData.plainPassword,
        hashedPassword,
        userData.department,
        userData.status || 'نشط',
        new Date().toLocaleDateString('ar-EG'),
        new Date().toLocaleDateString('ar-EG'),
        userData.permissions || ''
      ];

      // العثور على أول صف فارغ
      const users = await this.getAllUsers();
      const nextRow = users.length + 2; // +2 للهيدر والصف الجديد

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'USERS!A:K',
        valueInputOption: 'RAW',
        resource: {
          values: [newRow]
        }
      });

      console.log(`✅ تم إضافة المستخدم ${userData.username} إلى Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في إضافة المستخدم:', (error as Error).message);
      return false;
    }
  }

  async updateUser(username: string, userData: Partial<GoogleSheetsUser>): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        console.error(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      const rowNumber = userIndex + 2; // +2 للهيدر
      const user = users[userIndex];

      // تحديث البيانات
      const updatedRow = [
        userData.username || user.username,
        userData.fullName || user.fullName,
        userData.email || user.email,
        userData.role || user.role,
        userData.plainPassword || user.plainPassword,
        userData.plainPassword ? await bcrypt.hash(userData.plainPassword, 10) : user.hashedPassword,
        userData.department || user.department,
        userData.status || user.status,
        userData.lastLogin || user.lastLogin,
        user.createdAt,
        userData.permissions || user.permissions
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!A${rowNumber}:K${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [updatedRow]
        }
      });

      console.log(`✅ تم تحديث المستخدم ${username} في Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث المستخدم:', (error as Error).message);
      return false;
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        console.error(`❌ المستخدم ${username} غير موجود`);
        return false;
      }

      const rowNumber = userIndex + 2; // +2 للهيدر

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: await this.getSheetId('USERS'),
                  dimension: 'ROWS',
                  startIndex: rowNumber - 1,
                  endIndex: rowNumber
                }
              }
            }
          ]
        }
      });

      console.log(`✅ تم حذف المستخدم ${username} من Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في حذف المستخدم:', (error as Error).message);
      return false;
    }
  }

  async updateLastLogin(username: string): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex === -1) {
        return false;
      }

      const rowNumber = userIndex + 2;
      const currentTime = new Date().toLocaleString('ar-EG');

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `USERS!I${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[currentTime]]
        }
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث آخر دخول:', (error as Error).message);
      return false;
    }
  }

  async authenticateUser(username: string, password: string): Promise<GoogleSheetsUser | null> {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.username === username);
      
      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
      
      if (isValidPassword) {
        // تحديث آخر دخول
        await this.updateLastLogin(username);
        return user;
      }

      return null;
    } catch (error) {
      console.error('❌ خطأ في التحقق من المستخدم:', (error as Error).message);
      return null;
    }
  }

  private async getSheetId(sheetName: string): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        fields: 'sheets.properties'
      });
      
      const sheet = response.data.sheets.find((s: any) => s.properties.title === sheetName);
      return sheet ? sheet.properties.sheetId : 0;
    } catch (error) {
      console.error('❌ خطأ في الحصول على ID الورقة:', (error as Error).message);
      return 0;
    }
  }

  async syncWithDatabase(): Promise<void> {
    try {
      console.log('🔄 مزامنة المستخدمين مع قاعدة البيانات...');
      const users = await this.getAllUsers();
      
      // هنا يمكن إضافة منطق المزامنة مع قاعدة البيانات المحلية
      console.log(`📊 تم العثور على ${users.length} مستخدم في Google Sheets`);
      
      for (const user of users) {
        console.log(`👤 ${user.fullName} (${user.username}) - ${user.role} - ${user.status}`);
      }
    } catch (error) {
      console.error('❌ خطأ في مزامنة المستخدمين:', (error as Error).message);
    }
  }
}

export const googleSheetsUsersManager = new GoogleSheetsUsersManager();
export type { GoogleSheetsUser };