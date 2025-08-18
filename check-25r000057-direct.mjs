// Check if 25R000057 exists in Google Sheets directly
import { google } from 'googleapis';
import fs from 'fs';

async function checkRFQ() {
  try {
    // Load service account key
    const keyPath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    
    // Authenticate
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    // Read all data from DATA sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A2:AA' // Read all columns
    });
    
    const rows = response.data.values || [];
    console.log(`📊 Total rows in DATA sheet: ${rows.length}`);
    
    // Search for 25R000057 in column F (index 5)
    let found = false;
    let count = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rfqNumber = row[5]; // Column F - RFQ Number
      
      if (rfqNumber === '25R000057') {
        found = true;
        count++;
        console.log(`\n✅ Found 25R000057 at row ${i + 2}:`);
        console.log('  - Item Number (A):', row[0]);
        console.log('  - UOM (B):', row[1]);
        console.log('  - LINE ITEM (C):', row[2]);
        console.log('  - Part Number (D):', row[3]);
        console.log('  - Description (E):', row[4]?.substring(0, 50) + '...');
        console.log('  - RFQ Number (F):', row[5]);
        console.log('  - Request Date (G):', row[6]);
        console.log('  - Quantity (H):', row[7]);
        console.log('  - Price (I):', row[8]);
        console.log('  - Response Date (J):', row[9]);
        console.log('  - PO Number (K):', row[10]);
        console.log('  - PO Date (L):', row[11]);
        console.log('  - PO Quantity (M):', row[12]);
        console.log('  - PO Price (N):', row[13]);
        console.log('  - Total Value (O):', row[14]);
        console.log('  - Client Name (P):', row[15]);
        console.log('  - Responsible Employee (Q):', row[16]);
      }
    }
    
    if (found) {
      console.log(`\n📋 Total occurrences of 25R000057: ${count}`);
    } else {
      console.log('\n❌ 25R000057 not found in DATA sheet');
      
      // Show some RFQ numbers for reference
      const rfqNumbers = new Set();
      for (const row of rows.slice(0, 100)) {
        if (row[5]) rfqNumbers.add(row[5]);
      }
      
      console.log('\nFirst 10 unique RFQ numbers in DATA sheet:');
      Array.from(rfqNumbers).slice(0, 10).forEach(rfq => {
        console.log(`  - ${rfq}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRFQ();