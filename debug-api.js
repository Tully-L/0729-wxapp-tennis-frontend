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
    console.log('完整响应:', JSON.stringify(allMatches, null, 2));

    // 4. 检查前端实际请求
    console.log('\n4️⃣ 检查前端实际请求...');
    const frontendMatches = await makeRequest('/api/matches?page=1&limit=10&status=报名中');
    console.log(`前端请求返回: ${frontendMatches.data?.length || 0} 个比赛`);

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugAPI();
