// 通知控制器 - 处理推送通知订阅和管理
const User = require('../models/User');
const Match = require('../models/Match');
const Event = require('../models/Event');

// 用户订阅通知
const subscribeNotification = async (req, res) => {
  try {
    const { templateIds, matchId, eventId } = req.body;
    const userId = req.user._id;

    if (!templateIds || !Array.isArray(templateIds)) {
      return res.status(400).json({
        success: false,
        message: '缺少模板ID列表'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 初始化通知订阅设置
    if (!user.notificationSettings) {
      user.notificationSettings = {
        subscriptions: [],
        matchNotifications: [],
        eventNotifications: [],
        systemNotifications: true,
        createdAt: new Date()
      };
    }

    // 添加模板订阅
    templateIds.forEach(templateId => {
      if (!user.notificationSettings.subscriptions.includes(templateId)) {
        user.notificationSettings.subscriptions.push(templateId);
      }
    });

    // 添加比赛通知订阅
    if (matchId) {
      const matchSubscription = {
        matchId,
        subscribedAt: new Date(),
        types: ['score_update', 'match_start', 'match_end']
      };
      
      const existingIndex = user.notificationSettings.matchNotifications.findIndex(
        sub => sub.matchId.toString() === matchId
      );
      
      if (existingIndex > -1) {
        user.notificationSettings.matchNotifications[existingIndex] = matchSubscription;
      } else {
        user.notificationSettings.matchNotifications.push(matchSubscription);
      }
    }

    // 添加赛事通知订阅
    if (eventId) {
      const eventSubscription = {
        eventId,
        subscribedAt: new Date(),
        types: ['event_update', 'registration_reminder', 'payment_reminder']
      };
      
      const existingIndex = user.notificationSettings.eventNotifications.findIndex(
        sub => sub.eventId.toString() === eventId
      );
      
      if (existingIndex > -1) {
        user.notificationSettings.eventNotifications[existingIndex] = eventSubscription;
      } else {
        user.notificationSettings.eventNotifications.push(eventSubscription);
      }
    }

    user.notificationSettings.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: '通知订阅成功',
      data: {
        subscriptions: user.notificationSettings.subscriptions,
        matchNotifications: user.notificationSettings.matchNotifications.length,
        eventNotifications: user.notificationSettings.eventNotifications.length
      }
    });
  } catch (error) {
    console.error('订阅通知失败:', error);
    res.status(500).json({
      success: false,
      message: '订阅通知失败',
      error: error.message
    });
  }
};

// 取消订阅通知
const unsubscribeNotification = async (req, res) => {
  try {
    const { templateIds, matchId, eventId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user || !user.notificationSettings) {
      return res.status(404).json({
        success: false,
        message: '用户或订阅设置不存在'
      });
    }

    // 移除模板订阅
    if (templateIds && Array.isArray(templateIds)) {
      user.notificationSettings.subscriptions = user.notificationSettings.subscriptions.filter(
        sub => !templateIds.includes(sub)
      );
    }

    // 移除比赛通知订阅
    if (matchId) {
      user.notificationSettings.matchNotifications = user.notificationSettings.matchNotifications.filter(
        sub => sub.matchId.toString() !== matchId
      );
    }

    // 移除赛事通知订阅
    if (eventId) {
      user.notificationSettings.eventNotifications = user.notificationSettings.eventNotifications.filter(
        sub => sub.eventId.toString() !== eventId
      );
    }

    user.notificationSettings.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: '取消订阅成功',
      data: {
        subscriptions: user.notificationSettings.subscriptions,
        matchNotifications: user.notificationSettings.matchNotifications.length,
        eventNotifications: user.notificationSettings.eventNotifications.length
      }
    });
  } catch (error) {
    console.error('取消订阅失败:', error);
    res.status(500).json({
      success: false,
      message: '取消订阅失败',
      error: error.message
    });
  }
};

