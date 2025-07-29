require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const Match = require('./src/models/Match');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis_heat');
    console.log('🍃 MongoDB Connected');
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
    description: '在红土球场举行的大满贯赛事，考验选手的耐力和技术。',
    maxParticipants: 128,
    currentParticipants: 32,
    registrationFee: 450,
    participants: [],
    matches: [],
    tags: ['大满贯', '红土', '法国'],
    isPublic: true
  },
  {
    name: '美国网球公开赛',
    eventType: '男子双打',
    status: 'upcoming',
    venue: '比利·简·金国家网球中心',
    region: '美国纽约',
    eventDate: new Date('2024-09-15'),
    registrationDeadline: new Date('2024-09-01'),
    organizer: {
      name: '美国网球协会',
      id: new mongoose.Types.ObjectId()
    },
    description: '在硬地球场举行的大满贯赛事，以快节奏比赛著称。',
    maxParticipants: 64,
    currentParticipants: 28,
    registrationFee: 600,
    participants: [],
    matches: [],
    tags: ['大满贯', '硬地', '美国'],
    isPublic: true
  },
  {
    name: '澳大利亚网球公开赛',
    eventType: '女子双打',
    status: 'completed',
    venue: '墨尔本公园',
    region: '澳大利亚墨尔本',
    eventDate: new Date('2024-07-20'),
    registrationDeadline: new Date('2024-07-01'),
    organizer: {
      name: '澳大利亚网球协会',
      id: new mongoose.Types.ObjectId()
    },
    description: '南半球最重要的网球赛事，在夏季举行。',
    maxParticipants: 64,
    currentParticipants: 64,
    registrationFee: 400,
    participants: [],
    matches: [],
    tags: ['大满贯', '硬地', '澳大利亚'],
    isPublic: true
  },
  {
    name: '中国网球公开赛',
    eventType: '混合双打',
    status: 'registration',
    venue: '国家网球中心',
    region: '中国北京',
    eventDate: new Date('2024-10-01'),
    registrationDeadline: new Date('2024-09-15'),
    organizer: {
      name: '中国网球协会',
      id: new mongoose.Types.ObjectId()
    },
    description: '亚洲地区重要的网球赛事，吸引世界各地选手参与。',
    maxParticipants: 32,
    currentParticipants: 16,
    registrationFee: 300,
    participants: [],
    matches: [],
    tags: ['ATP', '硬地', '中国'],
    isPublic: true
  }
];

// 测试比赛数据生成函数
const generateTestMatches = (events) => {
  const matches = [];
  
  // 为每个赛事生成一些比赛
  events.forEach((event, eventIndex) => {
    // 生成3-5场比赛
    const matchCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < matchCount; i++) {
      const stages = ['第一轮', '第二轮', '8强', '4强', '半决赛', '决赛'];
      const statuses = ['报名中', '比赛中', '已结束'];
      
      const match = {
        matchName: `${event.name} - ${stages[i % stages.length]}`,
        eventId: event._id,
        eventType: event.eventType,
        status: event.status === 'ongoing' ? statuses[i % 3] : '报名中',
        stage: stages[i % stages.length],
        venue: event.venue,
        court: `${i + 1}号球场`,
        region: event.region,
        scheduledTime: new Date(event.eventDate.getTime() + i * 24 * 60 * 60 * 1000),
        startTime: event.status === 'ongoing' && i < 2 ? new Date() : null,
        endTime: event.status === 'completed' || (event.status === 'ongoing' && i === 0) ? new Date() : null,
        duration: event.status === 'completed' || (event.status === 'ongoing' && i === 0) ? `${Math.floor(Math.random() * 2) + 1}h${Math.floor(Math.random() * 60)}m` : null,
        players: generatePlayers(event.eventType),
        matchFormat: '3盘制',
        bestOf: 3,
        score: generateScore(event.status === 'completed' || (event.status === 'ongoing' && i === 0)),
        statistics: generateStatistics(),
        organizer: event.organizer,
        spectators: [],
        viewCount: Math.floor(Math.random() * 1000) + 100,
        isLive: event.status === 'ongoing' && i === 1,
        isPublic: true,
        tags: event.tags
      };
      
      matches.push(match);
    }
  });
  
  return matches;
};

