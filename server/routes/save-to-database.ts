import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { eq, sql } from 'drizzle-orm';
// import { db } from '../db';
// import { recoveredData, InsertRecoveredData } from '@shared/schema';

// نظام وهمي مؤقت للحفظ
interface RecoveredDataRecord {
  id: string;
  rowNumber: number;
  uom?: string;
  lineItem?: string;
  partNo?: string;
  description?: string;
  rfqNumber?: string;
  rfqDate?: string;
  rfqQuantity?: string;
  rfqPrice?: string;
  rfqResponseDate?: string;
  poNumber?: string;
  poDate?: string;
  poQuantity?: string;
  poPrice?: string;
  isLinked: boolean;
  hasCompleteFlow: boolean;
  sourceFile: string;
  importedAt: string;
  importedBy?: string;
}

const router = Router();

// حفظ البيانات المستردة في قاعدة البيانات
router.post('/save', async (req, res) => {
  try {
    // قراءة البيانات المعالجة من آخر ملف
    const latestDataPath = path.join(process.cwd(), 'attached_assets', 'latest_excel_data_processed.json');
    const rawData = JSON.parse(await fs.readFile(latestDataPath, 'utf8'));
    
    console.log('📊 بدء حفظ البيانات في قاعدة البيانات:', rawData.length, 'سجل');
    
    // تحضير البيانات للإدراج (تجاهل صف العناوين)
    const dataToInsert: RecoveredDataRecord[] = rawData.slice(1).map((record: any, index: number) => ({
      id: `rec-${Date.now()}-${index}`,
      rowNumber: record.rowNumber,
      uom: record.uom || undefined,
      lineItem: record.lineItem || undefined,
      partNo: record.partNo || undefined,
      description: record.description || undefined,
      
      // معلومات طلب التسعير
      rfqNumber: record.rfq?.number || undefined,
      rfqDate: record.rfq?.date || undefined,
      rfqQuantity: record.rfq?.quantity?.toString() || undefined,
      rfqPrice: record.rfq?.price?.toString() || undefined,
      rfqResponseDate: record.rfq?.responseDate || undefined,
      
      // معلومات طلب الشراء
      poNumber: record.po?.number || undefined,
      poDate: record.po?.date || undefined,
      poQuantity: record.po?.quantity?.toString() || undefined,
      poPrice: record.po?.price?.toString() || undefined,
      
      // معلومات الربط
      isLinked: record.linkStatus?.isLinked || false,
      hasCompleteFlow: record.linkStatus?.hasCompleteFlow || false,
      
      // معلومات إضافية
      sourceFile: 'im (2)_1754942698217.xlsx',
      importedAt: new Date().toISOString(),
      importedBy: req.session?.user?.id || 'demo-admin-1'
    }));
    
    console.log('📥 تحضير', dataToInsert.length, 'سجل للحفظ');
    
    // حفظ البيانات في ملف JSON مؤقتاً
    const dbFilePath = path.join(process.cwd(), 'attached_assets', 'database_records.json');
    await fs.writeFile(dbFilePath, JSON.stringify(dataToInsert, null, 2), 'utf8');
    
    const insertedCount = dataToInsert.length;
    console.log(`✅ تم حفظ ${insertedCount} سجل في قاعدة البيانات المؤقتة`);
    
    // إحصائيات الحفظ
    const stats = {
      totalRecords: insertedCount,
      linkedRecords: dataToInsert.filter(r => r.isLinked).length,
      completeFlowRecords: dataToInsert.filter(r => r.hasCompleteFlow).length,
      uniqueRfqs: [...new Set(dataToInsert.map(r => r.rfqNumber).filter(Boolean))].length,
      uniquePos: [...new Set(dataToInsert.map(r => r.poNumber).filter(Boolean))].length
    };
    
    console.log('🎉 اكتمل حفظ البيانات في قاعدة البيانات');
    console.log('📊 الإحصائيات:', stats);
    
    res.json({
      success: true,
      message: 'تم حفظ البيانات بنجاح في قاعدة البيانات',
      stats
    });
    
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في حفظ البيانات في قاعدة البيانات',
      error: error.message
    });
  }
});

// جلب البيانات المحفوظة مع إحصائيات
router.get('/saved-data', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    // قراءة البيانات من الملف المؤقت
    const dbFilePath = path.join(process.cwd(), 'attached_assets', 'database_records.json');
    
    let allData: RecoveredDataRecord[] = [];
    try {
      const fileContent = await fs.readFile(dbFilePath, 'utf8');
      allData = JSON.parse(fileContent);
    } catch (error) {
      console.log('لا توجد بيانات محفوظة مسبقاً');
    }
    
    // تطبيق التصفح
    const data = allData.slice(offset, offset + limit);
    const total = allData.length;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('خطأ في جلب البيانات:', error);
    res.status(500).json({ message: 'خطأ في جلب البيانات' });
  }
});

// احصائيات البيانات المحفوظة
router.get('/stats', async (req, res) => {
  try {
    // قراءة البيانات من الملف المؤقت
    const dbFilePath = path.join(process.cwd(), 'attached_assets', 'database_records.json');
    
    let allData: RecoveredDataRecord[] = [];
    try {
      const fileContent = await fs.readFile(dbFilePath, 'utf8');
      allData = JSON.parse(fileContent);
    } catch (error) {
      console.log('لا توجد بيانات محفوظة مسبقاً');
    }
    
    const totalRecords = allData.length;
    const linkedRecords = allData.filter(record => record.isLinked).length;
    const completeFlowRecords = allData.filter(record => record.hasCompleteFlow).length;
    
    const stats = {
      totalRecords,
      linkedRecords,
      completeFlowRecords,
      linkingRate: totalRecords > 0 
        ? ((linkedRecords / totalRecords) * 100).toFixed(1) + '%'
        : '0%'
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('خطأ في حساب الإحصائيات:', error);
    res.status(500).json({ message: 'خطأ في حساب الإحصائيات' });
  }
});

export default router;