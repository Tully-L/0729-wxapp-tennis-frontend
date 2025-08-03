const mongoose = require('mongoose');

// 用户多端登录关联表 - 支持多登录方式（微信/手机号等），关联用户核心信息
const userAuthSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  auth_type: {
    type: String,
    required: true,
    enum: ['wechat', 'phone', 'qq', 'weibo', 'email'],
    index: true
  },
  auth_id: {
    type: String,
    required: true,
    trim: true
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  expired_at: {
    type: Date,
    default: null
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// 更新时间戳
userAuthSchema.pre('save', function(next) {
  if (this.isNew) {
    this.created_at = new Date();
  }
  next();
});

// 检查授权是否过期
userAuthSchema.methods.isExpired = function() {
  if (!this.expired_at) return false;
  return new Date() > this.expired_at;
};

// 设置为主登录方式
userAuthSchema.methods.setPrimary = async function() {
  // 先将该用户的其他登录方式设为非主要
  await this.constructor.updateMany(
    { user_id: this.user_id, _id: { $ne: this._id } },
    { is_primary: false }
  );
  
  this.is_primary = true;
  return this.save();
};

// 软删除
userAuthSchema.methods.softDelete = function() {
  this.is_deleted = true;
  return this.save();
};

// 静态方法：根据认证信息查找用户
userAuthSchema.statics.findUserByAuth = function(authType, authId) {
  return this.findOne({
    auth_type: authType,
    auth_id: authId,
    is_deleted: false
  }).populate('user_id');
};

// 静态方法：为用户添加新的认证方式
userAuthSchema.statics.addAuthForUser = async function(userId, authType, authId, isPrimary = false) {
  // 检查是否已存在相同的认证方式
  const existingAuth = await this.findOne({
    auth_type: authType,
    auth_id: authId,
    is_deleted: false
  });
  
  if (existingAuth) {
    throw new Error('该认证方式已被其他用户使用');
  }
  
  const userAuth = new this({
    user_id: userId,
    auth_type: authType,
    auth_id: authId,
    is_primary: isPrimary
  });
  
  if (isPrimary) {
    await userAuth.setPrimary();
  }
  
  return userAuth.save();
};

// 静态方法：获取用户的所有认证方式
userAuthSchema.statics.getUserAuths = function(userId) {
  return this.find({
    user_id: userId,
    is_deleted: false
  }).sort({ is_primary: -1, created_at: -1 });
};

// 索引
userAuthSchema.index({ auth_type: 1, auth_id: 1, is_deleted: 1 }, { unique: true });
userAuthSchema.index({ user_id: 1 });
userAuthSchema.index({ expired_at: 1 });

module.exports = mongoose.model('UserAuth', userAuthSchema);
