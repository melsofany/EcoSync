import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function completeUserReset() {
  console.log('🔧 إعادة تعيين كاملة لجميع المستخدمين...');
  
  // حذف جميع المستخدمين الحاليين
  sqlite.prepare('DELETE FROM users').run();
  console.log('✅ تم حذف جميع المستخدمين');
  
  // إنشاء كلمة مرور موحدة
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('🔐 كلمة المرور المشفرة:', hashedPassword);
  
  // إنشاء المستخدمين الأصليين
  const users = [
    {
      id: 'admin-new',
      username: 'admin',
      password: hashedPassword,
      fullName: 'أحمد محمد الإداري',
      email: 'admin@qurtoba.com',
      phone: '+966501234567',
      profileImage: '/attached_assets/5800824040645052413_1754267220456.jpg',
      role: 'manager',
      permissions: ["view_dashboard","view_analytics","export_dashboard_data","create_clients","edit_clients","delete_clients","view_clients","create_suppliers","edit_suppliers","delete_suppliers","view_suppliers","create_items","edit_items","delete_items","view_items","use_ai_features","create_quotations","edit_quotations","delete_quotations","view_quotations","export_quotations","create_purchase_orders","edit_purchase_orders","delete_purchase_orders","view_purchase_orders","view_reports","export_reports","manage_users","view_activity_logs","system_settings","data_export"]
    },
    {
      id: 'sara-new',
      username: 'sara',
      password: hashedPassword,
      fullName: 'سارة عبدالله - موظفة البيانات',
      email: 'sara@qurtoba.com',
      phone: '+966502345678',
      profileImage: '/attached_assets/image_1754172824433.png',
      role: 'data_entry',
      permissions: ["view_dashboard","create_clients","edit_clients","view_clients","create_suppliers","edit_suppliers","view_suppliers","create_items","edit_items","view_items","use_ai_features","create_quotations","edit_quotations","view_quotations"]
    },
    {
      id: 'khaled-new',
      username: 'khaled',
      password: hashedPassword,
      fullName: 'خالد حسن - مدير المشتريات',
      email: 'khaled@qurtoba.com',
      phone: '+966503456789',
      profileImage: '/attached_assets/image_1754173077238.png',
      role: 'purchasing',
      permissions: ["view_dashboard","view_clients","view_suppliers","view_items","view_quotations","create_purchase_orders","edit_purchase_orders","view_purchase_orders","view_reports"]
    },
    {
      id: 'fatima-new',
      username: 'fatima',
      password: hashedPassword,
      fullName: 'فاطمة علي - موظفة الحسابات',
      email: 'fatima@qurtoba.com',
      phone: '+966504567890',
      profileImage: '/attached_assets/image_1754187374615.png',
      role: 'accounting',
      permissions: ["view_dashboard","view_analytics","view_clients","view_suppliers","view_items","view_quotations","view_purchase_orders","view_reports"]
    },
    {
      id: 'mohammed-new',
      username: 'mohammed',
      password: hashedPassword,
      fullName: 'محمد أحمد - مدير تقنية المعلومات',
      email: 'mohammed@qurtoba.com',
      phone: '+966505678901',
      profileImage: '/attached_assets/image_1754209320795.png',
      role: 'it_admin',
      permissions: ["view_dashboard","view_analytics","export_dashboard_data","view_clients","view_suppliers","view_items","view_quotations","view_purchase_orders","view_reports","export_reports","manage_users","view_activity_logs","system_settings","data_export"]
    }
  ];
  
  const insertStmt = sqlite.prepare(`
    INSERT INTO users (
      id, username, password, full_name, email, phone, profile_image,
      role, permissions, is_active, is_online, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const now = Date.now();
  
  for (const user of users) {
    insertStmt.run(
      user.id,
      user.username,
      user.password,
      user.fullName,
      user.email,
      user.phone,
      user.profileImage,
      user.role,
      JSON.stringify(user.permissions),
      1, // is_active
      0, // is_online
      now,
      now
    );
    console.log(`✅ تم إنشاء المستخدم: ${user.username} (${user.fullName})`);
  }
  
  // اختبار كلمات المرور
  console.log('\n🧪 اختبار كلمات المرور...');
  const testUsers = sqlite.prepare('SELECT username, password FROM users').all();
  for (const user of testUsers) {
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`   ${user.username}: ${isValid ? '✅ صحيحة' : '❌ خاطئة'}`);
  }
  
  sqlite.close();
  console.log('\n🎉 تم إنجاز إعادة التعيين بنجاح!');
  console.log('📝 جميع المستخدمين - كلمة المرور: admin123');
}

completeUserReset().catch(console.error);