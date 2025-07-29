// 直接通过API创建测试比赛数据
const https = require('https');

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zero729-wxapp-tennis.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { error: 'Invalid JSON', raw: responseData }
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createTestMatches() {
  console.log('🏆 开始创建测试比赛数据...\n');

  try {
    // 1. 先获取现有赛事
    console.log('1️⃣ 获取现有赛事...');
    const eventsResponse = await makeRequest('/api/events');
    
    if (!eventsResponse.data.data || eventsResponse.data.data.length === 0) {
      console.log('❌ 没有找到赛事数据');
      return;
    }
    
    const events = eventsResponse.data.data;
    console.log(`✅ 找到 ${events.length} 个赛事`);
    
    // 2. 为每个赛事创建比赛数据
    console.log('\n2️⃣ 开始创建比赛数据...');
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\n为赛事 "${event.name}" 创建比赛...`);
      
      // 创建3场比赛
      for (let j = 0; j < 3; j++) {
        const matchData = {
          eventId: event._id,
          eventType: event.eventType,
          status: ['报名中', '比赛中', '已结束'][j],
          stage: '第一轮',
          venue: event.venue,
          region: event.region,
          scheduledTime: new Date(Date.now() + (j * 24 * 60 * 60 * 1000)).toISOString(),
          isLive: j === 1,
          players: {
            team1: { 
              name: `选手${i * 3 + j + 1}`, 
              ranking: 10 + j 
            },
            team2: { 
              name: `选手${i * 3 + j + 2}`, 
              ranking: 15 + j 
            }
          },
          organizer: event.organizer,
          spectators: [],
          score: { sets: [], winner: null },
          statistics: { duration: null, totalGames: 0 },
          tags: event.tags || [],
          isPublic: true
        };
        
        // 尝试通过POST请求创建比赛
        const createResponse = await makeRequest('/api/matches', 'POST', matchData);
        
        if (createResponse.status === 201 || createResponse.status === 200) {
          console.log(`  ✅ 创建比赛 ${j + 1}: ${matchData.status}`);
        } else {
          console.log(`  ❌ 创建比赛失败 (${createResponse.status}):`, createResponse.data.message || '未知错误');
        }
      }
    }
    
    // 3. 验证创建结果
    console.log('\n3️⃣ 验证创建结果...');
    const matchesResponse = await makeRequest('/api/matches');
    console.log(`✅ 当前比赛总数: ${matchesResponse.data.data?.length || 0}`);
    
    if (matchesResponse.data.data && matchesResponse.data.data.length > 0) {
      console.log('🎉 比赛数据创建成功！');
      console.log('前几场比赛:');
      matchesResponse.data.data.slice(0, 3).forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.eventType} - ${match.status} - ${match.venue}`);
      });
    } else {
      console.log('❌ 比赛数据创建失败或查询有问题');
    }

  } catch (error) {
    console.error('❌ 创建过程失败:', error.message);
  }
}

createTestMatches();
