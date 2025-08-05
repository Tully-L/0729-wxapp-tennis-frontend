// event.js - 赛事管理界面
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

    // Events data
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

    // Search
    searchQuery: '',
    showSearch: false,

    // Create form data
    eventData: {
      name: '',
      eventType: '',
      venue: '',
      court: '',
      region: '',
      description: '',
      eventDate: '',
      registrationDeadline: '',
      isPublic: true
    },
    submitting: false,

    // Component states
    loading: false,
    error: ''
  },

  onLoad: function () {
    this.checkAndUpdateLoginStatus();

    // Initialize tab system
    this.initTabSystem();

    // Load initial tab data
    this.loadTabData(this.data.activeTab);
  },

  onShow: function () {
    // 每次显示页面时重新检查登录状态
    this.checkAndUpdateLoginStatus();
  },

  // 检查并更新登录状态
  checkAndUpdateLoginStatus: function() {
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    const token = auth.getToken();

    console.log('检查登录状态:', { isLoggedIn, hasUserInfo: !!userInfo, hasToken: !!token });

    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    });

    // 重新初始化tab系统以更新按钮状态
    this.initTabSystem();
  },

  onPullDownRefresh: function () {
    this.setData({
      events: [],
      currentPage: 1,
      hasMore: true
    });

    this.loadEvents().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreEvents();
    }
  },

  // Load events
  loadEvents: function () {
    if (this.data.loading) return Promise.resolve();

    this.setData({ loading: true });

    const params = {
      page: this.data.currentPage,
      limit: this.data.pageSize,
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
  loadMoreEvents: function () {
    if (this.data.loading) return;

    this.setData({
      currentPage: this.data.currentPage + 1,
      loading: true
    });

    const params = {
      page: this.data.currentPage,
      limit: this.data.pageSize,
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
  toggleFilter: function () {
    this.setData({
      showFilter: !this.data.showFilter
    });
  },

  // Apply filters
  applyFilter: function (e) {
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
  resetFilter: function () {
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
  goToEventDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${id}`
    });
  },

  // Input handlers
  inputRegion: function (e) {
    this.setData({
      'filters.region': e.detail.value
    });
  },

  startDateChange: function (e) {
    this.setData({
      'filters.dateRange.start': e.detail.value
    });
  },

  endDateChange: function (e) {
    this.setData({
      'filters.dateRange.end': e.detail.value
    });
  },

  // Register for event
  registerEvent: function (e) {
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
        wx.navigateTo({
          url: '/pages/user-related/login/login'
        });
      }, 1500);
      return;
    }

    // 检查赛事状态
    if (event.status !== 'published' && event.status !== 'registration') {
      wx.showToast({
        title: '该赛事不在报名期',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认报名',
      content: `确定要报名参加 ${event.title || event.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processEventRegistration(id, event);
        }
      }
    });
  },

  // 处理赛事报名流程
  processEventRegistration: function (eventId, event) {
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
            content: `您已成功报名 ${event.title || event.name}，请关注赛事通知和缴费信息。`,
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

  // Tab system methods
  initTabSystem: function () {
    // Initialize tab system with user authentication check
    const isLoggedIn = this.data.isLoggedIn;
    console.log('初始化Tab系统，登录状态:', isLoggedIn);

    const tabs = this.data.tabs.map(tab => {
      const needsAuth = tab.requiresAuth;
      const shouldDisable = needsAuth && !isLoggedIn;

      console.log(`Tab ${tab.id}: requiresAuth=${needsAuth}, isLoggedIn=${isLoggedIn}, disabled=${shouldDisable}`);

      if (shouldDisable) {
        return { ...tab, disabled: true };
      }
      return { ...tab, disabled: false };
    });

    this.setData({ tabs });

    // 强制更新页面
    this.$forceUpdate && this.$forceUpdate();
  },

  // Simple button navigation handler
  onButtonNavClick: function (e) {
    const tabId = e.currentTarget.dataset.tabId;

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

    // Switch to new tab
    this.setData({ activeTab: tabId });

    // Load tab data
    this.loadTabData(tabId);
  },

  loadTabData: function (tabId) {
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

  loadAllEvents: function () {
    this.setData({
      events: [],
      currentPage: 1,
      hasMore: true
    });
    this.loadEvents();
  },

  loadSearchData: function () {
    // Initialize search tab
    this.setData({
      searchQuery: '',
      showSearch: true
    });
  },

  loadCreateData: function () {
    // Check login status first
    if (!this.data.isLoggedIn) {
      console.log('用户未登录，无法创建赛事');
      return;
    }

    // Initialize create form data
    if (!this.data.eventData) {
      this.setData({
        eventData: {
          name: '',
          eventType: '',
          venue: '',
          court: '',
          region: '',
          description: '',
          eventDate: '',
          registrationDeadline: '',
          isPublic: true
        },
        submitting: false
      });
    }
  },

  loadMyEvents: function () {
    if (!this.data.isLoggedIn) {
      console.log('用户未登录，无法加载我的赛事');
      return;
    }

    console.log('🔍 开始加载我的赛事...');

    // Load user events
    API.getUserEvents({ type: 'all', page: 1, limit: 20 }).then(res => {
      console.log('📊 getUserEvents API响应:', res);

      if (res.success && res.data) {
        console.log('📋 原始数据结构:', res.data);

        // 后端返回的是关系数据，需要提取事件信息
        const relations = res.data.events || [];
        console.log('🔗 关联关系数量:', relations.length);
        console.log('🔗 关联关系详情:', relations);

        const events = relations.map((relation, index) => {
          console.log(`🔍 处理关联关系 ${index}:`, relation);
          const event = relation.event;
          console.log(`📋 赛事数据 ${index}:`, event);

          if (event) {
            const processedEvent = {
              ...event,
              _id: event._id,
              title: event.title,
              category: event.category,
              start_time: event.start_time,
              end_time: event.end_time,
              location: event.location,
              status: event.status,
              // 添加用户相关信息
              signup_status: relation.signup_status,
              signup_time: relation.signup_time,
              is_signin: relation.is_signin,
              points: relation.points
            };
            console.log(`✅ 处理后的赛事 ${index}:`, processedEvent);
            return processedEvent;
          } else {
            console.log(`❌ 赛事数据为空 ${index}`);
          }
          return null;
        }).filter(Boolean);

        console.log('处理后的用户赛事:', events);
        this.setData({
          userEvents: events,
          'tabData.my.events': events  // 修复数据绑定
        });
        console.log('✅ 数据已设置到 tabData.my.events');
      }
    }).catch(err => {
      console.error('获取用户赛事失败:', err);
    });
  },

  loadPopularEvents: function () {
    // Load popular events
    const params = {
      page: 1,
      limit: this.data.pageSize,
      sortBy: 'popularity',
      sortOrder: 'desc'
    };

    API.getEvents(params)
      .then(res => {
        this.setData({
          popularEvents: res.data || []
        });
      })
      .catch(err => {
        console.error('Failed to load popular events:', err);
      });
  },

  // 表单输入处理方法
  inputName: function (e) {
    this.setData({
      'eventData.name': e.detail.value
    });
  },

  selectEventType: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'eventData.eventType': type
    });
  },

  inputVenue: function (e) {
    this.setData({
      'eventData.venue': e.detail.value
    });
  },

  inputCourt: function (e) {
    this.setData({
      'eventData.court': e.detail.value
    });
  },

  inputRegion: function (e) {
    this.setData({
      'eventData.region': e.detail.value
    });
  },

  inputDescription: function (e) {
    this.setData({
      'eventData.description': e.detail.value
    });
  },

  selectEventDate: function (e) {
    this.setData({
      'eventData.eventDate': e.detail.value
    });
  },

  selectDeadline: function (e) {
    this.setData({
      'eventData.registrationDeadline': e.detail.value
    });
  },

  togglePublic: function () {
    this.setData({
      'eventData.isPublic': !this.data.eventData.isPublic
    });
  },

  // 验证表单
  validateForm: function () {
    const { eventData } = this.data;

    if (!eventData.name.trim()) {
      wx.showToast({
        title: '请输入赛事名称',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.eventType) {
      wx.showToast({
        title: '请选择赛事类型',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.venue.trim()) {
      wx.showToast({
        title: '请输入场地',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.eventDate) {
      wx.showToast({
        title: '请选择比赛日期',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.registrationDeadline) {
      wx.showToast({
        title: '请选择报名截止日期',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 创建赛事
  createEvent: function () {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });

    // 转换前端字段名到后端期望的字段名
    const { eventData } = this.data;
    const apiData = {
      title: eventData.name,
      category: 'tennis', // 默认为网球
      start_time: eventData.eventDate + 'T09:00:00.000Z', // 默认上午9点开始
      end_time: eventData.eventDate + 'T17:00:00.000Z', // 默认下午5点结束
      location: `${eventData.venue} ${eventData.court}`.trim(),
      description: eventData.description || '',
      max_participants: 20, // 默认最大参与人数
      ext_info: {
        region: eventData.region,
        eventType: eventData.eventType,
        venue: eventData.venue,
        court: eventData.court,
        isPublic: eventData.isPublic,
        registrationDeadline: eventData.registrationDeadline
      }
    };

    console.log('发送到后端的数据:', apiData);

    // 调用API创建赛事
    API.createEvent(apiData)
      .then(res => {
        this.setData({ submitting: false });

        console.log('创建赛事成功:', res);

        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });

        // 创建成功后重置表单并刷新数据
        this.resetForm();

        // 刷新全部赛事列表
        this.loadAllEvents();

        // 刷新我的赛事列表
        this.loadMyEvents();

        // 切换到全部标签页显示新创建的赛事
        this.setData({ activeTab: 'all' });
      })
      .catch(err => {
        this.setData({ submitting: false });
        console.error('创建赛事失败:', err);

        wx.showToast({
          title: '创建失败，请重试',
          icon: 'none'
        });
      });
  },

  // 重置表单
  resetForm: function () {
    this.setData({
      eventData: {
        name: '',
        eventType: '',
        venue: '',
        court: '',
        region: '',
        description: '',
        eventDate: '',
        registrationDeadline: '',
        isPublic: true
      },
      submitting: false
    });
  },

  // 搜索功能
  onSearchInput: function (e) {
    this.setData({
      searchQuery: e.detail.value
    });
  },

  searchEvents: function () {
    const query = this.data.searchQuery.trim();
    if (!query) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    const params = {
      query: query,
      page: 1,
      limit: this.data.pageSize
    };

    API.searchEvents(params).then(res => {
      this.setData({
        events: res.data.events || [],
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

  // 切换我的赛事类型
  switchMyEventType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`tabData.my.type`]: type
    });
    this.loadMyEvents();
  }
});