// 测试生产环境API连接
const https = require('https');

const PRODUCTION_API = 'https://zero729-wxapp-tennis.onrender.com';

console.log('🧪 测试生产环境API连接...');
console.log('📍 API地址:', PRODUCTION_API);

// 测试健康检查端点
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zero729-wxapp-tennis.onrender.com',
      port: 443,
      path: '/health',
      method: 'GET',
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ 健康检查响应状态:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('📊 服务器信息:', {
              message: response.message,
              environment: response.environment,
              port: response.port,
              database: response.database?.connected ? '已连接' : '未连接'
            });
            resolve(response);
          } catch (e) {
            console.log('📄 响应内容:', data);
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ 连接错误:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ 请求超时 (30秒)');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 测试API端点
function testApiEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zero729-wxapp-tennis.onrender.com',
      port: 443,
      path: '/test',
      method: 'GET',
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ API测试响应状态:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('🎯 API测试结果:', response);
            resolve(response);
          } catch (e) {
            console.log('📄 响应内容:', data);
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ API测试错误:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ API测试超时 (30秒)');
      req.destroy();
      reject(new Error('API test timeout'));
    });

    req.end();
  });
}

// 执行测试
async function runTests() {
  try {
    console.log('\n1️⃣ 测试健康检查端点...');
    await testHealthCheck();
    
    console.log('\n2️⃣ 测试API端点...');
    await testApiEndpoint();
    
    console.log('\n🎉 所有测试通过！生产环境API正常工作。');
    console.log('💡 前端现在可以正常连接到Render生产环境。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 检查Render服务是否正在运行');
    console.log('2. 确认域名地址是否正确');
    console.log('3. 检查网络连接');
    console.log('4. 等待服务冷启动完成 (首次访问可能需要30秒)');
  }
}

runTests();
