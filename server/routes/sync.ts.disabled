import { Router } from 'express';
import { realTimeSync } from '../real-time-google-sheets-sync';

const router = Router();

// طرق جديدة للمزامنة
router.get('/sync/status', async (req, res) => {
  try {
    const status = realTimeSync.getSyncStatus();
    res.json({
      success: true,
      status: {
        isActive: status.isActive,
        lastSyncTime: status.lastSyncTime,
        timeSinceLastSync: status.timeSinceLastSync,
        lastSyncFormatted: status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString('ar-SA') : 'لم تتم مزامنة بعد'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/sync/force', async (req, res) => {
  try {
    console.log('🔄 بدء المزامنة اليدوية...');
    const result = await realTimeSync.performFullSync();
    
    res.json({
      success: result.success,
      message: result.success ? 'تمت المزامنة بنجاح' : 'فشلت المزامنة',
      differences: result.differences,
      sheetsDataCount: {
        purchaseOrders: result.sheetsData?.purchaseOrders?.length || 0,
        quotations: result.sheetsData?.quotations?.length || 0,
        items: result.sheetsData?.items?.length || 0
      },
      localDataCount: {
        purchaseOrders: result.localData?.purchaseOrders?.length || 0,
        quotations: result.localData?.quotations?.length || 0,
        items: result.localData?.items?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ خطأ في المزامنة اليدوية:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;