import express, { type Request, Response, NextFunction } from "express";
import { registerAuthRoutes } from "./auth-routes-simple";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./routes";
import { initializeDatabase } from "./init-database";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  // Remove deprecated headers if present
  res.removeHeader?.('X-Frame-Options');
  res.removeHeader?.('Expires');
  next();
});

// Prevent browser caching of login page
app.use(['/login', '/api/login'], (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Serve uploaded files statically with proper configuration
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, {
  // Set cache control headers
  maxAge: '1h',
  // Ensure proper handling of files
  etag: true,
  lastModified: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database schema and admin user
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  // Register authentication routes using Aiven database
  const { registerAuthRoutes } = await import('./auth-routes-simple');
  registerAuthRoutes(app);

  // Register main API routes (folders, letters, etc.)
  await registerRoutes(app);

  const { createServer } = await import('http');
  const server = createServer(app);


  // Improved error handler: do not leak stack traces, always set security headers
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Log error for debugging
    console.error('Global error handler:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    const status = err.status || err.statusCode || 500;
    let message = 'Internal Server Error';
    
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    
    // Handle different error types
    if (status < 500 || process.env.NODE_ENV === 'development') {
      message = err.message || message;
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: err.errors 
      });
    }
    
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ 
        message: 'Resource already exists' 
      });
    }
    
    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "127.0.0.1",
  }, () => {
    log(`serving on port ${port}`);
  });
})();

// Add /check-auth endpoint for client-side login guard
app.get('/check-auth', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.json({ authenticated: false, reason: 'No authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.json({ authenticated: false, reason: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    if (!decoded || !decoded.userId) {
      return res.json({ authenticated: false, reason: 'Invalid token' });
    }
    
    res.json({ 
      authenticated: true, 
      userId: decoded.userId,
      email: decoded.email 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.json({ 
      authenticated: false, 
      reason: 'Token verification failed' 
    });
  }
});