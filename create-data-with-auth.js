// 完整的认证和数据创建脚本
const https = require('https');

const API_BASE = 'https://zero729-wxapp-tennis.onrender.com/api';

// HTTP请求函数
function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script',
        ...headers
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
          resolve({ status: res.statusCode, data: result, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

// 模拟微信登录获取token
async function getAuthToken() {
  console.log('🔑 尝试获取认证token...');
  
  // 模拟微信登录数据
  const mockWechatData = {
    code: 'mock_wx_code_' + Date.now(),
    userInfo: {
      nickName: '测试用户',
      avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrUx7SBp1xGcHebTXS1AiaVVKVibKt8h1XiaN6CIVGu2cj2GDcHBL4JIa1CJicQn7ZibGKOLd1CgC1TA/132',
      gender: 1,
      country: '中国',
      province: '北京',
      city: '北京'
    }
  };

  try {
    const result = await makeRequest(`${API_BASE}/auth/wechat-login`, 'POST', mockWechatData);
    console.log('登录响应状态:', result.status);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ 登录成功');
      return result.data.data.accessToken;
    } else {
      console.log('❌ 登录失败:', result.data.message || result.data);
      return null;
    }
  } catch (error) {
    console.log('❌ 登录请求错误:', error.message);
    return null;
  }
}

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
    description: '世界顶级网球赛事，草地网球的最高殿堂'
  },
  {
    title: '法国网球公开赛 2024',
    category: 'tennis',
    start_time: '2024-05-26T09:00:00Z',
    end_time: '2024-06-09T18:00:00Z',
    location: '罗兰·加洛斯球场，巴黎',
    max_participants: 128,
    status: 'ongoing',
    description: '红土之王的较量，法网公开赛'
  },
  {
    title: '澳大利亚网球公开赛 2024',
    category: 'tennis',
    start_time: '2024-01-14T09:00:00Z',
    end_time: '2024-01-28T18:00:00Z',
    location: '墨尔本公园，墨尔本',
    max_participants: 128,
    status: 'ended',
    description: '新年第一个大满贯赛事'
  }
];

// 主函数
async function main() {
  console.log('🚀 开始完整的认证和数据创建流程...\n');
  
  try {
    // 1. 健康检查
    console.log('1️⃣ 健康检查...');
    const health = await makeRequest(`${API_BASE}/../health`);
    console.log('API状态:', health.status === 200 ? '✅ 正常' : '❌ 异常');
    
    // 2. 获取认证token
    console.log('\n2️⃣ 获取认证token...');
    const token = await getAuthToken();
    
    if (!token) {
      console.log('❌ 无法获取token，尝试不使用认证创建数据...\n');
    } else {
      console.log('✅ 获取到token:', token.substring(0, 20) + '...\n');
    }
    
    // 3. 检查现有事件
    console.log('3️⃣ 检查现有事件...');
    const existingEvents = await makeRequest(`${API_BASE}/events`);
    const currentCount = existingEvents.data.data?.events?.length || 0;
    console.log('现有事件数量:', currentCount);
    
    // 4. 创建事件
    console.log('\n4️⃣ 创建测试事件...');
    let successCount = 0;
    
    for (let i = 0; i < testEvents.length; i++) {
      const event = testEvents[i];
      console.log(`\n创建事件 ${i + 1}: ${event.title}`);
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      try {
        const result = await makeRequest(`${API_BASE}/events`, 'POST', event, headers);
        console.log(`状态: ${result.status}`);
        
        if (result.status === 201 || result.status === 200) {
          console.log('✅ 创建成功');
          successCount++;
        } else {
          console.log('❌ 创建失败:', result.data.message || result.data);
        }
      } catch (error) {
        console.log('❌ 请求错误:', error.message);
      }
    }
    
    // 5. 验证结果
    console.log('\n5️⃣ 验证创建结果...');
    const finalEvents = await makeRequest(`${API_BASE}/events`);
    const finalCount = finalEvents.data.data?.events?.length || 0;
    
    console.log(`\n📊 创建结果统计:`);
    console.log(`- 尝试创建: ${testEvents.length} 个事件`);
    console.log(`- 成功创建: ${successCount} 个事件`);
    console.log(`- 数据库中事件总数: ${finalCount} 个`);
    
    if (finalCount > currentCount) {
      console.log('\n🎉 数据创建成功！');
      if (finalEvents.data.data?.events?.length > 0) {
        console.log('\n📋 当前事件列表:');
        finalEvents.data.data.events.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.title} (${event.status})`);
        });
      }
    } else {
      console.log('\n❌ 没有成功创建新事件');
    }
    
  } catch (error) {
    console.error('\n❌ 流程执行出错:', error);
  }
}

// 运行主函数
main();
