const mongoose = require('mongoose');
require('dotenv').config();

// 导入旧模型
const OldUser = require('../src/models/User');
const OldEvent = require('../src/models/Event');

// 导入新模型
const User = require('../src/models/User');
const UserAuth = require('../src/models/UserAuth');
const Event = require('../src/models/Event');
const UserEventRelation = require('../src/models/UserEventRelation');
const PointsRecord = require('../src/models/PointsRecord');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 迁移用户数据
async function migrateUsers() {
  console.log('\n🔄 开始迁移用户数据...');
  
  try {
    // 获取所有旧用户数据
    const oldUsers = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`📊 找到 ${oldUsers.length} 个用户需要迁移`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const oldUser of oldUsers) {
      try {
        // 创建新的用户记录
        const newUser = new User({
          nickname: oldUser.nickname,
          avatar: oldUser.avatar,
          total_points: oldUser.stats?.etaPoints || 0,
          status: oldUser.isActive ? 'active' : 'banned',
          ext_info: {
            signature: oldUser.signature,
            phone: oldUser.phone,
            email: oldUser.email,
            gender: oldUser.gender,
            region: oldUser.region,
            bio: oldUser.bio,
            backgroundImage: oldUser.backgroundImage,
            customId: oldUser.customId,
            stats: oldUser.stats,
            clubs: oldUser.clubs
          },
          is_deleted: false,
          created_at: oldUser.createdAt || new Date(),
          updated_at: oldUser.updatedAt || new Date()
        });
        
        await newUser.save();
        
        // 创建微信登录认证记录
        if (oldUser.openid) {
          await UserAuth.addAuthForUser(
            newUser._id,
            'wechat',
            oldUser.openid,
            true // 设为主登录方式
          );
        }
        
        // 如果有unionid，也添加记录
        if (oldUser.unionid) {
          await UserAuth.addAuthForUser(
            newUser._id,
            'wechat',
            oldUser.unionid,
            false
          );
        }
        
        migratedCount++;
        if (migratedCount % 10 === 0) {
          console.log(`✅ 已迁移 ${migratedCount} 个用户`);
        }
        
      } catch (error) {
        console.error(`❌ 迁移用户失败 (${oldUser._id}):`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ 用户迁移完成: 成功 ${migratedCount}, 失败 ${errorCount}`);
    
  } catch (error) {
    console.error('❌ 用户迁移过程出错:', error);
  }
}

// 迁移赛事数据
async function migrateEvents() {
  console.log('\n🔄 开始迁移赛事数据...');
  
  try {
    // 获取所有旧赛事数据
    const oldEvents = await mongoose.connection.db.collection('events').find({}).toArray();
    console.log(`📊 找到 ${oldEvents.length} 个赛事需要迁移`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const oldEvent of oldEvents) {
      try {
        // 映射赛事分类
        const categoryMapping = {
          '男子单打': 'tennis',
          '女子单打': 'tennis',
          '男子双打': 'tennis',
          '女子双打': 'tennis',
          '混合双打': 'tennis'
        };
        
        // 映射赛事状态
        const statusMapping = {
          'registration': 'published',
          'upcoming': 'published',
          'ongoing': 'ongoing',
          'completed': 'ended',
          'cancelled': 'canceled'
        };
        
        // 创建新的赛事记录
        const newEvent = new Event({
          title: oldEvent.name,
          category: categoryMapping[oldEvent.eventType] || 'tennis',
          start_time: oldEvent.eventDate,
          end_time: new Date(new Date(oldEvent.eventDate).getTime() + 4 * 60 * 60 * 1000), // 默认4小时后结束
          location: oldEvent.venue,
          description: oldEvent.description,
          max_participants: oldEvent.maxParticipants > 0 ? oldEvent.maxParticipants : null,
          status: statusMapping[oldEvent.status] || 'draft',
          ext_info: {
            region: oldEvent.region,
            organizer: oldEvent.organizer,
            coverImage: oldEvent.coverImage,
            registrationDeadline: oldEvent.registrationDeadline,
            registrationFee: oldEvent.registrationFee,
            tags: oldEvent.tags,
            isPublic: oldEvent.isPublic,
            eventType: oldEvent.eventType,
            matches: oldEvent.matches
          },
          is_deleted: false,
          created_at: oldEvent.createdAt || new Date(),
          updated_at: oldEvent.updatedAt || new Date()
        });
        
        await newEvent.save();
        
        // 迁移参与者数据
        if (oldEvent.participants && oldEvent.participants.length > 0) {
          await migrateEventParticipants(oldEvent, newEvent);
        }
        
        migratedCount++;
        if (migratedCount % 5 === 0) {
          console.log(`✅ 已迁移 ${migratedCount} 个赛事`);
        }
        
      } catch (error) {
        console.error(`❌ 迁移赛事失败 (${oldEvent._id}):`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ 赛事迁移完成: 成功 ${migratedCount}, 失败 ${errorCount}`);
    
  } catch (error) {
    console.error('❌ 赛事迁移过程出错:', error);
  }
}

// 迁移赛事参与者数据
async function migrateEventParticipants(oldEvent, newEvent) {
  for (const participant of oldEvent.participants) {
    try {
      // 查找对应的新用户ID
      const userAuth = await UserAuth.findOne({
        auth_type: 'wechat',
        auth_id: { $exists: true }
      }).populate('user_id');
      
      if (!userAuth) {
        console.warn(`⚠️ 找不到用户认证记录，跳过参与者: ${participant.user}`);
        continue;
      }
      
      // 创建用户-赛事关联记录
      const relation = new UserEventRelation({
        user_id: userAuth.user_id._id,
        event_id: newEvent._id,
        signup_time: participant.registeredAt || new Date(),
        signup_status: participant.paymentStatus === 'paid' ? 'approved' : 'pending',
        points: 0, // 初始积分为0，后续可以根据业务逻辑调整
        points_type: [],
        is_signin: false,
        signin_time: null,
        signin_method: null,
        rank: null,
        is_deleted: false,
        updated_at: new Date()
      });
      
      await relation.save();
      
      // 如果用户已支付，给予基础积分
      if (participant.paymentStatus === 'paid') {
        await PointsRecord.createRecord(
          userAuth.user_id._id,
          newEvent._id,
          relation._id,
          10, // 基础参与积分
          '赛事报名基础积分'
        );
      }
      
    } catch (error) {
      console.error(`❌ 迁移参与者失败:`, error.message);
    }
  }
}

// 清理旧数据（可选）
async function cleanupOldData() {
  console.log('\n🧹 开始清理旧数据...');
  
  try {
    // 备份旧数据到新集合
    await mongoose.connection.db.collection('users_backup').insertMany(
      await mongoose.connection.db.collection('users').find({}).toArray()
    );
    
    await mongoose.connection.db.collection('events_backup').insertMany(
      await mongoose.connection.db.collection('events').find({}).toArray()
    );
    
    console.log('✅ 旧数据已备份');
    
    // 可选：删除旧集合（谨慎操作）
    // await mongoose.connection.db.collection('users').drop();
    // await mongoose.connection.db.collection('events').drop();
    // console.log('✅ 旧集合已删除');
    
  } catch (error) {
    console.error('❌ 清理旧数据失败:', error);
  }
}

// 主迁移函数
async function migrate() {
  console.log('🚀 开始数据库迁移...');
  
  await connectDB();
  
  try {
    await migrateUsers();
    await migrateEvents();
    // await cleanupOldData(); // 取消注释以清理旧数据
    
    console.log('\n🎉 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移过程出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行迁移
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
