// Script to check Ahmed's password in Google Sheets
import { google } from 'googleapis';

async function checkAhmedPassword() {
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
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // Read all users from USERS sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'USERS!A:C',
    });

    const rows = response.data.values || [];
    
    // Find Ahmed's row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[1] === 'Ahmed') {
        console.log(`\n✅ تم العثور على Ahmed في السطر ${i + 1}`);
        console.log(`  - Username: ${row[1]}`);
        console.log(`  - Password (Column C): "${row[2] || 'فارغ'}"`);
        
        if (!row[2]) {
          console.log('\n⚠️ كلمة المرور فارغة! سأقوم بتعيين كلمة مرور جديدة...');
          
          // Set a new password
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `USERS!C${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Ahmed123']]
            }
          });
          console.log('✅ تم تعيين كلمة المرور إلى: Ahmed123');
        }
        
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
checkAhmedPassword().then(() => {
  console.log('\n✨ اكتمل الفحص');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الفحص:', error);
  process.exit(1);
});