import { useEffect } from 'react';
import { useLogin } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function AutoLogin() {
  const login = useLogin();
  const { toast } = useToast();

  useEffect(() => {
    // محاولة تسجيل دخول تلقائي بمجرد تحميل التطبيق
    const tryAutoLogin = async () => {
      try {
        // فحص وجود جلسة نشطة أولاً
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        
        if (!response.ok) {
          console.log('لا توجد جلسة نشطة، محاولة تسجيل دخول تلقائي...');
          
          // تسجيل دخول تلقائي بالمعرفات الافتراضية
          login.mutate({
            username: 'admin',
            password: 'admin123'
          });
        } else {
          console.log('جلسة نشطة موجودة');
        }
      } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
      }
    };

    // تأخير قصير لضمان تحميل النظام بالكامل
    const timer = setTimeout(tryAutoLogin, 1000);
    
    return () => clearTimeout(timer);
  }, [login]);

  return null; // هذا المكون لا يعرض شيئاً مرئياً
}