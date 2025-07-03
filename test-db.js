import { Pool } from 'pg';
import fs from 'fs';

const ca = fs.readFileSync('./ca.pem', 'utf-8');

const pool = new Pool({
  host: 'public-goverment-project-goverment-website.j.aivencloud.com', // Use DNS name for SSL
  port: 13270,
  user: 'avnadmin',
  password: 'AVNS_nQOiWAOU_lP9__dBVYf',
  database: 'defaultdb',
  ssl: {
    ca,
    rejectUnauthorized: true,
  }
  // family: 4, // Leave out for troubleshooting
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Success:', res.rows);
  }
  pool.end();
});
