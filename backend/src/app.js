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