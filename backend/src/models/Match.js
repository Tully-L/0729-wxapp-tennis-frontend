const mongoose = require('mongoose');

// 选手信息子模式
const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  ranking: {
    type: Number,
    default: null
  },
  seed: {
    type: Number,
    default: null
  }
}, { _id: false });

// 比赛模式
const matchSchema = new mongoose.Schema({
  // 基本信息
  matchName: {
    type: String,
    required: true,
    trim: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['男子单打', '女子单打', '男子双打', '女子双打', '混合双打']
  },
  
  // 比赛状态和阶段
  status: {
    type: String,
    required: true,
    enum: ['报名中', '比赛中', '已结束'],
    default: '报名中'
  },
  stage: {
    type: String,
    required: true,
    enum: ['资格赛', '第一轮', '第二轮', '第三轮', '16强', '8强', '4强', '半决赛', '决赛']
  },
  
  // 地点和时间
  venue: {
    type: String,
    required: true,
    trim: true
  },
  court: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: String, // 格式: "2h15m"
    default: null
  },
  
  // 选手信息
  players: {
    team1: [playerSchema], // 单打时只有一个选手，双打时有两个
    team2: [playerSchema]
  },
  
  // 比赛设置
  matchFormat: {
    type: String,
    required: true,
    enum: ['1盘制', '3盘制', '5盘制'],
    default: '3盘制'
  },
  bestOf: {
    type: Number,
    required: true,
    default: 3 // 3盘制或5盘制
  },
  
  // 比分统计
  score: {
    sets: [{
      setNumber: Number,
      team1Score: Number,
      team2Score: Number,
      tiebreak: {
        played: { type: Boolean, default: false },
        team1Score: { type: Number, default: 0 },
        team2Score: { type: Number, default: 0 }
      }
    }],
    winner: {
      type: String,
      enum: ['team1', 'team2', null],
      default: null
    }
  },
  
  // 统计信息
  statistics: {
    totalGames: { type: Number, default: 0 },
    aces: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    },
    doubleFaults: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    },
    firstServePercentage: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    }
  },
  
  // 发起者和组织信息
  organizer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // 观众和关注
  spectators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  
  // 其他信息
  isLive: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// 索引 - 增强版本
matchSchema.index({ eventId: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ scheduledTime: 1 });
matchSchema.index({ region: 1 });
matchSchema.index({ eventType: 1 });
matchSchema.index({ isLive: 1 });
matchSchema.index({ 'organizer.id': 1 });
matchSchema.index({ spectators: 1 });
matchSchema.index({ viewCount: -1 });
matchSchema.index({ createdAt: -1 });

// 复合索引用于复杂查询
matchSchema.index({ status: 1, eventType: 1, scheduledTime: -1 });
matchSchema.index({ region: 1, status: 1, scheduledTime: -1 });
matchSchema.index({ isLive: 1, scheduledTime: -1 });

// 文本索引用于搜索
matchSchema.index({
  matchName: 'text',
  venue: 'text',
  'players.team1.name': 'text',
  'players.team2.name': 'text',
  'organizer.name': 'text'
});

// 虚拟字段：获取比赛结果摘要
matchSchema.virtual('scoreString').get(function() {
  if (!this.score.sets || this.score.sets.length === 0) {
    return '';
  }
  
  return this.score.sets.map(set => {
    let scoreStr = `${set.team1Score}-${set.team2Score}`;
    if (set.tiebreak.played) {
      const winner = set.team1Score > set.team2Score ? 'team1' : 'team2';
      const winnerTieScore = winner === 'team1' ? set.tiebreak.team1Score : set.tiebreak.team2Score;
      scoreStr += `(${winnerTieScore})`;
    }
    return scoreStr;
  }).join(' ');
});

// 方法：检查比赛是否可以开始
matchSchema.methods.canStart = function() {
  return this.status === '报名中' && 
         this.players.team1.length > 0 && 
         this.players.team2.length > 0;
};

// 方法：开始比赛
matchSchema.methods.startMatch = function() {
  if (!this.canStart()) {
    throw new Error('比赛无法开始');
  }
  
  this.status = '比赛中';
  this.isLive = true;
  this.startTime = new Date();
  return this.save();
};

