import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function debugOtherUsers() {
  console.log('🔍 فحص المستخدمين الآخرين...');
  
  const users = sqlite.prepare('SELECT username, password FROM users WHERE username != ?').all('admin');
  
  for (const user of users) {
    console.log(`\n👤 المستخدم: ${user.username}`);
    console.log(`   كلمة المرور: ${user.password.substring(0, 20)}...`);
    
    // اختبار كلمة المرور الحالية
    const testResult = await bcrypt.compare('admin123', user.password);
    console.log(`   اختبار admin123: ${testResult ? '✅' : '❌'}`);
    
    if (!testResult) {
      // إنشاء كلمة مرور جديدة
      const newHash = await bcrypt.hash('admin123', 10);
      sqlite.prepare('UPDATE users SET password = ? WHERE username = ?').run(newHash, user.username);
      console.log(`   🔄 تم إنشاء كلمة مرور جديدة`);
      
      // اختبار كلمة المرور الجديدة
      const newTestResult = await bcrypt.compare('admin123', newHash);
      console.log(`   اختبار جديد: ${newTestResult ? '✅' : '❌'}`);
    }
  }
  
  sqlite.close();
}

debugOtherUsers().catch(console.error);