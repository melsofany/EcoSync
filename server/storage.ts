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
import { db } from "./db";
import { eq, desc, like, and, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserOnlineStatus(id: string, isOnline: boolean, ipAddress?: string): Promise<void>;

  // Client operations
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined>;

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

  // Supplier operations
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | undefined>;

  // Purchase order operations
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  getAllPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined>;
  getNextPONumber(): Promise<string>;

  // Purchase order items
  addPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  getPurchaseOrderItems(poId: string): Promise<PurchaseOrderItem[]>;

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
    // Delete related activity logs first
    await db.delete(activityLog).where(eq(activityLog.userId, id));
    
    // Then delete the user
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

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
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
    const lastItem = await db.select({ itemNumber: items.itemNumber })
      .from(items)
      .orderBy(desc(items.createdAt))
      .limit(1);
    
    if (lastItem.length === 0) {
      return "ELEK00000001";
    }
    
    const lastNumber = parseInt(lastItem[0].itemNumber.replace("ELEK", ""));
    const nextNumber = (lastNumber + 1).toString().padStart(8, "0");
    return `ELEK${nextNumber}`;
  }

  async findSimilarItems(description: string, partNumber?: string): Promise<Item[]> {
    if (partNumber) {
      // First check for exact part number match (highest priority for duplicates)
      const exactPartNumberMatch = await db.select().from(items).where(
        eq(items.partNumber, partNumber)
      ).limit(10);
      
      if (exactPartNumberMatch.length > 0) {
        return exactPartNumberMatch;
      }
      
      // If no exact match, check for similar descriptions with similar part numbers
      return await db.select().from(items).where(
        and(
          like(items.description, `%${description}%`),
          like(items.partNumber, `%${partNumber}%`)
        )
      ).limit(10);
    } else {
      return await db.select().from(items)
        .where(like(items.description, `%${description}%`))
        .limit(10);
    }
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

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(updates)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier || undefined;
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

  async getActivities(limit: number = 50): Promise<ActivityLog[]> {
    return await db.select().from(activityLog)
      .orderBy(desc(activityLog.timestamp))
      .limit(limit);
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
          eq(quotationRequests.status, "sent_for_pricing"),
          isNull(supplierPricing.itemId)
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
  async getItemsReadyForCustomerPricing(): Promise<any[]> {
    // Get items that have supplier pricing but don't have customer pricing yet
    const itemsWithSupplierPricing = await db
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
        supplierPrice: supplierPricing.unitPrice,
        supplierName: suppliers.name,
      })
      .from(items)
      .innerJoin(quotationItems, eq(items.id, quotationItems.itemId))
      .innerJoin(quotationRequests, eq(quotationItems.quotationId, quotationRequests.id))
      .innerJoin(
        supplierPricing,
        and(
          eq(items.id, supplierPricing.itemId),
          eq(supplierPricing.status, "active")
        )
      )
      .leftJoin(suppliers, eq(supplierPricing.supplierId, suppliers.id))
      .leftJoin(
        customerPricing,
        and(
          eq(items.id, customerPricing.itemId),
          eq(customerPricing.status, "active")
        )
      )
      .where(
        and(
          eq(quotationRequests.status, "sent_for_pricing"),
          isNull(customerPricing.itemId)
        )
      )
      .orderBy(desc(quotationRequests.createdAt));

    return itemsWithSupplierPricing;
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

  async getPurchaseOrdersForItem(itemId: string): Promise<any[]> {
    return await db
      .select({
        purchaseOrder: purchaseOrders,
        purchaseOrderItem: purchaseOrderItems,
        quotation: quotationRequests,
      })
      .from(purchaseOrderItems)
      .leftJoin(purchaseOrders, eq(purchaseOrderItems.poId, purchaseOrders.id))
      .leftJoin(quotationRequests, eq(purchaseOrders.quotationId, quotationRequests.id))
      .where(eq(purchaseOrderItems.itemId, itemId))
      .orderBy(desc(purchaseOrders.poDate));
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