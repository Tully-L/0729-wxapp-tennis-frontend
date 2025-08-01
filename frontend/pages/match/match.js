// match.js - 比赛页面固定标签栏
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    // 新的分离式布局系统
    activeMatchTab: 'completed-ongoing', // 比赛数据区域的活跃标签
    matchStatusTabs: [
      { id: 'completed-ongoing', name: '已比赛/进行中', icon: '🎾', count: 0 },
      { id: 'upcoming', name: '未来比赛', icon: '📅', count: 0 }
    ],

    // 分类的比赛数据
    ongoingMatches: [],      // 进行中的比赛
    completedMatches: [],    // 已完成的比赛
    upcomingMatches: [],     // 未来的比赛

    // 火热报名数据
    hotRegistrations: [],    // 热门报名机会

    // Tab system (保留作为备用)
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

    // Enhanced Filter system
    quickFilters: [
      { id: 'all', name: '全部', icon: '📋', count: 0 },
      { id: 'live', name: '直播中', icon: '🔴', count: 0 },
      { id: 'today', name: '今天', icon: '📅', count: 0 },
      { id: 'singles', name: '单打', icon: '👤', count: 0 },
      { id: 'doubles', name: '双打', icon: '👥', count: 0 }
    ],
    currentFilter: 'all',

    // Advanced filter
    showAdvancedFilter: false,
    currentFilters: {},
    activeFilters: [],
    activeFiltersCount: 0,

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

    // Load event type statistics
    this.loadEventTypeStats();

    // Load initial data for new separated layout
    this.loadSeparatedLayoutData();

    // Load initial data (保留原有逻辑作为备用)
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
  loadAllMatches: function(isRefresh = false) {
    // 防止重复加载
    if (this.data.tabData['all-matches'].loading) {
      return;
    }

    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        'tabData.all-matches.currentPage': 1,
        'tabData.all-matches.hasMore': true
      });
    }

    this.setData({
      'tabData.all-matches.loading': true
    });

    const currentPage = this.data.tabData['all-matches'].currentPage;
    const params = {
      page: currentPage,
      limit: 15, // 减少每页数量以提高加载速度
      status: 'all',
      ...this.buildFilterParams() // 添加筛选参数
    };

    console.log('加载比赛数据，页码:', currentPage, '参数:', params);

    API.getMatches(params).then(res => {
      let matches = res.data || [];
      const pagination = res.pagination || {};

      // Transform matches for enhanced display
      matches = this.transformMatchData(matches);

      // Additional transformations for backward compatibility
      matches = matches.map(match => ({
        ...match,
        // Ensure player data structure matches WXML expectations (for backward compatibility)
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
      const newMatches = currentPage === 1 ? matches : [...currentMatches, ...matches];

      this.setData({
        'tabData.all-matches.matches': newMatches,
        'tabData.all-matches.loading': false,
        'tabData.all-matches.hasMore': pagination.page < pagination.pages,
        'tabData.all-matches.total': pagination.total || 0,
        matches: newMatches,
        loading: false,
        hasMore: pagination.page < pagination.pages
      });

      console.log(`加载完成，当前页: ${pagination.page}/${pagination.pages}，总数: ${pagination.total}`);
    }).catch(err => {
      console.error('Failed to load matches:', err);
      this.setData({
        'tabData.all-matches.loading': false,
        loading: false
      });

      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 构建筛选参数
  buildFilterParams: function() {
    const filters = this.data.currentFilters || {};
    const params = {};

    // 状态筛选
    if (this.data.currentFilter && this.data.currentFilter !== 'all') {
      switch (this.data.currentFilter) {
        case 'live':
          params.status = 'ongoing';
          break;
        case 'today':
          const today = new Date();
          params.dateRange = JSON.stringify({
            start: today.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          });
          break;
        case 'singles':
          params.eventType = 'singles';
          break;
        case 'doubles':
          params.eventType = 'doubles';
          break;
      }
    }

    // 高级筛选参数
    if (filters.eventType) params.eventType = filters.eventType;
    if (filters.region) params.region = filters.region;
    if (filters.player) params.player = filters.player;
    if (filters.startDate && filters.endDate) {
      params.dateRange = JSON.stringify({
        start: filters.startDate,
        end: filters.endDate
      });
    }

    return params;
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

  // Quick filter switching
  switchQuickFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    console.log('切换快速筛选:', filter);
    this.setData({
      currentFilter: filter,
      'tabData.all-matches.currentPage': 1,
      'tabData.all-matches.matches': [],
      'tabData.all-matches.hasMore': true
    });
    this.loadAllMatches(true);
  },

  // Show advanced filter
  showAdvancedFilter: function() {
    this.setData({ showAdvancedFilter: true });
  },

  // Hide advanced filter
  hideAdvancedFilter: function() {
    this.setData({ showAdvancedFilter: false });
  },

  // Handle filter change from advanced filter component
  onFilterChange: function(e) {
    const { filters, count } = e.detail;
    console.log('高级筛选变更:', filters);
    this.setData({
      currentFilters: filters,
      showAdvancedFilter: false,
      'tabData.all-matches.currentPage': 1,
      'tabData.all-matches.matches': [],
      'tabData.all-matches.hasMore': true
    });

    this.updateActiveFilters(filters);
    this.loadAllMatches(true);
  },

  // Update active filters display
  updateActiveFilters: function(filters) {
    const activeFilters = [];

    if (filters.eventType) {
      const eventTypeMap = {
        'mens_singles': '男子单打',
        'womens_singles': '女子单打',
        'mens_doubles': '男子双打',
        'womens_doubles': '女子双打',
        'mixed_doubles': '混合双打'
      };
      activeFilters.push({
        key: 'eventType',
        label: eventTypeMap[filters.eventType] || filters.eventType
      });
    }

    if (filters.status && filters.status !== 'all') {
      const statusMap = {
        'upcoming': '即将开始',
        'live': '进行中',
        'completed': '已结束',
        'registration': '报名中'
      };
      activeFilters.push({
        key: 'status',
        label: statusMap[filters.status] || filters.status
      });
    }

    if (filters.region) {
      activeFilters.push({
        key: 'region',
        label: filters.region
      });
    }

    if (filters.player) {
      activeFilters.push({
        key: 'player',
        label: `选手: ${filters.player}`
      });
    }

    if (filters.timeRange && filters.timeRange !== 'all') {
      const timeRangeMap = {
        'today': '今天',
        'tomorrow': '明天',
        'this_week': '本周',
        'next_week': '下周',
        'this_month': '本月',
        'custom': '自定义时间'
      };
      activeFilters.push({
        key: 'timeRange',
        label: timeRangeMap[filters.timeRange] || '自定义时间'
      });
    }

    this.setData({
      activeFilters: activeFilters,
      activeFiltersCount: activeFilters.length
    });
  },

  // Remove specific filter
  removeFilter: function(e) {
    const key = e.currentTarget.dataset.key;
    const filters = { ...this.data.currentFilters };

    if (key === 'timeRange') {
      filters.timeRange = 'all';
      filters.startDate = '';
      filters.endDate = '';
    } else {
      filters[key] = '';
    }

    this.setData({ currentFilters: filters });
    this.updateActiveFilters(filters);
    this.loadAllMatches();
  },

  // Clear all filters
  clearAllFilters: function() {
    const emptyFilters = {
      eventType: '',
      status: '',
      region: '',
      player: '',
      timeRange: 'all',
      startDate: '',
      endDate: ''
    };

    console.log('清除所有筛选');
    this.setData({
      currentFilters: emptyFilters,
      activeFilters: [],
      activeFiltersCount: 0,
      currentFilter: 'all',
      'tabData.all-matches.currentPage': 1,
      'tabData.all-matches.matches': [],
      'tabData.all-matches.hasMore': true
    });
    this.loadAllMatches(true);
  },

  // Load event type statistics
  loadEventTypeStats: async function() {
    try {
      const res = await API.request({
        url: '/matches/event-type-stats',
        method: 'GET'
      });

      if (res.success) {
        // Update quick filters with counts
        const quickFilters = this.data.quickFilters.map(filter => {
          if (filter.id === 'singles') {
            const mensCount = res.data.mens_singles?.count || 0;
            const womensCount = res.data.womens_singles?.count || 0;
            return { ...filter, count: mensCount + womensCount };
          } else if (filter.id === 'doubles') {
            const mensCount = res.data.mens_doubles?.count || 0;
            const womensCount = res.data.womens_doubles?.count || 0;
            const mixedCount = res.data.mixed_doubles?.count || 0;
            return { ...filter, count: mensCount + womensCount + mixedCount };
          }
          return filter;
        });

        this.setData({ quickFilters });
      }
    } catch (error) {
      console.error('加载赛事分类统计失败:', error);
    }
  },

  // Get team score for display
  getTeamScore: function(match, team) {
    if (!match.scoreSummary) {
      return match.score?.[team === 'team1' ? 'player1' : 'player2'] || 0;
    }

    // Calculate total sets won
    let setsWon = 0;
    if (match.scoreSummary.sets) {
      match.scoreSummary.sets.forEach(set => {
        if (set[`${team}Score`] > set[`${team === 'team1' ? 'team2' : 'team1'}Score`]) {
          setsWon++;
        }
      });
    }

    return setsWon;
  },

  // Handle player tap event
  onPlayerTap: function(e) {
    const { player, format } = e.detail;
    console.log('Player tapped:', player, format);

    // Navigate to player profile or show player details
    wx.navigateTo({
      url: `/pages/player/player-detail?id=${player.id}&format=${format}`
    });
  },

  // Transform match data for enhanced display
  transformMatchData: function(matches) {
    return matches.map(match => {
      // Ensure players structure exists
      if (!match.players) {
        match.players = {
          team1: match.player1 ? [match.player1] : [],
          team2: match.player2 ? [match.player2] : []
        };
      }

      // Determine format based on eventType
      if (!match.format) {
        match.format = match.eventType?.includes('双打') ? 'doubles' : 'singles';
      }

      // Ensure ranking information
      match.players.team1.forEach(player => {
        if (!player.ranking && player.rank) {
          player.ranking = player.rank;
        }
      });

      match.players.team2.forEach(player => {
        if (!player.ranking && player.rank) {
          player.ranking = player.rank;
        }
      });

      return match;
    });
  },

  loadMoreMatches: function() {
    if (!this.data.tabData['all-matches'].hasMore || this.data.tabData['all-matches'].loading) {
      console.log('无法加载更多：', {
        hasMore: this.data.tabData['all-matches'].hasMore,
        loading: this.data.tabData['all-matches'].loading
      });
      return;
    }

    console.log('加载更多比赛，当前页码:', this.data.tabData['all-matches'].currentPage);

    this.setData({
      'tabData.all-matches.currentPage': this.data.tabData['all-matches'].currentPage + 1
    });

    this.loadAllMatches();
  },

  refreshMatches: function() {
    console.log('刷新比赛列表');
    this.setData({
      'tabData.all-matches.currentPage': 1,
      'tabData.all-matches.matches': [],
      'tabData.all-matches.hasMore': true
    });
    this.loadAllMatches(true);
  },

  // 触底加载更多
  onReachBottom: function() {
    if (this.data.activeTab === 'all-matches') {
      this.loadMoreMatches();
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    if (this.data.activeTab === 'all-matches') {
      this.refreshMatches();
      setTimeout(() => {
        wx.stopPullDownRefresh();
      }, 1000);
    } else {
      wx.stopPullDownRefresh();
    }
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

  // 新的分离式布局方法

  // 加载分离式布局数据
  loadSeparatedLayoutData: function() {
    this.loadMatchDataByStatus();
    this.loadHotRegistrations();
  },

  // 切换比赛数据标签
  switchMatchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeMatchTab: tab
    });

    // 触发触觉反馈
    this.triggerHapticFeedback();
  },

  // 按状态加载比赛数据
  loadMatchDataByStatus: async function() {
    try {
      // 加载进行中的比赛
      const ongoingResponse = await API.getMatches({
        status: 'ongoing',
        page: 1,
        limit: 10
      });

      // 加载已完成的比赛
      const completedResponse = await API.getMatches({
        status: 'completed',
        page: 1,
        limit: 20
      });

      // 加载未来的比赛
      const upcomingResponse = await API.getMatches({
        status: 'upcoming',
        page: 1,
        limit: 15
      });

      // 处理数据
      const ongoingMatches = this.processMatchData(ongoingResponse.data || []);
      const completedMatches = this.processMatchData(completedResponse.data || []);
      const upcomingMatches = this.processMatchData(upcomingResponse.data || []);

      // 更新标签计数
      const matchStatusTabs = this.data.matchStatusTabs.map(tab => {
        if (tab.id === 'completed-ongoing') {
          tab.count = ongoingMatches.length + completedMatches.length;
        } else if (tab.id === 'upcoming') {
          tab.count = upcomingMatches.length;
        }
        return tab;
      });

      this.setData({
        ongoingMatches: ongoingMatches,
        completedMatches: completedMatches,
        upcomingMatches: upcomingMatches,
        matchStatusTabs: matchStatusTabs
      });

    } catch (error) {
      console.error('加载比赛数据失败:', error);
      wx.showToast({
        title: '加载比赛数据失败',
        icon: 'none'
      });
    }
  },

  // 加载火热报名数据
  loadHotRegistrations: async function() {
    try {
      const response = await API.getHotRegistrations({
        limit: 6,
        priority: 'high'
      });

      const hotRegistrations = this.processRegistrationData(response.data || []);

      this.setData({
        hotRegistrations: hotRegistrations
      });

    } catch (error) {
      console.error('加载报名数据失败:', error);
      // 使用模拟数据作为备用
      this.setData({
        hotRegistrations: this.getMockRegistrationData()
      });
    }
  },

  // 处理比赛数据
  processMatchData: function(matches) {
    return matches.map(match => {
      // 添加状态相关的显示信息
      match.statusText = this.getStatusText(match.status);
      match.statusClass = this.getMatchStatusClass(match.status);

      // 格式化时间
      match.formattedTime = this.formatMatchTime(match.scheduledTime);
      match.formattedDate = this.formatMatchDate(match.scheduledTime);

      return match;
    });
  },

  // 处理报名数据
  processRegistrationData: function(registrations) {
    return registrations.map(reg => {
      // 计算报名状态
      const now = new Date();
      const deadline = new Date(reg.registrationDeadline);
      const eventDate = new Date(reg.eventDate);

      // 设置优先级标识
      if (reg.featured) {
        reg.priority = 'featured';
        reg.badgeText = '精选';
      } else if (deadline - now < 7 * 24 * 60 * 60 * 1000) { // 7天内截止
        reg.priority = 'urgent';
        reg.badgeText = '即将截止';
      } else {
        reg.priority = 'normal';
        reg.badgeText = '热门';
      }

      // 设置报名状态
      if (now > deadline) {
        reg.registrationStatus = '报名已截止';
        reg.canRegister = false;
        reg.registerButtonText = '已截止';
      } else if (reg.participantCount >= reg.maxParticipants) {
        reg.registrationStatus = '名额已满';
        reg.canRegister = false;
        reg.registerButtonText = '已满员';
      } else {
        reg.registrationStatus = '报名中';
        reg.canRegister = true;
        reg.registerButtonText = '立即报名';
      }

      return reg;
    });
  },

  // 获取模拟报名数据
  getMockRegistrationData: function() {
    return [
      {
        _id: 'reg_1',
        name: '2024年春季网球公开赛',
        eventType: '男子单打',
        venue: '国家网球中心',
        eventDate: '2024-04-15',
        registrationDeadline: '2024-04-01',
        participantCount: 24,
        maxParticipants: 32,
        price: 200,
        featured: true,
        priority: 'featured',
        badgeText: '精选',
        registrationStatus: '报名中',
        canRegister: true,
        registerButtonText: '立即报名'
      },
      {
        _id: 'reg_2',
        name: '城市业余网球联赛',
        eventType: '女子双打',
        venue: '市体育中心',
        eventDate: '2024-04-20',
        registrationDeadline: '2024-03-30',
        participantCount: 16,
        maxParticipants: 24,
        price: 150,
        featured: false,
        priority: 'urgent',
        badgeText: '即将截止',
        registrationStatus: '报名中',
        canRegister: true,
        registerButtonText: '立即报名'
      }
    ];
  },

  // 显示更多报名机会
  showMoreRegistrations: function() {
    wx.navigateTo({
      url: '/pages/events/events'
    });
  },

  // 跳转到赛事详情
  goToEventDetail: function(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?id=${eventId}`
    });
  },

  // 格式化赛事日期
  formatEventDate: function(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 格式化报名截止时间
  formatDeadline: function(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return '已截止';
    } else if (diffDays === 0) {
      return '今日截止';
    } else if (diffDays === 1) {
      return '明日截止';
    } else if (diffDays <= 7) {
      return `${diffDays}天后截止`;
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    }
  },

  onUnload: function() {
    // Clear refresh intervals
    if (this.data.tabData['live-matches'].refreshInterval) {
      clearInterval(this.data.tabData['live-matches'].refreshInterval);
    }
  }
});