// 快速调试生产环境API
const https = require('https');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zero729-wxapp-tennis.onrender.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function debugAPI() {
  console.log('🔍 快速调试生产环境API...\n');

  try {
    // 1. 检查健康状态
    console.log('1️⃣ 检查健康状态...');
    const health = await makeRequest('/health');
    console.log(`数据库: ${health.database?.database}, 集合数: ${health.database?.collections}`);

    // 2. 检查赛事数据
    console.log('\n2️⃣ 检查赛事数据...');
    const events = await makeRequest('/api/events');
    console.log(`赛事API返回: ${events.data?.length || 0} 个赛事`);
    if (events.data && events.data.length > 0) {
      console.log(`第一个赛事: ${events.data[0].name}`);
    }

    // 3. 检查比赛数据 - 不带任何参数
    console.log('\n3️⃣ 检查比赛数据（无参数）...');
    const allMatches = await makeRequest('/api/matches');
    console.log(`比赛API返回: ${allMatches.data?.length || 0} 个比赛`);

    // 4. 测试创建比赛端点
    console.log('\n4️⃣ 测试创建比赛端点...');
    const createResponse = await makeRequest('/dev/create-matches', 'POST');
    console.log('创建比赛响应:', JSON.stringify(createResponse, null, 2));

    // 5. 再次检查比赛数据
    console.log('\n5️⃣ 创建后再次检查比赛数据...');
    const newMatches = await makeRequest('/api/matches');
    console.log(`比赛API返回: ${newMatches.data?.length || 0} 个比赛`);

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zero729-wxapp-tennis.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (method === 'POST') {
      req.write('{}');
    }
    req.end();
  });
}

debugAPI();
