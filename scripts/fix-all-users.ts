import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function fixAllUsers() {
  console.log('🔧 إصلاح كلمات مرور جميع المستخدمين...');
  
  // إنشاء كلمة مرور مشفرة موحدة لجميع المستخدمين
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('🔐 كلمة المرور المشفرة الجديدة:', hashedPassword);
  
  // قائمة المستخدمين للتحديث
  const usernames = ['admin', 'sara', 'khaled', 'fatima', 'mohammed'];
  
  // تحديث كلمة المرور لكل مستخدم
  const updateStmt = sqlite.prepare('UPDATE users SET password = ? WHERE username = ?');
  
  for (const username of usernames) {
    updateStmt.run(hashedPassword, username);
    console.log(`✅ تم تحديث كلمة المرور للمستخدم: ${username}`);
  }
  
  // اختبار كلمات المرور
  console.log('\n🧪 اختبار كلمات المرور...');
  const testStmt = sqlite.prepare('SELECT username, password FROM users');
  const users = testStmt.all();
  
  for (const user of users) {
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`   ${user.username}: ${isValid ? '✅ صحيحة' : '❌ خاطئة'}`);
  }
  
  sqlite.close();
  console.log('\n🎉 تم إنجاز إصلاح جميع المستخدمين!');
}

fixAllUsers().catch(console.error);