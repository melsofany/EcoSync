import { google } from 'googleapis';

  const HARDCODED_PATH = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';

  export async function authenticateGoogle() {
    try {
      let credentials;

      // أولاً: جرب متغير البيئة (للـ production على Render/Railway)
      if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
        const decodedJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
        credentials = JSON.parse(decodedJson);
        console.log('✅ تم تحميل مفتاح Google من متغير البيئة GOOGLE_SERVICE_ACCOUNT_BASE64');
      } else {
        // ثانياً: جرب الملف المحلي (للتطوير)
        try {
          const fs = await import('fs/promises');
          const keyFileData = await fs.readFile(HARDCODED_PATH, 'utf8');
          credentials = JSON.parse(keyFileData);
          console.log('✅ تم تحميل مفتاح Google من الملف المحلي:', HARDCODED_PATH);
        } catch (fileError) {
          throw new Error('❌ لا يمكن العثور على مفتاح Google. أضف GOOGLE_SERVICE_ACCOUNT_BASE64 في متغيرات البيئة');
        }
      }

      console.log('📧 البريد الإلكتروني:', credentials.client_email);

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      return auth.getClient();
    } catch (error) {
      console.error('❌ خطأ في المصادقة مع Google:', error);
      throw error;
    }
  }
  