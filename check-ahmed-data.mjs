// Script to check Ahmed's data in Google Sheets
import { google } from 'googleapis';

async function checkAhmedData() {
  try {
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
    
    // Use the USERS sheet ID
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // Read all users from USERS sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'USERS!A:P',
    });

    const rows = response.data.values || [];
    
    console.log('📋 إجمالي الصفوف:', rows.length);
    console.log('📋 رؤوس الأعمدة:', rows[0]);
    
    // Find Ahmed's row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Column B (index 1) is username
      if (row[1] === 'Ahmed') {
        console.log(`\n✅ تم العثور على Ahmed في السطر ${i + 1}`);
        console.log('📝 البيانات الكاملة:');
        console.log(`  - ID: ${row[0]}`);
        console.log(`  - Username: ${row[1]}`);
        console.log(`  - FullName (Column D): "${row[3] || 'فارغ'}"`);
        console.log(`  - Email: ${row[4] || 'فارغ'}`);
        console.log(`  - Phone: ${row[5] || 'فارغ'}`);
        console.log(`  - ProfileImage: ${row[6] || 'فارغ'}`);
        console.log(`  - Role: ${row[7] || 'فارغ'}`);
        console.log(`  - IsActive: ${row[9] || 'فارغ'}`);
        
        // Check the actual characters
        const fullName = row[3] || '';
        console.log(`\n📊 تحليل الاسم الكامل:`);
        console.log(`  - الطول: ${fullName.length} حرف`);
        console.log(`  - الأحرف الأولى: ${fullName.split(' ').map(n => n[0]).join('').toUpperCase()}`);
        
        // Show character codes to detect any hidden characters
        console.log(`  - رموز الأحرف: ${[...fullName].map(c => c.charCodeAt(0)).join(', ')}`);
        
        return true;
      }
    }
    
    console.log('⚠️ لم يتم العثور على المستخدم Ahmed');
    return false;
  } catch (error) {
    console.error('❌ خطأ في قراءة البيانات:', error);
    return false;
  }
}

// Run the check
checkAhmedData().then(() => {
  console.log('\n✨ اكتمل الفحص');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الفحص:', error);
  process.exit(1);
});