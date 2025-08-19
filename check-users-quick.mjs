import { google } from 'googleapis';
import fs from 'fs';

const serviceAccountKey = JSON.parse(
  fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8')
);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

async function check() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg',
      range: 'USERS!A1:P4'
    });

    const rows = response.data.values || [];
    console.log('Total rows:', rows.length);
    
    if (rows.length > 0) {
      console.log('\nHeaders:', rows[0]);
    }
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      console.log(`\nRow ${i + 1}:`);
      console.log('  A (ID):', row[0]);
      console.log('  B (USERNAME):', row[1]);
      console.log('  C (PASSWORD):', row[2] ? 'HIDDEN' : 'empty');
      console.log('  D (FULL_NAME):', row[3]);
      console.log('  E (EMAIL):', row[4]);
      console.log('  F (PHONE):', row[5]);
      console.log('  G (PROFILE_IMAGE):', row[6] ? (row[6].startsWith('data:image/') ? 'Base64 Image' : row[6]) : 'empty');
      console.log('  H (ROLE):', row[7]);
      console.log('  I (PERMISSIONS):', row[8]);
      console.log('  J (IS_ACTIVE):', row[9]);
      console.log('  K (IS_ONLINE):', row[10]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

check();