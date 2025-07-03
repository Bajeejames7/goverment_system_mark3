import fs from 'fs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

dotenv.config();

// Configure Aiven database connection using environment variables and SSL
const caCertPath = process.env.DATABASE_CA_CERT || './ca.cert';
let sslConfig: any = { rejectUnauthorized: false };
try {
  if (fs.existsSync(caCertPath)) {
    sslConfig = {
      ca: fs.readFileSync(caCertPath).toString(),
      rejectUnauthorized: true
    };
  }
} catch (e) {
  console.warn('Could not load CA cert, using default SSL config:', e);
}
const connectionConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: sslConfig,
  family: 4 // Force IPv4
};

console.log('Postgres connection config:', connectionConfig);

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });
