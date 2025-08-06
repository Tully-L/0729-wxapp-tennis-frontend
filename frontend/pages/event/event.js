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

    // Tab data structure
    tabData: {
      all: {
        events: [],
        loading: false
      },
      search: {
        query: '',
        results: [],
        searchHistory: []
      },
      my: {
        events: [],
        type: 'all',
        loading: false
      },
      popular: {
        events: [],
        loading: false
      }
    },

    // Filter options
    filters: {
      eventType: '',
      region: '',
      status: '',
      feeRange: '',
      timeRange: '',
      participantRange: '',
      registrationStatus: '',
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
    statusOptions: [
      { id: '', name: '全部状态' },
      { id: 'published', name: '报名中' },
      { id: 'ongoing', name: '进行中' },
      { id: 'ended', name: '已结束' },
      { id: 'canceled', name: '已取消' }
    ],
    feeRangeOptions: [
      { id: '', name: '全部费用' },
      { id: 'free', name: '免费' },
      { id: '0-30', name: '0-30元' },
      { id: '30-50', name: '30-50元' },
      { id: '50-100', name: '50-100元' },
      { id: '100-200', name: '100-200元' },
      { id: '200-300', name: '200-300元' },
      { id: '300+', name: '300元以上' }
    ],
    timeRangeOptions: [
      { id: '', name: '全部时间' },
      { id: 'today', name: '今天' },
      { id: 'tomorrow', name: '明天' },
      { id: 'this_week', name: '本周' },
      { id: 'next_week', name: '下周' },
      { id: 'this_month', name: '本月' },
      { id: 'next_month', name: '下月' }
    ],
    participantRangeOptions: [
      { id: '', name: '全部人数' },
      { id: '1-10', name: '1-10人' },
      { id: '10-20', name: '10-20人' },
      { id: '20-50', name: '20-50人' },
      { id: '50-100', name: '50-100人' },
      { id: '100+', name: '100人以上' }
    ],
    registrationStatusOptions: [
      { id: '', name: '全部状态' },
      { id: 'open', name: '可报名' },
      { id: 'almost_full', name: '即将满员' },
      { id: 'full', name: '已满员' },
      { id: 'closed', name: '报名关闭' }
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
      address: '',
      description: '',
      rules: '',
      prizes: '',
      eventDate: '',
      eventTime: '09:00',
      registrationDeadline: '',
      registrationDeadlineTime: '18:00',
      registrationFee: 0,
      isFree: true,
      maxParticipants: 20,
      organizerName: '',
      organizerPhone: '',
      organizerEmail: '',
      isPublic: true
    },
    submitting: false,

    // Component states
    loading: false,
    error: '',
    
    // Sorting
    sortBy: 'eventDate',
    sortOrder: 'desc'
  },

  onLoad: function () {
    this.checkAndUpdateLoginStatus();

    // Initialize tab system
    this.initTabSystem();

    // Load initial tab data - 首页默认显示全部赛事数据
    this.loadTabData(this.data.activeTab);
    
    // 确保首页显示真实赛事数据
    this.loadAllEvents();
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
      sortBy: this.data.sortBy,
      sortOrder: this.data.sortOrder,
      ...this.data.filters
    };

    console.log('🏆 事件页面发送的请求参数:', params);
    return API.getEvents(params)
      .then(res => {
        console.log('🏆 事件页面获取到的赛事数据:', res);
        // 提取真实的赛事数组
        let eventsArray = res.data.events || res.data || [];
        
        // 对赛事数据进行中文化处理
        eventsArray = eventsArray.map(event => ({
          ...event,
          eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType)
        }));

        this.setData({
          events: eventsArray,
          'tabData.all.events': eventsArray,
          hasMore: eventsArray.length === this.data.pageSize,
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
        status: '',
        feeRange: '',
        timeRange: '',
        participantRange: '',
        registrationStatus: '',
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
    const searchHistory = wx.getStorageSync('searchHistory') || [];
    this.setData({
      searchQuery: '',
      showSearch: true,
      'tabData.search.searchHistory': searchHistory
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
      return;
    }

    // Load user events
    API.getUserEvents({ type: 'all', page: 1, limit: 20 }).then(res => {
      if (res.success && res.data) {
        // 后端返回的是关系数据，需要提取事件信息
        const relations = res.data.events || [];

        const events = relations.map(relation => {
          const event = relation.event;

          if (event) {
            return {
              ...event,
              _id: event._id,
              title: event.title,
              category: event.category,
              start_time: event.start_time,
              end_time: event.end_time,
              location: event.location,
              status: event.status,
              // 添加中文化的赛事类型
              eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType),
              // 添加用户相关信息
              signup_status: relation.signup_status,
              signup_time: relation.signup_time,
              is_signin: relation.is_signin,
              points: relation.points
            };
          }
          return null;
        }).filter(Boolean);

        this.setData({
          userEvents: events,
          'tabData.my.events': events
        });
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
        let eventsArray = res.data.events || res.data || [];
        
        // 对热门赛事数据进行中文化处理
        eventsArray = eventsArray.map(event => ({
          ...event,
          eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType)
        }));

        this.setData({
          popularEvents: eventsArray,
          'tabData.popular.events': eventsArray
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

  inputAddress: function (e) {
    this.setData({
      'eventData.address': e.detail.value
    });
  },

  inputDescription: function (e) {
    this.setData({
      'eventData.description': e.detail.value
    });
  },

  inputRules: function (e) {
    this.setData({
      'eventData.rules': e.detail.value
    });
  },

  inputPrizes: function (e) {
    this.setData({
      'eventData.prizes': e.detail.value
    });
  },

  selectEventDate: function (e) {
    this.setData({
      'eventData.eventDate': e.detail.value
    });
  },

  selectEventTime: function (e) {
    this.setData({
      'eventData.eventTime': e.detail.value
    });
  },

  selectDeadline: function (e) {
    this.setData({
      'eventData.registrationDeadline': e.detail.value
    });
  },

  selectDeadlineTime: function (e) {
    this.setData({
      'eventData.registrationDeadlineTime': e.detail.value
    });
  },

  toggleFree: function (e) {
    const isFree = e.detail.value;
    this.setData({
      'eventData.isFree': isFree,
      'eventData.registrationFee': isFree ? 0 : this.data.eventData.registrationFee
    });
  },

  inputRegistrationFee: function (e) {
    this.setData({
      'eventData.registrationFee': parseFloat(e.detail.value) || 0
    });
  },

  inputMaxParticipants: function (e) {
    this.setData({
      'eventData.maxParticipants': parseInt(e.detail.value) || 20
    });
  },

  inputOrganizerName: function (e) {
    this.setData({
      'eventData.organizerName': e.detail.value
    });
  },

  inputOrganizerPhone: function (e) {
    this.setData({
      'eventData.organizerPhone': e.detail.value
    });
  },

  inputOrganizerEmail: function (e) {
    this.setData({
      'eventData.organizerEmail': e.detail.value
    });
  },

  togglePublic: function (e) {
    this.setData({
      'eventData.isPublic': e.detail.value
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

    if (!eventData.organizerName.trim()) {
      wx.showToast({
        title: '请输入组织者姓名',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.organizerPhone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return false;
    }

    // 验证电话号码格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(eventData.organizerPhone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
      return false;
    }

    // 验证邮箱格式（如果填写了邮箱）
    if (eventData.organizerEmail && eventData.organizerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(eventData.organizerEmail)) {
        wx.showToast({
          title: '请输入正确的邮箱地址',
          icon: 'none'
        });
        return false;
      }
    }

    // 验证报名费用
    if (!eventData.isFree && eventData.registrationFee <= 0) {
      wx.showToast({
        title: '请输入正确的报名费用',
        icon: 'none'
      });
      return false;
    }

    // 验证最大参赛人数
    if (eventData.maxParticipants <= 0) {
      wx.showToast({
        title: '请输入正确的最大参赛人数',
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
    
    // 构建完整的开始和结束时间
    const startDateTime = `${eventData.eventDate}T${eventData.eventTime}:00.000Z`;
    const endDateTime = `${eventData.eventDate}T${eventData.eventTime.split(':')[0] < '18' ? '18:00' : '21:00'}:00.000Z`;
    
    // 构建报名截止时间
    const registrationDeadlineDateTime = `${eventData.registrationDeadline}T${eventData.registrationDeadlineTime}:00.000Z`;

    const apiData = {
      title: eventData.name,
      category: 'tennis', // 默认为网球
      start_time: startDateTime,
      end_time: endDateTime,
      location: eventData.address ? `${eventData.venue} ${eventData.address}`.trim() : `${eventData.venue} ${eventData.court}`.trim(),
      description: eventData.description || '',
      max_participants: eventData.maxParticipants || 20,
      ext_info: {
        region: eventData.region,
        eventType: eventData.eventType,
        venue: eventData.venue,
        court: eventData.court,
        address: eventData.address,
        rules: eventData.rules,
        prizes: eventData.prizes,
        registrationFee: eventData.isFree ? 0 : eventData.registrationFee,
        isFree: eventData.isFree,
        registrationDeadline: registrationDeadlineDateTime,
        organizer: {
          name: eventData.organizerName,
          phone: eventData.organizerPhone,
          email: eventData.organizerEmail
        },
        isPublic: eventData.isPublic,
        eventTime: eventData.eventTime,
        registrationDeadlineTime: eventData.registrationDeadlineTime
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
        address: '',
        description: '',
        rules: '',
        prizes: '',
        eventDate: '',
        eventTime: '09:00',
        registrationDeadline: '',
        registrationDeadlineTime: '18:00',
        registrationFee: 0,
        isFree: true,
        maxParticipants: 20,
        organizerName: '',
        organizerPhone: '',
        organizerEmail: '',
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

  // 执行搜索
  performSearch: function () {
    const query = this.data.searchQuery.trim();
    if (!query) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      loading: true,
      'tabData.search.results': []
    });

    const params = {
      query: query,
      page: 1,
      limit: this.data.pageSize
    };

    API.searchEvents(params).then(res => {
      let results = res.data.events || res.data || [];
      
      // 对搜索结果进行中文化处理
      results = results.map(event => ({
        ...event,
        eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType)
      }));
      
      // 保存搜索历史
      this.saveSearchHistory(query);
      
      this.setData({
        'tabData.search.results': results,
        'tabData.search.query': query,
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

  // 保存搜索历史
  saveSearchHistory: function(query) {
    let history = this.data.tabData.search.searchHistory || [];
    
    // 移除重复项
    history = history.filter(item => item !== query);
    
    // 添加到开头
    history.unshift(query);
    
    // 限制历史记录数量
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    this.setData({
      'tabData.search.searchHistory': history
    });
    
    // 保存到本地存储
    wx.setStorageSync('searchHistory', history);
  },

  // 从历史记录搜索
  searchFromHistory: function(e) {
    const query = e.currentTarget.dataset.query;
    this.setData({
      searchQuery: query
    });
    this.performSearch();
  },

  // 清除搜索历史
  clearSearchHistory: function() {
    this.setData({
      'tabData.search.searchHistory': []
    });
    wx.removeStorageSync('searchHistory');
  },

  // 点击搜索框外区域隐藏搜索
  hideSearchOnOutsideClick: function() {
    // 清除搜索焦点和结果，但保留搜索历史
    if (this.data.searchQuery || this.data.tabData.search.results.length > 0) {
      this.setData({
        searchQuery: '',
        'tabData.search.results': [],
        showSearch: false
      });
    }
  },

  // 防止搜索框点击事件冒泡
  preventHideSearch: function(e) {
    e.stopPropagation();
  },

  // 搜索框获取焦点
  onSearchFocus: function() {
    this.setData({
      showSearch: true
    });
  },

  // 搜索框失去焦点
  onSearchBlur: function() {
    // 延迟隐藏搜索状态，给点击搜索按钮留时间
    setTimeout(() => {
      if (!this.data.searchQuery && this.data.tabData.search.results.length === 0) {
        this.setData({
          showSearch: false
        });
      }
    }, 200);
  },

  // 切换我的赛事类型
  switchMyEventType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`tabData.my.type`]: type
    });
    this.loadMyEvents();
  },

  // 赛事类型中文化映射
  getEventTypeText: function(eventType) {
    const typeMap = {
      'mens_singles': '男子单打',
      'womens_singles': '女子单打', 
      'mens_doubles': '男子双打',
      'womens_doubles': '女子双打',
      'mixed_doubles': '混合双打',
      'tennis': '网球',
      'badminton': '羽毛球',
      'table_tennis': '乒乓球',
      'basketball': '篮球',
      'football': '足球',
      'volleyball': '排球',
      'ping_pong': '乒乓球',
      'swimming': '游泳',
      'running': '跑步',
      'cycling': '自行车',
      'golf': '高尔夫',
      'other': '其他运动'
    };
    return typeMap[eventType] || eventType || '未知类型';
  },

  // 排序功能
  changeSortBy: function(e) {
    const sortField = e.currentTarget.dataset.sort;
    let sortOrder = 'desc';
    
    // 如果点击的是当前排序字段，则切换排序顺序
    if (this.data.sortBy === sortField) {
      sortOrder = this.data.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    this.setData({
      sortBy: sortField,
      sortOrder: sortOrder,
      events: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadEvents();
  },

  // 切换到创建标签页
  switchToCreateTab: function() {
    this.setData({ activeTab: 'create' });
    this.loadTabData('create');
  },

  // 切换热门赛事时间范围
  switchPopularTimeRange: function(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({
      'tabData.popular.timeRange': range
    });
    this.loadPopularEvents();
  }
});