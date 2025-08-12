import { Router } from 'express';
import { simpleAIUnifier } from './simple-ai-unifier.js';

const router = Router();

// API للحصول على حالة التوحيد
router.get('/status', (req, res) => {
  const status = simpleAIUnifier.getStatus();
  res.json(status);
});

// API لبدء التوحيد الذكي
router.post('/start', async (req, res) => {
  try {
    await simpleAIUnifier.startUnification();
    res.json({ 
      success: true, 
      message: 'تم بدء التوحيد الذكي بنجاح' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في بدء التوحيد', 
      error: error.message 
    });
  }
});

// API لإيقاف التوحيد
router.post('/stop', (req, res) => {
  simpleAIUnifier.stopUnification();
  res.json({ 
    success: true, 
    message: 'تم إيقاف التوحيد' 
  });
});

export default router;