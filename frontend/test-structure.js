const fs = require('fs');
const path = require('path');

// 检查必需的文件
const requiredFiles = [
  'app.json',
  'app.js', 
  'app.wxss',
  'sitemap.json',
  'project.config.json'
];

// 检查必需的页面
const requiredPages = [
  'pages/index/index.js',
  'pages/index/index.json',
  'pages/index/index.wxml',
  'pages/index/index.wxss',
  'pages/detail/detail.js',
  'pages/detail/detail.json',
  'pages/detail/detail.wxml',
  'pages/detail/detail.wxss',
  'pages/event/event.js',
  'pages/event/event.json',
  'pages/event/event.wxml',
  'pages/event/event.wxss',
  'pages/user/user.js',
  'pages/user/user.json',
  'pages/user/user.wxml',
  'pages/user/user.wxss',
  'pages/login/login.js',
  'pages/login/login.json',
  'pages/login/login.wxml',
  'pages/login/login.wxss',
  'pages/event-create/event-create.js',
  'pages/event-create/event-create.json',
  'pages/event-create/event-create.wxml',
  'pages/event-create/event-create.wxss'
];

// 检查必需的组件
const requiredComponents = [
  'components/loading/loading.js',
  'components/loading/loading.json',
  'components/loading/loading.wxml',
  'components/loading/loading.wxss',
  'components/empty/empty.js',
  'components/empty/empty.json',
  'components/empty/empty.wxml',
  'components/empty/empty.wxss',
  'components/match-card/match-card.js',
  'components/match-card/match-card.json',
  'components/match-card/match-card.wxml',
  'components/match-card/match-card.wxss'
];

// 检查必需的工具文件
const requiredUtils = [
  'utils/api.js',
  'utils/auth.js',
  'utils/util.js'
];

console.log('🔍 检查项目结构...\n');

// 检查根目录文件
console.log('📁 根目录文件:');
let allPassed = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allPassed = false;
});

console.log('\n📄 页面文件:');
requiredPages.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allPassed = false;
});

console.log('\n🧩 组件文件:');
requiredComponents.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allPassed = false;
});

console.log('\n🛠️ 工具文件:');
requiredUtils.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allPassed = false;
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 项目结构检查通过！可以启动微信开发者工具了。');
} else {
  console.log('❌ 项目结构检查失败，请检查缺失的文件。');
}
console.log('='.repeat(50)); 