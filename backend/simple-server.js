require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 简单的数据库连接
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
}

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 简单的事件API（返回模拟数据）
app.get('/api/events', (req, res) => {
  const mockEvents = [
    {
      _id: '1',
      title: '温布尔登锦标赛 2024',
      name: '温布尔登锦标赛 2024',
      category: '网球比赛',
      eventType: '男子单打',
      status: 'published',
      location: '全英俱乐部，伦敦',
      venue: '全英俱乐部，伦敦',
      region: '',
      start_time: '2024-07-01T09:00:00.000Z',
      end_time: '2024-07-01T18:00:00.000Z',
      eventDate: '2024-07-01',
      max_participants: 128,
      maxParticipants: 128,
      currentParticipants: 45,
      current_participants: 45,
      description: '世界顶级网球赛事，草地网球的最高殿堂',
      ext_info: {
        eventType: '男子单打',
        registrationDeadline: '2024-06-15',
        organizer: { name: '温布尔登网球俱乐部' },
        surface: '草地',
        prizePool: 50000,
        registrationFee: 0
      },
      organizer: { name: '温布尔登网球俱乐部' },
      registrationFee: 0,
      registrationDeadline: '2024-06-15',
      surface: '草地',
      prizePool: 50000,
      isRegistered: false,
      can_register: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      _id: '2',
      title: '法国网球公开赛 2024',
      name: '法国网球公开赛 2024',
      category: '网球比赛',
      eventType: '男子单打',
      status: 'ongoing',
      location: '罗兰·加洛斯球场，巴黎',
      venue: '罗兰·加洛斯球场，巴黎',
      region: '',
      start_time: '2024-05-26T09:00:00.000Z',
      end_time: '2024-06-09T18:00:00.000Z',
      eventDate: '2024-05-26',
      max_participants: 128,
      maxParticipants: 128,
      currentParticipants: 89,
      current_participants: 89,
      description: '红土之王的较量，法网公开赛',
      ext_info: {
        eventType: '男子单打',
        registrationDeadline: '2024-05-01',
        organizer: { name: '法国网球协会' },
        surface: '红土',
        prizePool: 45000,
        registrationFee: 100
      },
      organizer: { name: '法国网球协会' },
      registrationFee: 100,
      registrationDeadline: '2024-05-01',
      surface: '红土',
      prizePool: 45000,
      isRegistered: true,
      can_register: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ];

  res.json({
    success: true,
    data: {
      events: mockEvents,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      }
    }
  });
});

// 用户统计API（返回模拟数据）
app.get('/api/auth/stats', (req, res) => {
  const mockStats = {
    basic: {
      participationCount: 5,
      wins: 3,
      losses: 2,
      winRate: '60%',
      totalPoints: 1500
    },
    level: {
      name: '业余选手',
      level: 2
    },
    accountAge: 30,
    monthlyActivity: 5,
    status: 'active',
    mDou: 1500,
    coupons: 3,
    events: 5,
    memberLevel: 'VIP'
  };

  res.json({
    success: true,
    data: mockStats
  });
});

// 启动服务器
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📍 健康检查: http://localhost:${PORT}/health`);
    console.log(`🎾 事件API: http://localhost:${PORT}/api/events`);
    console.log(`👤 用户统计API: http://localhost:${PORT}/api/auth/stats`);
  });
}

startServer().catch(console.error);
