// FixedTabBar Component - 固定标签栏组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 标签配置数组
    tabs: {
      type: Array,
      value: []
    },
    
    // 当前激活的标签ID
    activeTab: {
      type: String,
      value: ''
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
    
    // 是否启用触觉反馈
    enableHaptic: {
      type: Boolean,
      value: true
    },
    
    // 是否启用动画
    enableAnimation: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 内部状态
    isAnimating: false,
    lastActiveTab: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 标签点击处理
     */
    onTabTap: function(e) {
      const { tabId, index } = e.currentTarget.dataset;
      const tab = this.data.tabs[index];
      
      // 检查标签是否被禁用
      if (tab.disabled) {
        return;
      }
      
      // 检查是否需要认证
      if (tab.requiresAuth && !this.checkAuth()) {
        this.showAuthRequired();
        return;
      }
      
      // 如果点击的是当前激活的标签，不做处理
      if (tabId === this.data.activeTab) {
        return;
      }
      
      // 触觉反馈
      if (this.data.enableHaptic) {
        this.triggerHapticFeedback();
      }
      
      // 设置动画状态
      if (this.data.enableAnimation) {
        this.setData({
          isAnimating: true,
          lastActiveTab: this.data.activeTab
        });
        
        // 动画结束后重置状态
        setTimeout(() => {
          this.setData({
            isAnimating: false
          });
        }, 300);
      }
      
      // 触发标签切换事件
      this.triggerEvent('tabchange', {
        activeTab: tabId,
        previousTab: this.data.activeTab,
        tabData: tab,
        index: index
      });
      
      // 记录用户行为（用于分析）
      this.recordTabUsage(tabId, tab.name);
    },
    
    /**
     * 检查用户认证状态
     */
    checkAuth: function() {
      // 这里应该调用认证服务检查用户登录状态
      try {
        const app = getApp();
        return app.globalData.isLoggedIn || false;
      } catch (error) {
        console.error('检查认证状态失败:', error);
        return false;
      }
    },
    
    /**
     * 显示需要认证的提示
     */
    showAuthRequired: function() {
      wx.showModal({
        title: '需要登录',
        content: '此功能需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 跳转到登录页面
            wx.navigateTo({
              url: '/pages/user-related/login/login'
            });
          }
        }
      });
    },
    
    /**
     * 触发触觉反馈
     */
    triggerHapticFeedback: function() {
      try {
        wx.vibrateShort({
          type: 'light'
        });
      } catch (error) {
        // 忽略触觉反馈错误，不影响主要功能
        console.log('触觉反馈不可用');
      }
    },
    
    /**
     * 记录标签使用情况
     */
    recordTabUsage: function(tabId, tabName) {
      try {
        // 记录到本地存储用于分析
        const usage = wx.getStorageSync('tab_usage') || {};
        const today = new Date().toDateString();
        
        if (!usage[today]) {
          usage[today] = {};
        }
        
        if (!usage[today][tabId]) {
          usage[today][tabId] = {
            name: tabName,
            count: 0,
            lastUsed: new Date().toISOString()
          };
        }
        
        usage[today][tabId].count++;
        usage[today][tabId].lastUsed = new Date().toISOString();
        
        wx.setStorageSync('tab_usage', usage);
      } catch (error) {
        console.error('记录标签使用失败:', error);
      }
    },
    
    /**
     * 更新标签徽章
     */
    updateTabBadge: function(tabId, badgeCount) {
      const tabs = this.data.tabs.map(tab => {
        if (tab.id === tabId) {
          return {
            ...tab,
            badge: badgeCount
          };
        }
        return tab;
      });
      
      this.setData({
        tabs: tabs
      });
    },
    
    /**
     * 设置标签禁用状态
     */
    setTabDisabled: function(tabId, disabled) {
      const tabs = this.data.tabs.map(tab => {
        if (tab.id === tabId) {
          return {
            ...tab,
            disabled: disabled
          };
        }
        return tab;
      });
      
      this.setData({
        tabs: tabs
      });
    },
    
    /**
     * 获取标签使用统计
     */
    getTabUsageStats: function() {
      try {
        const usage = wx.getStorageSync('tab_usage') || {};
        return usage;
      } catch (error) {
        console.error('获取标签使用统计失败:', error);
        return {};
      }
    },

    /**
     * 初始化无障碍支持
     */
    initAccessibility: function() {
      // 为标签添加无障碍属性
      this.data.tabs.forEach((tab, index) => {
        const selector = `.tab-item:nth-child(${index + 1})`;
        this.createSelectorQuery()
          .select(selector)
          .node()
          .exec((res) => {
            if (res[0] && res[0].node) {
              const node = res[0].node;
              node.setAttribute('role', 'tab');
              node.setAttribute('aria-selected', tab.id === this.data.activeTab);
              node.setAttribute('aria-label', tab.name);
            }
          });
      });
    },
    
    /**
     * 标签切换处理
     */
    onTabChanged: function(newActiveTab, oldActiveTab) {
      // 更新无障碍属性
      this.updateAccessibilityStates(newActiveTab, oldActiveTab);
      
      // 触发自定义事件
      this.triggerEvent('tabchanged', {
        newTab: newActiveTab,
        oldTab: oldActiveTab,
        timestamp: Date.now()
      });
    },
    
    /**
     * 更新无障碍状态
     */
    updateAccessibilityStates: function(activeTab, previousTab) {
      this.data.tabs.forEach((tab, index) => {
        const selector = `.tab-item:nth-child(${index + 1})`;
        this.createSelectorQuery()
          .select(selector)
          .node()
          .exec((res) => {
            if (res[0] && res[0].node) {
              const node = res[0].node;
              node.setAttribute('aria-selected', tab.id === activeTab);
            }
          });
      });
    },
    
    /**
     * 验证标签配置
     */
    validateTabsConfig: function(tabs) {
      if (!Array.isArray(tabs)) {
        console.error('FixedTabBar: tabs 必须是数组');
        return false;
      }
      
      const requiredFields = ['id', 'name', 'icon'];
      const tabIds = new Set();
      
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        
        // 检查必需字段
        for (const field of requiredFields) {
          if (!tab[field]) {
            console.error(`FixedTabBar: 标签 ${i} 缺少必需字段 ${field}`);
            return false;
          }
        }
        
        // 检查ID唯一性
        if (tabIds.has(tab.id)) {
          console.error(`FixedTabBar: 标签ID ${tab.id} 重复`);
          return false;
        }
        tabIds.add(tab.id);
      }
      
      return true;
    },
    
    /**
     * 刷新标签状态
     */
    refreshTabStates: function() {
      // 检查认证状态并更新需要认证的标签
      const isLoggedIn = this.checkAuth();
      
      const tabs = this.data.tabs.map(tab => {
        if (tab.requiresAuth && !isLoggedIn) {
          return {
            ...tab,
            disabled: true
          };
        }
        return {
          ...tab,
          disabled: false
        };
      });
      
      this.setData({
        tabs: tabs
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached: function() {
      // 组件实例被放入页面节点树后执行
      console.log('FixedTabBar 组件已加载');
      
      // 初始化无障碍支持
      this.initAccessibility();
    },
    
    detached: function() {
      // 组件实例被从页面节点树移除后执行
      console.log('FixedTabBar 组件已卸载');
    }
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show: function() {
      // 页面被展示
      this.refreshTabStates();
    },
    
    hide: function() {
      // 页面被隐藏
    }
  },

  /**
   * 组件数据字段监听器
   */
  observers: {
    'activeTab': function(newActiveTab, oldActiveTab) {
      if (newActiveTab !== oldActiveTab && oldActiveTab) {
        // 标签切换时的处理
        this.onTabChanged(newActiveTab, oldActiveTab);
      }
    },
    
    'tabs': function(newTabs) {
      // 标签配置变化时的处理
      this.validateTabsConfig(newTabs);
    }
  }
});