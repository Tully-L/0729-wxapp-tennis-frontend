# 网球热小程序后端服务

## 🎾 项目简介

网球热小程序的后端服务，提供完整的网球赛事管理、实时比分、支付和推送通知功能。

## ✨ 主要功能

### 🏆 比赛管理
- 创建和管理比赛
- 实时比分更新
- 比赛状态管理（开始/结束）
- 观众管理

### 💰 支付系统
- 微信支付集成
- 订单管理
- 支付回调处理

### 📱 推送服务
- 微信统一服务消息
- 比赛通知推送
- 比分更新推送

### 🔌 实时通信
- WebSocket实时比分推送
- 比赛状态同步
- 用户在线状态管理

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MongoDB 4.4+
- 微信小程序账号
- 微信支付商户号

### 安装依赖
```bash
cd backend
npm install
```

### 环境配置
复制环境变量文件并配置：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置以下必要参数：
- 数据库连接
- JWT密钥
- 微信小程序配置
- 微信支付配置
- 推送模板ID

### 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📚 API文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 赛事管理
- `GET /api/events` - 获取赛事列表
- `POST /api/events` - 创建赛事
- `GET /api/events/:id` - 获取赛事详情
- `PUT /api/events/:id` - 更新赛事
- `DELETE /api/events/:id` - 删除赛事

### 比赛管理
- `GET /api/matches` - 获取比赛列表
- `POST /api/matches` - 创建比赛
- `GET /api/matches/:id` - 获取比赛详情
- `PUT /api/matches/:id/score` - 更新比分
- `PUT /api/matches/:id/start` - 开始比赛
- `PUT /api/matches/:id/end` - 结束比赛
- `POST /api/matches/:id/spectators` - 添加观众
- `DELETE /api/matches/:id/spectators` - 移除观众

### 支付相关
- `POST /api/payments/wechat/create` - 创建微信支付订单
- `POST /api/payments/wechat/callback` - 微信支付回调
- `GET /api/payments/status/:orderId` - 查询支付状态

## 🔌 WebSocket事件

### 客户端事件
- `join-match` - 加入比赛房间
- `leave-match` - 离开比赛房间

### 服务器事件
- `match-update` - 比赛信息更新
- `score-update` - 比分更新
- `match-status-update` - 比赛状态更新
- `notification` - 通知消息

## 📱 推送通知

### 支持的推送类型
- 比赛开始通知
- 比分更新通知
- 比赛结束通知
- 赛事报名成功通知
- 支付成功通知

### 配置推送模板
在微信公众平台配置以下模板：
- 比赛开始模板
- 比分更新模板
- 比赛结束模板
- 赛事报名模板
- 支付成功模板

## 🧪 测试

运行测试脚本：
```bash
node test-matches-api.js
```

## 📁 项目结构

```
backend/
├── src/
│   ├── app.js                 # 主应用文件
│   ├── config/
│   │   └── database.js        # 数据库配置
│   ├── controllers/
│   │   ├── authController.js   # 认证控制器
│   │   ├── eventController.js  # 赛事控制器
│   │   ├── matchController.js  # 比赛控制器
│   │   └── paymentController.js # 支付控制器
│   ├── middleware/
│   │   ├── auth.js            # 认证中间件
│   │   └── errorHandler.js    # 错误处理中间件
│   ├── models/
│   │   ├── User.js            # 用户模型
│   │   ├── Event.js           # 赛事模型
│   │   ├── Match.js           # 比赛模型
│   │   └── Order.js           # 订单模型
│   ├── routes/
│   │   ├── auth.js            # 认证路由
│   │   ├── events.js          # 赛事路由
│   │   ├── matches.js         # 比赛路由
│   │   └── payments.js        # 支付路由
│   └── services/
│       ├── socketService.js    # WebSocket服务
│       └── pushService.js      # 推送服务
├── package.json
├── env.example
└── README.md
```

## 🔧 开发指南

### 添加新的API端点
1. 在 `controllers/` 目录下创建控制器
2. 在 `routes/` 目录下创建路由
3. 在 `app.js` 中注册路由

### 添加新的数据模型
1. 在 `models/` 目录下创建模型文件
2. 定义Schema和索引
3. 添加必要的中间件

### 添加新的推送模板
1. 在微信公众平台创建模板
2. 在 `pushService.js` 中添加推送方法
3. 在环境变量中配置模板ID

## 🚨 注意事项

1. **安全性**
   - 所有敏感信息使用环境变量
   - 支付回调必须验证签名
   - API接口需要身份验证

2. **性能**
   - 数据库查询使用索引
   - WebSocket连接需要管理
   - 推送消息需要限流

3. **错误处理**
   - 所有异步操作需要错误处理
   - 支付回调需要幂等性
   - 网络请求需要超时设置

## 📞 技术支持

如有问题，请查看：
- API文档
- 错误日志
- 微信开发者文档
- MongoDB文档

## �� 许可证

MIT License 