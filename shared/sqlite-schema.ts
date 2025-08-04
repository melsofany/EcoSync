import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - SQLite compatible
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  profileImage: text("profile_image"),
  role: text("role").notNull(),
  permissions: text("permissions"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  isOnline: integer("is_online", { mode: 'boolean' }).default(false),
  lastLoginAt: integer("last_login_at"),
  lastActivityAt: integer("last_activity_at"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at").default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at").default(sql`(unixepoch() * 1000)`),
});

// Password reset tokens table
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
  used: integer("used", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at").default(sql`(unixepoch() * 1000)`),
});

// Clients table
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: integer("created_at").default(sql`(unixepoch() * 1000)`),
  createdBy: text("created_by").references(() => users.id),
});

// Activity log table
export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: text("details").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: integer("timestamp").default(sql`(unixepoch() * 1000)`),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertClientSchema = createInsertSchema(clients);
export const insertActivityLogSchema = createInsertSchema(activityLog);