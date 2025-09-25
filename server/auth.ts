import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, userRoles, roles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    department?: string;
    position?: string;
    canAssignLetters?: boolean;
    level?: number;
  };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user with roles using raw SQL
export async function getUserWithRoles(userId: number) {
  try {
    const { pool } = await import('./db');
    
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) return null;

    const user = userResult.rows[0];

    // Assign roles based on user type and position
    let userRoleNames: string[] = [];
    
    // Assign roles based on email and position
    if (user.email === 'admin@rmu.gov.ke' || user.position === 'Administrator' || user.position === 'Admin') {
      userRoleNames = ['admin'];
    } else if (user.position === 'registry_admin' || user.department === 'Registry') {
      userRoleNames = ['registry', 'registry_admin'];
    } else if (user.position === 'ict_admin' || user.department === 'ICT') {
      userRoleNames = ['ict', 'ict_admin'];
    } else if (user.position === 'secretary') {
      userRoleNames = ['secretary'];
    } else if (user.position === 'principal_secretary') {
      userRoleNames = ['principal_secretary'];
    } else if (user.position === 'department_head') {
      userRoleNames = ['department_head'];
    } else {
      userRoleNames = ['user', 'letter_recipient'];
    }
    
    console.log(`User ${user.email} assigned roles:`, userRoleNames);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: userRoleNames,
      department: user.department,
      position: user.position,
      isActive: user.is_active,
      canAssignLetters: user.can_assign_letters || false,
      level: user.level || 0,
    };
  } catch (error) {
    console.error('Error getting user with roles:', error);
    return null;
  }
}

// Authentication middleware
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    console.log('--- AUTH MIDDLEWARE DEBUG ---');
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ 
        message: 'Authentication required', 
        code: 'NO_TOKEN' 
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Invalid token');
      return res.status(401).json({ 
        message: 'Invalid or expired token', 
        code: 'INVALID_TOKEN' 
      });
    }

    // Validate required fields in token
    if (!decoded.userId) {
      console.log('Token missing userId');
      return res.status(401).json({ 
        message: 'Invalid token format', 
        code: 'MALFORMED_TOKEN' 
      });
    }

    const user = await getUserWithRoles(decoded.userId);
    if (!user || !user.isActive) {
      console.log('User not found or inactive:', decoded.userId);
      return res.status(401).json({ 
        message: 'User not found or account deactivated', 
        code: 'USER_INACTIVE' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      department: user.department,
      position: user.position,
      canAssignLetters: user.canAssignLetters,
      level: user.level,
    };

    console.log('Authentication successful for user:', user.email);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Ensure we always return JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Authentication service error', 
        code: 'AUTH_SERVICE_ERROR' 
      });
    }
  }
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED' 
      });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      console.log(`Access denied for user ${req.user.email}. Required roles: ${allowedRoles.join(', ')}, User roles: ${req.user.roles.join(', ')}`);
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles 
      });
    }

    next();
  };
}

// Admin only middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  console.log('--- REQUIRE ADMIN DEBUG ---');
  if (!req.user) {
    console.log('No req.user found');
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED' 
    });
  }
  
  console.log('req.user roles:', req.user.roles);
  if (!req.user.roles.includes('admin')) {
    console.log('User does not have admin role');
    return res.status(403).json({ 
      message: 'Administrator access required',
      code: 'ADMIN_REQUIRED' 
    });
  }
  
  console.log('User is admin, proceeding');
  next();
}

// Middleware to check if user can assign letters
export function requireAssignmentPermission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED' 
    });
  }

  if (!req.user.canAssignLetters && !req.user.roles.includes('admin')) {
    return res.status(403).json({ 
      message: 'Letter assignment permission required',
      code: 'ASSIGNMENT_PERMISSION_REQUIRED' 
    });
  }

  next();
}