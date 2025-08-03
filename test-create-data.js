// 测试数据创建脚本
const https = require('https');

const API_BASE = 'https://zero729-wxapp-tennis.onrender.com/api';

// 测试事件数据
const testEvents = [
  {
    title: '温布尔登锦标赛 2024',
    category: 'tennis',
    start_time: '2024-07-01T09:00:00Z',
    end_time: '2024-07-01T18:00:00Z',
    location: '全英俱乐部，伦敦',
    max_participants: 128,
    status: 'published',
    description: '世界顶级网球赛事，草地网球的最高殿堂',
    ext_info: {
      eventType: '男子单打',
      registrationDeadline: '2024-06-15',
      organizer: { name: '温布尔登网球俱乐部' },
      surface: '草地',
      prizePool: 50000,
      registrationFee: 0
    }
  },
  {
    title: '法国网球公开赛 2024',
    category: 'tennis',
    start_time: '2024-05-26T09:00:00Z',
    end_time: '2024-06-09T18:00:00Z',
    location: '罗兰·加洛斯球场，巴黎',
    max_participants: 128,
    status: 'ongoing',
    description: '红土之王的较量，法网公开赛',
    ext_info: {
      eventType: '男子单打',
      registrationDeadline: '2024-05-01',
      organizer: { name: '法国网球协会' },
      surface: '红土',
      prizePool: 45000,
      registrationFee: 100
    }
  },
  {
    title: '澳大利亚网球公开赛 2024',
    category: 'tennis',
    start_time: '2024-01-14T09:00:00Z',
    end_time: '2024-01-28T18:00:00Z',
    location: '墨尔本公园，墨尔本',
    max_participants: 128,
    status: 'ended',
    description: '新年第一个大满贯赛事',
    ext_info: {
      eventType: '男子单打',
      registrationDeadline: '2023-12-15',
      organizer: { name: '澳大利亚网球协会' },
      surface: '硬地',
      prizePool: 55000,
      registrationFee: 150
    }
  }
];

// HTTP请求函数
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 主测试函数
async function testCreateData() {
  console.log('🚀 开始测试数据创建...');
  
  try {
    // 1. 测试健康检查
    console.log('\n1️⃣ 测试健康检查...');
    const health = await makeRequest(`${API_BASE}/../health`);
    console.log('健康检查状态:', health.status);
    if (health.data.database) {
      console.log('数据库连接:', health.data.database.connected);
      console.log('数据大小:', health.data.database.dataSize);
    }

    // 2. 检查现有事件
    console.log('\n2️⃣ 检查现有事件...');
    const existingEvents = await makeRequest(`${API_BASE}/events`);
    console.log('现有事件数量:', existingEvents.data.data?.events?.length || 0);

    // 3. 创建测试事件（不需要认证的话）
    console.log('\n3️⃣ 尝试创建测试事件...');
    for (let i = 0; i < testEvents.length; i++) {
      const event = testEvents[i];
      console.log(`创建事件 ${i + 1}: ${event.title}`);
      
      try {
        const result = await makeRequest(`${API_BASE}/events`, 'POST', event);
        console.log(`  状态: ${result.status}`);
        if (result.status === 201) {
          console.log(`  ✅ 成功创建: ${result.data.data?.title || '未知'}`);
        } else {
          console.log(`  ❌ 创建失败:`, result.data.message || result.data);
        }
      } catch (error) {
        console.log(`  ❌ 请求错误:`, error.message);
      }
    }

    // 4. 再次检查事件
    console.log('\n4️⃣ 检查创建后的事件...');
    const finalEvents = await makeRequest(`${API_BASE}/events`);
    console.log('最终事件数量:', finalEvents.data.data?.events?.length || 0);
    
    if (finalEvents.data.data?.events?.length > 0) {
      console.log('✅ 数据创建成功！');
      finalEvents.data.data.events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title} (${event.status})`);
      });
    } else {
      console.log('❌ 没有创建成功任何事件');
    }

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testCreateData();
