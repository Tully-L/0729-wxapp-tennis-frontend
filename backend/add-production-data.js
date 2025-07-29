// 向生产环境数据库添加测试数据
require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const Match = require('./src/models/Match');

// 使用生产环境的数据库连接，但连接到test数据库
const PRODUCTION_MONGODB_URI = 'mongodb://root:hhmjh2hn@dbprovider.ap-northeast-1.clawcloudrun.com:45365/test?directConnection=true';

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('🍃 MongoDB Connected to production database (test)');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// 测试赛事数据
const testEvents = [
  {
    name: '2024年温布尔登网球锦标赛',
    eventType: '男子单打',
    status: 'ongoing',
    venue: '全英俱乐部',
    region: '英国伦敦',
    eventDate: new Date('2024-08-15'),
    registrationDeadline: new Date('2024-08-01'),
    organizer: {
      name: '温布尔登网球俱乐部',
      id: new mongoose.Types.ObjectId()
    },
    description: '世界最负盛名的网球赛事之一，在草地球场上举行的大满贯赛事。',
    maxParticipants: 128,
    currentParticipants: 64,
    registrationFee: 500,
    participants: [],
    matches: [],
    tags: ['大满贯', '草地', '传统'],
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
    organizer: {
      name: '法国网球协会',
      id: new mongoose.Types.ObjectId()
    },
    description: '在红土球场上举行的大满贯赛事，以其独特的比赛条件而闻名。',
    maxParticipants: 128,
    currentParticipants: 32,
    registrationFee: 450,
    participants: [],
    matches: [],
    tags: ['大满贯', '红土', '经典'],
    isPublic: true
  },
  {
    name: '美国网球公开赛',
    eventType: '混合双打',
    status: 'upcoming',
    venue: '比利·简·金国家网球中心',
    region: '美国纽约',
    eventDate: new Date('2024-09-15'),
    registrationDeadline: new Date('2024-09-01'),
    organizer: {
      name: '美国网球协会',
      id: new mongoose.Types.ObjectId()
    },
    description: '在硬地球场上举行的大满贯赛事，以其快节奏的比赛而著称。',
    maxParticipants: 64,
    currentParticipants: 28,
    registrationFee: 600,
    participants: [],
    matches: [],
    tags: ['大满贯', '硬地', '现代'],
    isPublic: true
  },
  {
    name: '澳大利亚网球公开赛',
    eventType: '男子双打',
    status: 'completed',
    venue: '墨尔本公园',
    region: '澳大利亚墨尔本',
    eventDate: new Date('2024-07-15'),
    registrationDeadline: new Date('2024-07-01'),
    organizer: {
      name: '澳大利亚网球协会',
      id: new mongoose.Types.ObjectId()
    },
    description: '南半球最重要的网球赛事，在硬地球场上举行。',
    maxParticipants: 64,
    currentParticipants: 64,
    registrationFee: 550,
    participants: [],
    matches: [],
    tags: ['大满贯', '硬地', '夏季'],
    isPublic: true
  },
  {
    name: '中国网球公开赛',
    eventType: '女子双打',
    status: 'registration',
    venue: '国家网球中心',
    region: '中国北京',
    eventDate: new Date('2024-10-01'),
    registrationDeadline: new Date('2024-09-15'),
    organizer: {
      name: '中国网球协会',
      id: new mongoose.Types.ObjectId()
    },
    description: '亚洲地区重要的网球赛事，吸引世界各地的顶级选手参与。',
    maxParticipants: 32,
    currentParticipants: 16,
    registrationFee: 300,
    participants: [],
    matches: [],
    tags: ['亚洲', '硬地', '国际'],
    isPublic: true
  }
];

// 生成测试比赛数据
const generateTestMatches = (events) => {
  const matches = [];
  const statuses = ['报名中', '比赛中', '已结束'];
  const stages = ['第一轮', '第二轮', '8强', '4强', '半决赛', '决赛'];
  
  events.forEach((event, eventIndex) => {
    // 为每个赛事生成3-5场比赛
    const matchCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < matchCount; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isLive = status === '比赛中' && Math.random() > 0.7; // 30%概率为实时比赛
      
      const match = {
        eventId: event._id,
        eventType: event.eventType,
        status: status,
        stage: stages[Math.floor(Math.random() * stages.length)],
        venue: event.venue,
        region: event.region,
        scheduledTime: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // 每天一场
        isLive: isLive,
        players: {
          team1: {
            name: `选手${eventIndex * 10 + i * 2 + 1}`,
            ranking: Math.floor(Math.random() * 100) + 1
          },
          team2: {
            name: `选手${eventIndex * 10 + i * 2 + 2}`,
            ranking: Math.floor(Math.random() * 100) + 1
          }
        },
        organizer: event.organizer,
        spectators: [],
        score: {
          sets: [],
          winner: status === '已结束' ? (Math.random() > 0.5 ? 'team1' : 'team2') : null
        },
        statistics: {
          duration: status === '已结束' ? Math.floor(Math.random() * 180) + 60 : null,
          totalGames: status === '已结束' ? Math.floor(Math.random() * 30) + 10 : 0
        },
        tags: event.tags,
        isPublic: true
      };
      
      // 如果比赛已结束，添加一些比分数据
      if (status === '已结束') {
        match.score.sets = [
          { setNumber: 1, team1Score: 6, team2Score: 4 },
          { setNumber: 2, team1Score: 6, team2Score: 3 }
        ];
      }
      
      matches.push(match);
    }
  });
  
  return matches;
};

// 添加测试数据
async function addProductionTestData() {
  try {
    await connectDB();
    
    console.log('🧹 清理现有测试数据...');
    await Event.deleteMany({});
    await Match.deleteMany({});
    
    console.log('📝 添加测试赛事数据到生产环境...');
    const createdEvents = await Event.insertMany(testEvents);
    console.log(`✅ 成功添加 ${createdEvents.length} 个测试赛事`);
    
    console.log('🏆 生成测试比赛数据...');
    const testMatches = generateTestMatches(createdEvents);
    
    console.log('📝 添加测试比赛数据到生产环境...');
    const createdMatches = await Match.insertMany(testMatches);
    console.log(`✅ 成功添加 ${createdMatches.length} 个测试比赛`);
    
    // 更新赛事的比赛关联
    for (const event of createdEvents) {
      const eventMatches = createdMatches.filter(match => 
        match.eventId.toString() === event._id.toString()
      );
      event.matches = eventMatches.map(match => match._id);
      await event.save();
    }
    console.log('🔗 更新赛事比赛关联完成');
    
    console.log('\n📊 生产环境数据统计:');
    console.log(`- 赛事总数: ${createdEvents.length}`);
    console.log(`- 比赛总数: ${createdMatches.length}`);
    console.log(`- 进行中的赛事: ${createdEvents.filter(e => e.status === 'ongoing').length}`);
    console.log(`- 报名中的赛事: ${createdEvents.filter(e => e.status === 'registration').length}`);
    console.log(`- 已完成的赛事: ${createdEvents.filter(e => e.status === 'completed').length}`);
    console.log(`- 实时比赛: ${createdMatches.filter(m => m.isLive).length}`);
    
    console.log('\n🎉 生产环境测试数据添加完成！');
    
  } catch (error) {
    console.error('❌ 添加生产环境测试数据失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  addProductionTestData();
}

module.exports = { addProductionTestData };
