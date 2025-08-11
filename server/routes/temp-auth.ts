import { Router } from 'express';

const router = Router();

// Temporary authentication bypass for testing
router.post('/temp-login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple validation - in a real system this would check against database
    if (username && password) {
      // Create a temporary session
      req.session!.user = {
        id: 'temp-1',
        username: username,
        fullName: 'مستخدم النظام',
        role: 'it_admin',
        permissions: {
          quotations: { view: true, create: true, edit: true, delete: true },
          items: { view: true, create: true, edit: true, delete: true },
          purchaseOrders: { view: true, create: true, edit: true, delete: true },
          clients: { view: true, create: true, edit: true, delete: true },
          suppliers: { view: true, create: true, edit: true, delete: true },
          users: { view: true, create: true, edit: true, delete: true },
          reports: { view: true, create: true, edit: true, delete: true },
          admin: { view: true, create: true, edit: true, delete: true },
          dataImport: { view: true, create: true, edit: true, delete: true },
          dataRecovery: { view: true, create: true, edit: true, delete: true },
          telegram: { view: true, create: true, edit: true, delete: true }
        }
      };
      
      res.json({ 
        success: true, 
        message: 'تم تسجيل الدخول بنجاح',
        user: req.session!.user 
      });
      
      console.log(`✅ تم تسجيل دخول مؤقت للمستخدم: ${username}`);
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'يرجى إدخال اسم المستخدم وكلمة المرور' 
      });
    }
  } catch (error) {
    console.error('Temp login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تسجيل الدخول' 
    });
  }
});

// Get current user (temp version)
router.get('/me', (req, res) => {
  if (req.session?.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'غير مسجل الدخول' });
  }
});

// Temp logout
router.post('/logout', (req, res) => {
  req.session?.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ message: 'خطأ في تسجيل الخروج' });
    } else {
      res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    }
  });
});

export default router;