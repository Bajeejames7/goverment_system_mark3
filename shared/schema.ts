import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  department: text("department"),
  position: text("position"),
  level: integer("level").default(0),
  canAssignLetters: boolean("can_assign_letters").default(false),
  isActive: boolean("isActive").default(true),
  emailVerified: boolean("emailVerified").default(false),
  emailVerificationToken: text("emailVerificationToken"),
  emailVerificationExpires: timestamp("emailVerificationExpires"),
  resetPasswordToken: text("resetPasswordToken"),
  resetPasswordExpires: timestamp("resetPasswordExpires"),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: integer("createdBy").references(() => users.id),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentRoleId: integer("parent_role_id").references(() => roles.id),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: integer("role_id").references(() => roles.id, { onDelete: 'cascade' }).notNull(),
});

// Relations
export const usersRelations = {
  userRoles: {
    relationName: "userRoles",
    referencedTable: userRoles,
    type: "many" as const,
    config: {
      fields: [users.id],
      references: [userRoles.userId],
    },
  },
};

export const rolesRelations = {
  userRoles: {
    relationName: "userRoles", 
    referencedTable: userRoles,
    type: "many" as const,
    config: {
      fields: [roles.id],
      references: [userRoles.roleId],
    },
  },
};

export const userRolesRelations = {
  user: {
    relationName: "user",
    referencedTable: users,
    type: "one" as const,
    config: {
      fields: [userRoles.userId],
      references: [users.id],
    },
  },
  role: {
    relationName: "role",
    referencedTable: roles,
    type: "one" as const,
    config: {
      fields: [userRoles.roleId],
      references: [roles.id],
    },
  },
};

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  department: text("department").notNull(),
  createdBy: integer("createdBy").references(() => users.id), // Match actual camelCase database column
  createdAt: timestamp("createdAt").defaultNow(),
  isActive: boolean("isActive").default(true),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  folderId: integer("folder_id").references(() => folders.id), // RESTORED: files table has folderId column
});

export const letters = pgTable("letters", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  reference: text("reference").notNull().unique(),
  folderId: integer("folderId").references(() => folders.id), // Letters table also uses camelCase
  fileId: integer("fileId").references(() => files.id),
  content: text("content"),
  status: text("status").notNull().default("pending"), // Text type, not enum
  letterType: text("letterType").notNull().default("formal"),
  requiresPasscode: boolean("requiresPasscode").default(false),
  passcode: text("passcode"),
  verificationCode: text("verificationCode").unique(),
  uploadedBy: integer("uploadedBy").references(() => users.id).notNull(),
  assignedTo: integer("assignedTo").references(() => users.id),
  assignedBy: integer("assignedBy").references(() => users.id),
  verifiedBy: integer("verifiedBy").references(() => users.id),
  uploadedAt: timestamp("uploadedAt").defaultNow(), // Letters also uses camelCase
  openedAt: timestamp("openedAt"),
  assignedAt: timestamp("assignedAt"),
  verifiedAt: timestamp("verifiedAt"),
  completedAt: timestamp("completedAt"),
  colorCode: text("colorCode").default("gray"),
  metadata: jsonb("metadata"),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(), // Match actual camelCase database column
  entityId: text("entityId").notNull(),
  userId: text("userId").notNull(),
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

// Archive table for completed letter copies
export const letterArchives = pgTable("letter_archives", {
  id: serial("id").primaryKey(),
  letterId: integer("letter_id").references(() => letters.id).notNull(),
  userId: text("user_id").notNull(), // Firebase UID of user who completed work
  userRole: text("user_role").notNull(), // Role at time of archiving
  userDepartment: text("user_department").notNull(),
  actionTaken: text("action_taken"), // What action they took
  notes: text("notes"), // User's final notes
  archivedAt: timestamp("archived_at").defaultNow(),
  originalStatus: text("original_status"), // Letter status when archived
  finalStatus: text("final_status"), // Letter status after completion
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
  createdBy: true, // Omit from frontend, backend will set
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

export const uploadLetterFormSchema = insertLetterSchema.omit({ uploadedBy: true }).extend({
  title: z.string().min(1, "Letter title is required"),
  reference: z.string().min(1, "Reference number is required"),
  folderId: z.number().min(1, "Please select a folder"),
});
