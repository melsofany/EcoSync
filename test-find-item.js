const { google } = require('googleapis');
const fs = require('fs');

async function findItem() {
  const keyFile = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
  const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg',
    range: 'DATA!A27:F27'
  });
  
  const row = response.data.values?.[0];
  if (row) {
    console.log(`صف 27 في DATA:`);
    console.log(`  البند (A): "${row[0] || ''}"`);
    console.log(`  الوحدة (B): "${row[1] || ''}"`);
    console.log(`  LINE ITEM (C): "${row[2] || ''}"`);
    console.log(`  Part Number (D): "${row[3] || ''}"`);
    console.log(`  الوصف (E): "${row[4] || ''}"`);
    console.log(`  RFQ (F): "${row[5] || ''}"`);
  }
}

findItem().catch(console.error);