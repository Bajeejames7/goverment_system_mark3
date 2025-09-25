import { Express } from 'express';
import { z } from 'zod';
import { pool, db } from './db';
import { comparePassword, generateToken, AuthenticatedRequest, authenticateToken } from './auth';
import { users, folders, letters, auditLogs } from '../shared/schema';
import { eq, count, desc } from 'drizzle-orm';

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

      // Assign roles based on user type and position for now
      let userRoleNames: string[] = [];
      
      // Assign roles based on email and position
      if (user.email === 'admin@rmu.gov.ke' || user.position === 'Administrator') {
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

  // Stats endpoint - simplified version
  app.get('/api/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Use a simple query approach
      const totalFoldersResult = await db.execute('SELECT COUNT(*) as count FROM folders WHERE is_active = true');
      const totalLettersResult = await db.execute('SELECT COUNT(*) as count FROM letters');
      const pendingLettersResult = await db.execute("SELECT COUNT(*) as count FROM letters WHERE status = 'pending'");
      const activeUsersResult = await db.execute('SELECT COUNT(*) as count FROM users WHERE is_active = true');

      res.json({
        totalFolders: parseInt(totalFoldersResult.rows[0].count) || 0,
        activeLetters: parseInt(totalLettersResult.rows[0].count) || 0,
        pendingVerification: parseInt(pendingLettersResult.rows[0].count) || 0,
        activeUsers: parseInt(activeUsersResult.rows[0].count) || 0
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Recent letters endpoint - simplified version
  app.get('/api/letters/recent', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const recentLetters = await db.select().from(letters)
        .orderBy(desc(letters.uploadedAt))
        .limit(10);
      
      res.json(recentLetters);
    } catch (error) {
      console.error('Recent letters error:', error);
      res.status(500).json({ message: 'Failed to fetch recent letters' });
    }
  });

  // Audit logs endpoint
  app.get('/api/audit-logs/recent', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const recentLogs = await db.select().from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(10);
      
      res.json(recentLogs);
    } catch (error) {
      console.error('Audit logs error:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Folders endpoint
  app.get('/api/folders', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userFolders = await db.select().from(folders)
        .where(eq(folders.isActive, true))
        .orderBy(desc(folders.createdAt));
      
      // Add letter count for each folder
      const foldersWithCounts = await Promise.all(
        userFolders.map(async (folder) => {
          try {
            const lettersResult = await db.select().from(letters)
              .where(eq(letters.folderId, folder.id));
            const letterCount = Array.isArray(lettersResult) ? lettersResult.length : 0;
            return { ...folder, letterCount };
          } catch (letterError) {
            console.warn(`Error getting letters for folder ${folder.id}:`, letterError);
            return { ...folder, letterCount: 0 };
          }
        })
      );
      
      res.json(foldersWithCounts);
    } catch (error) {
      console.error('Folders error:', error);
      res.status(500).json({ message: 'Failed to fetch folders' });
    }
  });
}