import { Resend } from 'resend';
import crypto from 'crypto';
import { usersGoogleSheetsManager } from './users-sheets-manager';

// تهيئة Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// إنشاء رمز إعادة تعيين عشوائي
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// إنشاء تاريخ انتهاء الصلاحية (ساعة واحدة من الآن)
export function generateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}

// إرسال بريد إلكتروني لإعادة تعيين كلمة المرور
export async function sendPasswordResetEmail(email: string, resetLink: string, userName: string): Promise<boolean> {
  try {
    console.log(`📧 إرسال بريد إعادة تعيين كلمة المرور إلى: ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: 'نظام قرطبة <onboarding@resend.dev>',
      to: email,
      subject: 'إعادة تعيين كلمة المرور - نظام قرطبة للتوريدات',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              margin-bottom: 20px;
            }
            .content p {
              color: #666;
              line-height: 1.8;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 15px 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              font-size: 16px;
              font-weight: bold;
              margin: 20px 0;
            }
            .button:hover {
              opacity: 0.9;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffedb3;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .link-text {
              word-break: break-all;
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
              direction: ltr;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 نظام قرطبة للتوريدات</h1>
            </div>
            <div class="content">
              <h2>مرحباً ${userName},</h2>
              <p>
                تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في نظام قرطبة للتوريدات.
              </p>
              <p>
                لإعادة تعيين كلمة المرور، اضغط على الزر أدناه:
              </p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
              </div>
              <p>
                أو انسخ الرابط التالي والصقه في متصفحك:
              </p>
              <div class="link-text">
                ${resetLink}
              </div>
              <div class="warning">
                <strong>⚠️ تنبيه مهم:</strong><br>
                • هذا الرابط صالح لمدة ساعة واحدة فقط<br>
                • إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد<br>
                • لا تشارك هذا الرابط مع أي شخص
              </div>
            </div>
            <div class="footer">
              <p>© 2025 نظام قرطبة للتوريدات - جميع الحقوق محفوظة</p>
              <p>هذا بريد إلكتروني تلقائي، الرجاء عدم الرد عليه</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        مرحباً ${userName},
        
        تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في نظام قرطبة للتوريدات.
        
        لإعادة تعيين كلمة المرور، استخدم الرابط التالي:
        ${resetLink}
        
        هذا الرابط صالح لمدة ساعة واحدة فقط.
        
        إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد.
        
        مع تحياتنا،
        فريق نظام قرطبة للتوريدات
      `
    });

    if (error) {
      console.error('❌ خطأ في إرسال البريد:', error);
      return false;
    }

    console.log('✅ تم إرسال بريد إعادة التعيين بنجاح:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ خطأ في خدمة Resend:', error);
    return false;
  }
}

// حفظ رمز إعادة التعيين في Google Sheets
export async function saveResetToken(username: string, token: string, expiry: Date): Promise<boolean> {
  try {
    console.log(`💾 حفظ رمز إعادة التعيين للمستخدم: ${username}`);
    
    // البحث عن المستخدم
    const users = await usersGoogleSheetsManager.getAllUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      console.error('❌ المستخدم غير موجود');
      return false;
    }
    
    // حفظ التحديث في Google Sheets
    const success = await usersGoogleSheetsManager.updateUser(username, {
      resetToken: token,
      resetTokenExpiry: expiry.toISOString()
    });
    
    if (success) {
      console.log('✅ تم حفظ رمز إعادة التعيين بنجاح');
    } else {
      console.error('❌ فشل حفظ رمز إعادة التعيين');
    }
    
    return success;
  } catch (error) {
    console.error('❌ خطأ في حفظ رمز إعادة التعيين:', error);
    return false;
  }
}

// التحقق من رمز إعادة التعيين
export async function verifyResetToken(token: string): Promise<{ valid: boolean; username?: string; userId?: string }> {
  try {
    console.log(`🔍 التحقق من رمز إعادة التعيين`);
    
    // البحث عن المستخدم بواسطة الرمز
    const user = await usersGoogleSheetsManager.findUserByResetToken(token);
    
    if (!user) {
      console.log('❌ رمز إعادة التعيين غير صالح أو منتهي الصلاحية');
      return { valid: false };
    }
    
    console.log('✅ رمز إعادة التعيين صالح');
    return { 
      valid: true, 
      username: user.username,
      userId: user.id 
    };
  } catch (error) {
    console.error('❌ خطأ في التحقق من رمز إعادة التعيين:', error);
    return { valid: false };
  }
}

// مسح رمز إعادة التعيين بعد الاستخدام
export async function clearResetToken(username: string): Promise<boolean> {
  try {
    console.log(`🧹 مسح رمز إعادة التعيين للمستخدم: ${username}`);
    
    // حفظ التحديث في Google Sheets - مسح الرمز وتاريخ انتهاء الصلاحية
    const success = await usersGoogleSheetsManager.updateUser(username, {
      resetToken: '',
      resetTokenExpiry: ''
    });
    
    if (success) {
      console.log('✅ تم مسح رمز إعادة التعيين بنجاح');
    } else {
      console.error('❌ فشل مسح رمز إعادة التعيين');
    }
    
    return success;
  } catch (error) {
    console.error('❌ خطأ في مسح رمز إعادة التعيين:', error);
    return false;
  }
}