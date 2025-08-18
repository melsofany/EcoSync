import { google } from 'googleapis';

// Initialize Google Sheets API
async function initializeGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export async function updateUserFullName(username: string, fullName: string) {
  try {
    const sheets = await initializeGoogleSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';
    
    // Read all users from USERS sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'USERS!A:R',
    });

    const rows = response.data.values || [];
    
    // Find the user row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Column B (index 1) is username
      if (row[1] === username) {
        // Column D (index 3) is fullName
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `USERS!D${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[fullName]]
          }
        });
        
        console.log(`✅ Updated fullName for user ${username} to ${fullName}`);
        return true;
      }
    }
    
    console.log(`⚠️ User ${username} not found`);
    return false;
  } catch (error) {
    console.error('❌ Error updating user fullName:', error);
    return false;
  }
}

// Update Ahmed's name to Ahmed Youssef
export async function updateAhmedYoussefName() {
  return await updateUserFullName('Ahmed', 'Ahmed Youssef');
}