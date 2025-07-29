# 网球热后端基础架构设置完成

## ✅ 已完成的基础架构组件

### 1. 数据库连接和配置
- ✅ MongoDB连接配置 (`src/config/database.js`)
- ✅ 连接池管理和超时设置
- ✅ 连接状态监听和错误处理
- ✅ 优雅关闭机制
- ✅ 开发环境容错处理

### 2. JWT认证系统
- ✅ JWT工具函数 (`src/utils/jwt.js`)
- ✅ 访问令牌和刷新令牌生成
- ✅ 令牌验证和过期检查
- ✅ 认证中间件 (`src/middleware/auth.js`)
- ✅ 可选认证中间件

### 3. 错误处理机制
- ✅ 全局错误处理中间件 (`src/middleware/errorHandler.js`)
- ✅ 详细的错误分类和处理
- ✅ 自定义错误类 (BusinessError, WeChatAPIError, PaymentError)
- ✅ 开发/生产环境错误信息区分

### 4. 数据库索引优化
- ✅ 索引配置文件 (`src/config/indexes.js`)
- ✅ 自动索引创建
- ✅ 索引信息查看端点 (`/dev/indexes`)
- ✅ 重复索引问题修复

### 5. Express服务器配置
- ✅ 安全中间件 (Helmet)
- ✅ CORS配置
- ✅ 请求日志 (Morgan)
- ✅ JSON解析和大小限制
- ✅ 健康检查端点 (`/health`)
- ✅ 测试端点 (`/test`)

### 6. WebSocket和推送服务
- ✅ Socket.io服务初始化
- ✅ 推送服务初始化
- ✅ 微信API工具函数 (`src/utils/wechat.js`)

### 7. 开发工具和脚本
- ✅ 增强的开发启动脚本
- ✅ 健康检查脚本
- ✅ 端点测试脚本
- ✅ 环境变量检查

## 🚀 启动服务器

### 基本启动
```bash
npm start          # 生产模式
npm run dev        # 开发模式 (nodemon)
npm run dev:enhanced  # 增强开发模式 (带环境检查)
```

### 测试端点
```bash
npm run test:health     # 健康检查
npm run test:endpoints  # 测试所有端点
```

## 📊 可用端点

- `GET /health` - 健康检查和系统状态
- `GET /test` - 基本测试端点
- `GET /dev/indexes` - 数据库索引信息 (仅开发环境)

## ⚙️ 环境配置

确保 `.env` 文件包含以下配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/tennis_heat

# JWT配置
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APPID=your_wechat_appid_here
WECHAT_SECRET=your_wechat_secret_here

# 其他配置...
```

## 🔧 故障排除

### MongoDB连接问题
- 确保MongoDB服务正在运行
- 检查连接字符串是否正确
- 在开发环境中，服务器会继续运行即使MongoDB不可用

### 端口占用问题
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程
taskkill /PID <PID> /F
```

### JWT密钥警告
- 更新 `.env` 文件中的 `JWT_SECRET` 为安全的随机字符串
- 不要在生产环境中使用默认值

## 📝 下一步

基础架构已完成，可以继续进行：
1. 用户认证和管理系统实现
2. 比赛管理系统完善
3. 实时比分更新系统
4. 其他业务功能开发