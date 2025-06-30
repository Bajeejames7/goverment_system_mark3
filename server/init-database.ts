import { db } from './db';
import { users, roles, userRoles } from '@shared/schema';
import { hashPassword } from './auth';

export async function initializeDatabase() {
  try {
    console.log('Initializing database with default roles and admin user...');

    // Insert default roles
    const defaultRoles = [
      { name: 'admin', description: 'System administrator' },
      { name: 'ict_admin', description: 'ICT Administrator' },
      { name: 'registry_admin', description: 'Registry Administrator' },
      { name: 'principal_secretary', description: 'Principal Secretary' },
      { name: 'secretary', description: 'Secretary' },
      { name: 'department_head', description: 'Department Head' },
      { name: 'registry', description: 'Registry Officer' },
      { name: 'fin', description: 'Finance Department' },
      { name: 'acc', description: 'Accounts Department' },
      { name: 'hrm', description: 'Human Resources' },
      { name: 'ict', description: 'ICT Department' },
      { name: 'comm', description: 'Communications' },
      { name: 'legal', description: 'Legal Department' },
      { name: 'intern_audit', description: 'Internal Audit' },
      { name: 'procurement', description: 'Procurement' },
      { name: 'planning', description: 'Planning Department' },
      { name: 'ad', description: 'AD' },
      { name: 'dfs', description: 'DFS' },
      { name: 'chem_min', description: 'Chemistry/Mining' },
      { name: 'mip', description: 'MIP' },
      { name: 'eng', description: 'Engineering' },
      { name: 'kin', description: 'KIN' },
      { name: 'letter_recipient', description: 'Base user role' },
    ];

    // Insert roles (ignore conflicts if they already exist)
    for (const role of defaultRoles) {
      try {
        await db.insert(roles).values(role).onConflictDoNothing();
      } catch (error) {
        // Role might already exist, continue
      }
    }

    // Create default admin user if it doesn't exist
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@rmu.gov.ke')
    });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin123');
      
      const [adminUser] = await db.insert(users).values({
        email: 'admin@rmu.gov.ke',
        name: 'System Administrator',
        password: hashedPassword,
        department: 'ICT',
        position: 'Administrator',
        level: 3,
        canAssignLetters: true,
        emailVerified: true,
      }).returning();

      // Assign admin role
      const adminRole = await db.query.roles.findFirst({
        where: (roles, { eq }) => eq(roles.name, 'admin')
      });

      if (adminRole && adminUser) {
        await db.insert(userRoles).values({
          userId: adminUser.id,
          roleId: adminRole.id,
        });
      }

      console.log('✅ Default admin user created: admin@rmu.gov.ke / admin123');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}