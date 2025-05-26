import { User, InsertUser, Folder, InsertFolder, Letter, InsertLetter, AuditLog, InsertAuditLog, RoutingRule, InsertRoutingRule, DocumentRouting, InsertDocumentRouting } from "@shared/schema";
import { firestore } from './firebase-admin';

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
  
  // Routing Rules
  getRoutingRule(id: number): Promise<RoutingRule | undefined>;
  getRoutingRulesByDepartment(department: string): Promise<RoutingRule[]>;
  getAllRoutingRules(): Promise<RoutingRule[]>;
  createRoutingRule(rule: InsertRoutingRule): Promise<RoutingRule>;
  updateRoutingRule(id: number, rule: Partial<RoutingRule>): Promise<RoutingRule | undefined>;
  
  // Document Routing
  getDocumentRouting(id: number): Promise<DocumentRouting | undefined>;
  getDocumentRoutingByLetter(letterId: number): Promise<DocumentRouting[]>;
  getAllDocumentRoutings(): Promise<DocumentRouting[]>;
  createDocumentRouting(routing: InsertDocumentRouting): Promise<DocumentRouting>;
  updateDocumentRouting(id: number, routing: Partial<DocumentRouting>): Promise<DocumentRouting | undefined>;
  
  // Automated Routing
  evaluateRoutingRules(letter: Letter, userDepartment: string): Promise<RoutingRule[]>;
  routeDocument(letterId: number, userId: string): Promise<DocumentRouting[]>;
  
  // Stats
  getStats(): Promise<{
    totalFolders: number;
    activeLetters: number;
    pendingVerification: number;
    activeUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      if (!firestore) {
        console.error('Firestore not initialized');
        return undefined;
      }
      const usersRef = firestore.collection('users');
      const snapshot = await usersRef.where('id', '==', id).get();
      if (snapshot.empty) return undefined;
      const doc = snapshot.docs[0];
      return { ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      const usersRef = firestore.collection('users');
      const snapshot = await usersRef.where('firebaseUid', '==', firebaseUid).get();
      if (snapshot.empty) return undefined;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const usersRef = firestore.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      if (snapshot.empty) return undefined;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const userWithDefaults = {
        ...insertUser,
        id: Date.now(),
        createdAt: new Date(),
        isActive: insertUser.isActive ?? true,
        position: insertUser.position || null,
        createdBy: insertUser.createdBy || null,
      };

      const docRef = await firestore.collection('users').add(userWithDefaults);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const usersRef = firestore.collection('users');
      const snapshot = await usersRef.where('id', '==', id).get();
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      await docRef.update(updates);
      
      const updatedDoc = await docRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as User;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await firestore.collection('users').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getFolder(id: number): Promise<Folder | undefined> {
    try {
      const foldersRef = firestore.collection('folders');
      const snapshot = await foldersRef.where('id', '==', id).get();
      if (snapshot.empty) return undefined;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Folder;
    } catch (error) {
      console.error('Error getting folder:', error);
      return undefined;
    }
  }

  async getFoldersByDepartment(department: string): Promise<Folder[]> {
    try {
      const snapshot = await firestore.collection('folders')
        .where('department', '==', department)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
    } catch (error) {
      console.error('Error getting folders by department:', error);
      return [];
    }
  }

  async getAllFolders(): Promise<Folder[]> {
    try {
      const snapshot = await firestore.collection('folders').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
    } catch (error) {
      console.error('Error getting all folders:', error);
      return [];
    }
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    try {
      const folderWithDefaults = {
        ...insertFolder,
        id: Date.now(),
        createdAt: new Date(),
        isActive: insertFolder.isActive ?? true,
        description: insertFolder.description || null,
      };

      const docRef = await firestore.collection('folders').add(folderWithDefaults);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as Folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async updateFolder(id: number, updates: Partial<Folder>): Promise<Folder | undefined> {
    try {
      const foldersRef = firestore.collection('folders');
      const snapshot = await foldersRef.where('id', '==', id).get();
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      await docRef.update(updates);
      
      const updatedDoc = await docRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as Folder;
    } catch (error) {
      console.error('Error updating folder:', error);
      return undefined;
    }
  }

  async getLetter(id: number): Promise<Letter | undefined> {
    try {
      const lettersRef = firestore.collection('letters');
      const snapshot = await lettersRef.where('id', '==', id).get();
      if (snapshot.empty) return undefined;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Letter;
    } catch (error) {
      console.error('Error getting letter:', error);
      return undefined;
    }
  }

  async getLetterByReference(reference: string): Promise<Letter | undefined> {
    try {
      const lettersRef = firestore.collection('letters');
      const snapshot = await lettersRef.where('reference', '==', reference).get();
      if (snapshot.empty) return undefined;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Letter;
    } catch (error) {
      console.error('Error getting letter by reference:', error);
      return undefined;
    }
  }

  async getLettersByFolder(folderId: number): Promise<Letter[]> {
    try {
      const snapshot = await firestore.collection('letters')
        .where('folderId', '==', folderId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
    } catch (error) {
      console.error('Error getting letters by folder:', error);
      return [];
    }
  }

  async getLettersByStatus(status: string): Promise<Letter[]> {
    try {
      const snapshot = await firestore.collection('letters')
        .where('status', '==', status)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
    } catch (error) {
      console.error('Error getting letters by status:', error);
      return [];
    }
  }

  async getAllLetters(): Promise<Letter[]> {
    try {
      const snapshot = await firestore.collection('letters').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
    } catch (error) {
      console.error('Error getting all letters:', error);
      return [];
    }
  }

  async getRecentLetters(limit: number): Promise<Letter[]> {
    try {
      const snapshot = await firestore.collection('letters')
        .orderBy('uploadedAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
    } catch (error) {
      console.error('Error getting recent letters:', error);
      return [];
    }
  }

  async createLetter(insertLetter: InsertLetter): Promise<Letter> {
    try {
      const letterWithDefaults = {
        ...insertLetter,
        id: Date.now(),
        uploadedAt: new Date(),
        verificationCode: this.generateVerificationCode(),
        verifiedBy: null,
        verifiedAt: null,
        metadata: null,
        status: insertLetter.status || 'pending',
        content: insertLetter.content || null,
        folderId: insertLetter.folderId || null,
        fileName: insertLetter.fileName || null,
        fileUrl: insertLetter.fileUrl || null,
      };

      const docRef = await firestore.collection('letters').add(letterWithDefaults);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as Letter;
    } catch (error) {
      console.error('Error creating letter:', error);
      throw error;
    }
  }

  async updateLetter(id: number, updates: Partial<Letter>): Promise<Letter | undefined> {
    try {
      const lettersRef = firestore.collection('letters');
      const snapshot = await lettersRef.where('id', '==', id).get();
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      await docRef.update(updates);
      
      const updatedDoc = await docRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as Letter;
    } catch (error) {
      console.error('Error updating letter:', error);
      return undefined;
    }
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    try {
      const logWithDefaults = {
        ...insertLog,
        id: Date.now(),
        timestamp: new Date(),
        details: insertLog.details || null,
      };

      const docRef = await firestore.collection('auditLogs').add(logWithDefaults);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as AuditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  async getRecentAuditLogs(limit: number): Promise<AuditLog[]> {
    try {
      const snapshot = await firestore.collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
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
      const [foldersSnapshot, lettersSnapshot, pendingSnapshot, usersSnapshot] = await Promise.all([
        firestore.collection('folders').get(),
        firestore.collection('letters').where('status', '==', 'active').get(),
        firestore.collection('letters').where('status', '==', 'pending').get(),
        firestore.collection('users').where('isActive', '==', true).get(),
      ]);

      return {
        totalFolders: foldersSnapshot.size,
        activeLetters: lettersSnapshot.size,
        pendingVerification: pendingSnapshot.size,
        activeUsers: usersSnapshot.size,
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

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const storage = new DatabaseStorage();