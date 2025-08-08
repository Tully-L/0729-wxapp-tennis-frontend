require('dotenv').config();
const jwt = require('jsonwebtoken');
const { connectDB } = require('./src/config/database');
const User = require('./src/models/User');
const { adminAuth, superAdminAuth, requireRole } = require('./src/middleware/adminAuth');

// Mock Express request and response objects
const createMockReq = (token, ip = '127.0.0.1') => ({
  header: (name) => {
    if (name === 'Authorization') {
      return token ? `Bearer ${token}` : null;
    }
    return null;
  },
  ip: ip,
  method: 'GET',
  path: '/test',
  get: (header) => header === 'User-Agent' ? 'Test-Agent' : null
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

async function testAdminAuth() {
  try {
    await connectDB();
    console.log('🧪 Testing Admin Authentication Middleware...\n');

    // Find the admin user
    const admin = await User.findOne({ email: 'admin@tennis.com' });
    if (!admin) {
      console.log('❌ Admin user not found. Please run create-admin-directly.js first.');
      return;
    }

    console.log('✅ Found admin user:', admin.email);

    // Test 1: Valid admin token
    console.log('\n📋 Test 1: Valid admin token');
    const validToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const req1 = createMockReq(validToken);
    const res1 = createMockRes();
    let nextCalled = false;

    await adminAuth(req1, res1, () => {
      nextCalled = true;
    });

    if (nextCalled && req1.user) {
      console.log('✅ Valid token test passed');
      console.log('   User:', req1.user.email);
      console.log('   Role:', req1.adminLevel);
    } else {
      console.log('❌ Valid token test failed');
      console.log('   Response:', res1.data);
    }

    // Test 2: No token
    console.log('\n📋 Test 2: No token provided');
    const req2 = createMockReq(null);
    const res2 = createMockRes();
    nextCalled = false;

    await adminAuth(req2, res2, () => {
      nextCalled = true;
    });

    if (!nextCalled && res2.statusCode === 401) {
      console.log('✅ No token test passed');
      console.log('   Error:', res2.data.error.code);
    } else {
      console.log('❌ No token test failed');
    }

    // Test 3: Invalid token
    console.log('\n📋 Test 3: Invalid token');
    const req3 = createMockReq('invalid-token');
    const res3 = createMockRes();
    nextCalled = false;

    await adminAuth(req3, res3, () => {
      nextCalled = true;
    });

    if (!nextCalled && res3.statusCode === 401) {
      console.log('✅ Invalid token test passed');
      console.log('   Error:', res3.data.error.code);
    } else {
      console.log('❌ Invalid token test failed');
    }

    // Test 4: Expired token
    console.log('\n📋 Test 4: Expired token');
    const expiredToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' } // Already expired
    );

    const req4 = createMockReq(expiredToken);
    const res4 = createMockRes();
    nextCalled = false;

    await adminAuth(req4, res4, () => {
      nextCalled = true;
    });

    if (!nextCalled && res4.statusCode === 401) {
      console.log('✅ Expired token test passed');
      console.log('   Error:', res4.data.error.code);
    } else {
      console.log('❌ Expired token test failed');
    }

    // Test 5: Super admin auth
    console.log('\n📋 Test 5: Super admin authentication');
    const req5 = createMockReq(validToken);
    const res5 = createMockRes();
    nextCalled = false;

    await superAdminAuth(req5, res5, () => {
      nextCalled = true;
    });

    if (nextCalled && req5.user && req5.user.role === 'super_admin') {
      console.log('✅ Super admin test passed');
    } else {
      console.log('❌ Super admin test failed');
      console.log('   Response:', res5.data);
    }

    // Test 6: Role-based authorization
    console.log('\n📋 Test 6: Role-based authorization');
    const req6 = createMockReq(validToken);
    const res6 = createMockRes();
    req6.user = admin; // Simulate authenticated user
    nextCalled = false;

    const roleMiddleware = requireRole(['super_admin', 'admin']);
    roleMiddleware(req6, res6, () => {
      nextCalled = true;
    });

    if (nextCalled) {
      console.log('✅ Role-based auth test passed');
    } else {
      console.log('❌ Role-based auth test failed');
      console.log('   Response:', res6.data);
    }

    console.log('\n🎉 Admin authentication middleware tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testAdminAuth();