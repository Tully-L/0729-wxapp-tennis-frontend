const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unionid: {
    type: String,
    unique: true,
    sparse: true
  },
  nickname: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  region: {
    type: String,
    trim: true
  },
  stats: {
    participationCount: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    winRate: {
      type: String,
      default: '0%'
    },
    etaPoints: {
      type: Number,
      default: 0
    }
  },
  clubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 更新统计数据的方法
userSchema.methods.updateStats = function() {
  const total = this.stats.wins + this.stats.losses;
  this.stats.winRate = total > 0 ? `${Math.round((this.stats.wins / total) * 100)}%` : '0%';
  return this.save();
};

// 添加比赛记录
userSchema.methods.addMatch = function(isWin) {
  this.stats.participationCount += 1;
  if (isWin) {
    this.stats.wins += 1;
    // 胜利奖励积分
    this.stats.etaPoints += 10;
  } else {
    this.stats.losses += 1;
    // 参与奖励积分
    this.stats.etaPoints += 3;
  }
  return this.updateStats();
};

// 获取用户等级
userSchema.methods.getUserLevel = function() {
  const points = this.stats.etaPoints;
  if (points >= 1000) return { level: 'Professional', name: '职业选手' };
  if (points >= 500) return { level: 'Advanced', name: '高级选手' };
  if (points >= 200) return { level: 'Intermediate', name: '中级选手' };
  if (points >= 50) return { level: 'Beginner', name: '初级选手' };
  return { level: 'Rookie', name: '新手' };
};

// 检查是否可以参加比赛
userSchema.methods.canParticipateInMatch = function(matchType) {
  if (!this.isActive) return { canParticipate: false, reason: '账户已停用' };
  
  // 根据比赛类型检查资格
  const level = this.getUserLevel();
  if (matchType === 'professional' && level.level !== 'Professional') {
    return { canParticipate: false, reason: '需要职业选手等级' };
  }
  
  return { canParticipate: true };
};

// 获取用户的比赛历史统计
userSchema.methods.getMatchHistory = async function(options = {}) {
  const Match = require('./Match');
  const { limit = 10, status, eventType, startDate, endDate } = options;
  
  const query = {
    $or: [
      { 'players.userId': this._id },
      { 'organizer.id': this._id }
    ]
  };
  
  // 添加状态筛选
  if (status) {
    query.status = status;
  }
  
  // 添加赛事类型筛选
  if (eventType) {
    query.eventType = eventType;
  }
  
  // 添加日期范围筛选
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const matches = await Match.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('eventId', 'name eventType venue')
    .select('eventType stage status venue startTime endTime players score sets winner createdAt');
  
  return matches;
};

// 加入俱乐部
userSchema.methods.joinClub = function(clubId) {
  if (!this.clubs.includes(clubId)) {
    this.clubs.push(clubId);
    return this.save();
  }
  return Promise.resolve(this);
};

// 离开俱乐部
userSchema.methods.leaveClub = function(clubId) {
  this.clubs = this.clubs.filter(club => !club.equals(clubId));
  return this.save();
};

// 获取公开的用户信息（用于显示给其他用户）
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    nickname: this.nickname,
    avatar: this.avatar,
    region: this.region,
    stats: this.stats,
    level: this.getUserLevel(),
    joinedAt: this.createdAt
  };
};

// 静态方法：根据积分排名获取用户
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.etaPoints': -1 })
    .limit(limit)
    .select('nickname avatar stats region');
};

// 静态方法：搜索用户
userSchema.statics.searchUsers = function(query, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    $or: [
      { nickname: searchRegex },
      { region: searchRegex }
    ]
  })
  .limit(limit)
  .select('nickname avatar region stats');
};

