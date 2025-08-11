import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

// إنشاء قاعدة بيانات SQLite مؤقتة للتطوير
const sqlite = new Database(':memory:');
export const tempDb = drizzle(sqlite, { schema });

// إنشاء الجداول
export async function initTempDatabase() {
  try {
    // إنشاء جدول المستخدمين
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        profile_image TEXT,
        role TEXT NOT NULL DEFAULT 'data_entry',
        permissions TEXT,
        is_active BOOLEAN DEFAULT true,
        is_online BOOLEAN DEFAULT false,
        last_login_at DATETIME,
        last_activity_at DATETIME,
        ip_address TEXT,
        telegram_user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // إضافة مستخدم تجريبي
    const adminUser = {
      id: 'admin-user-1',
      username: 'admin',
      password: '$2b$10$8K1p/a0dL2LT1Z7xaOEWteEhqvqGdqC8.3ZMj0CQCdGGWyLQ1W9zK', // كلمة المرور: admin123
      full_name: 'مدير النظام',
      email: 'admin@qurtoba.com',
      role: 'manager',
      permissions: JSON.stringify({
        manage_quotations: { view: true, create: true, edit: true, delete: true },
        manage_items: { view: true, create: true, edit: true, delete: true },
        manage_clients: { view: true, create: true, edit: true, delete: true },
        manage_suppliers: { view: true, create: true, edit: true, delete: true },
        manage_users: { view: true, create: true, edit: true, delete: true },
        manage_data_import: { view: true, create: true, edit: true, delete: true }
      }),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    sqlite.prepare(`
      INSERT OR REPLACE INTO users 
      (id, username, password, full_name, email, role, permissions, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminUser.id, adminUser.username, adminUser.password, adminUser.full_name,
      adminUser.email, adminUser.role, adminUser.permissions, 1,
      adminUser.created_at, adminUser.updated_at
    );

    console.log('✅ تم إنشاء قاعدة بيانات مؤقتة بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في إنشاء قاعدة البيانات المؤقتة:', error);
    return false;
  }
}