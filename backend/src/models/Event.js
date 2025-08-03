const mongoose = require('mongoose');

// 赛事信息表 - 存储赛事基础信息及管理状态
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['tennis', 'running', 'swimming', 'basketball', 'football', 'badminton']
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.start_time;
      },
      message: '结束时间必须晚于开始时间'
    }
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  max_participants: {
    type: Number,
    default: null,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'ended', 'canceled'],
    default: 'draft',
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
  timestamps: false
});

// 更新时间戳
eventSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// 检查是否可以报名
eventSchema.methods.canRegister = function() {
  return this.status === 'published' &&
         new Date() < this.start_time &&
         (this.max_participants === null || this.getCurrentParticipantCount() < this.max_participants) &&
         !this.is_deleted;
};

// 获取当前参与者数量
eventSchema.methods.getCurrentParticipantCount = async function() {
  const UserEventRelation = require('./UserEventRelation');
  return await UserEventRelation.countDocuments({
    event_id: this._id,
    signup_status: 'approved',
    is_deleted: false
  });
};

// 检查是否可以开始赛事
eventSchema.methods.canStartEvent = function() {
  return this.status === 'published' &&
         new Date() >= this.start_time &&
         new Date() < this.end_time;
};

// 更新赛事状态
eventSchema.methods.updateStatus = function(newStatus, reason = null) {
  const validTransitions = {
    'draft': ['published', 'canceled'],
    'published': ['ongoing', 'canceled'],
    'ongoing': ['ended', 'canceled'],
    'ended': [],
    'canceled': ['draft'] // 可以重新编辑
  };

  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  if (reason) {
    this.ext_info.statusReason = reason;
  }

  return this.save();
};

// 软删除
eventSchema.methods.softDelete = function() {
  this.is_deleted = true;
  this.status = 'canceled';
  return this.save();
};

// 恢复赛事
eventSchema.methods.restore = function() {
  this.is_deleted = false;
  return this.save();
};

// 获取赛事统计信息
eventSchema.methods.getEventStats = async function() {
  const UserEventRelation = require('./UserEventRelation');
  const stats = await UserEventRelation.getEventStats(this._id);

  return {
    id: this._id,
    title: this.title,
    category: this.category,
    status: this.status,
    participantCount: stats.approvedCount,
    maxParticipants: this.max_participants,
    registrationRate: this.max_participants ?
      (stats.approvedCount / this.max_participants * 100).toFixed(1) + '%' : 'N/A',
    daysUntilEvent: Math.ceil((this.start_time - new Date()) / (1000 * 60 * 60 * 24)),
    signinRate: stats.approvedCount > 0 ?
      (stats.signinCount / stats.approvedCount * 100).toFixed(1) + '%' : '0%',
    totalPoints: stats.totalPoints,
    createdAt: this.created_at,
    updatedAt: this.updated_at
  };
};

// 静态方法：获取赛事统计
eventSchema.statics.getOverallStats = async function(filters = {}) {
  // 添加默认过滤条件
  const defaultFilters = { is_deleted: false };
  const finalFilters = { ...defaultFilters, ...filters };

  const pipeline = [
    { $match: finalFilters },
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
        byCategory: {
          $push: {
            category: '$category',
            count: 1
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
      byCategory: []
    };
  }

  const stats = result[0];

  // 处理状态统计
  const statusCounts = {};
  stats.byStatus.forEach(item => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  });

  // 处理分类统计
  const categoryCounts = {};
  stats.byCategory.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  return {
    total: stats.total,
    byStatus: Object.entries(statusCounts).map(([status, count]) => ({ _id: status, count })),
    byCategory: Object.entries(categoryCounts).map(([category, count]) => ({ _id: category, count }))
  };
};

// 静态方法：搜索赛事
eventSchema.statics.searchEvents = async function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'start_time',
    sortOrder = 'asc',
    status,
    category,
    location,
    dateRange,
    includeDeleted = false
  } = options;

  const filters = {};

  // 默认不包含已删除的赛事
  if (!includeDeleted) {
    filters.is_deleted = false;
  }

  // 文本搜索
  if (query) {
    filters.$or = [
      { title: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') },
      { location: new RegExp(query, 'i') }
    ];
  }

  // 状态筛选
  if (status) {
    filters.status = status;
  }

  // 分类筛选
  if (category) {
    filters.category = category;
  }

  // 地点筛选
  if (location) {
    filters.location = new RegExp(location, 'i');
  }

  // 日期范围筛选
  if (dateRange) {
    if (dateRange.start) {
      filters.start_time = { $gte: new Date(dateRange.start) };
    }
    if (dateRange.end) {
      filters.start_time = filters.start_time || {};
      filters.start_time.$lte = new Date(dateRange.end);
    }
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [events, total] = await Promise.all([
    this.find(filters)
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
eventSchema.index({ title: 'text', description: 'text', location: 'text' });
eventSchema.index({ start_time: 1, status: 1 });
eventSchema.index({ status: 1, is_deleted: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ created_at: -1 });

module.exports = mongoose.model('Event', eventSchema);