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

  // Permission-based access control
  const requirePermission = (permission: string) => {
    return async (req: Request, res: Response, next: Function) => {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        // Get user with permissions
        const user = await storage.getUser(req.session.user.id);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // Parse permissions JSON or use default based on role
        let userPermissions: any = {};
        if (user.permissions) {
          try {
            userPermissions = JSON.parse(user.permissions);
          } catch {
            // If permissions is invalid JSON, use default for role
            userPermissions = getDefaultPermissionsForRole(user.role);
          }
        } else {
          // If no permissions set, use default for role
          userPermissions = getDefaultPermissionsForRole(user.role);
        }

        // Check if user has the required permission
        if (!userPermissions[permission]) {
          return res.status(403).json({ message: "Insufficient permissions" });
        }

        next();
      } catch (error: any) {
        console.error("Permission check error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    };
  };

  // Helper function to get default permissions for a role
  const getDefaultPermissionsForRole = (role: string) => {
    const allPermissions = {
      view_dashboard: false,
      view_statistics: false,
      view_activity_log: false,
      view_quotations: false,
      create_quotations: false,
      edit_quotations: false,
      delete_quotations: false,
      import_quotations: false,
      export_quotations: false,
      view_items: false,
      create_items: false,
      edit_items: false,
      delete_items: false,
      import_items: false,
      export_items: false,
      ai_duplicate_detection: false,
      view_clients: false,
      create_clients: false,
      edit_clients: false,
      delete_clients: false,
      view_suppliers: false,
      create_suppliers: false,
      edit_suppliers: false,
      delete_suppliers: false,
      view_purchase_orders: false,
      create_purchase_orders: false,
      edit_purchase_orders: false,
      delete_purchase_orders: false,
      import_purchase_orders: false,
      export_purchase_orders: false,
      view_supplier_pricing: false,
      create_supplier_pricing: false,
      edit_supplier_pricing: false,
      delete_supplier_pricing: false,
      view_customer_pricing: false,
      create_customer_pricing: false,
      edit_customer_pricing: false,
      delete_customer_pricing: false,
      view_reports: false,
      export_reports: false,
      view_users: false,
      create_users: false,
      edit_users: false,
      delete_users: false,
      reset_user_passwords: false,
      access_system_settings: false,
      database_backup: false,
      database_restore: false
    };

    switch (role) {
      case "manager":
        // Manager has all permissions
        Object.keys(allPermissions).forEach(key => {
          allPermissions[key as keyof typeof allPermissions] = true;
        });
        break;
        
      case "it_admin":
        // IT Admin has technical and user management permissions
        allPermissions.view_dashboard = true;
        allPermissions.view_statistics = true;
        allPermissions.view_activity_log = true;
        allPermissions.view_quotations = true;
        allPermissions.view_items = true;
        allPermissions.view_clients = true;
        allPermissions.view_suppliers = true;
        allPermissions.view_purchase_orders = true;
        allPermissions.view_supplier_pricing = true;
        allPermissions.view_customer_pricing = true;
        allPermissions.view_reports = true;
        allPermissions.export_reports = true;
        allPermissions.view_users = true;
        allPermissions.create_users = true;
        allPermissions.edit_users = true;
        allPermissions.delete_users = true;
        allPermissions.reset_user_passwords = true;
        allPermissions.access_system_settings = true;
        allPermissions.database_backup = true;
        allPermissions.database_restore = true;
        allPermissions.import_quotations = true;
        allPermissions.import_items = true;
        allPermissions.import_purchase_orders = true;
        break;
        
      case "data_entry":
        // Data entry has limited permissions for managing data
        allPermissions.view_dashboard = true;
        allPermissions.view_quotations = true;
        allPermissions.create_quotations = true;
        allPermissions.edit_quotations = true;
        allPermissions.view_items = true;
        allPermissions.create_items = true;
        allPermissions.edit_items = true;
        allPermissions.ai_duplicate_detection = true;
        allPermissions.view_clients = true;
        allPermissions.create_clients = true;
        allPermissions.edit_clients = true;
        allPermissions.view_suppliers = true;
        allPermissions.create_suppliers = true;
        allPermissions.edit_suppliers = true;
        allPermissions.view_reports = true;
        break;
        
      case "purchasing":
        // Purchasing staff has order-related permissions
        allPermissions.view_dashboard = true;
        allPermissions.view_quotations = true;
        allPermissions.view_items = true;
        allPermissions.view_clients = true;
        allPermissions.view_suppliers = true;
        allPermissions.view_purchase_orders = true;
        allPermissions.create_purchase_orders = true;
        allPermissions.edit_purchase_orders = true;
        allPermissions.view_reports = true;
        break;
        
      case "accounting":
        // Accounting has read-only access to financial data
        allPermissions.view_dashboard = true;
        allPermissions.view_statistics = true;
        allPermissions.view_quotations = true;
        allPermissions.view_items = true;
        allPermissions.view_clients = true;
        allPermissions.view_suppliers = true;
        allPermissions.view_purchase_orders = true;
        allPermissions.view_supplier_pricing = true;
        allPermissions.view_customer_pricing = true;
        allPermissions.view_reports = true;
        allPermissions.export_reports = true;
        break;
        
      default:
        // Default: no permissions
        break;
    }

    return allPermissions;
  };

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      console.log("Login attempt:", { username, password: password ? "***" : "missing" });
      
      const user = await storage.getUserByUsername(username);
      console.log("User lookup result:", user ? { id: user.id, username: user.username, isActive: user.isActive, passwordLength: user.password?.length } : "not found");
      
      if (!user || !user.isActive) {
        await logActivity(req, "login_failed", "user", undefined, `Failed login attempt for username: ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password comparison result:", isValidPassword);
      
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
    } catch (error: any) {
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
    } catch (error: any) {
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

    } catch (error: any) {
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

    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "خطأ في تغيير كلمة المرور" });
    }
  });

  // User management routes  
  app.get("/api/users", requireAuth, requirePermission("view_users"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", requireAuth, requirePermission("create_users"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser(validatedData);
      await logActivity(req, "create_user", "user", user.id, `Created user: ${user.username}`);

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user (all fields including block/unblock)
  app.patch("/api/users/:userId", requireAuth, requirePermission("edit_users"), async (req: Request, res: Response) => {
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

      await logActivity(req, "update_user", "user", userId, `Updated user: ${updatedUser.username}`);
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
