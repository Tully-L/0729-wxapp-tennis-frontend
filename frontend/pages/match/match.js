// match.js - 比赛页面固定标签栏
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    // Tab system
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
    
    // Filter and stats
    matchFilters: [
      { id: 'all', name: '全部', icon: '📋' },
      { id: 'singles', name: '单打', icon: '👤' },
      { id: 'doubles', name: '双打', icon: '👥' },
      { id: 'mixed', name: '混双', icon: '⚤' }
    ],
    currentFilter: 'all',
    matchStats: null,
    
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
    
    // Initialize tab system
    this.initTabSystem();
    
    // Initialize touch gestures
    this.initTouchGestures();
    
    // Load initial data
    this.loadTabData(this.data.activeTab);
  }
});  // T
ab system methods
  initTabSystem: function() {
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

  onTabChange: function(e) {
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

  loadTabData: function(tabId) {
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
  initTouchGestures: function() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 50;
    this.maxVerticalDistance = 100;
  },

  onTouchStart: function(e) {
    if (e.touches && e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  },

  onTouchMove: function(e) {
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

  onTouchEnd: function(e) {
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

  switchToTab: function(tabId) {
    if (tabId === this.data.activeTab) return;
    
    const previousTab = this.data.activeTab;
    this.saveScrollPosition(previousTab);
    this.setData({ activeTab: tabId });
    this.loadTabData(tabId);
    
    setTimeout(() => {
      this.restoreScrollPosition(tabId);
    }, 100);
  },

  triggerHapticFeedback: function() {
    try {
      wx.vibrateShort({ type: 'light' });
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },

  saveScrollPosition: function(tabId) {
    wx.createSelectorQuery()
      .selectViewport()
      .scrollOffset()
      .exec((res) => {
        if (res[0]) {
          this.scrollPositions[tabId] = res[0].scrollTop;
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
  }
});