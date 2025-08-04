import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, initializeDatabase } from "./storage";
import { insertUserSchema, insertClientSchema, insertQuotationRequestSchema, insertItemSchema, insertPurchaseOrderSchema, insertSupplierSchema, insertQuotationItemSchema, insertPurchaseOrderItemSchema, insertSupplierQuoteSchema } from "@shared/schema";
import { autoMapExcelColumns, processExcelRowForQuotation } from "./simpleExcelImport";
import { sendEmail, generatePasswordResetEmail } from "./emailService";
import { ObjectStorageService } from "./objectStorage";
import bcrypt from "bcrypt";
import session from "express-session";
import { randomBytes } from "crypto";

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

      await logActivity(req, "login_success", "user", user.id, `${user.fullName} قام بتسجيل الدخول بنجاح`);

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
        await logActivity(req, "logout", "user", req.session.user.id, `${req.session.user.fullName} قام بتسجيل الخروج`);
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

  // Password reset request
  app.post("/api/auth/reset-password-request", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "إذا كان البريد الإلكتروني موجود، ستصلك رسالة استعادة كلمة المرور" });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save token to database
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        email: email,
        expiresAt: expiresAt
      });

      // Generate reset link
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      
      // Send email
      const emailResult = await sendEmail({
        to: email,
        subject: "إعادة تعيين كلمة المرور - نظام قرطبة للتوريدات",
        html: generatePasswordResetEmail(user.fullName, resetLink)
      });

      if (emailResult.success) {
        res.json({ message: "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني" });
      } else {
        res.status(500).json({ message: emailResult.message });
      }

    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "الرمز المميز وكلمة المرور الجديدة مطلوبان" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      // Find and validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "رمز استعادة كلمة المرور غير صالح أو منتهي الصلاحية" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);

      await logActivity(req, "password_reset", "user", resetToken.userId, "Password reset completed");

      res.json({ message: "تم تغيير كلمة المرور بنجاح" });

    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "حدث خطأ في النظام" });
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

  // Change password
  app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "كلمة المرور الحالية والجديدة مطلوبة" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }

      // Get current user
      const user = await storage.getUser(req.session.user!.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        await logActivity(req, "failed_password_change", "user", user.id, "كلمة المرور الحالية غير صحيحة");
        return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(user.id, { password: hashedNewPassword });

      // Log activity
      await logActivity(req, "password_changed", "user", user.id, "تم تغيير كلمة المرور بنجاح");

      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "خطأ في تغيير كلمة المرور" });
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

  // Update user (all fields including block/unblock)
  app.patch("/api/users/:userId", requireAuth, requireRole(["manager", "it_admin"]), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log the activity
      if (updateData.hasOwnProperty('isActive')) {
        await logActivity(req, updateData.isActive ? "activate_user" : "deactivate_user", "user", userId, 
          `${updatedUser.fullName} تم ${updateData.isActive ? 'تفعيله' : 'إيقافه'}`);
      } else {
        await logActivity(req, "update_user", "user", userId, 
          `تم تحديث بيانات المستخدم ${updatedUser.fullName}`);
      }

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
      
      // استخدام DeepSeek AI API للتحقق من التكرار
      const deepSeekApiKey = process.env.OPENAI_API_KEY; // نستخدم نفس مفتاح الـ API
      
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
        
        // تحضير البيانات للذكاء الاصطناعي
        const systemPrompt = `أنت خبير في تحليل قطع الغيار والمعدات الكهربائية والميكانيكية. 
مهمتك هي تحديد ما إذا كان الصنف الجديد مطابق لأي من الأصناف الموجودة.
قم بتحليل الوصف ورقم القطعة (إن وجد) مع قاعدة البيانات الموجودة.

قواعد التحليل:
1. تحقق من التطابق في أرقام القطع (Part Numbers) - إذا كانت متطابقة فهي نفس القطعة
2. تحقق من الوصف والمواصفات التقنية
3. انتبه للعلامات التجارية المختلفة لنفس القطعة
4. انتبه للوحدات المختلفة (متر، قدم، كيلو، طن...)

أجب بـ JSON فقط:
{
  "isDuplicate": true/false,
  "confidence": 0-100,
  "matchedItem": "رقم الصنف المطابق أو null",
  "reason": "سبب القرار"
}`;

        const userPrompt = `الصنف الجديد:
الوصف: ${description}
رقم القطعة: ${partNumber || "غير محدد"}

الأصناف الموجودة في قاعدة البيانات:
${similarItems.map(item => `- ${item.itemNumber}: ${item.description} (رقم القطعة: ${item.partNumber || "غير محدد"})`).join('\n')}

هل الصنف الجديد مكرر؟`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepSeekApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 500
          })
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const aiResult = await response.json();
        const aiAnalysis = JSON.parse(aiResult.choices[0].message.content);

        return res.json({
          status: aiAnalysis.isDuplicate ? "duplicate" : "processed",
          similarItems: aiAnalysis.isDuplicate ? similarItems : [],
          aiProvider: "deepseek",
          confidence: aiAnalysis.confidence,
          reason: aiAnalysis.reason,
          matchedItem: aiAnalysis.matchedItem,
          apiKeyConfigured: true,
        });

      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        // Fallback to local matching
        const similarItems = await storage.findSimilarItems(description, partNumber);
        return res.json({
          status: "processed",
          similarItems,
          aiProvider: "local_matching_fallback",
          apiKeyConfigured: true,
          error: "AI analysis failed, using local matching",
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
            currency: item.currency
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

  // Object Storage routes for profile images
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/profile-image/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProfileImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting profile image upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/profile-image/set-acl", requireAuth, async (req: Request, res: Response) => {
    try {
      const { imageUrl } = req.body;
      const userId = req.session.user!.id;
      
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageUrl,
        {
          owner: userId,
          visibility: "public", // Profile images are public
        },
      );

      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting profile image ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects (like profile images)
  app.get("/objects/:objectPath(*)", async (req: Request, res: Response) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      // For profile images, allow public access
      // const userId = req.session.user?.id;
      // const canAccess = await objectStorageService.canAccessObjectEntity({
      //   objectFile,
      //   userId: userId,
      //   requestedPermission: "read" as any,
      // });
      // if (!canAccess) {
      //   return res.sendStatus(401);
      // }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing private object:", error);
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Database export route (IT Admin only)
  app.get("/api/admin/database-export", requireAuth, requireRole(["it_admin"]), async (req: Request, res: Response) => {
    try {
      console.log("Database export requested by:", req.session.user?.fullName);

      // Get current timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `qortoba-database-backup-${timestamp}.sql`;

      // Set headers for file download
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Create SQL dump with all tables and data
      let sqlDump = `-- قاعدة بيانات نظام قرطبة للتوريدات\n`;
      sqlDump += `-- تم التصدير في: ${new Date().toISOString()}\n`;
      sqlDump += `-- بواسطة: ${req.session.user?.fullName}\n\n`;

      // Export complete data from all tables
      try {
        // Users (without passwords)
        const users = await storage.getAllUsers();
        sqlDump += `-- Table: users (${users.length} records)\n`;
        sqlDump += `-- =====================\n`;
        sqlDump += `INSERT INTO users (id, username, full_name, email, role, is_online, created_at, last_login, ip_address, profile_image) VALUES\n`;
        
        if (users.length > 0) {
          const userValues = users.map(user => {
            const values = [
              `'${user.id}'`,
              `'${user.username}'`,
              `'${user.fullName}'`,
              user.email ? `'${user.email}'` : 'NULL',
              `'${user.role}'`,
              user.isOnline ? 'true' : 'false',
              user.createdAt ? `'${user.createdAt.toISOString()}'` : 'NULL',
              user.lastLogin ? `'${user.lastLogin.toISOString()}'` : 'NULL',
              user.ipAddress ? `'${user.ipAddress}'` : 'NULL',
              user.profileImage ? `'${user.profileImage}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += userValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No users found\n\n`;
        }

        // Clients
        const clients = await storage.getAllClients();
        sqlDump += `-- Table: clients (${clients.length} records)\n`;
        sqlDump += `-- =====================\n`;
        sqlDump += `INSERT INTO clients (id, name, email, phone, address, created_at, created_by) VALUES\n`;
        
        if (clients.length > 0) {
          const clientValues = clients.map(client => {
            const values = [
              `'${client.id}'`,
              `'${client.name.replace(/'/g, "''")}'`,
              client.email ? `'${client.email}'` : 'NULL',
              client.phone ? `'${client.phone}'` : 'NULL',
              client.address ? `'${client.address.replace(/'/g, "''")}'` : 'NULL',
              client.createdAt ? `'${client.createdAt.toISOString()}'` : 'NULL',
              client.createdBy ? `'${client.createdBy}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += clientValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No clients found\n\n`;
        }

        // Suppliers
        const suppliers = await storage.getAllSuppliers();
        sqlDump += `-- Table: suppliers (${suppliers.length} records)\n`;
        sqlDump += `-- =====================\n`;
        sqlDump += `INSERT INTO suppliers (id, name, email, phone, address, created_at, created_by) VALUES\n`;
        
        if (suppliers.length > 0) {
          const supplierValues = suppliers.map(supplier => {
            const values = [
              `'${supplier.id}'`,
              `'${supplier.name.replace(/'/g, "''")}'`,
              supplier.email ? `'${supplier.email}'` : 'NULL',
              supplier.phone ? `'${supplier.phone}'` : 'NULL',
              supplier.address ? `'${supplier.address.replace(/'/g, "''")}'` : 'NULL',
              supplier.createdAt ? `'${supplier.createdAt.toISOString()}'` : 'NULL',
              supplier.createdBy ? `'${supplier.createdBy}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += supplierValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No suppliers found\n\n`;
        }

        // Items
        const items = await storage.getAllItems();
        sqlDump += `-- Table: items (${items.length} records)\n`;
        sqlDump += `-- =====================\n`;
        sqlDump += `INSERT INTO items (id, item_number, part_number, description, unit, created_at, created_by, category, subcategory, specifications) VALUES\n`;
        
        if (items.length > 0) {
          const itemValues = items.map(item => {
            const values = [
              `'${item.id}'`,
              item.itemNumber ? `'${item.itemNumber}'` : 'NULL',
              item.partNumber ? `'${item.partNumber.replace(/'/g, "''")}'` : 'NULL',
              `'${item.description.replace(/'/g, "''")}'`,
              item.unit ? `'${item.unit}'` : 'NULL',
              item.createdAt ? `'${item.createdAt.toISOString()}'` : 'NULL',
              item.createdBy ? `'${item.createdBy}'` : 'NULL',
              item.category ? `'${item.category.replace(/'/g, "''")}'` : 'NULL',
              item.subcategory ? `'${item.subcategory?.replace(/'/g, "''")}'` : 'NULL',
              item.specifications ? `'${item.specifications.replace(/'/g, "''")}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += itemValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No items found\n\n`;
        }

        // Purchase Orders
        const purchaseOrders = await storage.getAllPurchaseOrders();
        sqlDump += `-- Table: purchase_orders (${purchaseOrders.length} records)\n`;
        sqlDump += `-- =====================\n`;
        sqlDump += `INSERT INTO purchase_orders (id, po_number, quotation_id, po_date, total_value, status, delivery_status, invoice_issued, created_at, created_by) VALUES\n`;
        
        if (purchaseOrders.length > 0) {
          const poValues = purchaseOrders.map(po => {
            const values = [
              `'${po.id}'`,
              `'${po.poNumber}'`,
              `'${po.quotationId}'`,
              po.poDate ? `'${po.poDate.toISOString()}'` : 'NULL',
              po.totalValue ? `'${po.totalValue}'` : 'NULL',
              po.status ? `'${po.status}'` : 'NULL',
              po.deliveryStatus ? 'true' : 'false',
              po.invoiceIssued ? 'true' : 'false',
              po.createdAt ? `'${po.createdAt.toISOString()}'` : 'NULL',
              `'${po.createdBy}'`
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += poValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No purchase orders found\n\n`;
        }

        // Purchase Order Items
        let allPOItems = [];
        for (const po of purchaseOrders) {
          try {
            const poItems = await storage.getPurchaseOrderItems(po.id);
            allPOItems.push(...poItems.map(item => ({ ...item, poId: po.id })));
          } catch (error) {
            console.log(`Could not get items for PO ${po.id}`);
          }
        }
        
        sqlDump += `-- Table: purchase_order_items (${allPOItems.length} records)\n`;
        sqlDump += `-- =====================\n`;
        if (allPOItems.length > 0) {
          sqlDump += `INSERT INTO purchase_order_items (id, purchase_order_id, item_id, quantity, unit_price, total_price) VALUES\n`;
          const poItemValues = allPOItems.map(item => {
            const values = [
              `'${item.id}'`,
              `'${item.purchaseOrderId}'`,
              `'${item.itemId}'`,
              `${item.quantity}`,
              item.unitPrice ? `'${item.unitPrice}'` : 'NULL',
              item.totalPrice ? `'${item.totalPrice}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += poItemValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No purchase order items found\n\n`;
        }

        // Quotation Requests
        const quotations = await storage.getAllQuotationRequests();
        sqlDump += `-- Table: quotation_requests (${quotations.length} records)\n`;
        sqlDump += `-- =====================\n`;
        sqlDump += `INSERT INTO quotation_requests (id, request_number, client_id, request_date, expiry_date, status, responsible_employee, custom_request_number, notes, created_at, created_by) VALUES\n`;
        
        if (quotations.length > 0) {
          const quotationValues = quotations.map(quotation => {
            const values = [
              `'${quotation.id}'`,
              `'${quotation.requestNumber}'`,
              quotation.clientId ? `'${quotation.clientId}'` : 'NULL',
              `'${quotation.requestDate}'`,
              quotation.expiryDate ? `'${quotation.expiryDate}'` : 'NULL',
              quotation.status ? `'${quotation.status}'` : 'NULL',
              quotation.responsibleEmployee ? `'${quotation.responsibleEmployee}'` : 'NULL',
              quotation.customRequestNumber ? `'${quotation.customRequestNumber}'` : 'NULL',
              quotation.notes ? `'${quotation.notes.replace(/'/g, "''")}'` : 'NULL',
              quotation.createdAt ? `'${quotation.createdAt.toISOString()}'` : 'NULL',
              `'${quotation.createdBy}'`
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += quotationValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No quotation requests found\n\n`;
        }

        // Quotation Items
        let allQuotationItems = [];
        for (const quotation of quotations) {
          try {
            const quotationItems = await storage.getQuotationItems(quotation.id);
            allQuotationItems.push(...quotationItems);
          } catch (error) {
            console.log(`Could not get items for quotation ${quotation.id}`);
          }
        }
        
        sqlDump += `-- Table: quotation_items (${allQuotationItems.length} records)\n`;
        sqlDump += `-- =====================\n`;
        if (allQuotationItems.length > 0) {
          sqlDump += `INSERT INTO quotation_items (id, quotation_id, item_id, quantity, line_number, client_price, created_at) VALUES\n`;
          const quotationItemValues = allQuotationItems.map(item => {
            const values = [
              `'${item.id}'`,
              `'${item.quotationId}'`,
              `'${item.itemId}'`,
              `${item.quantity}`,
              item.lineNumber || 'NULL',
              item.clientPrice ? `'${item.clientPrice}'` : 'NULL',
              item.createdAt ? `'${item.createdAt.toISOString()}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += quotationItemValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No quotation items found\n\n`;
        }

        // Supplier Pricing
        const supplierPricing = await storage.getAllSupplierPricing();
        sqlDump += `-- Table: supplier_pricing (${supplierPricing.length} records)\n`;
        sqlDump += `-- =====================\n`;
        if (supplierPricing.length > 0) {
          sqlDump += `INSERT INTO supplier_pricing (id, supplier_id, item_id, unit_price, currency, minimum_quantity, lead_time, effective_date, created_at, created_by) VALUES\n`;
          const supplierPricingValues = supplierPricing.map(pricing => {
            const values = [
              `'${pricing.id}'`,
              `'${pricing.supplierId}'`,
              `'${pricing.itemId}'`,
              `'${pricing.unitPrice}'`,
              pricing.currency ? `'${pricing.currency}'` : 'NULL',
              pricing.minimumQuantity || 'NULL',
              pricing.leadTime ? `'${pricing.leadTime}'` : 'NULL',
              pricing.effectiveDate ? `'${pricing.effectiveDate.toISOString()}'` : 'NULL',
              pricing.createdAt ? `'${pricing.createdAt.toISOString()}'` : 'NULL',
              pricing.createdBy ? `'${pricing.createdBy}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += supplierPricingValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No supplier pricing found\n\n`;
        }

        // Supplier Quotes
        let allSupplierQuotes = [];
        for (const item of items) {
          try {
            const quotes = await storage.getSupplierQuotes(item.id);
            allSupplierQuotes.push(...quotes);
          } catch (error) {
            console.log(`Could not get quotes for item ${item.id}`);
          }
        }
        
        sqlDump += `-- Table: supplier_quotes (${allSupplierQuotes.length} records)\n`;
        sqlDump += `-- =====================\n`;
        if (allSupplierQuotes.length > 0) {
          sqlDump += `INSERT INTO supplier_quotes (id, quotation_item_id, supplier_id, unit_price, currency, lead_time, notes, created_at) VALUES\n`;
          const supplierQuoteValues = allSupplierQuotes.map(quote => {
            const values = [
              `'${quote.id}'`,
              `'${quote.quotationItemId}'`,
              `'${quote.supplierId}'`,
              `'${quote.unitPrice}'`,
              quote.currency ? `'${quote.currency}'` : 'NULL',
              quote.leadTime ? `'${quote.leadTime}'` : 'NULL',
              quote.notes ? `'${quote.notes.replace(/'/g, "''")}'` : 'NULL',
              quote.createdAt ? `'${quote.createdAt.toISOString()}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += supplierQuoteValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No supplier quotes found\n\n`;
        }

        // Activity Log
        const activities = await storage.getActivities(1000); // Get more activities
        sqlDump += `-- Table: activity_log (${activities.length} records)\n`;
        sqlDump += `-- =====================\n`;
        if (activities.length > 0) {
          sqlDump += `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, ip_address, timestamp, user_full_name, user_profile_image) VALUES\n`;
          const activityValues = activities.map(activity => {
            const values = [
              `'${activity.id}'`,
              `'${activity.userId}'`,
              `'${activity.action.replace(/'/g, "''")}'`,
              activity.entityType ? `'${activity.entityType}'` : 'NULL',
              activity.entityId ? `'${activity.entityId}'` : 'NULL',
              activity.details ? `'${activity.details.replace(/'/g, "''")}'` : 'NULL',
              activity.ipAddress ? `'${activity.ipAddress}'` : 'NULL',
              `'${activity.timestamp.toISOString()}'`,
              activity.userFullName ? `'${activity.userFullName.replace(/'/g, "''")}'` : 'NULL',
              activity.userProfileImage ? `'${activity.userProfileImage}'` : 'NULL'
            ];
            return `(${values.join(', ')})`;
          });
          sqlDump += activityValues.join(',\n');
          sqlDump += ';\n\n';
        } else {
          sqlDump += `-- No activities found\n\n`;
        }

      } catch (dataError) {
        console.error("Error getting data:", dataError);
        sqlDump += `-- Error accessing data: ${dataError instanceof Error ? dataError.message : 'Unknown error'}\n\n`;
      }

      // Add summary statistics
      sqlDump += `-- ==========================================\n`;
      sqlDump += `-- EXPORT SUMMARY\n`;
      sqlDump += `-- ==========================================\n`;
      sqlDump += `-- Export completed at: ${new Date().toISOString()}\n`;
      sqlDump += `-- Exported by: ${req.session.user?.fullName}\n`;
      sqlDump += `-- \n`;
      sqlDump += `-- This is a complete database backup containing all data.\n`;
      sqlDump += `-- To restore: Execute this SQL file on a PostgreSQL database.\n`;
      sqlDump += `-- ==========================================\n`;

      // Log the activity
      await logActivity(req, "database_export", "system", undefined, 
        `تم تصدير ملخص قاعدة البيانات - ${filename}`);

      // Send the SQL dump
      res.send(sqlDump);

    } catch (error) {
      console.error("Database export error:", error);
      res.status(500).json({ message: "خطأ في تصدير قاعدة البيانات" });
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

      await logActivity(req, "export_data", table, undefined, `Exported ${table} data as ${format} (${data.length} records)`);
      
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
  // مرحلة 1: تحليل الملف وعرض الأعمدة المتاحة
  app.post("/api/import/quotations/analyze", requireAuth, requireRole(['it_admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { excelData } = req.body;
      
      if (!Array.isArray(excelData) || excelData.length === 0) {
        return res.status(400).json({ message: "Invalid Excel data" });
      }

      // استخراج أعمدة الملف
      const firstRow = excelData[0];
      const availableColumns = Object.keys(firstRow).map((key, index) => ({
        letter: String.fromCharCode(65 + index), // A, B, C, etc.
        index: index,
        name: key,
        sampleData: String(firstRow[key] || '').substring(0, 30)
      }));

      // عرض عينة من البيانات (أول 3 صفوف)
      const sampleRows = excelData.slice(0, 3).map((row, index) => ({
        rowNumber: index + 1,
        data: availableColumns.map(col => ({
          column: col.letter,
          value: String(row[col.name] || '').substring(0, 30)
        }))
      }));

      res.json({
        availableColumns,
        sampleRows,
        totalRows: excelData.length,
        requiredFields: [
          { field: 'lineItem', label: 'رقم البند', description: 'مثال: 1854.002.CARIER.7519', required: true },
          { field: 'partNumber', label: 'رقم القطعة', description: 'مثال: 2503244', required: true },
          { field: 'description', label: 'التوصيف', description: 'وصف المنتج', required: true },
          { field: 'quantity', label: 'الكمية', description: 'رقم', required: true },
          { field: 'unit', label: 'وحدة القياس', description: 'مثال: Each, Pcs', required: true },
          { field: 'requestDate', label: 'تاريخ الطلب', description: 'تاريخ أو رقم Excel', required: true },
          { field: 'expiryDate', label: 'تاريخ انتهاء العرض', description: 'تاريخ أو رقم Excel', required: true },
          { field: 'clientName', label: 'اسم العميل', description: 'اسم الشركة أو العميل', required: true },
          { field: 'rfqNumber', label: 'رقم الطلب', description: 'رقم طلب التسعير', required: true },
          { field: 'unitPrice', label: 'سعر الوحدة', description: 'سعر اختياري', required: false }
        ]
      });

    } catch (error) {
      console.error("Error analyzing Excel file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // مرحلة 2: معاينة البيانات بناءً على مطابقة الأعمدة المحددة
  app.post("/api/import/quotations/preview", requireAuth, requireRole(['it_admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { excelData, columnMapping } = req.body;
      
      console.log("Preview request received:", {
        excelDataType: typeof excelData,
        excelDataLength: Array.isArray(excelData) ? excelData.length : 'not array',
        columnMappingType: typeof columnMapping,
        columnMappingKeys: columnMapping ? Object.keys(columnMapping) : 'no keys'
      });


      
      if (!Array.isArray(excelData) || excelData.length === 0) {
        console.log("❌ Invalid Excel data:", excelData);
        return res.status(400).json({ message: "Invalid Excel data" });
      }

      if (!columnMapping || typeof columnMapping !== 'object') {
        console.log("❌ Column mapping required:", columnMapping);
        return res.status(400).json({ message: "Column mapping is required" });
      }

      // فلترة بسيطة للصفوف الفارغة فقط
      const filteredData = excelData.filter((row: any) => {
        const values = Object.values(row);
        return values.some(val => val !== null && val !== undefined && val !== '' && String(val).trim() !== '');
      });

      console.log(`Filtered ${excelData.length} rows down to ${filteredData.length} data rows`);

      // تحقق من وجود البيانات
      if (filteredData.length === 0) {
        console.log("❌ No data after filtering");
        return res.json({ previewData: [], totalRows: 0, message: "لا توجد بيانات صالحة في الملف" });
      }

      console.log("🔍 Sample filtered data:", filteredData.slice(0, 2));

      // نسخ البيانات مباشرة كما هي في Excel بدون أي تعديل أو Fill Down
      const mappedData = filteredData.map((row: any, index: number) => {
        const rowKeys = Object.keys(row);
        
        // قيم افتراضية فقط
        const processedData = {
          lineNumber: index + 1,
          unit: 'Each',
          lineItem: '',
          partNumber: '',
          description: '',
          rfqNumber: '',
          rfqDate: '',
          quantity: 0,
          clientPrice: 0,
          expiryDate: '',
          clientName: ''
        };
        
        // نسخ مباشر للقيم من الأعمدة المحددة - كما هي بالضبط  
        Object.entries(columnMapping as Record<string, string>).forEach(([fieldName, columnLetter]) => {
          const rawValue = row[columnLetter]; // استخدم اسم العمود مباشرة
          const strValue = rawValue ? String(rawValue).trim() : '';
          

          
          // نسخ القيمة بدون أي تعديل
          switch (fieldName) {
            case 'lineItem':
              processedData.lineItem = strValue;
              break;
            case 'partNumber':
              processedData.partNumber = strValue;
              break;
            case 'description':
              processedData.description = strValue;
              break;
            case 'quantity':
              processedData.quantity = strValue ? parseInt(strValue) || 0 : 0;
              break;
            case 'unit':
              processedData.unit = strValue || 'Each';
              break;
            case 'requestDate':
              processedData.rfqDate = rawValue; // نسخ كما هو - رقم أو نص
              break;
            case 'expiryDate':
              processedData.expiryDate = rawValue; // نسخ كما هو
              break;
            case 'clientName':
              processedData.clientName = strValue || '';

              break;
            case 'rfqNumber':
              processedData.rfqNumber = strValue;
              break;
            case 'unitPrice':
              processedData.clientPrice = strValue ? parseFloat(strValue) || 0 : 0;
              break;
          }
        });
        
        // console.log(`Row ${index}: LINE ITEM: ${processedData.lineItem}, PRICE: ${processedData.clientPrice}, QTY: ${processedData.quantity}`);

        // تحويل التواريخ فقط عند الحاجة للعرض
        const formatDate = (dateValue: any) => {
          if (!dateValue) return '';
          
          // إذا كان رقم Excel التسلسلي
          if (typeof dateValue === 'number' && dateValue > 40000 && dateValue < 50000) {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            return jsDate.toISOString().split('T')[0];
          }
          
          return dateValue.toString();
        };

        // إرجاع البيانات للمعاينة كما هي
        const result = {
          rowIndex: index + 1,
          lineNumber: processedData.lineNumber,
          
          // نسخ البيانات كما هي
          requestNumber: processedData.rfqNumber || `REQ-${Date.now()}-${index + 1}`,
          customRequestNumber: processedData.rfqNumber,
          requestDate: formatDate(processedData.rfqDate),
          expiryDate: formatDate(processedData.expiryDate),
          status: 'pending',
          
          clientName: processedData.clientName || 'غير محدد',
          
          // بيانات البند
          itemNumber: '',
          kItemId: '',
          partNumber: processedData.partNumber,
          lineItem: processedData.lineItem,
          description: processedData.description,
          unit: processedData.unit,
          category: '',
          brand: '',
          
          // بيانات العرض
          quantity: processedData.quantity,
          unitPrice: processedData.clientPrice,
          totalPrice: processedData.quantity * processedData.clientPrice,
          currency: 'EGP',
          
          // حالة الذكاء الاصطناعي
          aiStatus: 'pending',
          aiMatchedItemId: null
        };
        
        return result;
      });

      console.log(`✅ Generated ${mappedData.length} preview records`);
      console.log("🔍 Sample mapped data:", mappedData.slice(0, 2));
      
      // تحقق من مطابقة الأعمدة وإرجاع معلومات إضافية للمساعدة في التشخيص
      const columnMappingInfo = Object.entries(columnMapping as Record<string, string>).map(([field, column]) => ({
        field,
        column,
        sampleValue: filteredData[0]?.[column],
        found: filteredData[0]?.[column] !== undefined
      }));

      await logActivity(req, "preview_import", "quotations", req.session.user!.id, `Previewed ${mappedData.length} quotation records for import`);

      res.json({
        previewData: mappedData,
        totalRows: mappedData.length,
        columnMappingInfo,
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

  // نقطة نهاية للاختبار السريع
  app.get("/api/import/quotations/test-data", requireAuth, async (req: Request, res: Response) => {
    try {
      const testData = [
        {"A":"1","B":"Each","C":"1854.002.CARIER.7519","D":"2503244","E":"COMPLETE PC BOARD","F":"25R009802","G":"45844","H":"6","I":"","J":"45858","K":"EDC","L":"done"},
        {"A":"2","B":"Each","C":"1854.002.CARIER.7520","D":"2503245","E":"CIRCUIT BOARD","F":"","G":"45844","H":"4","I":"","J":"45858","K":"","L":"done"}
      ];
      
      const columnMapping = {
        "lineItem": "C",
        "partNumber": "D", 
        "description": "E",
        "quantity": "H",
        "unit": "B",
        "requestDate": "G",
        "expiryDate": "J",
        "clientName": "K",
        "rfqNumber": "F"
      };

      // استخدام نفس منطق المعاينة
      const filteredData = testData.filter((row: any) => {
        const values = Object.values(row);
        return values.some(val => val !== null && val !== undefined && val !== '' && String(val).trim() !== '');
      });

      const mappedData = filteredData.map((row: any, index: number) => {
        const processedData = {
          lineNumber: index + 1,
          unit: 'Each',
          lineItem: '',
          partNumber: '',
          description: '',
          rfqNumber: '',
          rfqDate: '',
          quantity: 0,
          clientPrice: 0,
          expiryDate: '',
          clientName: ''
        };
        
        Object.entries(columnMapping as Record<string, string>).forEach(([fieldName, columnLetter]) => {
          const rawValue = row[columnLetter];
          const strValue = rawValue ? String(rawValue).trim() : '';
          
          switch (fieldName) {
            case 'lineItem':
              processedData.lineItem = strValue;
              break;
            case 'partNumber':
              processedData.partNumber = strValue;
              break;
            case 'description':
              processedData.description = strValue;
              break;
            case 'quantity':
              processedData.quantity = strValue ? parseInt(strValue) || 0 : 0;
              break;
            case 'unit':
              processedData.unit = strValue || 'Each';
              break;
            case 'requestDate':
              processedData.rfqDate = rawValue;
              break;
            case 'expiryDate':
              processedData.expiryDate = rawValue;
              break;
            case 'clientName':
              processedData.clientName = strValue || '';
              break;
            case 'rfqNumber':
              processedData.rfqNumber = strValue;
              break;
          }
        });

        const formatDate = (dateValue: any) => {
          if (!dateValue) return '';
          if (typeof dateValue === 'number' && dateValue > 40000 && dateValue < 50000) {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            return jsDate.toISOString().split('T')[0];
          }
          return dateValue.toString();
        };

        return {
          rowIndex: index + 1,
          lineNumber: processedData.lineNumber,
          requestNumber: processedData.rfqNumber || `REQ-${Date.now()}-${index + 1}`,
          customRequestNumber: processedData.rfqNumber,
          requestDate: formatDate(processedData.rfqDate),
          expiryDate: formatDate(processedData.expiryDate),
          status: 'pending',
          clientName: processedData.clientName || 'غير محدد',
          itemNumber: '',
          kItemId: '',
          partNumber: processedData.partNumber,
          lineItem: processedData.lineItem,
          description: processedData.description,
          unit: processedData.unit,
          category: '',
          brand: '',
          quantity: processedData.quantity,
          unitPrice: processedData.clientPrice,
          totalPrice: processedData.quantity * processedData.clientPrice,
          currency: 'EGP',
          aiStatus: 'pending',
          aiMatchedItemId: null
        };
      });

      res.json({
        previewData: mappedData,
        totalRows: mappedData.length,
        message: "بيانات اختبار - النسخ المباشر يعمل"
      });
    } catch (error) {
      console.error("Test data error:", error);
      res.status(500).json({ message: "خطأ في بيانات الاختبار" });
    }
  });

  app.post("/api/import/quotations/confirm", requireAuth, requireRole(['it_admin', 'manager']), async (req: Request, res: Response) => {
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
      await logActivity(req, "import_data", "system", undefined, `Imported ${result.stats?.items || 0} items from Excel`);
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

  // 🚀 استيراد تلقائي بسيط
  app.post("/api/import/quotations/auto", requireAuth, requireRole(['it_admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { excelData } = req.body;
      
      if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        return res.status(400).json({ message: "Excel data is required" });
      }

      console.log("🚀 Auto-import starting with", excelData.length, "rows");
      
      // الخطوة 1: استخراج أسماء الأعمدة
      const excelColumns = Object.keys(excelData[0]);
      console.log("📋 Available columns:", excelColumns);
      
      // الخطوة 2: المطابقة التلقائية
      const mapping = autoMapExcelColumns(excelColumns);
      console.log("🤖 Column mapping:", mapping);
      
      // الخطوة 3: معالجة البيانات
      const processedData = excelData.map((row: any, index: number) => 
        processExcelRowForQuotation(row, mapping, index)
      );

      // فلترة البيانات الصالحة - السماح بالبنود بدون رقم قطعة
      const validData = processedData.filter((row, index) => {
        const isValid = row.lineItem && row.description && row.quantity > 0;
        if (!isValid) {
          console.log(`❌ Row ${index + 1} rejected:`, {
            lineItem: row.lineItem || 'missing',
            description: row.description || 'missing', 
            quantity: row.quantity,
            reason: !row.lineItem ? 'no lineItem' : !row.description ? 'no description' : 'quantity <= 0'
          });
        }
        return isValid;
      });

      console.log(`✅ Processed ${processedData.length} rows, ${validData.length} valid`);
      
      const confidence = Math.round((Object.keys(mapping).length / 10) * 100);
      
      await logActivity(req, "auto_import", "quotations", req.session.user!.id, 
        `Auto-imported ${validData.length} quotation records`);

      res.json({
        previewData: validData,
        totalRows: validData.length,
        confidence,
        mapping,
        message: `تم استيراد ${validData.length} سجل تلقائياً`
      });

    } catch (error) {
      console.error("Error in auto-import:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // تأكيد الاستيراد وحفظ البيانات في قاعدة البيانات
  app.post("/api/import/quotations/confirm", requireAuth, requireRole(['it_admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { quotationData } = req.body;
      
      if (!quotationData || !Array.isArray(quotationData) || quotationData.length === 0) {
        return res.status(400).json({ message: "Quotation data is required" });
      }

      console.log("💾 Confirming import of", quotationData.length, "quotation records");
      
      let imported = 0;
      const errors: string[] = [];

      for (const record of quotationData) {
        try {
          // إنشاء طلب التسعير
          const quotationRequest = await storage.createQuotationRequest({
            customRequestNumber: record.customRequestNumber,
            requestDate: record.requestDate || new Date().toISOString().split('T')[0],
            expiryDate: record.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: record.status || 'pending',
            clientName: record.clientName || 'غير محدد',
            notes: '',
            totalValue: record.totalPrice || 0,
            currency: record.currency || 'EGP'
          });

          // إنشاء بند طلب التسعير
          await storage.createQuotationRequestItem({
            quotationRequestId: quotationRequest.id,
            itemNumber: record.itemNumber || '',
            kItemId: record.kItemId || '',
            partNumber: record.partNumber || '',
            lineItem: record.lineItem || '',
            description: record.description || '',
            unit: record.unit || 'غير محدد',
            category: record.category || '',
            brand: record.brand || '',
            quantity: record.quantity || 0,
            unitPrice: record.unitPrice || 0,
            totalPrice: record.totalPrice || 0,
            currency: record.currency || 'EGP',
            aiStatus: record.aiStatus || 'pending',
            aiMatchedItemId: record.aiMatchedItemId || null
          });

          imported++;
        } catch (error) {
          console.error("Error importing record:", error);
          errors.push(`سجل ${record.rowIndex}: ${error}`);
        }
      }

      console.log(`✅ Import completed: ${imported} records imported, ${errors.length} errors`);
      
      await logActivity(req, "confirm_import", "quotations", req.session.user!.id, 
        `Imported ${imported} quotation records successfully`);

      res.json({
        imported,
        total: quotationData.length,
        errors,
        message: `تم استيراد ${imported} سجل بنجاح`
      });

    } catch (error) {
      console.error("Error confirming import:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
