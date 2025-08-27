import { google } from 'googleapis';
import fs from 'fs/promises';

const KEY_PATH = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';

export async function authenticateGoogle() {
  try {
    // قراءة مفتاح الخدمة
    const keyFileData = await fs.readFile(KEY_PATH, 'utf8');
    const credentials = JSON.parse(keyFileData);
    
    console.log('✅ تم تحميل مفتاح Google من الملف المحلي:', KEY_PATH);
    console.log('📧 البريد الإلكتروني:', credentials.client_email);

    // إنشاء المصادقة
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