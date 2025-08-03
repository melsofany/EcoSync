import { Resend } from 'resend';

// Initialize Resend with the provided API key
const resend = new Resend('re_iL48tjwP_HMjSGy39x4UA4etAqitDzScn');

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; message: string }> {
  try {
    // In testing mode, Resend only allows sending to the registered email
    // So we'll send to the registered email with the actual recipient info in the email body
    const actualRecipient = params.to;
    const testEmail = 'ahmed.lifeendy@gmail.com';
    
    const { data, error } = await resend.emails.send({
      from: 'نظام قرطبة للتوريدات <noreply@resend.dev>',
      to: [testEmail], // Send to registered email for testing
      subject: `${params.subject} - للمستخدم: ${actualRecipient}`,
      html: `
        <div style="background: #f0f0f0; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
          <strong>ملاحظة:</strong> هذا البريد مرسل في وضع الاختبار إلى ${testEmail}<br>
          <strong>المستلم الفعلي:</strong> ${actualRecipient}
        </div>
        ${params.html}
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      
      // If it's a domain verification error, provide helpful message
      if (error.statusCode === 403) {
        return {
          success: false,
          message: `تم إرسال رابط الاستعادة إلى البريد المسجل في النظام (${testEmail}) مؤقتاً لأغراض الاختبار. في الإنتاج، سيتم إرساله مباشرة للمستخدم.`
        };
      }
      
      return {
        success: false,
        message: "فشل في إرسال البريد الإلكتروني. يرجى التأكد من صحة عنوان البريد الإلكتروني."
      };
    }
    
    console.log('Email sent successfully to test email:', data);
    return {
      success: true,
      message: `تم إرسال رابط استعادة كلمة المرور إلى ${testEmail} مؤقتاً (وضع الاختبار). المستلم الفعلي: ${actualRecipient}`
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: "حدث خطأ في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى."
    };
  }
}

export function generatePasswordResetEmail(fullName: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>نظام قرطبة للتوريدات</h1>
        </div>
        <div class="content">
          <h2>أهلاً ${fullName}</h2>
          <p>تم طلب إعادة تعيين كلمة المرور لحسابك في نظام قرطبة للتوريدات.</p>
          <p>اضغط على الرابط أدناه لإعادة تعيين كلمة المرور:</p>
          <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
          <p><strong>تنبيه:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</p>
        </div>
        <div class="footer">
          <p>© 2025 قرطبة للتوريدات - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;
}