import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, initializeDatabase } from "./storage";
import { insertUserSchema, insertClientSchema, insertQuotationRequestSchema, insertItemSchema, insertPurchaseOrderSchema, insertSupplierSchema, insertQuotationItemSchema, insertPurchaseOrderItemSchema, insertSupplierQuoteSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";

// Extend the Express Request type to include session data
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      fullName: string;
      role: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with default data
  await initializeDatabase();
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes
    },
  }));

  // Middleware to log activity and track IP
  const logActivity = async (req: Request, action: string, entityType?: string, entityId?: string, details?: string) => {
    if (req.session.user) {
      await storage.logActivity({
        userId: req.session.user.id,
        action,
        entityType,
        entityId,
        details,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      });
    }
  };

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Role-based access control
  const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.session.user || !roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        await logActivity(req, "login_failed", "user", undefined, `Failed login attempt for username: ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await logActivity(req, "login_failed", "user", user.id, "Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update user online status
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      await storage.updateUserOnlineStatus(user.id, true, ipAddress);

      req.session.user = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      };

      await logActivity(req, "login_success", "user", user.id, "User logged in successfully");

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.session.user) {
        await storage.updateUserOnlineStatus(req.session.user.id, false);
        await logActivity(req, "logout", "user", req.session.user.id, "User logged out");
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Could not log out" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes
  app.get("/api/users", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser(validatedData);
      await logActivity(req, "create_user", "user", user.id, `Created user: ${user.username}`);

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user (block/unblock)
  app.patch("/api/users/:userId", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { isActive });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await logActivity(req, isActive ? "activate_user" : "deactivate_user", "user", userId, 
        `User ${updatedUser.username} was ${isActive ? 'activated' : 'deactivated'}`);

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete user
  app.delete("/api/users/:userId", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Get user details for logging before deletion
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting yourself
      if (userId === req.session.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      await logActivity(req, "delete_user", "user", userId, `Deleted user: ${user.username}`);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Client management routes
  app.get("/api/clients", requireAuth, async (req: Request, res: Response) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/clients", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      validatedData.createdBy = req.session.user!.id;
      
      const client = await storage.createClient(validatedData);
      await logActivity(req, "create_client", "client", client.id, `Created client: ${client.name}`);

      res.status(201).json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/clients/:clientId", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const updates = req.body;
      
      const client = await storage.updateClient(clientId, updates);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      await logActivity(req, "update_client", "client", clientId, `Updated client: ${client.name}`);

      res.json(client);
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/clients/:clientId", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      
      // Get client details for logging
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      await storage.deleteClient(clientId);
      await logActivity(req, "delete_client", "client", clientId, `Deleted client: ${client.name}`);

      res.json({ message: "Client deleted successfully" });
    } catch (error: any) {
      console.error("Delete client error:", error);
      if (error.message && error.message.includes("Cannot delete client")) {
        return res.status(400).json({ 
          message: "هذا العميل مرتبط بطلبات تسعير موجودة. يجب حذف الطلبات أولاً.", 
          details: "هذا العميل مرتبط بطلبات تسعير موجودة. يجب حذف الطلبات أولاً.",
          error: "CLIENT_HAS_QUOTATIONS"
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quotation routes
  app.get("/api/quotations", requireAuth, async (req: Request, res: Response) => {
    try {
      const quotations = await storage.getAllQuotationRequestsWithClients();
      res.json(quotations);
    } catch (error) {
      console.error("Get quotations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quotations", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const validatedData = insertQuotationRequestSchema.parse({
        ...req.body,
        createdBy: userId,
        status: "sent_for_pricing", // Automatically set to sent_for_pricing
      });
      
      const quotation = await storage.createQuotationRequest(validatedData);
      await logActivity(req, "create_quotation", "quotation", quotation.id, `Created quotation: ${quotation.requestNumber}`);

      res.status(201).json(quotation);
    } catch (error) {
      console.error("Create quotation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Single quotation routes
  app.get("/api/quotations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const quotation = await storage.getQuotationById(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      console.error("Get quotation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/quotations/:id", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const quotation = await storage.updateQuotationRequest(id, { status });
      await logActivity(req, "update_quotation", "quotation", id, `Updated quotation status to: ${status}`);

      res.json(quotation);
    } catch (error) {
      console.error("Update quotation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Item routes
  app.get("/api/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      console.error("Get items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/items", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Generate K-ID if not provided  
      if (!req.body.kItemId) {
        const itemCount = await storage.getItemCount();
        req.body.kItemId = `K${(itemCount + 1).toString().padStart(8, '0')}`;
      }

      const validatedData = insertItemSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      // Check for exact duplicates before creating the item
      if (validatedData.partNumber) {
        const similarItems = await storage.findSimilarItems(validatedData.description, validatedData.partNumber);
        const exactMatch = similarItems.find(item => item.partNumber === validatedData.partNumber);
        
        if (exactMatch) {
          // Instead of returning error, return the existing item
          await logActivity(req, "find_existing_item", "item", exactMatch.id, `Found existing item: ${exactMatch.itemNumber} - ${exactMatch.description}`);
          return res.status(200).json(exactMatch);
        }
      }
      
      // Check for similar items using AI simulation
      const similarItems = await storage.findSimilarItems(validatedData.description, validatedData.partNumber || undefined);
      
      let aiStatus = "processed";
      let aiMatchedItemId = null;
      
      if (similarItems.length > 0) {
        aiStatus = "duplicate";
        aiMatchedItemId = similarItems[0].id;
      }
      
      validatedData.aiStatus = aiStatus;
      validatedData.aiMatchedItemId = aiMatchedItemId;
      
      const item = await storage.createItem(validatedData);
      await logActivity(req, "create_item", "item", item.id, `Created item: ${item.itemNumber} - ${item.description}`);

      res.status(201).json(item);
    } catch (error) {
      console.error("Create item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update item route
  app.patch("/api/items/:itemId", requireAuth, requireRole(["manager", "data_entry"]), async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const updates = req.body;
      
      // Get existing item to verify it exists
      const existingItem = await storage.getItemById(itemId);
      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }

      const updatedItem = await storage.updateItem(itemId, updates);
      await logActivity(req, "update_item", "item", itemId, `Updated item: ${existingItem.itemNumber} - ${updates.description || existingItem.description}`);

      res.json(updatedItem);
    } catch (error) {
      console.error("Update item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete item route
  app.delete("/api/items/:itemId", requireAuth, requireRole(["manager", "data_entry"]), async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      
      // Get item details for logging
      const item = await storage.getItemById(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      await storage.deleteItem(itemId);
      await logActivity(req, "delete_item", "item", itemId, `Deleted item: ${item.itemNumber} - ${item.description}`);

      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Delete item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI item comparison endpoint
  app.post("/api/items/ai-compare", requireAuth, async (req: Request, res: Response) => {
    try {
      const { description, partNumber } = req.body;
      
      // TODO: Integrate with Deep Seek AI API
      const deepSeekApiKey = process.env.DEEP_SEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
      
      if (!deepSeekApiKey) {
        // Fallback to local similarity matching
        const similarItems = await storage.findSimilarItems(description, partNumber);
        return res.json({
          status: "processed",
          similarItems,
          aiProvider: "local_matching",
          apiKeyConfigured: false,
        });
      }

      try {
        // Get local similar items first for comparison context
        const similarItems = await storage.findSimilarItems(description, partNumber);
        
        // Create context for AI analysis with existing items
        const existingItemsContext = similarItems.length > 0 
          ? `\n\nExisting similar items in database:\n${similarItems.map((item, index) => 
              `${index + 1}. Item Number: ${item.itemNumber}, Part Number: ${item.partNumber}, Description: ${item.description}`
            ).join('\n')}`
          : '\n\nNo similar items found in database.';

        // DeepSeek AI integration for item comparison
        const prompt = `You are an inventory management expert. Analyze if this new item is a duplicate of existing items:

NEW ITEM TO ADD:
- Description: ${description}
${partNumber ? `- Part Number: ${partNumber}` : '- Part Number: Not provided'}
${existingItemsContext}

ANALYSIS REQUIRED:
1. Is this item a DUPLICATE of any existing item? (Consider exact part number matches as definite duplicates)
2. If duplicate, which existing item number should be used instead?
3. If not duplicate, confirm it's safe to add as a new item.

RULES:
- Items with identical part numbers are ALWAYS duplicates (regardless of description differences)
- Consider variations in language (Arabic/English) and spelling
- Account for abbreviations and common naming variations

Respond in JSON format:
{
  "isDuplicate": boolean,
  "confidence": "high|medium|low",
  "duplicateOf": "item_number_if_duplicate_or_null",
  "reason": "explanation_of_decision",
  "recommendation": "action_to_take"
}`;

        const deepSeekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepSeekApiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.1,
            response_format: { type: "json_object" }
          }),
        });

        if (!deepSeekResponse.ok) {
          throw new Error(`DeepSeek API error: ${deepSeekResponse.status}`);
        }

        const deepSeekResult = await deepSeekResponse.json();
        const aiAnalysis = deepSeekResult.choices[0]?.message?.content || '';
        
        let aiParsedResult = null;
        try {
          aiParsedResult = JSON.parse(aiAnalysis);
        } catch (parseError) {
          console.error("Failed to parse AI response:", parseError);
        }
        
        await logActivity(req, "ai_item_comparison", "item", undefined, `DeepSeek AI analysis for: ${description}`);

        return res.json({
          status: "processed",
          similarItems,
          aiProvider: "deepseek",
          apiKeyConfigured: true,
          aiAnalysis,
          aiParsedResult,
          isDuplicate: aiParsedResult?.isDuplicate || false,
          duplicateOf: aiParsedResult?.duplicateOf || null,
          confidence: aiParsedResult?.confidence || "low",
          recommendation: aiParsedResult?.recommendation || "Manual review required"
        });
      } catch (error) {
        console.error("DeepSeek API error:", error);
        // Fallback to local matching if AI fails
        const similarItems = await storage.findSimilarItems(description, partNumber);
        return res.json({
          status: "processed",
          similarItems,
          aiProvider: "local_matching_fallback",
          apiKeyConfigured: true,
          error: "AI service temporarily unavailable",
        });
      }
    } catch (error) {
      console.error("AI compare error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase order routes
  app.get("/api/purchase-orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const purchaseOrders = await storage.getAllPurchaseOrders();
      res.json(purchaseOrders);
    } catch (error) {
      console.error("Get purchase orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchase-orders", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      // Transform the data to match schema requirements
      const poData = {
        poNumber: req.body.poNumber,
        quotationId: req.body.quotationId,
        poDate: new Date(req.body.poDate),
        totalValue: req.body.totalValue.toString(), // Convert to string as expected by schema
        notes: req.body.notes || "",
        status: "pending",
        createdBy: req.session.user!.id,
      };
      
      const validatedData = insertPurchaseOrderSchema.parse(poData);
      
      const purchaseOrder = await storage.createPurchaseOrder(validatedData);
      
      // Add items to the purchase order
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.addPurchaseOrderItem({
            poId: purchaseOrder.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
            notes: item.notes || ""
          });
        }
      }
      
      await logActivity(req, "create_purchase_order", "purchase_order", purchaseOrder.id, `Created PO: ${purchaseOrder.poNumber}`);

      res.status(201).json(purchaseOrder);
    } catch (error) {
      console.error("Create purchase order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Activity log routes
  app.get("/api/activity", requireAuth, async (req: Request, res: Response) => {
    try {
      const { role } = req.session.user!;
      let activities;

      // All authenticated users can see activities (filtered by role in frontend if needed)
      activities = await storage.getActivities(50);

      res.json(activities);
    } catch (error) {
      console.error("Get activity log error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Export routes - only for IT admins
  app.get("/api/export/:table", requireAuth, requireRole(['it_admin']), async (req: Request, res: Response) => {
    try {
      const { table } = req.params;
      const { format = 'json' } = req.query;
      
      let data: any[] = [];
      let filename = '';
      
      switch (table) {
        case 'quotations':
          data = await storage.getAllQuotations();
          filename = `quotations_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'items':
          data = await storage.getAllItems();
          filename = `items_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'purchase-orders':
          data = await storage.getAllPurchaseOrders();
          filename = `purchase_orders_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'clients':
          data = await storage.getAllClients();
          filename = `clients_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'suppliers':
          data = await storage.getAllSuppliers();
          filename = `suppliers_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'users':
          data = await storage.getAllUsers();
          // Remove sensitive data
          data = data.map(({ password, ...user }) => user);
          filename = `users_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'activity':
          data = await storage.getActivities();
          filename = `activity_log_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid table name" });
      }

      await logActivity(req, "export_data", table, null, `Exported ${table} data as ${format} (${data.length} records)`);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({
        data,
        filename,
        timestamp: new Date().toISOString(),
        table,
        count: data.length
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Excel import routes - only for IT admins
  app.post("/api/import/quotations/preview", requireAuth, requireRole(['it_admin']), async (req: Request, res: Response) => {
    try {
      const { excelData } = req.body;
      
      if (!Array.isArray(excelData) || excelData.length === 0) {
        return res.status(400).json({ message: "Invalid Excel data" });
      }

      // فلترة وتنظيف البيانات
      const filteredData = excelData.filter((row: any, index: number) => {
        const rowKeys = Object.keys(row);
        const values = Object.values(row);
        
        // استبعاد الصفوف الفارغة تماماً
        if (values.every(val => val === null || val === undefined || val === '')) {
          return false;
        }
        
        // استبعاد الصفوف التي تحتوي على أقل من 5 أعمدة مفيدة
        const meaningfulValues = values.filter(val => 
          val !== null && val !== undefined && val !== '' && val !== 'nan'
        );
        if (meaningfulValues.length < 5) {
          return false;
        }
        
        // استبعاد صفوف العناوين
        const rowText = values.join(' ').toLowerCase();
        const headerPatterns = [
          'line no', 'line item', 'part no', 'description', 'rfq no', 'rfq date', 
          'qty', 'price', 'expiry date', 'client name', 'العميل', 'response date',
          'uom', 'unit', 'البند', 'الوصف', 'الكمية', 'السعر', 'التاريخ'
        ];
        
        const isHeaderRow = headerPatterns.some(pattern => rowText.includes(pattern));
        if (isHeaderRow) {
          return false;
        }
        
        // استبعاد الصفوف التي تحتوي على حرف واحد فقط (مثل 's')
        if (rowKeys.length === 1 && String(values[0]).length <= 2) {
          return false;
        }
        
        return true;
      });

      console.log(`Filtered ${excelData.length} rows down to ${filteredData.length} data rows`);

      // تحليل ذكي للبيانات وربطها بقاعدة البيانات
      const mappedData = filteredData.map((row: any, index: number) => {
        const rowKeys = Object.keys(row);
        const rowValues = Object.values(row);
        
        // تحليل البيانات وتحديد النوع لكل عمود
        const analyzedData = {
          lineNumber: 0,
          unit: 'Each',
          lineItem: '',
          partNumber: '',
          description: '',
          rfqNumber: '',
          rfqDate: '',
          quantity: 0,
          clientPrice: 0,
          expiryDate: '',
          clientName: 'غير محدد'
        };
        
        // فحص كل عمود وتحديد نوعه بناءً على المحتوى والفهرس
        rowKeys.forEach((key, colIndex) => {
          const value = row[key];
          const strValue = String(value || '').trim();
          
          // console.log(`  Column ${colIndex} (${key}): ${strValue}`);
          
          // تخطي القيم الفارغة أو NaN
          if (!strValue || strValue === 'nan' || strValue === 'NaN') return;
          
          // رقم الصف (أرقام صغيرة 1-1000)
          if (key.toLowerCase().includes('line') || key.toLowerCase().includes('no')) {
            const num = parseInt(strValue);
            if (!isNaN(num) && num > 0 && num <= 1000) {
              analyzedData.lineNumber = num;
            }
          }
          
          // وحدة القياس (Each, PC, Meter, etc.)
          else if (key.toLowerCase().includes('uom') || 
                   ['each', 'pc', 'meter', 'pcs', 'piece', 'قطعة', 'متر'].includes(strValue.toLowerCase())) {
            analyzedData.unit = strValue;
          }
          
          // رقم البند - فحص بالفهرس والمحتوى
          if (colIndex === 2 || key.toLowerCase().includes('line item') || key.toLowerCase().includes('item')) {
            // العمود 2 هو LINE ITEM حسب البيانات المُكتشفة
            analyzedData.lineItem = strValue;
          }
          // فحص إضافي بالنمط
          else if (/^\d{4}\.\d{3}\.[A-Z0-9]+\.\d{4}$/.test(strValue)) {
            analyzedData.lineItem = strValue;
          }
          
          // رقم القطعة - العمود 3 أو بناءً على الاسم
          else if (colIndex === 3 || key.toLowerCase().includes('part') || key.toLowerCase().includes('p/n')) {
            if (!/^\d{4}\.\d{3}\.[A-Z0-9]+\.\d{4}$/.test(strValue)) { // ليس رقم بند
              analyzedData.partNumber = strValue;
            }
          }
          
          // التوصيف - العمود 4 أو بناءً على المحتوى
          else if (colIndex === 4 || key.toLowerCase().includes('description') || key.toLowerCase().includes('desc') ||
                   strValue.length > 50) {
            analyzedData.description = strValue;
          }
          
          // رقم الطلب/RFQ - العمود 5 أو بناءً على النمط
          else if (colIndex === 5 || key.toLowerCase().includes('source') || key.toLowerCase().includes('rfq') ||
                   /^[0-9]{2}[A-Z]\d{6}$/.test(strValue)) {
            analyzedData.rfqNumber = strValue;
          }
          
          // التواريخ (Excel serial numbers أو تنسيق تاريخ)
          else if (key.toLowerCase().includes('date')) {
            if (key.toLowerCase().includes('request')) {
              analyzedData.rfqDate = strValue;
            } else if (key.toLowerCase().includes('response') || key.toLowerCase().includes('expiry')) {
              analyzedData.expiryDate = strValue;
            }
          }
          // أرقام التواريخ التسلسلية في Excel (45000+)
          else if (!isNaN(parseFloat(strValue)) && parseFloat(strValue) > 40000 && parseFloat(strValue) < 50000) {
            if (!analyzedData.rfqDate) {
              analyzedData.rfqDate = strValue;
            } else if (!analyzedData.expiryDate) {
              analyzedData.expiryDate = strValue;
            }
          }
          
          // الكمية - العمود 7 أو بناءً على الاسم
          else if (colIndex === 7 || key.toLowerCase().includes('quantity') || key.toLowerCase().includes('qty')) {
            const num = parseInt(strValue);
            if (!isNaN(num) && num >= 0 && num <= 10000) {
              analyzedData.quantity = num;
            }
          }
          
          // السعر (أرقام متوسطة 1-50000 وليست تواريخ)
          else if (key.toLowerCase().includes('price') || key.toLowerCase().includes('unnamed: 8')) {
            const num = parseFloat(strValue);
            if (!isNaN(num) && num > 0 && num <= 50000 && num < 2000) {
              analyzedData.clientPrice = num;
            }
          }
          
          // اسم العميل - العمود 10 أو بناءً على الاسم
          else if (colIndex === 10 || key.includes('العميل') || key.toLowerCase().includes('client')) {
            if (strValue.toLowerCase() !== 'done' && strValue.toLowerCase() !== 'nan') {
              analyzedData.clientName = strValue;
            }
          }
          
          // إذا لم نحدد العمود، جرب التخمين من القيمة
          else {
            const num = parseFloat(strValue);
            
            // أرقام صغيرة = كمية محتملة
            if (!isNaN(num) && num > 0 && num <= 100 && Number.isInteger(num) && !analyzedData.quantity) {
              analyzedData.quantity = num;
            }
            // أرقام متوسطة = سعر محتمل
            else if (!isNaN(num) && num > 50 && num <= 10000 && !analyzedData.clientPrice) {
              analyzedData.clientPrice = num;
            }
            // نص طويل = توصيف محتمل، أو رقم بند بنقاط
            else if (strValue.length > 30 && !analyzedData.description) {
              analyzedData.description = strValue;
            }
            // فحص إضافي لرقم البند إذا لم نجده بعد
            else if (/^\d{4}\.\d{3}\.[A-Z0-9]+\.\d{4}$/.test(strValue) && !analyzedData.lineItem) {
              analyzedData.lineItem = strValue;
            }
          }
        });
        
        // console.log(`Row ${index}: LINE ITEM: ${analyzedData.lineItem}, PRICE: ${analyzedData.clientPrice}, QTY: ${analyzedData.quantity}`);

        // Format dates properly (convert Excel serial dates if needed)
        const formatDate = (dateValue: any) => {
          if (!dateValue) return '';
          
          // If it's a number (Excel serial date), convert it
          if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const jsDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
            return jsDate.toISOString().split('T')[0];
          }
          
          // If it's already a string, return as is
          return dateValue.toString();
        };

        return {
          rowIndex: index + 1,
          // نقل كامل للبيانات المُحللة بناءً على هيكل قاعدة البيانات
          clientName: analyzedData.clientName || 'غير محدد',
          requestNumber: analyzedData.rfqNumber || `REQ-${Date.now()}-${index + 1}`,
          customRequestNumber: analyzedData.rfqNumber,
          requestDate: formatDate(analyzedData.rfqDate),
          expiryDate: formatDate(analyzedData.expiryDate),
          description: analyzedData.description || 'بدون توصيف',
          partNumber: analyzedData.partNumber || '',
          lineItem: analyzedData.lineItem || '',
          quantity: analyzedData.quantity || 0,
          unit: analyzedData.unit || 'Each',
          priceToClient: analyzedData.clientPrice || 0,
          status: 'pending',
          lineNumber: analyzedData.lineNumber || (index + 1)
        };
      });

      await logActivity(req, "preview_import", "quotations", req.session.user!.id, `Previewed ${mappedData.length} quotation records for import`);

      res.json({
        previewData: mappedData,
        totalRows: mappedData.length,
        mapping: {
          'B': 'وحدة القياس (UOM)',
          'C': 'رقم البند (LINE ITEM)',
          'D': 'رقم القطعة (PART NO)',
          'E': 'التوصيف (DESCRIPTION)',
          'F': 'رقم الطلب (RFQ NO)',
          'G': 'تاريخ الطلب (RFQ DATE)',
          'H': 'الكمية (QTY)',
          'I': 'السعر للعميل (CLIENT PRICE)',
          'J': 'تاريخ انتهاء العرض (EXPIRY DATE)',
          'K': 'اسم العميل (CLIENT NAME)'
        }
      });
    } catch (error) {
      console.error("Error previewing import:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/import/quotations/confirm", requireAuth, requireRole(['it_admin']), async (req: Request, res: Response) => {
    try {
      const { previewData } = req.body;
      
      if (!Array.isArray(previewData) || previewData.length === 0) {
        return res.status(400).json({ message: "No data to import" });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of previewData) {
        try {
          // Create or find client
          let client = await storage.getClientByName(row.clientName);
          if (!client && row.clientName) {
            const newClient = await storage.createClient({
              name: row.clientName,
              email: `${row.clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
              phone: '',
              address: ''
            });
            client = newClient;
          }

          // Create quotation request
          const quotationData = {
            clientId: client?.id || '',
            requestDate: row.requestDate,
            expiryDate: row.expiryDate,
            customRequestNumber: row.customRequestNumber,
            status: row.status as any,
            createdBy: req.session.user!.id,
            notes: `Imported from Excel - Price: ${row.priceToClient}`,
          };

          const quotation = await storage.createQuotationRequest(quotationData);

          // Create item for this quotation
          if (row.partNumber || row.description) {
            const itemData = {
              kItemId: `P-${Date.now()}-${successCount + 1}`,
              partNumber: row.partNumber || '',
              lineItem: row.lineItem || '',
              description: row.description || '',
              category: 'general',
              unit: row.unit || 'Each',
              createdBy: req.session.user!.id,
              notes: `Imported from RFQ ${row.customRequestNumber}`
            };

            const item = await storage.createItem(itemData);

            // Link item to quotation with price
            await storage.addItemToQuotation(quotation.id, {
              itemId: item.id,
              quantity: row.quantity,
              lineNumber: row.lineNumber || 0,
              clientPrice: row.priceToClient // إضافة السعر للعميل
            });
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Row ${row.rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await logActivity(req, "confirm_import", "quotations", req.session.user!.id, 
        `Imported ${successCount} quotations successfully, ${errorCount} errors`);

      res.json({
        success: true,
        imported: successCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 10) // Limit error details
      });
    } catch (error) {
      console.error("Error confirming import:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", requireAuth, async (req: Request, res: Response) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Get suppliers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/suppliers", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      validatedData.createdBy = req.session.user!.id;
      
      const supplier = await storage.createSupplier(validatedData);
      await logActivity(req, "create_supplier", "supplier", supplier.id, `Created supplier: ${supplier.name}`);

      res.status(201).json(supplier);
    } catch (error) {
      console.error("Create supplier error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/suppliers/:supplierId", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const { supplierId } = req.params;
      const updates = req.body;
      
      const supplier = await storage.updateSupplier(supplierId, updates);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      await logActivity(req, "update_supplier", "supplier", supplierId, `Updated supplier: ${supplier.name}`);

      res.json(supplier);
    } catch (error) {
      console.error("Update supplier error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/suppliers/:supplierId", requireAuth, requireRole(["manager", "data_entry"]), async (req: Request, res: Response) => {
    try {
      const { supplierId } = req.params;
      
      // Get supplier details for logging
      const supplier = await storage.getSupplierById(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      await storage.deleteSupplier(supplierId);
      await logActivity(req, "delete_supplier", "supplier", supplierId, `Deleted supplier: ${supplier.name}`);

      res.json({ message: "Supplier deleted successfully" });
    } catch (error: any) {
      console.error("Delete supplier error:", error);
      console.log("Full error details:", JSON.stringify(error, null, 2));
      if (error.message && error.message.includes("Cannot delete supplier")) {
        console.log("Sending Arabic error response for supplier");
        return res.status(400).json({ 
          message: "هذا المورد مرتبط بسجلات تسعير موجودة. يجب حذف السجلات أولاً.", 
          details: "هذا المورد مرتبط بسجلات تسعير موجودة. يجب حذف السجلات أولاً.",
          error: "SUPPLIER_HAS_PRICING_RECORDS"
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quotation items routes
  app.get("/api/quotations/:quotationId/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const { quotationId } = req.params;
      const items = await storage.getQuotationItems(quotationId);
      res.json(items);
    } catch (error) {
      console.error("Get quotation items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quotations/:quotationId/items", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const { quotationId } = req.params;
      const validatedData = insertQuotationItemSchema.parse({
        ...req.body,
        quotationId: quotationId,
      });
      
      const item = await storage.addQuotationItem(validatedData);
      await logActivity(req, "add_quotation_item", "quotation_item", item.id, `Added item to quotation: ${quotationId}`);

      res.status(201).json(item);
    } catch (error) {
      console.error("Add quotation item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete entire quotation
  app.delete("/api/quotations/:quotationId", requireAuth, requireRole(["manager"]), async (req: Request, res: Response) => {
    try {
      const { quotationId } = req.params;
      
      // Get quotation details for logging
      const quotation = await storage.getQuotationById(quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      await storage.deleteQuotation(quotationId);
      await logActivity(req, "delete_quotation", "quotation", quotationId, `Deleted quotation: ${quotation.requestNumber}`);

      res.json({ message: "Quotation deleted successfully" });
    } catch (error) {
      console.error("Delete quotation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/quotations/:quotationId/items/:itemId", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const { quotationId, itemId } = req.params;
      
      await storage.removeQuotationItem(itemId);
      await logActivity(req, "remove_quotation_item", "quotation_item", itemId, `Removed item from quotation: ${quotationId}`);

      res.json({ message: "Item removed successfully" });
    } catch (error) {
      console.error("Remove quotation item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Supplier quotes routes
  app.get("/api/items/:itemId/quotes", requireAuth, async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const quotes = await storage.getSupplierQuotes(itemId);
      res.json(quotes);
    } catch (error) {
      console.error("Get supplier quotes error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/items/:itemId/quotes", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const validatedData = insertSupplierQuoteSchema.parse(req.body);
      validatedData.itemId = itemId;
      validatedData.createdBy = req.session.user!.id;
      
      const quote = await storage.addSupplierQuote(validatedData);
      await logActivity(req, "add_supplier_quote", "supplier_quote", quote.id, `Added supplier quote for item: ${itemId}`);

      res.status(201).json(quote);
    } catch (error) {
      console.error("Add supplier quote error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase order items routes
  app.get("/api/purchase-orders/:poId/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const { poId } = req.params;
      const items = await storage.getPurchaseOrderItems(poId);
      res.json(items);
    } catch (error) {
      console.error("Get PO items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchase-orders/:poId/items", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const { poId } = req.params;
      const validatedData = insertPurchaseOrderItemSchema.parse(req.body);
      validatedData.poId = poId;
      
      const item = await storage.addPurchaseOrderItem(validatedData);
      await logActivity(req, "add_po_item", "purchase_order_item", item.id, `Added item to PO: ${poId}`);

      res.status(201).json(item);
    } catch (error) {
      console.error("Add PO item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Statistics endpoint
  app.get("/api/statistics", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Get statistics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Supplier pricing routes
  app.post("/api/supplier-pricing", requireAuth, requireRole(["manager", "data_entry", "purchasing"]), async (req: Request, res: Response) => {
    try {
      const pricingData = {
        ...req.body,
        createdBy: req.session.user!.id,
      };

      const pricing = await storage.createSupplierPricing(pricingData);
      await logActivity(req, "create_supplier_pricing", "pricing", pricing.id, `Added supplier pricing for item ${pricing.itemId}`);

      res.status(201).json(pricing);
    } catch (error) {
      console.error("Create supplier pricing error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/supplier-pricing", requireAuth, async (req: Request, res: Response) => {
    try {
      const pricing = await storage.getAllSupplierPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Get supplier pricing error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/supplier-pricing/item/:itemId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const pricing = await storage.getSupplierPricingByItem(itemId);
      res.json(pricing);
    } catch (error) {
      console.error("Get supplier pricing by item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/items-requiring-pricing", requireAuth, async (req: Request, res: Response) => {
    try {
      const items = await storage.getItemsRequiringPricing();
      res.json(items);
    } catch (error) {
      console.error("Get items requiring pricing error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/pricing-history/:itemId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const history = await storage.getPricingHistoryForItem(itemId);
      res.json(history);
    } catch (error) {
      console.error("Get pricing history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get items ready for customer pricing (Phase 2: Customer pricing)
  app.get("/api/items-ready-for-customer-pricing", requireAuth, async (req: Request, res: Response) => {
    try {
      const items = await storage.getItemsReadyForCustomerPricing();
      res.json(items);
    } catch (error) {
      console.error("Error fetching items ready for customer pricing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get detailed pricing information for an item
  app.get("/api/items/:itemId/detailed-pricing", requireAuth, async (req: Request, res: Response) => {
    try {
      const detailedPricing = await storage.getDetailedPricingForItem(req.params.itemId);
      res.json(detailedPricing);
    } catch (error) {
      console.error("Error fetching detailed pricing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get comprehensive item data like Excel table (unified version)
  app.get("/api/items/:itemId/comprehensive-data", requireAuth, async (req: Request, res: Response) => {
    try {
      const comprehensiveData = await storage.getItemComprehensiveDataUnified(req.params.itemId);
      res.json(comprehensiveData);
    } catch (error) {
      console.error("Error fetching comprehensive item data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Customer pricing endpoints
  app.post("/api/customer-pricing", requireAuth, requireRole(['manager']), async (req: Request, res: Response) => {
    try {
      const pricingData = { ...req.body, createdBy: req.session.user!.id };
      const pricing = await storage.createCustomerPricing(pricingData);
      await logActivity(req, "create_customer_pricing", "pricing", pricing.id, `Added customer pricing for item ${pricing.itemId}`);
      res.json(pricing);
    } catch (error) {
      console.error("Error creating customer pricing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/quotations/:quotationId/customer-pricing", requireAuth, async (req: Request, res: Response) => {
    try {
      const pricing = await storage.getCustomerPricingByQuotation(req.params.quotationId);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching customer pricing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/customer-pricing/:id/approve", requireAuth, requireRole(['manager']), async (req: Request, res: Response) => {
    try {
      const pricing = await storage.approveCustomerPricing(req.params.id, req.session.user!.id);
      if (!pricing) {
        return res.status(404).json({ message: "Customer pricing not found" });
      }
      await logActivity(req, "approve_customer_pricing", "pricing", pricing.id, `Approved customer pricing for item ${pricing.itemId}`);
      res.json(pricing);
    } catch (error) {
      console.error("Error approving customer pricing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced Purchase Orders endpoints
  app.post("/api/purchase-orders", requireAuth, requireRole(['manager', 'purchasing']), async (req: Request, res: Response) => {
    try {
      const poData = {
        ...req.body,
        createdBy: req.session.user!.id,
        poDate: new Date(req.body.poDate),
        totalValue: parseFloat(req.body.totalValue || '0')
      };
      
      const purchaseOrder = await storage.createPurchaseOrder(poData);
      await logActivity(req, "create_purchase_order", "purchase_order", purchaseOrder.id, `Created purchase order ${purchaseOrder.poNumber}`);
      res.status(201).json(purchaseOrder);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-orders/:id/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const items = await storage.getPurchaseOrderItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching purchase order items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update purchase order item
  app.patch("/api/purchase-orders/:poId/items/:itemId", requireAuth, requireRole(['manager', 'purchasing']), async (req: Request, res: Response) => {
    try {
      const { poId, itemId } = req.params;
      const updates = req.body;
      
      const updatedItem = await storage.updatePurchaseOrderItem(itemId, updates);
      if (!updatedItem) {
        return res.status(404).json({ message: "Purchase order item not found" });
      }

      // Recalculate and update PO total value
      await storage.updatePurchaseOrderTotal(poId);

      await logActivity(req, "update_po_item", "purchase_order_item", itemId, `Updated PO item in order ${poId}`);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating purchase order item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete purchase order item
  app.delete("/api/purchase-orders/:poId/items/:itemId", requireAuth, requireRole(['manager', 'purchasing']), async (req: Request, res: Response) => {
    try {
      const { poId, itemId } = req.params;
      
      const deletedItem = await storage.deletePurchaseOrderItem(itemId);
      if (!deletedItem) {
        return res.status(404).json({ message: "Purchase order item not found" });
      }

      // Recalculate and update PO total value
      await storage.updatePurchaseOrderTotal(poId);

      await logActivity(req, "delete_po_item", "purchase_order_item", itemId, `Deleted PO item from order ${poId}`);
      res.json({ message: "Purchase order item deleted successfully" });
    } catch (error) {
      console.error("Error deleting purchase order item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/purchase-orders/:id", requireAuth, requireRole(['manager', 'purchasing']), async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      
      const purchaseOrder = await storage.updatePurchaseOrder(req.params.id, updates);
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      await logActivity(req, "update_purchase_order", "purchase_order", purchaseOrder.id, `Updated purchase order: ${purchaseOrder.poNumber}`);

      res.json(purchaseOrder);
    } catch (error) {
      console.error("Update purchase order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/purchase-orders/:id", requireAuth, requireRole(['manager', 'purchasing']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get purchase order details for logging
      const purchaseOrder = await storage.getPurchaseOrder(id);
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      await storage.deletePurchaseOrder(id);
      await logActivity(req, "delete_purchase_order", "purchase_order", id, `Deleted purchase order: ${purchaseOrder.poNumber}`);

      res.json({ message: "Purchase order deleted successfully" });
    } catch (error) {
      console.error("Delete purchase order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/purchase-orders/:id/status", requireAuth, requireRole(['manager', 'purchasing']), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const purchaseOrder = await storage.updatePurchaseOrderStatus(req.params.id, status);
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      await logActivity(req, "update_purchase_order_status", "purchase_order", purchaseOrder.id, `Updated status to ${status}`);
      res.json(purchaseOrder);
    } catch (error) {
      console.error("Error updating purchase order status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get purchase orders for a specific item with full history
  app.get("/api/items/:itemId/purchase-orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const purchaseOrders = await storage.getPurchaseOrdersForItem(req.params.itemId);
      res.json(purchaseOrders);
    } catch (error) {
      console.error("Error fetching item purchase orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Import data endpoint (simple)
  app.post('/api/import-data', requireAuth, requireRole(['manager', 'it_admin']), async (req: Request, res: Response) => {
    try {
      const { importExcelData } = await import('./import-data.js');
      const result = await importExcelData();
      await logActivity(req, "import_data", "system", "", `Imported ${result.importedItems || 0} items from Excel`);
      res.json(result);
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Comprehensive import with AI analysis
  app.post('/api/import-comprehensive', requireAuth, requireRole(['manager', 'it_admin']), async (req: Request, res: Response) => {
    try {
      const { importAllItemsWithAIAnalysis } = await import('./comprehensive-import.js');
      const result = await importAllItemsWithAIAnalysis();
      await logActivity(req, "comprehensive_import", "system", "", `Comprehensive import: ${result.uniqueItemsImported} unique items, ${result.duplicatesDetected} duplicates detected`);
      res.json(result);
    } catch (error) {
      console.error('Error in comprehensive import:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Import quotations and purchase orders with pricing
  app.post('/api/import-quotations-pos', requireAuth, requireRole(['manager', 'it_admin']), async (req: Request, res: Response) => {
    try {
      const { importQuotationsAndPOs } = await import('./import-quotations-pos.js');
      const result = await importQuotationsAndPOs();
      await logActivity(req, "import_quotations_pos", "system", "", `Imported: ${result.quotationsCreated} quotations, ${result.purchaseOrdersCreated} POs, RFQ value: ${result.totalRFQValue.toLocaleString()}`);
      res.json(result);
    } catch (error) {
      console.error('Error importing quotations/POs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
