const User = require('../models/User');
const Match = require('../models/Match');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Order = require('../models/Order');

// 创建数据库索引以优化查询性能
const createIndexes = async () => {
  try {
    console.log('🔍 Creating database indexes...');

    // User 索引
    await User.collection.createIndex({ openid: 1 }, { unique: true });
    await User.collection.createIndex({ unionid: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ email: 1 }, { sparse: true });
    await User.collection.createIndex({ phone: 1 }, { sparse: true });
    await User.collection.createIndex({ region: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ lastLoginAt: -1 });
    await User.collection.createIndex({ createdAt: -1 });

    // Match 索引
    await Match.collection.createIndex({ eventId: 1 });
    await Match.collection.createIndex({ status: 1 });
    await Match.collection.createIndex({ eventType: 1 });
    await Match.collection.createIndex({ venue: 1 });
    await Match.collection.createIndex({ startTime: -1 });
    await Match.collection.createIndex({ endTime: -1 });
    await Match.collection.createIndex({ 'organizer.id': 1 });
    await Match.collection.createIndex({ 'players.userId': 1 });
    await Match.collection.createIndex({ spectators: 1 });
    await Match.collection.createIndex({ isPublic: 1 });
    await Match.collection.createIndex({ createdAt: -1 });
    
    // 复合索引
    await Match.collection.createIndex({ status: 1, eventType: 1 });
    await Match.collection.createIndex({ status: 1, startTime: -1 });
    await Match.collection.createIndex({ eventId: 1, status: 1 });

    // Event 索引
    await Event.collection.createIndex({ status: 1 });
    await Event.collection.createIndex({ eventType: 1 });
    await Event.collection.createIndex({ region: 1 });
    await Event.collection.createIndex({ eventDate: -1 });
    await Event.collection.createIndex({ registrationDeadline: -1 });
    await Event.collection.createIndex({ 'organizer.id': 1 });
    await Event.collection.createIndex({ 'participants.user': 1 });
    await Event.collection.createIndex({ isPublic: 1 });
    await Event.collection.createIndex({ createdAt: -1 });
    
    // 复合索引
    await Event.collection.createIndex({ status: 1, eventType: 1 });
    await Event.collection.createIndex({ status: 1, region: 1 });
    await Event.collection.createIndex({ status: 1, eventDate: -1 });

    // Club 索引（如果存在）
    try {
      await Club.collection.createIndex({ name: 1 });
      await Club.collection.createIndex({ region: 1 });
      await Club.collection.createIndex({ 'members.user': 1 });
      await Club.collection.createIndex({ isActive: 1 });
      await Club.collection.createIndex({ createdBy: 1 });
      await Club.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.log('Club model not found, skipping Club indexes');
    }

    // Order 索引（如果存在）
    try {
      // orderNumber已经在模型中设置为unique，不需要重复创建
      await Order.collection.createIndex({ userId: 1 });
      await Order.collection.createIndex({ type: 1 });
      await Order.collection.createIndex({ relatedId: 1 });
      await Order.collection.createIndex({ status: 1 });
      await Order.collection.createIndex({ paymentStatus: 1 });
      await Order.collection.createIndex({ paymentMethod: 1 });
      await Order.collection.createIndex({ paidAt: -1 });
      await Order.collection.createIndex({ expiresAt: 1 });
      await Order.collection.createIndex({ createdAt: -1 });
      
      // 复合索引
      await Order.collection.createIndex({ userId: 1, status: 1 });
      await Order.collection.createIndex({ type: 1, status: 1 });
      await Order.collection.createIndex({ relatedId: 1, status: 1 });
    } catch (error) {
      console.log('Order model not found, skipping Order indexes');
    }

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    // 不要因为索引创建失败而停止应用
  }
};

// 获取索引信息
const getIndexInfo = async () => {
  try {
    const collections = ['users', 'matches', 'events', 'clubs', 'orders'];
    const indexInfo = {};

    for (const collectionName of collections) {
      try {
        const collection = require('mongoose').connection.collection(collectionName);
        const indexes = await collection.indexes();
        indexInfo[collectionName] = indexes.map(index => ({
          name: index.name,
          key: index.key,
          unique: index.unique || false,
          sparse: index.sparse || false
        }));
      } catch (error) {
        indexInfo[collectionName] = { error: 'Collection not found' };
      }
    }

    return indexInfo;
  } catch (error) {
    console.error('Error getting index info:', error);
    return { error: error.message };
  }
};

module.exports = {
  createIndexes,
  getIndexInfo
};