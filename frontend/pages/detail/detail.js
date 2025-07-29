// detail.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth');
const { MatchWebSocket } = require('../../utils/websocket');

Page({
  data: {
    matchId: '',
    match: null,
    loading: true,
    error: false,
    
    // User info
    userInfo: null,
    isLoggedIn: false,
    
    // Enhanced match data
    scoreSummary: null,
    matchStats: null,
    spectators: [],
    
    // User relation to match
    isSpectator: false,
    isOrganizer: false,
    canUpdateScore: false,
    
    // Score update
    showScoreUpdate: false,
    currentSet: 1,
    team1Score: 0,
    team2Score: 0,
    tiebreakMode: false,
    tiebreakTeam1: 0,
    tiebreakTeam2: 0,
    
    // Real-time updates
    wsClient: null,
    isConnected: false,
    lastUpdate: null,
    connectionStatus: 'disconnected', // disconnected, connecting, connected
    
    // Chat messages
    messages: [],
    newMessage: '',
    showChat: false
  },
  
  onLoad: function(options) {
    if (options.id) {
      this.setData({
        matchId: options.id
      });
      
      this.loadMatchDetail();
    } else {
      this.setData({
        loading: false,
        error: true
      });
      
      wx.showToast({
        title: 'Invalid match ID',
        icon: 'none'
      });
    }
    
    // Get user info from global data
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  onUnload: function() {
    // Close WebSocket connection when page is unloaded
    if (this.data.ws) {
      this.data.ws.close();
    }
  },
  
  // Load match detail data - Enhanced version
  loadMatchDetail: function() {
    this.setData({ loading: true });
    
    API.getMatchDetail(this.data.matchId)
      .then(res => {
        // Process match data
        const match = res;
        
        // Format duration
        if (match.duration) {
          match.formattedDuration = match.duration;
        }
        
        // Format status
        match.statusText = this.getMatchStatusText(match.status);
        match.statusClass = this.getMatchStatusClass(match.status);
        
        this.setData({
          match: match,
          scoreSummary: match.scoreSummary || null,
          matchStats: match.matchStats || null,
          spectators: match.spectators || [],
          isSpectator: match.userRelation?.isSpectator || false,
          isOrganizer: match.userRelation?.isOrganizer || false,
          canUpdateScore: match.userRelation?.canUpdateScore || false,
          loading: false,
          lastUpdate: new Date().toLocaleTimeString()
        });

        // If match is ongoing, establish WebSocket connection for real-time updates
        if (match.status === '比赛中' || match.isLive) {
          this.connectWebSocketForMatch();
        }
      })
      .catch(err => {
        console.error('Failed to load match detail:', err);
        this.setData({
          loading: false,
          error: true
        });
        
        wx.showToast({
          title: 'Failed to load match data',
          icon: 'none'
        });
      });
  },
  
  // Get match status text
  getMatchStatusText: function(status) {
    const statusMap = {
      'ongoing': '比赛中',
      'completed': '已结束',
      'upcoming': '即将开始',
      'registration': '报名中'
    };
    return statusMap[status] || status;
  },
  
  // Get match status class
  getMatchStatusClass: function(status) {
    const classMap = {
      'ongoing': 'status-live',
      'completed': 'status-completed',
      'upcoming': 'status-upcoming',
      'registration': 'status-registration'
    };
    return classMap[status] || '';
  },

  handleWebSocketMessage: function(message) {
    if (message.type === 'score_update' && message.matchId === this.data.matchId) {
      const newScore = message.newScore;
      let updatedMatch = this.data.match;

      // Update the specific set score
      if (updatedMatch.sets && updatedMatch.sets.length >= newScore.setNumber) {
        updatedMatch.sets[newScore.setNumber - 1].score = newScore.score;
        if (newScore.tiebreak) {
          updatedMatch.sets[newScore.setNumber - 1].tiebreak = newScore.tiebreak;
        }
      } else {
        // If set doesn't exist, add it (e.g., if new set just started)
        if (!updatedMatch.sets) {
          updatedMatch.sets = [];
        }
        updatedMatch.sets.push({
          setNumber: newScore.setNumber,
          score: newScore.score,
          tiebreak: newScore.tiebreak || null
        });
      }
      
      this.setData({
        match: updatedMatch
      });
      console.log('Live score updated:', updatedMatch);
    }
  },

  // Connect WebSocket for real-time match updates
  connectWebSocketForMatch: function() {
    if (!this.data.isLoggedIn) {
      console.log('用户未登录，跳过WebSocket连接');
      return;
    }

    this.setData({ connectionStatus: 'connecting' });

    const callbacks = {
      onJoined: (data) => {
        console.log('成功加入比赛房间:', data);
        this.setData({
          connectionStatus: 'connected',
          isConnected: true,
          lastUpdate: new Date().toLocaleTimeString()
        });
        
        // 更新观众数量
        if (data.spectatorCount !== undefined) {
          this.setData({
            matchStats: {
              ...this.data.matchStats,
              spectatorCount: data.spectatorCount
            }
          });
        }
      },

      onScoreUpdate: (data) => {
        console.log('收到比分更新:', data);
        this.handleScoreUpdate(data);
      },

      onStatusUpdate: (data) => {
        console.log('收到状态更新:', data);
        this.handleMatchStatusUpdate(data);
      },

      onSpectatorUpdate: (data) => {
        console.log('收到观众更新:', data);
        this.handleSpectatorUpdate(data);
      },

      onMessage: (data) => {
        console.log('收到聊天消息:', data);
        this.handleChatMessage(data);
      },

      onMatchUpdate: (data) => {
        console.log('收到比赛更新:', data);
        this.handleMatchUpdate(data);
      }
    };

    MatchWebSocket.joinMatch(this.data.matchId, callbacks)
      .then(client => {
        this.setData({ wsClient: client });
        console.log('WebSocket连接建立成功');
      })
      .catch(error => {
        console.error('WebSocket连接失败:', error);
        this.setData({
          connectionStatus: 'disconnected',
          isConnected: false
        });
        
        wx.showToast({
          title: '实时连接失败',
          icon: 'none'
        });
      });
  },

  // Disconnect WebSocket
  disconnectWebSocketForMatch: function() {
    if (this.data.wsClient) {
      MatchWebSocket.leaveMatch(this.data.matchId);
      this.setData({
        wsClient: null,
        connectionStatus: 'disconnected',
        isConnected: false
      });
      console.log('WebSocket连接已断开');
    }
  },
  
  // Register for the match
  registerMatch: function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: 'Please login first',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.match.status !== 'registration') {
      wx.showToast({
        title: 'Registration is not available',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: 'Registering...',
      mask: true
    });
    
    API.registerForEvent(this.data.match.eventId)
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: 'Registration successful',
          icon: 'success'
        });
        
        // Refresh match data
        this.loadMatchDetail();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.data?.message || 'Registration failed',
          icon: 'none'
        });
      });
  },
  
  // Navigate back
  goBack: function() {
    wx.navigateBack();
  },
  
  // Share match
  onShareAppMessage: function() {
    return {
      title: this.data.match ? 
        `${this.data.match.eventType} - ${this.data.match.players[0].name} vs ${this.data.match.players[1].name}` : 
        'Tennis Heat Match',
      path: `/pages/detail/detail?id=${this.data.matchId}`
    };
  },

  // Subscribe to match notifications
  subscribeToMatchNotifications: function() {
    const matchId = this.data.matchId;
    const templateId = 'YOUR_TEMPLATE_ID_HERE'; // Replace with your actual template ID

    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success (res) {
        if (res[templateId] === 'accept') {
          wx.showToast({
            title: '订阅成功',
            icon: 'success',
            duration: 2000
          });
          // You would typically send matchId and openId to your backend here
          console.log('User subscribed to match notifications for matchId:', matchId);
        } else {
          wx.showToast({
            title: '订阅失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail (err) {
        console.error('Subscription failed:', err);
        wx.showToast({
          title: '订阅失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // Login action (existing code)
  login: function() {
    // Existing login logic
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // Connect WebSocket for real-time updates
  connectWebSocket: function() {
    // 模拟WebSocket连接
    this.setData({ isConnected: true });
    
    // 定期检查更新（实际应用中应该使用真正的WebSocket）
    this.updateInterval = setInterval(() => {
      if (this.data.match?.isLive) {
        this.loadMatchDetail();
      }
    }, 30000); // 每30秒更新一次
  },
  
  // Disconnect WebSocket
  disconnectWebSocket: function() {
    this.setData({ isConnected: false });
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  },
  
  // Join as spectator - Enhanced version
  joinAsSpectator: function() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再观看比赛',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            auth.goToLogin();
          }
        }
      });
      return;
    }
    
    if (this.data.isSpectator) {
      // 如果已经是观众，则退出观众
      this.leaveSpectator();
      return;
    }
    
    wx.showLoading({ title: '加入中...' });
    
    API.addSpectator(this.data.matchId).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '成功加入观众',
          icon: 'success'
        });
        
        // 更新本地状态
        this.setData({
          isSpectator: true,
          spectators: [...this.data.spectators, this.data.userInfo],
          matchStats: {
            ...this.data.matchStats,
            spectatorCount: (this.data.matchStats?.spectatorCount || 0) + 1
          }
        });
      } else {
        wx.showToast({
          title: res.message || '加入失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('加入观众失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },
  
  // Leave spectator
  leaveSpectator: function() {
    wx.showLoading({ title: '退出中...' });
    
    API.removeSpectator(this.data.matchId).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '已退出观众',
          icon: 'success'
        });
        
        // 更新本地状态
        const spectators = this.data.spectators.filter(s => s._id !== this.data.userInfo?.id);
        this.setData({
          isSpectator: false,
          spectators: spectators,
          matchStats: {
            ...this.data.matchStats,
            spectatorCount: Math.max(0, (this.data.matchStats?.spectatorCount || 1) - 1)
          }
        });
      } else {
        wx.showToast({
          title: res.message || '退出失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('退出观众失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },
  
  // Show score update dialog
  showScoreUpdateDialog: function() {
    if (!this.data.canUpdateScore) {
      wx.showToast({
        title: '没有权限更新比分',
        icon: 'none'
      });
      return;
    }
    
    // 获取当前盘数
    const currentSet = this.data.scoreSummary?.sets?.length + 1 || 1;
    
    this.setData({
      showScoreUpdate: true,
      currentSet: currentSet,
      team1Score: 0,
      team2Score: 0,
      tiebreakMode: false,
      tiebreakTeam1: 0,
      tiebreakTeam2: 0
    });
  },
  
  // Hide score update dialog
  hideScoreUpdateDialog: function() {
    this.setData({
      showScoreUpdate: false
    });
  },
  
  // Update score inputs
  onTeam1ScoreChange: function(e) {
    this.setData({ team1Score: parseInt(e.detail.value) || 0 });
  },
  
  onTeam2ScoreChange: function(e) {
    this.setData({ team2Score: parseInt(e.detail.value) || 0 });
  },
  
  onTiebreakTeam1Change: function(e) {
    this.setData({ tiebreakTeam1: parseInt(e.detail.value) || 0 });
  },
  
  onTiebreakTeam2Change: function(e) {
    this.setData({ tiebreakTeam2: parseInt(e.detail.value) || 0 });
  },
  
  // Toggle tiebreak mode
  toggleTiebreak: function() {
    this.setData({
      tiebreakMode: !this.data.tiebreakMode
    });
  },
  
  // Submit score update
  submitScoreUpdate: function() {
    const { currentSet, team1Score, team2Score, tiebreakMode, tiebreakTeam1, tiebreakTeam2 } = this.data;
    
    // 验证比分
    if (team1Score < 0 || team2Score < 0) {
      wx.showToast({
        title: '比分不能为负数',
        icon: 'none'
      });
      return;
    }
    
    const updateData = {
      setNumber: currentSet,
      team1Score: team1Score,
      team2Score: team2Score
    };
    
    if (tiebreakMode) {
      updateData.tiebreak = {
        team1Score: tiebreakTeam1,
        team2Score: tiebreakTeam2
      };
    }
    
    wx.showLoading({ title: '更新中...' });
    
    API.updateMatchScore(this.data.matchId, updateData).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '比分更新成功',
          icon: 'success'
        });
        
        this.hideScoreUpdateDialog();
        this.loadMatchDetail(); // 重新加载数据
      } else {
        wx.showToast({
          title: res.message || '更新失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('更新比分失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },
  
  // Format score display
  formatScore: function(sets) {
    if (!sets || sets.length === 0) {
      return '暂无比分';
    }
    
    return sets.map(set => {
      let scoreStr = `${set.team1Score}-${set.team2Score}`;
      if (set.tiebreak) {
        scoreStr += `(${set.tiebreak.team1Score}-${set.tiebreak.team2Score})`;
      }
      return scoreStr;
    }).join(' ');
  },
  
  // Format match time
  formatMatchTime: function(timeString) {
    if (!timeString) return '';
    
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Share match
  shareMatch: function() {
    const match = this.data.match;
    if (!match) return;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
  
  // Handle real-time score updates
  handleScoreUpdate: function(data) {
    const { scoreData, currentSet, currentGame, matchStatus, updatedBy } = data;
    
    // Update match data with new scores
    const updatedMatch = {
      ...this.data.match,
      scores: scoreData,
      currentSet: currentSet,
      currentGame: currentGame,
      status: matchStatus
    };
    
    this.setData({
      match: updatedMatch,
      lastUpdate: new Date().toLocaleTimeString()
    });
    
    // Show update notification
    wx.showToast({
      title: `比分已更新 by ${updatedBy?.nickname || '未知'}`,
      icon: 'none',
      duration: 2000
    });
    
    // Add score update animation
    this.animateScoreUpdate();
  },
  
  // Handle match status updates
  handleMatchStatusUpdate: function(data) {
    const { status, reason, updatedBy } = data;
    
    const updatedMatch = {
      ...this.data.match,
      status: status,
      statusReason: reason
    };
    
    updatedMatch.statusText = this.getMatchStatusText(status);
    updatedMatch.statusClass = this.getMatchStatusClass(status);
    
    this.setData({
      match: updatedMatch,
      lastUpdate: new Date().toLocaleTimeString()
    });
    
    // Show status update notification
    let message = `比赛状态: ${updatedMatch.statusText}`;
    if (updatedBy?.nickname) {
      message += ` (${updatedBy.nickname})`;
    }
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    });
  },
  
  // Handle spectator updates
  handleSpectatorUpdate: function(data) {
    const { spectatorCount, userId, userName } = data;
    
    this.setData({
      matchStats: {
        ...this.data.matchStats,
        spectatorCount: spectatorCount
      },
      lastUpdate: new Date().toLocaleTimeString()
    });
    
    // Show spectator join/leave notification
    if (data.type === 'joined') {
      console.log(`${userName} 加入观看`);
    } else if (data.type === 'left') {
      console.log(`${userName} 离开观看`);
    }
  },
  
  // Handle chat messages
  handleChatMessage: function(data) {
    const { userId, userName, userAvatar, message, timestamp } = data;
    
    const newMessage = {
      id: Date.now(),
      userId: userId,
      userName: userName,
      userAvatar: userAvatar,
      message: message,
      timestamp: timestamp,
      isOwn: userId === this.data.userInfo?.id
    };
    
    this.setData({
      messages: [...this.data.messages, newMessage]
    });
    
    // Auto scroll to bottom if chat is open
    if (this.data.showChat) {
      setTimeout(() => {
        wx.pageScrollTo({
          scrollTop: 999999,
          duration: 300
        });
      }, 100);
    }
  },
  
  // Handle general match updates
  handleMatchUpdate: function(data) {
    if (data.data && data.matchId === this.data.matchId) {
      const updatedMatch = data.data;
      
      // Format the updated match data
      updatedMatch.statusText = this.getMatchStatusText(updatedMatch.status);
      updatedMatch.statusClass = this.getMatchStatusClass(updatedMatch.status);
      
      this.setData({
        match: updatedMatch,
        scoreSummary: updatedMatch.scoreSummary || null,
        matchStats: updatedMatch.matchStats || null,
        spectators: updatedMatch.spectators || [],
        lastUpdate: new Date().toLocaleTimeString()
      });
    }
  },
  
  // Animate score update
  animateScoreUpdate: function() {
    // Add a simple animation class to highlight score changes
    this.setData({ scoreUpdateAnimation: true });
    
    setTimeout(() => {
      this.setData({ scoreUpdateAnimation: false });
    }, 1000);
  },
  
  // Toggle chat display
  toggleChat: function() {
    this.setData({
      showChat: !this.data.showChat
    });
    
    if (this.data.showChat) {
      // Scroll to bottom when opening chat
      setTimeout(() => {
        wx.pageScrollTo({
          scrollTop: 999999,
          duration: 300
        });
      }, 100);
    }
  },
  
  // Handle new message input
  onMessageInput: function(e) {
    this.setData({
      newMessage: e.detail.value
    });
  },
  
  // Send chat message
  sendChatMessage: function() {
    const message = this.data.newMessage.trim();
    
    if (!message) {
      wx.showToast({
        title: '请输入消息内容',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.isConnected) {
      wx.showToast({
        title: '连接已断开，无法发送消息',
        icon: 'none'
      });
      return;
    }
    
    // Send message via WebSocket
    MatchWebSocket.sendMessage(this.data.matchId, message);
    
    // Clear input
    this.setData({
      newMessage: ''
    });
  },
  
  // Update score via WebSocket
  updateScoreViaWebSocket: function() {
    const { currentSet, team1Score, team2Score, tiebreakMode, tiebreakTeam1, tiebreakTeam2 } = this.data;
    
    const scoreData = {
      setNumber: currentSet,
      team1Score: team1Score,
      team2Score: team2Score
    };
    
    if (tiebreakMode) {
      scoreData.tiebreak = {
        team1Score: tiebreakTeam1,
        team2Score: tiebreakTeam2
      };
    }
    
    // Send score update via WebSocket
    MatchWebSocket.updateScore(this.data.matchId, scoreData, currentSet - 1, 0);
    
    this.hideScoreUpdateDialog();
    
    wx.showToast({
      title: '比分更新中...',
      icon: 'loading'
    });
  },
  
  // Page lifecycle
  onUnload: function() {
    this.disconnectWebSocket();
    this.disconnectWebSocketForMatch();
    if (this.data.ws) {
      this.data.ws.close();
    }
  },

  // Share App Message
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // From the share button in the UI
      console.log(res.target);
    }
    const match = this.data.match;
    return {
      title: match ? `${match.players.team1[0].name} vs ${match.players.team2[0].name} 比分详情` : '网球比赛详情',
      path: `/pages/detail/detail?id=${this.data.matchId}`,
      imageUrl: match && match.coverImage ? match.coverImage : '../../images/logo.png' // Use event cover image if available
    };
  }
}); 