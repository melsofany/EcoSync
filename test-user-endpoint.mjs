// Script to test /api/auth/me endpoint
import fetch from 'node-fetch';
import fs from 'fs';

async function testUserEndpoint() {
  try {
    // Read cookies from file
    let cookies = '';
    try {
      cookies = fs.readFileSync('cookies.txt', 'utf8').trim();
      console.log('✅ تم قراءة ملف cookies');
    } catch (err) {
      console.log('⚠️ لا يوجد ملف cookies - سنجرب بدونه');
    }
    
    // Test endpoint
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      console.log('\n✅ استجابة من /api/auth/me:');
      console.log(JSON.stringify(userData, null, 2));
      
      // Check fullName field
      if (userData.fullName) {
        console.log(`\n📊 تحليل الاسم الكامل:`);
        console.log(`  - الاسم: "${userData.fullName}"`);
        console.log(`  - الأحرف الأولى: ${userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}`);
      } else {
        console.log('\n⚠️ لا يوجد حقل fullName في البيانات المُرسلة');
      }
      
      // Check profileImage field
      console.log(`\n🖼️ صورة المستخدم: ${userData.profileImage || 'غير موجودة'}`);
      
    } else {
      console.log(`❌ خطأ في الاستجابة: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('الرد:', text);
    }
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// Run test
testUserEndpoint().then(() => {
  console.log('\n✨ اكتمل الاختبار');
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
});