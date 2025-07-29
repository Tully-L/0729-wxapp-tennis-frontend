// 微信支付服务 - 支付系统集成
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Event = require('../models/Event');
const User = require('../models/User');

class PaymentService {
  constructor() {
    // 微信支付配置
    this.config = {
      appId: process.env.WECHAT_APP_ID || 'wx_test_app_id',
      mchId: process.env.WECHAT_MCH_ID || 'test_mch_id',
      apiKey: process.env.WECHAT_API_KEY || 'test_api_key_32_characters_long',
      notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payments/notify',
      signType: 'MD5'
    };
    
    // 支付状态映射
    this.paymentStatus = {
      PENDING: 'pending',
      PAID: 'paid',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      CANCELLED: 'cancelled'
    };
    
    console.log('💰 微信支付服务初始化完成');
  }

  // 创建支付订单
  async createPaymentOrder(orderData) {
    try {
      const {
        userId,
        eventId,
        amount,
        description,
        openId
      } = orderData;

      // 验证用户和赛事
      const [user, event] = await Promise.all([
        User.findById(userId),
        Event.findById(eventId)
      ]);

      if (!user) {
        throw new Error('用户不存在');
      }

      if (!event) {
        throw new Error('赛事不存在');
      }

      // 检查是否已经支付
      const existingParticipant = event.participants.find(
        p => p.user.toString() === userId.toString()
      );

      if (existingParticipant && existingParticipant.paymentStatus === 'paid') {
        throw new Error('已经支付过了');
      }

      // 生成订单号
      const outTradeNo = this.generateOrderNumber();
      
      // 创建支付订单数据
      const paymentOrder = {
        orderId: outTradeNo,
        userId: userId,
        eventId: eventId,
        amount: amount,
        description: description || `${event.name} 报名费`,
        status: this.paymentStatus.PENDING,
        createdAt: new Date(),
        expireAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
        metadata: {
          eventName: event.name,
          userName: user.nickname,
          eventDate: event.eventDate
        }
      };

      // 模拟微信支付统一下单API调用
      const wechatPayResult = await this.callWechatUnifiedOrder({
        outTradeNo,
        totalFee: Math.round(amount * 100), // 转换为分
        body: paymentOrder.description,
        openId: openId,
        notifyUrl: this.config.notifyUrl
      });

      // 保存订单到数据库（这里简化为内存存储）
      if (!global.paymentOrders) {
        global.paymentOrders = new Map();
      }
      global.paymentOrders.set(outTradeNo, paymentOrder);

      console.log(`💳 支付订单创建成功: ${outTradeNo}`);

      return {
        success: true,
        data: {
          orderId: outTradeNo,
          paymentParams: wechatPayResult,
          expireTime: paymentOrder.expireAt,
          amount: amount,
          description: paymentOrder.description
        }
      };

    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw error;
    }
  }

  // 模拟微信支付统一下单API
  async callWechatUnifiedOrder(orderData) {
    try {
      const {
        outTradeNo,
        totalFee,
        body,
        openId,
        notifyUrl
      } = orderData;

      // 构建请求参数
      const params = {
        appid: this.config.appId,
        mch_id: this.config.mchId,
        nonce_str: this.generateNonceStr(),
        body: body,
        out_trade_no: outTradeNo,
        total_fee: totalFee,
        spbill_create_ip: '127.0.0.1',
        notify_url: notifyUrl,
        trade_type: 'JSAPI',
        openid: openId
      };

      // 生成签名
      params.sign = this.generateSign(params);

      // 模拟微信API响应
      const mockResponse = {
        return_code: 'SUCCESS',
        return_msg: 'OK',
        appid: this.config.appId,
        mch_id: this.config.mchId,
        nonce_str: this.generateNonceStr(),
        sign: this.generateNonceStr(), // 模拟签名
        result_code: 'SUCCESS',
        prepay_id: `prepay_id_${Date.now()}`,
        trade_type: 'JSAPI'
      };

      // 生成小程序支付参数
      const paymentParams = this.generateMiniProgramPayParams(mockResponse.prepay_id);

      console.log(`📱 微信统一下单成功: ${outTradeNo}`);

      return paymentParams;

    } catch (error) {
      console.error('微信统一下单失败:', error);
      throw new Error('微信支付下单失败');
    }
  }

