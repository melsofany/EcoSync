import { GoogleAuth } from 'google-auth-library';
import { readFileSync, existsSync } from 'fs';

/**
 * Helper function to get Google Service Account credentials
 * Tries multiple sources in order:
 * 1. Base64 encoded environment variable (for Railway)
 * 2. Local file (for development)
 * 3. Fallback to specific local file
 */
export function getGoogleCredentials() {
  // Try base64 encoded env var first (for Railway)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decodedJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const credentials = JSON.parse(decodedJson);
      console.log('✅ تم تحميل مفتاح Google من متغير البيئة');
      console.log('📧 البريد الإلكتروني:', credentials.client_email);
      return credentials;
    } catch (error) {
      console.error('❌ خطأ في فك تشفير مفتاح Google من متغير البيئة:', error);
    }
  }

  // Try local files (for development)
  const localPaths = [
    './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json',
    './attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json',
    './google-service-account.json'
  ];

  for (const path of localPaths) {
    if (existsSync(path)) {
      try {
        const keyFile = readFileSync(path, 'utf8');
        const credentials = JSON.parse(keyFile);
        console.log(`✅ تم تحميل مفتاح Google من الملف المحلي: ${path}`);
        console.log('📧 البريد الإلكتروني:', credentials.client_email);
        return credentials;
      } catch (error) {
        console.error(`❌ خطأ في قراءة الملف ${path}:`, error);
      }
    }
  }

  throw new Error('❌ لا يمكن العثور على مفتاح Google Service Account. تأكد من إضافة GOOGLE_SERVICE_ACCOUNT_BASE64 في متغيرات البيئة');
}

/**
 * Create Google Auth instance with proper credentials
 */
export function createGoogleAuth() {
  const credentials = getGoogleCredentials();
  
  return new GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}