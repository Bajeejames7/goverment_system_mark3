import { pool } from './db';
import { hashPassword } from './auth';

export async function initializeDatabase() {
  try {
    console.log('📊 Initializing database with all tables and admin user...');

    // Create users table
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
        email_verification_token TEXT,
        email_verification_expires TIMESTAMP,
        reset_password_token TEXT,
        reset_password_expires TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      );
    `);

    // Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        parent_role_id INTEGER REFERENCES roles(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, role_id)
      );
    `);

    // Create folders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        department TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // Create files table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        metadata JSONB,
        folder_id INTEGER REFERENCES folders(id)
      );
    `);

    // Create letters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS letters (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        reference TEXT NOT NULL UNIQUE,
        folder_id INTEGER REFERENCES folders(id),
        file_id INTEGER REFERENCES files(id),
        content TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        letter_type TEXT NOT NULL DEFAULT 'formal',
        requires_passcode BOOLEAN DEFAULT FALSE,
        passcode TEXT,
        verification_code TEXT UNIQUE,
        uploaded_by INTEGER REFERENCES users(id) NOT NULL,
        assigned_to INTEGER REFERENCES users(id),
        assigned_by INTEGER REFERENCES users(id),
        verified_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        opened_at TIMESTAMP,
        assigned_at TIMESTAMP,
        verified_at TIMESTAMP,
        completed_at TIMESTAMP,
        color_code TEXT DEFAULT 'gray',
        metadata JSONB
      );
    `);

    // Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create routing_rules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS routing_rules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        conditions JSONB NOT NULL,
        target_department TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL,
        description TEXT
      );
    `);

    // Create document_routing table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_routing (
        id SERIAL PRIMARY KEY,
        letter_id INTEGER REFERENCES letters(id),
        from_department TEXT NOT NULL,
        to_department TEXT NOT NULL,
        routing_rule_id INTEGER REFERENCES routing_rules(id),
        status TEXT NOT NULL DEFAULT 'pending',
        routed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP,
        notes TEXT,
        routed_by TEXT NOT NULL
      );
    `);

    // Create letter_archives table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS letter_archives (
        id SERIAL PRIMARY KEY,
        letter_id INTEGER REFERENCES letters(id) NOT NULL,
        user_id TEXT NOT NULL,
        user_role TEXT NOT NULL,
        user_department TEXT NOT NULL,
        action_taken TEXT,
        notes TEXT,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        original_status TEXT,
        final_status TEXT
      );
    `);

    console.log('✅ All database tables created successfully');

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

    console.log('✅ Default roles created successfully');

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

    // Create some sample data if tables are empty
    const folderCount = await pool.query('SELECT COUNT(*) FROM folders');
    if (parseInt(folderCount.rows[0].count) === 0) {
      // Create default folders
      await pool.query(`
        INSERT INTO folders (name, description, department, created_by)
        VALUES 
        ('General Correspondence', 'General letters and correspondence', 'General', 1),
        ('HR Documents', 'Human Resources related documents', 'HRM', 1),
        ('Finance Documents', 'Financial documents and reports', 'Finance', 1),
        ('Legal Documents', 'Legal correspondence and contracts', 'Legal', 1),
        ('ICT Documentation', 'ICT related documents and reports', 'ICT', 1)
      `);
      console.log('✅ Sample folders created');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}