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
    console.log('🏠 首页加载开始');
    
    // 简单直接的方式 - 先测试能否显示任何数据
    this.testLoadEvents();
    
    // 同时尝试强制使用本地数据测试
    this.testLocalData();
  },
  
  // 简单的测试加载
  testLoadEvents: function() {
    console.log('📱 开始测试加载事件');
    this.setData({ loading: true });
    
    // 最简单的API调用
    const params = { page: 1, limit: 10 };
    
    console.log('📤 发送参数:', params);
    
    API.getEvents(params)
      .then(res => {
        console.log('📥 首页完整API响应:', JSON.stringify(res, null, 2));
        console.log('📊 首页响应数据结构:', {
          success: res.success,
          hasData: !!res.data,
          dataType: typeof res.data,
          dataKeys: res.data ? Object.keys(res.data) : null,
          hasEvents: !!(res.data && res.data.events),
          eventsType: res.data && res.data.events ? typeof res.data.events : null,
          eventsIsArray: res.data && res.data.events ? Array.isArray(res.data.events) : false,
          eventsLength: res.data && res.data.events ? res.data.events.length : 0,
          hasFilters: !!(res.data && res.data.filters),
          filters: res.data && res.data.filters ? res.data.filters : null
        });
        
        // 尝试多种数据提取方式 - 修复数据结构问题
        let eventsArray = [];
        
        // 首先检查是否有 res.data.events（真实API响应格式）
        if (res.data && res.data.events && Array.isArray(res.data.events)) {
          eventsArray = res.data.events;
          console.log('✅ 方式1：使用 res.data.events（真实API格式），获得', eventsArray.length, '个事件');
        }
        // 然后检查 res.data 是否直接是数组（模拟API响应格式）
        else if (res.data && Array.isArray(res.data)) {
          eventsArray = res.data;
          console.log('✅ 方式2：使用 res.data（模拟API格式），获得', eventsArray.length, '个事件');
        }
        // 检查是否有 res.events（备用格式）
        else if (res.events && Array.isArray(res.events)) {
          eventsArray = res.events;
          console.log('✅ 方式3：使用 res.events（备用格式），获得', eventsArray.length, '个事件');
        }
        // 最后尝试直接使用 res 本身
        else if (Array.isArray(res)) {
          eventsArray = res;
          console.log('✅ 方式4：使用 res（直接数组格式），获得', eventsArray.length, '个事件');
        }
        else {
          console.log('❌ 所有方式都无法提取事件数据');
          console.log('📊 完整响应对象:', res);
          console.log('📊 res的属性:', Object.keys(res));
          if (res.data) {
            console.log('📊 res.data的类型:', typeof res.data);
            console.log('📊 res.data的属性:', typeof res.data === 'object' ? Object.keys(res.data) : 'not an object');
            console.log('📊 res.data的内容:', res.data);
          }
        }
        
        // 如果找到了数组数据，进行处理
        if (eventsArray.length > 0) {
          console.log('🎯 成功找到', eventsArray.length, '个事件，第一个事件的结构:');
          console.log('📝 第一个事件:', eventsArray[0]);
        }
        
        this.setData({
          events: eventsArray,
          loading: false
        });
      })
      .catch(err => {
        console.error('❌ API调用失败:', err);
        this.setData({
          events: [],
          loading: false
        });
      });
  },

  // 测试本地数据 - 验证UI渲染是否正常
  testLocalData: function() {
    console.log('🧪 测试本地数据渲染');
    
    const testEvents = [
      {
        _id: 'test_1',
        title: '测试赛事1',
        name: '测试赛事1',
        status: 'published',
        category: 'tennis',
        start_time: '2024-08-10T09:00:00.000Z',
        location: '测试场地1',
        max_participants: 20,
        currentParticipants: 5,
        ext_info: {
          eventType: 'mens_singles'
        }
      },
      {
        _id: 'test_2',
        title: '测试赛事2',
        name: '测试赛事2',
        status: 'ongoing',
        category: 'tennis',
        start_time: '2024-08-12T14:00:00.000Z',
        location: '测试场地2',
        max_participants: 30,
        currentParticipants: 15,
        ext_info: {
          eventType: 'womens_doubles'
        }
      }
    ];
    
    console.log('🎯 设置测试数据到页面:', testEvents);
    
    // 先等待3秒再设置测试数据，这样可以看到API调用的结果
    setTimeout(() => {
      console.log('⏰ 3秒后设置测试数据');
      this.setData({
        events: testEvents,
        loading: false
      });
    }, 3000);
  },

  // 尝试最简单的API调用
  trySimpleAPICall: function() {
    console.log('🚀 尝试最简单的API调用');
    const simpleParams = { page: 1, limit: 10 };
    console.log('📤 简单参数:', simpleParams);
    
    API.getEvents(simpleParams).then(res => {
      console.log('📥 简单API调用结果:', res);
      if (res.data.events && res.data.events.length > 0) {
        console.log('✅ 简单API调用成功，获得', res.data.events.length, '个事件');
      } else {
        console.log('❌ 简单API调用仍然返回空数组');
      }
    }).catch(err => {
      console.error('❌ 简单API调用失败:', err);
    });
  },

  // 尝试搜索API看看是否不同
  trySearchAPI: function() {
    console.log('🔍 尝试搜索API');
    const searchParams = { query: '', page: 1, limit: 10 };
    console.log('📤 搜索参数:', searchParams);
    
    API.searchEvents(searchParams).then(res => {
      console.log('📥 搜索API调用结果:', res);
      if (res.data && res.data.length > 0) {
        console.log('✅ 搜索API成功，获得', res.data.length, '个事件');
      } else {
        console.log('❌ 搜索API也返回空数组');
      }
    }).catch(err => {
      console.error('❌ 搜索API调用失败:', err);
    });
  },

  // 直接使用wx.request绕过API封装层
  tryDirectRequest: function() {
    console.log('🔧 尝试直接wx.request绕过API封装');
    
    wx.request({
      url: 'https://zero729-wxapp-tennis.onrender.com/api/events?page=1&limit=10',
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('📥 直接请求结果:', res);
        if (res.data && res.data.data && res.data.data.events) {
          console.log('✅ 直接请求成功，获得', res.data.data.events.length, '个事件');
          console.log('📊 直接请求的events:', res.data.data.events);
        } else {
          console.log('❌ 直接请求也返回空数组');
        }
      },
      fail: (err) => {
        console.error('❌ 直接请求失败:', err);
      }
    });
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
    console.log('🏠 首页参数详细分析:', {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      eventType: params.eventType,
      region: params.region,
      status: params.status,
      feeRange: params.feeRange,
      timeRange: params.timeRange,
      participantRange: params.participantRange,
      registrationStatus: params.registrationStatus,
      hasDateRange: !!params.dateRange,
      dateRangeStart: params.dateRange?.start,
      dateRangeEnd: params.dateRange?.end,
      filtersSpreadResult: JSON.stringify(this.data.filters)
    });
    
    return API.getEvents(params)
      .then(res => {
        console.log('🏠 首页获取到的赛事数据 (复制事件页面逻辑):', res);
        
        // 改进的数据处理逻辑 - 支持多种API响应格式
        let eventsArray = [];
        
        if (res.data && res.data.events && Array.isArray(res.data.events)) {
          eventsArray = res.data.events;
        } else if (res.data && Array.isArray(res.data)) {
          eventsArray = res.data;
        } else if (res.events && Array.isArray(res.events)) {
          eventsArray = res.events;
        } else if (Array.isArray(res)) {
          eventsArray = res;
        } else {
          console.warn('🚨 loadEvents: 无法提取事件数据，返回空数组');
          eventsArray = [];
        }
        
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
        // 改进的数据处理逻辑 - 支持多种API响应格式
        let eventsArray = [];
        
        if (res.data && res.data.events && Array.isArray(res.data.events)) {
          eventsArray = res.data.events;
        } else if (res.data && Array.isArray(res.data)) {
          eventsArray = res.data;
        } else if (res.events && Array.isArray(res.events)) {
          eventsArray = res.events;
        } else if (Array.isArray(res)) {
          eventsArray = res;
        } else {
          console.warn('🚨 loadMoreEvents: 无法提取事件数据，返回空数组');
          eventsArray = [];
        }
        
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