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

async function fixUsers() {
  try {
    console.log('🔧 Fixing user data alignment...');
    
    // Fix Ahmed's data (row 3)
    const ahmedPassword = await bcrypt.hash('admin123', 10);
    const ahmedData = [
      'user-1755618728197', // A: ID
      'Ahmed.lifeendy@gmail.com', // B: USERNAME
      ahmedPassword, // C: PASSWORD
      'Ahmed', // D: FULL_NAME
      'Ahmed.lifeendy@gmail.com', // E: EMAIL
      '', // F: PHONE
      '', // G: PROFILE_IMAGE (will be empty for now)
      'it_admin', // H: ROLE
      '', // I: PERMISSIONS (empty for now)
      'TRUE', // J: IS_ACTIVE
      'FALSE', // K: IS_ONLINE
      '', // L: LAST_LOGIN
      new Date().toISOString(), // M: LAST_ACTIVITY
      '', // N: IP_ADDRESS
      new Date().toISOString(), // O: CREATED_AT
      new Date().toISOString() // P: UPDATED_AT
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'USERS!A3:P3',
      valueInputOption: 'RAW',
      resource: {
        values: [ahmedData]
      }
    });
    
    console.log('✅ Fixed Ahmed user data');
    
    // Fix Omar's data (row 4)
    const omarPassword = await bcrypt.hash('admin123', 10);
    const omarData = [
      'user-1755620295234', // A: ID
      'Omar', // B: USERNAME
      omarPassword, // C: PASSWORD
      'Omar', // D: FULL_NAME
      'omar@qurtoba.com', // E: EMAIL
      '', // F: PHONE
      '', // G: PROFILE_IMAGE (will be empty for now)
      'it_admin', // H: ROLE
      '', // I: PERMISSIONS (empty for now)
      'TRUE', // J: IS_ACTIVE
      'FALSE', // K: IS_ONLINE
      '', // L: LAST_LOGIN
      new Date().toISOString(), // M: LAST_ACTIVITY
      '', // N: IP_ADDRESS
      new Date().toISOString(), // O: CREATED_AT
      new Date().toISOString() // P: UPDATED_AT
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'USERS!A4:P4',
      valueInputOption: 'RAW',
      resource: {
        values: [omarData]
      }
    });
    
    console.log('✅ Fixed Omar user data');
    
    console.log('✅ All user data has been fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUsers();