require('dotenv').config();
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@tennis.com',
  password: 'tennis2024'
};

let adminToken = null;

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

async function testAdminAuthAPI() {
  console.log('🧪 Testing Admin Authentication API...\n');

  try {
    // Test 1: Admin Login
    console.log('📋 Test 1: Admin Login');
    const loginResult = await apiRequest('POST', '/auth/admin/login', ADMIN_CREDENTIALS);
    
    if (loginResult.success && loginResult.data.success) {
      adminToken = loginResult.data.data.tokens.accessToken;
      console.log('✅ Admin login successful');
      console.log('   Admin:', loginResult.data.data.admin.email);
      console.log('   Role:', loginResult.data.data.admin.role);
      console.log('   Token expires in:', loginResult.data.data.tokens.expiresIn, 'seconds');
    } else {
      console.log('❌ Admin login failed');
      console.log('   Error:', loginResult.error);
      return;
    }

    // Test 2: Get Admin Profile
    console.log('\n📋 Test 2: Get Admin Profile');
    const profileResult = await apiRequest('GET', '/auth/admin/profile', null, adminToken);
    
    if (profileResult.success && profileResult.data.success) {
      console.log('✅ Get admin profile successful');
      console.log('   Admin:', profileResult.data.data.admin.nickname);
      console.log('   Email:', profileResult.data.data.admin.email);
      console.log('   Role:', profileResult.data.data.admin.role);
    } else {
      console.log('❌ Get admin profile failed');
      console.log('   Error:', profileResult.error);
    }

    // Test 3: Verify Token
    console.log('\n📋 Test 3: Verify Token');
    const verifyResult = await apiRequest('GET', '/auth/admin/verify', null, adminToken);
    
    if (verifyResult.success && verifyResult.data.success) {
      console.log('✅ Token verification successful');
      console.log('   Token valid:', verifyResult.data.data.tokenValid);
    } else {
      console.log('❌ Token verification failed');
      console.log('   Error:', verifyResult.error);
    }

    // Test 4: Update Profile
    console.log('\n📋 Test 4: Update Admin Profile');
    const updateData = {
      nickname: 'Updated Admin Name'
    };
    const updateResult = await apiRequest('PUT', '/auth/admin/profile', updateData, adminToken);
    
    if (updateResult.success && updateResult.data.success) {
      console.log('✅ Profile update successful');
      console.log('   New nickname:', updateResult.data.data.admin.nickname);
    } else {
      console.log('❌ Profile update failed');
      console.log('   Error:', updateResult.error);
    }

    // Test 5: Invalid Token
    console.log('\n📋 Test 5: Invalid Token Test');
    const invalidTokenResult = await apiRequest('GET', '/auth/admin/profile', null, 'invalid-token');
    
    if (!invalidTokenResult.success && invalidTokenResult.status === 401) {
      console.log('✅ Invalid token test passed');
      console.log('   Error code:', invalidTokenResult.error.error.code);
    } else {
      console.log('❌ Invalid token test failed');
    }

    // Test 6: No Token
    console.log('\n📋 Test 6: No Token Test');
    const noTokenResult = await apiRequest('GET', '/auth/admin/profile');
    
    if (!noTokenResult.success && noTokenResult.status === 401) {
      console.log('✅ No token test passed');
      console.log('   Error code:', noTokenResult.error.error.code);
    } else {
      console.log('❌ No token test failed');
    }

    // Test 7: Invalid Login Credentials
    console.log('\n📋 Test 7: Invalid Login Credentials');
    const invalidLoginResult = await apiRequest('POST', '/auth/admin/login', {
      email: 'admin@tennis.com',
      password: 'wrong-password'
    });
    
    if (!invalidLoginResult.success && invalidLoginResult.status === 401) {
      console.log('✅ Invalid credentials test passed');
      console.log('   Error code:', invalidLoginResult.error.error.code);
    } else {
      console.log('❌ Invalid credentials test failed');
    }

    // Test 8: Logout
    console.log('\n📋 Test 8: Admin Logout');
    const logoutResult = await apiRequest('POST', '/auth/admin/logout', null, adminToken);
    
    if (logoutResult.success && logoutResult.data.success) {
      console.log('✅ Admin logout successful');
      console.log('   Message:', logoutResult.data.message);
    } else {
      console.log('❌ Admin logout failed');
      console.log('   Error:', logoutResult.error);
    }

    console.log('\n🎉 Admin Authentication API tests completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Check if server is running first
async function checkServerHealth() {
  try {
    const healthResult = await apiRequest('GET', '/health');
    if (healthResult.success && (healthResult.data.success || healthResult.data.status === 'OK')) {
      console.log('✅ Server is running and healthy');
      console.log('   Database connected:', healthResult.data.database?.connected || healthResult.data.services?.database);
      return true;
    } else {
      console.log('❌ Server health check failed');
      console.log('   Response:', healthResult);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Please make sure the server is running on port 3000');
    console.log('   Run: npm run dev or node src/app.js');
    console.log('   Error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Admin API Tests...\n');
  
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  await testAdminAuthAPI();
}

main();