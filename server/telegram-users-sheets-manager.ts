import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export class TelegramUsersSheetsManager {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string;
  private usersSheetName: string = 'TelegramUsers';

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      let credentials;
      const credentialsPath = path.resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
      const fileContent = fs.readFileSync(credentialsPath, 'utf8');
      credentials = JSON.parse(fileContent);

      this.auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('🤖 [TELEGRAM USERS SHEETS] ✅ تم تهيئة الاتصال مع Google Sheets');
      
      // إنشاء ورقة المستخدمين إذا لم تكن موجودة
      await this.createUsersSheetIfNotExists();
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets للمستخدمين:', (error as Error).message);
      throw error;
    }
  }

  // إنشاء ورقة المستخدمين مع الهيكل المطلوب
  private async createUsersSheetIfNotExists() {
    try {
      // التحقق من وجود الورقة
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const existingSheet = spreadsheet.data.sheets?.find(
        (sheet: any) => sheet.properties.title === this.usersSheetName
      );

      if (existingSheet) {
        console.log('🤖 [TELEGRAM USERS SHEETS] ورقة المستخدمين موجودة بالفعل');
        return;
      }

      // إنشاء ورقة جديدة
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: this.usersSheetName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10
                }
              }
            }
          }]
        }
      });

      // إضافة الرؤوس
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'معرف التليجرام',          // A - Telegram User ID
            'اسم المستخدم',           // B - Username
            'الاسم الأول',           // C - First Name
            'الاسم الأخير',          // D - Last Name
            'رقم الهاتف',           // E - Phone Number
            'تاريخ الإضافة',         // F - Date Added
            'الحالة',              // G - Status (active/inactive)
            'آخر نشاط',            // H - Last Activity
            'عدد الطلبات',          // I - Requests Count
            'ملاحظات'             // J - Notes
          ]]
        }
      });

      console.log('🤖 [TELEGRAM USERS SHEETS] ✅ تم إنشاء ورقة مستخدمي التليجرام بنجاح');
    } catch (error) {
      console.error('❌ خطأ في إنشاء ورقة المستخدمين:', (error as Error).message);
      throw error;
    }
  }

  // إضافة مستخدم جديد
  async addUser(userId: string, userInfo: any = {}) {
    try {
      // التحقق من وجود المستخدم
      const existingUser = await this.getUser(userId);
      if (existingUser) {
        console.log('🤖 [TELEGRAM USERS SHEETS] المستخدم موجود بالفعل:', userId);
        return existingUser;
      }

      // العثور على أول صف فارغ
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A:A`
      });

      const values = response.data.values || [];
      const nextRow = values.length + 1;

      // إعداد بيانات المستخدم
      const currentDate = new Date().toISOString().split('T')[0];
      const userData = [
        userId,                                    // A - معرف التليجرام
        userInfo.username || '',                   // B - اسم المستخدم
        userInfo.first_name || '',                 // C - الاسم الأول
        userInfo.last_name || '',                  // D - الاسم الأخير
        userInfo.phone_number || '',               // E - رقم الهاتف
        currentDate,                               // F - تاريخ الإضافة
        'active',                                  // G - الحالة
        currentDate,                               // H - آخر نشاط
        '0',                                       // I - عدد الطلبات
        'مضاف تلقائياً عبر البوت'                  // J - ملاحظات
      ];

      // إدراج البيانات
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A${nextRow}:J${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [userData]
        }
      });

      console.log('🤖 [TELEGRAM USERS SHEETS] ✅ تم إضافة مستخدم جديد:', userId);
      return { userId, row: nextRow, ...userInfo };
    } catch (error) {
      console.error('❌ خطأ في إضافة المستخدم:', (error as Error).message);
      throw error;
    }
  }

  // جلب بيانات مستخدم
  async getUser(userId: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A:J`
      });

      const rows = response.data.values || [];
      const userRow = rows.find((row: any[]) => row[0] === userId);

      if (!userRow) {
        return null;
      }

      return {
        userId: userRow[0],
        username: userRow[1],
        firstName: userRow[2],
        lastName: userRow[3],
        phoneNumber: userRow[4],
        dateAdded: userRow[5],
        status: userRow[6],
        lastActivity: userRow[7],
        requestsCount: parseInt(userRow[8]) || 0,
        notes: userRow[9]
      };
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات المستخدم:', (error as Error).message);
      return null;
    }
  }

  // جلب جميع المستخدمين النشطين
  async getActiveUsers(): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A:G`
      });

      const rows = response.data.values || [];
      const activeUsers = rows
        .slice(1) // تخطي الرؤوس
        .filter((row: any[]) => row[6] === 'active') // الحالة النشطة
        .map((row: any[]) => row[0]); // معرف التليجرام

      return activeUsers;
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين النشطين:', (error as Error).message);
      return [];
    }
  }

  // تحديث آخر نشاط للمستخدم
  async updateUserActivity(userId: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A:J`
      });

      const rows = response.data.values || [];
      const userRowIndex = rows.findIndex((row: any[]) => row[0] === userId);

      if (userRowIndex === -1) {
        return false;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('ar-EG');

      // تحديث آخر نشاط وزيادة عدد الطلبات
      const currentRequestsCount = parseInt(rows[userRowIndex][8]) || 0;
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!H${userRowIndex + 1}:I${userRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[`${currentDate} ${currentTime}`, (currentRequestsCount + 1).toString()]]
        }
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث نشاط المستخدم:', (error as Error).message);
      return false;
    }
  }

  // حذف مستخدم (تعطيل)
  async deactivateUser(userId: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A:G`
      });

      const rows = response.data.values || [];
      const userRowIndex = rows.findIndex((row: any[]) => row[0] === userId);

      if (userRowIndex === -1) {
        return false;
      }

      // تغيير الحالة إلى غير نشط
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!G${userRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['inactive']]
        }
      });

      console.log('🤖 [TELEGRAM USERS SHEETS] ✅ تم تعطيل المستخدم:', userId);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تعطيل المستخدم:', (error as Error).message);
      return false;
    }
  }

  // جلب إحصائيات المستخدمين
  async getUsersStats() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.usersSheetName}!A:J`
      });

      const rows = response.data.values || [];
      const users = rows.slice(1); // تخطي الرؤوس

      const activeUsers = users.filter((row: any[]) => row[6] === 'active').length;
      const inactiveUsers = users.filter((row: any[]) => row[6] === 'inactive').length;
      const totalRequests = users.reduce((sum, row) => sum + (parseInt(row[8]) || 0), 0);

      return {
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        totalRequests,
        averageRequestsPerUser: users.length > 0 ? Math.round(totalRequests / users.length) : 0
      };
    } catch (error) {
      console.error('❌ خطأ في جلب إحصائيات المستخدمين:', (error as Error).message);
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalRequests: 0,
        averageRequestsPerUser: 0
      };
    }
  }
}

export const telegramUsersSheetsManager = new TelegramUsersSheetsManager();