import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import bcrypt from 'bcrypt';

// Use SQLite for development to avoid database connection issues
const sqlite = new Database('./qurtoba.db');
export const db = drizzle(sqlite, { schema });

// Initialize database tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    profile_image TEXT,
    role TEXT NOT NULL DEFAULT 'data_entry',
    is_active INTEGER NOT NULL DEFAULT 1,
    is_online INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT,
    last_activity_at TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    contactPerson TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quotationRequests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    rfqNumber TEXT UNIQUE NOT NULL,
    clientId TEXT NOT NULL,
    description TEXT,
    requestDate TEXT NOT NULL,
    responseDate TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (clientId) REFERENCES clients (id)
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    lineItem TEXT UNIQUE NOT NULL,
    partNumber TEXT,
    description TEXT NOT NULL,
    pNumber TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quotationItems (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    quotationId TEXT NOT NULL,
    lineItem TEXT NOT NULL,
    partNumber TEXT,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (quotationId) REFERENCES quotationRequests (id)
  );

  CREATE TABLE IF NOT EXISTS purchaseOrders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    poNumber TEXT UNIQUE NOT NULL,
    supplierId TEXT NOT NULL,
    rfqNumber TEXT,
    poDate TEXT NOT NULL,
    deliveryDate TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    totalAmount REAL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (supplierId) REFERENCES suppliers (id)
  );

  CREATE TABLE IF NOT EXISTS purchaseOrderItems (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    poId TEXT NOT NULL,
    lineItem TEXT NOT NULL,
    partNumber TEXT,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unitPrice REAL NOT NULL,
    totalPrice REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    unit TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (poId) REFERENCES purchaseOrders (id)
  );

  CREATE TABLE IF NOT EXISTS activityLog (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    action TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    details TEXT,
    ipAddress TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS passwordResetTokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users (id)
  );
`);

// Create default admin user
const adminExists = sqlite.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
if (!adminExists || adminExists.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  sqlite.prepare(`
    INSERT INTO users (username, password, full_name, role, is_active) 
    VALUES (?, ?, ?, ?, ?)
  `).run('admin', hashedPassword, 'مدير النظام', 'manager', 1);
  console.log('✅ Default admin user created: username=admin, password=admin123');
}