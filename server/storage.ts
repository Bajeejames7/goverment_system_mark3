import { db } from "./db";
import { users, folders, letters, auditLogs, roles, userRoles } from "../shared/schema";
import { eq, desc, count, and } from "drizzle-orm";
import type { User, InsertUser, Folder, InsertFolder, Letter, InsertLetter, AuditLog, InsertAuditLog, RoutingRule, InsertRoutingRule, DocumentRouting, InsertDocumentRouting } from "../shared/schema";

// Extended user type with roles
export interface UserWithRoles extends Omit<User, 'password'> {
  roles: string[];
}

// Custom error classes for better error handling
export class StorageError extends Error {
  constructor(message: string, public code: string, public originalError?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends StorageError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with ID ${id} not found`, 'NOT_FOUND');
  }
}

export class DuplicateError extends StorageError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, 'DUPLICATE');
  }
}

// Helper function to handle database errors
const handleDbError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, error);
  
  if (error.code === '23505') { // PostgreSQL unique violation
    throw new DuplicateError('Resource', 'field', 'value');
  }
  
  if (error.code === '23503') { // PostgreSQL foreign key violation
    throw new StorageError('Referenced resource not found', 'FOREIGN_KEY_VIOLATION', error);
  }
  
  throw new StorageError(`Database operation failed: ${operation}`, 'DB_ERROR', error);
};

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<UserWithRoles[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  getFoldersByDepartment(department: string): Promise<Folder[]>;
  getAllFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<Folder | undefined>;
  getLetter(id: number): Promise<Letter | undefined>;
  getLetterByReference(reference: string): Promise<Letter | undefined>;
  getLettersByFolder(folderId: number): Promise<Letter[]>;
  getLettersByStatus(status: string): Promise<Letter[]>;
  getAllLetters(): Promise<Letter[]>;
  getRecentLetters(limit: number): Promise<Letter[]>;
  createLetter(letter: InsertLetter): Promise<Letter>;
  updateLetter(id: number, letter: Partial<Letter>): Promise<Letter | undefined>;
  deleteLetter(id: number): Promise<Letter | undefined>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getRecentAuditLogs(limit: number): Promise<AuditLog[]>;
  getRoutingRule(id: number): Promise<RoutingRule | undefined>;
  getRoutingRulesByDepartment(department: string): Promise<RoutingRule[]>;
  getAllRoutingRules(): Promise<RoutingRule[]>;
  createRoutingRule(rule: InsertRoutingRule): Promise<RoutingRule | undefined>;
  updateRoutingRule(id: number, rule: Partial<RoutingRule>): Promise<RoutingRule | undefined>;
  getDocumentRouting(id: number): Promise<DocumentRouting | undefined>;
  getDocumentRoutingByLetter(letterId: number): Promise<DocumentRouting[]>;
  getAllDocumentRoutings(): Promise<DocumentRouting[]>;
  createDocumentRouting(routing: InsertDocumentRouting): Promise<DocumentRouting | undefined>;
  updateDocumentRouting(id: number, routing: Partial<DocumentRouting>): Promise<DocumentRouting | undefined>;
  evaluateRoutingRules(letter: Letter, userDepartment: string): Promise<RoutingRule[]>;
  routeDocument(letterId: number, userId: string): Promise<DocumentRouting[]>;
  getStats(): Promise<{ totalFolders: number; activeLetters: number; pendingVerification: number; activeUsers: number }>;
  getUserStats(): Promise<{ totalUsers: number; adminUsers: number; registryUsers: number; officerUsers: number; }>;
}

export const storage: IStorage = {
  // Users
  async getUser(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid user ID provided', 'INVALID_ID');
      }
      return await db.query.users.findFirst({ where: eq(users.id, id) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getUser');
    }
  },
  
  async getUserByFirebaseUid(firebaseUid: string) {
    try {
      if (!firebaseUid?.trim()) {
        throw new StorageError('Invalid Firebase UID provided', 'INVALID_FIREBASE_UID');
      }
      return await db.query.users.findFirst({ where: eq(users.createdBy, firebaseUid) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getUserByFirebaseUid');
    }
  },
  
  async getUserByEmail(email: string) {
    try {
      if (!email?.trim() || !email.includes('@')) {
        throw new StorageError('Invalid email provided', 'INVALID_EMAIL');
      }
      return await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getUserByEmail');
    }
  },
  
  async createUser(user: InsertUser) {
    try {
      if (!user.email || !user.name) {
        throw new StorageError('Email and name are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      // Check for existing user
      const existing = await this.getUserByEmail(user.email);
      if (existing) {
        throw new DuplicateError('User', 'email', user.email);
      }
      
      const [newUser] = await db.insert(users).values({
        ...user,
        email: user.email.toLowerCase(),
      }).returning();
      return newUser;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'createUser');
      throw error; // This will never be reached due to handleDbError throwing
    }
  },
  
  async updateUser(id: number, user: Partial<User>) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid user ID provided', 'INVALID_ID');
      }
      
      const [updated] = await db.update(users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
        
      if (!updated) {
        throw new NotFoundError('User', id);
      }
      
      return updated;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'updateUser');
    }
  },
  
  async deleteUser(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid user ID provided', 'INVALID_ID');
      }

      // First delete user roles
      await db.delete(userRoles).where(eq(userRoles.userId, id));

      // Then delete the user itself
      const [deleted] = await db.update(users)
        .set({ isActive: false })
        .where(eq(users.id, id))
        .returning();

      if (!deleted) {
        throw new NotFoundError('User', id);
      }

      return deleted;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      if (error instanceof NotFoundError) throw error;
      handleDbError(error, 'deleteUser');
    }
  },

  async getAllUsers() {
    try {
      // Get all active users with their roles
      const usersWithRoles = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          department: users.department,
          position: users.position,
          level: users.level,
          canAssignLetters: users.canAssignLetters,
          isActive: users.isActive,
          emailVerified: users.emailVerified,
          emailVerificationToken: users.emailVerificationToken,
          emailVerificationExpires: users.emailVerificationExpires,
          resetPasswordToken: users.resetPasswordToken,
          resetPasswordExpires: users.resetPasswordExpires,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          createdBy: users.createdBy,
          roleName: roles.name,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(users.isActive, true))
        .orderBy(users.createdAt);

      // Group users by ID and collect their roles
      const userMap = new Map();
      
      usersWithRoles.forEach(row => {
        const userId = row.id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: row.id,
            email: row.email,
            name: row.name,
            department: row.department,
            position: row.position,
            level: row.level,
            canAssignLetters: row.canAssignLetters,
            isActive: row.isActive,
            emailVerified: row.emailVerified,
            emailVerificationToken: row.emailVerificationToken,
            emailVerificationExpires: row.emailVerificationExpires,
            resetPasswordToken: row.resetPasswordToken,
            resetPasswordExpires: row.resetPasswordExpires,
            lastLoginAt: row.lastLoginAt,
            createdAt: row.createdAt,
            createdBy: row.createdBy,
            roles: [],
          });
        }
        
        if (row.roleName) {
          userMap.get(userId).roles.push(row.roleName);
        }
      });

      return Array.from(userMap.values());
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      handleDbError(error, 'getAllUsers');
      return [];
    }
  },

  // Folders
  async getFolder(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid folder ID provided', 'INVALID_ID');
      }
      return await db.query.folders.findFirst({ where: eq(folders.id, id) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getFolder');
    }
  },
  
  async getFoldersByDepartment(department: string) {
    try {
      if (!department?.trim()) {
        throw new StorageError('Department is required', 'MISSING_DEPARTMENT');
      }
      return await db.query.folders.findMany({ 
        where: and(eq(folders.department, department), eq(folders.isActive, true)) 
      }) || [];
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getFoldersByDepartment');
      return [];
    }
  },
  
  async getAllFolders() {
    try {
      return await db.select().from(folders).where(eq(folders.isActive, true)) || [];
    } catch (error) {
      handleDbError(error, 'getAllFolders');
      return [];
    }
  },
  
  async createFolder(folder: InsertFolder) {
    try {
      if (!folder.name?.trim() || !folder.department?.trim()) {
        throw new StorageError('Name and department are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      const [newFolder] = await db.insert(folders).values(folder).returning();
      return newFolder;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'createFolder');
      throw error;
    }
  },
  
  async updateFolder(id: number, folder: Partial<Folder>) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid folder ID provided', 'INVALID_ID');
      }
      
      const [updated] = await db.update(folders)
        .set(folder)
        .where(eq(folders.id, id))
        .returning();
        
      if (!updated) {
        throw new NotFoundError('Folder', id);
      }
      
      return updated;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'updateFolder');
    }
  },

  async deleteFolder(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid folder ID provided', 'INVALID_ID');
      }
      
      // First, we need to handle letters in this folder
      // We'll set their folderId to null rather than deleting them
      await db.update(letters)
        .set({ folderId: null })
        .where(eq(letters.folderId, id));
      
      // Then delete the folder itself
      const [deleted] = await db.update(folders)
        .set({ isActive: false })
        .where(eq(folders.id, id))
        .returning();
        
      if (!deleted) {
        throw new NotFoundError('Folder', id);
      }
      
      return deleted;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'deleteFolder');
    }
  },

  // Letters
  async getLetter(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid letter ID provided', 'INVALID_ID');
      }
      return await db.query.letters.findFirst({ where: eq(letters.id, id) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getLetter');
    }
  },
  
  async getLetterByReference(reference: string) {
    try {
      if (!reference?.trim()) {
        throw new StorageError('Reference is required', 'MISSING_REFERENCE');
      }
      return await db.query.letters.findFirst({ where: eq(letters.reference, reference) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getLetterByReference');
    }
  },
  
  async getLettersByFolder(folderId: number) {
    try {
      if (!folderId || folderId <= 0) {
        throw new StorageError('Invalid folder ID provided', 'INVALID_ID');
      }
      
      console.log(`Getting letters for folder ID: ${folderId}`);
      const result = await db.query.letters.findMany({ 
        where: eq(letters.folderId, folderId),
        orderBy: [desc(letters.uploadedAt)]
      });
      
      const letterArray = result || [];
      console.log(`Found ${letterArray.length} letters for folder ${folderId}`);
      return letterArray;
    } catch (error) {
      if (error instanceof StorageError) {
        console.error('Storage error in getLettersByFolder:', error.message);
        throw error;
      }
      console.error('Database error in getLettersByFolder:', error);
      handleDbError(error, 'getLettersByFolder');
      return [];
    }
  },
  
  async getLettersByStatus(status: string) {
    try {
      if (!status?.trim()) {
        throw new StorageError('Status is required', 'MISSING_STATUS');
      }
      return await db.query.letters.findMany({ 
        where: eq(letters.status, status),
        orderBy: [desc(letters.uploadedAt)]
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getLettersByStatus');
    }
  },
  
  async getAllLetters() {
    try {
      // Add limit to prevent performance issues with large datasets
      return await db.select().from(letters).orderBy(desc(letters.uploadedAt)).limit(1000);
    } catch (error) {
      handleDbError(error, 'getAllLetters');
    }
  },
  
  async getRecentLetters(limit: number) {
    try {
      const validLimit = Math.min(Math.max(limit || 10, 1), 100); // Between 1 and 100
      return await db.select().from(letters)
        .orderBy(desc(letters.uploadedAt))
        .limit(validLimit);
    } catch (error) {
      handleDbError(error, 'getRecentLetters');
    }
  },
  
  async createLetter(letter: InsertLetter) {
    try {
      if (!letter.title?.trim() || !letter.reference?.trim()) {
        throw new StorageError('Title and reference are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      // Check for duplicate reference
      const existing = await this.getLetterByReference(letter.reference);
      if (existing) {
        throw new DuplicateError('Letter', 'reference', letter.reference);
      }
      
      const [newLetter] = await db.insert(letters).values(letter).returning();
      return newLetter;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'createLetter');
    }
  },
  
  async updateLetter(id: number, letter: Partial<Letter>) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid letter ID provided', 'INVALID_ID');
      }
      
      const [updated] = await db.update(letters)
        .set(letter)
        .where(eq(letters.id, id))
        .returning();
        
      if (!updated) {
        throw new NotFoundError('Letter', id);
      }
      
      return updated;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'updateLetter');
    }
  },

  async deleteLetter(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid letter ID provided', 'INVALID_ID');
      }
      
      // First, we need to handle files associated with this letter
      // We'll set their isActive to false rather than deleting them
      const letter = await db.query.letters.findFirst({ where: eq(letters.id, id) });
      if (letter && letter.fileId) {
        try {
          await db.update(files)
            .set({ isActive: false })
            .where(eq(files.id, letter.fileId));
        } catch (fileError) {
          console.warn('Warning: Failed to deactivate file associated with letter', fileError);
          // Continue with letter deletion even if file deactivation fails
        }
      }
      
      // Then delete the letter itself (hard delete since there's no isActive column)
      const [deleted] = await db.delete(letters)
        .where(eq(letters.id, id))
        .returning();
        
      if (!deleted) {
        throw new NotFoundError('Letter', id);
      }
      
      return deleted;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      if (error instanceof NotFoundError) throw error;
      handleDbError(error, 'deleteLetter');
    }
  },

  // Audit Logs
  async createAuditLog(log: InsertAuditLog) {
    try {
      if (!log.action?.trim() || !log.entityType?.trim() || !log.entityId?.trim()) {
        throw new StorageError('Action, entityType, and entityId are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      const [newLog] = await db.insert(auditLogs).values(log).returning();
      return newLog;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'createAuditLog');
    }
  },
  
  async getRecentAuditLogs(limit: number) {
    try {
      const validLimit = Math.min(Math.max(limit || 10, 1), 100); // Between 1 and 100
      return await db.select().from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(validLimit);
    } catch (error) {
      handleDbError(error, 'getRecentAuditLogs');
    }
  },

  // Routing Rules
  async getRoutingRule(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid routing rule ID provided', 'INVALID_ID');
      }
      return await db.query.routingRules.findFirst({ where: eq(routingRules.id, id) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getRoutingRule');
    }
  },
  
  async getRoutingRulesByDepartment(department: string) {
    try {
      if (!department?.trim()) {
        throw new StorageError('Department is required', 'MISSING_DEPARTMENT');
      }
      return await db.query.routingRules.findMany({ 
        where: and(eq(routingRules.department, department), eq(routingRules.isActive, true)) 
      }) || [];
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getRoutingRulesByDepartment');
      return [];
    }
  },
  
  async getAllRoutingRules() {
    try {
      return await db.select().from(routingRules).where(eq(routingRules.isActive, true)) || [];
    } catch (error) {
      handleDbError(error, 'getAllRoutingRules');
      return [];
    }
  },
  
  async createRoutingRule(rule: InsertRoutingRule) {
    try {
      if (!rule.department?.trim() || !rule.rule?.trim()) {
        throw new StorageError('Department and rule are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      const [newRule] = await db.insert(routingRules).values(rule).returning();
      return newRule;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'createRoutingRule');
      throw error;
    }
  },
  
  async updateRoutingRule(id: number, rule: Partial<RoutingRule>) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid routing rule ID provided', 'INVALID_ID');
      }
      
      const [updated] = await db.update(routingRules)
        .set(rule)
        .where(eq(routingRules.id, id))
        .returning();
        
      if (!updated) {
        throw new NotFoundError('RoutingRule', id);
      }
      
      return updated;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'updateRoutingRule');
    }
  },

  // Document Routing
  async getDocumentRouting(id: number) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid document routing ID provided', 'INVALID_ID');
      }
      return await db.query.documentRoutings.findFirst({ where: eq(documentRoutings.id, id) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getDocumentRouting');
    }
  },
  
  async getDocumentRoutingByLetter(letterId: number) {
    try {
      if (!letterId || letterId <= 0) {
        throw new StorageError('Invalid letter ID provided', 'INVALID_ID');
      }
      return await db.query.documentRoutings.findMany({ where: eq(documentRoutings.letterId, letterId) });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'getDocumentRoutingByLetter');
    }
  },
  
  async getAllDocumentRoutings() {
    try {
      return await db.select().from(documentRoutings) || [];
    } catch (error) {
      handleDbError(error, 'getAllDocumentRoutings');
      return [];
    }
  },
  
  async createDocumentRouting(routing: InsertDocumentRouting) {
    try {
      if (!routing.letterId || !routing.userId) {
        throw new StorageError('Letter ID and user ID are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      const [newRouting] = await db.insert(documentRoutings).values(routing).returning();
      return newRouting;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'createDocumentRouting');
      throw error;
    }
  },
  
  async updateDocumentRouting(id: number, routing: Partial<DocumentRouting>) {
    try {
      if (!id || id <= 0) {
        throw new StorageError('Invalid document routing ID provided', 'INVALID_ID');
      }
      
      const [updated] = await db.update(documentRoutings)
        .set(routing)
        .where(eq(documentRoutings.id, id))
        .returning();
        
      if (!updated) {
        throw new NotFoundError('DocumentRouting', id);
      }
      
      return updated;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'updateDocumentRouting');
    }
  },

  // Routing Logic
  async evaluateRoutingRules(letter: Letter, userDepartment: string) {
    try {
      if (!letter || !userDepartment?.trim()) {
        throw new StorageError('Letter and user department are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      const rules = await this.getAllRoutingRules();
      const applicableRules = rules.filter(rule => rule.department === userDepartment && rule.isActive);
      
      return applicableRules;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'evaluateRoutingRules');
    }
  },
  
  async routeDocument(letterId: number, userId: string) {
    try {
      if (!letterId || letterId <= 0 || !userId?.trim()) {
        throw new StorageError('Letter ID and user ID are required', 'MISSING_REQUIRED_FIELDS');
      }
      
      const [newRouting] = await db.insert(documentRoutings).values({ letterId, userId }).returning();
      return newRouting;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      handleDbError(error, 'routeDocument');
    }
  },

  // Stats
  async getStats() {
    try {
      const totalFolders = await db.select({ count: count() }).from(folders).where(eq(folders.isActive, true));
      const activeLetters = await db.select({ count: count() }).from(letters).where(eq(letters.status, 'active'));
      const pendingVerification = await db.select({ count: count() }).from(letters).where(eq(letters.status, 'pending_verification'));
      const activeUsers = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
      
      return {
        totalFolders: totalFolders[0]?.count || 0,
        activeLetters: activeLetters[0]?.count || 0,
        pendingVerification: pendingVerification[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
      };
    } catch (error) {
      handleDbError(error, 'getStats');
    }
  },
  
  async getUserStats() {
    try {
      const totalUsers = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
      const adminUsers = await db.select({ count: count() }).from(users).where(and(eq(users.isActive, true), eq(users.level, 'admin')));
      const registryUsers = await db.select({ count: count() }).from(users).where(and(eq(users.isActive, true), eq(users.level, 'registry')));
      const officerUsers = await db.select({ count: count() }).from(users).where(and(eq(users.isActive, true), eq(users.level, 'officer')));
      
      return {
        totalUsers: totalUsers[0]?.count || 0,
        adminUsers: adminUsers[0]?.count || 0,
        registryUsers: registryUsers[0]?.count || 0,
        officerUsers: officerUsers[0]?.count || 0,
      };
    } catch (error) {
      handleDbError(error, 'getUserStats');
    }
  },
}
