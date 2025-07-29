# 🚀 立即部署到Render指南

## 📋 当前状态
- ✅ 后端代码已准备就绪 (Node.js)
- ✅ 部署配置文件已创建 (render.yaml)
- ✅ 前端暂时使用本地环境
- 🔄 需要部署到Render获取真实URL

## 🎯 立即执行步骤

### 第1步：推送代码到GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 第2步：登录Render并部署
1. 访问 [Render Dashboard](https://dashboard.render.com)
2. 使用您的Render账号登录
3. 点击 "New" → "Web Service"
4. 选择 "Build and deploy from a Git repository"
5. 连接GitHub仓库: `https://github.com/Tully-L/0729-wxapp-tennis-frontend.git`

### 第3步：配置服务
- **Name**: `tennis-heat-backend`
- **Environment**: `Node`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### 第4步：设置环境变量
在Environment页面添加：
```
NODE_ENV=production
PORT=10000
JWT_SECRET=[点击Generate生成]
JWT_EXPIRE=7d
CORS_ORIGIN=*
WECHAT_APP_ID=wx0670b8a59611fccf
```

### 第5步：配置数据库
**选项A - MongoDB Atlas (推荐)**:
1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费集群
3. 获取连接字符串
4. 在Render添加环境变量: `MONGODB_URI=mongodb+srv://...`

**选项B - 使用现有数据库**:
```
MONGODB_URI=mongodb://root:hhmjh2hn@dbprovider.ap-northeast-1.clawcloudrun.com:45365/?directConnection=true
```

### 第6步：部署并获取URL
1. 点击 "Create Web Service"
2. 等待部署完成 (约5-10分钟)
3. 获取服务URL (类似: `https://tennis-heat-backend-xyz.onrender.com`)

### 第7步：更新前端配置
部署完成后，修改 `frontend/utils/api.js`:
```javascript
// 使用真实的Render URL替换
const API_CONFIG = {
  production: 'https://your-actual-render-url.onrender.com/api',
  development: 'http://localhost:8080/api'
};

// 切换到生产环境
const BASE_URL = API_CONFIG.production;
```

## 🔧 验证部署
访问以下URL确认服务正常：
- 健康检查: `https://your-service.onrender.com/health`
- API测试: `https://your-service.onrender.com/test`

## ⚡ 快速启动本地环境
在等待Render部署期间，可以继续使用本地环境：
```bash
cd backend
npm run dev
```

## 📞 需要帮助？
如果在部署过程中遇到问题：
1. 检查Render部署日志
2. 确认环境变量配置
3. 验证GitHub仓库连接
4. 检查数据库连接字符串

## 🎉 部署完成后
- ✅ 后端运行在Render云端
- ✅ 无需本地启动后端服务器
- ✅ 满足客户使用Node.js + 云端部署的要求
- ✅ 自动部署：推送代码自动更新服务