// 方法：结束比赛
matchSchema.methods.endMatch = function(winner) {
  this.status = '已结束';
  this.isLive = false;
  this.endTime = new Date();
  this.score.winner = winner;
  
  // 计算持续时间
  if (this.startTime && this.endTime) {
    const duration = Math.floor((this.endTime - this.startTime) / 1000 / 60); // 分钟
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    this.duration = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  }
  
  return this.save();
};

// 方法：更新比分
matchSchema.methods.updateScore = function(setNumber, team1Score, team2Score, tiebreakData = null) {
  // 确保比赛正在进行中
  if (this.status !== '比赛中') {
    throw new Error('只能在比赛进行中更新比分');
  }
  
  // 查找或创建对应的盘
  let setIndex = this.score.sets.findIndex(set => set.setNumber === setNumber);
  
  if (setIndex === -1) {
    // 创建新的盘
    this.score.sets.push({
      setNumber: setNumber,
      team1Score: team1Score,
      team2Score: team2Score,
      tiebreak: {
        played: false,
        team1Score: 0,
        team2Score: 0
      }
    });
    setIndex = this.score.sets.length - 1;
  } else {
    // 更新现有的盘
    this.score.sets[setIndex].team1Score = team1Score;
    this.score.sets[setIndex].team2Score = team2Score;
  }
  
  // 处理抢七局
  if (tiebreakData) {
    this.score.sets[setIndex].tiebreak = {
      played: true,
      team1Score: tiebreakData.team1Score || 0,
      team2Score: tiebreakData.team2Score || 0
    };
  }
  
  // 检查是否有获胜者
  this.checkMatchWinner();
  
  return this.save();
};

// 方法：检查比赛获胜者
matchSchema.methods.checkMatchWinner = function() {
  const setsToWin = Math.ceil(this.bestOf / 2); // 3盘制需要赢2盘，5盘制需要赢3盘
  let team1Sets = 0;
  let team2Sets = 0;
  
  this.score.sets.forEach(set => {
    if (set.team1Score > set.team2Score) {
      team1Sets++;
    } else if (set.team2Score > set.team1Score) {
      team2Sets++;
    }
  });
  
  // 检查是否有队伍达到获胜条件
  if (team1Sets >= setsToWin) {
    this.score.winner = 'team1';
    this.status = '已结束';
    this.isLive = false;
    this.endTime = new Date();
  } else if (team2Sets >= setsToWin) {
    this.score.winner = 'team2';
    this.status = '已结束';
    this.isLive = false;
    this.endTime = new Date();
  }
};

// 方法：获取当前比分摘要
matchSchema.methods.getScoreSummary = function() {
  const sets = this.score.sets.map(set => ({
    setNumber: set.setNumber,
    team1Score: set.team1Score,
    team2Score: set.team2Score,
    tiebreak: set.tiebreak.played ? {
      team1Score: set.tiebreak.team1Score,
      team2Score: set.tiebreak.team2Score
    } : null
  }));
  
  return {
    sets: sets,
    winner: this.score.winner,
    isCompleted: this.status === '已结束',
    scoreString: this.scoreString
  };
};

// 方法：添加观众
matchSchema.methods.addSpectator = function(userId) {
  if (!this.spectators.includes(userId)) {
    this.spectators.push(userId);
    this.viewCount += 1;
  }
  return this.save();
};

// 方法：移除观众
matchSchema.methods.removeSpectator = function(userId) {
  const index = this.spectators.indexOf(userId);
  if (index > -1) {
    this.spectators.splice(index, 1);
    this.viewCount = Math.max(0, this.viewCount - 1);
  }
  return this.save();
};

