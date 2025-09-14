// Use dynamic import for fetch in ES modules
async function testDeleteFolder() {
  try {
    // Dynamically import node-fetch
    const { default: fetch } = await import('node-fetch');

    // First, let's try to login to get an auth token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gov.rm',
        password: 'Admin123!',
      }),
    });

    console.log(`Login response status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      console.log('Login failed. Trying with default admin credentials...');
      // Try with default admin credentials
      const loginResult = await loginResponse.json();
      console.log('Login result:', loginResult);
      return;
    }

    const loginResult = await loginResponse.json();
    const token = loginResult.token;
    console.log('Login successful. Token received.');

    // Now, let's get all folders using the token
    console.log('Getting all folders...');
    const foldersResponse = await fetch('http://localhost:5000/api/folders', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log(`Folders response status: ${foldersResponse.status}`);
    const folders = await foldersResponse.json();
    console.log('Existing folders:', folders);

    if (Array.isArray(folders) && folders.length > 0) {
      const folderId = folders[0].id;
      console.log(`Attempting to delete folder with ID: ${folderId}`);
      
      // Try to delete the first folder
      const deleteResponse = await fetch(`http://localhost:5000/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log(`Delete response status: ${deleteResponse.status}`);
      const deleteResult = await deleteResponse.json();
      console.log('Delete result:', deleteResult);
    } else {
      console.log('No folders to delete');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testDeleteFolder();