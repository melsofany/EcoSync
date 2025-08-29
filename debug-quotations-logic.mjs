// Debug quotations extraction logic
import { google } from 'googleapis';
import fs from 'fs';

async function debugQuotations() {
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
    
    // Simulate getAllItems logic
    const items = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue; // Skip empty rows
      
      const item = {
        itemNumber: row[0] || '',
        rfqNumber: row[5] || '', // Column F
        clientName: row[15] || '', // Column P
        requestDate: row[6] || '', // Column G
        responsibleEmployee: row[16] || '', // Column Q
        totalValue: row[14] || '' // Column O
      };
      
      items.push(item);
    }
    
    console.log(`📦 Total items extracted: ${items.length}`);
    
    // Simulate getAllQuotations logic
    const quotationsMap = new Map();
    
    for (const item of items) {
      if (!item.rfqNumber) continue;
      
      if (!quotationsMap.has(item.rfqNumber)) {
        quotationsMap.set(item.rfqNumber, {
          id: `rfq-sheets-${item.rfqNumber}`,
          requestNumber: item.rfqNumber,
          customRequestNumber: item.rfqNumber,
          clientName: item.clientName && item.clientName.trim() && item.clientName.trim() !== '""' ? 
                     item.clientName.trim() : 'غير محدد',
          requestDate: item.requestDate,
          responsibleEmployee: item.responsibleEmployee && item.responsibleEmployee.trim() ? 
                              item.responsibleEmployee.trim() : 'غير محدد',
          status: 'completed',
          totalItems: 0,
          totalValue: 0
        });
      }
      
      const quotation = quotationsMap.get(item.rfqNumber);
      quotation.totalItems++;
      
      const value = parseFloat(item.totalValue?.toString().replace(/[^\d.-]/g, '') || '0');
      if (!isNaN(value)) {
        quotation.totalValue += value;
      }
    }
    
    const quotations = Array.from(quotationsMap.values());
    console.log(`📋 Total unique quotations: ${quotations.length}`);
    
    // Check for 25R000057
    const target = quotations.find(q => q.requestNumber === '25R000057');
    
    if (target) {
      console.log('\n✅ 25R000057 found in processed quotations:');
      console.log(JSON.stringify(target, null, 2));
    } else {
      console.log('\n❌ 25R000057 not found in processed quotations');
      
      // Debug: Check raw data
      const rawItems = items.filter(item => item.rfqNumber === '25R000057');
      console.log(`\n📊 Raw items with 25R000057: ${rawItems.length}`);
      if (rawItems.length > 0) {
        console.log('Raw item data:');
        rawItems.forEach((item, i) => {
          console.log(`  Item ${i + 1}:`, JSON.stringify(item, null, 2));
        });
      }
      
      // Show sample quotations
      console.log('\nFirst 5 quotations:');
      quotations.slice(0, 5).forEach(q => {
        console.log(`  - ${q.requestNumber}: ${q.clientName} (${q.totalItems} items)`);
      });
      
      // Check for similar numbers
      const similar = quotations.filter(q => q.requestNumber.includes('25R00005'));
      if (similar.length > 0) {
        console.log('\nQuotations with similar numbers:');
        similar.forEach(q => {
          console.log(`  - ${q.requestNumber}: ${q.clientName}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugQuotations();