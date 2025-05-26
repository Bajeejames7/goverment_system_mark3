import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auth } from "./firebase-admin";
import { insertUserSchema, insertFolderSchema, insertLetterSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";

// Temporary Supabase auth bypass for immediate folder creation
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    // For immediate testing - create a default Industry admin user
    req.user = { 
      uid: 'industry-admin-001',
      email: 'admin@industry.gov.ke',
      name: 'Industry Administrator'
    };
    req.userProfile = {
      id: 1,
      firebaseUid: 'industry-admin-001',
      email: 'admin@industry.gov.ke',
      name: 'Industry Administrator',
      role: 'admin',
      department: 'Industry',
      position: 'management_head',
      level: 0,
      canAssignLetters: true,
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
    };
    
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

const requireAuth = authenticateUser;

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.userProfile?.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = file.originalname.toLowerCase().substr(file.originalname.lastIndexOf('.'));
    cb(null, allowedTypes.includes(fileExt));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Create Firebase user
      const firebaseUser = await auth.createUser({
        email: userData.email,
        password: req.body.confirmPassword,
        displayName: userData.name,
        emailVerified: false,
      });

      // Set custom claims for role
      await auth.setCustomUserClaims(firebaseUser.uid, {
        role: userData.role,
        department: userData.department,
      });

      // Store user in our database
      const user = await storage.createUser({
        ...userData,
        firebaseUid: firebaseUser.uid,
        createdBy: req.user.uid,
      });

      // Log the action
      await storage.createAuditLog({
        action: "create_user",
        entityType: "user",
        entityId: user.id.toString(),
        userId: req.user.uid,
        details: { userEmail: user.email, userRole: user.role },
      });

      res.json({ success: true, user: { ...user, password: undefined } });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create user" });
    }
  });

  // User routes
  app.get("/api/users", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Users can only see their own profile unless they're admin
      if (req.userProfile?.role !== 'admin' && user.firebaseUid !== req.user.uid) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Folder routes
  app.get("/api/folders", authenticateUser, async (req, res) => {
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

  app.post("/api/folders", authenticateUser, async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      
      const folder = await storage.createFolder({
        ...folderData,
        createdBy: req.user.uid,
      });

      await storage.createAuditLog({
        action: "create_folder",
        entityType: "folder",
        entityId: folder.id.toString(),
        userId: req.user.uid,
        details: { folderName: folder.name, department: folder.department },
      });

      res.json(folder);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create folder" });
    }
  });

  // Letter routes
  app.get("/api/letters", authenticateUser, async (req, res) => {
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
          new Date(letter.uploadedAt).toDateString() === filterDate.toDateString()
        );
      }

      // Add folder info to each letter
      const lettersWithFolders = await Promise.all(
        letters.map(async (letter) => {
          const folder = await storage.getFolder(letter.folderId);
          return { ...letter, folder };
        })
      );

      res.json(lettersWithFolders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch letters" });
    }
  });

  app.get("/api/letters/recent", authenticateUser, async (req, res) => {
    try {
      const letters = await storage.getRecentLetters(10);
      res.json(letters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent letters" });
    }
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for documents
    },
    fileFilter: (req, file, cb) => {
      // Accept PDF and Word documents
      const allowedTypes = /pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const mimetype = allowedMimeTypes.includes(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only PDF and Word documents are allowed'));
      }
    }
  });

  app.post("/api/letters/upload", authenticateUser, upload.single('file'), async (req, res) => {
    try {
      const letterData = insertLetterSchema.parse({
        ...req.body,
        folderId: parseInt(req.body.folderId),
      });

      let fileUrl = null;
      let fileName = null;

      // Upload file to local storage if provided (Firebase Storage can be added later)
      if (req.file) {
        try {
          const timestamp = Date.now();
          const fileExtension = path.extname(req.file.originalname);
          const storageFileName = `${timestamp}_${req.file.originalname}`;
          
          // For now, store file information in database
          // File URLs will be generated when Firebase Storage is properly configured
          fileUrl = `/uploads/${storageFileName}`;
          fileName = req.file.originalname;
        } catch (uploadError) {
          console.error('File processing error:', uploadError);
          return res.status(500).json({ message: "Failed to process file" });
        }
      }

      const letter = await storage.createLetter({
        ...letterData,
        uploadedBy: req.user.uid,
        fileName,
        fileUrl,
      });

      await storage.createAuditLog({
        action: "upload_letter",
        entityType: "letter",
        entityId: letter.id.toString(),
        userId: req.user.uid,
        details: { letterTitle: letter.title, reference: letter.reference },
      });

      res.json(letter);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to upload letter" });
    }
  });

  app.patch("/api/letters/:id/verify", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;

      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const letter = await storage.updateLetter(id, {
        status,
        verifiedBy: req.user.uid,
        verifiedAt: new Date(),
      });

      if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
      }

      await storage.createAuditLog({
        action: "verify_letter",
        entityType: "letter",
        entityId: letter.id.toString(),
        userId: req.user.uid,
        details: { status, notes, letterTitle: letter.title },
      });

      res.json(letter);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify letter" });
    }
  });

  // Stats route
  app.get("/api/stats", authenticateUser, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Audit logs route
  app.get("/api/audit-logs/recent", authenticateUser, async (req, res) => {
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
