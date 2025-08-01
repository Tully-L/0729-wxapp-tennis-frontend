// region-search.js - 地区搜索组件
Component({
  properties: {
    // 搜索框占位符
    placeholder: {
      type: String,
      value: '搜索城市或地区'
    },
    
    // 是否显示热门地区
    showHotRegions: {
      type: Boolean,
      value: true
    },
    
    // 是否显示最近搜索
    showRecentSearches: {
      type: Boolean,
      value: true
    },
    
    // 最大搜索建议数量
    maxSuggestions: {
      type: Number,
      value: 10
    },
    
    // 搜索延迟（毫秒）
    searchDelay: {
      type: Number,
      value: 300
    }
  },

  data: {
    searchValue: '',
    showSuggestions: false,
    suggestions: [],
    hotRegions: [],
    recentSearches: [],
    loading: false,
    showEmptyState: false,
    emptyText: '暂无搜索结果',
    searchTimer: null
  },

  lifetimes: {
    attached() {
      this.loadHotRegions();
      this.loadRecentSearches();
    },
    
    detached() {
      if (this.data.searchTimer) {
        clearTimeout(this.data.searchTimer);
      }
    }
  },

  methods: {
    // 搜索输入事件
    onSearchInput(e) {
      const value = e.detail.value;
      this.setData({ searchValue: value });
      
      // 清除之前的定时器
      if (this.data.searchTimer) {
        clearTimeout(this.data.searchTimer);
      }
      
      // 设置新的搜索定时器
      const timer = setTimeout(() => {
        this.performSearch(value);
      }, this.properties.searchDelay);
      
      this.setData({ searchTimer: timer });
    },

    // 搜索框获得焦点
    onSearchFocus() {
      if (this.data.searchValue) {
        this.setData({ showSuggestions: true });
      } else {
        this.setData({ 
          showSuggestions: false,
          showEmptyState: false 
        });
      }
    },

    // 搜索框失去焦点
    onSearchBlur() {
      // 延迟隐藏建议列表，以便点击建议项
      setTimeout(() => {
        this.setData({ showSuggestions: false });
      }, 200);
    },

    // 搜索确认
    onSearchConfirm(e) {
      const value = e.detail.value.trim();
      if (value) {
        this.performSearch(value, true);
        this.saveRecentSearch(value);
      }
    },

    // 清除搜索
    clearSearch() {
      this.setData({
        searchValue: '',
        showSuggestions: false,
        suggestions: [],
        showEmptyState: false
      });
      
      this.triggerEvent('clear');
    },

    // 执行搜索
    async performSearch(query, isConfirm = false) {
      if (!query.trim()) {
        this.setData({
          suggestions: [],
          showSuggestions: false,
          showEmptyState: false
        });
        return;
      }

      this.setData({ loading: true });

      try {
        const suggestions = await this.searchRegions(query);
        
        this.setData({
          suggestions: suggestions.slice(0, this.properties.maxSuggestions),
          showSuggestions: suggestions.length > 0,
          showEmptyState: suggestions.length === 0,
          loading: false
        });

        if (isConfirm && suggestions.length > 0) {
          this.selectRegion(suggestions[0]);
        }
      } catch (error) {
        console.error('搜索地区失败:', error);
        this.setData({
          loading: false,
          showEmptyState: true,
          emptyText: '搜索失败，请重试'
        });
      }
    },

    // 搜索地区API调用
    async searchRegions(query) {
      try {
        const res = await wx.request({
          url: `${getApp().globalData.apiBaseUrl}/api/regions/search`,
          method: 'GET',
          data: {
            query: query,
            limit: this.properties.maxSuggestions
          },
          header: {
            'Content-Type': 'application/json'
          }
        });

        if (res.data.success) {
          return res.data.data;
        } else {
          throw new Error(res.data.message || '搜索失败');
        }
      } catch (error) {
        console.error('搜索地区API调用失败:', error);
        // 返回模拟数据作为备用
        return this.getMockRegions(query);
      }
    },

    // 获取模拟地区数据
    getMockRegions(query) {
      const allRegions = [
        { id: '110000', name: '北京市', type: 'province', fullPath: '北京市', matchCount: 156 },
        { id: '110100', name: '北京市区', type: 'city', fullPath: '北京市 > 北京市区', matchCount: 89 },
        { id: '110101', name: '东城区', type: 'district', fullPath: '北京市 > 北京市区 > 东城区', matchCount: 23 },
        { id: '110102', name: '西城区', type: 'district', fullPath: '北京市 > 北京市区 > 西城区', matchCount: 31 },
        { id: '310000', name: '上海市', type: 'province', fullPath: '上海市', matchCount: 134 },
        { id: '310100', name: '上海市区', type: 'city', fullPath: '上海市 > 上海市区', matchCount: 78 },
        { id: '310101', name: '黄浦区', type: 'district', fullPath: '上海市 > 上海市区 > 黄浦区', matchCount: 19 },
        { id: '440000', name: '广东省', type: 'province', fullPath: '广东省', matchCount: 298 },
        { id: '440100', name: '广州市', type: 'city', fullPath: '广东省 > 广州市', matchCount: 87 },
        { id: '440300', name: '深圳市', type: 'city', fullPath: '广东省 > 深圳市', matchCount: 112 }
      ];

      return allRegions.filter(region => 
        region.name.includes(query) || region.fullPath.includes(query)
      );
    },

    // 建议项点击
    onSuggestionTap(e) {
      const suggestion = e.currentTarget.dataset.suggestion;
      this.selectRegion(suggestion);
    },

    // 热门地区点击
    onHotRegionTap(e) {
      const region = e.currentTarget.dataset.region;
      this.selectRegion(region);
    },

    // 最近搜索点击
    onRecentSearchTap(e) {
      const search = e.currentTarget.dataset.search;
      this.setData({ searchValue: search.name });
      this.performSearch(search.name, true);
    },

    // 选择地区
    selectRegion(region) {
      this.setData({
        searchValue: region.name,
        showSuggestions: false,
        showEmptyState: false
      });
      
      this.saveRecentSearch(region.name, region);
      
      this.triggerEvent('select', {
        region: region,
        query: region.name
      });
    },

    // 获取建议图标
    getSuggestionIcon(type) {
      const icons = {
        province: '🏛️',
        city: '🏙️',
        district: '🏘️'
      };
      return icons[type] || '📍';
    },

    // 加载热门地区
    async loadHotRegions() {
      try {
        const res = await wx.request({
          url: `${getApp().globalData.apiBaseUrl}/api/regions/hot`,
          method: 'GET',
          data: {
            limit: 6
          },
          header: {
            'Content-Type': 'application/json'
          }
        });

        if (res.data.success) {
          this.setData({ hotRegions: res.data.data });
        } else {
          throw new Error(res.data.message || '获取热门地区失败');
        }
      } catch (error) {
        console.error('加载热门地区失败:', error);
        // 使用模拟数据作为备用
        const hotRegions = [
          { id: '110000', name: '北京', matchCount: 156 },
          { id: '310000', name: '上海', matchCount: 134 },
          { id: '440100', name: '广州', matchCount: 87 },
          { id: '440300', name: '深圳', matchCount: 112 },
          { id: '330100', name: '杭州', matchCount: 76 },
          { id: '320100', name: '南京', matchCount: 65 }
        ];

        this.setData({ hotRegions });
      }
    },

    // 加载最近搜索
    loadRecentSearches() {
      try {
        const recentSearches = wx.getStorageSync('region_recent_searches') || [];
        this.setData({ recentSearches });
      } catch (error) {
        console.error('加载最近搜索失败:', error);
      }
    },

    // 保存最近搜索
    saveRecentSearch(name, region = null) {
      try {
        let recentSearches = wx.getStorageSync('region_recent_searches') || [];
        
        // 移除重复项
        recentSearches = recentSearches.filter(item => item.name !== name);
        
        // 添加到开头
        recentSearches.unshift({
          name: name,
          region: region,
          timestamp: Date.now()
        });
        
        // 限制数量
        recentSearches = recentSearches.slice(0, 10);
        
        wx.setStorageSync('region_recent_searches', recentSearches);
        this.setData({ recentSearches });
      } catch (error) {
        console.error('保存最近搜索失败:', error);
      }
    },

    // 清除最近搜索
    clearRecentSearches() {
      try {
        wx.removeStorageSync('region_recent_searches');
        this.setData({ recentSearches: [] });
      } catch (error) {
        console.error('清除最近搜索失败:', error);
      }
    },

    // 格式化时间
    formatTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`;
      } else {
        return `${Math.floor(diff / 86400000)}天前`;
      }
    }
  }
});
