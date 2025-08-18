import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
const keyPath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
const credentials = JSON.parse(readFileSync(keyPath, 'utf8'));

const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

async function checkSheets() {
  try {
    // الحصول على معلومات الشيت
    const response = await sheets.spreadsheets.get({
      spreadsheetId
    });
    
    console.log('📋 أسماء الأوراق في Google Sheets:');
    response.data.sheets.forEach((sheet, index) => {
      console.log(`  ${index + 1}. ${sheet.properties.title}`);
    });
    
    // البحث عن ورقة المستخدمين
    const userSheet = response.data.sheets.find(s => 
      s.properties.title.includes('USER') || 
      s.properties.title.includes('مستخدم') ||
      s.properties.title.includes('Users')
    );
    
    if (userSheet) {
      console.log(`\n✅ وجدت ورقة المستخدمين: ${userSheet.properties.title}`);
      
      // قراءة الصف الأول من ورقة المستخدمين
      const headersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${userSheet.properties.title}!A1:Z1`
      });
      
      const headers = headersResponse.data.values?.[0] || [];
      console.log('\n📊 أعمدة ورقة المستخدمين:');
      headers.forEach((header, index) => {
        const column = String.fromCharCode(65 + index);
        console.log(`  العمود ${column}: ${header}`);
      });
      
      // البحث عن عمود الصورة
      const imageColumnIndex = headers.findIndex(h => 
        h && (
          h.toLowerCase().includes('image') || 
          h.toLowerCase().includes('photo') || 
          h.toLowerCase().includes('صورة') ||
          h.toLowerCase().includes('avatar')
        )
      );
      
      if (imageColumnIndex >= 0) {
        console.log(`\n🖼️ عمود الصورة موجود: العمود ${String.fromCharCode(65 + imageColumnIndex)} - ${headers[imageColumnIndex]}`);
      } else {
        console.log('\n❌ لا يوجد عمود للصور في ورقة المستخدمين');
      }
      
      // قراءة بيانات المستخدمين
      const usersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${userSheet.properties.title}!A2:Z10`
      });
      
      const users = usersResponse.data.values || [];
      console.log(`\n👥 عدد المستخدمين: ${users.length}`);
      
      if (users.length > 0 && imageColumnIndex >= 0) {
        console.log('\n📷 بيانات الصور للمستخدمين:');
        users.forEach((user, i) => {
          const username = user[0];
          const imageData = user[imageColumnIndex];
          if (imageData) {
            console.log(`  ${username}: ${imageData.substring(0, 50)}...`);
          } else {
            console.log(`  ${username}: لا توجد صورة`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkSheets();
