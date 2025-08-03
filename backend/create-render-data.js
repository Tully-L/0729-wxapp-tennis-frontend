// 通过Render后端API创建测试数据
const https = require('https');

const BASE_URL = 'https://zero729-wxapp-tennis.onrender.com';

// 发送HTTP请求的工具函数
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Admin Script'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
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

// 创建测试事件数据
async function createTestEvents() {
  console.log('🎾 开始创建测试事件...');

  const events = [
    {
      title: '温布尔登锦标赛 2024',
      category: '网球比赛',
      start_time: '2024-07-01T09:00:00.000Z',
      end_time: '2024-07-01T18:00:00.000Z',
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
      category: '网球比赛',
      start_time: '2024-05-26T09:00:00.000Z',
      end_time: '2024-06-09T18:00:00.000Z',
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
      category: '网球比赛',
      start_time: '2024-01-14T09:00:00.000Z',
      end_time: '2024-01-28T18:00:00.000Z',
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
    },
    {
      title: '上海大师赛 2024',
      category: '网球比赛',
      start_time: '2024-10-05T09:00:00.000Z',
      end_time: '2024-10-13T18:00:00.000Z',
      location: '上海旗忠森林体育城',
      max_participants: 64,
      status: 'published',
      description: '亚洲最高级别的网球赛事',
      ext_info: {
        eventType: '男子单打',
        registrationDeadline: '2024-09-15',
        organizer: { name: '上海网球协会' },
        surface: '硬地',
        prizePool: 35000,
        registrationFee: 200
      }
    },
    {
      title: '北京网球公开赛 2024',
      category: '网球比赛',
      start_time: '2024-09-25T09:00:00.000Z',
      end_time: '2024-10-06T18:00:00.000Z',
      location: '北京国家网球中心',
      max_participants: 96,
      status: 'published',
      description: '中国最具影响力的网球赛事',
      ext_info: {
        eventType: '男女混合',
        registrationDeadline: '2024-09-01',
        organizer: { name: '中国网球协会' },
        surface: '硬地',
        prizePool: 28000,
        registrationFee: 150
      }
    }
  ];

  // 由于需要认证，我们直接通过数据库操作
  // 这里我们使用一个特殊的管理员端点（如果存在）
  try {
    // 先检查是否有管理员端点
    console.log('📊 检查当前事件数量...');
    const currentEvents = await makeRequest('GET', '/api/events');
    console.log(`当前事件数量: ${currentEvents.data.length || 0}`);

    if (currentEvents.data.length === 0) {
      console.log('🔧 数据库为空，需要创建测试数据');
      console.log('💡 建议：在Render控制台中添加一个管理员脚本来创建数据');
      
      // 输出可以在Render控制台执行的脚本
      console.log('\n📝 在Render控制台执行以下脚本:');
      console.log('='.repeat(50));
      console.log(`
// 在Render控制台的Node.js环境中执行
const mongoose = require('mongoose');
const Event = require('./src/models/Event');

async function createData() {
  const events = ${JSON.stringify(events, null, 2)};
  
  for (const eventData of events) {
    const event = new Event(eventData);
    await event.save();
    console.log('✅ 创建事件:', event.title);
  }
  
  console.log('🎉 所有测试数据创建完成!');
}

createData().catch(console.error);
`);
      console.log('='.repeat(50));
    } else {
      console.log('✅ 数据库已有数据，无需创建');
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  }
}

// 验证API功能
async function verifyAPIs() {
  console.log('\n🧪 验证API功能...');

  try {
    // 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await makeRequest('GET', '/health');
    console.log('✅ 健康检查通过:', health.message);

    // 测试事件列表
    console.log('2. 测试事件列表...');
    const events = await makeRequest('GET', '/api/events');
    console.log(`✅ 事件列表API正常，返回 ${events.data.length} 个事件`);

    // 测试API信息
    console.log('3. 测试API信息...');
    const info = await makeRequest('GET', '/api/info');
    console.log('✅ API信息获取成功');

    console.log('\n🎉 所有API测试通过！');

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始Render数据创建和验证...\n');
  
  await createTestEvents();
  await verifyAPIs();
  
  console.log('\n✅ 操作完成！');
}

main().catch(console.error);
