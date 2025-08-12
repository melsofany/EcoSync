import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

/**
 * نظام توحيد تدريجي محدود لاحترام حدود Google Sheets API
 */
export class SmartUnifyGradual {
  private sheetsService: GoogleSheetsRealtimeData;

  constructor() {
    this.sheetsService = new GoogleSheetsRealtimeData();
  }

  /**
   * توحيد تدريجي محدود - معالجة 5 مطابقات فقط
   */
  async performLimitedUnification(): Promise<{
    success: boolean;
    processedMatches: number;
    message: string;
    error?: string;
  }> {
    try {
      console.log('🔄 بدء التوحيد التدريجي المحدود...');
      
      // قراءة البيانات
      const data = await this.sheetsService.readDataSheet();
      if (!data || data.length === 0) {
        return {
          success: false,
          processedMatches: 0,
          message: 'لا توجد بيانات للمعالجة',
          error: 'البيانات فارغة'
        };
      }

      // العثور على المطابقات البسيطة
      const matches = this.findSimpleMatches(data);
      console.log(`🔍 تم العثور على ${matches.length} مطابقة محتملة`);

      // معالجة 3 مطابقات فقط للتجربة
      const limitedMatches = matches.slice(0, 3);
      let processedCount = 0;

      for (const match of limitedMatches) {
        try {
          // إنشاء معرف موحد
          const unifiedId = this.generateSimpleId();
          
          // تحديث الصف الرئيسي
          await this.sheetsService.updateCellValue(`A${match.masterRow}`, unifiedId);
          console.log(`✅ تم تحديث الصف الرئيسي ${match.masterRow} بالمعرف ${unifiedId}`);
          
          // تأخير طويل
          await this.delay(10000); // 10 ثوان
          
          // تحديث أول صف مكرر فقط
          if (match.duplicateRows.length > 0) {
            const firstDuplicate = match.duplicateRows[0];
            await this.sheetsService.updateCellValue(`A${firstDuplicate}`, `DUP-${unifiedId}`);
            console.log(`✅ تم تحديد الصف ${firstDuplicate} كمكرر`);
          }
          
          processedCount++;
          
          // تأخير طويل بين المطابقات
          await this.delay(15000); // 15 ثانية
          
        } catch (error) {
          console.error(`❌ خطأ في معالجة المطابقة ${processedCount + 1}:`, error);
          break; // توقف عند أول خطأ
        }
      }

      return {
        success: true,
        processedMatches: processedCount,
        message: `تم توحيد ${processedCount} مجموعة بنجاح`
      };

    } catch (error) {
      console.error('❌ خطأ في التوحيد التدريجي:', error);
      return {
        success: false,
        processedMatches: 0,
        message: 'فشل في التوحيد التدريجي',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  /**
   * العثور على مطابقات بسيطة بناءً على PART NO المتطابق تماماً
   */
  private findSimpleMatches(data: any[][]): Array<{
    masterRow: number;
    duplicateRows: number[];
    partNo: string;
  }> {
    const partNoMap = new Map<string, number[]>();
    
    // تجميع الصفوف حسب PART NO
    for (let i = 1; i < data.length; i++) { // تجاهل الصف الأول (العناوين)
      const row = data[i];
      if (row && row.length > 2) {
        const partNo = row[2]?.toString()?.trim(); // العمود C (PART NO)
        if (partNo && partNo !== '' && partNo !== 'PART NO') {
          if (!partNoMap.has(partNo)) {
            partNoMap.set(partNo, []);
          }
          partNoMap.get(partNo)!.push(i + 1); // +1 لأن Google Sheets يبدأ من 1
        }
      }
    }

    // العثور على المطابقات
    const matches: Array<{
      masterRow: number;
      duplicateRows: number[];
      partNo: string;
    }> = [];

    for (const [partNo, rows] of partNoMap.entries()) {
      if (rows.length > 1) {
        matches.push({
          masterRow: rows[0],
          duplicateRows: rows.slice(1),
          partNo
        });
      }
    }

    return matches.sort((a, b) => a.duplicateRows.length - b.duplicateRows.length); // الأبسط أولاً
  }

  /**
   * إنشاء معرف بسيط
   */
  private generateSimpleId(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `P-${timestamp.padStart(7, '0')}`;
  }

  /**
   * تأخير
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const smartUnifyGradual = new SmartUnifyGradual();