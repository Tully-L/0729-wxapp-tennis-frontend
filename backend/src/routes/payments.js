// 支付路由 - 处理支付相关请求
const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  handlePaymentNotify,
  queryPaymentStatus,
  requestRefund,
  getPaymentStats,
  getUserPaymentHistory,
  getOrderDetail,
  cancelPaymentOrder,
  simulatePaymentSuccess
} = require('../controllers/paymentController');
const { auth, optionalAuth } = require('../middleware/auth');

// 创建支付订单（需要认证）
router.post('/orders', auth, createPaymentOrder);

// 支付回调通知（微信服务器调用，无需认证）
router.post('/notify', handlePaymentNotify);

// 查询支付状态（需要认证）
router.get('/orders/:orderId/status', auth, queryPaymentStatus);

// 获取订单详情（需要认证）
router.get('/orders/:orderId', auth, getOrderDetail);

// 取消支付订单（需要认证）
router.post('/orders/:orderId/cancel', auth, cancelPaymentOrder);

// 申请退款（需要认证）
router.post('/orders/:orderId/refund', auth, requestRefund);

// 获取用户支付记录（需要认证）
router.get('/history', auth, getUserPaymentHistory);

// 获取支付统计（需要管理员权限）
router.get('/stats', auth, getPaymentStats);

// 模拟支付成功（仅用于测试，需要认证）
router.post('/orders/:orderId/simulate-success', auth, simulatePaymentSuccess);

module.exports = router;