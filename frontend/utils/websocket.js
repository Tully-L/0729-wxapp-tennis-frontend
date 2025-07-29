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
    if (!userInfo) {
      console.log('用户未登录，跳过WebSocket连接');
      return;
    }

    const wsUrl = `wss://your-domain.com/ws?userId=${userInfo._id}&token=${userInfo.token}`;
    
    try {
      this.socket = wx.connectSocket({
        url: wsUrl,
        protocols: ['tennis-protocol']
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
          console.error('WebSocket消息解析失败:', error);
        }
      });

      this.socket.onClose(() => {
        console.log('🔌 WebSocket连接关闭');
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        this.attemptReconnect();
      });

      this.socket.onError((error) => {
        console.error('🔌 WebSocket连接错误:', error);
        this.isConnected = false;
        this.emit('error', error);
      });

    } catch (error) {
      console.error('WebSocket连接失败:', error);
    }
  }

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
      console.log('达到最大重连次数，停止重连');
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