  // 生成小程序支付参数
  generateMiniProgramPayParams(prepayId) {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;

    const payParams = {
      appId: this.config.appId,
      timeStamp: timeStamp,
      nonceStr: nonceStr,
      package: packageStr,
      signType: this.config.signType
    };

    // 生成支付签名
    payParams.paySign = this.generatePaySign(payParams);

    return payParams;
  }

  // 处理支付回调通知
  async handlePaymentNotify(notifyData) {
    try {
      console.log('📨 收到支付回调通知:', notifyData);

      // 验证签名
      if (!this.verifyNotifySign(notifyData)) {
        throw new Error('签名验证失败');
      }

      const {
        out_trade_no: orderId,
        transaction_id: transactionId,
        total_fee: totalFee,
        result_code: resultCode,
        return_code: returnCode
      } = notifyData;

      // 获取订单信息
      const paymentOrder = global.paymentOrders?.get(orderId);
      if (!paymentOrder) {
        throw new Error('订单不存在');
      }

      // 检查支付结果
      if (returnCode === 'SUCCESS' && resultCode === 'SUCCESS') {
        // 支付成功，更新订单状态
        await this.updatePaymentStatus(orderId, {
          status: this.paymentStatus.PAID,
          transactionId: transactionId,
          paidAt: new Date(),
          paidAmount: totalFee / 100 // 转换为元
        });

        // 更新赛事参与者支付状态
        await this.updateEventParticipantPayment(paymentOrder);

        console.log(`✅ 支付成功处理完成: ${orderId}`);

        return {
          success: true,
          message: '支付成功'
        };
      } else {
        // 支付失败
        await this.updatePaymentStatus(orderId, {
          status: this.paymentStatus.FAILED,
          failReason: notifyData.err_code_des || '支付失败'
        });

        console.log(`❌ 支付失败: ${orderId}`);

        return {
          success: false,
          message: '支付失败'
        };
      }

    } catch (error) {
      console.error('处理支付回调失败:', error);
      throw error;
    }
  }

  // 更新支付状态
  async updatePaymentStatus(orderId, updateData) {
    try {
      const paymentOrder = global.paymentOrders?.get(orderId);
      if (!paymentOrder) {
        throw new Error('订单不存在');
      }

      // 更新订单状态
      Object.assign(paymentOrder, updateData, {
        updatedAt: new Date()
      });

      global.paymentOrders.set(orderId, paymentOrder);

      console.log(`📝 订单状态更新: ${orderId} -> ${updateData.status}`);

      return paymentOrder;

    } catch (error) {
      console.error('更新支付状态失败:', error);
      throw error;
    }
  }

  // 更新赛事参与者支付状态
  async updateEventParticipantPayment(paymentOrder) {
    try {
      const event = await Event.findById(paymentOrder.eventId);
      if (!event) {
        throw new Error('赛事不存在');
      }

      // 更新参与者支付状态
      await event.updatePaymentStatus(
        paymentOrder.userId,
        'paid',
        paymentOrder.orderId
      );

      console.log(`🎾 赛事参与者支付状态更新: ${paymentOrder.eventId}`);

    } catch (error) {
      console.error('更新赛事参与者支付状态失败:', error);
      throw error;
    }
  }

