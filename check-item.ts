import { GoogleSheetsRealtimeData } from './server/google-sheets-realtime-data.js';

async function checkItem() {
  const sheets = new GoogleSheetsRealtimeData();
  
  const response = await sheets.sheets.spreadsheets.values.get({
    spreadsheetId: sheets.spreadsheetId,
    range: 'DATA!A:A'
  });
  
  const rows = response.data.values || [];
  console.log('📊 إجمالي الصفوف في DATA:', rows.length);
  
  let found = false;
  for (let i = 0; i < rows.length; i++) {
    const itemId = (rows[i][0] || '').toString().trim();
    if (itemId === 'P-0000017' || itemId.includes('0000017')) {
      console.log(`✅ وجدت البند في الصف ${i + 1}: '${itemId}'`);
      found = true;
    }
  }
  
  if (!found) {
    console.log('❌ البند P-0000017 غير موجود في صفحة DATA');
    console.log('📋 عينة من البنود الموجودة:');
    let sampleCount = 0;
    for (let i = 1; i < rows.length && sampleCount < 20; i++) {
      const itemId = (rows[i][0] || '').toString().trim();
      if (itemId && itemId.startsWith('P-')) {
        console.log(`  صف ${i + 1}: ${itemId}`);
        sampleCount++;
      }
    }
  }
}

checkItem().catch(console.error);