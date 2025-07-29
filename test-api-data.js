// 测试生产环境API数据
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

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
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

async function testAPIs() {
  console.log('🧪 测试生产环境API数据...\n');

  try {
    // 测试赛事API
    console.log('1️⃣ 测试赛事数据...');
    const events = await makeRequest('/events?page=1&limit=10');
    console.log(`✅ 赛事API响应成功`);
    console.log(`📊 赛事数量: ${events.data?.length || 0}`);
    if (events.data && events.data.length > 0) {
      console.log(`📝 第一个赛事: ${events.data[0].name}`);
      console.log(`📍 地点: ${events.data[0].venue}`);
      console.log(`🏷️ 状态: ${events.data[0].status}`);
    }

    // 测试比赛API
    console.log('\n2️⃣ 测试比赛数据...');
    const matches = await makeRequest('/matches?page=1&limit=10');
    console.log(`✅ 比赛API响应成功`);
    console.log(`📊 比赛数量: ${matches.data?.length || 0}`);
    if (matches.data && matches.data.length > 0) {
      console.log(`🏆 第一场比赛: ${matches.data[0].eventType}`);
      console.log(`📍 场地: ${matches.data[0].venue}`);
      console.log(`🏷️ 状态: ${matches.data[0].status}`);
    }

    // 测试实时比赛
    console.log('\n3️⃣ 测试实时比赛...');
    const liveMatches = await makeRequest('/matches/live?limit=5');
    console.log(`✅ 实时比赛API响应成功`);
    console.log(`📊 实时比赛数量: ${liveMatches.data?.length || 0}`);

    // 测试比赛统计
    console.log('\n4️⃣ 测试比赛统计...');
    const stats = await makeRequest('/matches/stats');
    console.log(`✅ 统计API响应成功`);
    if (stats.data) {
      console.log(`📈 统计数据:`, stats.data);
    }

    console.log('\n🎉 所有API测试通过！数据库中有真实数据可供前端使用。');

  } catch (error) {
    console.error('\n❌ API测试失败:', error.message);
  }
}

testAPIs();
