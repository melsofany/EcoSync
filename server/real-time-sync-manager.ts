import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

interface SyncStatus {
  active: boolean;
  interval: number;
  lastSync: Date | null;
  itemsSynced: number;
  errors: string[];
  syncTimer?: NodeJS.Timeout;
}

export class RealTimeSyncManager {
  private sheets: any;
  private spreadsheetId: string;
  private syncStatus: SyncStatus;
  private storage: any;

  constructor(storage?: any) {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
    this.storage = storage;
    this.syncStatus = {
      active: false,
      interval: 10000, // 10 seconds
      lastSync: null,
      itemsSynced: 0,
      errors: []
    };
    this.initializeSheets();
  }

  private async initializeSheets() {
    try {
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      
      const credentialsPath = resolve('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json');
      const fileContent = readFileSync(credentialsPath, 'utf8');
      const credentials = JSON.parse(fileContent);
      
      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ تم تهيئة محرك المزامنة الفورية');
    } catch (error: any) {
      console.error('❌ خطأ في تهيئة المزامنة:', error.message);
      this.syncStatus.errors.push(error.message);
    }
  }

  // بدء المزامنة الفورية
  async startRealTimeSync(): Promise<boolean> {
    if (this.syncStatus.active) {
      console.log('⚠️ المزامنة نشطة بالفعل');
      return true;
    }

    try {
      this.syncStatus.active = true;
      console.log('🚀 بدء المزامنة الفورية كل 10 ثوانٍ...');
      
      // مزامنة فورية أولى
      await this.performSync();
      
      // جدولة المزامنة الدورية
      this.syncStatus.syncTimer = setInterval(async () => {
        await this.performSync();
      }, this.syncStatus.interval);
      
      return true;
    } catch (error: any) {
      console.error('❌ فشل في بدء المزامنة:', error.message);
      this.syncStatus.errors.push(error.message);
      this.syncStatus.active = false;
      return false;
    }
  }

  // إيقاف المزامنة
  stopRealTimeSync(): void {
    if (this.syncStatus.syncTimer) {
      clearInterval(this.syncStatus.syncTimer);
      this.syncStatus.syncTimer = undefined;
    }
    this.syncStatus.active = false;
    console.log('⏹️ تم إيقاف المزامنة الفورية');
  }

  // تنفيذ المزامنة
  private async performSync(): Promise<void> {
    try {
      if (!this.sheets) {
        await this.initializeSheets();
      }

      console.log('🔄 بدء دورة المزامنة...');
      const startTime = Date.now();
      
      // قراءة البيانات من Google Sheets
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:AA'
      });
      
      const rows = response.data.values || [];
      
      if (rows.length > 1) {
        // إحصائيات المزامنة
        const itemCount = rows.length - 1; // ناقص الرأس
        
        // تحديث حالة المزامنة
        this.syncStatus.lastSync = new Date();
        this.syncStatus.itemsSynced = itemCount;
        
        const syncTime = Date.now() - startTime;
        console.log(`✅ تمت مزامنة ${itemCount} بند في ${syncTime}ms`);
        
        // إذا كان لدينا storage، يمكننا تحديث البيانات المحلية
        if (this.storage && typeof this.storage.syncFromSheets === 'function') {
          await this.storage.syncFromSheets(rows);
        }
      } else {
        console.log('📭 لا توجد بيانات للمزامنة');
      }
      
    } catch (error: any) {
      console.error('❌ خطأ في المزامنة:', error.message);
      this.syncStatus.errors.push(`${new Date().toISOString()}: ${error.message}`);
      
      // الاحتفاظ بآخر 10 أخطاء فقط
      if (this.syncStatus.errors.length > 10) {
        this.syncStatus.errors = this.syncStatus.errors.slice(-10);
      }
    }
  }

  // مزامنة فورية للأصناف
  async syncItems(): Promise<{ success: boolean; count: number; message: string }> {
    try {
      console.log('🔄 مزامنة فورية للأصناف...');
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:F' // الأعمدة الأساسية للأصناف
      });
      
      const rows = response.data.values || [];
      const itemCount = rows.length - 1;
      
      this.syncStatus.lastSync = new Date();
      this.syncStatus.itemsSynced = itemCount;
      
      return {
        success: true,
        count: itemCount,
        message: `تمت مزامنة ${itemCount} صنف بنجاح`
      };
      
    } catch (error: any) {
      console.error('❌ خطأ في مزامنة الأصناف:', error.message);
      return {
        success: false,
        count: 0,
        message: `فشلت المزامنة: ${error.message}`
      };
    }
  }

  // مزامنة شاملة
  async syncAll(): Promise<{ success: boolean; message: string; details: any }> {
    try {
      console.log('🔄 مزامنة شاملة للنظام...');
      
      // مزامنة جميع الأوراق
      const sheets = ['DATA', 'تسعير_الموردين', 'تسعير_العملاء', 'طلبات_التسعير'];
      const results: any = {};
      
      for (const sheetName of sheets) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A:AA`
          });
          
          const rows = response.data.values || [];
          results[sheetName] = {
            success: true,
            count: rows.length - 1
          };
          console.log(`✅ ${sheetName}: ${rows.length - 1} سجل`);
        } catch (error: any) {
          results[sheetName] = {
            success: false,
            error: error.message
          };
          console.error(`❌ خطأ في ${sheetName}:`, error.message);
        }
      }
      
      this.syncStatus.lastSync = new Date();
      
      return {
        success: true,
        message: 'تمت المزامنة الشاملة',
        details: results
      };
      
    } catch (error: any) {
      console.error('❌ خطأ في المزامنة الشاملة:', error.message);
      return {
        success: false,
        message: `فشلت المزامنة: ${error.message}`,
        details: {}
      };
    }
  }

  // الحصول على حالة المزامنة
  getStatus(): SyncStatus & { formattedLastSync?: string } {
    const status = { ...this.syncStatus };
    
    if (status.lastSync) {
      const formatter = new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      status.formattedLastSync = formatter.format(status.lastSync);
    }
    
    // حذف timer من الإخراج
    const { syncTimer, ...publicStatus } = status;
    return publicStatus as SyncStatus & { formattedLastSync?: string };
  }

  // تحديث فترة المزامنة
  updateInterval(seconds: number): void {
    this.syncStatus.interval = seconds * 1000;
    
    if (this.syncStatus.active) {
      // إعادة تشغيل المزامنة بالفترة الجديدة
      this.stopRealTimeSync();
      this.startRealTimeSync();
    }
    
    console.log(`⏱️ تم تحديث فترة المزامنة إلى ${seconds} ثانية`);
  }
}

// إنشاء مثيل واحد للمزامنة
let syncManagerInstance: RealTimeSyncManager | null = null;

export function getSyncManager(storage?: any): RealTimeSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new RealTimeSyncManager(storage);
  }
  return syncManagerInstance;
}