const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const Match = require('../models/Match');
const Event = require('../models/Event');

class PushService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.notificationQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    
    // 消息模板配置
    this.templates = {
      MATCH_START: process.env.WECHAT_MATCH_START_TEMPLATE_ID || 'template_match_start',
      MATCH_END: process.env.WECHAT_MATCH_END_TEMPLATE_ID || 'template_match_end',
      SCORE_UPDATE: process.env.WECHAT_SCORE_UPDATE_TEMPLATE_ID || 'template_score_update',
      EVENT_REGISTRATION: process.env.WECHAT_EVENT_REGISTRATION_TEMPLATE_ID || 'template_event_reg',
      PAYMENT_SUCCESS: process.env.WECHAT_PAYMENT_SUCCESS_TEMPLATE_ID || 'template_payment',
      MATCH_REMINDER: process.env.WECHAT_MATCH_REMINDER_TEMPLATE_ID || 'template_reminder',
      EVENT_UPDATE: process.env.WECHAT_EVENT_UPDATE_TEMPLATE_ID || 'template_event_update',
      SYSTEM_NOTICE: process.env.WECHAT_SYSTEM_NOTICE_TEMPLATE_ID || 'template_system'
    };
    
    // 启动队列处理
    this.startQueueProcessor();
    
    console.log('🔔 Enhanced Push Service initialized');
  }

  // 获取微信访问令牌
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}`
      );

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000); // 提前5分钟过期
        return this.accessToken;
      } else {
        throw new Error('获取微信访问令牌失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('获取微信访问令牌失败:', error);
      throw error;
    }
  }

  // 发送统一服务消息
  async sendUniformMessage(openId, templateId, data, page = 'pages/index/index') {
    try {
      const accessToken = await this.getAccessToken();
      
      const message = {
        touser: openId,
        template_id: templateId,
        page: page,
        data: data
      };

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        message
      );

      if (response.data.errcode === 0) {
        console.log(`统一服务消息发送成功: ${openId}`);
        return true;
      } else {
        console.error('统一服务消息发送失败:', response.data);
        return false;
      }
    } catch (error) {
      console.error('发送统一服务消息失败:', error);
      return false;
    }
  }

  // 发送比赛开始通知
  async sendMatchStartNotification(match, users) {
    const templateId = process.env.WECHAT_MATCH_START_TEMPLATE_ID;
    
    for (const user of users) {
      if (user.openId) {
        const data = {
          thing1: { value: match.eventId.name }, // 赛事名称
          thing2: { value: match.venue }, // 比赛场地
          time3: { value: match.startTime.toLocaleString() }, // 开始时间
          thing4: { value: match.eventType }, // 比赛类型
          thing5: { value: match.stage } // 比赛阶段
        };

        await this.sendUniformMessage(
          user.openId,
          templateId,
          data,
          `pages/match/detail?id=${match._id}`
        );
      }
    }
  }

  // 发送比分更新通知
  async sendScoreUpdateNotification(match, users) {
    const templateId = process.env.WECHAT_SCORE_UPDATE_TEMPLATE_ID;
    
    for (const user of users) {
      if (user.openId) {
        const data = {
          thing1: { value: match.eventId.name }, // 赛事名称
          thing2: { value: `${match.score.team1} - ${match.score.team2}` }, // 当前比分
          thing3: { value: match.status === 'completed' ? '比赛结束' : '比赛进行中' }, // 比赛状态
          time4: { value: new Date().toLocaleString() } // 更新时间
        };

        await this.sendUniformMessage(
          user.openId,
          templateId,
          data,
          `pages/match/detail?id=${match._id}`
        );
      }
    }
  }

  // 发送比赛结束通知
  async sendMatchEndNotification(match, users) {
    const templateId = process.env.WECHAT_MATCH_END_TEMPLATE_ID;
    
    for (const user of users) {
      if (user.openId) {
        const winner = match.winner === 'team1' ? '队伍1' : '队伍2';
        const data = {
          thing1: { value: match.eventId.name }, // 赛事名称
          thing2: { value: winner }, // 获胜方
          thing3: { value: `${match.score.team1} - ${match.score.team2}` }, // 最终比分
          time4: { value: match.endTime.toLocaleString() } // 结束时间
        };

        await this.sendUniformMessage(
          user.openId,
          templateId,
          data,
          `pages/match/detail?id=${match._id}`
        );
      }
    }
  }

  // 发送赛事报名成功通知
  async sendEventRegistrationNotification(event, user) {
    const templateId = process.env.WECHAT_EVENT_REGISTRATION_TEMPLATE_ID;
    
    if (user.openId) {
      const data = {
        thing1: { value: event.name }, // 赛事名称
        time2: { value: event.startDate.toLocaleDateString() }, // 开始日期
        thing3: { value: event.venue }, // 比赛场地
        thing4: { value: '报名成功' }, // 状态
        time5: { value: new Date().toLocaleString() } // 报名时间
      };

      await this.sendUniformMessage(
        user.openId,
        templateId,
        data,
        `pages/event/detail?id=${event._id}`
      );
    }
  }

  // 发送支付成功通知
  async sendPaymentSuccessNotification(order, user) {
    const templateId = process.env.WECHAT_PAYMENT_SUCCESS_TEMPLATE_ID;
    
    if (user.openId) {
      const data = {
        thing1: { value: order.description }, // 商品描述
        amount2: { value: `¥${order.amount.toFixed(2)}` }, // 支付金额
        time3: { value: order.paidAt.toLocaleString() }, // 支付时间
        thing4: { value: order.orderNumber }, // 订单号
        thing5: { value: '支付成功' } // 状态
      };

      await this.sendUniformMessage(
        user.openId,
        templateId,
        data,
        `pages/user/orders?id=${order._id}`
      );
    }
  }

  // 发送自定义通知
  async sendCustomNotification(user, templateId, data, page = 'pages/index/index') {
    if (user.openId) {
      return await this.sendUniformMessage(user.openId, templateId, data, page);
    }
    return false;
  }

  // 批量发送通知
  async sendBatchNotification(users, templateId, data, page = 'pages/index/index') {
    const results = [];
    
    for (const user of users) {
      if (user.openId) {
        const result = await this.sendUniformMessage(user.openId, templateId, data, page);
        results.push({ userId: user._id, success: result });
      }
    }
    
    return results;
  }

  // 启动队列处理器
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessing && this.notificationQueue.length > 0) {
        await this.processNotificationQueue();
      }
    }, 1000); // 每秒检查一次队列
  }

  // 处理通知队列
  async processNotificationQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      
      try {
        await this.processNotification(notification);
      } catch (error) {
        console.error('处理通知失败:', error);
        
        // 重试机制
        if (notification.retryCount < this.retryAttempts) {
          notification.retryCount = (notification.retryCount || 0) + 1;
          notification.nextRetryAt = Date.now() + (this.retryDelay * notification.retryCount);
          this.notificationQueue.push(notification);
        } else {
          console.error('通知重试次数已达上限，放弃发送:', notification);
        }
      }
      
      // 避免发送过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessing = false;
  }

  // 处理单个通知
  async processNotification(notification) {
    const { type, data, users, templateId, page } = notification;
    
    switch (type) {
      case 'MATCH_START':
        await this.sendMatchStartNotification(data.match, users);
        break;
      case 'MATCH_END':
        await this.sendMatchEndNotification(data.match, users);
        break;
      case 'SCORE_UPDATE':
        await this.sendScoreUpdateNotification(data.match, users);
        break;
      case 'EVENT_REGISTRATION':
        await this.sendEventRegistrationNotification(data.event, data.user);
        break;
      case 'PAYMENT_SUCCESS':
        await this.sendPaymentSuccessNotification(data.order, data.user);
        break;
      case 'CUSTOM':
        await this.sendBatchNotification(users, templateId, data, page);
        break;
      default:
        console.warn('未知的通知类型:', type);
    }
  }

  // 添加通知到队列
  addToQueue(notification) {
    this.notificationQueue.push({
      ...notification,
      createdAt: Date.now(),
      retryCount: 0
    });
    
    console.log(`通知已添加到队列: ${notification.type}, 队列长度: ${this.notificationQueue.length}`);
  }

  // 发送比赛提醒通知
  async sendMatchReminderNotification(match, users, minutesBefore) {
    const templateId = this.templates.MATCH_REMINDER;
    
    const notification = {
      type: 'CUSTOM',
      templateId,
      users,
      data: {
        thing1: { value: match.eventId?.name || match.matchName }, // 赛事名称
        thing2: { value: match.venue || '待定' }, // 比赛场地
        time3: { value: match.scheduledTime?.toLocaleString() || '待定' }, // 比赛时间
        thing4: { value: `${minutesBefore}分钟后开始` }, // 提醒内容
        thing5: { value: match.eventType || '网球比赛' } // 比赛类型
      },
      page: `pages/detail/detail?id=${match._id}`
    };
    
    this.addToQueue(notification);
  }

  // 发送赛事更新通知
  async sendEventUpdateNotification(event, users, updateType, updateContent) {
    const templateId = this.templates.EVENT_UPDATE;
    
    const notification = {
      type: 'CUSTOM',
      templateId,
      users,
      data: {
        thing1: { value: event.name }, // 赛事名称
        thing2: { value: updateType }, // 更新类型
        thing3: { value: updateContent }, // 更新内容
        time4: { value: new Date().toLocaleString() }, // 更新时间
        thing5: { value: event.status === 'cancelled' ? '已取消' : '正常' } // 赛事状态
      },
      page: `pages/event/detail?id=${event._id}`
    };
    
    this.addToQueue(notification);
  }

  // 发送系统通知
  async sendSystemNotification(users, title, content, page = 'pages/index/index') {
    const templateId = this.templates.SYSTEM_NOTICE;
    
    const notification = {
      type: 'CUSTOM',
      templateId,
      users,
      data: {
        thing1: { value: title }, // 通知标题
        thing2: { value: content }, // 通知内容
        time3: { value: new Date().toLocaleString() }, // 通知时间
        thing4: { value: '系统通知' }, // 通知类型
        thing5: { value: '网球热' } // 发送方
      },
      page
    };
    
    this.addToQueue(notification);
  }

  // 发送支付提醒通知
  async sendPaymentReminderNotification(event, user, deadlineHours) {
    const templateId = this.templates.PAYMENT_SUCCESS; // 复用支付模板
    
    if (user.openId) {
      const data = {
        thing1: { value: event.name }, // 赛事名称
        amount2: { value: `¥${event.registrationFee}` }, // 报名费用
        time3: { value: event.registrationDeadline?.toLocaleString() || '待定' }, // 截止时间
        thing4: { value: '待支付' }, // 支付状态
        thing5: { value: `${deadlineHours}小时内完成支付` } // 提醒内容
      };

      const notification = {
        type: 'CUSTOM',
        templateId,
        users: [user],
        data,
        page: `pages/event/detail?id=${event._id}`
      };
      
      this.addToQueue(notification);
    }
  }

  // 获取用户订阅状态
  async getUserSubscriptionStatus(openId, templateId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `https://api.weixin.qq.com/wxaapi/newtmpl/gettemplate?access_token=${accessToken}`,
        {
          template_id: templateId
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('获取用户订阅状态失败:', error);
      return null;
    }
  }

  // 获取通知发送统计
  getNotificationStats() {
    return {
      queueLength: this.notificationQueue.length,
      isProcessing: this.isProcessing,
      templates: Object.keys(this.templates).length,
      accessTokenValid: this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt
    };
  }

  // 清理过期的队列项
  cleanupExpiredQueue() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    this.notificationQueue = this.notificationQueue.filter(notification => {
      return (now - notification.createdAt) < maxAge;
    });
    
    console.log(`队列清理完成，当前队列长度: ${this.notificationQueue.length}`);
  }

  // 发送测试通知
  async sendTestNotification(user, testType = 'system') {
    const testData = {
      system: {
        templateId: this.templates.SYSTEM_NOTICE,
        data: {
          thing1: { value: '系统测试通知' },
          thing2: { value: '这是一条测试消息，用于验证推送功能是否正常' },
          time3: { value: new Date().toLocaleString() },
          thing4: { value: '测试通知' },
          thing5: { value: '网球热测试' }
        },
        page: 'pages/index/index'
      },
      match: {
        templateId: this.templates.MATCH_REMINDER,
        data: {
          thing1: { value: '测试比赛' },
          thing2: { value: '测试场地' },
          time3: { value: new Date().toLocaleString() },
          thing4: { value: '测试提醒' },
          thing5: { value: '测试赛事' }
        },
        page: 'pages/detail/detail?id=test'
      }
    };
    
    const config = testData[testType] || testData.system;
    
    if (user.openId) {
      return await this.sendUniformMessage(user.openId, config.templateId, config.data, config.page);
    }
    
    return false;
  }

  // 定期清理任务
  startCleanupTask() {
    setInterval(() => {
      this.cleanupExpiredQueue();
    }, 60 * 60 * 1000); // 每小时清理一次
  }
}

module.exports = PushService; 