  // 查询支付状态
  async queryPaymentStatus(orderId) {
    try {
      // 从本地获取订单信息
      const paymentOrder = global.paymentOrders?.get(orderId);
      if (!paymentOrder) {
        throw new Error('订单不存在');
      }

      // 模拟查询微信支付状态
      const wechatQueryResult = await this.queryWechatPaymentStatus(orderId);

      // 如果本地状态与微信状态不一致，更新本地状态
      if (wechatQueryResult.trade_state === 'SUCCESS' && paymentOrder.status !== 'paid') {
        await this.updatePaymentStatus(orderId, {
          status: this.paymentStatus.PAID,
          transactionId: wechatQueryResult.transaction_id,
          paidAt: new Date()
        });
      }

      return {
        success: true,
        data: {
          orderId: orderId,
          status: paymentOrder.status,
          amount: paymentOrder.amount,
          createdAt: paymentOrder.createdAt,
          paidAt: paymentOrder.paidAt,
          expireAt: paymentOrder.expireAt,
          metadata: paymentOrder.metadata
        }
      };

    } catch (error) {
      console.error('查询支付状态失败:', error);
      throw error;
    }
  }

  // 模拟查询微信支付状态
  async queryWechatPaymentStatus(orderId) {
    // 模拟微信查询订单API响应
    return {
      return_code: 'SUCCESS',
      return_msg: 'OK',
      trade_state: 'SUCCESS',
      transaction_id: `wx_${Date.now()}`,
      out_trade_no: orderId,
      total_fee: 10000 // 100元，单位分
    };
  }

  // 申请退款
  async requestRefund(refundData) {
    try {
      const {
        orderId,
        refundAmount,
        refundReason,
        operatorId
      } = refundData;

      // 获取原订单信息
      const paymentOrder = global.paymentOrders?.get(orderId);
      if (!paymentOrder) {
        throw new Error('订单不存在');
      }

      if (paymentOrder.status !== 'paid') {
        throw new Error('订单未支付，无法退款');
      }

      // 生成退款单号
      const refundNo = this.generateRefundNumber();

      // 模拟微信退款API调用
      const wechatRefundResult = await this.callWechatRefund({
        outTradeNo: orderId,
        outRefundNo: refundNo,
        totalFee: Math.round(paymentOrder.amount * 100),
        refundFee: Math.round(refundAmount * 100),
        refundDesc: refundReason
      });

      // 更新订单状态
      await this.updatePaymentStatus(orderId, {
        status: this.paymentStatus.REFUNDED,
        refundAmount: refundAmount,
        refundReason: refundReason,
        refundNo: refundNo,
        refundAt: new Date(),
        operatorId: operatorId
      });

      // 更新赛事参与者状态
      const event = await Event.findById(paymentOrder.eventId);
      if (event) {
        await event.updatePaymentStatus(paymentOrder.userId, 'refunded', refundNo);
      }

      console.log(`💸 退款申请成功: ${orderId} -> ${refundNo}`);

      return {
        success: true,
        data: {
          orderId: orderId,
          refundNo: refundNo,
          refundAmount: refundAmount,
          refundStatus: 'processing'
        }
      };

    } catch (error) {
      console.error('申请退款失败:', error);
      throw error;
    }
  }

  // 模拟微信退款API
  async callWechatRefund(refundData) {
    // 模拟微信退款API响应
    return {
      return_code: 'SUCCESS',
      return_msg: 'OK',
      result_code: 'SUCCESS',
      refund_id: `wx_refund_${Date.now()}`,
      out_refund_no: refundData.outRefundNo,
      refund_fee: refundData.refundFee
    };
  }

