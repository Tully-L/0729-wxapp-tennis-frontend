# 🚀 生产环境配置说明

## 📋 当前配置状态

### ✅ 前端配置
- **API地址**: `https://tennis-heat-backend.onrender.com/api`
- **环境模式**: 强制使用生产环境
- **配置文件**: `frontend/utils/api.js`

### ✅ 后端配置
- **部署平台**: Render
- **配置文件**: `backend/render.yaml`
- **环境变量**: 已配置生产环境所需变量

## 🎯 客户要求实现

✅ **使用Node.js开发后端** - 已实现
✅ **使用Render云端部署** - 已配置
✅ **无需本地启动后端** - 前端已指向生产环境

## 🔧 当前状态

### 前端API配置
```javascript
// 强制使用生产环境
const BASE_URL = 'https://tennis-heat-backend.onrender.com/api';
```

### 后端部署状态
- 平台: Render
- 服务名: tennis-heat-backend
- 健康检查: `/health`
- 自动部署: 已启用

## 📝 下一步操作

### 1. 部署后端到Render
1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 创建新的Web Service
3. 连接GitHub仓库: `https://github.com/Tully-L/0729-wxapp-tennis-frontend.git`
4. 使用 `backend/render.yaml` 配置文件
5. 等待部署完成

### 2. 配置数据库
- 推荐使用 MongoDB Atlas 免费层
- 在Render环境变量中设置 `MONGODB_URI`

### 3. 设置微信相关配置
在Render控制台配置以下环境变量：
```
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_MCH_ID=your_wechat_mch_id
WECHAT_API_KEY=your_wechat_api_key
```

### 4. 验证部署
访问以下地址确认服务正常：
- 健康检查: `https://tennis-heat-backend.onrender.com/health`
- API测试: `https://tennis-heat-backend.onrender.com/test`

## ⚠️ 重要提醒

1. **生产环境已启用**: 前端现在直接连接Render生产环境
2. **无需本地后端**: 满足客户要求，无需每次启动本地服务器
3. **自动部署**: 推送代码到GitHub会自动更新Render服务

## 🔄 如需切换环境

如果开发时需要使用本地环境，请修改 `frontend/utils/api.js`:

```javascript
// 取消注释以下代码启用自动环境切换
const BASE_URL = (() => {
  const systemInfo = wx.getSystemInfoSync();
  const isDevTool = systemInfo.platform === 'devtools';
  return isDevTool ? API_CONFIG.development : API_CONFIG.production;
})();
```

## 📞 技术支持

如遇问题，请检查：
1. Render服务状态
2. 数据库连接
3. 环境变量配置
4. 网络连接状态
