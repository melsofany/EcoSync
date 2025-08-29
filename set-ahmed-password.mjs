// Script to set a new hashed password for Ahmed
import { google } from 'googleapis';
import bcrypt from 'bcrypt';

async function setAhmedPassword() {
  try {
    // Generate hashed password
    const newPassword = 'Ahmed123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`🔐 تم إنشاء كلمة مرور مشفرة لـ: ${newPassword}`);
    
    // Read credentials from local JSON file
    const fs = await import('fs');
    const credentialsFile = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
    const credentials = JSON.parse(credentialsFile);
    console.log('✅ تم تحميل المفتاح من الملف المحلي');
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // Update Ahmed's password in USERS sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'USERS!C3', // Ahmed is in row 3
      valueInputOption: 'RAW',
      requestBody: {
        values: [[hashedPassword]]
      }
    });
    
    console.log('✅ تم تحديث كلمة المرور في Google Sheets');
    console.log(`\n📝 بيانات الدخول الجديدة:`);
    console.log(`  - Username: Ahmed`);
    console.log(`  - Password: ${newPassword}`);
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث كلمة المرور:', error);
    return false;
  }
}

// Run the update
setAhmedPassword().then(() => {
  console.log('\n✨ اكتمل التحديث - يمكنك الآن تسجيل الدخول');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل التحديث:', error);
  process.exit(1);
});