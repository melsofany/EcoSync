// سكريبت تشغيل التوحيد المباشر
const { google } = require('googleapis');
const fs = require('fs');

async function runDirectUnification() {
  console.log('🚀 بدء التوحيد المباشر...\n');
  
  try {
    // الاتصال بـ Google Sheets
    const keyFilePath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    
    console.log('✅ تم الاتصال بـ Google Sheets\n');
    
    // قراءة البيانات
    console.log('📊 قراءة البيانات...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });

    const rows = response.data.values || [];
    console.log(`📊 تم قراءة ${rows.length} صف\n`);
    
    // تحضير البيانات
    const items = [];
    for (let i = 1; i < Math.min(rows.length, 100); i++) { // أول 100 صف للاختبار
      const row = rows[i] || [];
      
      if (row.length >= 5) {
        const currentId = row[0] || '';
        const unit = row[1] || '';
        const lineItem = row[2] || '';
        const partNumber = row[3] || '';
        const description = row[4] || '';
        
        items.push({
          rowIndex: i + 1,
          currentId,
          unit,
          lineItem: lineItem.trim(),
          partNumber: partNumber.trim(),
          description: description.trim()
        });
      }
    }
    
    console.log(`✅ تم تحضير ${items.length} بند للمعالجة\n`);
    
    // عرض عينة من البيانات
    console.log('📝 عينة من البيانات:');
    for (let i = 0; i < Math.min(5, items.length); i++) {
      const item = items[i];
      console.log(`  الصف ${item.rowIndex}: ID="${item.currentId}" | LINE="${item.lineItem}" | PART="${item.partNumber}"`);
    }
    console.log('');
    
    // دالة المقارنة البسيطة
    function areItemsSimilar(item1, item2) {
      // مقارنة LINE ITEM
      if (item1.lineItem && item2.lineItem) {
        const clean1 = item1.lineItem.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const clean2 = item2.lineItem.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean1 && clean2 && clean1 === clean2) {
          return { match: true, reason: 'LINE_ITEM' };
        }
      }
      
      // مقارنة PART NUMBER
      if (item1.partNumber && item2.partNumber) {
        const clean1 = item1.partNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const clean2 = item2.partNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean1 && clean2 && clean1 === clean2) {
          return { match: true, reason: 'PART_NUMBER' };
        }
      }
      
      // مقارنة الوصف
      if (item1.description && item2.description) {
        const desc1 = item1.description.toUpperCase();
        const desc2 = item2.description.toUpperCase();
        if (desc1 === desc2 && desc1.length > 10) {
          return { match: true, reason: 'DESCRIPTION' };
        }
      }
      
      return { match: false };
    }
    
    // التوحيد
    console.log('🔍 بدء المعالجة...\n');
    const groups = [];
    const processed = new Set();
    let nextId = 1;
    let totalMatches = 0;
    
    for (let i = 0; i < items.length; i++) {
      if (processed.has(i)) continue;
      
      const master = items[i];
      const groupId = `P-${String(nextId).padStart(7, '0')}`;
      nextId++;
      
      const group = {
        id: groupId,
        items: [master]
      };
      
      processed.add(i);
      
      // البحث عن التطابقات
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(j)) continue;
        
        const result = areItemsSimilar(master, items[j]);
        if (result.match) {
          group.items.push(items[j]);
          processed.add(j);
          totalMatches++;
          console.log(`  ✅ تطابق ${result.reason}: الصف ${master.rowIndex} مع ${items[j].rowIndex}`);
        }
      }
      
      groups.push(group);
      
      if (group.items.length > 1) {
        console.log(`  📦 المجموعة ${groupId}: ${group.items.length} بند`);
      }
    }
    
    console.log(`\n📊 النتائج:`);
    console.log(`  - البنود المعالجة: ${items.length}`);
    console.log(`  - المجموعات: ${groups.length}`);
    console.log(`  - التطابقات: ${totalMatches}\n`);
    
    // الكتابة إلى Google Sheets
    if (totalMatches > 0) {
      console.log('📝 كتابة المعرفات الجديدة...');
      
      const updates = [];
      for (const group of groups) {
        for (const item of group.items) {
          // كتابة المعرف الجديد بدلاً من القديم
          updates.push({
            range: `DATA!A${item.rowIndex}`,
            values: [[group.id]]
          });
        }
      }
      
      // الكتابة على دفعات
      const batchSize = 50;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: batch
          }
        });
        
        console.log(`  ✅ كتابة ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
      }
      
      console.log(`\n🎉 تم التوحيد والكتابة بنجاح!`);
      console.log(`✅ تم كتابة ${updates.length} معرف جديد`);
    } else {
      console.log('⚠️ لم يتم العثور على أي تطابقات');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error.stack);
  }
}

// تشغيل التوحيد
runDirectUnification();