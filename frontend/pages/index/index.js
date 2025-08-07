// index.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth');

Page({
  data: {
    // User info
    userInfo: null,
    isLoggedIn: false,
    
    // Tab navigation
    tabs: ['进行中', '已完成', '即将开始'],
    activeTab: 2,  // 默认显示"即将开始"(报名中)，因为测试数据中这类比赛最多
    
    // Match data
    matches: [],
    liveMatches: [],
    events: [],  // 首页赛事数据
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    
    // Enhanced filter options
    filters: {
      eventType: '',
      player: '',
      region: '',
      venue: '',
      dateRange: {
        start: '',
        end: ''
      }
    },
    showFilter: false,
    showSearch: false,
    searchQuery: '',
    searchResults: [],
    searchLoading: false,
    
    eventTypes: [
      { id: '', name: '全部类型' },
      { id: '男子单打', name: '男子单打' },
      { id: '女子单打', name: '女子单打' },
      { id: '男子双打', name: '男子双打' },
      { id: '女子双打', name: '女子双打' },
      { id: '混合双打', name: '混合双打' }
    ],
    
    regions: [
      { id: '', name: '全部地区' },
      { id: '北京', name: '北京' },
      { id: '上海', name: '上海' },
      { id: '广州', name: '广州' },
      { id: '深圳', name: '深圳' },
      { id: '杭州', name: '杭州' }
    ],
    
    // Status mapping - 修改为中文状态值以匹配后端数据库
    statusMap: {
      0: '比赛中',
      1: '已结束',
      2: '报名中'
    },
    
    // Statistics
    matchStats: null,
    statsLoading: false
  },
  
  onLoad: function() {
    // Initialize user info (不强制登录，允许游客浏览)
    this.initUserInfo();
    
    // Try to load eventTypes from cache
    const cachedEventTypes = wx.getStorageSync('eventTypes');
    if (cachedEventTypes) {
      this.setData({
        eventTypes: cachedEventTypes
      });
    } else {
      // If not in cache, save default eventTypes to cache
      wx.setStorageSync('eventTypes', this.data.eventTypes);
    }

    // 检查WebSocket状态
    const app = getApp();
    if (app.globalData.websocketUnavailable) {
      console.log('ℹ️ WebSocket服务不可用，使用轮询模式获取实时数据');
    }

    // Load initial data
    this.loadMatches();
    this.loadMatchStats();
  },
  
  onShow: function() {
    // Refresh user info when page shows
    this.initUserInfo();
  },
  
  // Initialize user info
  initUserInfo: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: !!token
    });
  },
  
  onPullDownRefresh: function() {
    this.setData({
      matches: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadMatches().then(() => {
      wx.stopPullDownRefresh();
    });
  },
  
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreMatches();
    }
  },
  
  // Switch tabs
  switchTab: function(e) {
    const index = e.currentTarget.dataset.index;
    
    if (index !== this.data.activeTab) {
      this.setData({
        activeTab: index,
        matches: [],
        currentPage: 1,
        hasMore: true
      });
      
      this.loadMatches();
    }
  },
  
  // Load matches based on current tab and filters
  loadMatches: function() {
    if (this.data.loading) return Promise.resolve();

    this.setData({ loading: true });

    // 首页显示最新的赛事数据，不按状态筛选
    const params = {
      page: 1,
      limit: 10,  // 首页只显示前10个最新赛事
      sortBy: 'start_time',
      sortOrder: 'asc'
    };

    return API.getEvents(params)
      .then(res => {
        console.log('获取到的赛事数据:', res);

        // 确保数据格式正确
        let events = [];
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            events = res.data;
          } else if (Array.isArray(res.data.events)) {
            events = res.data.events;
          } else {
            console.warn('API返回的数据格式不正确:', res.data);
            events = [];
          }
        }

        // 为每个赛事添加中文类型显示
        events = events.map(event => {
          return {
            ...event,
            eventTypeText: this.getEventTypeText(event.ext_info?.eventType || event.eventType || event.category)
          };
        });

        this.setData({
          events: events,
          hasMore: res.pagination ? (res.pagination.page < res.pagination.pages) : false,
          loading: false
        });
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        this.setData({ loading: false });
      });
  },

  // 获取赛事类型中文显示
  getEventTypeText: function(eventType) {
    const typeMap = {
      'mens_singles': '男子单打',
      'womens_singles': '女子单打',
      'mens_doubles': '男子双打',
      'womens_doubles': '女子双打',
      'mixed_doubles': '混合双打',
      'tennis': '网球'
    };
    return typeMap[eventType] || eventType || '网球';
  },

  // Load more matches (pagination)
  loadMoreMatches: function() {
    if (this.data.loading) return;
    
    this.setData({
      currentPage: this.data.currentPage + 1,
      loading: true
    });
    
    const params = {
      page: this.data.currentPage,
      limit: this.data.pageSize,  // 修改为后端期望的参数名
      status: this.data.statusMap[this.data.activeTab],
      ...this.data.filters
    };
    
    API.getEvents(params)
      .then(res => {
        // 确保数据格式正确
        let events = [];
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            events = res.data;
          } else if (Array.isArray(res.data.events)) {
            events = res.data.events;
          } else {
            console.warn('API返回的数据格式不正确:', res.data);
            events = [];
          }
        }

        if (events.length > 0) {
          // 将新数据转换为分组格式
          const newGroups = this.groupMatchesByDate(events);

          // 合并现有分组和新分组
          const existingGroups = this.data.matches;
          const mergedGroups = this.mergeMatchGroups(existingGroups, newGroups);

          this.setData({
            matches: mergedGroups,
            hasMore: events.length === this.data.pageSize,
            loading: false
          });
        } else {
          this.setData({
            hasMore: false,
            loading: false
          });
        }
      })
      .catch(err => {
        console.error('Failed to load more events:', err);
        this.setData({ loading: false });
      });
  },
  
  // Toggle filter panel
  toggleFilter: function() {
    this.setData({
      showFilter: !this.data.showFilter
    });
  },
  
  // Apply filters
  applyFilter: function(e) {
    const { field, value } = e.currentTarget.dataset;
    
    this.setData({
      [`filters.${field}`]: value,
      matches: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadMatches();
    this.toggleFilter();
  },
  
  // Reset filters
  resetFilter: function() {
    this.setData({
      filters: {
        eventType: '',
        player: '',
        region: '',
        dateRange: {
          start: '',
          end: ''
        }
      },
      matches: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadMatches();
    this.toggleFilter();
  },
  
  // Input handlers
  inputPlayer: function(e) {
    this.setData({
      'filters.player': e.detail.value
    });
  },
  
  inputRegion: function(e) {
    this.setData({
      'filters.region': e.detail.value
    });
  },
  
  // Navigate to match detail page
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },
  
  // Register for match
  registerMatch: function(e) {
    const id = e.currentTarget.dataset.id;
    const match = this.data.matches.find(m => m._id === id);
    
    if (!match) {
      wx.showToast({
        title: '比赛信息不存在',
        icon: 'none'
      });
      return;
    }
    
    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('token');
    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/user-related/login/login'
        });
      }, 1500);
      return;
    }
    
    // 检查比赛状态
    if (match.status !== 'upcoming') {
      wx.showToast({
        title: '该比赛不可报名',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认报名',
      content: `确定要报名参加 ${match.eventType} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processRegistration(id, match);
        }
      }
    });
  },
  
  // 处理报名流程
  processRegistration: function(matchId, match) {
    wx.showLoading({
      title: '报名中...',
      mask: true
    });
    
    // 模拟报名API调用
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟报名成功
      wx.showToast({
        title: '报名成功',
        icon: 'success'
      });
      
      // 更新本地数据
      const updatedMatches = this.data.matches.map(m => {
        if (m._id === matchId) {
          return {
            ...m,
            isRegistered: true,
            registrationCount: (m.registrationCount || 0) + 1
          };
        }
        return m;
      });
      
      this.setData({
        matches: updatedMatches
      });
      
      // 显示报名成功详情
      setTimeout(() => {
        wx.showModal({
          title: '报名成功',
          content: `您已成功报名 ${match.eventType}，请关注比赛通知。`,
          showCancel: false,
          confirmText: '知道了'
        });
      }, 1500);
    }, 2000);
  },
  
  // Load live matches
  loadLiveMatches: function() {
    API.getLiveMatches({ limit: 5 }).then(res => {
      if (res.success) {
        this.setData({
          liveMatches: res.data || []
        });
      }
    }).catch(err => {
      console.error('获取实时比赛失败:', err);
    });
  },
  
  // Load event statistics
  loadMatchStats: function() {
    this.setData({ statsLoading: true });
    
    API.getEventStats().then(res => {
      if (res.success) {
        this.setData({
          matchStats: res.data,
          statsLoading: false
        });
      } else {
        this.setData({ statsLoading: false });
      }
    }).catch(err => {
      console.error('获取赛事统计失败:', err);
      this.setData({ statsLoading: false });
    });
  },
  
  // Toggle search
  toggleSearch: function() {
    this.setData({
      showSearch: !this.data.showSearch
    });
    
    if (!this.data.showSearch) {
      this.onClearSearch();
    }
  },
  
  // Search functionality - Enhanced
  onSearchInput: function(e) {
    const query = e.detail.value;
    this.setData({
      searchQuery: query
    });
    
    // 实时搜索（防抖）
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    if (query.trim().length >= 2) {
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query.trim());
      }, 500);
    } else {
      this.setData({
        searchResults: []
      });
    }
  },
  
  performSearch: function(query) {
    this.setData({ searchLoading: true });
    
    API.searchEvents({
      query: query,
      limit: 10
    }).then(res => {
      if (res.success) {
        this.setData({
          searchResults: res.data || [],
          searchLoading: false
        });
      } else {
        this.setData({ searchLoading: false });
      }
    }).catch(err => {
      console.error('搜索赛事失败:', err);
      this.setData({ searchLoading: false });
    });
  },
  
  onSearch: function() {
    const query = this.data.searchQuery.trim();
    if (!query) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.performSearch(query);
  },
  
  // Clear search
  onClearSearch: function() {
    this.setData({
      searchQuery: '',
      searchResults: [],
      showSearch: false
    });
  },
  
  // Join as spectator
  joinAsSpectator: function(e) {
    const matchId = e.currentTarget.dataset.id;
    
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
    
    wx.showLoading({ title: '加入中...' });
    
    API.addSpectator(matchId).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '成功加入观众',
          icon: 'success'
        });
        
        // 更新本地数据
        const matches = this.data.matches.map(dateGroup => ({
          ...dateGroup,
          matches: dateGroup.matches.map(match => {
            if (match._id === matchId) {
              return {
                ...match,
                spectators: [...(match.spectators || []), this.data.userInfo],
                matchStats: {
                  ...match.matchStats,
                  spectatorCount: (match.matchStats?.spectatorCount || 0) + 1
                }
              };
            }
            return match;
          })
        }));
        
        this.setData({ matches });
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
  
  // View match stats
  viewMatchStats: function() {
    if (!this.data.matchStats) {
      this.loadMatchStats();
      return;
    }
    
    const stats = this.data.matchStats;
    const statsText = `比赛统计:\n总比赛: ${stats.total}场\n进行中: ${stats.live}场\n已完成: ${stats.completed}场\n即将开始: ${stats.upcoming}场`;
    
    wx.showModal({
      title: '比赛统计',
      content: statsText,
      showCancel: false,
      confirmText: '确定'
    });
  },
  
  // Go to live matches
  goToLiveMatches: function() {
    this.setData({
      activeTab: 0 // 进行中
    });
    this.loadMatches();
  },
  
  // Group matches by date
  groupMatchesByDate: function(matches) {
    if (!matches || matches.length === 0) return [];

    const groups = {};
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    matches.forEach(match => {
      // 确保日期格式兼容iOS，处理无效日期
      let matchDate;
      if (!match.scheduledTime) {
        // 如果没有时间，使用当前时间
        matchDate = new Date();
      } else {
        matchDate = new Date(match.scheduledTime);
        // 检查日期是否有效
        if (isNaN(matchDate.getTime())) {
          console.warn('Invalid date in match:', match.scheduledTime);
          matchDate = new Date(); // 使用当前时间作为回退
        }
      }
      // 使用ISO格式的日期作为key，避免iOS兼容性问题
      const dateKey = matchDate.toISOString().split('T')[0]; // 格式: "2024-07-29"

      if (!groups[dateKey]) {
        let dateDisplay;
        if (matchDate.toDateString() === today.toDateString()) {
          dateDisplay = '今天';
        } else if (matchDate.toDateString() === tomorrow.toDateString()) {
          dateDisplay = '明天';
        } else {
          dateDisplay = `${matchDate.getMonth() + 1}月${matchDate.getDate()}日`;
        }

        groups[dateKey] = {
          date: dateKey,
          dateDisplay: dateDisplay,
          matches: []
        };
      }

      groups[dateKey].matches.push(match);
    });

    // 转换为数组并按日期排序
    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  // Merge match groups for pagination
  mergeMatchGroups: function(existingGroups, newGroups) {
    const merged = [...existingGroups];

    newGroups.forEach(newGroup => {
      const existingIndex = merged.findIndex(group => group.date === newGroup.date);
      if (existingIndex >= 0) {
        // 合并同一日期的比赛
        merged[existingIndex].matches = [...merged[existingIndex].matches, ...newGroup.matches];
      } else {
        // 添加新日期的分组
        merged.push(newGroup);
      }
    });

    // 重新排序
    return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  // Format match time
  formatMatchTime: function(timeString) {
    if (!timeString) return '';

    const date = new Date(timeString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}天后`;
    } else if (diffHours > 0) {
      return `${diffHours}小时后`;
    } else if (diffHours === 0) {
      return '即将开始';
    } else {
      return '已开始';
    }
  },
  
  // Format score display
  formatScore: function(match) {
    if (!match.scoreSummary || !match.scoreSummary.sets) {
      return '暂无比分';
    }
    
    return match.scoreSummary.sets.map(set => {
      let scoreStr = `${set.team1Score}-${set.team2Score}`;
      if (set.tiebreak) {
        scoreStr += `(${set.tiebreak.team1Score}-${set.tiebreak.team2Score})`;
      }
      return scoreStr;
    }).join(' ');
  },

  // 新增的事件处理函数
  // 功能导航事件
  goToLeagueIntro() {
    wx.navigateTo({
      url: '/pages/league/intro'
    });
  },

  goToBrandEvents() {
    wx.navigateTo({
      url: '/pages/brand-events/brand-events'
    });
  },

  goToPlayerRanking() {
    wx.navigateTo({
      url: '/pages/ranking/ranking'
    });
  },

  goToPointsRanking() {
    wx.navigateTo({
      url: '/pages/points-ranking/points-ranking'
    });
  },

  // 通知栏事件
  closeNotice() {
    wx.showToast({
      title: '通知已关闭',
      icon: 'success'
    });
  },

  // 赛事卡片点击事件
  goToEventDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/event/detail?id=${id}`
      });
    } else {
      wx.showToast({
        title: '赛事信息不完整',
        icon: 'none'
      });
    }
  },

  // 筛选事件
  filterByType(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({
      title: `筛选类型: ${type}`,
      icon: 'none'
    });
  },

  confirmFilter() {
    this.setData({
      showFilter: false
    });
    wx.showToast({
      title: '筛选条件已应用',
      icon: 'success'
    });
  }
});
 