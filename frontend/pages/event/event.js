// event.js - 增强版赛事管理界面
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    // Tab system
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部', icon: '📋', badge: 0 },
      { id: 'search', name: '搜索', icon: '🔍', badge: 0 },
      { id: 'create', name: '创建', icon: '➕', badge: 0, requiresAuth: true },
      { id: 'my', name: '我的', icon: '👤', badge: 0, requiresAuth: true },
      { id: 'popular', name: '热门', icon: '🔥', badge: 0 }
    ],
    
    // Tab-specific data storage
    tabData: {
      all: {
        events: [],
        loading: false,
        hasMore: true,
        currentPage: 1,
        scrollTop: 0
      },
      search: {
        query: '',
        results: [],
        loading: false,
        hasMore: true,
        currentPage: 1,
        scrollTop: 0,
        searchHistory: []
      },
      create: {
        formData: {},
        step: 1,
        scrollTop: 0
      },
      my: {
        events: [],
        loading: false,
        hasMore: true,
        currentPage: 1,
        scrollTop: 0,
        type: 'all' // all, organized, participated
      },
      popular: {
        events: [],
        loading: false,
        hasMore: true,
        currentPage: 1,
        scrollTop: 0,
        timeRange: '7d'
      }
    },
    
    // Legacy data (for backward compatibility)
    events: [],
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    loading: false,
    
    // Filter options
    filters: {
      eventType: '',
      region: '',
      dateRange: {
        start: '',
        end: ''
      }
    },
    showFilter: false,
    eventTypes: [
      { id: '', name: '全部类型' },
      { id: 'mens_singles', name: '男子单打' },
      { id: 'womens_singles', name: '女子单打' },
      { id: 'mens_doubles', name: '男子双打' },
      { id: 'womens_doubles', name: '女子双打' },
      { id: 'mixed_doubles', name: '混合双打' }
    ],
    
    // User info
    userInfo: null,
    isLoggedIn: false,
    
    // Enhanced features
    searchQuery: '',
    showSearch: false,
    sortBy: 'eventDate',
    sortOrder: 'asc',
    viewMode: 'list', // list, grid
    
    
    
    
    // Status options
    statusOptions: [
      { id: '', name: '全部状态' },
      { id: 'registration', name: '报名中' },
      { id: 'upcoming', name: '即将开始' },
      { id: 'ongoing', name: '进行中' },
      { id: 'completed', name: '已结束' },
      { id: 'cancelled', name: '已取消' }
    ],

    // Component states
    loading: false,
    error: ''
  },
  
  onLoad: function() {
    // Check login status
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    });
    
    // Clear stored events to force reload of new test data (temporary for testing)
    try {
      wx.removeStorageSync('events');
    } catch (e) {
      // Ignore error
    }
    
    // Initialize tab system
    this.initTabSystem();
    
    // Initialize touch and swipe gestures
    this.initTouchGestures();
    
    // Load initial tab data
    this.loadTabData(this.data.activeTab);
  },
  
  onPullDownRefresh: function() {
    this.setData({
      events: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadEvents().then(() => {
      wx.stopPullDownRefresh();
    });
  },
  
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreEvents();
    }
  },
  
  // Load events
  loadEvents: function() {
    if (this.data.loading) return Promise.resolve();
    
    this.setData({ loading: true });
    
    const params = {
      page: this.data.currentPage,
      limit: this.data.pageSize,  // 修改为后端期望的参数名
      ...this.data.filters
    };
    
    return API.getEvents(params)
      .then(res => {
        this.setData({
          events: res.data,
          hasMore: res.data.length === this.data.pageSize,
          loading: false
        });
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        this.setData({ loading: false });
      });
  },
  
  // Load more events (pagination)
  loadMoreEvents: function() {
    if (this.data.loading) return;
    
    this.setData({
      currentPage: this.data.currentPage + 1,
      loading: true
    });
    
    const params = {
      page: this.data.currentPage,
      limit: this.data.pageSize,  // 修改为后端期望的参数名
      ...this.data.filters
    };
    
    API.getEvents(params)
      .then(res => {
        if (res.data.length > 0) {
          this.setData({
            events: [...this.data.events, ...res.data],
            hasMore: res.data.length === this.data.pageSize,
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
      events: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadEvents();
    this.toggleFilter();
  },
  
  // Reset filters
  resetFilter: function() {
    this.setData({
      filters: {
        eventType: '',
        region: '',
        dateRange: {
          start: '',
          end: ''
        }
      },
      events: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadEvents();
    this.toggleFilter();
  },
  
  // Navigate to event detail page
  goToEventDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${id}`
    });
  },
  
  // Input handlers
  inputRegion: function(e) {
    this.setData({
      'filters.region': e.detail.value
    });
  },
  
  startDateChange: function(e) {
    this.setData({
      'filters.dateRange.start': e.detail.value
    });
  },
  
  endDateChange: function(e) {
    this.setData({
      'filters.dateRange.end': e.detail.value
    });
  },
  
  // Create new event
  createEvent: function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        auth.goToLogin();
      }, 1500);
      return;
    }
    
    wx.navigateTo({
      url: '/pages/user-related/event-create/event-create'
    });
  },
  
  // Simulate payment for event registration
  makePayment: function(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.showLoading({
      title: '支付中...',
      mask: true
    });

    // Simulate API call for payment
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '支付成功',
        icon: 'success',
        duration: 2000
      });
      console.log(`Payment made for event: ${eventId}`);
      // In a real application, you would navigate to a success page or refresh event status
    }, 2000);
  },
  
  // Register for event
  registerEvent: function(e) {
    const id = e.currentTarget.dataset.id;
    const event = this.data.events.find(ev => ev._id === id);
    
    if (!event) {
      wx.showToast({
        title: '赛事信息不存在',
        icon: 'none'
      });
      return;
    }
    
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        auth.goToLogin();
      }, 1500);
      return;
    }
    
    // 检查赛事状态
    if (event.status !== 'registration') {
      wx.showToast({
        title: '该赛事不在报名期',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认报名',
      content: `确定要报名参加 ${event.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processEventRegistration(id, event);
        }
      }
    });
  },
  
  // 处理赛事报名流程
  processEventRegistration: function(eventId, event) {
    wx.showLoading({
      title: '报名中...',
      mask: true
    });
    
    API.registerForEvent(eventId).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '报名成功',
          icon: 'success'
        });
        
        // 更新本地数据
        const updatedEvents = this.data.events.map(ev => {
          if (ev._id === eventId) {
            return {
              ...ev,
              isRegistered: true,
              currentParticipants: (ev.currentParticipants || 0) + 1
            };
          }
          return ev;
        });
        
        this.setData({
          events: updatedEvents
        });
        
        // 显示报名成功详情
        setTimeout(() => {
          wx.showModal({
            title: '报名成功',
            content: `您已成功报名 ${event.name}，请关注赛事通知和缴费信息。`,
            showCancel: false,
            confirmText: '知道了'
          });
        }, 1500);
      } else {
        wx.showToast({
          title: res.message || '报名失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('报名失败:', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
  },

  // 搜索功能
  toggleSearch: function() {
    this.setData({
      showSearch: !this.data.showSearch
    });
    
    if (!this.data.showSearch) {
      this.setData({
        searchQuery: ''
      });
      this.searchEvents();
    }
  },

  onSearchInput: function(e) {
    this.setData({
      searchQuery: e.detail.value
    });
  },

  searchEvents: function() {
    this.setData({
      events: [],
      currentPage: 1,
      hasMore: true
    });

    const params = {
      query: this.data.searchQuery,
      page: 1,
      limit: this.data.pageSize,
      ...this.data.filters,
      sortBy: this.data.sortBy,
      sortOrder: this.data.sortOrder
    };

    this.setData({ loading: true });

    API.searchEvents(params).then(res => {
      this.setData({
        events: res.data.events || [],
        hasMore: res.data.pagination.pages > 1,
        loading: false
      });
    }).catch(err => {
      console.error('搜索赛事失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    });
  },

  // 排序功能
  changeSortBy: function(e) {
    const sortBy = e.currentTarget.dataset.sort;
    const sortOrder = this.data.sortBy === sortBy && this.data.sortOrder === 'asc' ? 'desc' : 'asc';
    
    this.setData({
      sortBy: sortBy,
      sortOrder: sortOrder,
      events: [],
      currentPage: 1,
      hasMore: true
    });

    this.loadEvents();
  },

  // 切换视图模式
  toggleViewMode: function() {
    this.setData({
      viewMode: this.data.viewMode === 'list' ? 'grid' : 'list'
    });
  },





  // 取消报名
  cancelRegistration: function(e) {
    const eventId = e.currentTarget.dataset.id;
    const event = this.data.events.find(ev => ev._id === eventId);

    if (!event) return;

    wx.showModal({
      title: '确认取消报名',
      content: `确定要取消报名 ${event.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processCancelRegistration(eventId);
        }
      }
    });
  },

  processCancelRegistration: function(eventId) {
    wx.showLoading({
      title: '取消报名中...',
      mask: true
    });

    API.cancelRegistration(eventId).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '取消报名成功',
          icon: 'success'
        });
        
        // 更新本地数据
        const updatedEvents = this.data.events.map(ev => {
          if (ev._id === eventId) {
            return {
              ...ev,
              isRegistered: false,
              currentParticipants: Math.max(0, (ev.currentParticipants || 1) - 1)
            };
          }
          return ev;
        });
        
        this.setData({
          events: updatedEvents
        });
      } else {
        wx.showToast({
          title: res.message || '取消报名失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('取消报名失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 分享赛事
  shareEvent: function(e) {
    const eventId = e.currentTarget.dataset.id;
    const event = this.data.events.find(ev => ev._id === eventId);

    if (!event) return;

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 页面分享
  onShareAppMessage: function(res) {
    if (res.from === 'button') {
      const eventId = res.target.dataset.id;
      const event = this.data.events.find(ev => ev._id === eventId);
      
      if (event) {
        return {
          title: `${event.name} - 网球赛事报名`,
          path: `/pages/event/detail?id=${eventId}`,
          imageUrl: event.coverImage || '../../images/logo.png'
        };
      }
    }
    
    return {
      title: '网球热 - 发现精彩赛事',
      path: '/pages/event/event',
      imageUrl: '../../images/logo.png'
    };
  },

  // Tab system methods
  initTabSystem: function() {
    // Initialize tab system with user authentication check
    const tabs = this.data.tabs.map(tab => {
      if (tab.requiresAuth && !this.data.isLoggedIn) {
        return { ...tab, disabled: true };
      }
      return tab;
    });
    
    this.setData({ tabs });
    
    // Set up scroll position tracking
    this.scrollPositions = {};
    this.data.tabs.forEach(tab => {
      this.scrollPositions[tab.id] = 0;
    });
  },

  // Simple button navigation handler
  onButtonNavClick: function(e) {
    const tabId = e.currentTarget.dataset.tabId;
    const previousTab = this.data.activeTab;
    
    // Prevent clicking the same tab
    if (tabId === this.data.activeTab) {
      return;
    }
    
    // Check if user needs login for auth-required tabs
    const tab = this.data.tabs.find(t => t.id === tabId);
    if (tab && tab.requiresAuth && !this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '此功能需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/user-related/login/login'
            });
          }
        }
      });
      return;
    }
    
    // Add haptic feedback
    try {
      wx.vibrateShort({
        type: 'light'
      });
    } catch (error) {
      // Ignore haptic feedback errors
    }
    
    // Save current scroll position
    if (previousTab) {
      this.saveScrollPosition(previousTab);
    }
    
    // Switch to new tab
    this.setData({ activeTab: tabId });
    
    // Load tab data
    this.loadTabData(tabId);
    
    // Restore scroll position after a short delay
    setTimeout(() => {
      this.restoreScrollPosition(tabId);
    }, 100);
    
    // Mark tab as visited for badge clearing
    this.markTabAsVisited(tabId);
  },

  loadTabData: function(tabId) {
    switch (tabId) {
      case 'all':
        this.loadAllEvents();
        break;
      case 'search':
        this.loadSearchData();
        break;
      case 'create':
        this.loadCreateData();
        break;
      case 'my':
        this.loadMyEvents();
        break;
      case 'popular':
        this.loadPopularEvents();
        break;
    }
  },

  loadAllEvents: function() {
    const tabData = this.data.tabData.all;
    if (tabData.events.length === 0 && !tabData.loading) {
      // Load events for the first time
      this.setData({
        'tabData.all.loading': true
      });
      
      const params = {
        page: 1,
        limit: this.data.pageSize,  // 修改为后端期望的参数名
        ...this.data.filters
      };
      
      API.getEvents(params)
        .then(res => {
          console.log('赛事页面获取到的数据:', res);
          console.log('赛事数量:', (res.data || []).length);

          this.setData({
            'tabData.all.events': res.data || [],
            'tabData.all.hasMore': (res.data || []).length === this.data.pageSize,
            'tabData.all.loading': false,
            'tabData.all.currentPage': 1,
            // Update legacy data for backward compatibility
            events: res.data || [],
            hasMore: (res.data || []).length === this.data.pageSize,
            loading: false,
            currentPage: 1
          });

          console.log('赛事页面数据设置完成，events长度:', this.data.events.length);
        })
        .catch(err => {
          console.error('Failed to load all events:', err);
          this.setData({
            'tabData.all.loading': false,
            loading: false
          });
        });
    }
  },

  loadSearchData: function() {
    // Initialize search tab if needed
    const searchData = this.data.tabData.search;
    
    if (!searchData.initialized) {
      // Use wx.nextTick to prevent recursive updates
      wx.nextTick(() => {
        this.setData({
          'tabData.search.initialized': true,
          'tabData.search.query': '',
          'tabData.search.results': [],
          'tabData.search.loading': false,
          'tabData.search.searchHistory': []
        });
        
        // Load search history in next tick to avoid recursion
        setTimeout(() => {
          this.loadSearchHistory();
        }, 0);
      });
    }
  },

  // Badge management methods
  updateTabBadges: function() {
    const tabs = [...this.data.tabs];
    
    // Update badges for each tab
    tabs.forEach(tab => {
      switch (tab.id) {
        case 'all':
          // Show count of new events since last visit
          tab.badge = this.getNewEventsCount();
          break;
        case 'search':
          // Show count of search history items
          tab.badge = this.data.tabData.search.searchHistory?.length || 0;
          break;
        case 'create':
          // Show 1 if there's a draft
          tab.badge = this.hasDraft() ? 1 : 0;
          break;
        case 'my':
          // Show count of user's events with updates
          tab.badge = this.getMyEventsUpdatesCount();
          break;
        case 'popular':
          // Show count of new popular events
          tab.badge = this.getNewPopularEventsCount();
          break;
      }
    });
    
    this.setData({ tabs });
  },

  getNewEventsCount: function() {
    // Get count of events created since last visit
    try {
      const lastVisit = wx.getStorageSync('last_all_events_visit') || new Date(0);
      const events = this.data.tabData.all.events || [];
      
      return events.filter(event => {
        const createdAt = new Date(event.createdAt);
        return createdAt > new Date(lastVisit);
      }).length;
    } catch (error) {
      return 0;
    }
  },

  hasDraft: function() {
    try {
      const draft = wx.getStorageSync('event_draft');
      return draft && draft.name && draft.name.trim().length > 0;
    } catch (error) {
      return false;
    }
  },

  getMyEventsUpdatesCount: function() {
    if (!this.data.isLoggedIn) return 0;
    
    // Count events with recent updates or status changes
    const myEvents = this.data.tabData.my.events || [];
    const lastCheck = wx.getStorageSync('last_my_events_check') || new Date(0);
    
    return myEvents.filter(event => {
      const updatedAt = new Date(event.updatedAt || event.createdAt);
      return updatedAt > new Date(lastCheck);
    }).length;
  },

  getNewPopularEventsCount: function() {
    // Count new events in popular tab since last visit
    try {
      const lastVisit = wx.getStorageSync('last_popular_events_visit') || new Date(0);
      const events = this.data.tabData.popular.events || [];
      
      return events.filter(event => {
        const createdAt = new Date(event.createdAt);
        return createdAt > new Date(lastVisit) && event.popularityScore > 50;
      }).length;
    } catch (error) {
      return 0;
    }
  },

  markTabAsVisited: function(tabId) {
    // Mark tab as visited to clear badges
    const now = new Date().toISOString();
    
    try {
      switch (tabId) {
        case 'all':
          wx.setStorageSync('last_all_events_visit', now);
          break;
        case 'my':
          wx.setStorageSync('last_my_events_check', now);
          break;
        case 'popular':
          wx.setStorageSync('last_popular_events_visit', now);
          break;
      }
      
      // Update badges after marking as visited
      setTimeout(() => {
        this.updateTabBadges();
      }, 100);
    } catch (error) {
      console.error('Failed to mark tab as visited:', error);
    }
  },

  // Visual indicators for tab content status
  addTabIndicator: function(tabId, type, message) {
    const tabs = [...this.data.tabs];
    const tab = tabs.find(t => t.id === tabId);
    
    if (tab) {
      tab.indicator = {
        type: type, // 'new', 'update', 'error', 'loading'
        message: message,
        timestamp: Date.now()
      };
      
      this.setData({ tabs });
      
      // Auto-remove indicator after 5 seconds
      setTimeout(() => {
        this.removeTabIndicator(tabId);
      }, 5000);
    }
  },

  removeTabIndicator: function(tabId) {
    const tabs = [...this.data.tabs];
    const tab = tabs.find(t => t.id === tabId);
    
    if (tab && tab.indicator) {
      delete tab.indicator;
      this.setData({ tabs });
    }
  },

  // Notification dot for urgent updates
  showTabNotificationDot: function(tabId, show = true) {
    const tabs = [...this.data.tabs];
    const tab = tabs.find(t => t.id === tabId);
    
    if (tab) {
      tab.hasNotification = show;
      this.setData({ tabs });
    }
  },

  // Pulse animation for important tabs
  pulseTab: function(tabId) {
    const tabs = [...this.data.tabs];
    const tab = tabs.find(t => t.id === tabId);
    
    if (tab) {
      tab.isPulsing = true;
      this.setData({ tabs });
      
      // Stop pulsing after 3 seconds
      setTimeout(() => {
        tab.isPulsing = false;
        this.setData({ tabs });
      }, 3000);
    }
  },

  loadCreateData: function() {
    // Check login status first
    if (!this.data.isLoggedIn) {
      console.log('用户未登录，无法创建赛事');
      return;
    }
    
    // Initialize create form if needed
    const createData = this.data.tabData.create;
    if (!createData.initialized) {
      wx.nextTick(() => {
        this.setData({
          'tabData.create.initialized': true,
          'tabData.create.formData': {
            name: '',
            eventType: '',
            venue: '',
            eventDate: '',
            registrationDeadline: '',
            maxParticipants: '',
            registrationFee: 0,
            description: ''
          },
          'tabData.create.errors': {},
          'tabData.create.isValid': false
        });
        
        // Load draft if exists
        this.loadDraft();
      });
    }
  },

  loadMyEvents: function() {
    if (!this.data.isLoggedIn) {
      console.log('用户未登录，无法加载我的赛事');
      return;
    }
    
    const tabData = this.data.tabData.my;
    if (tabData.events.length === 0 && !tabData.loading) {
      this.setData({
        'tabData.my.loading': true
      });
      
      const params = {
        type: tabData.type || 'all',
        page: tabData.currentPage || 1,
        limit: 20
      };

      console.log('开始加载我的赛事:', params);

      API.getUserEvents(params).then(res => {
        if (res.success || res.data) {
          const events = res.data?.events || res.data || [];
          console.log('我的赛事数据:', events);
          
          this.setData({
            'tabData.my.events': events,
            'tabData.my.loading': false,
            'tabData.my.hasMore': events.length === 20,
            // Update legacy data
            userEvents: events
          });
        } else {
          console.warn('我的赛事加载失败，使用模拟数据');
          this.loadMockMyEvents();
        }
      }).catch(err => {
        console.error('获取用户赛事失败:', err);
        this.loadMockMyEvents();
      });
    }
  },

  // 加载模拟的我的赛事数据
  loadMockMyEvents: function() {
    const mockEvents = [
      {
        _id: 'my_event_1',
        name: '我创建的网球锦标赛',
        eventType: '男子单打',
        status: 'registration',
        venue: '体育中心',
        eventDate: '2024-08-15',
        currentParticipants: 8,
        maxParticipants: 32,
        userRole: 'organizer',
        canEdit: true
      },
      {
        _id: 'my_event_2',
        name: '朋友俱乐部赛事',
        eventType: '混合双打',
        status: 'upcoming',
        venue: '网球俱乐部',
        eventDate: '2024-08-20',
        currentParticipants: 16,
        maxParticipants: 16,
        userRole: 'participant',
        canEdit: false
      }
    ];

    this.setData({
      'tabData.my.events': mockEvents,
      'tabData.my.loading': false,
      'tabData.my.hasMore': false,
      userEvents: mockEvents
    });
  },

  loadPopularEvents: function() {
    const tabData = this.data.tabData.popular;
    if (tabData.events.length === 0 && !tabData.loading) {
      this.setData({
        'tabData.popular.loading': true
      });
      
      // Simulate popular events API call
      setTimeout(() => {
        // For now, use the same events as all events but sorted by popularity
        const params = {
          page: 1,
          limit: this.data.pageSize,  // 修改为后端期望的参数名
          sortBy: 'popularity',
          sortOrder: 'desc'
        };
        
        API.getEvents(params)
          .then(res => {
            this.setData({
              'tabData.popular.events': res.data || [],
              'tabData.popular.loading': false,
              'tabData.popular.hasMore': (res.data || []).length === this.data.pageSize
            });
          })
          .catch(err => {
            console.error('Failed to load popular events:', err);
            this.setData({
              'tabData.popular.loading': false
            });
          });
      }, 500);
    }
  },

  saveScrollPosition: function(tabId) {
    wx.createSelectorQuery()
      .selectViewport()
      .scrollOffset()
      .exec((res) => {
        if (res[0]) {
          this.scrollPositions[tabId] = res[0].scrollTop;
          this.setData({
            [`tabData.${tabId}.scrollTop`]: res[0].scrollTop
          });
        }
      });
  },

  restoreScrollPosition: function(tabId) {
    const scrollTop = this.scrollPositions[tabId] || 0;
    if (scrollTop > 0) {
      wx.pageScrollTo({
        scrollTop: scrollTop,
        duration: 300
      });
    }
  },

  // Simple retry function for direct tab content
  onTabRetry: function() {
    console.log('Retrying current tab:', this.data.activeTab);
    this.loadTabData(this.data.activeTab);
  },

  // Search tab handlers with real-time search and debouncing
  onSearchTabInput: function(e) {
    const query = e.detail.value;
    this.setData({
      'tabData.search.query': query
    });
    
    // Clear previous debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    // If query is empty, clear results
    if (!query.trim()) {
      this.setData({
        'tabData.search.results': [],
        'tabData.search.loading': false
      });
      return;
    }
    
    // Set loading state for real-time feedback
    this.setData({
      'tabData.search.loading': true
    });
    
    // Debounce search to avoid excessive API calls
    this.searchDebounceTimer = setTimeout(() => {
      this.performRealTimeSearch(query);
    }, 300); // 300ms debounce delay
  },

  performRealTimeSearch: function(query) {
    if (!query || !query.trim()) {
      this.setData({
        'tabData.search.results': [],
        'tabData.search.loading': false
      });
      return;
    }

    // Perform search API call with simplified parameters to avoid serialization issues
    const searchParams = {
      query: query.trim(),
      page: 1,
      limit: 20,
      sortBy: 'relevance'
    };

    API.searchEvents(searchParams).then(res => {
      if (res.success) {
        // Process search results for highlighting
        const processedResults = this.processSearchResults(res.data.events || [], query);
        
        this.setData({
          'tabData.search.results': processedResults,
          'tabData.search.loading': false,
          'tabData.search.totalResults': res.data.total || 0,
          'tabData.search.hasMore': res.data.hasMore || false
        });
        
        // Add successful search to suggestions
        this.addSearchSuggestion(query);
      } else {
        console.log('搜索API返回错误，使用模拟搜索');
        // Use mock search when API returns error
        this.performMockSearch(query);
      }
    }).catch(err => {
      console.error('Real-time search failed:', err);
      
      // Use mock search data when API fails
      this.performMockSearch(query);
    });
  },

  // Mock search when API fails
  performMockSearch: function(query) {
    console.log('执行模拟搜索:', query);
    
    // Mock events data for search
    const mockEvents = [
      {
        _id: '3',
        name: '法国公开赛 2024',
        eventType: '男子单打',
        status: 'registration',
        venue: '罗兰加洛斯',
        region: '巴黎',
        eventDate: '2024-05-26',
        organizer: { name: '法国网球协会' }
      },
      {
        _id: '4',
        name: '法国网球公开赛女子组',
        eventType: '女子单打',
        status: 'registration',
        venue: '法国巴黎罗兰加洛斯',
        region: '法国',
        eventDate: '2024-06-01',
        organizer: { name: '法国体育协会' }
      },
      {
        _id: '1',
        name: '温布尔登锦标赛 2024',
        eventType: '男子单打',
        status: 'registration',
        venue: '全英俱乐部',
        region: '伦敦',
        eventDate: '2024-07-01',
        organizer: { name: '温布尔登网球俱乐部' }
      },
      {
        _id: '6',
        name: '网球热业余锦标赛',
        eventType: '男子双打',
        status: 'registration',
        venue: '网球热体育中心',
        region: '北京',
        eventDate: '2024-08-15',
        organizer: { name: '网球热' }
      }
    ];
    
    // Filter events based on query
    let filteredEvents = mockEvents;
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      filteredEvents = mockEvents.filter(event => 
        event.name.toLowerCase().includes(searchTerm) ||
        event.eventType.toLowerCase().includes(searchTerm) ||
        event.venue.toLowerCase().includes(searchTerm) ||
        event.region.toLowerCase().includes(searchTerm) ||
        (event.organizer.name && event.organizer.name.toLowerCase().includes(searchTerm))
      );
    }
    
    console.log('模拟搜索结果:', filteredEvents);
    
    // Set search results
    this.setData({
      'tabData.search.results': filteredEvents,
      'tabData.search.loading': false,
      'tabData.search.totalResults': filteredEvents.length,
      'tabData.search.hasMore': false,
      'tabData.search.error': null
    });
    
    // Add to search history
    if (query && query.trim()) {
      this.addToSearchHistory(query.trim());
    }
  },

  performSearch: function() {
    const query = this.data.tabData.search.query;
    if (!query.trim()) return;

    // Clear debounce timer if exists
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Add to search history
    this.addToSearchHistory(query);
    
    // Perform immediate search
    this.performRealTimeSearch(query);
  },

  processSearchResults: function(results, query) {
    // Add search highlighting and relevance scoring
    return results.map(event => {
      const highlightedEvent = { ...event };
      
      // Simple highlighting for event name
      if (event.name && event.name.toLowerCase().includes(query.toLowerCase())) {
        highlightedEvent.highlightedName = this.highlightText(event.name, query);
      }
      
      // Add relevance score based on match quality
      highlightedEvent.relevanceScore = this.calculateRelevanceScore(event, query);
      
      return highlightedEvent;
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  },

  highlightText: function(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  calculateRelevanceScore: function(event, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Name match gets highest score
    if (event.name && event.name.toLowerCase().includes(queryLower)) {
      score += 10;
      if (event.name.toLowerCase().startsWith(queryLower)) {
        score += 5; // Bonus for prefix match
      }
    }
    
    // Description match
    if (event.description && event.description.toLowerCase().includes(queryLower)) {
      score += 5;
    }
    
    // Venue match
    if (event.venue && event.venue.toLowerCase().includes(queryLower)) {
      score += 3;
    }
    
    // Organizer name match
    if (event.organizer && event.organizer.name && 
        event.organizer.name.toLowerCase().includes(queryLower)) {
      score += 2;
    }
    
    // Boost score for events with more participants (popularity)
    if (event.currentParticipants) {
      score += Math.min(event.currentParticipants * 0.1, 2);
    }
    
    // Boost score for upcoming events
    if (event.status === 'registration' || event.status === 'upcoming') {
      score += 1;
    }
    
    return score;
  },

  addToSearchHistory: function(query) {
    const history = [...this.data.tabData.search.searchHistory];
    
    // Remove if already exists
    const existingIndex = history.indexOf(query);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    
    // Add to beginning
    history.unshift(query);
    
    // Keep only last 10 searches
    if (history.length > 10) {
      history.pop();
    }
    
    this.setData({
      'tabData.search.searchHistory': history
    });
    
    // Save to local storage
    try {
      wx.setStorageSync('search_history', history);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  },

  addSearchSuggestion: function(query) {
    // Add to search suggestions for autocomplete
    const suggestions = this.data.tabData.search.suggestions || [];
    
    if (!suggestions.includes(query) && query.length >= 2) {
      suggestions.unshift(query);
      
      // Keep only 20 suggestions
      if (suggestions.length > 20) {
        suggestions.pop();
      }
      
      this.setData({
        'tabData.search.suggestions': suggestions
      });
    }
  },

  loadSearchHistory: function() {
    try {
      const history = wx.getStorageSync('search_history') || [];
      this.setData({
        'tabData.search.searchHistory': history
      });
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  },

  searchFromHistory: function(e) {
    const query = e.currentTarget.dataset.query;
    this.setData({
      'tabData.search.query': query
    });
    this.performSearch();
  },

  clearSearchHistory: function() {
    this.setData({
      'tabData.search.searchHistory': []
    });
  },

  // Enhanced Create tab handlers with validation and auto-save
  onCreateFormInput: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    // Update form data
    this.setData({
      [`tabData.create.formData.${field}`]: value
    });
    
    // Real-time validation
    this.validateFormField(field, value);
    
    // Auto-save draft after input
    this.scheduleAutoSave();
  },

  validateFormField: function(field, value) {
    const errors = this.data.tabData.create.errors || {};
    
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          errors[field] = '赛事名称至少需要2个字符';
        } else if (value.length > 50) {
          errors[field] = '赛事名称不能超过50个字符';
        } else {
          delete errors[field];
        }
        break;
        
      case 'venue':
        if (!value || value.trim().length < 2) {
          errors[field] = '场地信息不能为空';
        } else {
          delete errors[field];
        }
        break;
        
      case 'maxParticipants':
        const num = parseInt(value);
        if (value && (isNaN(num) || num < 2 || num > 1000)) {
          errors[field] = '参与人数应在2-1000之间';
        } else {
          delete errors[field];
        }
        break;
        
      case 'registrationFee':
        const fee = parseFloat(value);
        if (value && (isNaN(fee) || fee < 0 || fee > 10000)) {
          errors[field] = '报名费应在0-10000之间';
        } else {
          delete errors[field];
        }
        break;
    }
    
    this.setData({
      'tabData.create.errors': errors,
      'tabData.create.isValid': Object.keys(errors).length === 0
    });
  },

  onEventTypeChange: function(e) {
    const index = e.detail.value;
    this.setData({
      'tabData.create.formData.eventTypeIndex': index,
      'tabData.create.formData.eventType': this.data.eventTypes[index].id
    });
    
    this.scheduleAutoSave();
  },

  onDateTimeChange: function(e) {
    const values = e.detail.value;
    
    // Generate date time ranges for multi-selector
    const dateTimeRange = this.generateDateTimeRange();
    const selectedDate = dateTimeRange[0][values[0]];
    const selectedTime = dateTimeRange[1][values[1]];
    
    const eventDate = `${selectedDate} ${selectedTime}`;
    
    this.setData({
      'tabData.create.formData.dateTimeIndex': values,
      'tabData.create.formData.eventDate': eventDate
    });
    
    this.scheduleAutoSave();
  },

  generateDateTimeRange: function() {
    const dates = [];
    const times = [];
    
    // Generate next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Generate time slots (8:00 - 22:00)
    for (let hour = 8; hour <= 22; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) {
        times.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return [dates, times];
  },

  scheduleAutoSave: function() {
    // Clear existing auto-save timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    // Schedule auto-save in 30 seconds
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveDraft();
    }, 30000);
  },

  autoSaveDraft: function() {
    const formData = this.data.tabData.create.formData;
    
    // Only auto-save if there's meaningful content
    if (formData.name && formData.name.trim().length > 0) {
      try {
        const draftData = {
          ...formData,
          savedAt: new Date().toISOString(),
          autoSaved: true
        };
        
        wx.setStorageSync('event_draft', draftData);
        
        // Show subtle feedback
        this.setData({
          'tabData.create.lastAutoSaved': new Date().toLocaleTimeString()
        });
        
        console.log('Draft auto-saved at:', draftData.savedAt);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  },

  saveDraft: function() {
    const formData = this.data.tabData.create.formData;
    
    if (!formData.name || formData.name.trim().length === 0) {
      wx.showToast({
        title: '请至少填写赛事名称',
        icon: 'none'
      });
      return;
    }
    
    try {
      const draftData = {
        ...formData,
        savedAt: new Date().toISOString(),
        autoSaved: false
      };
      
      wx.setStorageSync('event_draft', draftData);
      
      wx.showToast({
        title: '草稿已保存',
        icon: 'success'
      });
      
      this.setData({
        'tabData.create.lastSaved': new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Save draft failed:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  loadDraft: function() {
    try {
      const draftData = wx.getStorageSync('event_draft');
      if (draftData && draftData.name) {
        wx.showModal({
          title: '发现草稿',
          content: `发现未完成的赛事草稿"${draftData.name}"，是否继续编辑？`,
          confirmText: '继续编辑',
          cancelText: '重新开始',
          success: (res) => {
            if (res.confirm) {
              this.setData({
                'tabData.create.formData': draftData,
                'tabData.create.lastSaved': draftData.savedAt ? 
                  new Date(draftData.savedAt).toLocaleTimeString() : null
              });
            } else {
              this.clearDraft();
            }
          }
        });
      }
    } catch (error) {
      console.error('Load draft failed:', error);
    }
  },

  clearDraft: function() {
    try {
      wx.removeStorageSync('event_draft');
      this.setData({
        'tabData.create.formData': {},
        'tabData.create.lastSaved': null,
        'tabData.create.lastAutoSaved': null,
        'tabData.create.errors': {}
      });
    } catch (error) {
      console.error('Clear draft failed:', error);
    }
  },

  validateCreateForm: function() {
    const formData = this.data.tabData.create.formData;
    const errors = {};
    
    // Required fields validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = '赛事名称至少需要2个字符';
    }
    
    if (!formData.venue || formData.venue.trim().length < 2) {
      errors.venue = '场地信息不能为空';
    }
    
    if (!formData.eventType) {
      errors.eventType = '请选择赛事类型';
    }
    
    if (!formData.eventDate) {
      errors.eventDate = '请选择比赛时间';
    }
    
    // Optional fields validation
    if (formData.maxParticipants) {
      const num = parseInt(formData.maxParticipants);
      if (isNaN(num) || num < 2 || num > 1000) {
        errors.maxParticipants = '参与人数应在2-1000之间';
      }
    }
    
    if (formData.registrationFee) {
      const fee = parseFloat(formData.registrationFee);
      if (isNaN(fee) || fee < 0 || fee > 10000) {
        errors.registrationFee = '报名费应在0-10000之间';
      }
    }
    
    this.setData({
      'tabData.create.errors': errors
    });
    
    return Object.keys(errors).length === 0;
  },

  createEventQuick: function() {
    // Validate form before submission
    if (!this.validateCreateForm()) {
      wx.showToast({
        title: '请检查表单信息',
        icon: 'none'
      });
      return;
    }
    
    const formData = this.data.tabData.create.formData;
    
    wx.showLoading({
      title: '创建中...',
      mask: true
    });

    // Prepare event data
    const eventData = {
      name: formData.name.trim(),
      eventType: formData.eventType,
      venue: formData.venue.trim(),
      eventDate: formData.eventDate,
      registrationDeadline: formData.registrationDeadline,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : 0,
      description: formData.description ? formData.description.trim() : '',
      allowSelfRecording: formData.allowSelfRecording || false,
      isPublic: formData.isPublic !== false // Default to public
    };

    API.createEvent(eventData).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        // Clear form and draft
        this.clearDraft();
        
        // Switch to all events tab and refresh
        this.setData({
          activeTab: 'all'
        });
        
        // Refresh all events to show the new event
        this.loadAllEvents();
        
        // Clear auto-save timer
        if (this.autoSaveTimer) {
          clearTimeout(this.autoSaveTimer);
        }
      } else {
        wx.showToast({
          title: res.message || '创建失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('Create event failed:', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
  },

  goToFullCreateForm: function() {
    wx.navigateTo({
      url: '/pages/user-related/event-create/event-create'
    });
  },

  // Enhanced My Events tab handlers with user-specific views
  switchMyEventType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'tabData.my.type': type,
      'tabData.my.events': [], // Clear current events
      'tabData.my.currentPage': 1,
      'tabData.my.hasMore': true
    });
    this.loadMyEvents();
  },

  loadMyEvents: function() {
    if (!this.data.isLoggedIn) return;
    
    const tabData = this.data.tabData.my;
    
    this.setData({
      'tabData.my.loading': true
    });
    
    const params = {
      type: tabData.type,
      page: tabData.currentPage || 1,
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    };

    API.getUserEvents(params).then(res => {
      if (res.success) {
        const events = res.data.events || [];
        
        // Add user role information and quick action availability
        const enhancedEvents = events.map(event => ({
          ...event,
          userRole: this.determineUserRole(event),
          canEdit: this.canUserEditEvent(event),
          canCancel: this.canUserCancelEvent(event),
          canShare: true,
          statusText: this.getEventStatusText(event.status),
          timeUntilEvent: this.calculateTimeUntilEvent(event.eventDate)
        }));
        
        this.setData({
          'tabData.my.events': tabData.currentPage === 1 ? enhancedEvents : 
            [...tabData.events, ...enhancedEvents],
          'tabData.my.loading': false,
          'tabData.my.hasMore': events.length === 20,
          'tabData.my.currentPage': tabData.currentPage || 1,
          // Update legacy data for backward compatibility
          userEvents: enhancedEvents
        });
      } else {
        this.setData({
          'tabData.my.loading': false,
          'tabData.my.error': res.message || '获取用户赛事失败'
        });
      }
    }).catch(err => {
      console.error('获取用户赛事失败:', err);
      this.setData({
        'tabData.my.loading': false,
        'tabData.my.error': '网络错误，请重试'
      });
    });
  },

  determineUserRole: function(event) {
    const userId = this.data.userInfo?._id;
    if (!userId) return 'unknown';
    
    // Check if user is the organizer
    if (event.organizer && event.organizer._id === userId) {
      return 'organizer';
    }
    
    // Check if user is a participant
    if (event.participants && event.participants.some(p => p.user && p.user._id === userId)) {
      return 'participant';
    }
    
    return 'unknown';
  },

  canUserEditEvent: function(event) {
    const userRole = this.determineUserRole(event);
    
    // Only organizers can edit events
    if (userRole !== 'organizer') return false;
    
    // Can't edit completed or cancelled events
    if (event.status === 'completed' || event.status === 'cancelled') return false;
    
    return true;
  },

  canUserCancelEvent: function(event) {
    const userRole = this.determineUserRole(event);
    
    if (userRole === 'organizer') {
      // Organizers can cancel events that haven't started
      return event.status === 'registration' || event.status === 'upcoming';
    } else if (userRole === 'participant') {
      // Participants can cancel their registration during registration period
      return event.status === 'registration';
    }
    
    return false;
  },

  getEventStatusText: function(status) {
    const statusMap = {
      'registration': '报名中',
      'upcoming': '即将开始',
      'ongoing': '进行中',
      'completed': '已结束',
      'cancelled': '已取消'
    };
    
    return statusMap[status] || status;
  },

  calculateTimeUntilEvent: function(eventDate) {
    if (!eventDate) return null;
    
    const now = new Date();
    const event = new Date(eventDate);
    const diff = event - now;
    
    if (diff < 0) return '已过期';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}天后`;
    } else if (hours > 0) {
      return `${hours}小时后`;
    } else {
      return '即将开始';
    }
  },

  switchToCreateTab: function() {
    this.setData({
      activeTab: 'create'
    });
  },

  editEvent: function(e) {
    const eventId = e.currentTarget.dataset.id;
    const event = this.data.tabData.my.events.find(ev => ev._id === eventId);
    
    if (!event) {
      wx.showToast({
        title: '赛事不存在',
        icon: 'none'
      });
      return;
    }
    
    if (!this.canUserEditEvent(event)) {
      wx.showToast({
        title: '无法编辑此赛事',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/user-related/event-create/event-create?id=${eventId}&mode=edit`
    });
  },

  cancelMyEvent: function(e) {
    const eventId = e.currentTarget.dataset.id;
    const event = this.data.tabData.my.events.find(ev => ev._id === eventId);
    
    if (!event) return;
    
    const userRole = this.determineUserRole(event);
    let confirmText, actionText;
    
    if (userRole === 'organizer') {
      confirmText = `确定要取消赛事"${event.name}"吗？此操作不可撤销。`;
      actionText = '取消赛事';
    } else {
      confirmText = `确定要取消报名"${event.name}"吗？`;
      actionText = '取消报名';
    }
    
    wx.showModal({
      title: actionText,
      content: confirmText,
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processCancelMyEvent(eventId, userRole);
        }
      }
    });
  },

  processCancelMyEvent: function(eventId, userRole) {
    wx.showLoading({
      title: userRole === 'organizer' ? '取消赛事中...' : '取消报名中...',
      mask: true
    });
    
    const apiCall = userRole === 'organizer' ? 
      API.cancelEvent(eventId) : 
      API.cancelRegistration(eventId);
    
    apiCall.then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: userRole === 'organizer' ? '赛事已取消' : '取消报名成功',
          icon: 'success'
        });
        
        // Refresh my events list
        this.setData({
          'tabData.my.events': [],
          'tabData.my.currentPage': 1
        });
        this.loadMyEvents();
        
        // Also refresh all events if needed
        if (this.data.activeTab === 'all') {
          this.loadAllEvents();
        }
      } else {
        wx.showToast({
          title: res.message || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('Cancel operation failed:', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
  },

  shareMyEvent: function(e) {
    const eventId = e.currentTarget.dataset.id;
    const event = this.data.tabData.my.events.find(ev => ev._id === eventId);
    
    if (!event) return;
    
    // Set up sharing data
    this.shareEventData = {
      title: `${event.name} - 网球赛事`,
      path: `/pages/event/detail?id=${eventId}`,
      imageUrl: event.coverImage || '../../images/logo.png'
    };
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    // Also show share options
    wx.showActionSheet({
      itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // Share to friend - handled by onShareAppMessage
            break;
          case 1:
            // Share to timeline - handled by WeChat
            break;
          case 2:
            // Copy link
            wx.setClipboardData({
              data: `https://your-domain.com/pages/event/detail?id=${eventId}`,
              success: () => {
                wx.showToast({
                  title: '链接已复制',
                  icon: 'success'
                });
              }
            });
            break;
        }
      }
    });
  },

  loadMoreMyEvents: function() {
    const tabData = this.data.tabData.my;
    
    if (tabData.loading || !tabData.hasMore) return;
    
    this.setData({
      'tabData.my.currentPage': tabData.currentPage + 1
    });
    
    this.loadMyEvents();
  },

  refreshMyEvents: function() {
    this.setData({
      'tabData.my.events': [],
      'tabData.my.currentPage': 1,
      'tabData.my.hasMore': true,
      'tabData.my.error': null
    });
    
    this.loadMyEvents();
  },

  getMyEventStats: function() {
    if (!this.data.isLoggedIn) return;
    
    API.getUserEventStats().then(res => {
      if (res.success) {
        this.setData({
          'tabData.my.stats': res.data
        });
      }
    }).catch(err => {
      console.error('获取用户赛事统计失败:', err);
    });
  },

  // Enhanced Popular tab handlers with trending algorithm
  switchPopularTimeRange: function(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({
      'tabData.popular.timeRange': range,
      'tabData.popular.events': [], // Clear current events
      'tabData.popular.currentPage': 1,
      'tabData.popular.hasMore': true
    });
    this.loadPopularEvents();
  },

  loadPopularEvents: function() {
    const tabData = this.data.tabData.popular;
    
    this.setData({
      'tabData.popular.loading': true
    });
    
    const params = {
      page: tabData.currentPage || 1,
      limit: this.data.pageSize,  // 修改为后端期望的参数名
      timeRange: tabData.timeRange,
      sortBy: 'popularity',
      sortOrder: 'desc',
      includeMetrics: true // Include engagement metrics
    };
    
    API.getPopularEvents(params).then(res => {
      if (res.success) {
        const events = res.data.events || [];
        
        // Calculate popularity scores and enhance events
        const enhancedEvents = events.map(event => ({
          ...event,
          popularityScore: this.calculatePopularityScore(event, tabData.timeRange),
          trendingReason: this.getTrendingReason(event),
          engagementRate: this.calculateEngagementRate(event),
          isRising: this.isEventRising(event),
          timeUntilEvent: this.calculateTimeUntilEvent(event.eventDate)
        }));
        
        // Sort by popularity score
        enhancedEvents.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        
        this.setData({
          'tabData.popular.events': tabData.currentPage === 1 ? enhancedEvents : 
            [...tabData.events, ...enhancedEvents],
          'tabData.popular.loading': false,
          'tabData.popular.hasMore': events.length === this.data.pageSize,
          'tabData.popular.currentPage': tabData.currentPage || 1,
          'tabData.popular.lastUpdated': new Date().toLocaleTimeString()
        });
      } else {
        this.setData({
          'tabData.popular.loading': false,
          'tabData.popular.error': res.message || '获取热门赛事失败'
        });
      }
    }).catch(err => {
      console.error('Failed to load popular events:', err);
      
      // Fallback: use regular events with popularity calculation
      this.loadPopularEventsFallback();
    });
  },

  loadPopularEventsFallback: function() {
    // Fallback method using regular events API
    const params = {
      page: 1,
      limit: this.data.pageSize * 2, // Get more events to calculate popularity
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    API.getEvents(params).then(res => {
      const events = res.data || [];
      
      // Calculate popularity for each event
      const popularEvents = events
        .map(event => ({
          ...event,
          popularityScore: this.calculatePopularityScore(event, this.data.tabData.popular.timeRange),
          trendingReason: this.getTrendingReason(event),
          engagementRate: this.calculateEngagementRate(event),
          isRising: this.isEventRising(event),
          timeUntilEvent: this.calculateTimeUntilEvent(event.eventDate)
        }))
        .filter(event => event.popularityScore > 0) // Only show events with some popularity
        .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
        .slice(0, this.data.pageSize); // Limit to page size
      
      this.setData({
        'tabData.popular.events': popularEvents,
        'tabData.popular.loading': false,
        'tabData.popular.hasMore': false,
        'tabData.popular.lastUpdated': new Date().toLocaleTimeString()
      });
    }).catch(err => {
      console.error('Fallback popular events failed:', err);
      this.setData({
        'tabData.popular.loading': false,
        'tabData.popular.error': '网络错误，请重试'
      });
    });
  },

  calculatePopularityScore: function(event, timeRange) {
    let score = 0;
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    const createdDate = new Date(event.createdAt);
    
    // Base score from participants
    const participantCount = event.currentParticipants || 0;
    score += participantCount * 10;
    
    // Bonus for high participation rate
    if (event.maxParticipants && participantCount > 0) {
      const participationRate = participantCount / event.maxParticipants;
      score += participationRate * 20;
    }
    
    // View count contribution
    const viewCount = event.viewCount || 0;
    score += viewCount * 0.5;
    
    // Comment/interaction count
    const commentCount = event.commentCount || 0;
    score += commentCount * 5;
    
    // Share count
    const shareCount = event.shareCount || 0;
    score += shareCount * 8;
    
    // Registration speed bonus (how quickly it filled up)
    const daysSinceCreated = (now - createdDate) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated > 0 && participantCount > 0) {
      const registrationSpeed = participantCount / daysSinceCreated;
      score += registrationSpeed * 5;
    }
    
    // Time-based adjustments
    const timeMultiplier = this.getTimeMultiplier(event, timeRange);
    score *= timeMultiplier;
    
    // Event status bonus
    if (event.status === 'registration') {
      score *= 1.5; // Boost events that are still accepting registrations
    } else if (event.status === 'upcoming') {
      score *= 1.2; // Boost upcoming events
    } else if (event.status === 'completed') {
      score *= 0.5; // Reduce completed events
    }
    
    // Recency bonus for newer events
    if (daysSinceCreated < 7) {
      score *= (1 + (7 - daysSinceCreated) * 0.1);
    }
    
    // Premium event bonus
    if (event.isPremium) {
      score *= 1.3;
    }
    
    return Math.round(score);
  },

  getTimeMultiplier: function(event, timeRange) {
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    const createdDate = new Date(event.createdAt);
    
    let cutoffDate;
    switch (timeRange) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return 1;
    }
    
    // Events created within the time range get full score
    if (createdDate >= cutoffDate) {
      return 1;
    }
    
    // Events outside the range get reduced score
    const daysOutside = (cutoffDate - createdDate) / (1000 * 60 * 60 * 24);
    return Math.max(0.1, 1 - (daysOutside * 0.1));
  },

  getTrendingReason: function(event) {
    const participantCount = event.currentParticipants || 0;
    const viewCount = event.viewCount || 0;
    const commentCount = event.commentCount || 0;
    
    if (participantCount > 50) {
      return '参与人数众多';
    } else if (viewCount > 1000) {
      return '浏览量很高';
    } else if (commentCount > 20) {
      return '讨论热烈';
    } else if (event.maxParticipants && participantCount / event.maxParticipants > 0.8) {
      return '即将满员';
    } else if (this.isEventRising(event)) {
      return '热度上升';
    } else {
      return '热门推荐';
    }
  },

  calculateEngagementRate: function(event) {
    const viewCount = event.viewCount || 0;
    const participantCount = event.currentParticipants || 0;
    const commentCount = event.commentCount || 0;
    const shareCount = event.shareCount || 0;
    
    if (viewCount === 0) return 0;
    
    const engagements = participantCount + commentCount + shareCount;
    return Math.round((engagements / viewCount) * 100 * 100) / 100; // Round to 2 decimal places
  },

  isEventRising: function(event) {
    // Simple heuristic: if event has good recent activity
    const now = new Date();
    const createdDate = new Date(event.createdAt);
    const daysSinceCreated = (now - createdDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreated < 1) {
      // New events with any activity are considered rising
      return (event.currentParticipants || 0) > 0 || (event.viewCount || 0) > 10;
    } else if (daysSinceCreated < 7) {
      // Recent events with good activity rate
      const activityRate = ((event.currentParticipants || 0) + (event.commentCount || 0)) / daysSinceCreated;
      return activityRate > 2;
    }
    
    return false;
  },

  loadMorePopularEvents: function() {
    const tabData = this.data.tabData.popular;
    
    if (tabData.loading || !tabData.hasMore) return;
    
    this.setData({
      'tabData.popular.currentPage': tabData.currentPage + 1
    });
    
    this.loadPopularEvents();
  },

  refreshPopularEvents: function() {
    this.setData({
      'tabData.popular.events': [],
      'tabData.popular.currentPage': 1,
      'tabData.popular.hasMore': true,
      'tabData.popular.error': null
    });
    
    this.loadPopularEvents();
  },

  getPopularEventsByCategory: function(category) {
    const events = this.data.tabData.popular.events;
    
    switch (category) {
      case 'rising':
        return events.filter(event => event.isRising);
      case 'high_engagement':
        return events.filter(event => event.engagementRate > 5);
      case 'nearly_full':
        return events.filter(event => {
          if (!event.maxParticipants) return false;
          const rate = (event.currentParticipants || 0) / event.maxParticipants;
          return rate > 0.8 && rate < 1;
        });
      case 'new_and_hot':
        const now = new Date();
        return events.filter(event => {
          const createdDate = new Date(event.createdAt);
          const daysSinceCreated = (now - createdDate) / (1000 * 60 * 60 * 24);
          return daysSinceCreated < 3 && event.popularityScore > 50;
        });
      default:
        return events;
    }
  },

  // Touch gesture methods for swipe navigation
  initTouchGestures: function() {
    // Initialize touch gesture variables
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.minSwipeDistance = 50; // Minimum distance for a swipe
    this.maxVerticalDistance = 100; // Maximum vertical distance to still be considered horizontal swipe
    
    console.log('Touch gestures initialized');
  },

  onTouchStart: function(e) {
    if (e.touches && e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  },

  onTouchMove: function(e) {
    // Prevent default scrolling behavior during horizontal swipes
    if (e.touches && e.touches.length > 0) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const deltaX = Math.abs(currentX - this.touchStartX);
      const deltaY = Math.abs(currentY - this.touchStartY);
      
      // If horizontal movement is greater than vertical, prevent vertical scroll
      if (deltaX > deltaY && deltaX > 20) {
        e.preventDefault();
      }
    }
  },

  onTouchEnd: function(e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      this.touchEndX = e.changedTouches[0].clientX;
      this.touchEndY = e.changedTouches[0].clientY;
      
      this.handleSwipeGesture();
    }
  },

  handleSwipeGesture: function() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = Math.abs(this.touchEndY - this.touchStartY);
    
    // Check if it's a valid horizontal swipe
    if (Math.abs(deltaX) > this.minSwipeDistance && deltaY < this.maxVerticalDistance) {
      const currentTabIndex = this.data.tabs.findIndex(tab => tab.id === this.data.activeTab);
      let newTabIndex;
      
      if (deltaX > 0) {
        // Swipe right - go to previous tab
        newTabIndex = currentTabIndex > 0 ? currentTabIndex - 1 : this.data.tabs.length - 1;
      } else {
        // Swipe left - go to next tab
        newTabIndex = currentTabIndex < this.data.tabs.length - 1 ? currentTabIndex + 1 : 0;
      }
      
      const newTab = this.data.tabs[newTabIndex];
      
      // Check if the new tab is available (not disabled)
      if (!newTab.disabled) {
        // Trigger haptic feedback
        this.triggerHapticFeedback();
        
        // Switch to the new tab
        this.switchToTab(newTab.id);
      }
    }
  },

  switchToTab: function(tabId) {
    if (tabId === this.data.activeTab) return;
    
    const previousTab = this.data.activeTab;
    
    // Save current scroll position
    this.saveScrollPosition(previousTab);
    
    // Switch to new tab
    this.setData({ activeTab: tabId });
    
    // Load tab data if needed
    this.loadTabData(tabId);
    
    // Restore scroll position after a short delay
    setTimeout(() => {
      this.restoreScrollPosition(tabId);
    }, 100);
    
    // Record tab usage for analytics
    this.recordTabSwitch(tabId, previousTab);
  },

  triggerHapticFeedback: function() {
    try {
      wx.vibrateShort({
        type: 'light'
      });
    } catch (error) {
      // Haptic feedback not available, ignore
      console.log('Haptic feedback not available');
    }
  },

  recordTabSwitch: function(newTab, previousTab) {
    try {
      // Record tab switching analytics
      const analytics = wx.getStorageSync('tab_analytics') || {};
      const today = new Date().toDateString();
      
      if (!analytics[today]) {
        analytics[today] = {};
      }
      
      const switchKey = `${previousTab}_to_${newTab}`;
      analytics[today][switchKey] = (analytics[today][switchKey] || 0) + 1;
      
      wx.setStorageSync('tab_analytics', analytics);
    } catch (error) {
      console.error('Failed to record tab switch:', error);
    }
  },

  // Enhanced tab switching with animation
  switchToTabWithAnimation: function(tabId, direction = 'none') {
    if (tabId === this.data.activeTab) return;
    
    const previousTab = this.data.activeTab;
    
    // Add transition class based on direction
    let transitionClass = '';
    if (direction === 'left') {
      transitionClass = 'slide-left';
    } else if (direction === 'right') {
      transitionClass = 'slide-right';
    }
    
    // Set transition state
    this.setData({
      tabTransition: transitionClass,
      isTabTransitioning: true
    });
    
    // Save current scroll position
    this.saveScrollPosition(previousTab);
    
    // Switch to new tab after a short delay for animation
    setTimeout(() => {
      this.setData({ 
        activeTab: tabId,
        tabTransition: '',
        isTabTransitioning: false
      });
      
      // Load tab data if needed
      this.loadTabData(tabId);
      
      // Restore scroll position
      setTimeout(() => {
        this.restoreScrollPosition(tabId);
      }, 100);
    }, 150);
    
    // Record tab usage
    this.recordTabSwitch(tabId, previousTab);
  },

  // Keyboard navigation support
  onKeyDown: function(e) {
    // Handle keyboard navigation (for accessibility)
    if (e.keyCode === 37) { // Left arrow
      this.navigateToPreviousTab();
    } else if (e.keyCode === 39) { // Right arrow
      this.navigateToNextTab();
    }
  },

  navigateToPreviousTab: function() {
    const currentIndex = this.data.tabs.findIndex(tab => tab.id === this.data.activeTab);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : this.data.tabs.length - 1;
    const previousTab = this.data.tabs[previousIndex];
    
    if (!previousTab.disabled) {
      this.switchToTabWithAnimation(previousTab.id, 'right');
    }
  },

  navigateToNextTab: function() {
    const currentIndex = this.data.tabs.findIndex(tab => tab.id === this.data.activeTab);
    const nextIndex = currentIndex < this.data.tabs.length - 1 ? currentIndex + 1 : 0;
    const nextTab = this.data.tabs[nextIndex];
    
    if (!nextTab.disabled) {
      this.switchToTabWithAnimation(nextTab.id, 'left');
    }
  },

  // Double tap to refresh current tab
  onDoubleTap: function(e) {
    this.refreshCurrentTab();
  },

  refreshCurrentTab: function() {
    const activeTab = this.data.activeTab;
    
    // Clear current tab data
    this.setData({
      [`tabData.${activeTab}.events`]: [],
      [`tabData.${activeTab}.currentPage`]: 1,
      [`tabData.${activeTab}.hasMore`]: true,
      [`tabData.${activeTab}.error`]: null
    });
    
    // Reload tab data
    this.loadTabData(activeTab);
    
    // Show refresh feedback
    wx.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1000
    });
  },

  // Long press for tab options
  onLongPress: function(e) {
    const tabId = e.currentTarget.dataset.tabId;
    if (!tabId) return;
    
    const tab = this.data.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const options = ['刷新', '清除缓存'];
    
    if (tab.id === 'search') {
      options.push('清除搜索历史');
    }
    
    if (tab.id === 'create') {
      options.push('清除草稿');
    }
    
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        switch (res.tapIndex) {
          case 0: // 刷新
            this.refreshTab(tabId);
            break;
          case 1: // 清除缓存
            this.clearTabCache(tabId);
            break;
          case 2: // 特殊选项
            if (tab.id === 'search') {
              this.clearSearchHistory();
            } else if (tab.id === 'create') {
              this.clearDraft();
            }
            break;
        }
      }
    });
  },

  refreshTab: function(tabId) {
    // Clear tab data and reload
    this.setData({
      [`tabData.${tabId}.events`]: [],
      [`tabData.${tabId}.currentPage`]: 1,
      [`tabData.${tabId}.hasMore`]: true,
      [`tabData.${tabId}.error`]: null
    });
    
    this.loadTabData(tabId);
    
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  },

  clearTabCache: function(tabId) {
    // Clear cached data for the tab
    this.setData({
      [`tabData.${tabId}`]: {
        ...this.data.tabData[tabId],
        events: [],
        results: [],
        currentPage: 1,
        hasMore: true,
        loading: false,
        error: null
      }
    });
    
    wx.showToast({
      title: '缓存已清除',
      icon: 'success'
    });
  },

  // 页面显示时刷新数据
  onShow: function() {
    // Recheck login status in case user logged in from another page
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    // Update login status and user info
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    });
    
    // Update tab states based on login status
    const tabs = this.data.tabs.map(tab => {
      if (tab.requiresAuth && !isLoggedIn) {
        return { ...tab, disabled: true };
      }
      return { ...tab, disabled: false };
    });
    
    this.setData({ tabs });
    
    // Refresh current tab data
    this.loadTabData(this.data.activeTab);
    
  },

}); 