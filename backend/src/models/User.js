const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户核心信息表 - 存储用户基础信息及全局状态
const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  total_points: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'banned'],
    default: 'active',
    index: true
  },
  ext_info: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // 使用自定义的时间戳字段
});

// 更新时间戳
userSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// 获取用户等级
userSchema.methods.getUserLevel = function() {
  const points = this.total_points;
  if (points >= 1000) return { level: 'Professional', name: '职业选手' };
  if (points >= 500) return { level: 'Advanced', name: '高级选手' };
  if (points >= 200) return { level: 'Intermediate', name: '中级选手' };
  if (points >= 50) return { level: 'Beginner', name: '初级选手' };
  return { level: 'Rookie', name: '新手' };
};

// 检查是否可以参加比赛
userSchema.methods.canParticipateInEvent = function(eventType) {
  if (this.status !== 'active') return { canParticipate: false, reason: '账户已停用' };
  if (this.is_deleted) return { canParticipate: false, reason: '账户已删除' };

  // 根据赛事类型检查资格
  const level = this.getUserLevel();
  if (eventType === 'professional' && level.level !== 'Professional') {
    return { canParticipate: false, reason: '需要职业选手等级' };
  }

  return { canParticipate: true };
};

// 软删除用户
userSchema.methods.softDelete = function() {
  this.is_deleted = true;
  this.status = 'banned';
  return this.save();
};

// 恢复用户
userSchema.methods.restore = function() {
  this.is_deleted = false;
  this.status = 'active';
  return this.save();
};

// 获取公开的用户信息（用于显示给其他用户）
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    nickname: this.nickname,
    avatar: this.avatar,
    total_points: this.total_points,
    level: this.getUserLevel(),
    joinedAt: this.created_at,
    ext_info: this.ext_info
  };
};

// 更新积分
userSchema.methods.updatePoints = function(amount) {
  this.total_points = Math.max(0, this.total_points + amount);
  return this.save();
};

// 静态方法：根据积分排名获取用户
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ status: 'active', is_deleted: false })
    .sort({ total_points: -1 })
    .limit(limit)
    .select('nickname avatar total_points ext_info');
};

// 静态方法：搜索用户
userSchema.statics.searchUsers = function(query, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    status: 'active',
    is_deleted: false,
    $or: [
      { nickname: searchRegex },
      { 'ext_info.region': searchRegex }
    ]
  })
  .limit(limit)
  .select('nickname avatar total_points ext_info');
};

// 验证用户权限
userSchema.methods.hasPermission = function(permission) {
  const level = this.getUserLevel();
  const permissions = {
    'Rookie': ['view_events', 'join_events'],
    'Beginner': ['view_events', 'join_events', 'create_private_events'],
    'Intermediate': ['view_events', 'join_events', 'create_private_events', 'organize_events'],
    'Advanced': ['view_events', 'join_events', 'create_private_events', 'organize_events', 'moderate_events'],
    'Professional': ['view_events', 'join_events', 'create_private_events', 'organize_events', 'moderate_events', 'admin_functions']
  };

  return permissions[level.level]?.includes(permission) || false;
};

// 获取用户成就
userSchema.methods.getAchievements = function() {
  const achievements = [];
  const points = this.total_points;

  // 积分成就
  if (points >= 2000) achievements.push({ name: '传奇选手', description: '获得2000积分' });
  else if (points >= 1000) achievements.push({ name: '职业水准', description: '获得1000积分' });
  else if (points >= 500) achievements.push({ name: '进阶选手', description: '获得500积分' });
  else if (points >= 200) achievements.push({ name: '中级选手', description: '获得200积分' });
  else if (points >= 50) achievements.push({ name: '初级选手', description: '获得50积分' });

  return achievements;
};

// 静态方法：获取用户统计概览
userSchema.statics.getOverallStats = async function() {
  const totalUsers = await this.countDocuments({ status: 'active', is_deleted: false });
  const newUsersThisMonth = await this.countDocuments({
    status: 'active',
    is_deleted: false,
    created_at: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });

  const levelDistribution = await this.aggregate([
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

  return {
    totalUsers,
    newUsersThisMonth,
    levelDistribution
  };
};

// 索引
userSchema.index({ status: 1, is_deleted: 1 });
userSchema.index({ total_points: -1 });
userSchema.index({ created_at: -1 });

module.exports = mongoose.model('User', userSchema); 