// WebSocket 实时通信服务
const auth = require('./auth');

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.heartbeatInterval = null;
    this.listeners = new Map();
    
    console.log('🔌 WebSocket服务初始化');
  }

  // 连接WebSocket
  connect() {
    if (this.socket && this.isConnected) {
      console.log('WebSocket已连接');
      return;
    }

    const userInfo = auth.getUserInfo();
    const token = auth.getToken();
    
    if (!userInfo && !token) {
      console.log('用户未登录，使用匿名WebSocket连接');
      // 允许匿名连接以获取公共数据
    }

    // 使用生产环境的WebSocket地址或本地模拟
    const wsUrl = this.getWebSocketUrl();
    
    console.log('尝试连接WebSocket:', wsUrl);
    
    try {
      this.socket = wx.connectSocket({
        url: wsUrl,
        protocols: ['tennis-protocol'],
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      this.socket.onOpen(() => {
        console.log('🔌 WebSocket连接成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
      });

      this.socket.onMessage((res) => {
        try {
          const data = JSON.parse(res.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket消息解析失败:', error, res.data);
        }
      });

      this.socket.onClose((res) => {
        console.log('🔌 WebSocket连接关闭', res);
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        
        // 只有在非主动断开且非服务器不可用的情况下才重连
        if (res.code !== 1000 && res.code !== 1006 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else if (res.code === 1006) {
          console.log('WebSocket异常关闭，服务器可能不支持WebSocket');
          this.handleConnectionError();
        }
      });

      this.socket.onError((error) => {
        console.error('🔌 WebSocket连接错误:', error);
        this.isConnected = false;
        this.emit('error', error);
        
        // 对于连接错误，直接停止重连
        if (error.errMsg && error.errMsg.includes('未完成的操作')) {
          console.log('WebSocket服务器不可用，停止连接尝试');
          this.handleConnectionError();
        }
      });

    } catch (error) {
      console.error('WebSocket初始化失败:', error);
      this.handleConnectionError();
    }
  }

  // 获取WebSocket URL
  getWebSocketUrl() {
    const userInfo = auth.getUserInfo();
    const token = auth.getToken();
    
    // 生产环境WebSocket地址
    const productionWsUrl = 'wss://zero729-wxapp-tennis.onrender.com/ws';
    
    // 本地开发WebSocket地址
    const developmentWsUrl = 'ws://localhost:8080/ws';
    
    // 根据环境选择URL
    let baseUrl = productionWsUrl;
    
    // 添加认证参数
    const params = [];
    if (userInfo && userInfo.id) {
      params.push(`userId=${encodeURIComponent(userInfo.id)}`);
    }
    if (token) {
      params.push(`token=${encodeURIComponent(token)}`);
    }
    
    if (params.length > 0) {
      baseUrl += '?' + params.join('&');
    }
    
    return baseUrl;
  }

  // 处理连接错误
  handleConnectionError() {
    console.log('WebSocket连接失败，禁用WebSocket功能');
    
    // 禁用重连
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.isConnected = false;
    
    // 通知应用WebSocket不可用
    this.emit('websocket_unavailable');
  }

  // 模拟数据推送已移除，不再需要

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.reconnectAttempts = this.maxReconnectAttempts; // 防止自动重连
  }

  // 发送消息
  send(data) {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      this.socket.send({
        data: JSON.stringify(data)
      });
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  }

  // 处理接收到的消息
  handleMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'match_score_update':
        this.handleMatchScoreUpdate(payload);
        break;
      case 'match_status_change':
        this.handleMatchStatusChange(payload);
        break;
      case 'event_update':
        this.handleEventUpdate(payload);
        break;
      case 'notification':
        this.handleNotification(payload);
        break;
      case 'tournament_update':
        this.handleTournamentUpdate(payload);
        break;
      case 'heartbeat':
        this.handleHeartbeat(payload);
        break;
      default:
        console.log('未知消息类型:', type);
    }

    // 触发通用消息事件
    this.emit('message', { type, payload });
  }

  // 处理比赛分数更新
  handleMatchScoreUpdate(payload) {
    const { matchId, score, currentSet, gameStatus } = payload;
    
    // 更新本地比赛数据
    this.emit('match_score_update', {
      matchId,
      score,
      currentSet,
      gameStatus
    });

    // 显示实时通知
    if (gameStatus === 'set_completed') {
      wx.showToast({
        title: `第${currentSet}盘结束`,
        icon: 'none',
        duration: 2000
      });
    }
  }

  // 处理比赛状态变化
  handleMatchStatusChange(payload) {
    const { matchId, status, player1, player2 } = payload;
    
    this.emit('match_status_change', {
      matchId,
      status,
      player1,
      player2
    });

    // 显示状态变化通知
    let statusText = '';
    switch (status) {
      case 'started':
        statusText = '比赛开始';
        break;
      case 'completed':
        statusText = '比赛结束';
        break;
      case 'paused':
        statusText = '比赛暂停';
        break;
      case 'cancelled':
        statusText = '比赛取消';
        break;
    }

    if (statusText) {
      wx.showToast({
        title: `${player1.name} vs ${player2.name} ${statusText}`,
        icon: 'none',
        duration: 3000
      });
    }
  }

  // 处理赛事更新
  handleEventUpdate(payload) {
    const { eventId, type, data } = payload;
    
    this.emit('event_update', {
      eventId,
      type,
      data
    });

    // 根据更新类型显示通知
    switch (type) {
      case 'registration_opened':
        wx.showToast({
          title: '新赛事开放报名',
          icon: 'none'
        });
        break;
      case 'registration_closing_soon':
        wx.showToast({
          title: '报名即将截止',
          icon: 'none'
        });
        break;
      case 'event_cancelled':
        wx.showToast({
          title: '赛事已取消',
          icon: 'none'
        });
        break;
    }
  }

  // 处理通知消息
  handleNotification(payload) {
    const { title, content, priority, data } = payload;
    
    this.emit('notification', payload);

    // 根据优先级显示不同类型的通知
    if (priority === 'high') {
      wx.showModal({
        title: title,
        content: content,
        showCancel: false,
        confirmText: '知道了'
      });
    } else {
      wx.showToast({
        title: title,
        icon: 'none',
        duration: 3000
      });
    }
  }

  // 处理锦标赛更新
  handleTournamentUpdate(payload) {
    const { tournamentId, type, data } = payload;
    
    this.emit('tournament_update', {
      tournamentId,
      type,
      data
    });
  }

  // 处理心跳消息
  handleHeartbeat(payload) {
    // 回复心跳
    this.send({
      type: 'heartbeat_response',
      payload: { timestamp: Date.now() }
    });
  }

  // 开始心跳
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'heartbeat',
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000); // 每30秒发送一次心跳
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 尝试重连
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('达到最大重连次数，停止重连，WebSocket服务不可用');
      this.handleConnectionError();
      return;
    }

    this.reconnectAttempts++;
    console.log(`尝试第${this.reconnectAttempts}次重连...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  // 订阅比赛更新
  subscribeToMatch(matchId) {
    this.send({
      type: 'subscribe_match',
      payload: { matchId }
    });
  }

  // 取消订阅比赛更新
  unsubscribeFromMatch(matchId) {
    this.send({
      type: 'unsubscribe_match',
      payload: { matchId }
    });
  }

  // 订阅赛事更新
  subscribeToEvent(eventId) {
    this.send({
      type: 'subscribe_event',
      payload: { eventId }
    });
  }

  // 取消订阅赛事更新
  unsubscribeFromEvent(eventId) {
    this.send({
      type: 'unsubscribe_event',
      payload: { eventId }
    });
  }

  // 事件监听
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // 移除事件监听
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 触发事件
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`WebSocket事件处理失败 (${event}):`, error);
        }
      });
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// 创建全局WebSocket服务实例
let wsService = null;

function getWebSocketService() {
  if (!wsService) {
    wsService = new WebSocketService();
  }
  return wsService;
}

// 初始化WebSocket连接
function initWebSocket() {
  const service = getWebSocketService();
  service.connect();
  return service;
}

module.exports = {
  WebSocketService,
  getWebSocketService,
  initWebSocket
};