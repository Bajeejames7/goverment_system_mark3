import fs from 'fs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

dotenv.config();

// Enhanced database connection configuration with error handling
const caCertPath = process.env.DATABASE_CA_CERT || './ca.pem';
let sslConfig: any = { rejectUnauthorized: false };

try {
  if (fs.existsSync(caCertPath)) {
    const caCert = fs.readFileSync(caCertPath).toString();
    sslConfig = {
      ca: caCert,
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined, // Skip hostname verification for cloud databases
    };
    console.log('✓ SSL certificate loaded successfully');
  } else {
    console.warn('⚠️  CA certificate not found, using permissive SSL config');
    sslConfig = {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    };
  }
} catch (e) {
  console.warn('⚠️  Could not load CA cert, using permissive SSL config:', e instanceof Error ? e.message : e);
  sslConfig = {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  };
}

const connectionConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: sslConfig,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased timeout for cloud database
  acquireTimeoutMillis: 10000, // Time to wait for a connection from the pool
  createTimeoutMillis: 10000, // Time to wait for a new connection
  destroyTimeoutMillis: 5000, // Time to wait for a connection to be destroyed
  reapIntervalMillis: 1000, // Check for idle connections every second
  createRetryIntervalMillis: 200, // Retry failed connections every 200ms
  propagateCreateError: false, // Don't propagate create errors
};

console.log('Database connection config:', {
  ...connectionConfig,
  password: connectionConfig.password ? '[REDACTED]' : undefined
});

// Create connection pool with error handling
export const pool = new Pool(connectionConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✓ Database connection established');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

// Test the connection with retry logic
const testConnection = async () => {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log(`✓ Database connection test successful at: ${result.rows[0].now}`);
      return;
    } catch (err) {
      console.error(`❌ Database connection test failed (attempt ${attempt}/${maxRetries}):`, err instanceof Error ? err.message : err);
      if (attempt === maxRetries) {
        console.error('❌ Failed to connect to database after all retry attempts');
        console.error('Please check your database connection settings and network connectivity');
      } else {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
};

// Run connection test
testConnection();

export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query: string, params?: unknown[]) => {
      console.log('🔍 SQL Query:', query);
      if (params && params.length > 0) {
        console.log('📊 Parameters:', params);
      }
    }
  } : false
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection pool...');
  await pool.end();
  process.exit(0);
});