// 获取用户详细统计信息
userSchema.methods.getDetailedStats = async function() {
  const Match = require('./Match');
  const Event = require('./Event');
  
  // 获取比赛统计
  const matchStats = await Match.aggregate([
    {
      $match: {
        $or: [
          { 'players.userId': this._id },
          { 'organizer.id': this._id }
        ]
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        wins: {
          $sum: {
            $cond: [{ $eq: ['$winner', this.nickname] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  // 获取参与的赛事统计
  const eventStats = await Event.aggregate([
    {
      $match: {
        'participants.user': this._id
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // 计算月度活跃度
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const monthlyActivity = await Match.countDocuments({
    $or: [
      { 'players.userId': this._id },
      { 'organizer.id': this._id }
    ],
    createdAt: { $gte: thisMonth }
  });
  
  return {
    basic: this.stats,
    level: this.getUserLevel(),
    matchesByType: matchStats,
    eventsByType: eventStats,
    monthlyActivity,
    accountAge: Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)),
    lastActive: this.lastLoginAt
  };
};

// 更新用户活跃度
userSchema.methods.updateActivity = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// 验证用户权限
userSchema.methods.hasPermission = function(permission) {
  const level = this.getUserLevel();
  const permissions = {
    'Rookie': ['view_matches', 'join_events'],
    'Beginner': ['view_matches', 'join_events', 'create_private_events'],
    'Intermediate': ['view_matches', 'join_events', 'create_private_events', 'organize_matches'],
    'Advanced': ['view_matches', 'join_events', 'create_private_events', 'organize_matches', 'moderate_events'],
    'Professional': ['view_matches', 'join_events', 'create_private_events', 'organize_matches', 'moderate_events', 'admin_functions']
  };
  
  return permissions[level.level]?.includes(permission) || false;
};

// 获取用户成就
userSchema.methods.getAchievements = function() {
  const achievements = [];
  const stats = this.stats;
  
  // 参与成就
  if (stats.participationCount >= 100) achievements.push({ name: '百战老将', description: '参与100场比赛' });
  else if (stats.participationCount >= 50) achievements.push({ name: '活跃选手', description: '参与50场比赛' });
  else if (stats.participationCount >= 10) achievements.push({ name: '新星崛起', description: '参与10场比赛' });
  
  // 胜利成就
  if (stats.wins >= 50) achievements.push({ name: '胜利之王', description: '获得50场胜利' });
  else if (stats.wins >= 20) achievements.push({ name: '常胜将军', description: '获得20场胜利' });
  else if (stats.wins >= 5) achievements.push({ name: '初露锋芒', description: '获得5场胜利' });
  
  // 积分成就
  if (stats.etaPoints >= 2000) achievements.push({ name: '传奇选手', description: '获得2000积分' });
  else if (stats.etaPoints >= 1000) achievements.push({ name: '职业水准', description: '获得1000积分' });
  else if (stats.etaPoints >= 500) achievements.push({ name: '进阶选手', description: '获得500积分' });
  
  // 胜率成就
  const winRate = parseFloat(stats.winRate);
  if (winRate >= 80 && stats.participationCount >= 10) achievements.push({ name: '无敌战神', description: '胜率达到80%' });
  else if (winRate >= 60 && stats.participationCount >= 10) achievements.push({ name: '技术高手', description: '胜率达到60%' });
  
  return achievements;
};

// 静态方法：获取用户统计概览
userSchema.statics.getOverallStats = async function() {
  const totalUsers = await this.countDocuments({ isActive: true });
  const newUsersThisMonth = await this.countDocuments({
    isActive: true,
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });
  
  const levelDistribution = await this.aggregate([
    { $match: { isActive: true } },
    {
      $addFields: {
        level: {
          $switch: {
            branches: [
              { case: { $gte: ['$stats.etaPoints', 1000] }, then: 'Professional' },
              { case: { $gte: ['$stats.etaPoints', 500] }, then: 'Advanced' },
              { case: { $gte: ['$stats.etaPoints', 200] }, then: 'Intermediate' },
              { case: { $gte: ['$stats.etaPoints', 50] }, then: 'Beginner' }
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

module.exports = mongoose.model('User', userSchema); 