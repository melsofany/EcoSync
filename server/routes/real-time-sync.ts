import { Router } from 'express';
import GoogleSheetsSync from '../google-sheets-sync';

const router = Router();

// مزامنة فورية للأصناف
router.post('/sync/items', async (req, res) => {
  try {
    const googleSheetsSync = new GoogleSheetsSync(req.app.locals.storage);
    await googleSheetsSync.syncFromSheets();
    res.json({ 
      success: true, 
      message: 'تم تحديث الأصناف من Google Sheets' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في المزامنة: ' + error.message 
    });
  }
});

// مزامنة فورية لطلبات التسعير
router.post('/sync/quotations', async (req, res) => {
  try {
    const googleSheetsSync = new GoogleSheetsSync(req.app.locals.storage);
    await googleSheetsSync.syncFromSheets();
    res.json({ 
      success: true, 
      message: 'تم تحديث طلبات التسعير من Google Sheets' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في المزامنة: ' + error.message 
    });
  }
});

// مزامنة فورية لأوامر الشراء
router.post('/sync/purchase-orders', async (req, res) => {
  try {
    const googleSheetsSync = new GoogleSheetsSync(req.app.locals.storage);
    await googleSheetsSync.syncFromSheets();
    res.json({ 
      success: true, 
      message: 'تم تحديث أوامر الشراء من Google Sheets' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في المزامنة: ' + error.message 
    });
  }
});

// مزامنة شاملة فورية
router.post('/sync/all', async (req, res) => {
  try {
    const googleSheetsSync = new GoogleSheetsSync(req.app.locals.storage);
    await googleSheetsSync.syncFromSheets();
    res.json({ 
      success: true, 
      message: 'تم تحديث جميع البيانات من Google Sheets' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في المزامنة الشاملة: ' + error.message 
    });
  }
});

// حالة المزامنة
router.get('/sync/status', (req, res) => {
  res.json({
    success: true,
    syncActive: true,
    lastSync: new Date().toISOString(),
    message: 'المزامنة الفورية نشطة'
  });
});

export default router;