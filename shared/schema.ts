import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'admin', 'registry', 'officer'
  department: text("department").notNull(),
  position: text("position"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"), // Firebase UID of admin who created this user
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  department: text("department").notNull(),
  createdBy: text("created_by").notNull(), // Firebase UID
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const letters = pgTable("letters", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  reference: text("reference").notNull().unique(),
  folderId: integer("folder_id").references(() => folders.id),
  content: text("content"),
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("pending"), // 'pending', 'verified', 'rejected'
  verificationCode: text("verification_code").unique(),
  uploadedBy: text("uploaded_by").notNull(), // Firebase UID
  verifiedBy: text("verified_by"), // Firebase UID
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  metadata: jsonb("metadata"), // Additional document metadata
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // 'user', 'folder', 'letter'
  entityId: text("entity_id").notNull(),
  userId: text("user_id").notNull(), // Firebase UID
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  conditions: jsonb("conditions").notNull(), // JSON object defining routing conditions
  targetDepartment: text("target_department").notNull(),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by").notNull(),
  description: text("description"),
});

export const documentRouting = pgTable("document_routing", {
  id: serial("id").primaryKey(),
  letterId: integer("letter_id").references(() => letters.id),
  fromDepartment: text("from_department").notNull(),
  toDepartment: text("to_department").notNull(),
  routingRuleId: integer("routing_rule_id").references(() => routingRules.id),
  status: text("status").notNull().default("pending"), // pending, in_transit, delivered, rejected
  routedAt: timestamp("routed_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  routedBy: text("routed_by").notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

export const insertLetterSchema = createInsertSchema(letters).omit({
  id: true,
  uploadedAt: true,
  verifiedAt: true,
  verificationCode: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertRoutingRuleSchema = createInsertSchema(routingRules).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentRoutingSchema = createInsertSchema(documentRouting).omit({
  id: true,
  routedAt: true,
  deliveredAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Letter = typeof letters.$inferSelect;
export type InsertLetter = z.infer<typeof insertLetterSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type RoutingRule = typeof routingRules.$inferSelect;
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
export type DocumentRouting = typeof documentRouting.$inferSelect;
export type InsertDocumentRouting = z.infer<typeof insertDocumentRoutingSchema>;

// Extended schemas for forms
export const createUserFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.name.length > 0, {
  message: "Name is required",
  path: ["name"],
});

export const createFolderFormSchema = insertFolderSchema.extend({
  name: z.string().min(1, "Folder name is required"),
  department: z.string().min(1, "Department is required"),
});

export const uploadLetterFormSchema = insertLetterSchema.extend({
  title: z.string().min(1, "Letter title is required"),
  reference: z.string().min(1, "Reference number is required"),
  folderId: z.number().min(1, "Please select a folder"),
});
