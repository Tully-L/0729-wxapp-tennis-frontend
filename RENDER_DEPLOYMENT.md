# 🚀 Render 部署指南

## 📋 部署步骤

### 1. 准备工作
- ✅ 确保代码已推送到GitHub
- ✅ 拥有Render账号
- ✅ 准备微信小程序相关配置

### 2. 在Render创建服务

#### 方法一：使用render.yaml自动部署
1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New" → "Blueprint"
3. 连接您的GitHub仓库：`https://github.com/Tully-L/0729-wxapp-tennis-frontend.git`
4. 选择 `backend/render.yaml` 文件
5. 点击 "Apply" 开始部署

#### 方法二：手动创建Web Service
1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New" → "Web Service"
3. 连接GitHub仓库
4. 配置如下：
   - **Name**: `tennis-heat-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

### 3. 配置环境变量

在Render控制台的Environment页面添加以下环境变量：

```
NODE_ENV=production
PORT=10000
JWT_SECRET=[自动生成]
JWT_EXPIRE=7d
CORS_ORIGIN=*
MONGODB_URI=[从数据库获取]
WECHAT_APP_ID=wx0670b8a59611fccf
WECHAT_APP_SECRET=[您的微信密钥]
WECHAT_MCH_ID=[您的商户号]
WECHAT_API_KEY=[您的支付密钥]
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 4. 创建MongoDB数据库

1. 在Render Dashboard点击 "New" → "PostgreSQL"
2. 或者使用MongoDB Atlas：
   - 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - 创建免费集群
   - 获取连接字符串
   - 在Render环境变量中设置 `MONGODB_URI`

### 5. 部署完成后

部署成功后，您将获得一个URL，类似：
```
https://tennis-heat-backend.onrender.com
```

### 6. 更新前端API地址

需要修改前端的API配置文件，将本地地址改为Render地址。

## 🔧 部署后配置

### 健康检查
访问：`https://your-app.onrender.com/health`

### 测试API
访问：`https://your-app.onrender.com/test`

## ⚠️ 注意事项

1. **免费计划限制**：
   - 服务在15分钟无活动后会休眠
   - 首次访问可能需要30秒启动时间
   - 每月750小时免费使用时间

2. **数据库**：
   - 建议使用MongoDB Atlas免费层
   - 或者升级到Render付费计划使用PostgreSQL

3. **文件上传**：
   - Render免费计划不支持持久化文件存储
   - 建议使用云存储服务（如AWS S3）

## 🚀 自动部署

配置完成后，每次推送到GitHub主分支都会自动触发部署。

## 📞 技术支持

如遇问题，请检查：
1. Render部署日志
2. 环境变量配置
3. 数据库连接状态
