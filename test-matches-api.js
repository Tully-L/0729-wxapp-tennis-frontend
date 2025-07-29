// 测试比赛API
const https = require('https');

const API_BASE = 'https://zero729-wxapp-tennis.onrender.com/api';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log(`🔍 请求: ${API_BASE + path}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 响应状态: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          console.log('📄 原始响应:', data);
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testMatchesAPI() {
  console.log('🧪 测试比赛API...\n');

  try {
    // 1. 测试基本比赛列表
    console.log('1️⃣ 测试基本比赛列表...');
    const allMatches = await makeRequest('/matches?page=1&limit=10');
    console.log(`✅ 返回比赛数量: ${allMatches.data?.length || 0}`);
    if (allMatches.data && allMatches.data.length > 0) {
      console.log(`📝 第一场比赛: ${allMatches.data[0].eventType} - ${allMatches.data[0].status}`);
    }

    // 2. 测试状态筛选
    console.log('\n2️⃣ 测试状态筛选...');
    const registrationMatches = await makeRequest('/matches?status=报名中&page=1&limit=10');
    console.log(`✅ 报名中的比赛数量: ${registrationMatches.data?.length || 0}`);

    const ongoingMatches = await makeRequest('/matches?status=比赛中&page=1&limit=10');
    console.log(`✅ 比赛中的比赛数量: ${ongoingMatches.data?.length || 0}`);

    const completedMatches = await makeRequest('/matches?status=已结束&page=1&limit=10');
    console.log(`✅ 已结束的比赛数量: ${completedMatches.data?.length || 0}`);

    // 3. 测试实时比赛
    console.log('\n3️⃣ 测试实时比赛...');
    const liveMatches = await makeRequest('/matches/live?limit=5');
    console.log(`✅ 实时比赛数量: ${liveMatches.data?.length || 0}`);

    // 4. 测试前端实际请求的URL
    console.log('\n4️⃣ 测试前端实际请求...');
    const frontendRequest = await makeRequest('/matches?page=1&limit=10&status=报名中&eventType=&player=&region=&venue=');
    console.log(`✅ 前端请求返回比赛数量: ${frontendRequest.data?.length || 0}`);

    console.log('\n🎉 比赛API测试完成！');

  } catch (error) {
    console.error('\n❌ API测试失败:', error.message);
  }
}

testMatchesAPI();
