import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function createUsers() {
  // حذف المستخدمين الموجودين
  sqlite.exec('DELETE FROM users');
  
  // بيانات المستخدمين الأصليين مع كلمات المرور
  const users = [
    {
      id: 'admin-original',
      username: 'admin',
      password: 'admin123',
      fullName: 'أحمد محمد الإداري',
      email: 'admin@qurtoba.com',
      phone: '+966501234567',
      profileImage: '/attached_assets/5800824040645052413_1754267220456.jpg',
      role: 'manager',
      permissions: [
        "view_dashboard", "view_analytics", "export_dashboard_data",
        "create_clients", "edit_clients", "delete_clients", "view_clients",
        "create_suppliers", "edit_suppliers", "delete_suppliers", "view_suppliers", 
        "create_items", "edit_items", "delete_items", "view_items", "use_ai_features",
        "create_quotations", "edit_quotations", "delete_quotations", "view_quotations", "export_quotations",
        "create_purchase_orders", "edit_purchase_orders", "delete_purchase_orders", "view_purchase_orders",
        "view_reports", "export_reports", "manage_users", "view_activity_logs", "system_settings", "data_export"
      ]
    },
    {
      id: 'sara-data-entry',
      username: 'sara',
      password: 'sara123',
      fullName: 'سارة عبدالله - موظفة البيانات',
      email: 'sara@qurtoba.com',
      phone: '+966502345678',
      profileImage: '/attached_assets/image_1754172824433.png',
      role: 'data_entry',
      permissions: [
        "view_dashboard", "create_clients", "edit_clients", "view_clients",
        "create_suppliers", "edit_suppliers", "view_suppliers",
        "create_items", "edit_items", "view_items", "use_ai_features",
        "create_quotations", "edit_quotations", "view_quotations"
      ]
    },
    {
      id: 'khaled-purchasing',
      username: 'khaled',
      password: 'khaled123',
      fullName: 'خالد حسن - مدير المشتريات',
      email: 'khaled@qurtoba.com',
      phone: '+966503456789',
      profileImage: '/attached_assets/image_1754173077238.png',
      role: 'purchasing',
      permissions: [
        "view_dashboard", "view_clients", "view_suppliers", "view_items",
        "view_quotations", "create_purchase_orders", "edit_purchase_orders", 
        "view_purchase_orders", "view_reports"
      ]
    },
    {
      id: 'fatima-accounting',
      username: 'fatima',
      password: 'fatima123', 
      fullName: 'فاطمة علي - موظفة الحسابات',
      email: 'fatima@qurtoba.com',
      phone: '+966504567890',
      profileImage: '/attached_assets/image_1754187374615.png',
      role: 'accounting',
      permissions: [
        "view_dashboard", "view_analytics", "view_clients", "view_suppliers",
        "view_items", "view_quotations", "view_purchase_orders", "view_reports"
      ]
    },
    {
      id: 'mohammed-it',
      username: 'mohammed',
      password: 'mohammed123',
      fullName: 'محمد أحمد - مدير تقنية المعلومات',
      email: 'mohammed@qurtoba.com', 
      phone: '+966505678901',
      profileImage: '/attached_assets/image_1754209320795.png',
      role: 'it_admin',
      permissions: [
        "view_dashboard", "view_analytics", "export_dashboard_data",
        "view_clients", "view_suppliers", "view_items", "view_quotations", "view_purchase_orders",
        "view_reports", "export_reports", "manage_users", "view_activity_logs", "system_settings", "data_export"
      ]
    }
  ];

  // إعداد statement للإدراج
  const insertStmt = sqlite.prepare(`
    INSERT INTO users (
      id, username, password, full_name, email, phone, profile_image, 
      role, permissions, is_active, is_online, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // إنشاء المستخدمين مع تشفير كلمات المرور
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const now = Date.now();
    
    insertStmt.run(
      user.id,
      user.username, 
      hashedPassword,
      user.fullName,
      user.email,
      user.phone,
      user.profileImage,
      user.role,
      JSON.stringify(user.permissions),
      1, // is_active
      0, // is_online
      now, // created_at
      now  // updated_at
    );
    
    console.log(`✅ تم إنشاء المستخدم: ${user.fullName} (${user.username})`);
  }

  console.log('\n🎉 تم إنشاء جميع المستخدمين الأصليين بنجاح!');
  
  // عرض المستخدمين المنشئين
  const allUsers = sqlite.prepare('SELECT id, username, full_name, role, email, profile_image FROM users').all();
  console.log('\n📋 قائمة المستخدمين:');
  allUsers.forEach((user: any) => {
    console.log(`   • ${user.full_name} (${user.username}) - ${user.role}`);
    console.log(`     📧 ${user.email}`);
    console.log(`     🖼️  ${user.profile_image || 'لا توجد صورة'}`);
    console.log('');
  });

  sqlite.close();
}

createUsers().catch(console.error);