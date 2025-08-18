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

async function checkUsersSheet() {
  try {
    // قراءة صف العناوين
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'المستخدمون!A1:Z1'
    });
    
    const headers = headersResponse.data.values?.[0] || [];
    console.log('📊 عناوين أعمدة ورقة المستخدمين:');
    headers.forEach((header, index) => {
      const column = String.fromCharCode(65 + index);
      console.log(`  العمود ${column}: ${header}`);
    });
    
    // قراءة بيانات المستخدمين
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'المستخدمون!A2:Z10'
    });
    
    const users = usersResponse.data.values || [];
    console.log(`\n👥 عدد المستخدمين: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 بيانات أول مستخدم:');
      const firstUser = users[0];
      headers.forEach((header, index) => {
        if (firstUser[index]) {
          console.log(`  ${header}: ${firstUser[index].substring(0, 50)}`);
        }
      });
      
      console.log('\n📊 عدد الأعمدة لكل مستخدم:');
      users.forEach((user, i) => {
        console.log(`  المستخدم ${i + 1}: ${user.length} عمود`);
      });
    }
    
    // البحث عن عمود صورة
    const imageColumns = headers.filter(h => 
      h.toLowerCase().includes('image') || 
      h.toLowerCase().includes('photo') || 
      h.toLowerCase().includes('صورة') ||
      h.toLowerCase().includes('avatar')
    );
    
    if (imageColumns.length > 0) {
      console.log('\n🖼️ أعمدة الصور المحتملة:');
      imageColumns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('\n❌ لا توجد أعمدة للصور في ورقة المستخدمين');
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkUsersSheet();
