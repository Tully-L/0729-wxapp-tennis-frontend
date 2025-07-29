// WebSocket服务器配置 - 实时比分更新系统
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Match = require('../models/Match');

class SocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });
    
    // 存储房间和用户信息
    this.rooms = new Map(); // matchId -> { users: Set, matchData: Object }
    this.userSockets = new Map(); // userId -> socketId
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // 设置中间件
  setupMiddleware() {
    // 认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('认证失败：缺少token'));
        }

        // 验证JWT token
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'tennis-secret-key');
        
        // 获取用户信息
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
          return next(new Error('认证失败：用户不存在'));
        }

        socket.userId = user._id.toString();
        socket.userInfo = user;
        next();
      } catch (error) {
        console.error('Socket认证失败:', error);
        next(new Error('认证失败：无效token'));
      }
    });
  }

  // 设置事件处理器
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`用户连接: ${socket.userInfo.nickname} (${socket.userId})`);
      
      // 存储用户socket映射
      this.userSockets.set(socket.userId, socket.id);

      // 加入比赛房间
      socket.on('join_match', async (data) => {
        await this.handleJoinMatch(socket, data);
      });

      // 离开比赛房间
      socket.on('leave_match', (data) => {
        this.handleLeaveMatch(socket, data);
      });

      // 更新比分
      socket.on('update_score', async (data) => {
        await this.handleScoreUpdate(socket, data);
      });

      // 比赛状态更新
      socket.on('match_status_update', async (data) => {
        await this.handleMatchStatusUpdate(socket, data);
      });

      // 发送聊天消息
      socket.on('send_message', async (data) => {
        await this.handleChatMessage(socket, data);
      });

      // 心跳检测
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // 断开连接处理
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // 处理加入比赛房间
  async handleJoinMatch(socket, data) {
    try {
      const { matchId } = data;
      
      if (!matchId) {
        socket.emit('error', { message: '缺少比赛ID' });
        return;
      }

      // 验证比赛是否存在
      const match = await Match.findById(matchId);
      if (!match) {
        socket.emit('error', { message: '比赛不存在' });
        return;
      }

      // 加入房间
      socket.join(`match_${matchId}`);
      
      // 更新房间信息
      if (!this.rooms.has(matchId)) {
        this.rooms.set(matchId, {
          users: new Set(),
          matchData: match.toObject(),
          lastActivity: Date.now()
        });
      }
      
      const room = this.rooms.get(matchId);
      room.users.add(socket.userId);
      room.lastActivity = Date.now();

      // 通知用户加入成功
      socket.emit('joined_match', {
        matchId,
        matchData: room.matchData,
        onlineUsers: Array.from(room.users).length
      });

      // 通知房间内其他用户
      socket.to(`match_${matchId}`).emit('user_joined', {
        userId: socket.userId,
        userInfo: {
          nickname: socket.userInfo.nickname,
          avatar: socket.userInfo.avatar
        },
        onlineUsers: Array.from(room.users).length
      });

      console.log(`用户 ${socket.userInfo.nickname} 加入比赛房间: ${matchId}`);
    } catch (error) {
      console.error('加入比赛房间失败:', error);
      socket.emit('error', { message: '加入房间失败' });
    }
  }

  // 处理离开比赛房间
  handleLeaveMatch(socket, data) {
    try {
      const { matchId } = data;
      
      if (!matchId) return;

      socket.leave(`match_${matchId}`);
      
      // 更新房间信息
      if (this.rooms.has(matchId)) {
        const room = this.rooms.get(matchId);
        room.users.delete(socket.userId);
        
        // 通知房间内其他用户
        socket.to(`match_${matchId}`).emit('user_left', {
          userId: socket.userId,
          onlineUsers: Array.from(room.users).length
        });

        // 如果房间为空，清理房间
        if (room.users.size === 0) {
          this.rooms.delete(matchId);
        }
      }

      console.log(`用户 ${socket.userInfo.nickname} 离开比赛房间: ${matchId}`);
    } catch (error) {
      console.error('离开比赛房间失败:', error);
    }
  }

  // 处理比分更新
  async handleScoreUpdate(socket, data) {
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

      const isParticipant = match.participants.some(p => 
        p.playerId && p.playerId.toString() === socket.userId
      );
      const isOrganizer = match.organizer.id && match.organizer.id.toString() === socket.userId;
      const isAdmin = socket.userInfo.isAdmin;

      if (!isParticipant && !isOrganizer && !isAdmin) {
        socket.emit('error', { message: '没有权限更新比分' });
        return;
      }

      // 更新比分
      const updatedMatch = await match.updateScore(scoreData, setIndex, gameIndex);
      
      // 更新房间缓存
      if (this.rooms.has(matchId)) {
        this.rooms.get(matchId).matchData = updatedMatch.toObject();
      }

      // 广播比分更新
      this.io.to(`match_${matchId}`).emit('score_updated', {
        matchId,
        scoreData: updatedMatch.scores,
        currentSet: updatedMatch.currentSet,
        currentGame: updatedMatch.currentGame,
        matchStatus: updatedMatch.status,
        updatedBy: {
          userId: socket.userId,
          nickname: socket.userInfo.nickname
        },
        timestamp: Date.now()
      });

      console.log(`比分更新 - 比赛: ${matchId}, 用户: ${socket.userInfo.nickname}`);
    } catch (error) {
      console.error('比分更新失败:', error);
      socket.emit('error', { message: '比分更新失败' });
    }
  }

  // 处理比赛状态更新
  async handleMatchStatusUpdate(socket, data) {
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
      const isAdmin = socket.userInfo.isAdmin;

      if (!isOrganizer && !isAdmin) {
        socket.emit('error', { message: '没有权限更新比赛状态' });
        return;
      }

      // 更新比赛状态
      match.status = status;
      if (reason) match.statusReason = reason;
      match.lastUpdated = new Date();
      
      await match.save();

      // 更新房间缓存
      if (this.rooms.has(matchId)) {
        this.rooms.get(matchId).matchData = match.toObject();
      }

      // 广播状态更新
      this.io.to(`match_${matchId}`).emit('match_status_updated', {
        matchId,
        status,
        reason,
        updatedBy: {
          userId: socket.userId,
          nickname: socket.userInfo.nickname
        },
        timestamp: Date.now()
      });

      console.log(`比赛状态更新 - 比赛: ${matchId}, 状态: ${status}, 用户: ${socket.userInfo.nickname}`);
    } catch (error) {
      console.error('比赛状态更新失败:', error);
      socket.emit('error', { message: '比赛状态更新失败' });
    }
  }

  // 处理聊天消息
  async handleChatMessage(socket, data) {
    try {
      const { matchId, message, type = 'text' } = data;
      
      if (!matchId || !message) {
        socket.emit('error', { message: '缺少必要参数' });
        return;
      }

      // 验证用户是否在房间中
      if (!this.rooms.has(matchId) || !this.rooms.get(matchId).users.has(socket.userId)) {
        socket.emit('error', { message: '您不在此比赛房间中' });
        return;
      }

      const chatMessage = {
        id: Date.now().toString(),
        matchId,
        userId: socket.userId,
        userInfo: {
          nickname: socket.userInfo.nickname,
          avatar: socket.userInfo.avatar
        },
        message,
        type,
        timestamp: Date.now()
      };

      // 广播聊天消息
      this.io.to(`match_${matchId}`).emit('new_message', chatMessage);

      console.log(`聊天消息 - 比赛: ${matchId}, 用户: ${socket.userInfo.nickname}, 消息: ${message}`);
    } catch (error) {
      console.error('发送聊天消息失败:', error);
      socket.emit('error', { message: '发送消息失败' });
    }
  }

  // 处理断开连接
  handleDisconnect(socket) {
    console.log(`用户断开连接: ${socket.userInfo?.nickname} (${socket.userId})`);
    
    // 清理用户socket映射
    this.userSockets.delete(socket.userId);
    
    // 从所有房间中移除用户
    for (const [matchId, room] of this.rooms.entries()) {
      if (room.users.has(socket.userId)) {
        room.users.delete(socket.userId);
        
        // 通知房间内其他用户
        socket.to(`match_${matchId}`).emit('user_left', {
          userId: socket.userId,
          onlineUsers: Array.from(room.users).length
        });

        // 如果房间为空，清理房间
        if (room.users.size === 0) {
          this.rooms.delete(matchId);
        }
      }
    }
  }

  // 获取房间信息
  getRoomInfo(matchId) {
    return this.rooms.get(matchId) || null;
  }

  // 获取在线用户数
  getOnlineUsers(matchId) {
    const room = this.rooms.get(matchId);
    return room ? Array.from(room.users).length : 0;
  }

  // 向特定用户发送消息
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // 向比赛房间广播消息
  broadcastToMatch(matchId, event, data) {
    this.io.to(`match_${matchId}`).emit(event, data);
  }

  // 清理过期房间
  cleanupExpiredRooms() {
    const now = Date.now();
    const ROOM_TIMEOUT = 30 * 60 * 1000; // 30分钟

    for (const [matchId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > ROOM_TIMEOUT && room.users.size === 0) {
        this.rooms.delete(matchId);
        console.log(`清理过期房间: ${matchId}`);
      }
    }
  }
}

module.exports = SocketServer;