const mongoose = require('mongoose');

// 用户-赛事关联表 - 记录用户与赛事的交互关系（报名/积分/签到等）
const userEventRelationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  signup_time: {
    type: Date,
    default: Date.now
  },
  signup_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    default: 'participant'
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  points_type: [{
    type: {
      type: String,
      enum: ['base', 'rank', 'participation', 'bonus', 'penalty']
    },
    value: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  is_signin: {
    type: Boolean,
    default: false
  },
  signin_time: {
    type: Date,
    default: null
  },
  signin_method: {
    type: String,
    enum: ['qr_code', 'face', 'id_card', 'manual'],
    default: null
  },
  rank: {
    type: Number,
    default: null,
    min: 1
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// 更新时间戳
userEventRelationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// 签到
userEventRelationSchema.methods.signIn = function(method = 'manual') {
  if (this.is_signin) {
    throw new Error('用户已签到');
  }
  
  this.is_signin = true;
  this.signin_time = new Date();
  this.signin_method = method;
  
  return this.save();
};

// 添加积分
userEventRelationSchema.methods.addPoints = function(type, value, reason = '') {
  this.points_type.push({
    type: type,
    value: value,
    reason: reason
  });
  
  this.points += value;
  return this.save();
};

// 设置排名
userEventRelationSchema.methods.setRank = function(rank) {
  this.rank = rank;
  
  // 根据排名给予奖励积分
  let bonusPoints = 0;
  if (rank === 1) bonusPoints = 50;
  else if (rank === 2) bonusPoints = 30;
  else if (rank === 3) bonusPoints = 20;
  else if (rank <= 10) bonusPoints = 10;
  
  if (bonusPoints > 0) {
    this.addPoints('rank', bonusPoints, `第${rank}名奖励`);
  }
  
  return this.save();
};

// 更新报名状态
userEventRelationSchema.methods.updateSignupStatus = function(status, reason = '') {
  const validTransitions = {
    'pending': ['approved', 'rejected'],
    'approved': ['rejected'],
    'rejected': ['approved', 'pending']
  };
  
  if (!validTransitions[this.signup_status].includes(status)) {
    throw new Error(`Cannot transition from ${this.signup_status} to ${status}`);
  }
  
  this.signup_status = status;
  if (reason) {
    this.ext_info = this.ext_info || {};
    this.ext_info.statusReason = reason;
  }
  
  return this.save();
};

// 软删除（取消报名）
userEventRelationSchema.methods.softDelete = function() {
  this.is_deleted = true;
  return this.save();
};

// 恢复报名
userEventRelationSchema.methods.restore = function() {
  this.is_deleted = false;
  return this.save();
};

// 静态方法：检查用户是否已报名
userEventRelationSchema.statics.isUserRegistered = function(userId, eventId) {
  return this.findOne({
    user_id: userId,
    event_id: eventId,
    is_deleted: false
  });
};

// 静态方法：获取赛事的参与者列表
userEventRelationSchema.statics.getEventParticipants = function(eventId, options = {}) {
  const { status = 'approved', includeDeleted = false, limit = 50, page = 1 } = options;
  
  const query = {
    event_id: eventId,
    signup_status: status
  };
  
  if (!includeDeleted) {
    query.is_deleted = false;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('user_id', 'nickname avatar total_points')
    .sort({ signup_time: 1 })
    .skip(skip)
    .limit(limit);
};

// 静态方法：获取用户的报名记录
userEventRelationSchema.statics.getUserEventHistory = function(userId, options = {}) {
  const { status, includeDeleted = false, limit = 20, page = 1 } = options;
  
  const query = {
    user_id: userId
  };
  
  if (status) {
    query.signup_status = status;
  }
  
  if (!includeDeleted) {
    query.is_deleted = false;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('event_id', 'title category start_time end_time location status')
    .sort({ signup_time: -1 })
    .skip(skip)
    .limit(limit);
};

// 静态方法：获取赛事统计
userEventRelationSchema.statics.getEventStats = async function(eventId) {
  const stats = await this.aggregate([
    {
      $match: {
        event_id: new mongoose.Types.ObjectId(eventId),
        is_deleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalSignups: { $sum: 1 },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$signup_status', 'approved'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$signup_status', 'pending'] }, 1, 0] }
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ['$signup_status', 'rejected'] }, 1, 0] }
        },
        signinCount: {
          $sum: { $cond: ['$is_signin', 1, 0] }
        },
        totalPoints: { $sum: '$points' }
      }
    }
  ]);
  
  return stats[0] || {
    totalSignups: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    signinCount: 0,
    totalPoints: 0
  };
};

// 索引
userEventRelationSchema.index({ user_id: 1, event_id: 1, is_deleted: 1 }, { unique: true });
userEventRelationSchema.index({ event_id: 1, signup_status: 1 });
userEventRelationSchema.index({ user_id: 1, signup_time: -1 });
userEventRelationSchema.index({ signin_time: -1 });

module.exports = mongoose.model('UserEventRelation', userEventRelationSchema);
