import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

const db = new Database('qurtoba.db');
const drizzleDb = drizzle({ client: db, schema });

async function initDatabase() {
  try {
    console.log('Creating database tables...');
    
    // Create all tables using raw SQL to match the schema
    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'data_entry',
        permissions TEXT,
        is_active INTEGER DEFAULT 1,
        is_online INTEGER DEFAULT 0,
        last_login_at INTEGER,
        last_activity_at INTEGER,
        profile_image TEXT,
        ip_address TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contactPerson TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        isDeleted INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contactPerson TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        isDeleted INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        partNumber TEXT,
        lineItem TEXT NOT NULL,
        description TEXT NOT NULL,
        unit TEXT,
        category TEXT,
        specifications TEXT,
        notes TEXT,
        isDeleted INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS quotationRequests (
        id TEXT PRIMARY KEY,
        clientId TEXT NOT NULL,
        projectName TEXT NOT NULL,
        description TEXT,
        requestDate INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        dueDate INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        totalAmount REAL DEFAULT 0,
        notes TEXT,
        assignedTo TEXT,
        responseDate INTEGER,
        quoteExpiryDate INTEGER,
        orderNumber TEXT,
        sourceFile TEXT,
        importedAt INTEGER,
        importedBy TEXT,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (clientId) REFERENCES clients(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS quotationItems (
        id TEXT PRIMARY KEY,
        quotationRequestId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        quantity REAL NOT NULL,
        unitPrice REAL DEFAULT 0,
        totalPrice REAL DEFAULT 0,
        notes TEXT,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (quotationRequestId) REFERENCES quotationRequests(id),
        FOREIGN KEY (itemId) REFERENCES items(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS purchaseOrders (
        id TEXT PRIMARY KEY,
        quotationRequestId TEXT,
        supplierId TEXT NOT NULL,
        orderNumber TEXT NOT NULL,
        orderDate INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        expectedDeliveryDate INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        totalAmount REAL DEFAULT 0,
        notes TEXT,
        sourceFile TEXT,
        importedAt INTEGER,
        importedBy TEXT,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (quotationRequestId) REFERENCES quotationRequests(id),
        FOREIGN KEY (supplierId) REFERENCES suppliers(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS purchaseOrderItems (
        id TEXT PRIMARY KEY,
        purchaseOrderId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        quantity REAL NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        notes TEXT,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (purchaseOrderId) REFERENCES purchaseOrders(id),
        FOREIGN KEY (itemId) REFERENCES items(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS supplierQuotes (
        id TEXT PRIMARY KEY,
        quotationRequestId TEXT NOT NULL,
        supplierId TEXT NOT NULL,
        quotedPrice REAL NOT NULL,
        deliveryTime INTEGER,
        validUntil INTEGER,
        notes TEXT,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (quotationRequestId) REFERENCES quotationRequests(id),
        FOREIGN KEY (supplierId) REFERENCES suppliers(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS supplierPricing (
        id TEXT PRIMARY KEY,
        supplierId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        unitPrice REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        effectiveFrom INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        effectiveTo INTEGER,
        minQuantity REAL DEFAULT 1,
        leadTime INTEGER,
        notes TEXT,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (supplierId) REFERENCES suppliers(id),
        FOREIGN KEY (itemId) REFERENCES items(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS customerPricing (
        id TEXT PRIMARY KEY,
        clientId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        unitPrice REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (clientId) REFERENCES clients(id),
        FOREIGN KEY (itemId) REFERENCES items(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS pricingHistory (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        supplierId TEXT,
        clientId TEXT,
        oldPrice REAL NOT NULL,
        newPrice REAL NOT NULL,
        changeReason TEXT,
        changedBy TEXT NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (itemId) REFERENCES items(id),
        FOREIGN KEY (supplierId) REFERENCES suppliers(id),
        FOREIGN KEY (clientId) REFERENCES clients(id),
        FOREIGN KEY (changedBy) REFERENCES users(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS activityLog (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        details TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await drizzleDb.run(sql`
      CREATE TABLE IF NOT EXISTS passwordResetTokens (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    console.log('Database tables created successfully!');
    
    // Create default admin user
    try {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await drizzleDb.run(sql`
        INSERT INTO users (id, username, password, email, full_name, role, permissions, is_active) 
        VALUES ('admin-id', 'admin', ${hashedPassword}, 'admin@qurtoba.com', 'مدير النظام', 'manager', 
                ${JSON.stringify([
                  'view_dashboard', 'view_analytics', 'export_dashboard_data',
                  'create_clients', 'edit_clients', 'delete_clients', 'view_clients',
                  'create_suppliers', 'edit_suppliers', 'delete_suppliers', 'view_suppliers',
                  'create_items', 'edit_items', 'delete_items', 'view_items', 'use_ai_features',
                  'create_quotations', 'edit_quotations', 'delete_quotations', 'view_quotations', 'export_quotations',
                  'create_purchase_orders', 'edit_purchase_orders', 'delete_purchase_orders', 'view_purchase_orders',
                  'view_reports', 'export_reports',
                  'manage_users', 'view_activity_logs', 'system_settings', 'data_export'
                ])}, 1)
      `);
      
      console.log('Default admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } catch (adminError) {
      console.log('Admin user may already exist or error creating:', adminError.message);
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initDatabase();