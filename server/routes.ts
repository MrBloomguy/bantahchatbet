import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEventSchema, insertChallengeSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication Routes
  app.post("/api/auth/request-verification", async (req, res) => {
    try {
      const { phoneNumber, email } = req.body;
      
      if (!phoneNumber && !email) {
        return res.status(400).json({ success: false, message: "Phone number or email required" });
      }

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In a real implementation, you would:
      // 1. Store the code in database with expiration
      // 2. Send SMS or email with the code
      // For now, return the code for testing
      
      res.json({ 
        success: true, 
        message: "Verification code sent",
        // Remove this in production - only for testing
        code: code 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { phoneNumber, email, code, name, avatarUrl } = req.body;
      
      if (!code || (!phoneNumber && !email)) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // In a real implementation, verify the code from database
      // For now, accept any 6-digit code for testing
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ success: false, message: "Invalid verification code" });
      }

      // Check if user exists
      let user;
      if (phoneNumber) {
        user = await storage.getUserByPhone(phoneNumber);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      }

      if (!user) {
        // Create new user
        const userData = {
          name: name || null,
          phone: phoneNumber || null,
          email: email || null,
          avatarUrl: avatarUrl || null,
          status: "active"
        };
        
        user = await storage.createUser(userData);
      }

      res.json({ 
        success: true, 
        user: user,
        message: "Authentication successful" 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // User Routes
  app.get("/api/users/profile/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.put("/api/users/profile/:id", async (req, res) => {
    try {
      const updateData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updateData);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      res.json({ success: true, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Event Routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json({ success: true, events });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      res.json({ success: true, event });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json({ success: true, event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const updateData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, updateData);
      
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      
      res.json({ success: true, event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      res.json({ success: true, message: "Event deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Challenge Routes
  app.get("/api/challenges", async (req, res) => {
    try {
      const challenges = await storage.getChallenges();
      res.json({ success: true, challenges });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) {
        return res.status(404).json({ success: false, message: "Challenge not found" });
      }
      res.json({ success: true, challenge });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/challenges", async (req, res) => {
    try {
      const challenges = await storage.getUserChallenges(req.params.userId);
      res.json({ success: true, challenges });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/challenges", async (req, res) => {
    try {
      const challengeData = insertChallengeSchema.parse(req.body);
      const challenge = await storage.createChallenge(challengeData);
      res.json({ success: true, challenge });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.put("/api/challenges/:id", async (req, res) => {
    try {
      const updateData = insertChallengeSchema.partial().parse(req.body);
      const challenge = await storage.updateChallenge(req.params.id, updateData);
      
      if (!challenge) {
        return res.status(404).json({ success: false, message: "Challenge not found" });
      }
      
      res.json({ success: true, challenge });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Wallet Routes
  app.get("/api/users/:userId/wallet", async (req, res) => {
    try {
      const wallet = await storage.getUserWallet(req.params.userId);
      if (!wallet) {
        return res.status(404).json({ success: false, message: "Wallet not found" });
      }
      res.json({ success: true, wallet });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.put("/api/users/:userId/wallet/balance", async (req, res) => {
    try {
      const { realBalance, bonusBalance } = req.body;
      const wallet = await storage.updateWalletBalance(req.params.userId, realBalance, bonusBalance);
      
      if (!wallet) {
        return res.status(404).json({ success: false, message: "Wallet not found" });
      }
      
      res.json({ success: true, wallet });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Notification Routes
  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.params.userId);
      res.json({ success: true, notifications });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json({ success: true, notification });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      res.json({ success: true, notification });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Chat Routes
  app.get("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(req.params.chatId, limit);
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/chat/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getEventChatMessages(req.params.eventId, limit);
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "API is healthy" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
