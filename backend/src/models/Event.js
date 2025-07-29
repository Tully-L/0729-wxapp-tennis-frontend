const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['男子单打', '女子单打', '男子双打', '女子双打', '混合双打']
  },
  status: {
    type: String,
    required: true,
    enum: ['registration', 'upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'registration'
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
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
  coverImage: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  maxParticipants: {
    type: Number,
    default: 0
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentId: String
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 检查是否可以报名
eventSchema.methods.canRegister = function() {
  return this.status === 'registration' && 
         new Date() < this.registrationDeadline &&
         (this.maxParticipants === 0 || this.currentParticipants < this.maxParticipants);
};

// 添加参与者
eventSchema.methods.addParticipant = function(userId) {
  if (!this.canRegister()) {
    throw new Error('Cannot register for this event');
  }
  
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User already registered');
  }
  
  this.participants.push({ user: userId });
  this.currentParticipants += 1;
  return this.save();
};

// 移除参与者
eventSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => p.user.toString() === userId.toString());
  if (participantIndex === -1) {
    throw new Error('User not registered for this event');
  }
  
  this.participants.splice(participantIndex, 1);
  this.currentParticipants = Math.max(0, this.currentParticipants - 1);
  return this.save();
};

// 更新支付状态
eventSchema.methods.updatePaymentStatus = function(userId, status, paymentId = null) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) {
    throw new Error('User not registered for this event');
  }
  
  participant.paymentStatus = status;
  if (paymentId) {
    participant.paymentId = paymentId;
  }
  
  return this.save();
};

// 检查用户是否已报名
eventSchema.methods.isUserRegistered = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// 获取参与者统计
eventSchema.methods.getParticipantStats = function() {
  const stats = {
    total: this.participants.length,
    paid: 0,
    pending: 0,
    refunded: 0
  };
  
  this.participants.forEach(p => {
    stats[p.paymentStatus]++;
  });
  
  return stats;
};

// 检查是否可以开始比赛
eventSchema.methods.canStartEvent = function() {
  return this.status === 'upcoming' && 
         new Date() >= this.eventDate &&
         this.participants.length >= 2;
};

// 更新赛事状态
eventSchema.methods.updateStatus = function(newStatus, reason = null) {
  const validTransitions = {
    'registration': ['upcoming', 'cancelled'],
    'upcoming': ['ongoing', 'cancelled'],
    'ongoing': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': ['registration'] // 可以重新开放报名
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  if (reason) {
    this.statusReason = reason;
  }
  this.statusUpdatedAt = new Date();
  
  return this.save();
};

// 获取赛事统计信息
eventSchema.methods.getEventStats = function() {
  return {
    id: this._id,
    name: this.name,
    eventType: this.eventType,
    status: this.status,
    participantCount: this.participants.length,
    maxParticipants: this.maxParticipants,
    registrationRate: this.maxParticipants > 0 ? 
      (this.participants.length / this.maxParticipants * 100).toFixed(1) + '%' : 'N/A',
    daysUntilEvent: Math.ceil((this.eventDate - new Date()) / (1000 * 60 * 60 * 24)),
    daysUntilRegistrationDeadline: Math.ceil((this.registrationDeadline - new Date()) / (1000 * 60 * 60 * 24)),
    revenue: this.participants.filter(p => p.paymentStatus === 'paid').length * this.registrationFee,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// 静态方法：获取赛事统计
eventSchema.statics.getEventStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        byType: {
          $push: {
            eventType: '$eventType',
            count: 1
          }
        },
        totalParticipants: { $sum: '$currentParticipants' },
        totalRevenue: {
          $sum: {
            $multiply: [
              '$registrationFee',
              { $size: { $filter: { input: '$participants', cond: { $eq: ['$$this.paymentStatus', 'paid'] } } } }
            ]
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      total: 0,
      byStatus: [],
      byType: [],
      totalParticipants: 0,
      totalRevenue: 0
    };
  }
  
  const stats = result[0];
  
  // 处理状态统计
  const statusCounts = {};
  stats.byStatus.forEach(item => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  });
  
  // 处理类型统计
  const typeCounts = {};
  stats.byType.forEach(item => {
    typeCounts[item.eventType] = (typeCounts[item.eventType] || 0) + 1;
  });
  
  return {
    total: stats.total,
    byStatus: Object.entries(statusCounts).map(([status, count]) => ({ _id: status, count })),
    byType: Object.entries(typeCounts).map(([eventType, count]) => ({ _id: eventType, count })),
    totalParticipants: stats.totalParticipants,
    totalRevenue: stats.totalRevenue
  };
};

// 静态方法：搜索赛事
eventSchema.statics.searchEvents = async function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'eventDate',
    sortOrder = 'asc',
    status,
    eventType,
    region,
    dateRange
  } = options;
  
  const filters = {};
  
  // 文本搜索
  if (query) {
    filters.$or = [
      { name: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') },
      { venue: new RegExp(query, 'i') },
      { 'organizer.name': new RegExp(query, 'i') }
    ];
  }
  
  // 状态筛选
  if (status) {
    filters.status = status;
  }
  
  // 类型筛选
  if (eventType) {
    filters.eventType = eventType;
  }
  
  // 地区筛选
  if (region) {
    filters.region = new RegExp(region, 'i');
  }
  
  // 日期范围筛选
  if (dateRange) {
    if (dateRange.start) {
      filters.eventDate = { $gte: new Date(dateRange.start) };
    }
    if (dateRange.end) {
      filters.eventDate = filters.eventDate || {};
      filters.eventDate.$lte = new Date(dateRange.end);
    }
  }
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  
  const [events, total] = await Promise.all([
    this.find(filters)
      .populate('organizer.id', 'nickname avatar')
      .populate('participants.user', 'nickname avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(filters)
  ]);
  
  return {
    events,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// 索引
eventSchema.index({ name: 'text', description: 'text', venue: 'text' });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ region: 1 });
eventSchema.index({ 'organizer.id': 1 });

module.exports = mongoose.model('Event', eventSchema); 