// نظام تطبيق التوحيد في Google Sheets
// Google Sheets Unification Application System

import { EnhancedDuplicatePreventionSystem, ItemData } from './enhanced-duplicate-prevention.js';

interface UnificationResult {
  success: boolean;
  processedGroups: number;
  updatedRows: number;
  errors: string[];
  unifiedItems: Array<{
    masterId: string;
    duplicateIds: string[];
    productKey: string;
  }>;
}

class GoogleSheetsUnificationService {
  private static instance: GoogleSheetsUnificationService;
  private duplicateSystem: EnhancedDuplicatePreventionSystem;
  
  private constructor() {
    this.duplicateSystem = EnhancedDuplicatePreventionSystem.getInstance();
  }

  public static getInstance(): GoogleSheetsUnificationService {
    if (!this.instance) {
      this.instance = new GoogleSheetsUnificationService();
    }
    return this.instance;
  }

  // تطبيق التوحيد على البيانات الموجودة في Google Sheets
  public async unifyExistingData(): Promise<UnificationResult> {
    console.log('🚀 بدء عملية توحيد البيانات الموجودة في Google Sheets...');
    
    const result: UnificationResult = {
      success: false,
      processedGroups: 0,
      updatedRows: 0,
      errors: [],
      unifiedItems: []
    };

    try {
      // استيراد خدمة Google Sheets
      const { googleSheetsRealTimeData } = await import('./google-sheets-realtime-data.js');
      
      // الحصول على جميع البنود الموجودة
      console.log('📚 جلب البيانات من Google Sheets...');
      const allItems = await googleSheetsRealTimeData.getAllItems();
      console.log(`📊 تم جلب ${allItems.length} بند من Google Sheets`);

      if (allItems.length === 0) {
        result.errors.push('لا توجد بيانات في Google Sheets');
        return result;
      }

      // تحويل البيانات إلى التنسيق المطلوب للتحليل
      const itemsForAnalysis: ItemData[] = allItems.map((item, index) => ({
        id: item.id || `item_${index}`,
        itemNumber: item.itemNumber || '',
        partNumber: item.partNumber || '',
        description: item.description || '',
        lineItem: item.lineItem || '',
        category: item.category || 'general'
      }));

      console.log('🔍 تحليل البيانات للعثور على التكرارات...');
      
      // العثور على جميع التكرارات
      const duplicateGroups = this.duplicateSystem.findAllDuplicates(itemsForAnalysis);
      console.log(`🎯 تم العثور على ${duplicateGroups.length} مجموعة تكرار`);

      if (duplicateGroups.length === 0) {
        console.log('✅ لا توجد تكرارات للتوحيد');
        result.success = true;
        return result;
      }

      // تطبيق التوحيد لكل مجموعة
      for (const group of duplicateGroups) {
        try {
          console.log(`🔧 توحيد مجموعة: ${group.productKey}`);
          console.log(`   📋 البند الرئيسي: ${group.masterItem.itemNumber} - ${group.masterItem.partNumber}`);
          console.log(`   🔄 البنود المكررة: ${group.duplicates.map(d => d.itemNumber).join(', ')}`);

          // تحديث البنود المكررة لتشير إلى البند الرئيسي
          const updatedRows = await this.updateDuplicateItemsInSheets(
            group.masterItem.itemNumber,
            group.duplicates.map(d => d.itemNumber)
          );

          result.processedGroups++;
          result.updatedRows += updatedRows;
          result.unifiedItems.push({
            masterId: group.masterItem.itemNumber,
            duplicateIds: group.duplicates.map(d => d.itemNumber),
            productKey: group.productKey
          });

          console.log(`   ✅ تم تحديث ${updatedRows} صف`);
          
          // انتظار قصير لتجنب تحميل الخادم
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          const errorMsg = `خطأ في توحيد مجموعة ${group.productKey}: ${error.message}`;
          console.error('❌', errorMsg);
          result.errors.push(errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      
      console.log('📊 نتائج عملية التوحيد:');
      console.log(`   ✅ مجموعات معالجة: ${result.processedGroups}`);
      console.log(`   📝 صفوف محدثة: ${result.updatedRows}`);
      console.log(`   ❌ أخطاء: ${result.errors.length}`);

      return result;

    } catch (error) {
      console.error('❌ خطأ عام في عملية التوحيد:', error);
      result.errors.push(`خطأ عام: ${error.message}`);
      return result;
    }
  }

  // تحديث البنود المكررة في Google Sheets لتشير إلى البند الرئيسي
  private async updateDuplicateItemsInSheets(masterItemNumber: string, duplicateItemNumbers: string[]): Promise<number> {
    try {
      const { googleSheetsRealTimeData } = await import('./google-sheets-realtime-data.js');
      let updatedRows = 0;

      // تحديث كل بند مكرر في Google Sheets
      for (const duplicateId of duplicateItemNumbers) {
        try {
          // البحث عن صفوف البند المكرر وتحديثها
          const rowsUpdated = await googleSheetsRealTimeData.updateItemId(duplicateId, masterItemNumber);
          updatedRows += rowsUpdated;
          
          console.log(`     🔄 تم توحيد ${duplicateId} → ${masterItemNumber} (${rowsUpdated} صف)`);
        } catch (error) {
          console.error(`     ❌ خطأ في توحيد ${duplicateId}:`, error.message);
        }
      }

      return updatedRows;
    } catch (error) {
      console.error('❌ خطأ في تحديث Google Sheets:', error);
      throw error;
    }
  }

  // فحص بند جديد قبل إدراجه لمنع التكرار
  public async checkNewItemBeforeInsertion(newItem: ItemData): Promise<{
    shouldBlock: boolean;
    existingItem?: ItemData;
    confidence: number;
    reason: string;
    suggestedAction: string;
  }> {
    console.log(`🔍 فحص البند الجديد قبل الإدراج: ${newItem.itemNumber || 'بدون معرف'}`);

    try {
      // تحميل البنود الموجودة إذا لم تكن محملة
      const { googleSheetsRealTimeData } = await import('./google-sheets-realtime-data.js');
      const existingItems = await googleSheetsRealTimeData.getAllItems();
      
      // تحويل إلى تنسيق ItemData
      const itemsForAnalysis: ItemData[] = existingItems.map((item, index) => ({
        id: item.id || `item_${index}`,
        itemNumber: item.itemNumber || '',
        partNumber: item.partNumber || '',
        description: item.description || '',
        lineItem: item.lineItem || '',
        category: item.category || 'general'
      }));

      // تحديث نظام منع التكرار بالبيانات الحالية
      this.duplicateSystem.clearCache();
      await this.duplicateSystem.loadExistingItems(itemsForAnalysis);

      // فحص التكرار
      const duplicateCheck = this.duplicateSystem.checkForDuplicate(newItem);

      let suggestedAction = '';
      if (duplicateCheck.isDuplicate) {
        suggestedAction = `استخدم المعرف الموجود: ${duplicateCheck.existingItem?.itemNumber}`;
      } else {
        suggestedAction = 'يمكن إضافة البند كمنتج جديد';
      }

      return {
        shouldBlock: duplicateCheck.isDuplicate,
        existingItem: duplicateCheck.existingItem,
        confidence: duplicateCheck.confidence,
        reason: duplicateCheck.reason,
        suggestedAction
      };

    } catch (error) {
      console.error('❌ خطأ في فحص البند الجديد:', error);
      return {
        shouldBlock: false,
        confidence: 0,
        reason: `خطأ في الفحص: ${error.message}`,
        suggestedAction: 'المتابعة بحذر - لم يتم التحقق من التكرار'
      };
    }
  }

  // الحصول على إحصائيات التوحيد
  public async getUnificationStats(): Promise<{
    totalItems: number;
    uniqueProducts: number;
    estimatedDuplicates: number;
    potentialSavings: number;
  }> {
    try {
      const { googleSheetsRealTimeData } = await import('./google-sheets-realtime-data.js');
      const allItems = await googleSheetsRealTimeData.getAllItems();
      
      const itemsForAnalysis: ItemData[] = allItems.map((item, index) => ({
        id: item.id || `item_${index}`,
        itemNumber: item.itemNumber || '',
        partNumber: item.partNumber || '',
        description: item.description || '',
        lineItem: item.lineItem || '',
        category: item.category || 'general'
      }));

      const duplicateGroups = this.duplicateSystem.findAllDuplicates(itemsForAnalysis);
      const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0);

      return {
        totalItems: allItems.length,
        uniqueProducts: allItems.length - totalDuplicates,
        estimatedDuplicates: totalDuplicates,
        potentialSavings: duplicateGroups.length
      };

    } catch (error) {
      console.error('❌ خطأ في جلب إحصائيات التوحيد:', error);
      return {
        totalItems: 0,
        uniqueProducts: 0,
        estimatedDuplicates: 0,
        potentialSavings: 0
      };
    }
  }
}

export { GoogleSheetsUnificationService, UnificationResult };