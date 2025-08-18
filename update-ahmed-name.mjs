// Script to update Ahmed's name to Ahmed Youssef
import { google } from 'googleapis';

async function updateAhmedName() {
  try {
    // Read credentials from local JSON file
    const fs = await import('fs');
    let credentials = {};
    
    // Try to load from local JSON file first
    try {
      const credentialsFile = fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8');
      credentials = JSON.parse(credentialsFile);
      console.log('✅ تم تحميل المفتاح من الملف المحلي');
    } catch (fileError) {
      console.log('⚠️ لم يتم العثور على ملف المفتاح المحلي، جاري استخدام متغيرات البيئة...');
      credentials = {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
    }
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
    
    // Read all users from USERS sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'USERS!A:R',
    });

    const rows = response.data.values || [];
    
    console.log('📋 البحث عن المستخدم Ahmed...');
    
    // Find Ahmed's row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Column B (index 1) is username
      if (row[1] === 'Ahmed') {
        console.log(`✅ تم العثور على Ahmed في السطر ${i + 1}`);
        console.log(`📝 الاسم الحالي: ${row[3] || 'غير محدد'}`);
        
        // Column D (index 3) is fullName
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `USERS!D${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Ahmed Youssef']]
          }
        });
        
        console.log(`✅ تم تحديث الاسم بنجاح إلى Ahmed Youssef`);
        console.log(`🎯 سيظهر الآن "AY" في صورة المستخدم`);
        return true;
      }
    }
    
    console.log('⚠️ لم يتم العثور على المستخدم Ahmed');
    return false;
  } catch (error) {
    console.error('❌ خطأ في تحديث الاسم:', error);
    return false;
  }
}

// Run the update
updateAhmedName().then(() => {
  console.log('✨ اكتمل التحديث');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل التحديث:', error);
  process.exit(1);
});