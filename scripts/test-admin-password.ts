import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function testPassword() {
  // الحصول على كلمة المرور المشفرة من قاعدة البيانات
  const user = sqlite.prepare('SELECT password FROM users WHERE username = ?').get('admin');
  
  if (!user) {
    console.log('❌ المستخدم admin غير موجود');
    return;
  }
  
  console.log('🔍 كلمة المرور المشفرة في قاعدة البيانات:', user.password);
  
  // اختبار كلمات المرور المختلفة
  const testPasswords = ['admin123', 'admin', '123456'];
  
  for (const password of testPasswords) {
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🧪 اختبار كلمة المرور "${password}": ${isMatch ? '✅ صحيحة' : '❌ خاطئة'}`);
  }
  
  // إنشاء كلمة مرور جديدة ومشفرة
  console.log('\n🔐 إنشاء كلمة مرور جديدة...');
  const newHash = await bcrypt.hash('admin123', 10);
  console.log('🔐 كلمة المرور الجديدة المشفرة:', newHash);
  
  // تحديث كلمة المرور في قاعدة البيانات
  sqlite.prepare('UPDATE users SET password = ? WHERE username = ?').run(newHash, 'admin');
  console.log('✅ تم تحديث كلمة المرور');
  
  sqlite.close();
}

testPassword().catch(console.error);