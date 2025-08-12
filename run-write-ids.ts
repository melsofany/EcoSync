import { writeIdsDirectlyToSheets } from './server/write-ids-directly';

async function main() {
  console.log('📋 بدء تشغيل كتابة المعرفات في Google Sheets...');
  
  const result = await writeIdsDirectlyToSheets();
  
  if (result.success) {
    console.log(`🎉 نجح! تم كتابة ${result.totalIds} معرف فريد في Google Sheets`);
    console.log(`🆔 المعرفات من ${result.firstId} إلى ${result.lastId}`);
  } else {
    console.log(`❌ فشل: ${result.error}`);
  }
}

main().catch(error => {
  console.error('❌ خطأ في التشغيل:', error);
});