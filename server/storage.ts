import {
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
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserOnlineStatus(id: string, isOnline: boolean, ipAddress?: string): Promise<void>;

  // Client operations
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;

  // Quotation operations
  createQuotationRequest(request: InsertQuotationRequest): Promise<QuotationRequest>;
  getAllQuotationRequests(): Promise<QuotationRequest[]>;
  getQuotationRequest(id: string): Promise<QuotationRequest | undefined>;
  updateQuotationRequest(id: string, updates: Partial<QuotationRequest>): Promise<QuotationRequest | undefined>;
  getNextRequestNumber(): Promise<string>;

  // Item operations
  createItem(item: InsertItem): Promise<Item>;
  getAllItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined>;
  getNextItemNumber(): Promise<string>;
  findSimilarItems(description: string, partNumber?: string): Promise<Item[]>;

  // Quotation item operations
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  getQuotationItems(quotationId: string): Promise<QuotationItem[]>;
  updateQuotationItem(id: string, updates: Partial<QuotationItem>): Promise<QuotationItem | undefined>;

  // Supplier operations
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;

  // Purchase order operations
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  getAllPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined>;
  getNextPONumber(): Promise<string>;

  // Activity log operations
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(userId?: string): Promise<ActivityLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private quotationRequests: Map<string, QuotationRequest> = new Map();
  private items: Map<string, Item> = new Map();
  private quotationItems: Map<string, QuotationItem> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();
  private activityLogs: Map<string, ActivityLog> = new Map();

  private requestCounter = 1;
  private itemCounter = 1;
  private poCounter = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default users
    const adminUser: InsertUser = {
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
      fullName: "مدير النظام",
      role: "manager",
      isActive: true,
    };

    const itUser: InsertUser = {
      username: "it_admin",
      password: await bcrypt.hash("it123", 10),
      fullName: "مدير تقنية المعلومات",
      role: "it_admin",
      isActive: true,
    };

    const dataEntryUser: InsertUser = {
      username: "data_entry",
      password: await bcrypt.hash("data123", 10),
      fullName: "موظف إدخال البيانات",
      role: "data_entry",
      isActive: true,
    };

    const purchasingUser: InsertUser = {
      username: "purchasing",
      password: await bcrypt.hash("purchase123", 10),
      fullName: "موظف المشتريات",
      role: "purchasing",
      isActive: true,
    };

    await this.createUser(adminUser);
    await this.createUser(itUser);
    await this.createUser(dataEntryUser);
    await this.createUser(purchasingUser);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      isOnline: false,
      lastLoginAt: null,
      lastActivityAt: null,
      ipAddress: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean, ipAddress?: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      const updates: Partial<User> = {
        isOnline,
        lastActivityAt: new Date(),
      };
      if (ipAddress) {
        updates.ipAddress = ipAddress;
      }
      if (isOnline) {
        updates.lastLoginAt = new Date();
      }
      await this.updateUser(id, updates);
    }
  }

  // Client operations
  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...insertClient,
      id,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  // Quotation operations
  async createQuotationRequest(insertRequest: InsertQuotationRequest): Promise<QuotationRequest> {
    const id = randomUUID();
    const requestNumber = await this.getNextRequestNumber();
    const now = new Date();
    
    const request: QuotationRequest = {
      ...insertRequest,
      id,
      requestNumber,
      createdAt: now,
      updatedAt: now,
    };
    this.quotationRequests.set(id, request);
    return request;
  }

  async getAllQuotationRequests(): Promise<QuotationRequest[]> {
    return Array.from(this.quotationRequests.values());
  }

  async getQuotationRequest(id: string): Promise<QuotationRequest | undefined> {
    return this.quotationRequests.get(id);
  }

  async updateQuotationRequest(id: string, updates: Partial<QuotationRequest>): Promise<QuotationRequest | undefined> {
    const request = this.quotationRequests.get(id);
    if (!request) return undefined;

    const updatedRequest: QuotationRequest = {
      ...request,
      ...updates,
      updatedAt: new Date(),
    };
    this.quotationRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getNextRequestNumber(): Promise<string> {
    const number = this.requestCounter.toString().padStart(8, '0');
    this.requestCounter++;
    return `REQ${number}`;
  }

  // Item operations
  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const itemNumber = await this.getNextItemNumber();
    
    const item: Item = {
      ...insertItem,
      id,
      itemNumber,
      createdAt: new Date(),
    };
    this.items.set(id, item);
    return item;
  }

  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updatedItem: Item = {
      ...item,
      ...updates,
    };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async getNextItemNumber(): Promise<string> {
    const number = this.itemCounter.toString().padStart(8, '0');
    this.itemCounter++;
    return `ELEK${number}`;
  }

  async findSimilarItems(description: string, partNumber?: string): Promise<Item[]> {
    // Simple similarity matching - in production this would use AI
    const items = Array.from(this.items.values());
    return items.filter(item => {
      const descMatch = item.description.toLowerCase().includes(description.toLowerCase()) ||
                       description.toLowerCase().includes(item.description.toLowerCase());
      const partMatch = partNumber && item.partNumber && 
                       (item.partNumber.toLowerCase().includes(partNumber.toLowerCase()) ||
                        partNumber.toLowerCase().includes(item.partNumber.toLowerCase()));
      return descMatch || partMatch;
    });
  }

  // Quotation item operations
  async createQuotationItem(insertItem: InsertQuotationItem): Promise<QuotationItem> {
    const id = randomUUID();
    const item: QuotationItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.quotationItems.set(id, item);
    return item;
  }

  async getQuotationItems(quotationId: string): Promise<QuotationItem[]> {
    return Array.from(this.quotationItems.values()).filter(
      item => item.quotationId === quotationId
    );
  }

  async updateQuotationItem(id: string, updates: Partial<QuotationItem>): Promise<QuotationItem | undefined> {
    const item = this.quotationItems.get(id);
    if (!item) return undefined;

    const updatedItem: QuotationItem = {
      ...item,
      ...updates,
    };
    this.quotationItems.set(id, updatedItem);
    return updatedItem;
  }

  // Supplier operations
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const supplier: Supplier = {
      ...insertSupplier,
      id,
      createdAt: new Date(),
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  // Purchase order operations
  async createPurchaseOrder(insertPO: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const id = randomUUID();
    const poNumber = await this.getNextPONumber();
    
    const po: PurchaseOrder = {
      ...insertPO,
      id,
      poNumber,
      createdAt: new Date(),
    };
    this.purchaseOrders.set(id, po);
    return po;
  }

  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return Array.from(this.purchaseOrders.values());
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    return this.purchaseOrders.get(id);
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const po = this.purchaseOrders.get(id);
    if (!po) return undefined;

    const updatedPO: PurchaseOrder = {
      ...po,
      ...updates,
    };
    this.purchaseOrders.set(id, updatedPO);
    return updatedPO;
  }

  async getNextPONumber(): Promise<string> {
    const number = this.poCounter.toString().padStart(4, '0');
    this.poCounter++;
    return `PO-2024-${number}`;
  }

  // Activity log operations
  async logActivity(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const activity: ActivityLog = {
      ...insertActivity,
      id,
      timestamp: new Date(),
    };
    this.activityLogs.set(id, activity);
    return activity;
  }

  async getActivityLog(userId?: string): Promise<ActivityLog[]> {
    const activities = Array.from(this.activityLogs.values());
    if (userId) {
      return activities.filter(activity => activity.userId === userId);
    }
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
