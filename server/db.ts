import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Configure Aiven database connection
const connectionConfig = {
  host: 'goverment-project-goverment-website.j.aivencloud.com',
  port: 13270,
  user: 'avnadmin',
  password: 'AVNS_nQOiWAOU_lP9__dBVYf',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
};

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });