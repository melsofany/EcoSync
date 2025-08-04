import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  profileImage: text("profile_image"), // URL للصورة الشخصية
  role: text("role").notNull(), // "manager", "it_admin", "data_entry", "purchasing", "accounting"
  isActive: boolean("is_active").default(true),
  isOnline: boolean("is_online").default(false),
  lastLoginAt: timestamp("last_login_at"),
  lastActivityAt: timestamp("last_activity_at"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Quotation requests table
export const quotationRequests = pgTable("quotation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: text("request_number").notNull().unique(),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  requestDate: text("request_date").notNull(), // Changed to text for easier form handling
  expiryDate: text("expiry_date"), // Changed to text for easier form handling
  status: text("status").default("pending"), // "pending", "processing", "completed", "cancelled"
  responsibleEmployee: text("responsible_employee"),
  customRequestNumber: text("custom_request_number"), // Added field for client's request number
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Items table
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemNumber: text("item_number").notNull().unique().default(sql`generate_p_number()`), // P-000001
  kItemId: text("k_item_id").notNull().unique(), // K-generated ID 
  partNumber: text("part_number"),
  normalizedPartNumber: text("normalized_part_number"), // معرف البند الموحد
  lineItem: text("line_item"),
  description: text("description").notNull(),
  unit: text("unit").notNull(), // Each/Piece/Meter/Carton/Feet/Kit/Packet/Reel/Set
  category: text("category"),
  brand: text("brand"),
  aiStatus: text("ai_status").default("pending"), // "pending", "processed", "verified", "duplicate"
  aiMatchedItemId: varchar("ai_matched_item_id"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
});

// Quotation items table
export const quotationItems = pgTable("quotation_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationId: varchar("quotation_id").references(() => quotationRequests.id).notNull(),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("EGP"),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  supplierQuoteDate: timestamp("supplier_quote_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Purchase orders table
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poNumber: text("po_number").notNull().unique(),
  quotationId: varchar("quotation_id").references(() => quotationRequests.id).notNull(),
  poDate: timestamp("po_date").defaultNow(),
  status: text("status").default("pending"), // "pending", "confirmed", "delivered", "invoiced"
  totalValue: decimal("total_value"),
  deliveryStatus: boolean("delivery_status").default(false),
  invoiceIssued: boolean("invoice_issued").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
});

// Purchase order items table
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poId: varchar("po_id").references(() => purchaseOrders.id).notNull(),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("EGP"),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Supplier pricing system
export const supplierPricing = pgTable("supplier_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => items.id, { onDelete: "cascade" }).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("EGP").notNull(),
  priceReceivedDate: timestamp("price_received_date").notNull(),
  validityPeriod: integer("validity_period"), // days
  minimumOrderQuantity: integer("minimum_order_quantity"),
  deliveryTime: integer("delivery_time"), // days
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  status: text("status").default("active").notNull(), // active, expired, superseded
  quotationRequestId: varchar("quotation_request_id").references(() => quotationRequests.id),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id),
  isSelected: boolean("is_selected").default(false), // Whether this price was selected for PO
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer Pricing table (المرحلة الثانية - تسعير العملاء)
export const customerPricing = pgTable("customer_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationId: varchar("quotation_id").references(() => quotationRequests.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").references(() => items.id, { onDelete: "cascade" }).notNull(),
  supplierPricingId: varchar("supplier_pricing_id").references(() => supplierPricing.id),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }).notNull(), // سعر التكلفة من المورد
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }), // هامش الربح %
  sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).notNull(), // سعر البيع للعميل
  currency: text("currency").default("EGP").notNull(),
  quantity: integer("quantity").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pricing History table (سجل تاريخ التسعير)
export const pricingHistory = pgTable("pricing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => items.id, { onDelete: "cascade" }).notNull(),
  priceType: text("price_type").notNull(), // supplier, customer
  referenceId: varchar("reference_id").notNull(), // supplierPricingId أو customerPricingId
  oldPrice: decimal("old_price", { precision: 12, scale: 2 }),
  newPrice: decimal("new_price", { precision: 12, scale: 2 }).notNull(),
  changeReason: text("change_reason"),
  changedBy: varchar("changed_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Keep existing supplier quotes for backward compatibility  
export const supplierQuotes = pgTable("supplier_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  unitPrice: decimal("unit_price").notNull(),
  quoteDate: timestamp("quote_date").defaultNow(),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
});

// Activity log table
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"), // "quotation", "item", "purchase_order", etc.
  entityId: varchar("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertQuotationRequestSchema = createInsertSchema(quotationRequests).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  requestDate: z.string().min(1, "تاريخ الطلب مطلوب"),
  expiryDate: z.string().optional(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  itemNumber: true,
  createdAt: true,
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
  createdAt: true,
}).extend({
  quantity: z.coerce.string(),
  unitPrice: z.coerce.string().optional(),
  totalPrice: z.coerce.string().optional(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
}).extend({
  poDate: z.date().optional(),
  totalValue: z.string().optional(),
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierQuoteSchema = createInsertSchema(supplierQuotes).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierPricingSchema = createInsertSchema(supplierPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  unitPrice: z.coerce.string().min(1, "السعر مطلوب"),
  priceReceivedDate: z.string().min(1, "تاريخ ورود السعر مطلوب"),
});

export const insertCustomerPricingSchema = createInsertSchema(customerPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingHistorySchema = createInsertSchema(pricingHistory).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type QuotationRequest = typeof quotationRequests.$inferSelect;
export type InsertQuotationRequest = z.infer<typeof insertQuotationRequestSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type SupplierQuote = typeof supplierQuotes.$inferSelect;
export type InsertSupplierQuote = z.infer<typeof insertSupplierQuoteSchema>;
export type SupplierPricing = typeof supplierPricing.$inferSelect;
export type InsertSupplierPricing = z.infer<typeof insertSupplierPricingSchema>;
export type CustomerPricing = typeof customerPricing.$inferSelect;
export type InsertCustomerPricing = z.infer<typeof insertCustomerPricingSchema>;
export type PricingHistory = typeof pricingHistory.$inferSelect;
export type InsertPricingHistory = z.infer<typeof insertPricingHistorySchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Extended types for joined queries
export type QuotationItemWithDetails = QuotationItem & {
  itemNumber?: string;
  kItemId?: string;
  partNumber?: string;
  lineItem?: string;
  description?: string;
  unit?: string;
  category?: string;
  brand?: string;
  supplierName?: string;
};

// Add the self-reference relation for items after the table is defined
// This avoids the circular reference issue during table definition
