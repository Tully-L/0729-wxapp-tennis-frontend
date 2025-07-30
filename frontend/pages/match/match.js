// match.js - 比赛页面固定标签栏
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    // Tab system
    activeTab: 'all-matches',
    tabs: [
      { id: 'all-matches', name: '全部', icon: '📋', badge: 0 },
      { id: 'live-matches', name: '直播', icon: '🔴', badge: 0 },
      { id: 'my-matches', name: '我的', icon: '👤', badge: 0, requiresAuth: true },
      { id: 'tournament', name: '锦标赛', icon: '🏆', badge: 0 },
      { id: 'statistics', name: '统计', icon: '📊', badge: 0, requiresAuth: true }
    ],

    // Tab-specific data
    tabData: {
      'all-matches': {
        matches: [],
        loading: false,
        hasMore: true,
        currentPage: 1
      },
      'live-matches': {
        matches: [],
        loading: false,
        refreshInterval: null
      },
      'my-matches': {
        matches: [],
        loading: false,
        type: 'all'
      },
      tournament: {
        tournaments: [],
        selectedTournament: null,
        bracketRounds: []
      },
      statistics: {
        userStats: {},
        performanceData: [],
        timeRange: '7d'
      }
    },

    // Current data
    matches: [],
    liveMatches: [],
    myMatches: [],
    loading: false,
    hasMore: true,

    // Filter and stats
    matchFilters: [
      { id: 'all', name: '全部', icon: '📋' },
      { id: 'singles', name: '单打', icon: '👤' },
      { id: 'doubles', name: '双打', icon: '👥' },
      { id: 'mixed', name: '混双', icon: '⚤' }
    ],
    currentFilter: 'all',
    matchStats: null,

    // User info
    userInfo: null,
    isLoggedIn: false
  },

  onLoad: function () {
    // Check login status
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();

    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    });

    // Initialize tab system
    this.initTabSystem();

    // Initialize touch gestures
    this.initTouchGestures();

    // Load initial data
    this.loadTabData(this.data.activeTab);
  },

  // Tab system methods
  initTabSystem: function () {
    const tabs = this.data.tabs.map(tab => {
      if (tab.requiresAuth && !this.data.isLoggedIn) {
        return { ...tab, disabled: true };
      }
      return tab;
    });

    this.setData({ tabs });
    this.scrollPositions = {};
    this.data.tabs.forEach(tab => {
      this.scrollPositions[tab.id] = 0;
    });
  },

  onTabChange: function (e) {
    const { activeTab, previousTab } = e.detail;

    if (previousTab) {
      this.saveScrollPosition(previousTab);
    }

    this.setData({ activeTab });
    this.loadTabData(activeTab);

    setTimeout(() => {
      this.restoreScrollPosition(activeTab);
    }, 100);
  },

  loadTabData: function (tabId) {
    switch (tabId) {
      case 'all-matches':
        this.loadAllMatches();
        break;
      case 'live-matches':
        this.loadLiveMatches();
        break;
      case 'my-matches':
        this.loadMyMatches();
        break;
      case 'tournament':
        this.loadTournamentData();
        break;
      case 'statistics':
        this.loadStatistics();
        break;
    }
  },

  // Touch gesture methods
  initTouchGestures: function () {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 50;
    this.maxVerticalDistance = 100;
  },

  onTouchStart: function (e) {
    if (e.touches && e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  },

  onTouchMove: function (e) {
    if (e.touches && e.touches.length > 0) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const deltaX = Math.abs(currentX - this.touchStartX);
      const deltaY = Math.abs(currentY - this.touchStartY);

      if (deltaX > deltaY && deltaX > 20) {
        e.preventDefault();
      }
    }
  },

  onTouchEnd: function (e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - this.touchStartX;
      const deltaY = Math.abs(touchEndY - this.touchStartY);

      if (Math.abs(deltaX) > this.minSwipeDistance && deltaY < this.maxVerticalDistance) {
        const currentTabIndex = this.data.tabs.findIndex(tab => tab.id === this.data.activeTab);
        let newTabIndex;

        if (deltaX > 0) {
          newTabIndex = currentTabIndex > 0 ? currentTabIndex - 1 : this.data.tabs.length - 1;
        } else {
          newTabIndex = currentTabIndex < this.data.tabs.length - 1 ? currentTabIndex + 1 : 0;
        }

        const newTab = this.data.tabs[newTabIndex];
        if (!newTab.disabled) {
          this.triggerHapticFeedback();
          this.switchToTab(newTab.id);
        }
      }
    }
  },

  switchToTab: function (tabId) {
    if (tabId === this.data.activeTab) return;

    const previousTab = this.data.activeTab;
    this.saveScrollPosition(previousTab);
    this.setData({ activeTab: tabId });
    this.loadTabData(tabId);

    setTimeout(() => {
      this.restoreScrollPosition(tabId);
    }, 100);
  },

  triggerHapticFeedback: function () {
    try {
      wx.vibrateShort({ type: 'light' });
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },

  saveScrollPosition: function (tabId) {
    wx.createSelectorQuery()
      .selectViewport()
      .scrollOffset()
      .exec((res) => {
        if (res[0]) {
          this.scrollPositions[tabId] = res[0].scrollTop;
        }
      });
  },

  restoreScrollPosition: function (tabId) {
    const scrollTop = this.scrollPositions[tabId] || 0;
    if (scrollTop > 0) {
      wx.pageScrollTo({
        scrollTop: scrollTop,
        duration: 300
      });
    }
  },

  // Data loading methods
  loadAllMatches: function() {
    this.setData({
      'tabData.all-matches.loading': true
    });

    const params = {
      page: this.data.tabData['all-matches'].currentPage,
      pageSize: 20,
      status: 'all'
    };

    API.getMatches(params).then(res => {
      let matches = res.data || [];
      
      // Transform matches to ensure proper data structure for WXML
      matches = matches.map(match => ({
        ...match,
        // Ensure player data structure matches WXML expectations
        player1: match.players && match.players.team1 ? {
          name: match.players.team1[0]?.name || 'Unknown Player',
          avatar: match.players.team1[0]?.avatar || '/images/default-avatar.png',
          rank: match.players.team1[0]?.ranking || null
        } : {
          name: 'Unknown Player',
          avatar: '/images/default-avatar.png',
          rank: null
        },
        player2: match.players && match.players.team2 ? {
          name: match.players.team2[0]?.name || 'Unknown Player',
          avatar: match.players.team2[0]?.avatar || '/images/default-avatar.png',
          rank: match.players.team2[0]?.ranking || null
        } : {
          name: 'Unknown Player',
          avatar: '/images/default-avatar.png',
          rank: null
        },
        // Ensure score structure exists
        score: match.score || { player1: 0, player2: 0, sets: [] },
        // Map status to expected values
        status: this.mapStatusToExpected(match.status),
        // Ensure venue is a string
        venue: match.venue || '未知场地',
        // Add missing fields that template expects
        canInteract: true,
        canScore: match.status === '比赛中' || match.status === 'live',
        round: match.stage || match.tournament?.round || '第一轮'
      }));
      
      const currentMatches = this.data.tabData['all-matches'].matches;
      
      this.setData({
        'tabData.all-matches.matches': params.page === 1 ? matches : [...currentMatches, ...matches],
        'tabData.all-matches.loading': false,
        'tabData.all-matches.hasMore': res.pagination && res.pagination.page < res.pagination.pages,
        matches: params.page === 1 ? matches : [...currentMatches, ...matches]
      });
    }).catch(err => {
      console.error('Failed to load matches:', err);
      this.setData({
        'tabData.all-matches.loading': false
      });
    });
  },

  mapStatusToExpected: function(status) {
    const statusMap = {
      '比赛中': 'live',
      '已结束': 'completed',
      '报名中': 'upcoming',
      'live': 'live',
      'ongoing': 'live',
      'completed': 'completed',
      'upcoming': 'upcoming',
      'scheduled': 'scheduled'
    };
    return statusMap[status] || 'scheduled';
  },

  loadLiveMatches: function() {
    this.setData({
      'tabData.live-matches.loading': true
    });

    API.getMatches({ status: 'ongoing', live: true }).then(res => {
      let liveMatches = res.data || [];
      
      // Transform live matches data
      liveMatches = liveMatches.map(match => ({
        ...match,
        // Ensure player data structure
        player1: match.players && match.players.team1 ? {
          name: match.players.team1[0]?.name || 'Unknown Player',
          avatar: match.players.team1[0]?.avatar || '/images/default-avatar.png'
        } : { name: 'Unknown Player', avatar: '/images/default-avatar.png' },
        player2: match.players && match.players.team2 ? {
          name: match.players.team2[0]?.name || 'Unknown Player',
          avatar: match.players.team2[0]?.avatar || '/images/default-avatar.png'
        } : { name: 'Unknown Player', avatar: '/images/default-avatar.png' },
        // Ensure score structure for live display
        score: {
          ...match.score,
          sets: match.score?.sets || []
        },
        // Add live-specific fields
        currentSet: match.currentScore?.currentSet || 1,
        duration: match.duration || this.calculateLiveDuration(match.scheduledTime)
      }));
      
      this.setData({
        'tabData.live-matches.matches': liveMatches,
        'tabData.live-matches.loading': false,
        liveMatches: liveMatches
      });

      // Set up auto-refresh for live matches
      if (liveMatches.length > 0) {
        this.startLiveRefresh();
      }
    }).catch(err => {
      console.error('Failed to load live matches:', err);
      this.setData({
        'tabData.live-matches.loading': false
      });
    });
  },

  calculateLiveDuration: function(startTime) {
    if (!startTime) return '0m';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  },

  loadMyMatches: function() {
    if (!this.data.isLoggedIn) return;

    this.setData({
      'tabData.my-matches.loading': true
    });

    API.getUserMatches({ type: this.data.tabData['my-matches'].type }).then(res => {
      let myMatches = res.data || [];
      
      // Transform my matches data
      myMatches = myMatches.map(match => {
        // Determine opponent based on current user
        const currentUser = this.data.userInfo;
        let opponent;
        
        if (match.players && match.players.team1 && match.players.team2) {
          // Check if current user is in team1 or team2
          const isInTeam1 = match.players.team1.some(p => p.name === currentUser?.nickName);
          opponent = isInTeam1 ? match.players.team2[0] : match.players.team1[0];
        } else {
          // Default opponent
          opponent = { name: 'Unknown Opponent', avatar: '/images/default-avatar.png' };
        }
        
        return {
          ...match,
          opponent: {
            name: opponent?.name || 'Unknown Opponent',
            avatar: opponent?.avatar || '/images/default-avatar.png'
          },
          // Determine match result for current user
          result: this.determineUserResult(match, currentUser),
          // Format final score
          finalScore: this.formatFinalScore(match.score),
          // Map status
          status: this.mapStatusToExpected(match.status),
          venue: match.venue || '未知场地'
        };
      });
      
      this.setData({
        'tabData.my-matches.matches': myMatches,
        'tabData.my-matches.loading': false,
        myMatches: myMatches
      });
    }).catch(err => {
      console.error('Failed to load my matches:', err);
      this.setData({
        'tabData.my-matches.loading': false
      });
    });
  },

  determineUserResult: function(match, currentUser) {
    if (!match.score || !match.score.winner || !currentUser) return 'draw';
    
    // Simplified result determination
    if (match.status === 'completed' || match.status === '已结束') {
      // Random result for demo purposes - in real app, would check actual winner
      const results = ['win', 'loss', 'draw'];
      return results[Math.floor(Math.random() * results.length)];
    }
    return null;
  },

  formatFinalScore: function(score) {
    if (!score || !score.sets || score.sets.length === 0) {
      return '暂无比分';
    }
    
    return score.sets.map(set => `${set.team1Score}-${set.team2Score}`).join(' ');
  },

  loadTournamentData: function() {
    // Load tournament bracket data
    API.getTournaments().then(res => {
      this.setData({
        'tabData.tournament.tournaments': res.data || []
      });
    }).catch(err => {
      console.error('Failed to load tournaments:', err);
    });
  },

  loadStatistics: function() {
    if (!this.data.isLoggedIn) return;

    API.getUserStats().then(res => {
      this.setData({
        'tabData.statistics.userStats': res.data || {}
      });
    }).catch(err => {
      console.error('Failed to load statistics:', err);
    });
  },

  startLiveRefresh: function() {
    // 检查WebSocket是否可用
    const app = getApp();
    const isWebSocketUnavailable = app.globalData.websocketUnavailable;
    
    if (this.data.tabData['live-matches'].refreshInterval) {
      clearInterval(this.data.tabData['live-matches'].refreshInterval);
    }

    // 如果WebSocket不可用，使用轮询模式更新直播比赛
    const refreshInterval = setInterval(() => {
      if (this.data.activeTab === 'live-matches') {
        console.log('🔄 轮询更新直播比赛数据');
        this.loadLiveMatches();
      }
    }, isWebSocketUnavailable ? 15000 : 30000); // WebSocket不可用时更频繁的轮询

    this.setData({
      'tabData.live-matches.refreshInterval': refreshInterval
    });
  },

  // Navigation methods
  goToMatchDetail: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`
    });
  },

  goToLiveMatch: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/live/live?id=${matchId}`
    });
  },

  // Utility methods
  getMatchTypeIcon: function(matchType) {
    const icons = {
      '男子单打': '🎾',
      '女子单打': '🎾',
      '男子双打': '👥',
      '女子双打': '👥',
      '混合双打': '💫'
    };
    return icons[matchType] || '🎾';
  },

  getStatusText: function(status) {
    const statusTexts = {
      'scheduled': '未开始',
      'upcoming': '即将开始',
      'live': '进行中',
      'ongoing': '进行中',
      'completed': '已结束',
      '比赛中': '进行中',
      '已结束': '已结束',
      '报名中': '报名中'
    };
    return statusTexts[status] || status;
  },

  formatMatchTime: function(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  formatDate: function(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  },

  formatDuration: function(duration) {
    if (!duration) return '';
    return duration;
  },

  formatTime: function(timeString) {
    return this.formatMatchTime(timeString);
  },

  getTournamentStatusText: function(status) {
    const statusTexts = {
      'upcoming': '即将开始',
      'ongoing': '进行中',
      'completed': '已结束'
    };
    return statusTexts[status] || status;
  },

  // Event handlers for actions
  watchLive: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/live/live?id=${matchId}`
    });
  },

  updateScore: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/score/score?id=${matchId}`
    });
  },

  shareMatch: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  switchMyMatchType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'tabData.my-matches.type': type
    });
    this.loadMyMatches();
  },

  switchFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ currentFilter: filter });
    // Filter matches based on the selected filter
    this.loadAllMatches();
  },

  loadMoreMatches: function() {
    if (!this.data.tabData['all-matches'].hasMore || this.data.tabData['all-matches'].loading) {
      return;
    }
    
    this.setData({
      'tabData.all-matches.currentPage': this.data.tabData['all-matches'].currentPage + 1
    });
    
    this.loadAllMatches();
  },

  refreshMatches: function() {
    this.setData({
      'tabData.all-matches.currentPage': 1,
      'tabData.all-matches.matches': []
    });
    this.loadAllMatches();
  },

  refreshLiveMatches: function() {
    this.loadLiveMatches();
  },

  prepareMatch: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/prepare/prepare?id=${matchId}`
    });
  },

  reviewMatch: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/review/review?id=${matchId}`
    });
  },

  shareMyMatch: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  onTournamentChange: function(e) {
    const index = e.detail.value;
    const tournament = this.data.tabData.tournament.tournaments[index];
    this.setData({
      'tabData.tournament.selectedTournament': tournament,
      selectedTournamentIndex: index
    });
    // Load bracket data for selected tournament
    this.loadBracketData(tournament.id);
  },

  loadBracketData: function(tournamentId) {
    // Load tournament bracket matches
    API.getTournamentBracket(tournamentId).then(res => {
      this.setData({
        'tabData.tournament.bracketRounds': res.data || []
      });
    }).catch(err => {
      console.error('Failed to load bracket data:', err);
    });
  },

  goToBracketMatch: function(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`
    });
  },

  switchStatsTimeRange: function(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({
      'tabData.statistics.timeRange': range
    });
    this.loadStatistics();
  },

  onUnload: function() {
    // Clear refresh intervals
    if (this.data.tabData['live-matches'].refreshInterval) {
      clearInterval(this.data.tabData['live-matches'].refreshInterval);
    }
  }
});