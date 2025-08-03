import { Request, Response, NextFunction } from "express";
import { DatabaseStorage } from "../storage";

const storage = new DatabaseStorage();

// Middleware to track user activity and update online status
export const trackUserActivity = async (req: Request, res: Response, next: NextFunction) => {
  // Only track activity for authenticated users
  if (req.session?.user?.id) {
    try {
      // Update user's last activity timestamp
      await storage.updateUserOnlineStatus(req.session.user.id, true);
    } catch (error) {
      // Log error but don't block the request
      console.error("Error updating user activity:", error);
    }
  }
  
  next();
};

// Background task to mark inactive users as offline
export const startInactiveUserCleanup = () => {
  // Mark users as offline if they haven't been active for more than 15 minutes
  const INACTIVE_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  setInterval(async () => {
    try {
      const users = await storage.getAllUsers();
      const now = new Date();
      
      for (const user of users) {
        if (user.isOnline && user.lastActivityAt) {
          const timeSinceLastActivity = now.getTime() - user.lastActivityAt.getTime();
          
          if (timeSinceLastActivity > INACTIVE_THRESHOLD) {
            await storage.updateUserOnlineStatus(user.id, false);
            console.log(`Marked user ${user.username} as offline due to inactivity`);
          }
        }
      }
    } catch (error) {
      console.error("Error in inactive user cleanup:", error);
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
};