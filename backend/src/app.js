require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB, checkConnection, getDBStats } = require('./config/database');
const { createIndexes, getIndexInfo } = require('./config/indexes');
const errorHandler = require('./middleware/errorHandler');
const { ensureUtf8Encoding } = require('./middleware/encoding');

// 导入模型
const Event = require('./models/Event');

// 导入路由
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

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

// 临时管理员端点 - 创建测试数据
app.post('/admin/create-test-data', async (req, res) => {
  try {
    console.log('🚀 开始创建测试数据...');

    // 清空现有事件数据
    await Event.deleteMany({});
    console.log('🧹 已清空现有事件数据');

    // 创建测试事件
    const events = await Event.create([
      {
        title: '温布尔登锦标赛 2024',
        category: 'tennis',
        start_time: new Date('2024-07-01T09:00:00Z'),
        end_time: new Date('2024-07-01T18:00:00Z'),
        location: '全英俱乐部，伦敦',
        max_participants: 128,
        status: 'published',
        description: '世界顶级网球赛事，草地网球的最高殿堂',
        ext_info: {
          eventType: '男子单打',
          registrationDeadline: '2024-06-15',
          organizer: { name: '温布尔登网球俱乐部' },
          surface: '草地',
          prizePool: 50000,
          registrationFee: 0
        }
      },
      {
        title: '法国网球公开赛 2024',
        category: 'tennis',
        start_time: new Date('2024-05-26T09:00:00Z'),
        end_time: new Date('2024-06-09T18:00:00Z'),
        location: '罗兰·加洛斯球场，巴黎',
        max_participants: 128,
        status: 'ongoing',
        description: '红土之王的较量，法网公开赛',
        ext_info: {
          eventType: '男子单打',
          registrationDeadline: '2024-05-01',
          organizer: { name: '法国网球协会' },
          surface: '红土',
          prizePool: 45000,
          registrationFee: 100
        }
      },
      {
        title: '澳大利亚网球公开赛 2024',
        category: 'tennis',
        start_time: new Date('2024-01-14T09:00:00Z'),
        end_time: new Date('2024-01-28T18:00:00Z'),
        location: '墨尔本公园，墨尔本',
        max_participants: 128,
        status: 'ended',
        description: '新年第一个大满贯赛事',
        ext_info: {
          eventType: '男子单打',
          registrationDeadline: '2023-12-15',
          organizer: { name: '澳大利亚网球协会' },
          surface: '硬地',
          prizePool: 55000,
          registrationFee: 150
        }
      },
      {
        title: '上海大师赛 2024',
        category: 'tennis',
        start_time: new Date('2024-10-05T09:00:00Z'),
        end_time: new Date('2024-10-13T18:00:00Z'),
        location: '上海旗忠森林体育城',
        max_participants: 64,
        status: 'published',
        description: '亚洲最高级别的网球赛事',
        ext_info: {
          eventType: '男子单打',
          registrationDeadline: '2024-09-15',
          organizer: { name: '上海网球协会' },
          surface: '硬地',
          prizePool: 35000,
          registrationFee: 200
        }
      },
      {
        title: '北京网球公开赛 2024',
        category: 'tennis',
        start_time: new Date('2024-09-25T09:00:00Z'),
        end_time: new Date('2024-10-06T18:00:00Z'),
        location: '北京国家网球中心',
        max_participants: 96,
        status: 'published',
        description: '中国最具影响力的网球赛事',
        ext_info: {
          eventType: '男女混合',
          registrationDeadline: '2024-09-01',
          organizer: { name: '中国网球协会' },
          surface: '硬地',
          prizePool: 28000,
          registrationFee: 150
        }
      }
    ]);

    console.log(`✅ 成功创建 ${events.length} 个测试事件`);

    res.json({
      success: true,
      message: '测试数据创建成功',
      data: {
        events: events.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建测试数据失败',
      error: error.message
    });
  }
});

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

// API健康检查（用于部署脚本）
app.get('/api/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: '网球小程序后端服务运行正常',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: checkConnection() ? 'connected' : 'disconnected',
        api: 'operational',
        websocket: !!app.locals.socketService ? 'ready' : 'not_ready'
      }
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: '服务异常',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API信息端点
app.get('/api/info', (req, res) => {
  res.json({
    name: '网球小程序API',
    version: '1.0.0',
    description: '网球比赛数据管理系统API',
    features: [
      '比赛数据管理',
      '状态管理系统',
      '分离式布局支持',
      '火热报名功能',
      '用户权限控制',
      '实时数据同步'
    ],
    endpoints: {
      health: '/api/health',
      info: '/api/info',
      auth: '/api/auth/*',
      events: '/api/events/*'
    },
    newFeatures: {
      separatedLayout: '分离式布局 - 比赛数据与报名入口分离',
      statusManagement: '状态管理 - 完整的比赛状态管理系统',
      hotRegistrations: '火热报名 - 热门报名机会展示',
      realTimeUpdates: '实时更新 - WebSocket实时数据同步'
    }
  });
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

    // 检查是否强制重新初始化
    const force = req.query.force === 'true';

    // 检查是否已有数据
    const existingEvents = await Event.countDocuments();

    if (existingEvents > 0 && !force) {
      return res.json({
        success: true,
        message: '数据已存在，如需重新初始化请添加 ?force=true 参数',
        data: {
          events: existingEvents
        }
      });
    }

    // 如果强制重新初始化，先清除现有数据
    if (force) {
      await Event.deleteMany({});
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

    res.json({
      success: true,
      message: '测试数据初始化完成',
      data: {
        events: createdEvents.length
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

// 启动服务器

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

console.log(`✅ Server initialized successfully`);

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app; 