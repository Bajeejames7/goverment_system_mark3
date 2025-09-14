// Simple script to test the API endpoints
const fetch = require('node-fetch');

// Test script to check user management API
async function testUserAPI() {
  try {
    console.log('Testing /api/users endpoint...');
    
    // First get a token by logging in
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@rmu.gov.ke', // Using the admin user
        password: 'Admin123!'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful');
    
    // Test the users endpoint
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (!usersResponse.ok) {
      console.log('Users API failed:', await usersResponse.text());
      return;
    }
    
    const users = await usersResponse.json();
    console.log('Users API response:');
    console.log(JSON.stringify(users, null, 2));
    
    // Test user stats endpoint
    const statsResponse = await fetch('http://localhost:5000/api/users/stats', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('User stats API response:');
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log('User stats API failed:', await statsResponse.text());
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUserAPI();