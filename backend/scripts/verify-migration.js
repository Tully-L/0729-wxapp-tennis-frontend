const mongoose = require('mongoose');
require('dotenv').config();

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

// 验证用户数据
async function verifyUsers() {
  console.log('\n🔍 验证用户数据...');
  
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active', is_deleted: false });
    const deletedUsers = await User.countDocuments({ is_deleted: true });
    
    console.log(`📊 用户统计:`);
    console.log(`  - 总用户数: ${totalUsers}`);
    console.log(`  - 活跃用户: ${activeUsers}`);
    console.log(`  - 已删除用户: ${deletedUsers}`);
    
    // 检查数据完整性
    const usersWithoutNickname = await User.countDocuments({ nickname: { $exists: false } });
    const usersWithInvalidPoints = await User.countDocuments({ total_points: { $lt: 0 } });
    
    if (usersWithoutNickname > 0) {
      console.warn(`⚠️ 发现 ${usersWithoutNickname} 个用户缺少昵称`);
    }
    
    if (usersWithInvalidPoints > 0) {
      console.warn(`⚠️ 发现 ${usersWithInvalidPoints} 个用户积分为负数`);
    }
    
    // 检查用户等级分布
    const levelStats = await User.aggregate([
      { $match: { status: 'active', is_deleted: false } },
      {
        $addFields: {
          level: {
            $switch: {
              branches: [
                { case: { $gte: ['$total_points', 1000] }, then: 'Professional' },
                { case: { $gte: ['$total_points', 500] }, then: 'Advanced' },
                { case: { $gte: ['$total_points', 200] }, then: 'Intermediate' },
                { case: { $gte: ['$total_points', 50] }, then: 'Beginner' }
              ],
              default: 'Rookie'
            }
          }
        }
      },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`📈 用户等级分布:`);
    levelStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} 人`);
    });
    
    console.log('✅ 用户数据验证完成');
    
  } catch (error) {
    console.error('❌ 用户数据验证失败:', error);
  }
}

// 验证用户认证数据
async function verifyUserAuths() {
  console.log('\n🔍 验证用户认证数据...');
  
  try {
    const totalAuths = await UserAuth.countDocuments();
    const activeAuths = await UserAuth.countDocuments({ is_deleted: false });
    const primaryAuths = await UserAuth.countDocuments({ is_primary: true, is_deleted: false });
    
    console.log(`📊 认证统计:`);
    console.log(`  - 总认证记录: ${totalAuths}`);
    console.log(`  - 活跃认证: ${activeAuths}`);
    console.log(`  - 主认证方式: ${primaryAuths}`);
    
    // 按认证类型统计
    const authTypeStats = await UserAuth.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$auth_type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`📱 认证类型分布:`);
    authTypeStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} 个`);
    });
    
    // 检查数据完整性
    const authsWithoutUser = await UserAuth.countDocuments({
      user_id: { $exists: false },
      is_deleted: false
    });
    
    if (authsWithoutUser > 0) {
      console.warn(`⚠️ 发现 ${authsWithoutUser} 个认证记录缺少用户关联`);
    }
    
    console.log('✅ 用户认证数据验证完成');
    
  } catch (error) {
    console.error('❌ 用户认证数据验证失败:', error);
  }
}

// 验证赛事数据
async function verifyEvents() {
  console.log('\n🔍 验证赛事数据...');
  
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ is_deleted: false });
    const deletedEvents = await Event.countDocuments({ is_deleted: true });
    
    console.log(`📊 赛事统计:`);
    console.log(`  - 总赛事数: ${totalEvents}`);
    console.log(`  - 活跃赛事: ${activeEvents}`);
    console.log(`  - 已删除赛事: ${deletedEvents}`);
    
    // 按状态统计
    const statusStats = await Event.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`📈 赛事状态分布:`);
    statusStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} 个`);
    });
    
    // 按分类统计
    const categoryStats = await Event.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`🏆 赛事分类分布:`);
    categoryStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} 个`);
    });
    
    // 检查数据完整性
    const eventsWithInvalidTime = await Event.countDocuments({
      $expr: { $gte: ['$start_time', '$end_time'] }
    });
    
    if (eventsWithInvalidTime > 0) {
      console.warn(`⚠️ 发现 ${eventsWithInvalidTime} 个赛事时间设置有误`);
    }
    
    console.log('✅ 赛事数据验证完成');
    
  } catch (error) {
    console.error('❌ 赛事数据验证失败:', error);
  }
}

