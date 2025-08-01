// matchStatusService.js - 比赛状态管理服务
const Match = require('../models/Match');
const Event = require('../models/Event');
const { MatchWebSocket } = require('./socketService');

class MatchStatusService {
  constructor() {
    this.statusTransitions = {
      '报名中': ['比赛中', '已取消'],
      '比赛中': ['已结束', '已暂停', '已取消'],
      '已暂停': ['比赛中', '已结束', '已取消'],
      '已结束': [], // 已结束的比赛不能再转换状态
      '已取消': ['报名中'] // 已取消的比赛可以重新开放报名
    };

    this.statusPriority = {
      '报名中': 1,
      '比赛中': 2,
      '已暂停': 3,
      '已结束': 4,
      '已取消': 0
    };
  }

  // 检查状态转换是否有效
  isValidTransition(currentStatus, newStatus) {
    return this.statusTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // 获取状态显示文本
  getStatusDisplayText(status) {
    const statusMap = {
      '报名中': '报名中',
      '比赛中': '进行中',
      '已暂停': '已暂停',
      '已结束': '已结束',
      '已取消': '已取消'
    };
    return statusMap[status] || status;
  }

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      '报名中': 'status-registration',
      '比赛中': 'status-ongoing',
      '已暂停': 'status-paused',
      '已结束': 'status-completed',
      '已取消': 'status-cancelled'
    };
    return classMap[status] || 'status-unknown';
  }

  // 获取状态图标
  getStatusIcon(status) {
    const iconMap = {
      '报名中': '📝',
      '比赛中': '🎾',
      '已暂停': '⏸️',
      '已结束': '🏆',
      '已取消': '❌'
    };
    return iconMap[status] || '❓';
  }

  // 更新比赛状态
  async updateMatchStatus(matchId, newStatus, options = {}) {
    try {
      const { userId, reason, force = false } = options;
      
      const match = await Match.findById(matchId)
        .populate('eventId')
        .populate('organizer.id');

      if (!match) {
        throw new Error('比赛不存在');
      }

      // 检查权限
      if (userId && !this.hasPermissionToUpdateStatus(match, userId)) {
        throw new Error('权限不足');
      }

      // 检查状态转换是否有效
      if (!force && !this.isValidTransition(match.status, newStatus)) {
        throw new Error(`无法从 ${match.status} 转换到 ${newStatus}`);
      }

      const oldStatus = match.status;
      
      // 执行状态转换逻辑
      await this.executeStatusTransition(match, newStatus, reason);

      // 记录状态变更历史
      await this.recordStatusChange(match, oldStatus, newStatus, userId, reason);

      // 发送实时通知
      await this.notifyStatusChange(match, oldStatus, newStatus, userId);

      return {
        success: true,
        match: match,
        oldStatus: oldStatus,
        newStatus: newStatus
      };
    } catch (error) {
      console.error('更新比赛状态失败:', error);
      throw error;
    }
  }

  // 执行状态转换逻辑
  async executeStatusTransition(match, newStatus, reason) {
    const now = new Date();
    
    switch (newStatus) {
      case '比赛中':
        match.status = '比赛中';
        match.isLive = true;
        if (!match.startTime) {
          match.startTime = now;
        }
        break;

      case '已暂停':
        match.status = '已暂停';
        match.isLive = false;
        if (!match.pausedAt) {
          match.pausedAt = now;
        }
        break;

      case '已结束':
        match.status = '已结束';
        match.isLive = false;
        if (!match.endTime) {
          match.endTime = now;
        }
        // 计算比赛时长
        this.calculateMatchDuration(match);
        break;

      case '已取消':
        match.status = '已取消';
        match.isLive = false;
        match.cancelledAt = now;
        if (reason) {
          match.cancellationReason = reason;
        }
        break;

      case '报名中':
        match.status = '报名中';
        match.isLive = false;
        // 重置时间字段
        match.startTime = null;
        match.endTime = null;
        match.pausedAt = null;
        match.cancelledAt = null;
        break;
    }

    match.lastStatusUpdate = now;
    if (reason) {
      match.statusReason = reason;
    }

    await match.save();
  }

  // 计算比赛时长
  calculateMatchDuration(match) {
    if (match.startTime && match.endTime) {
      const durationMs = match.endTime - match.startTime;
      const durationMinutes = Math.floor(durationMs / 1000 / 60);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (hours > 0) {
        match.duration = `${hours}小时${minutes}分钟`;
      } else {
        match.duration = `${minutes}分钟`;
      }
    }
  }

  // 检查用户是否有权限更新状态
  hasPermissionToUpdateStatus(match, userId) {
    // 主办方可以更新状态
    if (match.organizer.id.toString() === userId.toString()) {
      return true;
    }

    // 参赛选手可以更新某些状态
    const isPlayer = match.players.team1.some(p => p.userId?.toString() === userId.toString()) ||
                     match.players.team2.some(p => p.userId?.toString() === userId.toString());
    
    if (isPlayer) {
      // 选手只能开始比赛或暂停比赛
      return true;
    }

    return false;
  }

  // 记录状态变更历史
  async recordStatusChange(match, oldStatus, newStatus, userId, reason) {
    if (!match.statusHistory) {
      match.statusHistory = [];
    }

    match.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedBy: userId,
      changedAt: new Date(),
      reason: reason
    });

    await match.save();
  }

  // 发送状态变更通知
  async notifyStatusChange(match, oldStatus, newStatus, userId) {
    try {
      // 通过WebSocket发送实时通知
      if (MatchWebSocket) {
        await MatchWebSocket.sendMatchStatusUpdate(match._id, newStatus, {
          oldStatus: oldStatus,
          reason: match.statusReason,
          updatedBy: userId
        });
      }

      // 发送推送通知给关注的用户
      await this.sendPushNotifications(match, oldStatus, newStatus);
    } catch (error) {
      console.error('发送状态变更通知失败:', error);
    }
  }

  // 发送推送通知
  async sendPushNotifications(match, oldStatus, newStatus) {
    // 这里可以集成微信小程序的订阅消息功能
    // 暂时只记录日志
    console.log(`比赛状态变更通知: ${match.matchName} 从 ${oldStatus} 变更为 ${newStatus}`);
  }

  // 批量更新比赛状态
  async batchUpdateStatus(matchIds, newStatus, options = {}) {
    const results = [];
    
    for (const matchId of matchIds) {
      try {
        const result = await this.updateMatchStatus(matchId, newStatus, options);
        results.push({ matchId, success: true, result });
      } catch (error) {
        results.push({ matchId, success: false, error: error.message });
      }
    }

    return results;
  }

  // 自动状态管理（定时任务）
  async autoUpdateStatuses() {
    try {
      const now = new Date();
      
      // 查找需要自动更新状态的比赛
      const matches = await Match.find({
        status: { $in: ['报名中', '比赛中'] }
      });

      for (const match of matches) {
        const scheduledTime = new Date(match.scheduledTime);
        const timeDiff = now - scheduledTime;

        // 自动开始比赛
        if (match.status === '报名中' && timeDiff > 0) {
          if (match.players.team1.length > 0 && match.players.team2.length > 0) {
            await this.updateMatchStatus(match._id, '比赛中', {
              reason: '自动开始',
              force: true
            });
          }
        }

        // 自动结束长时间无更新的比赛
        if (match.status === '比赛中' && timeDiff > 4 * 60 * 60 * 1000) { // 4小时
          const lastUpdate = match.lastScoreUpdate || match.startTime;
          const updateDiff = now - lastUpdate;
          
          if (updateDiff > 2 * 60 * 60 * 1000) { // 2小时无更新
            await this.updateMatchStatus(match._id, '已结束', {
              reason: '自动结束（长时间无更新）',
              force: true
            });
          }
        }
      }
    } catch (error) {
      console.error('自动状态更新失败:', error);
    }
  }

  // 获取状态统计
  async getStatusStatistics(filters = {}) {
    try {
      const pipeline = [
        { $match: filters },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            matches: { $push: '$_id' }
          }
        }
      ];

      const stats = await Match.aggregate(pipeline);
      
      return stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          matches: stat.matches
        };
        return acc;
      }, {});
    } catch (error) {
      console.error('获取状态统计失败:', error);
      throw error;
    }
  }
}

module.exports = new MatchStatusService();
