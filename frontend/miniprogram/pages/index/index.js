// index.js - 首页 (完全重建，复制事件页面工作逻辑)
const { API } = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    // Events data - 完全复制事件页面结构
    events: [],
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    loading: false,
    
    // Filter options - 完全复制事件页面结构
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
    
    // Sorting - 完全复制事件页面结构
    sortBy: 'eventDate',
    sortOrder: 'desc'
  },

  onLoad: function() {
    // 直接加载事件，复制事件页面的loadAllEvents逻辑
    this.setData({
      events: [],
      currentPage: 1,
      hasMore: true
    });
    this.loadEvents();
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

  // 完全复制事件页面的loadEvents函数
  loadEvents: function() {
    if (this.data.loading) return Promise.resolve();

    this.setData({ loading: true });

    const params = {
      page: this.data.currentPage,
      limit: this.data.pageSize,
      sortBy: this.data.sortBy,
      sortOrder: this.data.sortOrder,
      ...this.data.filters
    };

    console.log('🏠 首页发送的请求参数 (复制事件页面逻辑):', params);
    
    return API.getEvents(params)
      .then(res => {
        console.log('🏠 首页获取到的赛事数据 (复制事件页面逻辑):', res);
        
        // 完全复制事件页面的数据处理逻辑
        let eventsArray = res.data.events || res.data || [];
        
        // 对赛事数据进行中文化处理
        eventsArray = eventsArray.map(event => ({
          ...event,
          eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType)
        }));

        this.setData({
          events: eventsArray,
          hasMore: eventsArray.length === this.data.pageSize,
          loading: false
        });
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        this.setData({ loading: false });
      });
  },

  // 完全复制事件页面的loadMoreEvents函数
  loadMoreEvents: function() {
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
        let eventsArray = res.data.events || res.data || [];
        
        // 对赛事数据进行中文化处理
        eventsArray = eventsArray.map(event => ({
          ...event,
          eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType)
        }));
        
        if (eventsArray.length > 0) {
          this.setData({
            events: [...this.data.events, ...eventsArray],
            hasMore: eventsArray.length === this.data.pageSize,
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

  // Navigate to event detail page
  goToEventDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${id}`
    });
  },

  // Navigate to other pages
  goToLeagueIntro: function() {
    wx.showToast({
      title: '联盟介绍功能即将上线',
      icon: 'none'
    });
  },

  goToBrandEvents: function() {
    // Navigate to event page
    wx.switchTab({
      url: '/pages/event/event'
    });
  },

  goToPlayerRanking: function() {
    wx.showToast({
      title: '球员排名功能即将上线',
      icon: 'none'
    });
  },

  goToPointsRanking: function() {
    wx.showToast({
      title: '积分榜功能即将上线',
      icon: 'none'
    });
  },

  // Close notice
  closeNotice: function() {
    // Hide the notice bar
    this.setData({
      showNotice: false
    });
  },

  // 完全复制事件页面的getEventTypeText函数
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
  }
});