// 支付控制器 - 处理支付相关API请求
const PaymentService = require('../services/paymentService');
const Event = require('../models/Event');
const User = require('../models/User');

// 初始化支付服务
const paymentService = new PaymentService();

// 创建支付订单
const createPaymentOrder = async (req, res) => {
  try {
    const {
      eventId,
      amount,
      description,
      openId
    } = req.body;

    const userId = req.user._id;

    // 验证必填参数
    if (!eventId || !amount || !openId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 验证金额
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '支付金额必须大于0'
      });
    }

    // 创建支付订单
    const result = await paymentService.createPaymentOrder({
      userId,
      eventId,
      amount,
      description,
      openId
    });

    res.json(result);

  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建支付订单失败'
    });
  }
};

// 处理支付回调通知
const handlePaymentNotify = async (req, res) => {
  try {
    console.log('收到支付回调通知:', req.body);

    // 处理支付通知
    const result = await paymentService.handlePaymentNotify(req.body);

    if (result.success) {
      // 返回微信要求的成功响应格式
      res.set('Content-Type', 'text/xml');
      res.send(`
        <xml>
          <return_code><![CDATA[SUCCESS]]></return_code>
          <return_msg><![CDATA[OK]]></return_msg>
        </xml>
      `);
    } else {
      res.set('Content-Type', 'text/xml');
      res.send(`
        <xml>
          <return_code><![CDATA[FAIL]]></return_code>
          <return_msg><![CDATA[${result.message}]]></return_msg>
        </xml>
      `);
    }

  } catch (error) {
    console.error('处理支付回调失败:', error);
    
    res.set('Content-Type', 'text/xml');
    res.send(`
      <xml>
        <return_code><![CDATA[FAIL]]></return_code>
        <return_msg><![CDATA[处理失败]]></return_msg>
      </xml>
    `);
  }
};

// 查询支付状态
const queryPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单号'
      });
    }

    const result = await paymentService.queryPaymentStatus(orderId);
    res.json(result);

  } catch (error) {
    console.error('查询支付状态失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '查询支付状态失败'
    });
  }
};

// 申请退款
const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      refundAmount,
      refundReason
    } = req.body;

    // 验证必填参数
    if (!orderId || !refundAmount || !refundReason) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 验证退款金额
    if (refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: '退款金额必须大于0'
      });
    }

    // 申请退款
    const result = await paymentService.requestRefund({
      orderId,
      refundAmount,
      refundReason,
      operatorId: req.user._id
    });

    res.json(result);

  } catch (error) {
    console.error('申请退款失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '申请退款失败'
    });
  }
};

// 获取支付统计
const getPaymentStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      eventId,
      status
    } = req.query;

    // 检查管理员权限
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const result = await paymentService.getPaymentStats({
      startDate,
      endDate,
      eventId,
      status
    });

    res.json(result);

  } catch (error) {
    console.error('获取支付统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取支付统计失败'
    });
  }
};

// 获取用户支付记录
const getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status
    } = req.query;

    // 从内存中获取用户的支付记录（实际应用中应该从数据库获取）
    const allOrders = Array.from(global.paymentOrders?.values() || []);
    let userOrders = allOrders.filter(order => order.userId === userId.toString());

    // 按状态筛选
    if (status) {
      userOrders = userOrders.filter(order => order.status === status);
    }

    // 排序（最新的在前）
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedOrders = userOrders.slice(skip, skip + parseInt(limit));

    // 获取赛事信息
    const ordersWithEventInfo = await Promise.all(
      paginatedOrders.map(async (order) => {
        try {
          const event = await Event.findById(order.eventId).select('name eventType venue eventDate');
          return {
            ...order,
            eventInfo: event ? {
              name: event.name,
              eventType: event.eventType,
              venue: event.venue,
              eventDate: event.eventDate
            } : null
          };
        } catch (error) {
          return {
            ...order,
            eventInfo: null
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        orders: ordersWithEventInfo,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: userOrders.length,
          pages: Math.ceil(userOrders.length / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('获取用户支付记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取支付记录失败'
    });
  }
};

// 获取订单详情
const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单号'
      });
    }

    const result = await paymentService.getOrderDetail(orderId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    const order = result.data;

    // 检查权限（只能查看自己的订单，管理员可以查看所有订单）
    if (order.userId !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此订单'
      });
    }

    // 获取赛事和用户信息
    const [event, user] = await Promise.all([
      Event.findById(order.eventId).select('name eventType venue eventDate organizer'),
      User.findById(order.userId).select('nickname avatar')
    ]);

    const orderDetail = {
      ...order,
      eventInfo: event ? {
        name: event.name,
        eventType: event.eventType,
        venue: event.venue,
        eventDate: event.eventDate,
        organizer: event.organizer
      } : null,
      userInfo: user ? {
        nickname: user.nickname,
        avatar: user.avatar
      } : null
    };

    res.json({
      success: true,
      data: orderDetail
    });

  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取订单详情失败'
    });
  }
};

// 取消支付订单
const cancelPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单号'
      });
    }

    // 获取订单信息
    const orderResult = await paymentService.getOrderDetail(orderId);
    if (!orderResult.success) {
      return res.status(404).json(orderResult);
    }

    const order = orderResult.data;

    // 检查权限
    if (order.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '没有权限取消此订单'
      });
    }

    // 检查订单状态
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能取消待支付的订单'
      });
    }

    // 更新订单状态为已取消
    await paymentService.updatePaymentStatus(orderId, {
      status: 'cancelled',
      cancelReason: '用户主动取消',
      cancelledAt: new Date()
    });

    res.json({
      success: true,
      message: '订单取消成功'
    });

  } catch (error) {
    console.error('取消支付订单失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '取消订单失败'
    });
  }
};

// 模拟支付成功（仅用于测试）
const simulatePaymentSuccess = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: '此功能仅在开发环境可用'
      });
    }

    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单号'
      });
    }

    // 模拟支付成功回调
    const mockNotifyData = {
      return_code: 'SUCCESS',
      return_msg: 'OK',
      result_code: 'SUCCESS',
      out_trade_no: orderId,
      transaction_id: `mock_${Date.now()}`,
      total_fee: 10000, // 100元
      sign: 'mock_sign'
    };

    // 处理支付通知
    const result = await paymentService.handlePaymentNotify(mockNotifyData);

    res.json({
      success: true,
      message: '模拟支付成功',
      data: result
    });

  } catch (error) {
    console.error('模拟支付失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '模拟支付失败'
    });
  }
};

module.exports = {
  createPaymentOrder,
  handlePaymentNotify,
  queryPaymentStatus,
  requestRefund,
  getPaymentStats,
  getUserPaymentHistory,
  getOrderDetail,
  cancelPaymentOrder,
  simulatePaymentSuccess
};