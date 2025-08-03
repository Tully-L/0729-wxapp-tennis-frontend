const mongoose = require('mongoose');

// 积分流水表 - 详细记录用户积分的增减明细（用于对账和用户查询）
const pointsRecordSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  relation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserEventRelation',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  balance_after: {
    type: Number,
    required: true,
    min: 0
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// 静态方法：创建积分记录
pointsRecordSchema.statics.createRecord = async function(userId, eventId, relationId, amount, reason) {
  const User = require('./User');
  
  // 获取用户当前积分
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 计算新的积分余额
  const newBalance = Math.max(0, user.total_points + amount);
  
  // 创建积分记录
  const record = new this({
    user_id: userId,
    event_id: eventId,
    relation_id: relationId,
    amount: amount,
    reason: reason,
    balance_after: newBalance
  });
  
  // 更新用户积分
  await User.findByIdAndUpdate(userId, { total_points: newBalance });
  
  return record.save();
};

// 静态方法：获取用户积分流水
pointsRecordSchema.statics.getUserPointsHistory = function(userId, options = {}) {
  const { limit = 20, page = 1, startDate, endDate } = options;
  
  const query = { user_id: userId };
  
  // 日期范围筛选
  if (startDate || endDate) {
    query.created_at = {};
    if (startDate) query.created_at.$gte = new Date(startDate);
    if (endDate) query.created_at.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('event_id', 'title category start_time')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
};

// 静态方法：获取赛事积分统计
pointsRecordSchema.statics.getEventPointsStats = async function(eventId) {
  const stats = await this.aggregate([
    {
      $match: {
        event_id: new mongoose.Types.ObjectId(eventId)
      }
    },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalPointsAwarded: {
          $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] }
        },
        totalPointsDeducted: {
          $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] }
        },
        avgPointsPerUser: { $avg: '$amount' },
        maxPoints: { $max: '$amount' },
        minPoints: { $min: '$amount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRecords: 0,
    totalPointsAwarded: 0,
    totalPointsDeducted: 0,
    avgPointsPerUser: 0,
    maxPoints: 0,
    minPoints: 0
  };
};

// 静态方法：获取用户积分统计
pointsRecordSchema.statics.getUserPointsStats = async function(userId, options = {}) {
  const { startDate, endDate } = options;
  
  const matchQuery = { user_id: new mongoose.Types.ObjectId(userId) };
  
  // 日期范围筛选
  if (startDate || endDate) {
    matchQuery.created_at = {};
    if (startDate) matchQuery.created_at.$gte = new Date(startDate);
    if (endDate) matchQuery.created_at.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalEarned: {
          $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] }
        },
        totalSpent: {
          $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] }
        },
        avgTransaction: { $avg: '$amount' },
        maxEarned: { $max: '$amount' },
        maxSpent: { $min: '$amount' },
        currentBalance: { $last: '$balance_after' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRecords: 0,
    totalEarned: 0,
    totalSpent: 0,
    avgTransaction: 0,
    maxEarned: 0,
    maxSpent: 0,
    currentBalance: 0
  };
};

// 静态方法：获取积分排行榜
pointsRecordSchema.statics.getPointsLeaderboard = async function(options = {}) {
  const { limit = 10, startDate, endDate } = options;
  
  const matchQuery = {};
  
  // 日期范围筛选
  if (startDate || endDate) {
    matchQuery.created_at = {};
    if (startDate) matchQuery.created_at.$gte = new Date(startDate);
    if (endDate) matchQuery.created_at.$lte = new Date(endDate);
  }
  
  const leaderboard = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$user_id',
        totalEarned: {
          $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] }
        },
        totalTransactions: { $sum: 1 },
        lastActivity: { $max: '$created_at' }
      }
    },
    { $sort: { totalEarned: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        nickname: '$user.nickname',
        avatar: '$user.avatar',
        totalEarned: 1,
        totalTransactions: 1,
        lastActivity: 1
      }
    }
  ]);
  
  return leaderboard;
};

// 索引
pointsRecordSchema.index({ user_id: 1, created_at: -1 });
pointsRecordSchema.index({ event_id: 1 });
pointsRecordSchema.index({ created_at: -1 });

module.exports = mongoose.model('PointsRecord', pointsRecordSchema);
