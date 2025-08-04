import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function fixAdminUser() {
  console.log('🔧 إصلاح المستخدم الإداري...');
  
  // حذف المستخدم الحالي
  sqlite.prepare('DELETE FROM users WHERE username = ?').run('admin');
  
  // إنشاء كلمة مرور مشفرة جديدة
  const newPassword = await bcrypt.hash('admin123', 10);
  console.log('🔐 كلمة المرور الجديدة المشفرة:', newPassword);
  
  // إنشاء المستخدم الإداري من جديد
  const insertStmt = sqlite.prepare(`
    INSERT INTO users (
      id, username, password, full_name, email, phone, profile_image, 
      role, permissions, is_active, is_online, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const adminPermissions = [
    "view_dashboard", "view_analytics", "export_dashboard_data",
    "create_clients", "edit_clients", "delete_clients", "view_clients",
    "create_suppliers", "edit_suppliers", "delete_suppliers", "view_suppliers", 
    "create_items", "edit_items", "delete_items", "view_items", "use_ai_features",
    "create_quotations", "edit_quotations", "delete_quotations", "view_quotations", "export_quotations",
    "create_purchase_orders", "edit_purchase_orders", "delete_purchase_orders", "view_purchase_orders",
    "view_reports", "export_reports", "manage_users", "view_activity_logs", "system_settings", "data_export"
  ];
  
  const now = Date.now();
  
  insertStmt.run(
    'admin-fixed',
    'admin',
    newPassword,
    'أحمد محمد الإداري', 
    'admin@qurtoba.com',
    '+966501234567',
    '/attached_assets/5800824040645052413_1754267220456.jpg',
    'manager',
    JSON.stringify(adminPermissions),
    1, // is_active
    0, // is_online
    now, // created_at
    now  // updated_at
  );
  
  console.log('✅ تم إنشاء المستخدم الإداري الجديد');
  
  // اختبار كلمة المرور
  const testUser = sqlite.prepare('SELECT password FROM users WHERE username = ?').get('admin');
  const testResult = await bcrypt.compare('admin123', testUser.password);
  console.log('🧪 اختبار كلمة المرور:', testResult ? '✅ نجح' : '❌ فشل');
  
  sqlite.close();
}

fixAdminUser().catch(console.error);