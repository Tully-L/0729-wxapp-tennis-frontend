const http = require('http');

// 测试健康检查端点
function testHealthCheck() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Health check status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📋 Response:', JSON.parse(data));
    });
  });

  req.on('error', (err) => {
    console.error('❌ Health check failed:', err.message);
  });

  req.end();
}

// 测试认证端点
function testAuthEndpoint() {
  const postData = JSON.stringify({
    code: 'test_code',
    userInfo: {
      nickName: '测试用户',
      avatarUrl: null,
      gender: 0
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Auth endpoint status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📋 Auth response:', JSON.parse(data));
    });
  });

  req.on('error', (err) => {
    console.error('❌ Auth test failed:', err.message);
  });

  req.write(postData);
  req.end();
}

// 运行测试
console.log('🧪 Starting API tests...\n');

setTimeout(() => {
  console.log('1️⃣ Testing health check endpoint...');
  testHealthCheck();
}, 1000);

setTimeout(() => {
  console.log('\n2️⃣ Testing auth endpoint...');
  testAuthEndpoint();
}, 2000); 