import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./simple-storage";
import { insertUserSchema, insertFolderSchema, insertLetterSchema } from "@shared/schema";
import { z } from "zod";

export async function registerSimpleRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Simple login route for ICT administrator
  app.post("/api/simple-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check for ICT administrator credentials
      if (email === "jamesbajee3579@gmail.com" && password === "J@m3$b@j33") {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Create ICT admin user if not exists
          const newUser = await storage.createUser({
            firebaseUid: "ict-admin-001",
            email: "jamesbajee3579@gmail.com",
            name: "James Bajee",
            role: "ICT Administrator",
            department: "ICT",
            position: "System Administrator"
          });
          
          return res.json({ 
            success: true, 
            user: newUser,
            message: "ICT Administrator account created and logged in successfully"
          });
        }
        
        return res.json({ 
          success: true, 
          user,
          message: "Login successful"
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Get all folders
  app.get("/api/folders", async (req, res) => {
    try {
      const folders = await storage.getAllFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error getting folders:", error);
      res.status(500).json({ error: "Failed to get folders" });
    }
  });

  // Create new folder
  app.post("/api/folders", async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(folderData);
      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  // Get all letters
  app.get("/api/letters", async (req, res) => {
    try {
      const letters = await storage.getAllLetters();
      res.json(letters);
    } catch (error) {
      console.error("Error getting letters:", error);
      res.status(500).json({ error: "Failed to get letters" });
    }
  });

  // Create new letter
  app.post("/api/letters", async (req, res) => {
    try {
      const letterData = insertLetterSchema.parse(req.body);
      const letter = await storage.createLetter(letterData);
      res.json(letter);
    } catch (error) {
      console.error("Error creating letter:", error);
      res.status(500).json({ error: "Failed to create letter" });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get recent audit logs
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const logs = await storage.getRecentAuditLogs(50);
      res.json(logs);
    } catch (error) {
      console.error("Error getting audit logs:", error);
      res.status(500).json({ error: "Failed to get audit logs" });
    }
  });

  return server;
}