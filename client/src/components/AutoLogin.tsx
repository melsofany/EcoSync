import { useEffect, useState } from 'react';
import { useLogin } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function AutoLogin() {
  const login = useLogin();
  const { toast } = useToast();
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    // استمع لأحداث تسجيل الخروج
    const handleLogout = () => {
      setHasLoggedOut(true);
      console.log('🚪 تم تسجيل الخروج - تعطيل التسجيل التلقائي');
    };

    // استمع لأحداث تسجيل الخروج
    window.addEventListener('user-logout', handleLogout);
    
    return () => {
      window.removeEventListener('user-logout', handleLogout);
    };
  }, []);

  useEffect(() => {
    // عدم محاولة التسجيل التلقائي إذا قام المستخدم بتسجيل الخروج
    if (hasLoggedOut) {
      console.log('⏸️ تم تعطيل التسجيل التلقائي بعد تسجيل الخروج');
      return;
    }

    // محاولة تسجيل دخول تلقائي بمجرد تحميل التطبيق
    const tryAutoLogin = async () => {
      try {
        // فحص وجود جلسة نشطة أولاً
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        
        if (!response.ok && !hasLoggedOut) {
          console.log('لا توجد جلسة نشطة، محاولة تسجيل دخول تلقائي...');
          
          // تسجيل دخول تلقائي بالمعرفات الافتراضية
          login.mutate({
            username: 'admin',
            password: 'admin123'
          });
        } else if (response.ok) {
          console.log('جلسة نشطة موجودة');
        }
      } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
      }
    };

    // تأخير قصير لضمان تحميل النظام بالكامل
    const timer = setTimeout(tryAutoLogin, 1000);
    
    return () => clearTimeout(timer);
  }, [login, hasLoggedOut]);

  return null; // هذا المكون لا يعرض شيئاً مرئياً
}