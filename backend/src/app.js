require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB, checkConnection, getDBStats } = require('./config/database');
const { createIndexes, getIndexInfo } = require('./config/indexes');
const errorHandler = require('./middleware/errorHandler');
const { ensureUtf8Encoding } = require('./middleware/encoding');
const SocketService = require('./services/socketService');

// 导入路由
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const matchRoutes = require('./routes/matches');
const paymentRoutes = require('./routes/payments');
const websocketRoutes = require('./routes/websocket');
const notificationRoutes = require('./routes/notifications');

const app = express();

// 连接数据库并创建索引
connectDB().then(() => {
  // 在数据库连接成功后创建索引
  if (checkConnection()) {
    createIndexes();
  }
});

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb', charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// 设置响应头确保中文正确显示
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 添加中文编码处理中间件
app.use(ensureUtf8Encoding);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/websocket', websocketRoutes);
app.use('/api/notifications', notificationRoutes);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const dbStats = await getDBStats();
    
    res.json({
      success: true,
      message: 'Tennis Heat API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 3000,
      database: {
        connected: checkConnection(),
        ...dbStats
      },
      services: {
        webSocket: !!app.locals.socketService,
        pushService: !!app.locals.pushService
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 测试路由
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    data: {
      time: new Date().toISOString(),
      env: process.env.NODE_ENV
    }
  });
});

// 中文编码测试路由
app.post('/test-chinese', async (req, res) => {
  console.log('收到的请求体:', req.body);
  console.log('请求体类型:', typeof req.body);
  
  // 测试数据库存储和检索
  const Event = require('./models/Event');
  let dbTestResult = null;
  
  try {
    // 创建测试事件
    const testEvent = new Event({
      name: req.body.name || '数据库中文测试',
      eventType: '女子单打',
      venue: req.body.venue || '测试场地',
      region: '测试地区',
      eventDate: new Date('2024-08-01'),
      registrationDeadline: new Date('2024-07-25'),
      organizer: {
        name: '测试组织者',
        id: null
      }
    });
    
    const savedEvent = await testEvent.save();
    console.log('保存到数据库的事件:', savedEvent.toObject());
    
    // 从数据库检索
    const retrievedEvent = await Event.findById(savedEvent._id);
    console.log('从数据库检索的事件:', retrievedEvent.toObject());
    
    dbTestResult = {
      saved: {
        name: savedEvent.name,
        eventType: savedEvent.eventType,
        venue: savedEvent.venue
      },
      retrieved: {
        name: retrievedEvent.name,
        eventType: retrievedEvent.eventType,
        venue: retrievedEvent.venue
      }
    };
    
    // 清理测试数据
    await Event.findByIdAndDelete(savedEvent._id);
    
  } catch (error) {
    console.error('数据库测试错误:', error);
    dbTestResult = { error: error.message };
  }
  
  const testData = {
    received: req.body,
    chinese: '中文测试',
    eventTypes: ['男子单打', '女子单打', '男子双打', '女子双打', '混合双打'],
    message: '这是一个中文编码测试',
    databaseTest: dbTestResult
  };
  
  console.log('返回的数据:', testData);
  
  res.json({
    success: true,
    data: testData
  });
});

// 数据库索引信息查看（仅开发环境）
app.get('/dev/indexes', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode'
    });
  }

  try {
    const indexInfo = await getIndexInfo();
    res.json({
      success: true,
      message: 'Database indexes information',
      data: indexInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get index information',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 临时测试数据初始化端点
app.post('/dev/init-data', async (req, res) => {
  try {
    const Event = require('./models/Event');
    const Match = require('./models/Match');
    const mongoose = require('mongoose');

    // 检查是否强制重新初始化
    const force = req.query.force === 'true';

    // 检查是否已有数据
    const existingEvents = await Event.countDocuments();
    const existingMatches = await Match.countDocuments();

    if (existingEvents > 0 && !force) {
      return res.json({
        success: true,
        message: '数据已存在，如需重新初始化请添加 ?force=true 参数',
        data: {
          events: existingEvents,
          matches: existingMatches
        }
      });
    }

    // 如果强制重新初始化，先清除现有数据
    if (force) {
      await Event.deleteMany({});
      await Match.deleteMany({});
      console.log('🧹 已清除现有数据');
    }

    // 创建简单的测试数据
    const testEvents = [
      {
        name: '温布尔登网球锦标赛',
        eventType: '男子单打',
        status: 'ongoing',
        venue: '全英俱乐部',
        region: '英国伦敦',
        eventDate: new Date('2024-08-15'),
        registrationDeadline: new Date('2024-08-01'),
        organizer: { name: '温布尔登网球俱乐部', id: new mongoose.Types.ObjectId() },
        description: '世界最负盛名的网球赛事之一',
        maxParticipants: 128,
        currentParticipants: 64,
        registrationFee: 500,
        participants: [],
        matches: [],
        tags: ['大满贯', '草地'],
        isPublic: true
      },
      {
        name: '法国网球公开赛',
        eventType: '女子单打',
        status: 'registration',
        venue: '罗兰·加洛斯',
        region: '法国巴黎',
        eventDate: new Date('2024-09-01'),
        registrationDeadline: new Date('2024-08-20'),
        organizer: { name: '法国网球协会', id: new mongoose.Types.ObjectId() },
        description: '在红土球场上举行的大满贯赛事',
        maxParticipants: 128,
        currentParticipants: 32,
        registrationFee: 450,
        participants: [],
        matches: [],
        tags: ['大满贯', '红土'],
        isPublic: true
      }
    ];

    const createdEvents = await Event.insertMany(testEvents);

    // 创建测试比赛
    const testMatches = [];
    createdEvents.forEach((event, index) => {
      for (let i = 0; i < 3; i++) {
        testMatches.push({
          eventId: event._id,
          eventType: event.eventType,
          status: ['报名中', '比赛中', '已结束'][i],
          stage: '第一轮',
          venue: event.venue,
          region: event.region,
          scheduledTime: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
          isLive: i === 1,
          players: {
            team1: { name: `选手${index * 3 + i + 1}`, ranking: 10 + i },
            team2: { name: `选手${index * 3 + i + 2}`, ranking: 15 + i }
          },
          organizer: event.organizer,
          spectators: [],
          score: { sets: [], winner: null },
          statistics: { duration: null, totalGames: 0 },
          tags: event.tags,
          isPublic: true
        });
      }
    });

    const createdMatches = await Match.insertMany(testMatches);

    res.json({
      success: true,
      message: '测试数据初始化完成',
      data: {
        events: createdEvents.length,
        matches: createdMatches.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '初始化测试数据失败',
      error: error.message
    });
  }
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
});

// 初始化WebSocket服务
const socketService = new SocketService(server);
app.locals.socketService = socketService;

// 初始化推送服务
const PushService = require('./services/pushService');
const pushService = new PushService();
app.locals.pushService = pushService;

// 初始化支付服务
const PaymentService = require('./services/paymentService');
const paymentService = new PaymentService();
app.locals.paymentService = paymentService;

// 定期清理过期订单
setInterval(() => {
  paymentService.cleanupExpiredOrders();
}, 5 * 60 * 1000); // 每5分钟清理一次

console.log(`🔌 WebSocket service initialized`);
console.log(`📱 Push service initialized`);
console.log(`💰 Payment service initialized`);

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app; 