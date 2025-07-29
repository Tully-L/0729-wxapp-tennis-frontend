const http = require('http');

// 模拟有效的JWT token（仅用于测试）
const mockValidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWE5YzJmNzEyMzQ1Njc4OTAxMjM0NTYiLCJpYXQiOjE3MzE5MjgwMDAsImV4cCI6MTczMjUzMjgwMH0.mock_signature';

// 测试创建赛事（带有效认证）
function testCreateEventWithAuth() {
  const postData = JSON.stringify({
    name: '测试网球赛事',
    eventType: '男子单打',
    venue: '中央球场',
    region: '北京',
    eventDate: '2024-08-15T10:00:00.000Z',
    registrationDeadline: '2024-08-10T23:59:59.000Z',
    description: '这是一个测试赛事',
    maxParticipants: 32,
    registrationFee: 100,
    tags: ['测试', '网球']
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${mockValidToken}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Create event with auth status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📋 Create event response:', response);
      } catch (error) {
        console.log('📋 Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Create event failed:', err.message);
  });

  req.write(postData);
  req.end();
}

// 测试获取真实存在的赛事详情
function testGetRealEventDetail() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/events/1', // 使用模拟数据中的真实ID
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Get real event detail status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📋 Real event detail response:', response);
      } catch (error) {
        console.log('📋 Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Get real event detail failed:', err.message);
  });

  req.end();
}

// 测试带查询参数的获取赛事列表
function testGetEventsWithParams() {
  const queryParams = new URLSearchParams({
    status: 'registration',
    eventType: '男子单打',
    page: '1',
    limit: '5'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/events?${queryParams.toString()}`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Get events with params status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📋 Events with params response:', response);
      } catch (error) {
        console.log('📋 Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Get events with params failed:', err.message);
  });

  req.end();
}

// 运行测试
console.log('🧪 Starting Authenticated Events API tests...\n');

setTimeout(() => {
  console.log('1️⃣ Testing get events with query parameters...');
  testGetEventsWithParams();
}, 1000);

setTimeout(() => {
  console.log('\n2️⃣ Testing create event with authentication...');
  testCreateEventWithAuth();
}, 2000);

setTimeout(() => {
  console.log('\n3️⃣ Testing get real event detail...');
  testGetRealEventDetail();
}, 3000); 