// 获取用户订阅状态
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId, eventId } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const notificationSettings = user.notificationSettings || {
      subscriptions: [],
      matchNotifications: [],
      eventNotifications: [],
      systemNotifications: true
    };

    let response = {
      success: true,
      data: {
        systemNotifications: notificationSettings.systemNotifications,
        totalSubscriptions: notificationSettings.subscriptions.length,
        matchSubscriptions: notificationSettings.matchNotifications.length,
        eventSubscriptions: notificationSettings.eventNotifications.length
      }
    };

    // 检查特定比赛订阅状态
    if (matchId) {
      const matchSubscription = notificationSettings.matchNotifications.find(
        sub => sub.matchId.toString() === matchId
      );
      response.data.matchSubscribed = !!matchSubscription;
      response.data.matchSubscriptionTypes = matchSubscription?.types || [];
    }

    // 检查特定赛事订阅状态
    if (eventId) {
      const eventSubscription = notificationSettings.eventNotifications.find(
        sub => sub.eventId.toString() === eventId
      );
      response.data.eventSubscribed = !!eventSubscription;
      response.data.eventSubscriptionTypes = eventSubscription?.types || [];
    }

    res.json(response);
  } catch (error) {
    console.error('获取订阅状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订阅状态失败',
      error: error.message
    });
  }
};

// 更新通知设置
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { systemNotifications, matchTypes, eventTypes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 初始化通知设置
    if (!user.notificationSettings) {
      user.notificationSettings = {
        subscriptions: [],
        matchNotifications: [],
        eventNotifications: [],
        systemNotifications: true,
        createdAt: new Date()
      };
    }

    // 更新系统通知设置
    if (typeof systemNotifications === 'boolean') {
      user.notificationSettings.systemNotifications = systemNotifications;
    }

    // 更新比赛通知类型
    if (matchTypes && Array.isArray(matchTypes)) {
      user.notificationSettings.matchNotifications.forEach(sub => {
        sub.types = matchTypes;
      });
    }

    // 更新赛事通知类型
    if (eventTypes && Array.isArray(eventTypes)) {
      user.notificationSettings.eventNotifications.forEach(sub => {
        sub.types = eventTypes;
      });
    }

    user.notificationSettings.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: '通知设置更新成功',
      data: user.notificationSettings
    });
  } catch (error) {
    console.error('更新通知设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新通知设置失败',
      error: error.message
    });
  }
};

// 发送测试通知
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'system' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取推送服务实例
    const pushService = req.app.locals.pushService;
    if (!pushService) {
      return res.status(503).json({
        success: false,
        message: '推送服务不可用'
      });
    }

    const result = await pushService.sendTestNotification(user, type);

    res.json({
      success: result,
      message: result ? '测试通知发送成功' : '测试通知发送失败',
      data: {
        userId: user._id,
        type,
        hasOpenId: !!user.openId
      }
    });
  } catch (error) {
    console.error('发送测试通知失败:', error);
    res.status(500).json({
      success: false,
      message: '发送测试通知失败',
      error: error.message
    });
  }
};

// 获取通知历史
const getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type } = req.query;

    // 这里应该从通知历史表中查询，暂时返回模拟数据
    const mockHistory = [
      {
        id: '1',
        type: 'match_start',
        title: '比赛开始通知',
        content: '您关注的比赛即将开始',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'sent',
        matchId: 'match123'
      },
      {
        id: '2',
        type: 'event_registration',
        title: '报名成功通知',
        content: '您已成功报名参加网球锦标赛',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'sent',
        eventId: 'event456'
      },
      {
        id: '3',
        type: 'system',
        title: '系统维护通知',
        content: '系统将在今晚进行维护',
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'sent'
      }
    ];

    let filteredHistory = mockHistory;
    if (type) {
      filteredHistory = mockHistory.filter(item => item.type === type);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedHistory = filteredHistory.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        notifications: paginatedHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredHistory.length,
          pages: Math.ceil(filteredHistory.length / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取通知历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知历史失败',
      error: error.message
    });
  }
};

// 获取推送服务统计
const getPushServiceStats = async (req, res) => {
  try {
    // 检查管理员权限
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const pushService = req.app.locals.pushService;
    if (!pushService) {
      return res.status(503).json({
        success: false,
        message: '推送服务不可用'
      });
    }

    const stats = pushService.getNotificationStats();

    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取推送服务统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推送服务统计失败',
      error: error.message
    });
  }
};

module.exports = {
  subscribeNotification,
  unsubscribeNotification,
  getSubscriptionStatus,
  updateNotificationSettings,
  sendTestNotification,
  getNotificationHistory,
  getPushServiceStats
};