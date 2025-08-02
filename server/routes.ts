import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClientSchema, insertQuotationRequestSchema, insertItemSchema, insertPurchaseOrderSchema, insertSupplierSchema } from "@shared/schema";
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

  app.post("/api/clients", requireAuth, requireRole(["it_admin"]), async (req: Request, res: Response) => {
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

  // Quotation routes
  app.get("/api/quotations", requireAuth, async (req: Request, res: Response) => {
    try {
      const quotations = await storage.getAllQuotationRequests();
      res.json(quotations);
    } catch (error) {
      console.error("Get quotations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quotations", requireAuth, requireRole(["data_entry", "manager"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertQuotationRequestSchema.parse(req.body);
      validatedData.createdBy = req.session.user!.id;
      
      const quotation = await storage.createQuotationRequest(validatedData);
      await logActivity(req, "create_quotation", "quotation", quotation.id, `Created quotation: ${quotation.requestNumber}`);

      res.status(201).json(quotation);
    } catch (error) {
      console.error("Create quotation error:", error);
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
      const validatedData = insertItemSchema.parse(req.body);
      validatedData.createdBy = req.session.user!.id;
      
      // Check for similar items using AI simulation
      const similarItems = await storage.findSimilarItems(validatedData.description, validatedData.partNumber);
      
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
        });
      }

      // Placeholder for Deep Seek AI integration
      // In production, this would call the Deep Seek API
      const similarItems = await storage.findSimilarItems(description, partNumber);
      
      await logActivity(req, "ai_item_comparison", "item", undefined, `AI comparison for: ${description}`);

      res.json({
        status: "processed",
        similarItems,
        aiProvider: "deep_seek",
        apiKeyConfigured: !!deepSeekApiKey,
      });
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
      const validatedData = insertPurchaseOrderSchema.parse(req.body);
      validatedData.createdBy = req.session.user!.id;
      
      const purchaseOrder = await storage.createPurchaseOrder(validatedData);
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

      if (role === "manager" || role === "it_admin") {
        // Managers and IT admins can see all activities
        activities = await storage.getActivityLog();
      } else {
        // Other users can only see their own activities
        activities = await storage.getActivityLog(req.session.user!.id);
      }

      res.json(activities);
    } catch (error) {
      console.error("Get activity log error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Statistics endpoint
  app.get("/api/statistics", requireAuth, async (req: Request, res: Response) => {
    try {
      const quotations = await storage.getAllQuotationRequests();
      const purchaseOrders = await storage.getAllPurchaseOrders();
      const items = await storage.getAllItems();
      const users = await storage.getAllUsers();

      const stats = {
        totalQuotations: quotations.length,
        pendingQuotations: quotations.filter(q => q.status === "pending").length,
        completedQuotations: quotations.filter(q => q.status === "completed").length,
        totalPurchaseOrders: purchaseOrders.length,
        confirmedPurchaseOrders: purchaseOrders.filter(po => po.status === "confirmed").length,
        totalItems: items.length,
        activeUsers: users.filter(u => u.isOnline).length,
        totalUsers: users.length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Get statistics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
