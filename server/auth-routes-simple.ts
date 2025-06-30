import { Express } from 'express';
import { z } from 'zod';
import { pool } from './db';
import { comparePassword, generateToken, AuthenticatedRequest, authenticateToken } from './auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email using raw query
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Update last login
      await pool.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Get user roles from user_roles table and roles table
      const rolesResult = await pool.query(`
        SELECT r.name 
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
      `, [user.id]);

      let userRoleNames = rolesResult.rows.map(row => row.name);
      
      // If no roles found in user_roles table, check if user has a direct role field
      if (userRoleNames.length === 0 && user.role) {
        userRoleNames = [user.role];
      }

      // Generate JWT token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email,
        roles: userRoleNames
      });

      // Return user data with token
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: userRoleNames,
          department: user.department,
          position: user.position,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Login failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // JWT tokens are stateless, so we just return success
      // In production, you might want to maintain a blacklist
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Stats endpoint
  app.get('/api/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      res.json({
        totalFolders: 15,
        activeLetters: 23,
        pendingVerification: 8,
        activeUsers: 12
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Recent letters endpoint
  app.get('/api/letters/recent', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      res.json([
        {
          id: 1,
          title: "Budget Request 2024",
          reference: "BUD-2024-001",
          status: "pending_review",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } catch (error) {
      console.error('Recent letters error:', error);
      res.status(500).json({ message: 'Failed to fetch recent letters' });
    }
  });

  // Audit logs endpoint
  app.get('/api/audit-logs/recent', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      res.json([
        {
          id: 1,
          action: "login",
          userId: req.user?.id,
          createdAt: new Date(),
          details: "User logged in successfully"
        }
      ]);
    } catch (error) {
      console.error('Audit logs error:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Folders endpoint
  app.get('/api/folders', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      res.json([
        {
          id: 1,
          name: "Finance Department",
          description: "Financial documents and reports",
          department: req.user?.department || "Finance",
          createdAt: new Date()
        }
      ]);
    } catch (error) {
      console.error('Folders error:', error);
      res.status(500).json({ message: 'Failed to fetch folders' });
    }
  });
}