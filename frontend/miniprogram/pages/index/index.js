// index.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    // Events data
    events: [],
    pageSize: 6,
    currentPage: 1,
    hasMore: true,
    loading: false,
    
    // Filter options - EXACTLY match event page structure
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
    
    // Sorting - EXACTLY match event page
    sortBy: 'eventDate',
    sortOrder: 'desc',
    showFilter: false,
    showSearch: false,
    searchQuery: '',
    eventTypes: [
      { id: '', name: '全部类型' },
      { id: 'mens_singles', name: '男子单打' },
      { id: 'womens_singles', name: '女子单打' },
      { id: 'mens_doubles', name: '男子双打' },
      { id: 'womens_doubles', name: '女子双打' },
      { id: 'mixed_doubles', name: '混合双打' }
    ]
  },
  
  onLoad: function() {
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
      limit: this.data.pageSize,
      sortBy: this.data.sortBy,
      sortOrder: this.data.sortOrder,
      ...this.data.filters
    };
    
    // Override any server-side default filters explicitly
    const cleanParams = {
      page: this.data.currentPage,
      limit: this.data.pageSize,
      sortBy: this.data.sortBy,
      sortOrder: this.data.sortOrder,
      eventType: '',
      region: '',
      status: '',
      feeRange: '',
      timeRange: '',
      participantRange: '',
      registrationStatus: ''
    };
    
    console.log('🏠 首页发送的请求参数:', cleanParams);
    return API.getEvents(cleanParams)
      .then(res => {
        console.log('🏠 首页获取到的赛事数据:', res);
        
        // 提取真实的赛事数组
        let eventsArray = res.data.events || res.data || [];
        
        console.log('📊 提取的赛事数组:', eventsArray);
        console.log('📊 赛事数组长度:', eventsArray.length);
        
        // 对赛事数据进行中文化处理
        eventsArray = eventsArray.map(event => ({
          ...event,
          eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType),
          start_time: this.formatEventTime(event.start_time)
        }));
        
        console.log('✅ 处理后的赛事数据:', eventsArray);
        
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
  
  // Load more events (pagination)
  loadMoreEvents: function() {
    if (this.data.loading) return;
    
    this.setData({
      currentPage: this.data.currentPage + 1,
      loading: true
    });
    
    // Override any server-side default filters explicitly  
    const cleanParams = {
      page: this.data.currentPage,
      limit: this.data.pageSize,
      sortBy: this.data.sortBy,
      sortOrder: this.data.sortOrder,
      eventType: '',
      region: '',
      status: '',
      feeRange: '',
      timeRange: '',
      participantRange: '',
      registrationStatus: ''
    };
    
    console.log('🏠 首页loadMoreEvents发送的请求参数:', cleanParams);
    API.getEvents(cleanParams)
      .then(res => {
        console.log('🏠 首页loadMoreEvents获取到的赛事数据:', res);
        
        let eventsArray = res.data.events || res.data || [];
        
        console.log('📊 loadMoreEvents赛事数组:', eventsArray);
        
        // 对赛事数据进行中文化处理
        eventsArray = eventsArray.map(event => ({
          ...event,
          eventTypeText: this.getEventTypeText(event.category || event.ext_info?.eventType || event.eventType),
          start_time: this.formatEventTime(event.start_time)
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
        status: '',
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
  
  // Input handlers
  inputRegion: function(e) {
    this.setData({
      'filters.region': e.detail.value
    });
  },
  
  // Toggle search panel
  toggleSearch: function() {
    this.setData({
      showSearch: !this.data.showSearch
    });
  },
  
  // Search input handler
  onSearchInput: function(e) {
    this.setData({
      searchQuery: e.detail.value
    });
  },
  
  // Perform search
  onSearch: function() {
    const query = this.data.searchQuery.trim();
    if (!query) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    // For home page, we can use the search query as a filter
    this.setData({
      'filters.query': query,
      events: [],
      currentPage: 1,
      hasMore: true
    });
    
    this.loadEvents();
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
  
  // Event type text mapping
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

  // Format event time for display
  formatEventTime: function(timeString) {
    if (!timeString) return '';
    
    try {
      const date = new Date(timeString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[date.getDay()];
      
      const formatNumber = (n) => n < 10 ? '0' + n : n.toString();
      
      return `${month}月${day}日(${weekday})${formatNumber(hour)}:${formatNumber(minute)}`;
    } catch (e) {
      return timeString;
    }
  }
}); 
 