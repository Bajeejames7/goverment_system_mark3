import { db } from "./db";
import { users, folders, letters, auditLogs, User, InsertUser, Folder, InsertFolder, Letter, InsertLetter, AuditLog, InsertAuditLog } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface ISimpleStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Folders  
  getAllFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  
  // Letters
  getAllLetters(): Promise<Letter[]>;
  getRecentLetters(limit: number): Promise<Letter[]>;
  createLetter(letter: InsertLetter): Promise<Letter>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getRecentAuditLogs(limit: number): Promise<AuditLog[]>;
  
  // Stats
  getStats(): Promise<{
    totalFolders: number;
    activeLetters: number;
    pendingVerification: number;
    activeUsers: number;
  }>;
}

export class SimpleStorage implements ISimpleStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllFolders(): Promise<Folder[]> {
    try {
      return await db.select().from(folders);
    } catch (error) {
      console.error('Error getting all folders:', error);
      return [];
    }
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    try {
      const [folder] = await db.insert(folders).values(insertFolder).returning();
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async getAllLetters(): Promise<Letter[]> {
    try {
      return await db.select().from(letters).orderBy(desc(letters.uploadedAt));
    } catch (error) {
      console.error('Error getting all letters:', error);
      return [];
    }
  }

  async getRecentLetters(limit: number): Promise<Letter[]> {
    try {
      return await db.select().from(letters).orderBy(desc(letters.createdAt)).limit(limit);
    } catch (error) {
      console.error('Error getting recent letters:', error);
      return [];
    }
  }

  async createLetter(insertLetter: InsertLetter): Promise<Letter> {
    try {
      const [letter] = await db.insert(letters).values(insertLetter).returning();
      return letter;
    } catch (error) {
      console.error('Error creating letter:', error);
      throw error;
    }
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    try {
      const [log] = await db.insert(auditLogs).values(insertLog).returning();
      return log;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  async getRecentAuditLogs(limit: number): Promise<AuditLog[]> {
    try {
      return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
    } catch (error) {
      console.error('Error getting recent audit logs:', error);
      return [];
    }
  }

  async getStats(): Promise<{
    totalFolders: number;
    activeLetters: number;
    pendingVerification: number;
    activeUsers: number;
  }> {
    try {
      const [folderCount] = await db.select().from(folders);
      const [letterCount] = await db.select().from(letters);
      const [userCount] = await db.select().from(users);
      
      return {
        totalFolders: folderCount ? 1 : 0,
        activeLetters: letterCount ? 1 : 0,
        pendingVerification: 0,
        activeUsers: userCount ? 1 : 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalFolders: 0,
        activeLetters: 0,
        pendingVerification: 0,
        activeUsers: 0,
      };
    }
  }
}

export const storage = new SimpleStorage();