const https = require('https');
const fs = require('fs');

// 简单的 .env 文件解析
function loadEnv() {
  try {
    const envContent = fs.readFileSync('./backend/.env', 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    console.error('读取 .env 文件失败:', error.message);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testWechatToken() {
  try {
    // 加载环境变量
    loadEnv();
    
    console.log('测试微信 access_token 获取...');
    console.log('AppID:', process.env.WECHAT_APP_ID);
    console.log('AppSecret:', process.env.WECHAT_APP_SECRET ? '已配置' : '未配置');
    
    if (!process.env.WECHAT_APP_SECRET || process.env.WECHAT_APP_SECRET === 'your_actual_app_secret_here') {
      console.error('❌ AppSecret 未正确配置，请先在 .env 文件中设置真实的 WECHAT_APP_SECRET');
      return;
    }
    
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}`;
    
    console.log('请求 URL:', url.replace(process.env.WECHAT_APP_SECRET, '***'));
    
    const response = await makeRequest(url);
    
    console.log('API 响应:', response);
    
    if (response.access_token) {
      console.log('✅ access_token 获取成功!');
      console.log('Token:', response.access_token.substring(0, 20) + '...');
      console.log('过期时间:', response.expires_in, '秒');
    } else {
      console.error('❌ 获取 access_token 失败:', response);
      
      // 常见错误码说明
      if (response.errcode) {
        const errorMessages = {
          40013: 'AppID 无效',
          40001: 'AppSecret 无效',
          40002: '不合法的凭证类型',
          40164: 'IP 地址不在白名单中'
        };
        
        console.error('错误说明:', errorMessages[response.errcode] || '未知错误');
      }
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testWechatToken();