// 方法：获取比赛统计信息 - 增强版本
matchSchema.methods.getMatchStats = function() {
  const totalSets = this.score.sets.length;
  const completedSets = this.score.sets.filter(set => 
    set.team1Score > 0 || set.team2Score > 0
  ).length;
  
  let totalGames = 0;
  let longestSet = null;
  let tiebreakSets = 0;
  
  this.score.sets.forEach(set => {
    const setGames = set.team1Score + set.team2Score;
    totalGames += setGames;
    
    // 找出最长的盘
    if (!longestSet || setGames > longestSet.games) {
      longestSet = {
        setNumber: set.setNumber,
        games: setGames,
        score: `${set.team1Score}-${set.team2Score}`
      };
    }
    
    // 统计抢七盘数
    if (set.tiebreak && set.tiebreak.played) {
      tiebreakSets++;
    }
  });
  
  // 计算比赛强度
  const intensity = this.calculateMatchIntensity();
  
  // 计算预计剩余时间（如果比赛进行中）
  let estimatedTimeRemaining = null;
  if (this.isLive && this.startTime) {
    const elapsed = Date.now() - this.startTime.getTime();
    const avgSetTime = elapsed / Math.max(completedSets, 1);
    const remainingSets = this.bestOf - completedSets;
    estimatedTimeRemaining = Math.max(0, avgSetTime * remainingSets);
  }
  
  return {
    // 基础统计
    totalSets: totalSets,
    completedSets: completedSets,
    totalGames: totalGames,
    duration: this.duration,
    spectatorCount: this.spectators.length,
    viewCount: this.viewCount,
    isLive: this.isLive,
    
    // 增强统计
    longestSet: longestSet,
    tiebreakSets: tiebreakSets,
    intensity: intensity,
    estimatedTimeRemaining: estimatedTimeRemaining,
    
    // 技术统计
    aces: this.statistics.aces,
    doubleFaults: this.statistics.doubleFaults,
    firstServePercentage: this.statistics.firstServePercentage,
    
    // 比赛进度
    progress: {
      setsCompleted: completedSets,
      setsTotal: this.bestOf,
      percentage: Math.round((completedSets / this.bestOf) * 100)
    }
  };
};

// 方法：计算比赛强度
matchSchema.methods.calculateMatchIntensity = function() {
  if (this.score.sets.length === 0) return 'low';
  
  let intensityScore = 0;
  
  this.score.sets.forEach(set => {
    const scoreDiff = Math.abs(set.team1Score - set.team2Score);
    const totalGames = set.team1Score + set.team2Score;
    
    // 比分接近度（差距越小强度越高）
    if (scoreDiff <= 1) intensityScore += 3;
    else if (scoreDiff <= 2) intensityScore += 2;
    else intensityScore += 1;
    
    // 总局数（局数越多强度越高）
    if (totalGames >= 12) intensityScore += 3;
    else if (totalGames >= 10) intensityScore += 2;
    else intensityScore += 1;
    
    // 抢七局（有抢七强度更高）
    if (set.tiebreak && set.tiebreak.played) {
      intensityScore += 2;
      
      // 抢七比分接近度
      const tiebreakDiff = Math.abs(set.tiebreak.team1Score - set.tiebreak.team2Score);
      if (tiebreakDiff <= 2) intensityScore += 2;
    }
  });
  
  const avgIntensity = intensityScore / this.score.sets.length;
  
  if (avgIntensity >= 7) return 'high';
  else if (avgIntensity >= 5) return 'medium';
  else return 'low';
};

