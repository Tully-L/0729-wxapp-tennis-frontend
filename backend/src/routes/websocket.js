const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// 获取WebSocket服务状态
router.get('/status', auth, (req, res) => {
  try {
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    const status = {
      onlineUsers: socketService.getOnlineUsersCount(),
      activeRooms: socketService.getAllRoomStats(),
      totalRooms: Object.keys(socketService.getAllRoomStats()).length,
      serverTime: new Date().toISOString()
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取WebSocket状态失败',
      error: error.message
    });
  }
});

// 获取用户连接信息
router.get('/users/:userId', auth, (req, res) => {
  try {
    const { userId } = req.params;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    const connectionInfo = socketService.getUserConnectionInfo(userId);
    
    if (!connectionInfo) {
      return res.json({
        success: true,
        data: {
          userId,
          isConnected: false,
          message: '用户未连接'
        }
      });
    }

    res.json({
      success: true,
      data: connectionInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户连接信息失败',
      error: error.message
    });
  }
});

// 获取比赛房间信息
router.get('/rooms/:matchId', auth, (req, res) => {
  try {
    const { matchId } = req.params;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    const spectatorCount = socketService.getMatchSpectatorsCount(matchId);
    const roomStats = socketService.getAllRoomStats()[matchId];

    res.json({
      success: true,
      data: {
        matchId,
        spectatorCount,
        roomStats: roomStats || null,
        isActive: spectatorCount > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取房间信息失败',
      error: error.message
    });
  }
});

// 发送系统通知
router.post('/notifications/system', auth, (req, res) => {
  try {
    const { title, message, type = 'info', priority = 'normal' } = req.body;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: '标题和消息内容不能为空'
      });
    }

    const notification = {
      title,
      message,
      type,
      priority,
      sender: req.user.name || 'System'
    };

    socketService.sendSystemNotification(notification);

    res.json({
      success: true,
      message: '系统通知已发送',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送系统通知失败',
      error: error.message
    });
  }
});

// 发送用户通知
router.post('/notifications/user', auth, (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: '用户ID、标题和消息内容不能为空'
      });
    }

    const notification = {
      title,
      message,
      type,
      sender: req.user.name || 'System'
    };

    const success = socketService.sendNotification(userId, notification);

    res.json({
      success: true,
      message: success ? '用户通知已发送' : '用户未在线，通知发送失败',
      data: {
        userId,
        delivered: success,
        notification
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送用户通知失败',
      error: error.message
    });
  }
});

// 强制用户离开比赛房间
router.post('/rooms/:matchId/kick/:userId', auth, (req, res) => {
  try {
    const { matchId, userId } = req.params;
    const { reason = '管理员操作' } = req.body;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    // 检查权限（这里可以添加更严格的权限检查）
    const success = socketService.forceLeaveMatch(userId, matchId, reason);

    res.json({
      success: true,
      message: success ? '用户已被移出房间' : '用户不在房间中或未连接',
      data: {
        matchId,
        userId,
        reason,
        kicked: success
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '移出用户失败',
      error: error.message
    });
  }
});

// 发送比赛提醒
router.post('/matches/:matchId/reminder', auth, (req, res) => {
  try {
    const { matchId } = req.params;
    const { reminderType, minutesBefore } = req.body;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    if (!reminderType) {
      return res.status(400).json({
        success: false,
        message: '提醒类型不能为空'
      });
    }

    socketService.sendMatchReminder(matchId, reminderType, minutesBefore || 0);

    res.json({
      success: true,
      message: '比赛提醒已发送',
      data: {
        matchId,
        reminderType,
        minutesBefore
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送比赛提醒失败',
      error: error.message
    });
  }
});

// 广播系统维护通知
router.post('/maintenance', auth, (req, res) => {
  try {
    const { title, message, startTime, duration, type = 'maintenance' } = req.body;
    const socketService = req.app.locals.socketService;
    
    if (!socketService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket服务未初始化'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: '标题和消息内容不能为空'
      });
    }

    const notice = {
      title,
      message,
      startTime,
      duration,
      type,
      sender: req.user.name || 'System Admin'
    };

    socketService.broadcastMaintenanceNotice(notice);

    res.json({
      success: true,
      message: '维护通知已广播',
      data: notice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '广播维护通知失败',
      error: error.message
    });
  }
});

module.exports = router;