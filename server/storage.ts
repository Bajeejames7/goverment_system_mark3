import { users, folders, letters, auditLogs, type User, type InsertUser, type Folder, type InsertFolder, type Letter, type InsertLetter, type AuditLog, type InsertAuditLog } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Folders
  getFolder(id: number): Promise<Folder | undefined>;
  getFoldersByDepartment(department: string): Promise<Folder[]>;
  getAllFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<Folder>): Promise<Folder | undefined>;
  
  // Letters
  getLetter(id: number): Promise<Letter | undefined>;
  getLetterByReference(reference: string): Promise<Letter | undefined>;
  getLettersByFolder(folderId: number): Promise<Letter[]>;
  getLettersByStatus(status: string): Promise<Letter[]>;
  getAllLetters(): Promise<Letter[]>;
  getRecentLetters(limit: number): Promise<Letter[]>;
  createLetter(letter: InsertLetter): Promise<Letter>;
  updateLetter(id: number, letter: Partial<Letter>): Promise<Letter | undefined>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private folders: Map<number, Folder> = new Map();
  private letters: Map<number, Letter> = new Map();
  private auditLogs: Map<number, AuditLog> = new Map();
  private currentUserId = 1;
  private currentFolderId = 1;
  private currentLetterId = 1;
  private currentAuditLogId = 1;

  constructor() {
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo admin user
    const adminUser: User = {
      id: this.currentUserId++,
      firebaseUid: "demo-admin-uid",
      email: "admin@industry.gov",
      name: "System Administrator",
      role: "admin",
      department: "Administration",
      position: "System Administrator",
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
    };
    this.users.set(adminUser.id, adminUser);

    // Demo folders
    const demoFolders = [
      {
        id: this.currentFolderId++,
        name: "Industry Department",
        description: "Official documents and correspondence for the Industry Department",
        department: "Industry Department",
        createdBy: adminUser.firebaseUid,
        createdAt: new Date(),
        isActive: true,
      },
      {
        id: this.currentFolderId++,
        name: "Policy & Regulations",
        description: "Government policies and regulatory documents",
        department: "Policy & Regulations",
        createdBy: adminUser.firebaseUid,
        createdAt: new Date(),
        isActive: true,
      },
    ];

    demoFolders.forEach(folder => this.folders.set(folder.id, folder));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  // Folder methods
  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async getFoldersByDepartment(department: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      folder => folder.department === department && folder.isActive
    );
  }

  async getAllFolders(): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(folder => folder.isActive);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const folder: Folder = {
      ...insertFolder,
      id: this.currentFolderId++,
      createdAt: new Date(),
    };
    this.folders.set(folder.id, folder);
    return folder;
  }

  async updateFolder(id: number, updates: Partial<Folder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder = { ...folder, ...updates };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  // Letter methods
  async getLetter(id: number): Promise<Letter | undefined> {
    return this.letters.get(id);
  }

  async getLetterByReference(reference: string): Promise<Letter | undefined> {
    return Array.from(this.letters.values()).find(letter => letter.reference === reference);
  }

  async getLettersByFolder(folderId: number): Promise<Letter[]> {
    return Array.from(this.letters.values()).filter(letter => letter.folderId === folderId);
  }

  async getLettersByStatus(status: string): Promise<Letter[]> {
    return Array.from(this.letters.values()).filter(letter => letter.status === status);
  }

  async getAllLetters(): Promise<Letter[]> {
    return Array.from(this.letters.values());
  }

  async getRecentLetters(limit: number): Promise<Letter[]> {
    return Array.from(this.letters.values())
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, limit);
  }

  async createLetter(insertLetter: InsertLetter): Promise<Letter> {
    const letter: Letter = {
      ...insertLetter,
      id: this.currentLetterId++,
      uploadedAt: new Date(),
      verificationCode: this.generateVerificationCode(),
      verifiedBy: null,
      verifiedAt: null,
      metadata: null,
    };
    this.letters.set(letter.id, letter);
    return letter;
  }

  async updateLetter(id: number, updates: Partial<Letter>): Promise<Letter | undefined> {
    const letter = this.letters.get(id);
    if (!letter) return undefined;
    
    const updatedLetter = { ...letter, ...updates };
    if (updates.status === 'verified' && !letter.verifiedAt) {
      updatedLetter.verifiedAt = new Date();
    }
    
    this.letters.set(id, updatedLetter);
    return updatedLetter;
  }

  // Audit log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const log: AuditLog = {
      ...insertLog,
      id: this.currentAuditLogId++,
      timestamp: new Date(),
    };
    this.auditLogs.set(log.id, log);
    return log;
  }

  async getRecentAuditLogs(limit: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Stats methods
  async getStats(): Promise<{
    totalFolders: number;
    activeLetters: number;
    pendingVerification: number;
    activeUsers: number;
  }> {
    return {
      totalFolders: Array.from(this.folders.values()).filter(f => f.isActive).length,
      activeLetters: this.letters.size,
      pendingVerification: Array.from(this.letters.values()).filter(l => l.status === 'pending').length,
      activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
    };
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const storage = new MemStorage();
