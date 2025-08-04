import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const db = new Database('qurtoba.db');
const drizzleDb = drizzle({ client: db });

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    await drizzleDb.run(sql`
      INSERT INTO users (id, username, password, email, full_name, role, permissions, is_active) 
      VALUES (
        'admin-' || (unixepoch() * 1000),
        'admin',
        ${hashedPassword},
        'admin@qurtoba.com',
        'مدير النظام',
        'manager',
        ${JSON.stringify([
          'view_dashboard', 'view_analytics', 'export_dashboard_data',
          'create_clients', 'edit_clients', 'delete_clients', 'view_clients',
          'create_suppliers', 'edit_suppliers', 'delete_suppliers', 'view_suppliers',
          'create_items', 'edit_items', 'delete_items', 'view_items', 'use_ai_features',
          'create_quotations', 'edit_quotations', 'delete_quotations', 'view_quotations', 'export_quotations',
          'create_purchase_orders', 'edit_purchase_orders', 'delete_purchase_orders', 'view_purchase_orders',
          'view_reports', 'export_reports',
          'manage_users', 'view_activity_logs', 'system_settings', 'data_export'
        ])},
        1
      )
    `);
    
    // Create a test user with permissions
    const testHashedPassword = await bcrypt.hash('123456', 10);
    await drizzleDb.run(sql`
      INSERT INTO users (id, username, password, email, full_name, role, permissions, is_active) 
      VALUES (
        'user-' || (unixepoch() * 1000),
        'user1',
        ${testHashedPassword},
        'user1@qurtoba.com',
        'موظف البيانات',
        'data_entry',
        ${JSON.stringify([
          'view_dashboard',
          'create_clients', 'edit_clients', 'view_clients',
          'create_suppliers', 'edit_suppliers', 'view_suppliers',
          'create_items', 'edit_items', 'view_items',
          'create_quotations', 'edit_quotations', 'view_quotations'
        ])},
        1
      )
    `);
    
    // Create purchasing user
    const purchasingHashedPassword = await bcrypt.hash('purchase123', 10);
    await drizzleDb.run(sql`
      INSERT INTO users (id, username, password, email, full_name, role, permissions, is_active) 
      VALUES (
        'purchasing-' || (unixepoch() * 1000),
        'purchasing',
        ${purchasingHashedPassword},
        'purchasing@qurtoba.com',
        'موظف المشتريات',
        'purchasing',
        ${JSON.stringify([
          'view_dashboard',
          'view_clients', 'view_suppliers',
          'view_items', 'view_quotations',
          'create_purchase_orders', 'edit_purchase_orders', 'view_purchase_orders'
        ])},
        1
      )
    `);
    
    // Create accounting user
    const accountingHashedPassword = await bcrypt.hash('accounting123', 10);
    await drizzleDb.run(sql`
      INSERT INTO users (id, username, password, email, full_name, role, permissions, is_active) 
      VALUES (
        'accounting-' || (unixepoch() * 1000),
        'accounting',
        ${accountingHashedPassword},
        'accounting@qurtoba.com',
        'موظف الحسابات',
        'accounting',
        ${JSON.stringify([
          'view_dashboard', 'view_analytics',
          'view_clients', 'view_suppliers', 'view_items',
          'view_quotations', 'view_purchase_orders',
          'view_reports', 'export_reports'
        ])},
        1
      )
    `);
    
    console.log('✅ جميع المستخدمين تم إنشاؤهم بنجاح!');
    console.log('');
    console.log('بيانات المستخدمين:');
    console.log('─────────────────────────────────────');
    console.log('المدير العام:');
    console.log('اسم المستخدم: admin');
    console.log('كلمة المرور: admin123');
    console.log('');
    console.log('موظف البيانات:');
    console.log('اسم المستخدم: user1');
    console.log('كلمة المرور: 123456');
    console.log('');
    console.log('موظف المشتريات:');
    console.log('اسم المستخدم: purchasing');
    console.log('كلمة المرور: purchase123');
    console.log('');
    console.log('موظف الحسابات:');
    console.log('اسم المستخدم: accounting');
    console.log('كلمة المرور: accounting123');
    
  } catch (error) {
    console.error('خطأ في إنشاء المستخدمين:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

createAdminUser();