// 生成选手数据
function generatePlayers(eventType) {
  const maleNames = ['费德勒', '纳达尔', '德约科维奇', '穆雷', '瓦林卡', '西里奇', '蒂姆', '兹维列夫'];
  const femaleNames = ['小威廉姆斯', '莎拉波娃', '阿扎伦卡', '哈勒普', '科维托娃', '穆古拉扎', '大坂直美', '巴蒂'];
  
  if (eventType.includes('男子')) {
    if (eventType.includes('双打')) {
      return {
        team1: [
          { name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 },
          { name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }
        ],
        team2: [
          { name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 },
          { name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }
        ]
      };
    } else {
      return {
        team1: [{ name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }],
        team2: [{ name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }]
      };
    }
  } else if (eventType.includes('女子')) {
    if (eventType.includes('双打')) {
      return {
        team1: [
          { name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 },
          { name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }
        ],
        team2: [
          { name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 },
          { name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }
        ]
      };
    } else {
      return {
        team1: [{ name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }],
        team2: [{ name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }]
      };
    }
  } else { // 混合双打
    return {
      team1: [
        { name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 },
        { name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }
      ],
      team2: [
        { name: maleNames[Math.floor(Math.random() * maleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 },
        { name: femaleNames[Math.floor(Math.random() * femaleNames.length)], ranking: Math.floor(Math.random() * 50) + 1 }
      ]
    };
  }
}

// 生成比分数据
function generateScore(isCompleted) {
  if (!isCompleted) {
    return {
      sets: [],
      winner: null
    };
  }
  
  const sets = [];
  let team1Sets = 0;
  let team2Sets = 0;
  
  // 生成2-3盘比赛
  for (let i = 0; i < 3; i++) {
    if (team1Sets === 2 || team2Sets === 2) break;
    
    const team1Score = Math.floor(Math.random() * 8) + 1;
    const team2Score = Math.floor(Math.random() * 8) + 1;
    
    let finalTeam1Score, finalTeam2Score;
    let tiebreak = { played: false, team1Score: 0, team2Score: 0 };
    
    if (team1Score === team2Score && team1Score >= 6) {
      // 抢七局
      tiebreak.played = true;
      tiebreak.team1Score = Math.floor(Math.random() * 5) + 7;
      tiebreak.team2Score = Math.floor(Math.random() * 5) + 5;
      finalTeam1Score = 7;
      finalTeam2Score = 6;
      if (tiebreak.team1Score > tiebreak.team2Score) {
        team1Sets++;
      } else {
        team2Sets++;
        [tiebreak.team1Score, tiebreak.team2Score] = [tiebreak.team2Score, tiebreak.team1Score];
        finalTeam1Score = 6;
        finalTeam2Score = 7;
      }
    } else if (Math.abs(team1Score - team2Score) >= 2 && Math.max(team1Score, team2Score) >= 6) {
      finalTeam1Score = team1Score;
      finalTeam2Score = team2Score;
      if (team1Score > team2Score) {
        team1Sets++;
      } else {
        team2Sets++;
      }
    } else {
      // 调整分数确保有效
      if (team1Score > team2Score) {
        finalTeam1Score = Math.max(6, team1Score);
        finalTeam2Score = Math.min(finalTeam1Score - 2, team2Score);
        team1Sets++;
      } else {
        finalTeam2Score = Math.max(6, team2Score);
        finalTeam1Score = Math.min(finalTeam2Score - 2, team1Score);
        team2Sets++;
      }
    }
    
    sets.push({
      setNumber: i + 1,
      team1Score: finalTeam1Score,
      team2Score: finalTeam2Score,
      tiebreak
    });
  }
  
  return {
    sets,
    winner: team1Sets > team2Sets ? 'team1' : 'team2'
  };
}

// 生成统计数据
function generateStatistics() {
  return {
    totalGames: Math.floor(Math.random() * 30) + 15,
    aces: {
      team1: Math.floor(Math.random() * 15),
      team2: Math.floor(Math.random() * 15)
    },
    doubleFaults: {
      team1: Math.floor(Math.random() * 5),
      team2: Math.floor(Math.random() * 5)
    },
    firstServePercentage: {
      team1: Math.floor(Math.random() * 30) + 60,
      team2: Math.floor(Math.random() * 30) + 60
    }
  };
}

// 主函数
async function addTestData() {
  try {
    await connectDB();

    console.log('🧹 清理现有测试数据...');
    await Event.deleteMany({});
    await Match.deleteMany({});

    console.log('📝 添加测试赛事数据...');
    const createdEvents = await Event.insertMany(testEvents);
    console.log(`✅ 成功添加 ${createdEvents.length} 个测试赛事`);

    console.log('🏆 生成测试比赛数据...');
    const testMatches = generateTestMatches(createdEvents);

    console.log('📝 添加测试比赛数据...');
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

    console.log('\n📊 数据统计:');
    console.log(`- 赛事总数: ${createdEvents.length}`);
    console.log(`- 比赛总数: ${createdMatches.length}`);
    console.log(`- 进行中的赛事: ${createdEvents.filter(e => e.status === 'ongoing').length}`);
    console.log(`- 报名中的赛事: ${createdEvents.filter(e => e.status === 'registration').length}`);
    console.log(`- 已完成的赛事: ${createdEvents.filter(e => e.status === 'completed').length}`);
    console.log(`- 实时比赛: ${createdMatches.filter(m => m.isLive).length}`);

    console.log('\n🎉 测试数据添加完成！');

  } catch (error) {
    console.error('❌ 添加测试数据失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  addTestData();
}

module.exports = { addTestData, generateTestMatches, generatePlayers, generateScore, generateStatistics, testEvents };
