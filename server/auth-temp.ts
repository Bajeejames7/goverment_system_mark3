import { Express } from 'express';
import { z } from 'zod';
import { comparePassword, generateToken, hashPassword, AuthenticatedRequest, authenticateToken } from './auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Temporary in-memory user storage until database is working
const tempUsers = new Map();

async function initTempUsers() {
  if (!tempUsers.has('admin@rmu.gov.ke')) {
    const hashedPassword = await hashPassword('admin123');
    tempUsers.set('admin@rmu.gov.ke', {
      id: 1,
      email: 'admin@rmu.gov.ke',
      name: 'System Administrator',
      password: hashedPassword,
      department: 'ICT',
      position: 'Administrator',
      roles: ['admin'],
      isActive: true
    });
    console.log('✅ Temporary admin user created: admin@rmu.gov.ke / admin123');
  }
}

export function registerAuthRoutes(app: Express) {
  // Initialize temporary users
  initTempUsers();

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user in temporary storage
      const user = tempUsers.get(email);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email,
        roles: user.roles
      });

      // Return user data with token
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
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
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });
}