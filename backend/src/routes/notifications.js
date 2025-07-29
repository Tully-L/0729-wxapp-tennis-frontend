// 通知路由 - 处理推送通知相关请求
const express = require('express');
const router = express.Router();
const {
  subscribeNotification,
  unsubscribeNotification,
  getSubscriptionStatus,
  updateNotificationSettings,
  sendTestNotification,
  getNotificationHistory,
  getPushServiceStats
} = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// 所有通知路由都需要认证
router.use(auth);

// 订阅通知
router.post('/subscribe', subscribeNotification);

// 取消订阅通知
router.post('/unsubscribe', unsubscribeNotification);

// 获取订阅状态
router.get('/subscription-status', getSubscriptionStatus);

// 更新通知设置
router.put('/settings', updateNotificationSettings);

// 发送测试通知
router.post('/test', sendTestNotification);

// 获取通知历史
router.get('/history', getNotificationHistory);

// 获取推送服务统计（管理员）
router.get('/stats', getPushServiceStats);

module.exports = router;