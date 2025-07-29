// index.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    // Tab navigation
    tabs: ['进行中', '已完成', '即将开始'],
    activeTab: 0,
    
    // Match data
    matches: [],
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    loading: false,
    
    // Filter options
    filters: {
      eventType: '',
      player: '',
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
    
    // Status mapping
    statusMap: {
      0: 'ongoing',
      1: 'completed',
      2: 'upcoming'
    }
  },
  
  onLoad: function() {
    this.loadMatches();
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
    
    const params = {
      page: this.data.currentPage,
      pageSize: this.data.pageSize,
      status: this.data.statusMap[this.data.activeTab],
      ...this.data.filters
    };
    
    return API.getMatches(params)
      .then(res => {
        this.setData({
          matches: res.data,
          hasMore: res.data.length === this.data.pageSize,
          loading: false
        });
      })
      .catch(err => {
        console.error('Failed to load matches:', err);
        this.setData({ loading: false });
      });
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
      pageSize: this.data.pageSize,
      status: this.data.statusMap[this.data.activeTab],
      ...this.data.filters
    };
    
    API.getMatches(params)
      .then(res => {
        if (res.data.length > 0) {
          this.setData({
            matches: [...this.data.matches, ...res.data],
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
        console.error('Failed to load more matches:', err);
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
    wx.showToast({
      title: '报名功能即将上线',
      icon: 'none'
    });
  }
}); 
 