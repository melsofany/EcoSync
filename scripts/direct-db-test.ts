import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function directDbTest() {
  console.log('🔍 فحص مباشر لقاعدة البيانات...');
  
  // فحص محتوى قاعدة البيانات
  const users = sqlite.prepare('SELECT id, username, full_name, password FROM users ORDER BY username').all();
  
  console.log('\n📋 جميع المستخدمين في قاعدة البيانات:');
  for (const user of users) {
    console.log(`   ${user.username} (${user.id}): ${user.full_name}`);
    console.log(`      كلمة المرور: ${user.password.substring(0, 30)}...`);
    
    // اختبار كلمة المرور
    const testResult = await bcrypt.compare('admin123', user.password);
    console.log(`      اختبار admin123: ${testResult ? '✅ صحيحة' : '❌ خاطئة'}`);
  }
  
  // التحقق من المستخدم sara تحديداً
  console.log('\n🔍 فحص مفصل للمستخدمة sara:');
  const sara = sqlite.prepare('SELECT * FROM users WHERE username = ?').get('sara');
  if (sara) {
    console.log('   البيانات الكاملة:', JSON.stringify(sara, null, 2));
    
    // إنشاء كلمة مرور جديدة خصيصاً لسارة
    const newPassword = await bcrypt.hash('sara123', 10);
    sqlite.prepare('UPDATE users SET password = ? WHERE username = ?').run(newPassword, 'sara');
    console.log('   ✅ تم تحديث كلمة المرور إلى sara123');
    
    // اختبار الكلمة الجديدة
    const testNew = await bcrypt.compare('sara123', newPassword);
    console.log(`   اختبار sara123: ${testNew ? '✅' : '❌'}`);
  }
  
  sqlite.close();
}

directDbTest().catch(console.error);