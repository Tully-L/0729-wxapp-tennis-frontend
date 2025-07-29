const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  contact: {
    phone: String,
    email: String,
    wechat: String
  },
  stats: {
    memberCount: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    eventCount: {
      type: Number,
      default: 0
    }
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// 添加成员
clubSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User already a member');
  }
  
  this.members.push({ user: userId, role });
  this.stats.memberCount += 1;
  return this.save();
};

// 移除成员
clubSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  if (memberIndex === -1) {
    throw new Error('User not a member');
  }
  
  this.members.splice(memberIndex, 1);
  this.stats.memberCount -= 1;
  return this.save();
};

// 更新成员积分
clubSchema.methods.updateMemberPoints = function(userId, points) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('User not a member');
  }
  
  member.points = points;
  return this.save();
};

module.exports = mongoose.model('Club', clubSchema); 