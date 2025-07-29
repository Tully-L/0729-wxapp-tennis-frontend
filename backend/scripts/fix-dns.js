#!/usr/bin/env node

const dns = require('dns');

console.log('🔧 配置DNS服务器...');

// 设置备用DNS服务器
dns.setServers([
  '8.8.8.8',      // Google DNS
  '8.8.4.4',      // Google DNS 备用
  '1.1.1.1',      // Cloudflare DNS
  '1.0.0.1',      // Cloudflare DNS 备用
  '114.114.114.114', // 114 DNS (中国)
  '223.5.5.5'     // 阿里DNS (中国)
]);

console.log('✅ DNS服务器已配置为:');
dns.getServers().forEach((server, index) => {
  console.log(`   ${index + 1}. ${server}`);
});

// 测试DNS解析
const hostname = 'cluster0.migjfbu.mongodb.net';
console.log(`\n🔍 测试解析 ${hostname}...`);

dns.lookup(hostname, (err, address, family) => {
  if (err) {
    console.error('❌ DNS解析仍然失败:', err.message);
    console.log('\n💡 其他解决方案:');
    console.log('1. 检查网络连接');
    console.log('2. 尝试关闭VPN');
    console.log('3. 检查防火墙设置');
    console.log('4. 使用手机热点测试');
    console.log('5. 联系网络管理员');
  } else {
    console.log(`✅ DNS解析成功: ${address} (IPv${family})`);
    console.log('\n🚀 现在可以尝试启动服务器了!');
  }
});

module.exports = { fixDNS: () => dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']) };