#!/usr/bin/env node

const dns = require('dns');
const net = require('net');
const { promisify } = require('util');

const dnsResolve = promisify(dns.resolve);
const dnsLookup = promisify(dns.lookup);

async function diagnoseMongoDB() {
  console.log('🔍 MongoDB Atlas 连接诊断工具\n');
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://root:hhmjh2hn@dbprovider.ap-northeast-1.clawcloudrun.com:45365/?directConnection=true';
  const hostname = 'dbprovider.ap-northeast-1.clawcloudrun.com';
  
  console.log('📍 连接字符串:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  console.log('🌐 主机名:', hostname);
  console.log('');

  // 1. DNS 解析测试
  console.log('1️⃣ DNS 解析测试...');
  try {
    const addresses = await dnsLookup(hostname);
    console.log('✅ DNS 解析成功:', addresses);
  } catch (error) {
    console.error('❌ DNS 解析失败:', error.message);
    console.log('💡 建议: 检查网络连接或尝试使用不同的DNS服务器');
    return;
  }

  // 2. SRV 记录查询（MongoDB Atlas 使用 SRV 记录）
  console.log('\n2️⃣ SRV 记录查询...');
  try {
    const srvRecords = await dnsResolve(`_mongodb._tcp.${hostname}`, 'SRV');
    console.log('✅ SRV 记录查询成功:');
    srvRecords.forEach(record => {
      console.log(`   - ${record.name}:${record.port} (优先级: ${record.priority})`);
    });
  } catch (error) {
    console.error('❌ SRV 记录查询失败:', error.message);
  }

  // 3. TXT 记录查询
  console.log('\n3️⃣ TXT 记录查询...');
  try {
    const txtRecords = await dnsResolve(hostname, 'TXT');
    console.log('✅ TXT 记录查询成功:', txtRecords);
  } catch (error) {
    console.error('❌ TXT 记录查询失败:', error.message);
    console.log('💡 这可能是导致连接超时的原因');
  }

  // 4. 端口连接测试
  console.log('\n4️⃣ 端口连接测试...');
  const testPorts = [45365]; // 新MongoDB服务器端口
  
  for (const port of testPorts) {
    try {
      await testConnection(hostname, port);
      console.log(`✅ 端口 ${port} 连接成功`);
    } catch (error) {
      console.log(`❌ 端口 ${port} 连接失败: ${error.message}`);
    }
  }

  // 5. 网络环境检查
  console.log('\n5️⃣ 网络环境检查...');
  console.log('🔍 检查项目:');
  console.log('   - 防火墙设置');
  console.log('   - 代理服务器配置');
  console.log('   - VPN 连接状态');
  console.log('   - 公司网络限制');
  
  // 6. 建议的解决方案
  console.log('\n💡 建议的解决方案:');
  console.log('1. 检查网络连接是否稳定');
  console.log('2. 尝试关闭VPN或代理');
  console.log('3. 检查防火墙设置，确保允许MongoDB端口');
  console.log('4. 尝试使用手机热点测试网络环境');
  console.log('5. 联系网络管理员检查公司网络限制');
  console.log('6. 在MongoDB Atlas控制台检查IP白名单设置');
}

function testConnection(hostname, port, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('连接超时'));
    }, timeout);
    
    socket.connect(port, hostname, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve();
    });
    
    socket.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

// 运行诊断
if (require.main === module) {
  diagnoseMongoDB().catch(console.error);
}

module.exports = { diagnoseMongoDB };