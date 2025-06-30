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
        roles: user.userRoles?.map(ur => ur.role.name) || [],
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
      const [newUser] = await db.insert(users).values({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        department: userData.department,
        position: userData.position,
        createdBy: req.user.id,
      }).returning();

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
}