# 网球热微信小程序设计文档

## 概述

网球热是一个专业的网球赛事管理微信小程序，采用Roland-Garros风格设计和深绿色主题(#0A4A39)。系统基于现有的前后端架构进行完善和优化，提供完整的网球赛事管理、实时比分更新、用户管理和社交功能。

## 架构设计

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   微信小程序     │    │   Node.js API   │    │   MongoDB       │
│   (前端)        │◄──►│   (后端)        │◄──►│   (数据库)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        │              ┌─────────────────┐
        │              │   Socket.io     │
        └──────────────►│   (实时通信)    │
                       └─────────────────┘
                               │
                       ┌─────────────────┐
                       │   微信API       │
                       │   (支付/推送)   │
                       └─────────────────┘
```

### 技术栈

**前端 (微信小程序)**
- 框架：微信小程序原生 (WXML, WXSS, JavaScript)
- UI风格：Roland-Garros风格，深绿色主题 (#0A4A39)
- 状态管理：本地存储 + 全局数据
- 网络通信：wx.request + WebSocket
- 分包加载：用户相关功能分包

**后端 (Node.js)**
- 运行时：Node.js 18+
- 框架：Express.js
- 实时通信：Socket.io
- 认证：JWT
- 中间件：CORS, Helmet, Morgan

**数据库**
- 主数据库：MongoDB
- ODM：Mongoose
- 缓存：内存缓存 + 微信小程序本地存储

**第三方服务**
- 微信支付API
- 微信统一服务消息
- 微信小程序登录

## 组件和接口设计

### 前端组件架构

```
app.js (全局配置)
├── pages/ (页面)
│   ├── index/ (比赛首页)
│   ├── detail/ (比赛详情)
│   ├── event/ (赛事页面)
│   └── user/ (用户中心)
├── pages/user-related/ (分包)
│   ├── login/ (登录页面)
│   └── event-create/ (创建赛事)
├── components/ (组件)
│   ├── loading/ (加载组件)
│   ├── empty/ (空状态组件)
│   └── match-card/ (比赛卡片)
└── utils/ (工具)
    ├── api.js (API接口)
    ├── auth.js (认证工具)
    └── util.js (通用工具)
```

### 核心页面设计

#### 1. 比赛首页 (pages/index)
- **功能**：比赛列表展示、状态筛选、搜索过滤
- **状态管理**：Tab切换、分页加载、筛选条件
- **UI特性**：骨架屏加载、空状态引导、下拉刷新

#### 2. 比赛详情页 (pages/detail)
- **功能**：比赛详细信息、实时比分、社交分享、通知订阅
- **实时更新**：WebSocket连接、比分同步
- **交互功能**：分享按钮、订阅通知、观众管理

#### 3. 赛事管理页 (pages/event)
- **功能**：赛事列表、创建赛事、报名管理、支付流程
- **筛选功能**：类型、地区、日期范围筛选
- **支付集成**：模拟支付流程、订单管理

#### 4. 用户中心 (pages/user)
- **功能**：个人资料、统计数据、俱乐部管理、比赛记录
- **缓存优化**：用户数据缓存、俱乐部信息缓存
- **数据展示**：统计图表、历史记录、成就系统

### 后端API设计

#### 认证模块 (auth)
```javascript
POST /api/auth/login        // 微信登录
POST /api/auth/register     // 用户注册
GET  /api/auth/profile      // 获取用户信息
PUT  /api/auth/profile      // 更新用户信息
```

#### 比赛模块 (matches)
```javascript
GET    /api/matches         // 获取比赛列表
POST   /api/matches         // 创建比赛
GET    /api/matches/:id     // 获取比赛详情
PUT    /api/matches/:id     // 更新比赛信息
DELETE /api/matches/:id     // 删除比赛
PUT    /api/matches/:id/score    // 更新比分
PUT    /api/matches/:id/start    // 开始比赛
PUT    /api/matches/:id/end      // 结束比赛
POST   /api/matches/:id/spectators   // 添加观众
DELETE /api/matches/:id/spectators   // 移除观众
```

#### 赛事模块 (events)
```javascript
GET    /api/events          // 获取赛事列表
POST   /api/events          // 创建赛事
GET    /api/events/:id      // 获取赛事详情
PUT    /api/events/:id      // 更新赛事
DELETE /api/events/:id      // 删除赛事
POST   /api/events/:id/register     // 报名赛事
DELETE /api/events/:id/register     // 取消报名
```

#### 支付模块 (payments)
```javascript
POST /api/payments/wechat/create    // 创建微信支付订单
POST /api/payments/wechat/callback  // 微信支付回调
GET  /api/payments/status/:orderId  // 查询支付状态
```

## 数据模型设计

### 用户模型 (User)
```javascript
{
  openid: String,           // 微信openid
  unionid: String,          // 微信unionid
  nickname: String,         // 用户昵称
  avatar: String,           // 头像URL
  phone: String,            // 手机号
  email: String,            // 邮箱
  gender: String,           // 性别
  region: String,           // 地区
  stats: {                  // 统计数据
    participationCount: Number,
    wins: Number,
    losses: Number,
    winRate: String,
    etaPoints: Number
  },
  clubs: [ObjectId],        // 关联俱乐部
  isActive: Boolean,        // 账户状态
  lastLoginAt: Date         // 最后登录时间
}
```

### 比赛模型 (Match)
```javascript
{
  eventId: ObjectId,        // 关联赛事
  eventType: String,        // 比赛类型
  stage: String,            // 比赛阶段
  status: String,           // 比赛状态
  venue: String,            // 比赛场地
  duration: String,         // 比赛时长
  startTime: Date,          // 开始时间
  endTime: Date,            // 结束时间
  organizer: {              // 组织者信息
    name: String,
    id: ObjectId
  },
  players: [{               // 参赛选手
    name: String,
    ranking: Number,
    avatar: String,
    userId: ObjectId
  }],
  sets: [{                  // 比赛局数
    setNumber: Number,
    score: {
      team1: Number,
      team2: Number
    },
    isCompleted: Boolean
  }],
  currentSet: Number,       // 当前局数
  winner: String,           // 获胜方
  score: {                  // 总比分
    team1: Number,
    team2: Number
  },
  spectators: [ObjectId],   // 观众列表
  isPublic: Boolean,        // 是否公开
  notes: String             // 备注
}
```

### 赛事模型 (Event)
```javascript
{
  name: String,             // 赛事名称
  eventType: String,        // 赛事类型
  status: String,           // 赛事状态
  venue: String,            // 举办场地
  region: String,           // 举办地区
  eventDate: Date,          // 赛事日期
  registrationDeadline: Date, // 报名截止时间
  organizer: {              // 组织者
    name: String,
    id: ObjectId
  },
  coverImage: String,       // 封面图片
  description: String,      // 赛事描述
  maxParticipants: Number,  // 最大参与人数
  currentParticipants: Number, // 当前参与人数
  registrationFee: Number,  // 报名费用
  participants: [{          // 参与者列表
    user: ObjectId,
    registeredAt: Date,
    paymentStatus: String,
    paymentId: String
  }],
  matches: [ObjectId],      // 关联比赛
  tags: [String],           // 标签
  isPublic: Boolean         // 是否公开
}
```

### 俱乐部模型 (Club)
```javascript
{
  name: String,             // 俱乐部名称
  description: String,      // 描述
  logo: String,             // 俱乐部logo
  region: String,           // 所在地区
  members: [{               // 成员列表
    user: ObjectId,
    joinedAt: Date,
    role: String,           // 角色
    points: Number          // 积分
  }],
  totalPoints: Number,      // 总积分
  isActive: Boolean,        // 状态
  createdBy: ObjectId       // 创建者
}
```

### 订单模型 (Order)
```javascript
{
  orderNo: String,          // 订单号
  userId: ObjectId,         // 用户ID
  eventId: ObjectId,        // 赛事ID
  amount: Number,           // 金额
  status: String,           // 订单状态
  paymentMethod: String,    // 支付方式
  wechatPayInfo: {          // 微信支付信息
    prepayId: String,
    transactionId: String
  },
  paidAt: Date,             // 支付时间
  refundedAt: Date          // 退款时间
}
```

## 错误处理设计

### 前端错误处理
```javascript
// 统一错误处理
const handleApiError = (err) => {
  console.error('API Request Error:', err);
  
  if (err.code === 401) {
    // 未授权，跳转登录
    wx.navigateTo({
      url: '/pages/user-related/login/login'
    });
  } else if (err.code === 500) {
    // 服务器错误
    wx.showToast({
      title: '服务器繁忙，请稍后重试',
      icon: 'none'
    });
  } else {
    // 其他错误
    wx.showToast({
      title: err.message || '网络请求失败',
      icon: 'none'
    });
  }
};
```

### 后端错误处理
```javascript
// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: '未授权访问'
    });
  }
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
};
```

## 测试策略

### 前端测试
1. **功能测试**
   - 页面跳转和导航
   - 数据加载和显示
   - 用户交互响应
   - 筛选和搜索功能

2. **UI/UX测试**
   - Roland-Garros风格一致性
   - 响应式布局适配
   - 加载状态和空状态
   - 错误提示友好性

3. **性能测试**
   - 页面加载速度
   - 分包加载效果
   - 缓存机制验证
   - 内存使用优化

### 后端测试
1. **API测试**
   - 接口功能正确性
   - 参数验证和错误处理
   - 认证和授权机制
   - 数据库操作正确性

2. **实时功能测试**
   - WebSocket连接稳定性
   - 实时数据同步
   - 多用户并发处理
   - 消息推送准确性

3. **集成测试**
   - 微信支付流程
   - 推送通知功能
   - 第三方API集成
   - 数据一致性验证

### 测试工具和方法
- **前端**：微信开发者工具、真机调试、性能分析
- **后端**：Jest单元测试、Postman API测试、压力测试
- **数据库**：MongoDB Compass、数据迁移测试
- **集成**：端到端测试、用户验收测试

## 性能优化策略

### 前端优化
1. **分包加载**：用户相关功能独立分包
2. **缓存机制**：用户数据、俱乐部信息、赛事类型缓存
3. **懒加载**：图片和组件按需加载
4. **骨架屏**：提升用户感知性能
5. **代码分割**：减少主包体积

### 后端优化
1. **数据库索引**：关键字段建立索引
2. **查询优化**：分页查询、字段筛选
3. **缓存策略**：Redis缓存热点数据
4. **连接池**：数据库连接池管理
5. **API限流**：防止恶意请求

### 网络优化
1. **CDN加速**：静态资源CDN分发
2. **数据压缩**：API响应数据压缩
3. **请求合并**：减少网络请求次数
4. **离线缓存**：关键数据离线可用
5. **WebSocket优化**：实时连接管理

这个设计文档为网球热微信小程序提供了完整的技术架构和实现指导，确保系统能够满足所有需求并提供优秀的用户体验。