  // 获取支付统计
  async getPaymentStats(filters = {}) {
    try {
      const { startDate, endDate, eventId, status } = filters;
      
      // 从内存中获取订单数据（实际应用中应该从数据库获取）
      const orders = Array.from(global.paymentOrders?.values() || []);
      
      let filteredOrders = orders;

      // 应用筛选条件
      if (startDate) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) >= new Date(startDate)
        );
      }

      if (endDate) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) <= new Date(endDate)
        );
      }

      if (eventId) {
        filteredOrders = filteredOrders.filter(order => 
          order.eventId === eventId
        );
      }

      if (status) {
        filteredOrders = filteredOrders.filter(order => 
          order.status === status
        );
      }

      // 计算统计数据
      const stats = {
        totalOrders: filteredOrders.length,
        totalAmount: filteredOrders.reduce((sum, order) => sum + order.amount, 0),
        paidOrders: filteredOrders.filter(order => order.status === 'paid').length,
        paidAmount: filteredOrders
          .filter(order => order.status === 'paid')
          .reduce((sum, order) => sum + order.amount, 0),
        refundedOrders: filteredOrders.filter(order => order.status === 'refunded').length,
        refundedAmount: filteredOrders
          .filter(order => order.status === 'refunded')
          .reduce((sum, order) => sum + (order.refundAmount || 0), 0),
        pendingOrders: filteredOrders.filter(order => order.status === 'pending').length,
        failedOrders: filteredOrders.filter(order => order.status === 'failed').length,
        byStatus: this.groupOrdersByStatus(filteredOrders),
        byDate: this.groupOrdersByDate(filteredOrders)
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('获取支付统计失败:', error);
      throw error;
    }
  }

  // 按状态分组订单
  groupOrdersByStatus(orders) {
    const grouped = {};
    orders.forEach(order => {
      if (!grouped[order.status]) {
        grouped[order.status] = { count: 0, amount: 0 };
      }
      grouped[order.status].count++;
      grouped[order.status].amount += order.amount;
    });
    return grouped;
  }

  // 按日期分组订单
  groupOrdersByDate(orders) {
    const grouped = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { count: 0, amount: 0 };
      }
      grouped[date].count++;
      grouped[date].amount += order.amount;
    });
    return grouped;
  }

  // 生成订单号
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TH${timestamp}${random}`;
  }

  // 生成退款单号
  generateRefundNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RF${timestamp}${random}`;
  }

  // 生成随机字符串
  generateNonceStr() {
    return Math.random().toString(36).substr(2, 15);
  }

  // 生成签名
  generateSign(params) {
    // 排序参数
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys
      .filter(key => params[key] && key !== 'sign')
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringSignTemp = `${stringA}&key=${this.config.apiKey}`;
    
    return crypto.createHash('md5')
      .update(stringSignTemp, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  // 生成支付签名
  generatePaySign(params) {
    const stringA = `appId=${params.appId}&nonceStr=${params.nonceStr}&package=${params.package}&signType=${params.signType}&timeStamp=${params.timeStamp}`;
    const stringSignTemp = `${stringA}&key=${this.config.apiKey}`;
    
    return crypto.createHash('md5')
      .update(stringSignTemp, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  // 验证回调签名
  verifyNotifySign(params) {
    const receivedSign = params.sign;
    const calculatedSign = this.generateSign(params);
    return receivedSign === calculatedSign;
  }

  // 清理过期订单
  async cleanupExpiredOrders() {
    try {
      if (!global.paymentOrders) return;

      const now = new Date();
      const expiredOrders = [];

      for (const [orderId, order] of global.paymentOrders.entries()) {
        if (order.status === 'pending' && new Date(order.expireAt) < now) {
          expiredOrders.push(orderId);
        }
      }

      // 更新过期订单状态
      for (const orderId of expiredOrders) {
        await this.updatePaymentStatus(orderId, {
          status: this.paymentStatus.CANCELLED,
          cancelReason: '订单过期'
        });
      }

      if (expiredOrders.length > 0) {
        console.log(`🧹 清理过期订单: ${expiredOrders.length} 个`);
      }

    } catch (error) {
      console.error('清理过期订单失败:', error);
    }
  }

  // 获取订单详情
  async getOrderDetail(orderId) {
    try {
      const paymentOrder = global.paymentOrders?.get(orderId);
      if (!paymentOrder) {
        throw new Error('订单不存在');
      }

      return {
        success: true,
        data: paymentOrder
      };

    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;