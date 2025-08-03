const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testWechatLogin() {
    console.log('🧪 测试微信登录API...');
    
    try {
        // 测试基础微信登录
        const mockData = {
            code: '0c1ZmqFa1oQc3K0MrTFa1V8VLp4ZmqFo',
            userInfo: {
                nickName: '测试用户',
                avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/test.jpg',
                gender: 1,
                country: '中国',
                province: '广东',
                city: '深圳'
            },
            loginType: 'wechat'
        };
        
        console.log('📤 发送登录请求...');
        console.log('请求数据:', JSON.stringify(mockData, null, 2));
        
        const response = await axios.post(`${API_BASE}/auth/login`, mockData, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });
        
        console.log('✅ 登录成功!');
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ 登录失败!');
        if (error.response) {
            console.log('错误状态:', error.response.status);
            console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('网络错误:', error.message);
        } else {
            console.log('其他错误:', error.message);
        }
    }
}

async function testHealthCheck() {
    console.log('🏥 测试健康检查API...');
    
    try {
        const response = await axios.get(`${API_BASE.replace('/api', '')}/health`, {
            timeout: 5000
        });
        
        console.log('✅ 健康检查成功!');
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ 健康检查失败!');
        if (error.response) {
            console.log('错误状态:', error.response.status);
            console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('网络错误:', error.message);
        }
    }
}

async function runTests() {
    console.log('🚀 开始API测试...\n');
    
    await testHealthCheck();
    console.log('\n' + '='.repeat(50) + '\n');
    await testWechatLogin();
    
    console.log('\n🏁 测试完成!');
}

// 运行测试
runTests().catch(console.error);
