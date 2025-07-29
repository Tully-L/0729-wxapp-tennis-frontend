require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const path = require('path');

// 设置正确的模型路径
const Event = require(path.join(__dirname, 'backend/src/models/Event'));
const Match = require(path.join(__dirname, 'backend/src/models/Match'));

async function checkDatabase() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis_heat');
    console.log('🍃 MongoDB Connected');

    // 检查赛事数据
    console.log('\n📊 检查赛事数据...');
    const events = await Event.find({});
    console.log(`赛事总数: ${events.length}`);
    
    if (events.length > 0) {
      console.log('\n赛事列表:');
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.name} (${event.status}) - ${event.venue}`);
        console.log(`   ID: ${event._id}`);
        console.log(`   比赛数量: ${event.matches?.length || 0}`);
      });
    }

    // 检查比赛数据
    console.log('\n🏆 检查比赛数据...');
    const matches = await Match.find({});
    console.log(`比赛总数: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log('\n比赛列表:');
      matches.forEach((match, index) => {
        console.log(`${index + 1}. ${match.eventType} (${match.status}) - ${match.venue}`);
        console.log(`   ID: ${match._id}`);
        console.log(`   赛事ID: ${match.eventId}`);
        console.log(`   是否实时: ${match.isLive}`);
        if (match.players) {
          console.log(`   选手: ${match.players.team1?.name || 'N/A'} vs ${match.players.team2?.name || 'N/A'}`);
        }
      });
    }

    // 检查数据关联
    console.log('\n🔗 检查数据关联...');
    for (const event of events) {
      const eventMatches = await Match.find({ eventId: event._id });
      console.log(`赛事 "${event.name}" 关联的比赛数量: ${eventMatches.length}`);
    }

  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

checkDatabase();
