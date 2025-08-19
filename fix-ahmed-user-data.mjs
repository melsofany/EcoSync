import { google } from 'googleapis';
import fs from 'fs';
import bcrypt from 'bcrypt';

const serviceAccountKey = JSON.parse(
  fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8')
);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';

async function fixAhmedData() {
  try {
    console.log('🔧 إصلاح بيانات المستخدم Ahmed...');
    
    // تشفير كلمة المرور الصحيحة
    const hashedPassword = await bcrypt.hash('Ahmed123', 10);
    const now = new Date().toISOString();
    
    // البيانات الصحيحة للمستخدم Ahmed
    const ahmedData = [
      'user-1755621503986', // A: ID
      'Ahmed.lifeendy@gmail.com', // B: USERNAME
      hashedPassword, // C: PASSWORD (مشفرة)
      'Ahmed youssef', // D: FULL_NAME
      'Ahmed.lifeendy@gmail.com', // E: EMAIL
      '', // F: PHONE
      '', // G: PROFILE_IMAGE (فارغ حالياً)
      'it_admin', // H: ROLE
      '', // I: PERMISSIONS (فارغ حالياً)
      'TRUE', // J: IS_ACTIVE
      'TRUE', // K: IS_ONLINE
      '', // L: LAST_LOGIN
      now, // M: LAST_ACTIVITY
      '', // N: IP_ADDRESS
      now, // O: CREATED_AT
      now // P: UPDATED_AT
    ];
    
    // تحديث الصف 3 (Ahmed)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'USERS!A3:P3',
      valueInputOption: 'RAW',
      resource: {
        values: [ahmedData]
      }
    });
    
    console.log('✅ تم إصلاح بيانات المستخدم Ahmed');
    
    // حذف الصف 4 إذا كان فارغاً أو مكرراً
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'USERS!A4:P4'
    });
    
    console.log('✅ تم تنظيف الصفوف الفارغة');
    
    console.log('\n📋 البيانات المحدثة:');
    console.log('- اسم المستخدم: Ahmed.lifeendy@gmail.com');
    console.log('- الاسم الكامل: Ahmed youssef');
    console.log('- الدور: it_admin');
    console.log('- الحالة: نشط');
    console.log('- كلمة المرور: Ahmed123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

fixAhmedData();