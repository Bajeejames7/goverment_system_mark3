import { pool } from './db';
import { hashPassword } from './auth';

export async function initializeDatabase() {
  try {
    console.log('Initializing database with tables and admin user...');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        position VARCHAR(100),
        level INTEGER DEFAULT 1,
        can_assign_letters BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        parent_role_id INTEGER REFERENCES roles(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, role_id)
      );
    `);

    // Insert default roles
    const defaultRoles = [
      'admin', 'ict_admin', 'registry_admin', 'principal_secretary', 'secretary',
      'department_head', 'registry', 'fin', 'acc', 'hrm', 'ict', 'comm',
      'legal', 'intern_audit', 'procurement', 'planning', 'ad', 'dfs',
      'chem_min', 'mip', 'eng', 'kin', 'letter_recipient'
    ];

    for (const roleName of defaultRoles) {
      await pool.query(`
        INSERT INTO roles (name, description) 
        VALUES ($1, $2) 
        ON CONFLICT (name) DO NOTHING
      `, [roleName, `${roleName} role`]);
    }

    // Check if admin user exists
    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@rmu.gov.ke']
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await hashPassword('admin123');
      
      // Create admin user
      const adminResult = await pool.query(`
        INSERT INTO users (email, name, password, department, position, level, can_assign_letters, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        'admin@rmu.gov.ke',
        'System Administrator',
        hashedPassword,
        'ICT',
        'Administrator',
        3,
        true,
        true
      ]);

      const adminUserId = adminResult.rows[0].id;

      // Get admin role
      const adminRoleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
      const adminRoleId = adminRoleResult.rows[0].id;

      // Assign admin role
      await pool.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
      `, [adminUserId, adminRoleId]);

      console.log('✅ Default admin user created: admin@rmu.gov.ke / admin123');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}