// 静态方法：按条件查询比赛
matchSchema.statics.findWithFilters = function(filters = {}, options = {}) {
  const {
    status,
    eventType,
    region,
    dateRange,
    player,
    organizer,
    isLive
  } = filters;
  
  const {
    page = 1,
    limit = 10,
    sortBy = 'scheduledTime',
    sortOrder = -1,
    populate = true
  } = options;
  
  const query = {};
  
  // 应用筛选条件
  if (status) query.status = status;
  if (eventType) query.eventType = eventType;
  if (region) query.region = new RegExp(region, 'i');
  if (isLive !== undefined) query.isLive = isLive;
  if (organizer) query['organizer.id'] = organizer;
  
  // 日期范围筛选
  if (dateRange) {
    if (dateRange.start || dateRange.end) {
      query.scheduledTime = {};
      if (dateRange.start) query.scheduledTime.$gte = new Date(dateRange.start);
      if (dateRange.end) query.scheduledTime.$lte = new Date(dateRange.end);
    }
  }
  
  // 选手筛选
  if (player) {
    query.$or = [
      { 'players.team1.name': new RegExp(player, 'i') },
      { 'players.team2.name': new RegExp(player, 'i') }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  let queryBuilder = this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
  
  if (populate) {
    queryBuilder = queryBuilder
      .populate('eventId', 'name eventType venue')
      .populate('organizer.id', 'nickname avatar');
  }
  
  return queryBuilder;
};

// 静态方法：获取比赛统计概览 - 增强版本
matchSchema.statics.getMatchStats = async function(filters = {}) {
  const totalMatches = await this.countDocuments(filters);
  const liveMatches = await this.countDocuments({ ...filters, isLive: true });
  const completedMatches = await this.countDocuments({ ...filters, status: '已结束' });
  const upcomingMatches = await this.countDocuments({ ...filters, status: '报名中' });
  
  // 按赛事类型统计
  const typeStats = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        liveCount: {
          $sum: { $cond: [{ $eq: ['$isLive', true] }, 1, 0] }
        },
        avgViewCount: { $avg: '$viewCount' },
        totalSpectators: { $sum: { $size: '$spectators' } }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // 按地区统计
  const regionStats = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$region',
        count: { $sum: 1 },
        liveCount: {
          $sum: { $cond: [{ $eq: ['$isLive', true] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // 按时间段统计（今天、本周、本月）
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const timeStats = {
    today: await this.countDocuments({
      ...filters,
      scheduledTime: { $gte: today }
    }),
    thisWeek: await this.countDocuments({
      ...filters,
      scheduledTime: { $gte: thisWeek }
    }),
    thisMonth: await this.countDocuments({
      ...filters,
      scheduledTime: { $gte: thisMonth }
    })
  };
  
  // 热门比赛（按观看数排序）
  const popularMatches = await this.find(filters)
    .sort({ viewCount: -1 })
    .limit(5)
    .select('matchName eventType viewCount spectators scheduledTime')
    .populate('eventId', 'name');
  
  // 比赛强度分布
  const intensityStats = await this.aggregate([
    { $match: { ...filters, status: '已结束' } },
    {
      $project: {
        intensity: {
          $switch: {
            branches: [
              { case: { $gte: [{ $size: '$score.sets' }, 4] }, then: 'high' },
              { case: { $gte: [{ $size: '$score.sets' }, 2] }, then: 'medium' }
            ],
            default: 'low'
          }
        }
      }
    },
    {
      $group: {
        _id: '$intensity',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    // 基础统计
    total: totalMatches,
    live: liveMatches,
    completed: completedMatches,
    upcoming: upcomingMatches,
    
    // 分类统计
    byType: typeStats,
    byRegion: regionStats,
    byTime: timeStats,
    byIntensity: intensityStats,
    
    // 热门数据
    popularMatches: popularMatches,
    
    // 计算比率
    completionRate: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
    liveRate: totalMatches > 0 ? Math.round((liveMatches / totalMatches) * 100) : 0
  };
};

// 静态方法：高级搜索
matchSchema.statics.advancedSearch = async function(searchParams, options = {}) {
  const {
    query,
    eventType,
    status,
    region,
    dateRange,
    playerRanking,
    minViewCount,
    hasLiveStream,
    intensity
  } = searchParams;
  
  const {
    page = 1,
    limit = 10,
    sortBy = 'relevance',
    sortOrder = -1
  } = options;
  
  const aggregationPipeline = [];
  
  // 构建匹配条件
  const matchConditions = {};
  
  if (eventType) matchConditions.eventType = eventType;
  if (status) matchConditions.status = status;
  if (region) matchConditions.region = new RegExp(region, 'i');
  if (hasLiveStream) matchConditions.isLive = true;
  if (minViewCount) matchConditions.viewCount = { $gte: minViewCount };
  
  // 日期范围
  if (dateRange && (dateRange.start || dateRange.end)) {
    matchConditions.scheduledTime = {};
    if (dateRange.start) matchConditions.scheduledTime.$gte = new Date(dateRange.start);
    if (dateRange.end) matchConditions.scheduledTime.$lte = new Date(dateRange.end);
  }
  
  // 选手排名筛选
  if (playerRanking) {
    matchConditions.$or = [
      { 'players.team1.ranking': { $lte: playerRanking } },
      { 'players.team2.ranking': { $lte: playerRanking } }
    ];
  }
  
  aggregationPipeline.push({ $match: matchConditions });
  
  // 文本搜索
  if (query) {
    aggregationPipeline.unshift({
      $match: { $text: { $search: query } }
    });
    
    // 添加相关性评分
    aggregationPipeline.push({
      $addFields: {
        relevanceScore: { $meta: 'textScore' }
      }
    });
  }
  
  // 计算比赛强度（如果需要）
  if (intensity) {
    aggregationPipeline.push({
      $addFields: {
        calculatedIntensity: {
          $switch: {
            branches: [
              { 
                case: { $gte: [{ $size: '$score.sets' }, 4] }, 
                then: 'high' 
              },
              { 
                case: { $gte: [{ $size: '$score.sets' }, 2] }, 
                then: 'medium' 
              }
            ],
            default: 'low'
          }
        }
      }
    });
    
    aggregationPipeline.push({
      $match: { calculatedIntensity: intensity }
    });
  }
  
  // 排序
  let sortStage = {};
  switch (sortBy) {
    case 'relevance':
      if (query) {
        sortStage = { relevanceScore: { $meta: 'textScore' } };
      } else {
        sortStage = { scheduledTime: sortOrder };
      }
      break;
    case 'popularity':
      sortStage = { viewCount: sortOrder };
      break;
    case 'date':
      sortStage = { scheduledTime: sortOrder };
      break;
    default:
      sortStage = { [sortBy]: sortOrder };
  }
  
  aggregationPipeline.push({ $sort: sortStage });
  
  // 分页
  const skip = (page - 1) * limit;
  aggregationPipeline.push({ $skip: skip });
  aggregationPipeline.push({ $limit: limit });
  
  // 关联查询
  aggregationPipeline.push({
    $lookup: {
      from: 'events',
      localField: 'eventId',
      foreignField: '_id',
      as: 'event'
    }
  });
  
  aggregationPipeline.push({
    $lookup: {
      from: 'users',
      localField: 'organizer.id',
      foreignField: '_id',
      as: 'organizerInfo'
    }
  });
  
  const results = await this.aggregate(aggregationPipeline);
  const total = await this.countDocuments(matchConditions);
  
  return {
    matches: results,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    searchParams
  };
};

// 静态方法：获取推荐比赛
matchSchema.statics.getRecommendedMatches = async function(userId, options = {}) {
  const { limit = 10 } = options;
  
  // 获取用户历史观看记录
  const userMatches = await this.find({
    $or: [
      { spectators: userId },
      { 'organizer.id': userId }
    ]
  }).select('eventType region');
  
  // 分析用户偏好
  const preferences = {
    eventTypes: {},
    regions: {}
  };
  
  userMatches.forEach(match => {
    preferences.eventTypes[match.eventType] = (preferences.eventTypes[match.eventType] || 0) + 1;
    preferences.regions[match.region] = (preferences.regions[match.region] || 0) + 1;
  });
  
  // 获取推荐的赛事类型和地区
  const preferredEventTypes = Object.keys(preferences.eventTypes)
    .sort((a, b) => preferences.eventTypes[b] - preferences.eventTypes[a])
    .slice(0, 3);
  
  const preferredRegions = Object.keys(preferences.regions)
    .sort((a, b) => preferences.regions[b] - preferences.regions[a])
    .slice(0, 3);
  
  // 构建推荐查询
  const recommendationQuery = {
    status: { $in: ['报名中', '比赛中'] },
    scheduledTime: { $gte: new Date() }
  };
  
  if (preferredEventTypes.length > 0 || preferredRegions.length > 0) {
    recommendationQuery.$or = [];
    
    if (preferredEventTypes.length > 0) {
      recommendationQuery.$or.push({ eventType: { $in: preferredEventTypes } });
    }
    
    if (preferredRegions.length > 0) {
      recommendationQuery.$or.push({ region: { $in: preferredRegions } });
    }
  }
  
  // 获取推荐比赛
  const recommendedMatches = await this.find(recommendationQuery)
    .sort({ viewCount: -1, scheduledTime: 1 })
    .limit(limit)
    .populate('eventId', 'name eventType')
    .populate('organizer.id', 'nickname avatar');
  
  return {
    matches: recommendedMatches,
    preferences: {
      eventTypes: preferredEventTypes,
      regions: preferredRegions
    },
    total: recommendedMatches.length
  };
};

module.exports = mongoose.model('Match', matchSchema);