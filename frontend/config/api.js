// API配置文件
// 可以在这里手动切换API地址用于测试

const API_CONFIG = {
  // 生产环境 - Render部署的后端服务
  production: {
    baseURL: 'https://tennis-heat-backend.onrender.com/api',
    name: '生产环境'
  },
  
  // 本地开发环境
  development: {
    baseURL: 'http://localhost:8080/api',
    name: '本地开发'
  },
  
  // 测试环境 (如果有的话)
  staging: {
    baseURL: 'https://tennis-heat-backend-staging.onrender.com/api',
    name: '测试环境'
  }
};

// 当前使用的环境 - 客户要求强制使用生产环境
// 可选值: 'production', 'development', 'staging'
const CURRENT_ENV = 'production'; // 强制使用生产环境(Render)

// 导出配置
module.exports = {
  API_CONFIG,
  CURRENT_ENV,
  getCurrentConfig: () => API_CONFIG[CURRENT_ENV]
};

// 使用说明:
// 1. 在开发时，将 CURRENT_ENV 改为 'development'
// 2. 在生产时，将 CURRENT_ENV 改为 'production'
// 3. 也可以在 utils/api.js 中引入这个配置文件
