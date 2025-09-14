import type { Express, Request, Response } from "express";
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
import { eq } from "drizzle-orm";

// Enhanced error handling helper
const handleAsyncError = (fn: Function) => {
  return (req: Request | AuthenticatedRequest, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Enhanced error response helper
const sendErrorResponse = (res: Response, error: any, defaultMessage = "Internal server error") => {
  console.error('Route error:', error);
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({ 
      message: "Validation failed", 
      errors: formattedErrors 
    });
  }
  
  // Handle specific database errors
  if (error.message?.includes('duplicate key')) {
    return res.status(409).json({ message: "Resource already exists" });
  }
  
  if (error.message?.includes('not found')) {
    return res.status(404).json({ message: "Resource not found" });
  }
  
  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production' ? defaultMessage : error.message;
  res.status(statusCode).json({ message });
};

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
  // Add performance headers
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    next();
  });

  // Auth routes
  app.post("/api/auth/register", handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Debug: log headers and req.user
      console.log('REGISTER HEADERS:', req.headers);
      console.log('REGISTER REQ.USER:', req.user);
      const userData = insertUserSchema.parse(req.body);

      // Store user in our database
      // Allow unauthenticated creation: createdBy and userId are optional
      const createdBy = req.user?.id || null;
      const user = await storage.createUser({
        ...userData,
        createdBy,
      });

      // Log the action if possible
      if (createdBy) {
        await storage.createAuditLog({
          action: "create_user",
          entityType: "user",
          entityId: user.id.toString(),
          userId: createdBy.toString(),
          details: { userEmail: user.email, userDepartment: user.department },
        });
      }

      res.json({ success: true, user: { ...user, password: undefined } });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to create user");
    }
  }));

  // Admin-protected user creation endpoint
  app.post("/api/users", authenticateToken, requireAdmin, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Admin creates user with proper tracking
      const user = await storage.createUser({
        ...userData,
        createdBy: req.user!.id,
      });

      // Log the admin action
      await storage.createAuditLog({
        action: "create_user",
        entityType: "user",
        entityId: user.id.toString(),
        userId: req.user!.id.toString(),
        details: { 
          userEmail: user.email, 
          userDepartment: user.department,
          createdByAdmin: req.user!.email 
        },
      });

      res.json({ success: true, user: { ...user, password: undefined } });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to create user");
    }
  }));

  // User routes
  app.get("/api/users", authenticateToken, requireAdmin, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      sendErrorResponse(res, error, "Failed to fetch users");
    }
  }));

  // User statistics endpoint
  app.get("/api/users/stats", authenticateToken, requireAdmin, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      sendErrorResponse(res, error, "Failed to fetch user statistics");
    }
  }));

  app.get("/api/users/:id", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Users can only see their own profile unless they're admin
      if (!req.user?.roles?.includes('admin') && user.createdBy !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to fetch user");
    }
  }));

  // Folder routes
  app.get("/api/folders", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('📁 FOLDERS API: Starting request...');
      
      // Add cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Pragma': 'cache',
        'Expires': new Date(Date.now() + 300000).toUTCString()
      });
      
      const folders = await storage.getAllFolders();
      console.log(`📁 Found ${folders.length} folders`);
      
      // Add letter count for each folder
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          try {
            const letters = await storage.getLettersByFolder(folder.id);
            const letterCount = Array.isArray(letters) ? letters.length : 0;
            return { ...folder, letterCount };
          } catch (letterError) {
            console.warn(`Error getting letters for folder ${folder.id}:`, letterError);
            return { ...folder, letterCount: 0 };
          }
        })
      );
      
      // Debug: Get all letters to see what folder IDs they reference
      const allLetters = await storage.getAllLetters();
      console.log(`📧 Found ${allLetters ? allLetters.length : 0} total letters`);
      
      if (allLetters && allLetters.length > 0) {
        const folderIds = [...new Set(allLetters.map(l => l.folderId).filter(Boolean))];
        console.log(`📁 Unique folder IDs referenced:`, folderIds);
      }

      res.json(foldersWithCounts);
    } catch (error) {
      sendErrorResponse(res, error, "Failed to fetch folders");
    }
  }));

  app.post("/api/folders", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);

      const folder = await storage.createFolder({
        ...folderData,
        createdBy: req.user!.id,
      });

      await storage.createAuditLog({
        action: "create_folder",
        entityType: "folder",
        entityId: folder.id.toString(),
        userId: req.user!.id.toString(),
        details: { folderName: folder.name },
      });

      res.json({ success: true, folder });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to create folder");
    }
  }));

  app.get("/api/folders/:id", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const folder = await storage.getFolder(id);

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      res.json(folder);
    } catch (error) {
      sendErrorResponse(res, error, "Failed to fetch folder");
    }
  }));

  app.put("/api/folders/:id", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const folderData = insertFolderSchema.parse(req.body);

      const folder = await storage.updateFolder(id, folderData);

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      await storage.createAuditLog({
        action: "update_folder",
        entityType: "folder",
        entityId: folder.id.toString(),
        userId: req.user!.id.toString(),
        details: { folderName: folder.name },
      });

      res.json({ success: true, folder });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to update folder");
    }
  }));

  app.delete("/api/folders/:id", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const folder = await storage.deleteFolder(id);

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      await storage.createAuditLog({
        action: "delete_folder",
        entityType: "folder",
        entityId: folder.id.toString(),
        userId: req.user!.id.toString(),
        details: { folderName: folder.name },
      });

      res.json({ success: true });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to delete folder");
    }
  }));

  // Letter routes
  app.get("/api/letters", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Remove cache headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      // Get query parameters
      const { folderId, date } = req.query;
      
      console.log('API /api/letters called with params:', { folderId, date });
      console.log('Type of folderId:', typeof folderId);
      console.log('Value of folderId:', folderId);
      
      // Fetch letters based on filters
      let letters: any[] = [];
      if (folderId) {
        // If folderId is provided, fetch only letters in that folder
        const folderIdNum = parseInt(folderId as string);
        console.log('Parsed folderIdNum:', folderIdNum);
        console.log('IsNaN check:', isNaN(folderIdNum));
        if (!isNaN(folderIdNum)) {
          letters = await storage.getLettersByFolder(folderIdNum);
          console.log(`Found ${letters.length} letters for folder ${folderIdNum}`);
        } else {
          console.log('Invalid folderId, returning empty array');
          letters = []; // Invalid folderId, return empty array
        }
      } else {
        console.log('No folderId provided, fetching all letters');
        // If no folderId provided, fetch all letters
        letters = await storage.getAllLetters();
        console.log(`Found ${letters.length} total letters`);
      }
      
      // Apply date filter if provided
      if (date && Array.isArray(letters)) {
        const targetDate = new Date(date as string);
        targetDate.setHours(0, 0, 0, 0); // Set to start of day
        
        letters = letters.filter(letter => {
          const letterDate = new Date(letter.uploadedAt);
          letterDate.setHours(0, 0, 0, 0); // Set to start of day
          return letterDate.getTime() === targetDate.getTime();
        });
      }

      // Add folder and file info to each letter
      const lettersWithFoldersAndFiles = await Promise.all(
        letters.map(async (letter) => {
          try {
            const folder = letter.folderId ? await storage.getFolder(letter.folderId) : null;
            let file = null;
            if (letter.fileId) {
              file = await db.query.files.findFirst({ where: eq(files.id, letter.fileId) });
            }
            return {
              ...letter,
              folder,
              fileName: file?.filename || null,
              originalFileName: file?.originalName || null,
              fileUrl: file?.filename ? `/uploads/${file.filename}` : null, // Revert to simple format
            };
          } catch (letterError) {
            console.warn('Error processing letter:', letter.id, letterError);
            return {
              ...letter,
              folder: null,
              fileName: null,
              originalFileName: null,
              fileUrl: null,
            };
          }
        })
      );

      res.json(lettersWithFoldersAndFiles);
    } catch (error) {
      sendErrorResponse(res, error, "Failed to fetch letters");
    }
  }));

  app.post("/api/letters", authenticateToken, upload.single("file"), handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const letterData = insertLetterSchema.parse(req.body);

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create file entry in the files table
      const [fileRecord] = await db.insert(files).values({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user!.id,
      }).returning();

      const letter = await storage.createLetter({
        ...letterData,
        createdBy: req.user!.id,
        fileId: fileRecord.id, // Link the letter to the file
      });

      await storage.createAuditLog({
        action: "create_letter",
        entityType: "letter",
        entityId: letter.id.toString(),
        userId: req.user!.id.toString(),
        details: { letterTitle: letter.title },
      });

      res.json({ success: true, letter });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to create letter");
    }
  }));

  app.get("/api/letters/:id", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid letter ID" });
      }

      const letter = await storage.getLetter(id);

      if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
      }

      res.json(letter);
    } catch (error) {
      sendErrorResponse(res, error, "Failed to fetch letter");
    }
  }));

  app.put("/api/letters/:id", authenticateToken, upload.single("file"), handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid letter ID" });
      }

      const letterData = insertLetterSchema.parse(req.body);

      // If a new file is uploaded, create a new file entry
      let fileId = undefined;
      if (req.file) {
        const [fileRecord] = await db.insert(files).values({
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          uploadedBy: req.user!.id,
        }).returning();
        fileId = fileRecord.id;
      }

      const letter = await storage.updateLetter(id, {
        ...letterData,
        ...(fileId !== undefined && { fileId }), // Only update fileId if a new file was uploaded
      });

      if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
      }

      await storage.createAuditLog({
        action: "update_letter",
        entityType: "letter",
        entityId: letter.id.toString(),
        userId: req.user!.id.toString(),
        details: { letterTitle: letter.title },
      });

      res.json({ success: true, letter });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to update letter");
    }
  }));

  app.delete("/api/letters/:id", authenticateToken, handleAsyncError(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid letter ID" });
      }

      const letter = await storage.deleteLetter(id);

      if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
      }

      await storage.createAuditLog({
        action: "delete_letter",
        entityType: "letter",
        entityId: letter.id.toString(),
        userId: req.user!.id.toString(),
        details: { letterTitle: letter.title },
      });

      res.json({ success: true });
    } catch (error) {
      sendErrorResponse(res, error, "Failed to delete letter");
    }
  }));

  return createServer(app);
}