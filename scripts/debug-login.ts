import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function debugLogin() {
  console.log('🔍 فحص حالة قاعدة البيانات...');
  
  // فحص جدول المستخدمين
  const users = sqlite.prepare('SELECT id, username, full_name, is_active, LENGTH(password) as pwd_len FROM users').all();
  console.log('👥 المستخدمين الموجودين:');
  users.forEach((user: any) => {
    console.log(`   - ${user.username}: ${user.full_name} (${user.is_active ? 'نشط' : 'غير نشط'}) - كلمة المرور: ${user.pwd_len} حرف`);
  });
  
  // فحص المستخدم الإداري تحديداً
  const admin = sqlite.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (admin) {
    console.log('\n🔑 بيانات المستخدم الإداري:');
    console.log('   - ID:', admin.id);
    console.log('   - Username:', admin.username);
    console.log('   - Full Name:', admin.full_name);
    console.log('   - Email:', admin.email);
    console.log('   - Role:', admin.role);
    console.log('   - Is Active:', admin.is_active);
    console.log('   - Password Hash:', admin.password);
    
    // اختبار كلمة المرور
    console.log('\n🧪 اختبار كلمة المرور...');
    const testResult = await bcrypt.compare('admin123', admin.password);
    console.log('   - النتيجة:', testResult ? '✅ صحيحة' : '❌ خاطئة');
    
    // اختبار كلمات مرور أخرى
    const otherPasswords = ['admin', '123456', 'password'];
    for (const pwd of otherPasswords) {
      const result = await bcrypt.compare(pwd, admin.password);
      console.log(`   - "${pwd}": ${result ? '✅' : '❌'}`);
    }
  } else {
    console.log('❌ المستخدم الإداري غير موجود!');
  }
  
  sqlite.close();
}

debugLogin().catch(console.error);