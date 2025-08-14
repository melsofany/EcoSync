// إنشاء مستخدم it_admin في Google Sheets
const bcrypt = require('bcrypt');
const { UserSheetsManager } = require('../server/user-sheets-manager');

async function createITAdmin() {
  const userManager = new UserSheetsManager();
  
  try {
    // تهيئة الاتصال
    await userManager.initialize();
    
    // إنشاء كلمة مرور مُشفرة
    const hashedPassword = await bcrypt.hash('it123456', 10);
    
    // بيانات المستخدم
    const newUser = {
      id: 'it-admin-user',
      username: 'it_admin',
      password: hashedPassword,
      fullName: 'مدير تقنية المعلومات',
      email: 'it@qurtoba.com',
      phone: '',
      profileImage: '',
      role: 'it_admin',
      permissions: JSON.stringify(['view_all', 'edit_all', 'delete_all', 'manage_users', 'system_admin']),
      isActive: true,
      isOnline: false,
      lastLoginAt: '',
      lastActivityAt: new Date().toISOString(),
      ipAddress: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // إضافة المستخدم
    const success = await userManager.addUser(newUser);
    
    if (success) {
      console.log('✅ تم إنشاء مستخدم it_admin بنجاح');
      console.log('📧 البريد الإلكتروني: it@qurtoba.com');
      console.log('🔐 كلمة المرور: it123456');
    } else {
      console.log('❌ فشل في إنشاء المستخدم');
    }
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

createITAdmin();