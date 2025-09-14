// Test the folders API endpoint
import { pool } from './server/db.js';

async function testFoldersAPI() {
  try {
    console.log('Testing folders API directly with database...');
    
    // Get all folders
    const foldersResult = await pool.query('SELECT * FROM folders WHERE is_active = true ORDER BY created_at');
    console.log('Folders from database:', foldersResult.rows);
    
    // Get letter counts for each folder
    for (const folder of foldersResult.rows) {
      const lettersResult = await pool.query('SELECT COUNT(*) as count FROM letters WHERE folder_id = $1', [folder.id]);
      console.log(`Folder "${folder.name}" (ID: ${folder.id}) has ${lettersResult.rows[0].count} letters`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  process.exit(0);
}

testFoldersAPI();