#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 启动网球热后端服务 (智能连接模式)...\n');

// 检查网络连接
async function checkNetworkConnection() {
  const dns = require('dns');
  const { promisify } = require('util');
  const dnsLookup = promisify(dns.lookup);
  
  try {
    await dnsLookup('cluster0.migjfbu.mongodb.net');
    console.log('✅ 网络连接正常，将使用 MongoDB Atlas');
    return 'atlas';
  } catch (error) {
    console.log('⚠️ 无法连接到 MongoDB Atlas，将使用本地 MongoDB');
    console.log('💡 请确保本地 MongoDB 正在运行');
    return 'local';
  }
}

// 启动服务器
async function startServer() {
  const connectionType = await checkNetworkConnection();
  
  let envFile = '.env';
  if (connectionType === 'local') {
    envFile = '.env.local';
    console.log('📝 使用本地环境配置文件: .env.local');
  } else {
    console.log('📝 使用默认环境配置文件: .env');
  }
  
  // 检查环境文件是否存在
  const envPath = path.join(__dirname, '..', envFile);
  if (!fs.existsSync(envPath)) {
    console.error(`❌ 环境配置文件 ${envFile} 不存在`);
    process.exit(1);
  }
  
  // 设置环境变量
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  
  // 启动服务器
  const serverProcess = spawn('node', ['src/app.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_CONFIG_ENV: envFile.replace('.env', '').replace('.', '') || 'default'
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`\n🛑 服务器停止，退出代码: ${code}`);
  });
  
  serverProcess.on('error', (err) => {
    console.error('❌ 启动服务器失败:', err);
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务器...');
    serverProcess.kill('SIGTERM');
  });
}

// 显示帮助信息
function showHelp() {
  console.log('📋 网络问题解决方案:');
  console.log('');
  console.log('1. 🌐 检查网络连接');
  console.log('   - 确保网络连接稳定');
  console.log('   - 尝试访问其他网站测试网络');
  console.log('');
  console.log('2. 🔧 DNS 问题解决');
  console.log('   - 尝试更换DNS服务器 (8.8.8.8, 1.1.1.1)');
  console.log('   - 清除DNS缓存: ipconfig /flushdns');
  console.log('');
  console.log('3. 🛡️ 防火墙和代理');
  console.log('   - 检查防火墙设置');
  console.log('   - 暂时关闭VPN或代理');
  console.log('');
  console.log('4. 📱 使用手机热点测试');
  console.log('   - 连接手机热点测试网络环境');
  console.log('');
  console.log('5. 🏠 本地 MongoDB 安装');
  console.log('   - 下载并安装 MongoDB Community Server');
  console.log('   - 启动本地 MongoDB 服务');
  console.log('   - 使用 .env.local 配置文件');
  console.log('');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  try {
    await startServer();
  } catch (error) {
    console.error('❌ 启动失败:', error);
    console.log('\n💡 运行 node scripts/start-with-fallback.js --help 查看解决方案');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}