// 验证用户赛事关联数据
async function verifyUserEventRelations() {
  console.log('\n🔍 验证用户赛事关联数据...');
  
  try {
    const totalRelations = await UserEventRelation.countDocuments();
    const activeRelations = await UserEventRelation.countDocuments({ is_deleted: false });
    const approvedRelations = await UserEventRelation.countDocuments({ 
      signup_status: 'approved', 
      is_deleted: false 
    });
    
    console.log(`📊 关联统计:`);
    console.log(`  - 总关联记录: ${totalRelations}`);
    console.log(`  - 活跃关联: ${activeRelations}`);
    console.log(`  - 已批准报名: ${approvedRelations}`);
    
    // 按报名状态统计
    const statusStats = await UserEventRelation.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$signup_status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`📝 报名状态分布:`);
    statusStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} 个`);
    });
    
    // 签到统计
    const signinCount = await UserEventRelation.countDocuments({ 
      is_signin: true, 
      is_deleted: false 
    });
    
    console.log(`✅ 已签到用户: ${signinCount} 人`);
    
    console.log('✅ 用户赛事关联数据验证完成');
    
  } catch (error) {
    console.error('❌ 用户赛事关联数据验证失败:', error);
  }
}

// 验证积分记录数据
async function verifyPointsRecords() {
  console.log('\n🔍 验证积分记录数据...');
  
  try {
    const totalRecords = await PointsRecord.countDocuments();
    
    console.log(`📊 积分记录统计:`);
    console.log(`  - 总记录数: ${totalRecords}`);
    
    if (totalRecords > 0) {
      // 积分统计
      const pointsStats = await PointsRecord.aggregate([
        {
          $group: {
            _id: null,
            totalAwarded: {
              $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] }
            },
            totalDeducted: {
              $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] }
            },
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
            minAmount: { $min: '$amount' }
          }
        }
      ]);
      
      if (pointsStats.length > 0) {
        const stats = pointsStats[0];
        console.log(`💰 积分统计:`);
        console.log(`  - 总发放积分: ${stats.totalAwarded}`);
        console.log(`  - 总扣除积分: ${stats.totalDeducted}`);
        console.log(`  - 平均变动: ${stats.avgAmount.toFixed(2)}`);
        console.log(`  - 最大奖励: ${stats.maxAmount}`);
        console.log(`  - 最大扣除: ${stats.minAmount}`);
      }
    }
    
    console.log('✅ 积分记录数据验证完成');
    
  } catch (error) {
    console.error('❌ 积分记录数据验证失败:', error);
  }
}

// 验证数据一致性
async function verifyDataConsistency() {
  console.log('\n🔍 验证数据一致性...');
  
  try {
    // 检查用户认证关联
    const usersWithoutAuth = await User.aggregate([
      {
        $lookup: {
          from: 'userauths',
          localField: '_id',
          foreignField: 'user_id',
          as: 'auths'
        }
      },
      {
        $match: {
          auths: { $size: 0 },
          is_deleted: false
        }
      },
      { $count: 'count' }
    ]);
    
    const usersWithoutAuthCount = usersWithoutAuth[0]?.count || 0;
    if (usersWithoutAuthCount > 0) {
      console.warn(`⚠️ 发现 ${usersWithoutAuthCount} 个用户没有认证记录`);
    }
    
    // 检查孤立的认证记录
    const orphanAuths = await UserAuth.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          user: { $size: 0 },
          is_deleted: false
        }
      },
      { $count: 'count' }
    ]);
    
    const orphanAuthsCount = orphanAuths[0]?.count || 0;
    if (orphanAuthsCount > 0) {
      console.warn(`⚠️ 发现 ${orphanAuthsCount} 个孤立的认证记录`);
    }
    
    console.log('✅ 数据一致性验证完成');
    
  } catch (error) {
    console.error('❌ 数据一致性验证失败:', error);
  }
}

// 主验证函数
async function verifyMigration() {
  console.log('🚀 开始验证数据库迁移结果...');
  
  await connectDB();
  
  try {
    await verifyUsers();
    await verifyUserAuths();
    await verifyEvents();
    await verifyUserEventRelations();
    await verifyPointsRecords();
    await verifyDataConsistency();
    
    console.log('\n🎉 数据库迁移验证完成！');
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行验证
if (require.main === module) {
  verifyMigration();
}

module.exports = { verifyMigration };
