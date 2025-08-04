import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const sqlite = new Database('qurtoba.db');

// إنشاء جدول المستخدمين إذا لم يكن موجوداً
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    profile_image TEXT,
    role TEXT NOT NULL,
    permissions TEXT,
    is_active INTEGER DEFAULT 1,
    is_online INTEGER DEFAULT 0,
    last_login_at INTEGER,
    last_activity_at INTEGER,
    ip_address TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    updated_at INTEGER DEFAULT (unixepoch() * 1000)
  );
`);

// حذف المستخدمين الموجودين
sqlite.exec('DELETE FROM users');

// بيانات المستخدمين الأصليين
const originalUsers = [
  {
    id: 'admin-original',
    username: 'admin',
    password: 'admin123',
    fullName: 'أحمد محمد الإداري',
    email: 'admin@qurtoba.com',
    phone: '+966501234567',
    profileImage: '/api/profile-images/admin.jpg',
    role: 'manager',
    permissions: JSON.stringify([
      "view_dashboard", "view_analytics", "export_dashboard_data",
      "create_clients", "edit_clients", "delete_clients", "view_clients",
      "create_suppliers", "edit_suppliers", "delete_suppliers", "view_suppliers", 
      "create_items", "edit_items", "delete_items", "view_items", "use_ai_features",
      "create_quotations", "edit_quotations", "delete_quotations", "view_quotations", "export_quotations",
      "create_purchase_orders", "edit_purchase_orders", "delete_purchase_orders", "view_purchase_orders",
      "view_reports", "export_reports", "manage_users", "view_activity_logs", "system_settings", "data_export"
    ]),
    isActive: true
  },
  {
    id: 'sara-data-entry',
    username: 'sara',
    password: 'sara123',
    fullName: 'سارة عبدالله - موظفة البيانات',
    email: 'sara@qurtoba.com',
    phone: '+966502345678',
    profileImage: '/api/profile-images/sara.jpg', 
    role: 'data_entry',
    permissions: JSON.stringify([
      "view_dashboard", "create_clients", "edit_clients", "view_clients",
      "create_suppliers", "edit_suppliers", "view_suppliers",
      "create_items", "edit_items", "view_items", "use_ai_features",
      "create_quotations", "edit_quotations", "view_quotations"
    ]),
    isActive: true
  },
  {
    id: 'khaled-purchasing',
    username: 'khaled',
    password: 'khaled123',
    fullName: 'خالد حسن - مدير المشتريات',
    email: 'khaled@qurtoba.com',
    phone: '+966503456789',
    profileImage: '/api/profile-images/khaled.jpg',
    role: 'purchasing',
    permissions: JSON.stringify([
      "view_dashboard", "view_clients", "view_suppliers", "view_items",
      "view_quotations", "create_purchase_orders", "edit_purchase_orders", 
      "view_purchase_orders", "view_reports"
    ]),
    isActive: true
  },
  {
    id: 'fatima-accounting',
    username: 'fatima',
    password: 'fatima123', 
    fullName: 'فاطمة علي - موظفة الحسابات',
    email: 'fatima@qurtoba.com',
    phone: '+966504567890',
    profileImage: '/api/profile-images/fatima.jpg',
    role: 'accounting',
    permissions: JSON.stringify([
      "view_dashboard", "view_analytics", "view_clients", "view_suppliers",
      "view_items", "view_quotations", "view_purchase_orders", "view_reports"
    ]),
    isActive: true
  },
  {
    id: 'mohammed-it',
    username: 'mohammed',
    password: 'mohammed123',
    fullName: 'محمد أحمد - مدير تقنية المعلومات',
    email: 'mohammed@qurtoba.com', 
    phone: '+966505678901',
    profileImage: '/api/profile-images/mohammed.jpg',
    role: 'it_admin',
    permissions: JSON.stringify([
      "view_dashboard", "view_analytics", "export_dashboard_data",
      "view_clients", "view_suppliers", "view_items", "view_quotations", "view_purchase_orders",
      "view_reports", "export_reports", "manage_users", "view_activity_logs", "system_settings", "data_export"
    ]),
    isActive: true
  }
];

// إدراج المستخدمين
const insertStmt = sqlite.prepare(`
  INSERT INTO users (
    id, username, password, full_name, email, phone, profile_image, 
    role, permissions, is_active, is_online, last_login_at, 
    last_activity_at, ip_address, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const user of originalUsers) {
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
    user.permissions,
    user.isActive ? 1 : 0,
    0, // is_online
    null, // last_login_at
    null, // last_activity_at  
    null, // ip_address
    now, // created_at
    now  // updated_at
  );
}

console.log('تم إنشاء المستخدمين الأصليين بنجاح!');
console.log('بيانات المستخدمين:');
originalUsers.forEach(user => {
  console.log(`- ${user.fullName} (${user.username})`);
});

sqlite.close();