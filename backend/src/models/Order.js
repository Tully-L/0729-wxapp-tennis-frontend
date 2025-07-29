const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['event_registration', 'match_fee', 'subscription', 'other'],
    default: 'other'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Event', 'Match', 'Club'],
    required: function() {
      return this.type !== 'other';
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'CNY'
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'other'],
    default: 'wechat'
  },
  // 微信支付相关字段
  wechatPrepayId: {
    type: String
  },
  wechatTransactionId: {
    type: String
  },
  // 支付时间
  paidAt: {
    type: Date
  },
  // 过期时间
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
    }
  },
  // 退款信息
  refundAmount: {
    type: Number,
    default: 0
  },
  refundedAt: {
    type: Date
  },
  // 备注
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// 生成订单号
orderSchema.statics.generateOrderNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TH${year}${month}${day}${random}`;
};

// 检查订单是否过期
orderSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// 检查是否可以支付
orderSchema.methods.canPay = function() {
  return this.status === 'pending' && 
         this.paymentStatus === 'pending' && 
         !this.isExpired();
};

// 检查是否可以退款
orderSchema.methods.canRefund = function() {
  return this.status === 'paid' && 
         this.paymentStatus === 'completed' &&
         this.refundAmount < this.amount;
};

// 获取可退款金额
orderSchema.methods.getRefundableAmount = function() {
  return this.amount - this.refundAmount;
};

// 预保存中间件 - 自动生成订单号
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = this.constructor.generateOrderNumber();
  }
  next();
});

// 索引
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Order', orderSchema); 