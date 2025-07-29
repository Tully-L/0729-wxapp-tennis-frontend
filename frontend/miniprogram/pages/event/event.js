// event.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    // Event data
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
    isLoggedIn: false
  },
  
  onLoad: function() {
    // Check login status
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
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
  
  // Load events
  loadEvents: function() {
    if (this.data.loading) return Promise.resolve();
    
    this.setData({ loading: true });
    
    const params = {
      page: this.data.currentPage,
      pageSize: this.data.pageSize,
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
      pageSize: this.data.pageSize,
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
      url: '/pages/event-create/event-create'
    });
  },
  
  // Register for event
  registerEvent: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: '报名功能即将上线',
      icon: 'none'
    });
  }
}); 