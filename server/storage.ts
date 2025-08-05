import {
  users,
  clients,
  quotationRequests,
  items, 
  quotationItems,
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
  supplierQuotes,
  supplierPricing,
  customerPricing,
  pricingHistory,
  activityLog,
  passwordResetTokens,
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type QuotationRequest,
  type InsertQuotationRequest,
  type Item,
  type InsertItem,
  type QuotationItem,
  type InsertQuotationItem,
  type Supplier,
  type InsertSupplier,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  type SupplierQuote,
  type InsertSupplierQuote,
  type SupplierPricing,
  type InsertSupplierPricing,
  type CustomerPricing,
  type InsertCustomerPricing,
  type PricingHistory,
  type InsertPricingHistory,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db.js";
import { eq, desc, like, and, isNull, isNotNull, sql, or } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserOnlineStatus(id: string, isOnline: boolean, ipAddress?: string): Promise<void>;

  // Password reset operations
  createPasswordResetToken(data: { userId: string; token: string; email: string; expiresAt: Date }): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; email: string; expiresAt: Date; used: boolean } | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;

  // Client operations
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientById(id: string): Promise<Client | undefined>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  // Quotation operations
  createQuotationRequest(request: InsertQuotationRequest): Promise<QuotationRequest>;
  getAllQuotationRequests(): Promise<QuotationRequest[]>;
  getQuotationRequest(id: string): Promise<QuotationRequest | undefined>;
  getQuotationById(id: string): Promise<QuotationRequest | undefined>;
  updateQuotationRequest(id: string, updates: Partial<QuotationRequest>): Promise<QuotationRequest | undefined>;
  deleteQuotation(id: string): Promise<void>;
  getNextRequestNumber(): Promise<string>;

  // Item operations
  createItem(item: InsertItem): Promise<Item>;
  getAllItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  getItemById(id: string): Promise<Item | undefined>;
  updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<void>;
  getNextItemNumber(): Promise<string>;
  findSimilarItems(description: string, partNumber?: string): Promise<Item[]>;

  // Quotation items
  addQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  getQuotationItems(quotationId: string): Promise<QuotationItem[]>;
  removeQuotationItem(itemId: string): Promise<void>;
  updateQuotationItem(id: string, updates: Partial<QuotationItem>): Promise<QuotationItem | undefined>;
  deleteQuotationItem(id: string): Promise<boolean>;
  addItemToQuotation(quotationId: string, itemData: { itemId: string; quantity: number; lineNumber?: number; clientPrice?: number }): Promise<QuotationItem>;

  // Supplier operations
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSupplierById(id: string): Promise<Supplier | undefined>;
  updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;

  // Purchase order operations
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  getAllPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined>;
  getNextPONumber(): Promise<string>;

  // Purchase order items
  addPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  getPurchaseOrderItems(poId: string): Promise<PurchaseOrderItem[]>;
  updatePurchaseOrderItem(itemId: string, updates: Partial<PurchaseOrderItem>): Promise<PurchaseOrderItem | undefined>;
  deletePurchaseOrderItem(itemId: string): Promise<PurchaseOrderItem | undefined>;
  updatePurchaseOrderTotal(poId: string): Promise<void>;

  // Supplier quotes
  addSupplierQuote(quote: InsertSupplierQuote): Promise<SupplierQuote>;
  getSupplierQuotes(itemId: string): Promise<SupplierQuote[]>;
  updateSupplierQuote(id: string, updates: Partial<SupplierQuote>): Promise<SupplierQuote | undefined>;

  // Activity logging
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getActivities(limit?: number): Promise<ActivityLog[]>;

  // Statistics
  getStatistics(): Promise<{
    totalQuotations: number;
    pendingQuotations: number;
    completedQuotations: number;
    totalItems: number;
    totalPurchaseOrders: number;
    pendingPurchaseOrders: number;
    totalClients: number;
    totalSuppliers: number;
  }>;

  // Supplier pricing operations
  createSupplierPricing(pricing: InsertSupplierPricing): Promise<SupplierPricing>;
  getSupplierPricingByItem(itemId: string): Promise<SupplierPricing[]>;
  getAllSupplierPricing(): Promise<SupplierPricing[]>;
  updateSupplierPricing(id: string, updates: Partial<SupplierPricing>): Promise<SupplierPricing | undefined>;
  getItemsRequiringPricing(): Promise<Item[]>;
  getPricingHistoryForItem(itemId: string): Promise<SupplierPricing[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete all related data in correct order to avoid foreign key constraints
    
    // 1. Delete password reset tokens
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    
    // 2. Delete activity logs
    await db.delete(activityLog).where(eq(activityLog.userId, id));
    
    // 3. Update quotation requests to remove user reference (set createdBy to null)
    await db.update(quotationRequests)
      .set({ createdBy: null })
      .where(eq(quotationRequests.createdBy, id));
    
    // 4. Update clients to remove user reference (set createdBy to null)
    await db.update(clients)
      .set({ createdBy: null })
      .where(eq(clients.createdBy, id));
    
    // 5. Update items to remove user reference (set createdBy to null)
    await db.update(items)
      .set({ createdBy: null })
      .where(eq(items.createdBy, id));
    
    // 6. Update purchase orders to remove user reference (set createdBy to null)
    await db.update(purchaseOrders)
      .set({ createdBy: null })
      .where(eq(purchaseOrders.createdBy, id));
    
    // 7. Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean, ipAddress?: string): Promise<void> {
    await db
      .update(users)
      .set({
        isOnline,
        lastActivityAt: new Date(),
        ...(ipAddress && { ipAddress }),
        ...(isOnline && { lastLoginAt: new Date() }),
      })
      .where(eq(users.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Password reset token operations
  async createPasswordResetToken(data: { userId: string; token: string; email: string; expiresAt: Date }): Promise<void> {
    await db.insert(passwordResetTokens).values(data);
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; email: string; expiresAt: Date; used: boolean } | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  // Client operations
  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<void> {
    // Simply delete the client - quotations will keep the client name but lose the reference
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Quotation operations
  async getQuotations(): Promise<QuotationRequest[]> {
    return await db.select().from(quotationRequests).orderBy(desc(quotationRequests.createdAt));
  }

  async createQuotation(requestData: InsertQuotationRequest): Promise<QuotationRequest> {
    return this.createQuotationRequest(requestData);
  }

  async createQuotationRequest(requestData: InsertQuotationRequest): Promise<QuotationRequest> {
    const requestNumber = await this.getNextRequestNumber();
    const [quotation] = await db
      .insert(quotationRequests)
      .values({
        ...requestData,
        requestNumber,
      })
      .returning();
    return quotation;
  }

  async getAllQuotationRequests(): Promise<QuotationRequest[]> {
    return await db.select().from(quotationRequests).orderBy(desc(quotationRequests.createdAt));
  }

  async getAllQuotationRequestsWithClients(): Promise<any[]> {
    const results = await db
      .select({
        id: quotationRequests.id,
        requestNumber: quotationRequests.requestNumber,
        clientId: quotationRequests.clientId,
        requestDate: quotationRequests.requestDate,
        expiryDate: quotationRequests.expiryDate,
        status: quotationRequests.status,
        responsibleEmployee: quotationRequests.responsibleEmployee,
        customRequestNumber: quotationRequests.customRequestNumber,
        notes: quotationRequests.notes,
        createdAt: quotationRequests.createdAt,
        createdBy: quotationRequests.createdBy,
        updatedAt: quotationRequests.updatedAt,
        // Client details
        clientName: clients.name,
      })
      .from(quotationRequests)
      .leftJoin(clients, eq(quotationRequests.clientId, clients.id))
      .orderBy(desc(quotationRequests.createdAt));
    
    return results;
  }

  async getQuotationRequest(id: string): Promise<QuotationRequest | undefined> {
    const [quotation] = await db.select().from(quotationRequests).where(eq(quotationRequests.id, id));
    return quotation || undefined;
  }

  async updateQuotationRequest(id: string, updates: Partial<QuotationRequest>): Promise<QuotationRequest | undefined> {
    const [quotation] = await db
      .update(quotationRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quotationRequests.id, id))
      .returning();
    return quotation || undefined;
  }

  async getQuotationById(id: string): Promise<any | undefined> {
    const results = await db
      .select({
        id: quotationRequests.id,
        requestNumber: quotationRequests.requestNumber,
        clientId: quotationRequests.clientId,
        requestDate: quotationRequests.requestDate,
        expiryDate: quotationRequests.expiryDate,
        status: quotationRequests.status,
        responsibleEmployee: quotationRequests.responsibleEmployee,
        customRequestNumber: quotationRequests.customRequestNumber,
        notes: quotationRequests.notes,
        createdAt: quotationRequests.createdAt,
        createdBy: quotationRequests.createdBy,
        updatedAt: quotationRequests.updatedAt,
        // Client details
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
      })
      .from(quotationRequests)
      .leftJoin(clients, eq(quotationRequests.clientId, clients.id))
      .where(eq(quotationRequests.id, id));
    
    return results[0] || undefined;
  }

  async deleteQuotation(id: string): Promise<void> {
    // First delete related quotation items
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    
    // Then delete the quotation itself
    await db.delete(quotationRequests).where(eq(quotationRequests.id, id));
  }

  async getNextRequestNumber(): Promise<string> {
    const lastRequest = await db.select({ requestNumber: quotationRequests.requestNumber })
      .from(quotationRequests)
      .orderBy(desc(quotationRequests.createdAt))
      .limit(1);
    
    if (lastRequest.length === 0) {
      return "REQ00000001";
    }
    
    const lastNumber = parseInt(lastRequest[0].requestNumber.replace("REQ", ""));
    const nextNumber = (lastNumber + 1).toString().padStart(8, "0");
    return `REQ${nextNumber}`;
  }

  // Item operations
  async createItem(itemData: InsertItem): Promise<Item> {
    const itemNumber = await this.getNextItemNumber();
    const [item] = await db
      .insert(items)
      .values({
        ...itemData,
        itemNumber,
      })
      .returning();
    return item;
  }

  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items).orderBy(desc(items.createdAt));
  }

  async getItemCount(): Promise<number> {
    const result = await db.select().from(items);
    return result.length;
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async getItemById(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async deleteItem(id: string): Promise<void> {
    // First delete related quotation items to avoid foreign key constraint violation
    await db.delete(quotationItems).where(eq(quotationItems.itemId, id));
    
    // Then delete the item itself
    await db.delete(items).where(eq(items.id, id));
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    return item || undefined;
  }

  async getNextItemNumber(): Promise<string> {
    try {
      console.log('🔢 Generating next item number...');
      
      // الحصول على جميع الأصناف التي تبدأ بـ P-
      const allItems = await db.select({ itemNumber: items.itemNumber }).from(items);
      console.log(`📊 Found ${allItems.length} total items`);
      
      // البحث عن أعلى رقم P- صحيح
      let maxNumber = 0;
      for (const item of allItems) {
        if (item.itemNumber && item.itemNumber.startsWith('P-')) {
          const numberPart = item.itemNumber.replace('P-', '');
          const num = parseInt(numberPart, 10);
          console.log(`🔍 Checking item: ${item.itemNumber}, number part: ${numberPart}, parsed: ${num}`);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
      
      console.log(`📈 Max number found: ${maxNumber}`);
      
      // إنشاء الرقم التالي
      const nextNumber = (maxNumber + 1).toString().padStart(6, '0');
      const result = `P-${nextNumber}`;
      console.log(`✅ Generated item number: ${result}`);
      
      return result;
    } catch (error) {
      console.error("❌ Error getting next item number:", error);
      // في حالة الخطأ، ابدأ من P-000001
      return "P-000001";
    }
  }

  async findSimilarItems(description: string, partNumber?: string): Promise<Item[]> {
    let results: Item[] = [];
    
    if (partNumber) {
      // 1. البحث عن التطابق الدقيق في رقم القطعة (أولوية عالية)
      const exactPartMatch = await db.select().from(items).where(
        eq(items.partNumber, partNumber)
      ).limit(5);
      results.push(...exactPartMatch);
      
      // 2. البحث عن التشابه في رقم القطعة (إزالة المسافات والأحرف الخاصة)
      const cleanPartNumber = partNumber.replace(/[\s\-_]/g, '').toUpperCase();
      if (cleanPartNumber !== partNumber.toUpperCase()) {
        const similarPartMatch = await db.select().from(items).where(
          or(
            like(items.partNumber, `%${cleanPartNumber}%`),
            like(items.partNumber, `%${partNumber.replace(/[\s]/g, '%')}%`)
          )
        ).limit(5);
        results.push(...similarPartMatch);
      }
      
      // 3. البحث في LINE ITEM للنماذج المشابهة
      const lineItemMatch = await db.select().from(items).where(
        like(items.lineItem, `%${partNumber}%`)
      ).limit(3);
      results.push(...lineItemMatch);
    }
    
    // 4. البحث بالوصف للعناصر المشابهة
    if (description && description.length > 5) {
      // استخراج الكلمات المهمة من الوصف
      const keywords = description.split(/[\s,\-_]+/)
        .filter(word => word.length > 2)
        .slice(0, 3); // أخذ أول 3 كلمات مهمة
      
      for (const keyword of keywords) {
        const descriptionMatch = await db.select().from(items).where(
          like(items.description, `%${keyword}%`)
        ).limit(3);
        results.push(...descriptionMatch);
      }
    }
    
    // إزالة التكرارات والحد من النتائج
    const uniqueResults = results.filter((item, index, self) => 
      index === self.findIndex(i => i.id === item.id)
    );
    
    return uniqueResults.slice(0, 10);
  }

  // Quotation items
  async addQuotationItem(itemData: InsertQuotationItem): Promise<QuotationItem> {
    const [item] = await db
      .insert(quotationItems)
      .values(itemData)
      .returning();
    return item;
  }

  async getQuotationItems(quotationId: string): Promise<any[]> {
    const results = await db
      .select({
        id: quotationItems.id,
        quotationId: quotationItems.quotationId,
        itemId: quotationItems.itemId,
        quantity: quotationItems.quantity,
        unitPrice: quotationItems.unitPrice,
        totalPrice: quotationItems.totalPrice,
        currency: quotationItems.currency,
        supplierId: quotationItems.supplierId,
        supplierQuoteDate: quotationItems.supplierQuoteDate,
        createdAt: quotationItems.createdAt,
        // Complete item details
        itemNumber: items.itemNumber,
        kItemId: items.kItemId,
        partNumber: items.partNumber,
        lineItem: items.lineItem,
        description: items.description,
        unit: items.unit,
        category: items.category,
        brand: items.brand,
        // Supplier details
        supplierName: suppliers.name,
      })
      .from(quotationItems)
      .leftJoin(items, eq(quotationItems.itemId, items.id))
      .leftJoin(suppliers, eq(quotationItems.supplierId, suppliers.id))
      .where(eq(quotationItems.quotationId, quotationId));
    
    return results;
  }

  async removeQuotationItem(itemId: string): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.id, itemId));
  }

  async updateQuotationItem(id: string, updates: Partial<QuotationItem>): Promise<QuotationItem | undefined> {
    const [item] = await db
      .update(quotationItems)
      .set(updates)
      .where(eq(quotationItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteQuotationItem(id: string): Promise<boolean> {
    const result = await db.delete(quotationItems).where(eq(quotationItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addItemToQuotation(quotationId: string, itemData: { itemId: string; quantity: number; lineNumber?: number; clientPrice?: number }): Promise<QuotationItem> {
    const [quotationItem] = await db
      .insert(quotationItems)
      .values({
        quotationId,
        itemId: itemData.itemId,
        quantity: itemData.quantity.toString(),
        unitPrice: itemData.clientPrice ? itemData.clientPrice.toString() : undefined,
        totalPrice: itemData.clientPrice ? (itemData.clientPrice * itemData.quantity).toString() : undefined,
        currency: 'EGP'
      })
      .returning();
    return quotationItem;
  }

  // Supplier operations
  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values(supplierData)
      .returning();
    return supplier;
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(updates)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: string): Promise<void> {
    // Simply delete the supplier - pricing records will keep the supplier name but lose the reference
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async createPurchaseOrder(poData: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const poNumber = await this.getNextPONumber();
    const [po] = await db
      .insert(purchaseOrders)
      .values({
        ...poData,
        poNumber,
      })
      .returning();
    return po;
  }

  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }

  async getNextPONumber(): Promise<string> {
    const [lastPO] = await db
      .select({ poNumber: purchaseOrders.poNumber })
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.poNumber))
      .limit(1);
    
    if (lastPO?.poNumber) {
      const lastNumber = parseInt(lastPO.poNumber.replace('PO', ''));
      const nextNumber = (lastNumber + 1).toString().padStart(6, '0');
      return `PO${nextNumber}`;
    }
    
    return 'PO000001';
  }

  async getNextItemNumber(): Promise<string> {
    const [lastItem] = await db
      .select({ itemNumber: items.itemNumber })
      .from(items)
      .orderBy(desc(items.itemNumber))
      .limit(1);
    
    if (lastItem?.itemNumber) {
      const lastNumber = parseInt(lastItem.itemNumber.replace('ELEK', ''));
      const nextNumber = (lastNumber + 1).toString().padStart(8, '0');
      return `ELEK${nextNumber}`;
    }
    
    return 'ELEK00000001';
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po || undefined;
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const [po] = await db
      .update(purchaseOrders)
      .set(updates)
      .where(eq(purchaseOrders.id, id))
      .returning();
    return po || undefined;
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    // First delete related purchase order items
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
    
    // Then delete the purchase order itself
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }

  // Purchase order items
  async addPurchaseOrderItem(itemData: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const [item] = await db
      .insert(purchaseOrderItems)
      .values(itemData)
      .returning();
    return item;
  }

  // Supplier quotes
  async addSupplierQuote(quoteData: InsertSupplierQuote): Promise<SupplierQuote> {
    const [quote] = await db
      .insert(supplierQuotes)
      .values(quoteData)
      .returning();
    return quote;
  }

  async getSupplierQuotes(itemId: string): Promise<SupplierQuote[]> {
    return await db.select().from(supplierQuotes)
      .where(and(eq(supplierQuotes.itemId, itemId), eq(supplierQuotes.isActive, true)))
      .orderBy(desc(supplierQuotes.createdAt));
  }

  async updateSupplierQuote(id: string, updates: Partial<SupplierQuote>): Promise<SupplierQuote | undefined> {
    const [quote] = await db
      .update(supplierQuotes)
      .set(updates)
      .where(eq(supplierQuotes.id, id))
      .returning();
    return quote || undefined;
  }

  // Activity logging
  async logActivity(activityData: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db
      .insert(activityLog)
      .values(activityData)
      .returning();
    return activity;
  }

  async getClientByName(name: string): Promise<SelectClient | null> {
    if (!name) return null;
    const results = await db.select().from(clients).where(eq(clients.name, name)).limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async getAllQuotations(): Promise<any[]> {
    return await db.select().from(quotationRequests);
  }

  async getAllItems(): Promise<any[]> {
    return await db.select().from(items);
  }

  async getAllPurchaseOrders(): Promise<any[]> {
    return await db.select().from(purchaseOrders);
  }

  async getAllClients(): Promise<any[]> {
    return await db.select().from(clients);
  }

  async getAllSuppliers(): Promise<any[]> {
    return await db.select().from(suppliers);
  }

  async getAllUsers(): Promise<any[]> {
    return await db.select().from(users);
  }

  async addItemToQuotation(quotationId: string, itemData: { itemId: string; quantity: number; lineNumber: number }): Promise<void> {
    await db.insert(quotationItems).values({
      quotationId,
      itemId: itemData.itemId,
      quantity: itemData.quantity.toString(),
      lineNumber: itemData.lineNumber
    });
  }

  async getActivities(limit: number = 50): Promise<any[]> {
    const result = await db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        action: activityLog.action,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        details: activityLog.details,
        ipAddress: activityLog.ipAddress,
        timestamp: activityLog.timestamp,
        userFullName: users.fullName,
        username: users.username,
        userProfileImage: users.profileImage
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.timestamp))
      .limit(limit);
    
    return result;
  }

  // Statistics
  async getStatistics() {
    const quotations = await db.select().from(quotationRequests);
    const itemsData = await db.select().from(items);
    const clientsData = await db.select().from(clients);
    const suppliersData = await db.select().from(suppliers);
    const purchaseOrdersData = await db.select().from(purchaseOrders);

    return {
      totalQuotations: quotations.length,
      pendingQuotations: quotations.filter(q => q.status === "pending").length,
      completedQuotations: quotations.filter(q => q.status === "completed").length,
      totalItems: itemsData.length,
      totalPurchaseOrders: purchaseOrdersData.length,
      pendingPurchaseOrders: purchaseOrdersData.filter(po => po.status === "pending").length,
      totalClients: clientsData.length,
      totalSuppliers: suppliersData.length,
    };
  }

  // Supplier pricing operations
  async createSupplierPricing(pricingData: InsertSupplierPricing): Promise<SupplierPricing> {
    const [pricing] = await db
      .insert(supplierPricing)
      .values({
        ...pricingData,
        priceReceivedDate: new Date(pricingData.priceReceivedDate),
      })
      .returning();
    return pricing;
  }

  async getQuotationItemsByItemId(itemId: string): Promise<any[]> {
    return await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.itemId, itemId));
  }

  async getSupplierPricingByItem(itemId: string): Promise<SupplierPricing[]> {
    return await db
      .select()
      .from(supplierPricing)
      .where(eq(supplierPricing.itemId, itemId))
      .orderBy(desc(supplierPricing.priceReceivedDate));
  }

  async getAllSupplierPricing(): Promise<SupplierPricing[]> {
    return await db
      .select()
      .from(supplierPricing)
      .orderBy(desc(supplierPricing.createdAt));
  }

  async updateSupplierPricing(id: string, updates: Partial<SupplierPricing>): Promise<SupplierPricing | undefined> {
    const [pricing] = await db
      .update(supplierPricing)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplierPricing.id, id))
      .returning();
    return pricing || undefined;
  }

  async getItemsRequiringPricing(): Promise<any[]> {
    // Get items from quotations that have been sent for pricing and don't have supplier pricing yet
    const itemsNeedingPricing = await db
      .select({
        id: items.id,
        itemNumber: items.itemNumber,
        kItemId: items.kItemId,
        description: items.description,
        partNumber: items.partNumber,
        lineItem: items.lineItem,
        unit: items.unit,
        category: items.category,
        createdAt: items.createdAt,
        quotationId: quotationItems.quotationId,
        quantity: quotationItems.quantity,
        quotationStatus: quotationRequests.status,
        requestNumber: quotationRequests.requestNumber,
        requestDate: quotationRequests.requestDate,
        expiryDate: quotationRequests.expiryDate,
      })
      .from(items)
      .innerJoin(quotationItems, eq(items.id, quotationItems.itemId))
      .innerJoin(quotationRequests, eq(quotationItems.quotationId, quotationRequests.id))
      .leftJoin(
        supplierPricing,
        and(
          eq(items.id, supplierPricing.itemId),
          eq(supplierPricing.status, "active")
        )
      )
      .where(
        and(
          or(
            eq(quotationRequests.status, "pending"),
            eq(quotationRequests.status, "sent_for_pricing")
          ),
          isNull(supplierPricing.itemId),
          or(
            isNotNull(quotationRequests.expiryDate), // الطلبات مع تاريخ انتهاء
            sql`${quotationRequests.requestDate}::date >= CURRENT_DATE` // الطلبات الجديدة من اليوم حتى لو بدون تاريخ انتهاء
          )
        )
      )
      .orderBy(desc(quotationRequests.createdAt));

    return itemsNeedingPricing;
  }

  async getPricingHistoryForItem(itemId: string): Promise<SupplierPricing[]> {
    return await db
      .select()
      .from(supplierPricing)
      .where(eq(supplierPricing.itemId, itemId))
      .orderBy(desc(supplierPricing.priceReceivedDate));
  }

  // Customer pricing operations (المرحلة الثانية - تسعير العملاء)
  async createCustomerPricing(pricingData: InsertCustomerPricing): Promise<CustomerPricing> {
    const [pricing] = await db
      .insert(customerPricing)
      .values(pricingData)
      .returning();
    return pricing;
  }

  async getCustomerPricingByQuotation(quotationId: string): Promise<CustomerPricing[]> {
    return await db
      .select()
      .from(customerPricing)
      .where(eq(customerPricing.quotationId, quotationId))
      .orderBy(desc(customerPricing.createdAt));
  }

  async updateCustomerPricing(id: string, updates: Partial<CustomerPricing>): Promise<CustomerPricing | undefined> {
    const [pricing] = await db
      .update(customerPricing)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerPricing.id, id))
      .returning();
    return pricing || undefined;
  }

  async approveCustomerPricing(id: string, approvedBy: string): Promise<CustomerPricing | undefined> {
    const [pricing] = await db
      .update(customerPricing)
      .set({ 
        status: "approved", 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(customerPricing.id, id))
      .returning();
    return pricing || undefined;
  }

  // Get items ready for customer pricing (items with supplier pricing but no customer pricing)
  async getItemHistoricalPricing(itemId: string): Promise<any[]> {
    try {
      // Get historical pricing data for an item from original Excel sheets
      const item = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
      if (!item.length) return [];

      const lineItem = item[0].lineItem;
      if (!lineItem) return [];

      console.log(`Searching for LINE ITEM: ${lineItem}`);

      // Use Drizzle ORM query instead of raw SQL
      const historicalData = await db
        .select({
          kItemId: items.kItemId,
          description: items.description,
          lineItem: items.lineItem,
          partNumber: items.partNumber,
          unit: items.unit,
          category: items.category,
          unitPrice: quotationItems.unitPrice,
          totalPrice: quotationItems.totalPrice,
          quantity: quotationItems.quantity,
          currency: quotationItems.currency,
          requestNumber: quotationRequests.customRequestNumber,
          requestDate: quotationRequests.requestDate,
          clientName: clients.name,
          sourceType: sql<string>`'quotation'`.as('sourceType'),
        })
        .from(items)
        .innerJoin(quotationItems, eq(items.id, quotationItems.itemId))
        .innerJoin(quotationRequests, eq(quotationItems.quotationId, quotationRequests.id))
        .innerJoin(clients, eq(quotationRequests.clientId, clients.id))
        .where(eq(items.lineItem, lineItem))
        .orderBy(desc(quotationRequests.requestDate));

      console.log(`Found ${historicalData.length} historical records for LINE ITEM: ${lineItem}`);
      return historicalData;
    } catch (error) {
      console.error('Error fetching historical pricing:', error);
      return [];
    }
  }

  async getItemsReadyForCustomerPricing(): Promise<any[]> {
    // Get all items that need customer pricing - NO supplier pricing requirement
    console.log('🎯 Getting items ready for customer pricing WITHOUT supplier pricing requirement');
    
    const itemsNeedingCustomerPricing = await db
      .select({
        id: items.id,
        itemNumber: items.itemNumber,
        kItemId: items.kItemId,
        description: items.description,
        partNumber: items.partNumber,
        lineItem: items.lineItem,
        unit: items.unit,
        category: items.category,
        createdAt: items.createdAt,
        quotationId: quotationItems.quotationId,
        quantity: quotationItems.quantity,
        quotationStatus: quotationRequests.status,
        requestNumber: quotationRequests.requestNumber,
        requestDate: quotationRequests.requestDate,
        expiryDate: quotationRequests.expiryDate,
        supplierPrice: supplierPricing.unitPrice, // Optional - may be null
        supplierName: suppliers.name, // Optional - may be null
      })
      .from(items)
      .innerJoin(quotationItems, eq(items.id, quotationItems.itemId))
      .innerJoin(quotationRequests, eq(quotationItems.quotationId, quotationRequests.id))
      .leftJoin( // Changed from innerJoin to leftJoin - supplier pricing is optional
        supplierPricing,
        and(
          eq(items.id, supplierPricing.itemId),
          eq(supplierPricing.status, "active")
        )
      )
      .leftJoin(suppliers, eq(supplierPricing.supplierId, suppliers.id))
      .leftJoin(
        customerPricing,
        eq(items.id, customerPricing.itemId)
      )
      .where(
        and(
          // Include all statuses that might need customer pricing
          or(
            eq(quotationRequests.status, "pending"), // Added: new quotations can go to customer pricing directly
            eq(quotationRequests.status, "sent_for_pricing"), // Added: items sent for pricing can go to customer pricing directly
            eq(quotationRequests.status, "pricing_received"),
            eq(quotationRequests.status, "customer_pricing")
          ),
          isNull(customerPricing.itemId), // Only items without customer pricing
          or(
            isNotNull(quotationRequests.expiryDate), // الطلبات مع تاريخ انتهاء
            sql`${quotationRequests.requestDate}::date >= CURRENT_DATE` // الطلبات الجديدة من اليوم حتى لو بدون تاريخ انتهاء
          )
          // Removed supplier pricing requirement
        )
      )
      .orderBy(desc(quotationRequests.createdAt));

    console.log(`✅ Found ${itemsNeedingCustomerPricing.length} items ready for customer pricing`);
    return itemsNeedingCustomerPricing;
  }

  // Pricing history operations
  async createPricingHistory(historyData: InsertPricingHistory): Promise<PricingHistory> {
    const [history] = await db
      .insert(pricingHistory)
      .values(historyData)
      .returning();
    return history;
  }

  async getPricingHistoryByItem(itemId: string, priceType?: string): Promise<PricingHistory[]> {
    let whereConditions = [eq(pricingHistory.itemId, itemId)];
    
    if (priceType) {
      whereConditions.push(eq(pricingHistory.priceType, priceType));
    }

    return await db
      .select()
      .from(pricingHistory)
      .where(and(...whereConditions))
      .orderBy(desc(pricingHistory.createdAt));
  }

  // Enhanced Purchase Order operations
  async createPurchaseOrder(poData: any): Promise<PurchaseOrder> {
    return await db.transaction(async (tx) => {
      // Generate unique PO number if duplicate or not provided
      let poNumber = poData.poNumber;
      if (!poNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        poNumber = `PO-K${timestamp}${random}`;
      }
      
      // Check if PO number already exists and generate new one if needed
      try {
        const existing = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.poNumber, poNumber));
        if (existing.length > 0) {
          const timestamp = Date.now().toString().slice(-6);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          poNumber = `PO-K${timestamp}${random}`;
        }
      } catch (e) {
        // Continue with the generated number
      }

      // Create the purchase order
      const [purchaseOrder] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber: poNumber,
          quotationId: poData.quotationId,
          poDate: new Date(poData.poDate),
          totalValue: poData.totalValue.toString(),
          deliveryStatus: false,
          invoiceIssued: false,
          createdBy: poData.createdBy,
        })
        .returning();

      // Create purchase order items
      if (poData.items && poData.items.length > 0) {
        const poItems = poData.items.map((item: any) => ({
          poId: purchaseOrder.id,
          itemId: item.itemId,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          notes: item.notes || "",
        }));

        await tx.insert(purchaseOrderItems).values(poItems);

        // Update supplier pricing to mark as having PO
        for (const item of poData.items) {
          try {
            await tx
              .update(supplierPricing)
              .set({ purchaseOrderId: purchaseOrder.id, isSelected: true })
              .where(eq(supplierPricing.itemId, item.itemId));
          } catch (e) {
            // Continue if supplier pricing doesn't exist
          }
        }
      }

      return purchaseOrder;
    });
  }

  async getPurchaseOrderItems(poId: string): Promise<any[]> {
    const result = await db
      .select({
        id: purchaseOrderItems.id,
        poId: purchaseOrderItems.poId,
        itemId: purchaseOrderItems.itemId,
        quantity: purchaseOrderItems.quantity,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        currency: purchaseOrderItems.currency,
        // Item details
        description: items.description,
        lineItem: items.lineItem,
        kItemId: items.kItemId,
        partNo: items.partNumber,
        category: items.category,
        unit: items.unit,
      })
      .from(purchaseOrderItems)
      .leftJoin(items, eq(purchaseOrderItems.itemId, items.id))
      .where(eq(purchaseOrderItems.poId, poId));
    
    // Sort by lineItem in JavaScript to avoid Drizzle orderBy issues
    return result.sort((a, b) => {
      const lineA = a.lineItem || '';
      const lineB = b.lineItem || '';
      return lineA.localeCompare(lineB);
    });
  }

  async updatePurchaseOrderStatus(id: string, status: string): Promise<PurchaseOrder | undefined> {
    const [purchaseOrder] = await db
      .update(purchaseOrders)
      .set({ 
        status: status as any,
        deliveryStatus: status === "delivered",
        invoiceIssued: status === "invoiced"
      })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return purchaseOrder || undefined;
  }

  async updatePurchaseOrderItem(itemId: string, updates: Partial<PurchaseOrderItem>): Promise<PurchaseOrderItem | undefined> {
    try {
      const [updatedItem] = await db
        .update(purchaseOrderItems)
        .set(updates)
        .where(eq(purchaseOrderItems.id, itemId))
        .returning();
      return updatedItem || undefined;
    } catch (error) {
      console.error("Error updating purchase order item:", error);
      return undefined;
    }
  }

  async deletePurchaseOrderItem(itemId: string): Promise<PurchaseOrderItem | undefined> {
    try {
      const [deletedItem] = await db
        .delete(purchaseOrderItems)
        .where(eq(purchaseOrderItems.id, itemId))
        .returning();
      return deletedItem || undefined;
    } catch (error) {
      console.error("Error deleting purchase order item:", error);
      return undefined;
    }
  }

  async updatePurchaseOrderTotal(poId: string): Promise<void> {
    try {
      // Get all items for this purchase order
      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, poId));

      // Calculate total value
      const totalValue = items.reduce((sum, item) => {
        return sum + (Number(item.totalPrice) || 0);
      }, 0);

      // Update purchase order total
      await db
        .update(purchaseOrders)
        .set({ totalValue: totalValue.toString() })
        .where(eq(purchaseOrders.id, poId));

    } catch (error) {
      console.error("Error updating purchase order total:", error);
    }
  }

  async getPurchaseOrdersForItem(itemId: string): Promise<any[]> {
    // First get the item to find its LINE ITEM for comprehensive search
    const item = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (!item.length) return [];

    const lineItem = item[0].lineItem;
    
    // Get purchase orders for items with same LINE ITEM (comprehensive approach)
    const purchaseOrderData = await db
      .select({
        // Purchase Order details
        poNumber: purchaseOrders.poNumber,
        poDate: purchaseOrders.poDate,
        poStatus: purchaseOrders.status,
        totalValue: purchaseOrders.totalValue,
        
        // Purchase Order Item details
        quantity: purchaseOrderItems.quantity,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        currency: purchaseOrderItems.currency,
        
        // Item details
        itemId: items.id,
        description: items.description,
        partNumber: items.partNumber,
        itemLineItem: items.lineItem,
        unit: items.unit,
      })
      .from(purchaseOrderItems)
      .innerJoin(purchaseOrders, eq(purchaseOrderItems.poId, purchaseOrders.id))
      .innerJoin(items, eq(purchaseOrderItems.itemId, items.id))
      .where(eq(items.lineItem, lineItem))
      .orderBy(desc(purchaseOrders.poDate));

    return purchaseOrderData;
  }

  // Get comprehensive data for an item using unified identifier (NEW)
  async getItemComprehensiveDataUnified(itemId: string): Promise<any[]> {
    const item = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (!item.length) return [];

    const normalizedPartNumber = item[0].normalizedPartNumber;
    
    if (!normalizedPartNumber) {
      // Fallback to old method if no unified identifier
      return this.getComprehensiveItemData(itemId);
    }

    // Get ALL items with same unified identifier
    const unifiedItems = await db.select().from(items)
      .where(eq(items.normalizedPartNumber, normalizedPartNumber));

    const allItemIds = unifiedItems.map(item => item.id);

    // Get comprehensive data for ALL unified items
    const comprehensiveData = await db.execute(sql`
      SELECT 
        -- معلومات العميل والبند
        COALESCE(c.name, 'EDC') as client_name,
        i.item_number as item_id, 
        i.description as description,
        COALESCE(i.line_item, '') as line_item,
        COALESCE(i.part_number, '') as part_no,
        
        -- معلومات طلب التسعير (تصحيح رقم الطلب والسعر)
        COALESCE(qr.custom_request_number, qr.request_number) as rfq_number,
        qr.request_date as rfq_date,
        qi.quantity as rfq_qty,
        COALESCE(qr.expiry_date, '') as res_date,
        qi.unit_price as customer_price,
        
        -- معلومات أمر الشراء
        COALESCE(po.po_number, '') as po_number,
        COALESCE(po.po_date::text, '') as po_date, 
        COALESCE(poi.quantity::text, '') as po_quantity,
        COALESCE(poi.unit_price::text, '') as po_price,
        COALESCE((poi.quantity * poi.unit_price)::text, '') as po_total,
        
        -- معلومات إضافية
        COALESCE(i.category, 'ELEC') as category,
        i.unit as uom
        
      FROM items i
      LEFT JOIN quotation_items qi ON i.id = qi.item_id
      LEFT JOIN quotation_requests qr ON qi.quotation_id = qr.id  
      LEFT JOIN clients c ON qr.client_id = c.id
      LEFT JOIN purchase_order_items poi ON i.id = poi.item_id
      LEFT JOIN purchase_orders po ON poi.po_id = po.id
      
      WHERE i.normalized_part_number = ${normalizedPartNumber}
      ORDER BY qr.request_date DESC, i.line_item, po.po_date DESC
    `);

    return comprehensiveData.rows as any[];
  }

  // Get comprehensive data for an item similar to Excel table format
  async getComprehensiveItemData(itemId: string): Promise<any[]> {
    const item = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (!item.length) return [];

    const lineItem = item[0].lineItem;
    const partNumber = item[0].partNumber;
    const description = item[0].description;
    
    // Get comprehensive data for all related items (similar contactors)
    const comprehensiveData = await db.execute(sql`
      SELECT 
          -- معلومات العميل والبند
          COALESCE(c.name, 'EDC') as client_name,
          i.item_number as item_id, 
          i.description as description,
          COALESCE(i.line_item, '') as line_item,
          COALESCE(i.part_number, '') as part_no,
          
          -- معلومات طلب التسعير (تصحيح رقم الطلب والسعر)
          COALESCE(qr.custom_request_number, qr.request_number) as rfq_number,
          qr.request_date as rfq_date,
          qi.quantity as rfq_qty,
          COALESCE(qr.expiry_date, '') as res_date,
          qi.unit_price as customer_price,
          
          -- معلومات أمر الشراء
          COALESCE(po.po_number, '') as po_number,
          COALESCE(po.po_date::text, '') as po_date, 
          COALESCE(poi.quantity::text, '') as po_quantity,
          COALESCE(poi.unit_price::text, '') as po_price,
          COALESCE((poi.quantity * poi.unit_price)::text, '') as po_total,
          
          -- معلومات إضافية
          COALESCE(i.category, 'ELEC') as category,
          i.unit as uom
          
      FROM quotation_items qi
      LEFT JOIN items i ON qi.item_id = i.id
      LEFT JOIN quotation_requests qr ON qi.quotation_id = qr.id  
      LEFT JOIN clients c ON qr.client_id = c.id
      LEFT JOIN purchase_order_items poi ON i.id = poi.item_id
      LEFT JOIN purchase_orders po ON poi.po_id = po.id
      
      WHERE (
          i.part_number = ${partNumber}
      )
      ORDER BY qr.request_date DESC, i.line_item, po.po_date DESC
    `);

    return comprehensiveData.rows as any[];
  }

  // Combined pricing view for detailed analysis
  async getDetailedPricingForItem(itemId: string): Promise<any> {
    // Get supplier pricing for this specific item only
    const supplierPricings = await db
      .select({
        supplierPricing: supplierPricing,
        supplier: suppliers,
      })
      .from(supplierPricing)
      .leftJoin(suppliers, eq(supplierPricing.supplierId, suppliers.id))
      .where(and(
        eq(supplierPricing.itemId, itemId),
        eq(supplierPricing.status, "active")
      ))
      .orderBy(desc(supplierPricing.priceReceivedDate));

    // Get customer pricing for this specific item only
    const customerPricings = await db
      .select()
      .from(customerPricing)
      .where(and(
        eq(customerPricing.itemId, itemId),
        eq(customerPricing.status, "active")
      ))
      .orderBy(desc(customerPricing.createdAt));

    // Get pricing history for this specific item only
    const pricingHistoryData = await db
      .select()
      .from(pricingHistory)
      .where(eq(pricingHistory.itemId, itemId))
      .orderBy(desc(pricingHistory.createdAt));

    // Get purchase orders for this specific item only
    const purchaseOrdersData = await this.getPurchaseOrdersForItem(itemId);

    return {
      supplierPricings: supplierPricings.map(row => ({
        ...row.supplierPricing,
        supplier: row.supplier,
      })),
      customerPricings,
      pricingHistory: pricingHistoryData,
      purchaseOrders: purchaseOrdersData,
    };
  }

  // Get comprehensive historical data for an item from both quotations and purchase orders
  async getComprehensiveHistoricalData(lineItem: string) {
    console.log('Getting comprehensive historical data for LINE ITEM:', lineItem);

    try {
      // Get quotation data with client information using this.db
      const quotationData = await this.db
        .select({
          clientName: quotationRequests.clientName,
          kItemId: quotationItems.itemId,
          description: quotationItems.description,
          lineItem: quotationItems.lineItem,
          partNumber: quotationItems.partNumber,
          rfqNumber: quotationRequests.requestNumber,
          rfqDate: quotationRequests.requestDate,
          rfqQuantity: quotationItems.quantity,
          responseDate: quotationRequests.requestDate,
          poNumber: sql<string>`NULL`,
          poDate: sql<string>`NULL`,
          poQuantity: sql<string>`NULL`,
          poPrice: sql<string>`NULL`,
          poTotal: sql<string>`NULL`,
          sourceType: sql<string>`'quotation'`,
          unitPrice: quotationItems.unitPrice,
          currency: quotationItems.currency,
        })
        .from(quotationItems)
        .innerJoin(quotationRequests, eq(quotationItems.quotationId, quotationRequests.id))
        .where(eq(quotationItems.lineItem, lineItem))
        .orderBy(desc(quotationRequests.requestDate));

      // Get purchase order data using this.db
      const purchaseOrderData = await this.db
        .select({
          clientName: sql<string>`'Internal Order'`,
          kItemId: purchaseOrderItems.itemId,
          description: purchaseOrderItems.description,
          lineItem: purchaseOrderItems.lineItem,
          partNumber: purchaseOrderItems.partNumber,
          rfqNumber: sql<string>`NULL`,
          rfqDate: sql<string>`NULL`,
          rfqQuantity: sql<string>`NULL`,
          responseDate: sql<string>`NULL`,
          poNumber: purchaseOrders.poNumber,
          poDate: purchaseOrders.poDate,
          poQuantity: purchaseOrderItems.quantity,
          poPrice: purchaseOrderItems.unitPrice,
          poTotal: purchaseOrderItems.totalPrice,
          sourceType: sql<string>`'purchase_order'`,
          unitPrice: purchaseOrderItems.unitPrice,
          currency: purchaseOrderItems.currency,
        })
        .from(purchaseOrderItems)
        .innerJoin(purchaseOrders, eq(purchaseOrderItems.poId, purchaseOrders.id))
        .where(eq(purchaseOrderItems.lineItem, lineItem))
        .orderBy(desc(purchaseOrders.poDate));

      // Combine and sort all data
      const allData = [...quotationData, ...purchaseOrderData].sort((a, b) => {
        const dateA = new Date(a.rfqDate || a.poDate || 0);
        const dateB = new Date(b.rfqDate || b.poDate || 0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(`Found ${allData.length} comprehensive records for LINE ITEM: ${lineItem}`);
      return allData;
    } catch (error) {
      console.error('Error in getComprehensiveHistoricalData:', error);
      throw error;
    }
  }

  async getNextPONumber(): Promise<string> {
    try {
      // Get the highest PO number from the database
      const lastPO = await db
        .select()
        .from(purchaseOrders)
        .orderBy(desc(purchaseOrders.poNumber))
        .limit(1);

      if (lastPO.length > 0) {
        // Extract number from PO format (e.g., "PO-K123456789" -> get the last number)
        const lastNumber = parseInt(lastPO[0].poNumber.replace(/\D/g, '').slice(-4)) || 0;
        const nextNumber = lastNumber + 1;
        return `PO-K${new Date().getFullYear()}${nextNumber.toString().padStart(4, '0')}`;
      } else {
        // First PO of the year
        return `PO-K${new Date().getFullYear()}0001`;
      }
    } catch (error) {
      console.error('Error generating PO number:', error);
      // Fallback to timestamp-based ID
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `PO-K${timestamp}${random}`;
    }
  }
}

export const storage = new DatabaseStorage();

// Create default admin user if it doesn't exist
export async function initializeDatabase() {
  try {
    const adminUser = await storage.getUserByUsername("admin");
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        fullName: "مدير النظام",
        role: "manager",
        isActive: true,
      });
      
      console.log("✅ Default admin user created: username=admin, password=admin123");
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}