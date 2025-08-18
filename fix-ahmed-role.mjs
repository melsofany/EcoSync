// Script to fix Ahmed's role in Google Sheets
import { google } from 'googleapis';

async function fixAhmedRole() {
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
    
    // Read current data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'USERS!A:P',
    });

    const rows = response.data.values || [];
    
    // Find Ahmed's row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[1] === 'Ahmed') {
        console.log(`✅ تم العثور على Ahmed في السطر ${i + 1}`);
        
        // Fix the data:
        // Move permissions from column H to column I
        // Set proper role in column H
        const permissions = row[7]; // Current value in Role column
        
        // Update column H (Role) to 'it_admin'
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `USERS!H${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['it_admin']]
          }
        });
        console.log('✅ تم تحديث Role إلى it_admin');
        
        // Update column I (Permissions) with the permissions
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `USERS!I${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[permissions]]
          }
        });
        console.log('✅ تم نقل الصلاحيات إلى العمود الصحيح');
        
        // Verify the update
        const verifyResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `USERS!A${i + 1}:P${i + 1}`,
        });
        
        const updatedRow = verifyResponse.data.values[0];
        console.log('\n📝 البيانات المحدثة:');
        console.log(`  - FullName: "${updatedRow[3]}"`);
        console.log(`  - Role: ${updatedRow[7]}`);
        console.log(`  - Permissions: ${updatedRow[8]?.substring(0, 50)}...`);
        
        return true;
      }
    }
    
    console.log('⚠️ لم يتم العثور على المستخدم Ahmed');
    return false;
  } catch (error) {
    console.error('❌ خطأ في تحديث البيانات:', error);
    return false;
  }
}

// Run the fix
fixAhmedRole().then(() => {
  console.log('\n✨ اكتمل الإصلاح - قم بتحديث الصفحة (F5) لرؤية "AY"');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الإصلاح:', error);
  process.exit(1);
});