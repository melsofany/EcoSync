import { db } from '../server/db';
import { users } from '../shared/sqlite-schema';
import { eq } from 'drizzle-orm';

async function testDrizzleConnection() {
  console.log('🔍 اختبار اتصال Drizzle بقاعدة البيانات...');
  
  try {
    // قراءة المستخدمين من Drizzle
    const allUsers = await db.select().from(users);
    console.log(`📊 عدد المستخدمين من Drizzle: ${allUsers.length}`);
    
    allUsers.forEach(user => {
      console.log(`   ${user.username}: ${user.fullName}`);
      console.log(`      كلمة المرور: ${user.password.substring(0, 30)}...`);
    });
    
    // البحث عن مستخدم محدد
    const [sara] = await db.select().from(users).where(eq(users.username, 'sara'));
    if (sara) {
      console.log('\n👤 بيانات سارة من Drizzle:');
      console.log('   ID:', sara.id);
      console.log('   Username:', sara.username);
      console.log('   Full Name:', sara.fullName);
      console.log('   Password:', sara.password.substring(0, 30) + '...');
      console.log('   Is Active:', sara.isActive);
      console.log('   Email:', sara.email);
    } else {
      console.log('❌ لم يتم العثور على سارة في Drizzle!');
    }
    
  } catch (error) {
    console.error('❌ خطأ في اتصال Drizzle:', error);
  }
}

testDrizzleConnection().catch(console.error);