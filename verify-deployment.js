#!/usr/bin/env node

/**
 * 网球小程序部署验证脚本
 * Tennis WeChat Mini-Program Deployment Verification Script
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}🎾 ${msg}${colors.reset}`)
};

// 验证结果
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// 添加验证结果
function addResult(type, category, item, status, message = '') {
  results.details.push({ type, category, item, status, message });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else if (status === 'warning') results.warnings++;
}

// 检查文件是否存在
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    addResult('file', 'Frontend', description, 'pass');
    return true;
  } else {
    addResult('file', 'Frontend', description, 'fail', `文件不存在: ${filePath}`);
    return false;
  }
}

// 检查前端文件结构
function verifyFrontendFiles() {
  log.title('验证前端文件结构...');
  
  const frontendFiles = [
    // 核心页面文件
    { path: 'frontend/app.js', desc: '小程序主入口文件' },
    { path: 'frontend/app.json', desc: '小程序配置文件' },
    { path: 'frontend/app.wxss', desc: '全局样式文件' },
    
    // 比赛页面（新的分离式布局）
    { path: 'frontend/pages/match/match.js', desc: '比赛页面逻辑文件' },
    { path: 'frontend/pages/match/match.wxml', desc: '比赛页面模板文件' },
    { path: 'frontend/pages/match/match.wxss', desc: '比赛页面样式文件' },
    { path: 'frontend/pages/match/match.json', desc: '比赛页面配置文件' },
    
    // 详情页面（状态管理）
    { path: 'frontend/pages/detail/detail.js', desc: '详情页面逻辑文件' },
    { path: 'frontend/pages/detail/detail.wxml', desc: '详情页面模板文件' },
    { path: 'frontend/pages/detail/detail.wxss', desc: '详情页面样式文件' },
    { path: 'frontend/pages/detail/detail.json', desc: '详情页面配置文件' },
    
    // 核心组件
    { path: 'frontend/components/match-status/match-status.js', desc: '状态管理组件逻辑' },
    { path: 'frontend/components/match-status/match-status.wxml', desc: '状态管理组件模板' },
    { path: 'frontend/components/match-status/match-status.wxss', desc: '状态管理组件样式' },
    { path: 'frontend/components/match-status/match-status.json', desc: '状态管理组件配置' },
    
    { path: 'frontend/components/score-detail/score-detail.js', desc: '比分详情组件逻辑' },
    { path: 'frontend/components/score-detail/score-detail.wxml', desc: '比分详情组件模板' },
    
    // 工具文件
    { path: 'frontend/utils/api.js', desc: 'API管理工具' },
    { path: 'frontend/utils/constants.js', desc: '常量定义文件' }
  ];
  
  frontendFiles.forEach(file => {
    checkFile(file.path, file.desc);
  });
}

// 检查后端文件结构
function verifyBackendFiles() {
  log.title('验证后端文件结构...');
  
  const backendFiles = [
    // 核心文件
    { path: 'backend/package.json', desc: '后端包配置文件' },
    { path: 'backend/src/app.js', desc: '后端主应用文件' },
    
    // 状态管理相关
    { path: 'backend/src/services/matchStatusService.js', desc: '状态管理服务' },
    { path: 'backend/src/routes/matchStatus.js', desc: '状态管理路由' },
    
    // 核心路由
    { path: 'backend/src/routes/matches.js', desc: '比赛数据路由' },
    { path: 'backend/src/routes/events.js', desc: '赛事数据路由' },
    { path: 'backend/src/routes/auth.js', desc: '认证路由' },
    
    // 模型文件
    { path: 'backend/src/models/Match.js', desc: '比赛数据模型' },
    { path: 'backend/src/models/Event.js', desc: '赛事数据模型' },
    { path: 'backend/src/models/User.js', desc: '用户数据模型' }
  ];
  
  backendFiles.forEach(file => {
    checkFile(file.path, file.desc);
  });
}

// 检查配置文件内容
function verifyConfigurations() {
  log.title('验证配置文件内容...');
  
  // 检查小程序配置
  try {
    const appJsonPath = 'frontend/app.json';
    if (fs.existsSync(appJsonPath)) {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      // 检查页面配置
      const requiredPages = ['pages/match/match', 'pages/detail/detail'];
      const hasAllPages = requiredPages.every(page => appJson.pages.includes(page));
      
      if (hasAllPages) {
        addResult('config', 'Frontend', '小程序页面配置', 'pass');
      } else {
        addResult('config', 'Frontend', '小程序页面配置', 'fail', '缺少必要页面配置');
      }
      
      // 检查组件配置
      if (appJson.usingComponents) {
        addResult('config', 'Frontend', '全局组件配置', 'pass');
      } else {
        addResult('config', 'Frontend', '全局组件配置', 'warning', '未配置全局组件');
      }
    }
  } catch (error) {
    addResult('config', 'Frontend', '小程序配置解析', 'fail', error.message);
  }
  
  // 检查详情页面组件注册
  try {
    const detailJsonPath = 'frontend/pages/detail/detail.json';
    if (fs.existsSync(detailJsonPath)) {
      const detailJson = JSON.parse(fs.readFileSync(detailJsonPath, 'utf8'));
      
      if (detailJson.usingComponents && detailJson.usingComponents['match-status']) {
        addResult('config', 'Frontend', '状态管理组件注册', 'pass');
      } else {
        addResult('config', 'Frontend', '状态管理组件注册', 'fail', '状态管理组件未注册');
      }
    }
  } catch (error) {
    addResult('config', 'Frontend', '详情页面配置解析', 'fail', error.message);
  }
}

// 检查API端点
function verifyAPIEndpoints() {
  return new Promise((resolve) => {
    log.title('验证API端点...');
    
    const endpoints = [
      { path: '/api/health', desc: 'API健康检查' },
      { path: '/api/info', desc: 'API信息端点' },
      { path: '/health', desc: '服务健康检查' }
    ];
    
    let completed = 0;
    const total = endpoints.length;
    
    endpoints.forEach(endpoint => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: endpoint.path,
        method: 'GET',
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          addResult('api', 'Backend', endpoint.desc, 'pass');
        } else {
          addResult('api', 'Backend', endpoint.desc, 'fail', `HTTP ${res.statusCode}`);
        }
        
        completed++;
        if (completed === total) resolve();
      });
      
      req.on('error', (error) => {
        addResult('api', 'Backend', endpoint.desc, 'fail', `连接失败: ${error.message}`);
        completed++;
        if (completed === total) resolve();
      });
      
      req.on('timeout', () => {
        addResult('api', 'Backend', endpoint.desc, 'fail', '请求超时');
        req.destroy();
        completed++;
        if (completed === total) resolve();
      });
      
      req.end();
    });
  });
}

// 检查关键功能实现
function verifyKeyFeatures() {
  log.title('验证关键功能实现...');
  
  // 检查分离式布局实现
  try {
    const matchWxmlPath = 'frontend/pages/match/match.wxml';
    if (fs.existsSync(matchWxmlPath)) {
      const content = fs.readFileSync(matchWxmlPath, 'utf8');
      
      if (content.includes('main-content') && content.includes('match-data-section') && content.includes('hot-registration-section')) {
        addResult('feature', 'Frontend', '分离式布局实现', 'pass');
      } else {
        addResult('feature', 'Frontend', '分离式布局实现', 'fail', '布局结构不完整');
      }
    }
  } catch (error) {
    addResult('feature', 'Frontend', '分离式布局检查', 'fail', error.message);
  }
  
  // 检查状态管理功能
  try {
    const matchStatusJsPath = 'frontend/components/match-status/match-status.js';
    if (fs.existsSync(matchStatusJsPath)) {
      const content = fs.readFileSync(matchStatusJsPath, 'utf8');
      
      if (content.includes('updateStatus') && content.includes('onStatusUpdated')) {
        addResult('feature', 'Frontend', '状态管理功能', 'pass');
      } else {
        addResult('feature', 'Frontend', '状态管理功能', 'fail', '状态管理方法缺失');
      }
    }
  } catch (error) {
    addResult('feature', 'Frontend', '状态管理检查', 'fail', error.message);
  }
  
  // 检查API增强功能
  try {
    const apiJsPath = 'frontend/utils/api.js';
    if (fs.existsSync(apiJsPath)) {
      const content = fs.readFileSync(apiJsPath, 'utf8');
      
      if (content.includes('getHotRegistrations') && content.includes('updateMatchStatus')) {
        addResult('feature', 'Frontend', 'API增强功能', 'pass');
      } else {
        addResult('feature', 'Frontend', 'API增强功能', 'fail', '新增API方法缺失');
      }
    }
  } catch (error) {
    addResult('feature', 'Frontend', 'API功能检查', 'fail', error.message);
  }
}

// 生成验证报告
function generateReport() {
  log.title('生成验证报告...');
  
  const reportContent = `
# 网球小程序部署验证报告

## 验证概要
- **验证时间**: ${new Date().toISOString()}
- **通过项目**: ${results.passed}
- **失败项目**: ${results.failed}
- **警告项目**: ${results.warnings}
- **总计项目**: ${results.passed + results.failed + results.warnings}
- **通过率**: ${((results.passed / (results.passed + results.failed + results.warnings)) * 100).toFixed(1)}%

## 详细结果

${results.details.map(item => {
  const status = item.status === 'pass' ? '✅' : item.status === 'fail' ? '❌' : '⚠️';
  return `${status} **${item.category}** - ${item.item}${item.message ? ` (${item.message})` : ''}`;
}).join('\n')}

## 部署状态

${results.failed === 0 ? '🎉 **部署验证通过！** 所有关键功能正常工作。' : '⚠️ **部署验证失败！** 请修复上述问题后重新验证。'}

## 下一步操作

${results.failed === 0 ? `
1. 打开微信开发者工具
2. 导入 frontend 目录
3. 配置小程序AppID
4. 开始用户测试

参考文档：
- 部署指南：DEPLOYMENT_GUIDE.md
- 用户测试清单：USER_TEST_CHECKLIST.md
` : `
1. 修复上述失败项目
2. 重新运行验证脚本
3. 确保所有测试通过后再进行部署

修复建议：
- 检查文件路径是否正确
- 确认后端服务是否启动
- 验证配置文件格式是否正确
`}

---
*验证脚本版本: 1.0.0*
`;

  const reportPath = `deployment-verification-${new Date().toISOString().slice(0, 10)}.md`;
  fs.writeFileSync(reportPath, reportContent);
  
  log.success(`验证报告已生成: ${reportPath}`);
  return reportPath;
}

// 主验证函数
async function runVerification() {
  console.log(`${colors.cyan}
🎾 网球小程序部署验证脚本
================================
${colors.reset}`);
  
  try {
    // 运行各项验证
    verifyFrontendFiles();
    verifyBackendFiles();
    verifyConfigurations();
    verifyKeyFeatures();
    await verifyAPIEndpoints();
    
    // 生成报告
    const reportPath = generateReport();
    
    // 显示结果
    console.log(`\n${colors.cyan}验证完成！${colors.reset}`);
    console.log(`通过: ${colors.green}${results.passed}${colors.reset}`);
    console.log(`失败: ${colors.red}${results.failed}${colors.reset}`);
    console.log(`警告: ${colors.yellow}${results.warnings}${colors.reset}`);
    
    if (results.failed === 0) {
      log.success('🎉 部署验证通过！可以开始用户测试。');
      console.log(`\n${colors.blue}下一步：${colors.reset}`);
      console.log('1. 打开微信开发者工具');
      console.log('2. 导入 frontend 目录');
      console.log('3. 按照 USER_TEST_CHECKLIST.md 进行测试');
    } else {
      log.error('❌ 部署验证失败！请修复问题后重新验证。');
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`验证过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行验证
if (require.main === module) {
  runVerification();
}

module.exports = { runVerification };
