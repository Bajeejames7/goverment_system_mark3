import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, requireAdmin, AuthenticatedRequest } from "./auth";
import { insertUserSchema, insertFolderSchema, insertLetterSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { files } from "@shared/schema";
import fs from "fs";
import { db } from "./db";



// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF and Word documents
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Store user in our database
      const user = await storage.createUser({
        ...userData,
        createdBy: req.user.id,
      });

      // Log the action
      await storage.createAuditLog({
        action: "create_user",
        entityType: "user",
        entityId: user.id.toString(),
        userId: req.user.id.toString(),
        details: { userEmail: user.email, userRole: user.role },
      });

      res.json({ success: true, user: { ...user, password: undefined } });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create user" });
    }
  });

  // User routes
  app.get("/api/users", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Users can only see their own profile unless they're admin
      // (Assume req.user.roles is an array)
      if (!req.user?.roles?.includes('admin') && user.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Folder routes
  app.get("/api/folders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const folders = await storage.getAllFolders();
      
      // Add letter count for each folder
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          const letters = await storage.getLettersByFolder(folder.id);
          return { ...folder, letterCount: letters.length };
        })
      );
      
      res.json(foldersWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: missing user id" });
      }
      const folderData = insertFolderSchema.parse(req.body);
      // Always set createdBy to the logged-in user (integer)
      const folder = await storage.createFolder({
        ...folderData,
        createdBy: req.user.id, // integer, not string
      });
      await storage.createAuditLog({
        action: "create_folder",
        entityType: "folder",
        entityId: folder.id.toString(),
        userId: req.user.id.toString(),
        details: { folderName: folder.name, department: folder.department },
      });
      res.json(folder);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create folder" });
    }
  });

  // Letter routes
  app.get("/api/letters", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { folderId, status, date } = req.query;
      let letters = await storage.getAllLetters();

      // Apply filters
      if (folderId && folderId !== 'all') {
        letters = letters.filter(letter => letter.folderId === parseInt(folderId as string));
      }
      
      if (status && status !== 'all') {
        letters = letters.filter(letter => letter.status === status);
      }
      
      if (date) {
        const filterDate = new Date(date as string);
        letters = letters.filter(letter => 
          letter.uploadedAt && new Date(letter.uploadedAt).toDateString() === filterDate.toDateString()
        );
      }

      // Add folder info to each letter
      const lettersWithFolders = await Promise.all(
        letters.map(async (letter) => {
          const folder = letter.folderId ? await storage.getFolder(letter.folderId) : null;
          return { ...letter, folder };
        })
      );

      res.json(lettersWithFolders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch letters" });
    }
  });

  app.get("/api/letters/recent", authenticateToken, async (req, res) => {
    try {
      const letters = await storage.getRecentLetters(10);
      res.json(letters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent letters" });
    }
  });

  app.post("/api/letters/upload", authenticateToken, upload.single("file"), async (req: AuthenticatedRequest, res) => {
    try {
      console.log("DEBUG upload", req.body, req.user, req.file);
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      // Parse and coerce types from req.body (all fields are strings from multer)
      const folderId = parseInt(req.body.folderId);
      const letterData = insertLetterSchema.parse({
        ...req.body,
        folderId,
        uploadedBy: req.user?.id, // Should be set by auth middleware
      });
      // Save file metadata in files table
      const fileRecord = await db.insert(files).values({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user?.id,
        isActive: true,
        metadata: {},
        folderId: letterData.folderId, // ADDED: associate file with folder
      }).returning();
      const fileId = fileRecord[0]?.id;
      if (!fileId) {
        return res.status(500).json({ message: "Failed to save file metadata" });
      }
      // Create letter referencing fileId
      const letter = await storage.createLetter({
        ...letterData,
        uploadedBy: req.user?.id,
        fileId,
      });
      await storage.createAuditLog({
        action: "upload_letter",
        entityType: "letter",
        entityId: letter.id.toString(),
        userId: req.user?.id?.toString(),
        details: { letterTitle: letter.title, reference: letter.reference },
      });
      res.json({ success: true, letter });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to upload letter" });
    }
  });

  app.patch("/api/letters/:id/verify", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;

      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const letter = await storage.updateLetter(id, {
        status,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
      });

      if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
      }

      await storage.createAuditLog({
        action: "verify_letter",
        entityType: "letter",
        entityId: letter.id.toString(),
        userId: req.user.id.toString(),
        details: { status, notes, letterTitle: letter.title },
      });

      res.json(letter);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify letter" });
    }
  });

  // Stats route
  app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Audit logs route
  app.get("/api/audit-logs/recent", authenticateToken, async (req, res) => {
    try {
      const logs = await storage.getRecentAuditLogs(20);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
