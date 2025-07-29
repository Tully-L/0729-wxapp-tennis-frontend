// TabContent Component - 标签内容组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前激活的标签ID
    activeTab: {
      type: String,
      value: '',
      observer: 'onActiveTabChange'
    },
    
    // 加载状态
    loading: {
      type: Boolean,
      value: false
    },
    
    // 错误信息
    error: {
      type: String,
      value: ''
    },
    
    // 加载文本
    loadingText: {
      type: String,
      value: '加载中...'
    },
    
    // 是否显示重试按钮
    showRetry: {
      type: Boolean,
      value: true
    },
    
    // 自定义样式类名
    className: {
      type: String,
      value: ''
    },
    
    // 自定义内联样式
    customStyle: {
      type: String,
      value: ''
    },
    
    // 是否启用懒加载
    enableLazyLoad: {
      type: Boolean,
      value: true
    },
    
    // 是否启用缓存
    enableCache: {
      type: Boolean,
      value: true
    },
    
    // 缓存过期时间（毫秒）
    cacheExpiry: {
      type: Number,
      value: 5 * 60 * 1000 // 5分钟
    },
    
    // 是否启用过渡动画
    enableTransition: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 内部状态
    isTransitioning: false,
    previousTab: '',
    
    // 缓存管理
    cache: {},
    cacheTimestamps: {},
    
    // 懒加载状态
    loadedTabs: [],
    
    // 性能监控
    performanceMetrics: {
      tabSwitchTimes: {},
      renderTimes: {},
      cacheHits: 0,
      cacheMisses: 0
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 激活标签变化处理
     */
    onActiveTabChange: function(newTab, oldTab) {
      if (newTab === oldTab) return;
      
      const startTime = Date.now();
      
      // 记录性能指标
      this.recordTabSwitch(newTab, oldTab, startTime);
      
      // 处理过渡动画
      if (this.data.enableTransition && oldTab) {
        this.handleTabTransition(newTab, oldTab);
      }
      
      // 懒加载处理
      if (this.data.enableLazyLoad) {
        this.handleLazyLoad(newTab);
      }
      
      // 缓存处理
      if (this.data.enableCache) {
        this.handleCache(newTab, oldTab);
      }
      
      // 更新内部状态
      this.setData({
        previousTab: oldTab || ''
      });
      
      // 触发标签切换事件
      this.triggerEvent('tabcontentchange', {
        activeTab: newTab,
        previousTab: oldTab,
        timestamp: startTime
      });
    },
    
    /**
     * 处理标签过渡动画
     */
    handleTabTransition: function(newTab, oldTab) {
      this.setData({
        isTransitioning: true
      });
      
      // 动画持续时间
      const transitionDuration = 300;
      
      setTimeout(() => {
        this.setData({
          isTransitioning: false
        });
      }, transitionDuration);
    },
    
    /**
     * 处理懒加载
     */
    handleLazyLoad: function(tabId) {
      const loadedTabs = this.data.loadedTabs;
      
      if (!loadedTabs.includes(tabId)) {
        // 标记为已加载
        loadedTabs.push(tabId);
        this.setData({
          loadedTabs: loadedTabs
        });
        
        // 触发懒加载事件
        this.triggerEvent('lazyload', {
          tabId: tabId,
          timestamp: Date.now()
        });
        
        // 记录缓存未命中
        this.data.performanceMetrics.cacheMisses++;
      } else {
        // 记录缓存命中
        this.data.performanceMetrics.cacheHits++;
      }
    },
    
    /**
     * 处理缓存
     */
    handleCache: function(newTab, oldTab) {
      const now = Date.now();
      const cache = this.data.cache;
      const timestamps = this.data.cacheTimestamps;
      
      // 检查新标签的缓存
      if (cache[newTab] && timestamps[newTab]) {
        const age = now - timestamps[newTab];
        if (age > this.data.cacheExpiry) {
          // 缓存过期，清除
          delete cache[newTab];
          delete timestamps[newTab];
          
          this.setData({
            cache: cache,
            cacheTimestamps: timestamps
          });
        }
      }
      
      // 清理过期缓存
      this.cleanExpiredCache();
    },
    
    /**
     * 清理过期缓存
     */
    cleanExpiredCache: function() {
      const now = Date.now();
      const cache = this.data.cache;
      const timestamps = this.data.cacheTimestamps;
      let cleaned = false;
      
      Object.keys(timestamps).forEach(tabId => {
        const age = now - timestamps[tabId];
        if (age > this.data.cacheExpiry) {
          delete cache[tabId];
          delete timestamps[tabId];
          cleaned = true;
        }
      });
      
      if (cleaned) {
        this.setData({
          cache: cache,
          cacheTimestamps: timestamps
        });
      }
    },
    
    /**
     * 记录标签切换性能
     */
    recordTabSwitch: function(newTab, oldTab, startTime) {
      const metrics = this.data.performanceMetrics;
      
      if (!metrics.tabSwitchTimes[newTab]) {
        metrics.tabSwitchTimes[newTab] = [];
      }
      
      metrics.tabSwitchTimes[newTab].push({
        from: oldTab,
        timestamp: startTime,
        duration: 0 // Will be updated when transition completes
      });
      
      // 限制记录数量，避免内存泄漏
      if (metrics.tabSwitchTimes[newTab].length > 10) {
        metrics.tabSwitchTimes[newTab].shift();
      }
    },
    
    /**
     * 重试按钮点击处理
     */
    onRetry: function() {
      // 清除错误状态
      this.setData({
        error: '',
        loading: true
      });
      
      // 触发重试事件
      this.triggerEvent('retry', {
        activeTab: this.data.activeTab,
        timestamp: Date.now()
      });
    },
    
    /**
     * 设置缓存数据
     */
    setCacheData: function(tabId, data) {
      if (!this.data.enableCache) return;
      
      const cache = this.data.cache;
      const timestamps = this.data.cacheTimestamps;
      
      cache[tabId] = data;
      timestamps[tabId] = Date.now();
      
      this.setData({
        cache: cache,
        cacheTimestamps: timestamps
      });
    },
    
    /**
     * 获取缓存数据
     */
    getCacheData: function(tabId) {
      if (!this.data.enableCache) return null;
      
      const cache = this.data.cache;
      const timestamps = this.data.cacheTimestamps;
      
      if (cache[tabId] && timestamps[tabId]) {
        const age = Date.now() - timestamps[tabId];
        if (age <= this.data.cacheExpiry) {
          return cache[tabId];
        }
      }
      
      return null;
    },
    
    /**
     * 清除指定标签的缓存
     */
    clearTabCache: function(tabId) {
      const cache = this.data.cache;
      const timestamps = this.data.cacheTimestamps;
      
      delete cache[tabId];
      delete timestamps[tabId];
      
      this.setData({
        cache: cache,
        cacheTimestamps: timestamps
      });
    },
    
    /**
     * 清除所有缓存
     */
    clearAllCache: function() {
      this.setData({
        cache: {},
        cacheTimestamps: {},
        loadedTabs: new Set()
      });
    },
    
    /**
     * 获取性能指标
     */
    getPerformanceMetrics: function() {
      return {
        ...this.data.performanceMetrics,
        cacheSize: Object.keys(this.data.cache).length,
        loadedTabsCount: this.data.loadedTabs.size
      };
    },
    
    /**
     * 预加载指定标签
     */
    preloadTab: function(tabId) {
      if (!this.data.enableLazyLoad) return;
      
      const loadedTabs = this.data.loadedTabs;
      if (!loadedTabs.has(tabId)) {
        loadedTabs.add(tabId);
        this.setData({
          loadedTabs: loadedTabs
        });
        
        // 触发预加载事件
        this.triggerEvent('preload', {
          tabId: tabId,
          timestamp: Date.now()
        });
      }
    },
    
    /**
     * 检查标签是否已加载
     */
    isTabLoaded: function(tabId) {
      return this.data.loadedTabs.has(tabId);
    },
    
    /**
     * 强制刷新标签内容
     */
    refreshTab: function(tabId) {
      // 清除缓存
      this.clearTabCache(tabId);
      
      // 从已加载列表中移除
      const loadedTabs = this.data.loadedTabs;
      loadedTabs.delete(tabId);
      this.setData({
        loadedTabs: loadedTabs
      });
      
      // 如果是当前激活的标签，重新加载
      if (tabId === this.data.activeTab) {
        this.handleLazyLoad(tabId);
      }
      
      // 触发刷新事件
      this.triggerEvent('refresh', {
        tabId: tabId,
        timestamp: Date.now()
      });
    },

    /**
     * 初始化性能监控
     */
    initPerformanceMonitoring: function() {
      // 设置定期清理缓存的定时器
      this.cacheCleanupTimer = setInterval(() => {
        this.cleanExpiredCache();
      }, 60000); // 每分钟清理一次
    },
    
    /**
     * 清理资源
     */
    cleanup: function() {
      // 清理定时器
      if (this.cacheCleanupTimer) {
        clearInterval(this.cacheCleanupTimer);
        delete this.cacheCleanupTimer;
      }
      
      // 清理缓存
      this.clearAllCache();
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached: function() {
      console.log('TabContent 组件已加载');
      
      // 初始化性能监控
      this.initPerformanceMonitoring();
    },
    
    detached: function() {
      console.log('TabContent 组件已卸载');
      
      // 清理资源
      this.cleanup();
    }
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show: function() {
      // 页面显示时清理过期缓存
      this.cleanExpiredCache();
    },
    
    hide: function() {
      // 页面隐藏时可以进行一些清理工作
    }
  },

  /**
   * 组件数据字段监听器
   */
  observers: {
    'loading': function(isLoading) {
      if (isLoading) {
        // 开始加载时记录时间
        this.loadStartTime = Date.now();
      } else {
        // 加载完成时计算耗时
        if (this.loadStartTime) {
          const duration = Date.now() - this.loadStartTime;
          const metrics = this.data.performanceMetrics;
          
          if (!metrics.renderTimes[this.data.activeTab]) {
            metrics.renderTimes[this.data.activeTab] = [];
          }
          
          metrics.renderTimes[this.data.activeTab].push(duration);
          
          // 限制记录数量
          if (metrics.renderTimes[this.data.activeTab].length > 10) {
            metrics.renderTimes[this.data.activeTab].shift();
          }
          
          delete this.loadStartTime;
        }
      }
    }
  }
});