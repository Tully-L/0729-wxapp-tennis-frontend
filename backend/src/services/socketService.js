const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Match = require('../models/Match');
const User = require('../models/User');

class SocketService {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });
    
    this.connectedUsers = new Map(); // userId -> socket
    this.matchRooms = new Map(); // matchId -> Set of userIds
    this.roomStats = new Map(); // matchId -> room statistics
    this.heartbeatInterval = null;
    
    this.setupMiddleware();
    this.setupEventHandlers();
    this.startHeartbeat();
    
    console.log('🔌 Enhanced WebSocket service initialized');
  }

  setupMiddleware() {
    // 身份验证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`用户 ${socket.user.name} (${socket.userId}) 已连接`);
      
      // 存储用户连接
      this.connectedUsers.set(socket.userId, socket);

      // 加入用户房间
      socket.join(`user:${socket.userId}`);

      // 发送连接成功消息
      socket.emit('connected', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date().toISOString()
      });

      // 处理加入比赛房间
      socket.on('join-match', async (matchId) => {
        try {
          const match = await Match.findById(matchId);
          if (!match) {
            socket.emit('error', { message: '比赛不存在' });
            return;
          }

          // 检查用户是否有权限观看这场比赛
          const canWatch = match.isPublic || 
            match.spectators.includes(socket.userId) ||
            match.players.team1.some(p => p.userId && p.userId.toString() === socket.userId) ||
            match.players.team2.some(p => p.userId && p.userId.toString() === socket.userId) ||
            match.organizer.id.toString() === socket.userId;

          if (!canWatch) {
            socket.emit('error', { message: '没有权限观看这场比赛' });
            return;
          }

          socket.join(`match:${matchId}`);
          
          // 记录用户加入比赛房间
          if (!this.matchRooms.has(matchId)) {
            this.matchRooms.set(matchId, new Set());
            this.roomStats.set(matchId, {
              createdAt: new Date(),
              totalJoins: 0,
              currentUsers: 0
            });
          }
          
          this.matchRooms.get(matchId).add(socket.userId);
          const stats = this.roomStats.get(matchId);
          stats.totalJoins++;
          stats.currentUsers = this.matchRooms.get(matchId).size;

          socket.emit('joined-match', { 
            matchId,
            spectatorCount: stats.currentUsers
          });
          
          // 通知房间内其他用户有新用户加入
          socket.to(`match:${matchId}`).emit('spectator-joined', {
            matchId,
            userId: socket.userId,
            userName: socket.user.name,
            spectatorCount: stats.currentUsers
          });

          console.log(`用户 ${socket.user.name} 加入比赛房间 ${matchId}`);

          // 发送当前比赛状态
          this.sendMatchUpdate(matchId);
        } catch (error) {
          console.error('加入比赛房间失败:', error);
          socket.emit('error', { message: '加入比赛房间失败' });
        }
      });

      // 处理离开比赛房间
      socket.on('leave-match', (matchId) => {
        socket.leave(`match:${matchId}`);
        
        if (this.matchRooms.has(matchId)) {
          this.matchRooms.get(matchId).delete(socket.userId);
          const stats = this.roomStats.get(matchId);
          if (stats) {
            stats.currentUsers = this.matchRooms.get(matchId).size;
          }
          
          // 通知房间内其他用户有用户离开
          socket.to(`match:${matchId}`).emit('spectator-left', {
            matchId,
            userId: socket.userId,
            userName: socket.user.name,
            spectatorCount: stats ? stats.currentUsers : 0
          });
          
          if (this.matchRooms.get(matchId).size === 0) {
            this.matchRooms.delete(matchId);
            this.roomStats.delete(matchId);
          }
        }

        socket.emit('left-match', { matchId });
        console.log(`用户 ${socket.user.name} 离开比赛房间 ${matchId}`);
      });

      // 处理实时比分更新
      socket.on('update-score', async (data) => {
        try {
          const { matchId, scoreData, setIndex, gameIndex } = data;
          
          if (!matchId || !scoreData) {
            socket.emit('error', { message: '缺少必要参数' });
            return;
          }

          // 验证用户权限（只有比赛参与者或管理员可以更新比分）
          const match = await Match.findById(matchId);
          if (!match) {
            socket.emit('error', { message: '比赛不存在' });
            return;
          }

          const isParticipant = match.participants && match.participants.some(p => 
            p.playerId && p.playerId.toString() === socket.userId
          );
          const isOrganizer = match.organizer.id && match.organizer.id.toString() === socket.userId;
          const isAdmin = socket.user.isAdmin;

          if (!isParticipant && !isOrganizer && !isAdmin) {
            socket.emit('error', { message: '没有权限更新比分' });
            return;
          }

          // 更新比分
          const updatedMatch = await match.updateScore(scoreData, setIndex, gameIndex);
          
          // 广播比分更新
          await this.sendScoreUpdate(matchId, {
            scoreData: updatedMatch.scores,
            currentSet: updatedMatch.currentSet,
            currentGame: updatedMatch.currentGame,
            matchStatus: updatedMatch.status,
            updatedBy: {
              userId: socket.userId,
              userName: socket.user.name
            }
          });

          console.log(`比分更新 - 比赛: ${matchId}, 用户: ${socket.user.name}`);
        } catch (error) {
          console.error('比分更新失败:', error);
          socket.emit('error', { message: '比分更新失败' });
        }
      });

      // 处理比赛状态更新
      socket.on('update-match-status', async (data) => {
        try {
          const { matchId, status, reason } = data;
          
          if (!matchId || !status) {
            socket.emit('error', { message: '缺少必要参数' });
            return;
          }

          // 验证权限
          const match = await Match.findById(matchId);
          if (!match) {
            socket.emit('error', { message: '比赛不存在' });
            return;
          }

          const isOrganizer = match.organizer.id && match.organizer.id.toString() === socket.userId;
          const isAdmin = socket.user.isAdmin;

          if (!isOrganizer && !isAdmin) {
            socket.emit('error', { message: '没有权限更新比赛状态' });
            return;
          }

          // 更新比赛状态
          match.status = status;
          if (reason) match.statusReason = reason;
          match.lastUpdated = new Date();
          
          await match.save();

          // 广播状态更新
          await this.sendMatchStatusUpdate(matchId, status, {
            reason,
            updatedBy: {
              userId: socket.userId,
              userName: socket.user.name
            }
          });

          console.log(`比赛状态更新 - 比赛: ${matchId}, 状态: ${status}, 用户: ${socket.user.name}`);
        } catch (error) {
          console.error('比赛状态更新失败:', error);
          socket.emit('error', { message: '比赛状态更新失败' });
        }
      });

      // 处理实时聊天消息
      socket.on('match-message', async (data) => {
        try {
          const { matchId, message } = data;
          
          // 验证用户是否在比赛房间中
          if (!this.matchRooms.has(matchId) || !this.matchRooms.get(matchId).has(socket.userId)) {
            socket.emit('error', { message: '您不在此比赛房间中' });
            return;
          }

          const messageData = {
            matchId,
            userId: socket.userId,
            userName: socket.user.name,
            userAvatar: socket.user.avatar,
            message: message.trim(),
            timestamp: new Date().toISOString()
          };

          // 广播消息到比赛房间
          this.io.to(`match:${matchId}`).emit('match-message', messageData);
          
          console.log(`比赛 ${matchId} 收到消息: ${socket.user.name}: ${message}`);
        } catch (error) {
          console.error('处理聊天消息失败:', error);
          socket.emit('error', { message: '发送消息失败' });
        }
      });

      // 处理心跳
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // 处理断线重连
      socket.on('reconnect', () => {
        console.log(`用户 ${socket.user.name} 重新连接`);
        socket.emit('reconnected', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });

      // 处理断开连接
      socket.on('disconnect', (reason) => {
        console.log(`用户 ${socket.user.name} (${socket.userId}) 断开连接: ${reason}`);
        
        // 从所有比赛房间中移除用户
        for (const [matchId, users] of this.matchRooms.entries()) {
          if (users.has(socket.userId)) {
            users.delete(socket.userId);
            
            // 更新房间统计
            const stats = this.roomStats.get(matchId);
            if (stats) {
              stats.currentUsers = users.size;
            }
            
            // 通知房间内其他用户
            socket.to(`match:${matchId}`).emit('spectator-left', {
              matchId,
              userId: socket.userId,
              userName: socket.user.name,
              spectatorCount: users.size
            });
            
            if (users.size === 0) {
              this.matchRooms.delete(matchId);
              this.roomStats.delete(matchId);
            }
          }
        }
        
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  // 发送比赛更新
  async sendMatchUpdate(matchId) {
    try {
      const match = await Match.findById(matchId)
        .populate('eventId', 'name')
        .populate('players.userId', 'name avatar')
        .populate('organizer.id', 'name avatar');

      if (match) {
        this.io.to(`match:${matchId}`).emit('match-update', {
          matchId,
          data: match
        });
      }
    } catch (error) {
      console.error('发送比赛更新失败:', error);
    }
  }

  // 启动心跳检测
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.io.emit('heartbeat', { timestamp: new Date().toISOString() });
    }, 30000); // 每30秒发送一次心跳
  }

  // 停止心跳检测
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 发送比分更新 - 增强版本
  async sendScoreUpdate(matchId, scoreData) {
    try {
      const updateData = {
        matchId,
        ...scoreData,
        timestamp: new Date().toISOString()
      };

      // 发送比分更新事件
      this.io.to(`match:${matchId}`).emit('score-update', updateData);

      // 获取完整的比赛数据
      const match = await Match.findById(matchId);
      if (match) {
        const scoreSummary = match.getScoreSummary();
        const matchStats = match.getMatchStats();

        // 发送详细的比分更新
        this.io.to(`match:${matchId}`).emit('score-detailed-update', {
          matchId,
          scoreSummary,
          matchStats,
          isCompleted: match.status === '已结束',
          winner: scoreSummary.winner,
          timestamp: new Date().toISOString()
        });
      }

      // 同时发送完整的比赛更新
      await this.sendMatchUpdate(matchId);
      
      console.log(`比分更新已广播到比赛房间 ${matchId}`);
    } catch (error) {
      console.error('发送比分更新失败:', error);
    }
  }

  // 发送比赛状态更新 - 增强版本
  async sendMatchStatusUpdate(matchId, status, additionalData = {}) {
    try {
      const updateData = {
        matchId,
        status,
        ...additionalData,
        timestamp: new Date().toISOString()
      };

      this.io.to(`match:${matchId}`).emit('match-status-update', updateData);

      // 根据状态发送特定事件
      switch (status) {
        case '比赛中':
          this.io.to(`match:${matchId}`).emit('match-started', updateData);
          break;
        case '已结束':
          this.io.to(`match:${matchId}`).emit('match-ended', updateData);
          break;
        case '暂停':
          this.io.to(`match:${matchId}`).emit('match-paused', updateData);
          break;
        case '恢复':
          this.io.to(`match:${matchId}`).emit('match-resumed', updateData);
          break;
      }

      await this.sendMatchUpdate(matchId);
      
      console.log(`比赛状态更新已广播: ${matchId} -> ${status}`);
    } catch (error) {
      console.error('发送比赛状态更新失败:', error);
    }
  }

  // 发送观众更新
  async sendSpectatorUpdate(matchId, updateData) {
    try {
      const spectatorCount = this.getMatchSpectatorsCount(matchId);
      
      this.io.to(`match:${matchId}`).emit('spectator-update', {
        matchId,
        spectatorCount,
        ...updateData,
        timestamp: new Date().toISOString()
      });
      
      console.log(`观众更新已广播到比赛房间 ${matchId}`);
    } catch (error) {
      console.error('发送观众更新失败:', error);
    }
  }

  // 发送系统通知
  sendSystemNotification(notification) {
    this.io.emit('system-notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // 发送通知给特定用户
  sendNotification(userId, notification) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  // 发送通知给多个用户
  sendNotificationToUsers(userIds, notification) {
    const results = [];
    userIds.forEach(userId => {
      const success = this.sendNotification(userId, notification);
      results.push({ userId, success });
    });
    return results;
  }

  // 发送比赛提醒
  async sendMatchReminder(matchId, reminderType, minutesBefore) {
    try {
      const match = await Match.findById(matchId);
      if (!match) return;

      const reminderData = {
        matchId,
        matchName: match.matchName,
        eventType: match.eventType,
        scheduledTime: match.scheduledTime,
        venue: match.venue,
        reminderType,
        minutesBefore,
        timestamp: new Date().toISOString()
      };

      // 发送给比赛房间的所有用户
      this.io.to(`match:${matchId}`).emit('match-reminder', reminderData);

      // 发送给关注此比赛的用户
      if (match.spectators && match.spectators.length > 0) {
        match.spectators.forEach(userId => {
          this.sendNotification(userId.toString(), {
            type: 'match-reminder',
            ...reminderData
          });
        });
      }

      console.log(`比赛提醒已发送: ${matchId} - ${reminderType}`);
    } catch (error) {
      console.error('发送比赛提醒失败:', error);
    }
  }

  // 获取在线用户数量
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // 获取比赛房间用户数量
  getMatchSpectatorsCount(matchId) {
    const users = this.matchRooms.get(matchId);
    return users ? users.size : 0;
  }

  // 获取所有房间统计
  getAllRoomStats() {
    const stats = {};
    for (const [matchId, roomStat] of this.roomStats.entries()) {
      stats[matchId] = {
        ...roomStat,
        currentUsers: this.getMatchSpectatorsCount(matchId)
      };
    }
    return stats;
  }

  // 获取用户连接信息
  getUserConnectionInfo(userId) {
    const socket = this.connectedUsers.get(userId);
    if (!socket) return null;

    const userRooms = [];
    for (const [matchId, users] of this.matchRooms.entries()) {
      if (users.has(userId)) {
        userRooms.push(matchId);
      }
    }

    return {
      userId,
      userName: socket.user.name,
      connectedAt: socket.handshake.time,
      rooms: userRooms,
      isConnected: true
    };
  }

  // 强制用户离开比赛房间
  forceLeaveMatch(userId, matchId, reason = '管理员操作') {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.leave(`match:${matchId}`);
      socket.emit('forced-leave-match', {
        matchId,
        reason,
        timestamp: new Date().toISOString()
      });

      // 更新房间数据
      if (this.matchRooms.has(matchId)) {
        this.matchRooms.get(matchId).delete(userId);
        const stats = this.roomStats.get(matchId);
        if (stats) {
          stats.currentUsers = this.matchRooms.get(matchId).size;
        }
      }

      console.log(`用户 ${userId} 被强制离开比赛房间 ${matchId}: ${reason}`);
      return true;
    }
    return false;
  }

  // 广播系统维护通知
  broadcastMaintenanceNotice(notice) {
    this.io.emit('maintenance-notice', {
      ...notice,
      timestamp: new Date().toISOString()
    });
    console.log('系统维护通知已广播');
  }

  // 清理资源
  cleanup() {
    this.stopHeartbeat();
    this.connectedUsers.clear();
    this.matchRooms.clear();
    this.roomStats.clear();
    console.log('WebSocket服务资源已清理');
  }
}

module.exports = SocketService; 