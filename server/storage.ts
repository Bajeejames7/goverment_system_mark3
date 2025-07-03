import { db } from "./db";
import { users, folders, letters, auditLogs } from "../shared/schema";
import { eq } from "drizzle-orm";
import type { User, InsertUser, Folder, InsertFolder, Letter, InsertLetter, AuditLog, InsertAuditLog, RoutingRule, InsertRoutingRule, DocumentRouting, InsertDocumentRouting } from "../shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  getFoldersByDepartment(department: string): Promise<Folder[]>;
  getAllFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<Folder>): Promise<Folder | undefined>;
  getLetter(id: number): Promise<Letter | undefined>;
  getLetterByReference(reference: string): Promise<Letter | undefined>;
  getLettersByFolder(folderId: number): Promise<Letter[]>;
  getLettersByStatus(status: string): Promise<Letter[]>;
  getAllLetters(): Promise<Letter[]>;
  getRecentLetters(limit: number): Promise<Letter[]>;
  createLetter(letter: InsertLetter): Promise<Letter>;
  updateLetter(id: number, letter: Partial<Letter>): Promise<Letter | undefined>;
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
}

export const storage: IStorage = {
  // Users
  async getUser(id: number) {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  },
  async getUserByFirebaseUid(firebaseUid: string) {
    return db.query.users.findFirst({ where: eq(users.createdBy, firebaseUid) });
  },
  async getUserByEmail(email: string) {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  },
  async createUser(user: InsertUser) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  },
  async updateUser(id: number, user: Partial<User>) {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  },
  async getAllUsers() {
    return db.select().from(users);
  },

  // Folders
  async getFolder(id: number) {
    return db.query.folders.findFirst({ where: eq(folders.id, id) });
  },
  async getFoldersByDepartment(department: string) {
    return db.query.folders.findMany({ where: eq(folders.department, department) });
  },
  async getAllFolders() {
    return db.select().from(folders);
  },
  async createFolder(folder: InsertFolder) {
    const [newFolder] = await db.insert(folders).values(folder).returning();
    return newFolder;
  },
  async updateFolder(id: number, folder: Partial<Folder>) {
    const [updated] = await db.update(folders).set(folder).where(eq(folders.id, id)).returning();
    return updated;
  },

  // Letters
  async getLetter(id: number) {
    return db.query.letters.findFirst({ where: eq(letters.id, id) });
  },
  async getLetterByReference(reference: string) {
    return db.query.letters.findFirst({ where: eq(letters.reference, reference) });
  },
  async getLettersByFolder(folderId: number) {
    return db.query.letters.findMany({ where: eq(letters.folderId, folderId) });
  },
  async getLettersByStatus(status: string) {
    return db.query.letters.findMany({ where: eq(letters.status, status) });
  },
  async getAllLetters() {
    return db.select().from(letters);
  },
  async getRecentLetters(limit: number) {
    return db.select().from(letters).limit(limit);
  },
  async createLetter(letter: InsertLetter) {
    const [newLetter] = await db.insert(letters).values(letter).returning();
    return newLetter;
  },
  async updateLetter(id: number, letter: Partial<Letter>) {
    const [updated] = await db.update(letters).set(letter).where(eq(letters.id, id)).returning();
    return updated;
  },

  // Audit Logs
  async createAuditLog(log: InsertAuditLog) {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  },
  async getRecentAuditLogs(limit: number) {
    return db.select().from(auditLogs).limit(limit);
  },

  // Routing Rules (stub)
  async getRoutingRule(id: number) { return undefined; },
  async getRoutingRulesByDepartment(department: string) { return []; },
  async getAllRoutingRules() { return []; },
  async createRoutingRule(rule: InsertRoutingRule) { return undefined; },
  async updateRoutingRule(id: number, rule: Partial<RoutingRule>) { return undefined; },

  // Document Routing (stub)
  async getDocumentRouting(id: number) { return undefined; },
  async getDocumentRoutingByLetter(letterId: number) { return []; },
  async getAllDocumentRoutings() { return []; },
  async createDocumentRouting(routing: InsertDocumentRouting) { return undefined; },
  async updateDocumentRouting(id: number, routing: Partial<DocumentRouting>) { return undefined; },

  // Automated Routing (stub)
  async evaluateRoutingRules(letter: Letter, userDepartment: string) { return []; },
  async routeDocument(letterId: number, userId: string) { return []; },

  // Stats
  async getStats() {
    const totalFolders = (await db.select().from(folders)).length;
    const activeLetters = (await db.select().from(letters)).length;
    const activeUsers = (await db.select().from(users)).length;
    return { totalFolders, activeLetters, pendingVerification: 0, activeUsers };
  },
};