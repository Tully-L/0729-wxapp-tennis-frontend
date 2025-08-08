require('dotenv').config();
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@tennis.com',
  password: 'tennis2024'
};

let adminToken = null;
let testUserId = null;

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

async function loginAdmin() {
  console.log('🔐 Logging in as admin...');
  const loginResult = await apiRequest('POST', '/auth/admin/login', ADMIN_CREDENTIALS);
  
  if (loginResult.success && loginResult.data.success) {
    adminToken = loginResult.data.data.tokens.accessToken;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', loginResult.error);
    return false;
  }
}

async function testUserManagementAPI() {
  console.log('\n🧪 Testing User Management API...\n');

  try {
    // Test 1: Get Users List
    console.log('📋 Test 1: Get Users List');
    const usersResult = await apiRequest('GET', '/admin/users?page=1&limit=5', null, adminToken);
    
    if (usersResult.success && usersResult.data.success) {
      console.log('✅ Get users list successful');
      console.log('   Total users:', usersResult.data.data.pagination.total);
      console.log('   Users on page:', usersResult.data.data.users.length);
      
      // Store first non-admin user ID for further tests
      if (usersResult.data.data.users.length > 0) {
        const nonAdminUser = usersResult.data.data.users.find(user => user.role === 'user');
        if (nonAdminUser) {
          testUserId = nonAdminUser._id;
          console.log('   Test user ID (non-admin):', testUserId);
        } else {
          testUserId = usersResult.data.data.users[0]._id;
          console.log('   Test user ID (admin):', testUserId);
        }
      }
    } else {
      console.log('❌ Get users list failed');
      console.log('   Error:', usersResult.error);
    }

    // Test 2: Get User Details
    if (testUserId) {
      console.log('\n📋 Test 2: Get User Details');
      const userDetailResult = await apiRequest('GET', `/admin/users/${testUserId}`, null, adminToken);
      
      if (userDetailResult.success && userDetailResult.data.success) {
        console.log('✅ Get user details successful');
        console.log('   User nickname:', userDetailResult.data.data.user.nickname);
        console.log('   User status:', userDetailResult.data.data.user.status);
        console.log('   User level:', userDetailResult.data.data.statistics.level.name);
        console.log('   Account age:', userDetailResult.data.data.statistics.accountAge, 'days');
      } else {
        console.log('❌ Get user details failed');
        console.log('   Error:', userDetailResult.error);
      }
    }

    // Test 3: Update User
    if (testUserId) {
      console.log('\n📋 Test 3: Update User');
      const updateData = {
        nickname: 'Updated Test User',
        total_points: 100
      };
      const updateResult = await apiRequest('PUT', `/admin/users/${testUserId}`, updateData, adminToken);
      
      if (updateResult.success && updateResult.data.success) {
        console.log('✅ Update user successful');
        console.log('   New nickname:', updateResult.data.data.user.nickname);
        console.log('   New points:', updateResult.data.data.user.total_points);
        console.log('   Changes:', Object.keys(updateResult.data.data.changes));
      } else {
        console.log('❌ Update user failed');
        console.log('   Error:', updateResult.error);
      }
    }

    // Test 4: Update User Status
    if (testUserId) {
      console.log('\n📋 Test 4: Update User Status');
      const statusData = {
        status: 'banned',
        reason: 'Test ban for API testing'
      };
      const statusResult = await apiRequest('PUT', `/admin/users/${testUserId}/status`, statusData, adminToken);
      
      if (statusResult.success && statusResult.data.success) {
        console.log('✅ Update user status successful');
        console.log('   New status:', statusResult.data.data.user.status);
        console.log('   Reason:', statusResult.data.data.statusChange.reason);
      } else {
        console.log('❌ Update user status failed');
        console.log('   Error:', statusResult.error);
      }

      // Restore user status
      console.log('\n📋 Test 4b: Restore User Status');
      const restoreStatusData = {
        status: 'active',
        reason: 'Restored after API testing'
      };
      const restoreResult = await apiRequest('PUT', `/admin/users/${testUserId}/status`, restoreStatusData, adminToken);
      
      if (restoreResult.success && restoreResult.data.success) {
        console.log('✅ Restore user status successful');
        console.log('   Restored status:', restoreResult.data.data.user.status);
      } else {
        console.log('❌ Restore user status failed');
        console.log('   Error:', restoreResult.error);
      }
    }

    // Test 5: Search Users
    console.log('\n📋 Test 5: Search Users');
    const searchResult = await apiRequest('GET', '/admin/users?search=微信&limit=3', null, adminToken);
    
    if (searchResult.success && searchResult.data.success) {
      console.log('✅ Search users successful');
      console.log('   Found users:', searchResult.data.data.users.length);
      searchResult.data.data.users.forEach((user, index) => {
        console.log(`   User ${index + 1}: ${user.nickname} (${user.status})`);
      });
    } else {
      console.log('❌ Search users failed');
      console.log('   Error:', searchResult.error);
    }

    // Test 6: Get User Statistics
    console.log('\n📋 Test 6: Get User Statistics');
    const statsResult = await apiRequest('GET', '/admin/users/statistics/overview', null, adminToken);
    
    if (statsResult.success && statsResult.data.success) {
      console.log('✅ Get user statistics successful');
      const stats = statsResult.data.data.statistics;
      console.log('   Total users:', stats.totalUsers);
      console.log('   Active users:', stats.activeUsers);
      console.log('   Banned users:', stats.bannedUsers);
      console.log('   New users this month:', stats.newUsersThisMonth);
      console.log('   Active rate:', stats.activeRate + '%');
    } else {
      console.log('❌ Get user statistics failed');
      console.log('   Error:', statsResult.error);
    }

    // Test 7: Invalid User ID
    console.log('\n📋 Test 7: Invalid User ID Test');
    const invalidIdResult = await apiRequest('GET', '/admin/users/invalid-id', null, adminToken);
    
    if (!invalidIdResult.success && invalidIdResult.status === 400) {
      console.log('✅ Invalid user ID test passed');
      console.log('   Error code:', invalidIdResult.error.error.code);
    } else {
      console.log('❌ Invalid user ID test failed');
    }

    // Test 8: Unauthorized Access (no token)
    console.log('\n📋 Test 8: Unauthorized Access Test');
    const unauthorizedResult = await apiRequest('GET', '/admin/users');
    
    if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
      console.log('✅ Unauthorized access test passed');
      console.log('   Error code:', unauthorizedResult.error.error.code);
    } else {
      console.log('❌ Unauthorized access test failed');
    }

    // Test 9: Filter Users by Status
    console.log('\n📋 Test 9: Filter Users by Status');
    const filterResult = await apiRequest('GET', '/admin/users?status=active&limit=3', null, adminToken);
    
    if (filterResult.success && filterResult.data.success) {
      console.log('✅ Filter users by status successful');
      console.log('   Active users found:', filterResult.data.data.users.length);
      const allActive = filterResult.data.data.users.every(user => user.status === 'active');
      console.log('   All users are active:', allActive);
    } else {
      console.log('❌ Filter users by status failed');
      console.log('   Error:', filterResult.error);
    }

    console.log('\n🎉 User Management API tests completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting User Management API Tests...\n');
  
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin login');
    process.exit(1);
  }

  await testUserManagementAPI();
}

main();