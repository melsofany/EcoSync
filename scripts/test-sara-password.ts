import bcrypt from 'bcrypt';

async function testSaraPassword() {
  const drizzlePassword = '$2b$10$uvXFcEEmSzAP71r1fwMfmuG5uocj8LqcEDxdXxE7hC.QXNNxfrlmK';
  
  // اختبار كلمات مرور مختلفة
  const passwords = ['admin123', 'sara123', 'password', '123456'];
  
  for (const pwd of passwords) {
    const result = await bcrypt.compare(pwd, drizzlePassword);
    console.log(`Password "${pwd}": ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
  }
  
  // إنشاء كلمة مرور جديدة وعرض hash
  const newPassword = 'sara123';
  const newHash = await bcrypt.hash(newPassword, 10);
  console.log('\nNew hash for sara123:', newHash);
  
  const testNew = await bcrypt.compare('sara123', newHash);
  console.log('Test new hash:', testNew ? '✅' : '❌');
}

testSaraPassword().catch(console.error);