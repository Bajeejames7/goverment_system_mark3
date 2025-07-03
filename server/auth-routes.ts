import { Express } from 'express';
import { z } from 'zod';
import { db } from './db';
import { users, userRoles, roles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthenticatedRequest } from './auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  department: z.string().optional(),
  position: z.string().optional(),
  roles: z.array(z.string()).default(['letter_recipient']),
});

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email with basic query
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is disabled' });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Update last login
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      // Get user roles with separate query
      const userRoleData = await db.select({
        roleName: roles.name
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

      const userRoleNames = userRoleData.map(ur => ur.roleName);

      // Generate JWT token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email,
        roles: userRoleNames 
      });

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        position: user.position,
        roles: userRoleNames,
        canAssignLetters: user.canAssignLetters,
      };

      res.json({
        token,
        user: userData,
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ 
        message: error instanceof z.ZodError ? 'Invalid input data' : 'Login failed' 
      });
    }
  });

  // Get current user endpoint
  app.get('/api/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get full user data with roles
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        with: {
          userRoles: {
            with: {
              role: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        position: user.position,
        roles: Array.isArray(user.userRoles)
          ? user.userRoles.map(ur => ur.role && typeof ur.role === 'object' && 'name' in ur.role ? ur.role.name : undefined).filter(Boolean)
          : [],
        canAssignLetters: user.canAssignLetters,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
      };

      res.json(userData);

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });

  // Register new user (admin only)
  app.post('/api/register', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user has admin role
      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const userData = registerSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email)
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      let newUser: any;
      const result = await db.insert(users).values({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        department: userData.department,
        position: userData.position,
        createdBy: req.user.id,
      }).returning();
      if (Array.isArray(result)) {
        newUser = result[0];
      } else if (result && typeof result === 'object' && 'id' in result) {
        newUser = result;
      } else {
        throw new Error('Failed to create user');
      }

      // Assign roles
      for (const roleName of userData.roles) {
        const role = await db.query.roles.findFirst({
          where: eq(roles.name, roleName)
        });

        if (role) {
          await db.insert(userRoles).values({
            userId: newUser.id,
            roleId: role.id,
          });
        }
      }

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          department: newUser.department,
          position: newUser.position,
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({ 
        message: error instanceof z.ZodError ? 'Invalid input data' : 'Registration failed' 
      });
    }
  });

  // Logout endpoint
  app.post('/api/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
    // For JWT, we just need to clear the token on the client side
    // In a production environment, you might want to maintain a blacklist of tokens
    res.json({ message: 'Logged out successfully' });
  });

  // Email verification, forgot password, and reset password endpoints

  // 1. Request email verification (send token)
  app.post('/api/verify-email', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      // Generate a simple token (in production, use a secure random token)
      const token = generateToken({ userId: req.user.id, type: 'verify-email' });
      // TODO: Send email with token link (simulate for now)
      // Save token to user row (or a separate table if you want multiple tokens)
      await db.update(users).set({ emailVerificationToken: token }).where(eq(users.id, req.user.id));
      // Simulate email send
      console.log(`Verification link: https://your-app.com/verify-email?token=${token}`);
      res.json({ message: 'Verification email sent (simulated)', token });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  });

  // 2. Verify email with token
  app.post('/api/verify-email/confirm', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: 'Token required' });
      let payload;
      try {
        payload = require('./auth').verifyToken(token);
      } catch {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      if (payload.type !== 'verify-email') return res.status(400).json({ message: 'Invalid token type' });
      // Find user by id and token
      const [foundUser] = await db.select().from(users).where(and(eq(users.id, payload.userId), eq(users.emailVerificationToken, token)));
      if (!foundUser) return res.status(400).json({ message: 'Invalid or expired token' });
      // Mark email as verified
      await db.update(users).set({ emailVerified: true, emailVerificationToken: null }).where(eq(users.id, foundUser.id));
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to verify email' });
    }
  });

  // 3. Request password reset (send token)
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email required' });
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
      const token = generateToken({ userId: user.id, type: 'reset-password' });
      await db.update(users).set({ passwordResetToken: token }).where(eq(users.id, user.id));
      // Simulate email send
      console.log(`Reset link: https://your-app.com/reset-password?token=${token}`);
      res.json({ message: 'Password reset email sent (simulated)', token });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send password reset email' });
    }
  });

  // 4. Reset password with token
  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ message: 'Token and new password required' });
      let payload;
      try {
        payload = require('./auth').verifyToken(token);
      } catch {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      if (payload.type !== 'reset-password') return res.status(400).json({ message: 'Invalid token type' });
      // Find user by id and token
      const [foundUser] = await db.select().from(users).where(and(eq(users.id, payload.userId), eq(users.passwordResetToken, token)));
      if (!foundUser) return res.status(400).json({ message: 'Invalid or expired token' });
      // Hash new password
      const hashedPassword = await hashPassword(password);
      await db.update(users).set({ password: hashedPassword, passwordResetToken: null }).where(eq(users.id, foundUser.id));
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });
}