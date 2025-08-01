// match-filter.js - 比赛筛选组件
Component({
  properties: {
    showFilter: {
      type: Boolean,
      value: false
    },
    initialFilters: {
      type: Object,
      value: {}
    }
  },

  data: {
    filters: {
      eventType: '',
      status: '',
      region: '',
      player: '',
      timeRange: 'all',
      startDate: '',
      endDate: ''
    },
    
    // 赛事项目选项
    eventTypes: [
      { id: 'mens_singles', name: '男子单打', icon: '🎾', count: 0 },
      { id: 'womens_singles', name: '女子单打', icon: '🎾', count: 0 },
      { id: 'mens_doubles', name: '男子双打', icon: '👥', count: 0 },
      { id: 'womens_doubles', name: '女子双打', icon: '👥', count: 0 },
      { id: 'mixed_doubles', name: '混合双打', icon: '👫', count: 0 }
    ],
    
    // 状态选项
    statusOptions: [
      { id: 'all', name: '全部', icon: '📋' },
      { id: 'upcoming', name: '即将开始', icon: '⏰' },
      { id: 'live', name: '进行中', icon: '🔴' },
      { id: 'completed', name: '已结束', icon: '✅' },
      { id: 'registration', name: '报名中', icon: '📝' }
    ],
    
    // 时间范围选项
    timeRangeOptions: [
      { id: 'all', name: '全部时间' },
      { id: 'today', name: '今天' },
      { id: 'tomorrow', name: '明天' },
      { id: 'this_week', name: '本周' },
      { id: 'next_week', name: '下周' },
      { id: 'this_month', name: '本月' },
      { id: 'custom', name: '自定义' }
    ],
    
    // 搜索建议
    regionSuggestions: [],
    playerSuggestions: [],

    // 时间选择器状态
    showTimePickerModal: false,

    // 筛选结果计数
    filteredCount: 0
  },

  lifetimes: {
    attached() {
      this.initializeFilters();
      this.loadFilterData();
    }
  },

  observers: {
    'showFilter': function(show) {
      if (show) {
        this.setData({
          'filters': { ...this.data.filters, ...this.properties.initialFilters }
        });
        this.updateFilteredCount();
      }
    }
  },

  methods: {
    // 初始化筛选器
    initializeFilters() {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      this.setData({
        'filters.startDate': this.formatDate(today),
        'filters.endDate': this.formatDate(tomorrow)
      });
    },

    // 加载筛选数据
    async loadFilterData() {
      try {
        // 加载赛事类型统计
        const eventStats = await this.getEventTypeStats();
        this.setData({
          eventTypes: this.data.eventTypes.map(type => ({
            ...type,
            count: eventStats[type.id]?.count || 0
          }))
        });
      } catch (error) {
        console.error('加载筛选数据失败:', error);
      }
    },

    // 获取赛事类型统计
    async getEventTypeStats() {
      try {
        const res = await wx.request({
          url: `${getApp().globalData.apiBaseUrl}/api/matches/event-type-stats`,
          method: 'GET',
          header: {
            'Content-Type': 'application/json'
          }
        });

        if (res.data.success) {
          return res.data.data;
        } else {
          throw new Error(res.data.message || '获取统计数据失败');
        }
      } catch (error) {
        console.error('获取赛事类型统计失败:', error);
        // 返回模拟数据作为备用
        return {
          mens_singles: { count: 45, name: '男子单打', icon: '🎾' },
          womens_singles: { count: 38, name: '女子单打', icon: '🎾' },
          mens_doubles: { count: 22, name: '男子双打', icon: '👥' },
          womens_doubles: { count: 18, name: '女子双打', icon: '👥' },
          mixed_doubles: { count: 15, name: '混合双打', icon: '👫' }
        };
      }
    },

    // 选择赛事项目
    selectEventType(e) {
      const type = e.currentTarget.dataset.type;
      this.setData({
        'filters.eventType': this.data.filters.eventType === type ? '' : type
      });
      this.updateFilteredCount();
    },

    // 选择状态
    selectStatus(e) {
      const status = e.currentTarget.dataset.status;
      this.setData({
        'filters.status': this.data.filters.status === status ? '' : status
      });
      this.updateFilteredCount();
    },

    // 地区选择事件
    onRegionSelect: function(e) {
      const { region, query } = e.detail;
      this.setData({
        'filters.region': region.name || query
      });
      this.updateFilteredCount();
    },

    // 地区清除事件
    onRegionClear: function() {
      this.setData({
        'filters.region': ''
      });
      this.updateFilteredCount();
    },

    // 显示时间选择器
    showTimePicker() {
      this.setData({
        showTimePickerModal: true
      });
    },

    // 时间选择器确认
    onTimePickerConfirm(e) {
      const { startDate, endDate, timeRange, digitalTime, preset, quick } = e.detail;

      this.setData({
        'filters.startDate': startDate,
        'filters.endDate': endDate,
        'filters.timeRange': quick || preset || 'custom',
        showTimePickerModal: false
      });

      this.updateFilteredCount();
    },

    // 时间选择器取消
    onTimePickerCancel() {
      this.setData({
        showTimePickerModal: false
      });
    },

    // 获取时间显示文本
    getTimeDisplayText() {
      const { startDate, endDate, timeRange } = this.data.filters;

      if (timeRange && timeRange !== 'custom') {
        const timeOption = this.data.timeRangeOptions.find(opt => opt.id === timeRange);
        if (timeOption) return timeOption.name;
      }

      if (startDate && endDate) {
        const start = this.formatDisplayDate(startDate);
        const end = this.formatDisplayDate(endDate);
        return `${start} 至 ${end}`;
      }

      if (startDate) {
        return `从 ${this.formatDisplayDate(startDate)}`;
      }

      return '选择时间范围';
    },

    // 格式化显示日期
    formatDisplayDate(dateStr) {
      if (!dateStr) return '';

      const date = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (this.isSameDay(date, today)) {
        return '今天';
      } else if (this.isSameDay(date, tomorrow)) {
        return '明天';
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
      }
    },

    // 判断是否同一天
    isSameDay(date1, date2) {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    },

    // 选手输入
    onPlayerInput(e) {
      const value = e.detail.value;
      this.setData({
        'filters.player': value
      });
      
      if (value.length >= 2) {
        this.searchPlayerSuggestions(value);
      } else {
        this.setData({ playerSuggestions: [] });
      }
    },

    // 搜索选手建议
    async searchPlayerSuggestions(keyword) {
      try {
        // 模拟API调用
        const suggestions = [
          { id: 1, name: '张三', avatar: '', ranking: 15 },
          { id: 2, name: '李四', avatar: '', ranking: 23 },
          { id: 3, name: '王五', avatar: '', ranking: 8 }
        ].filter(item => item.name.includes(keyword));
        
        this.setData({ playerSuggestions: suggestions });
      } catch (error) {
        console.error('搜索选手失败:', error);
      }
    },

    // 选择选手
    selectPlayer(e) {
      const player = e.currentTarget.dataset.player;
      this.setData({
        'filters.player': player,
        playerSuggestions: []
      });
      this.updateFilteredCount();
    },

    // 更新筛选结果计数
    async updateFilteredCount() {
      try {
        // 这里应该调用API获取筛选后的比赛数量
        const count = await this.getFilteredMatchCount(this.data.filters);
        this.setData({ filteredCount: count });
      } catch (error) {
        console.error('更新筛选计数失败:', error);
      }
    },

    // 获取筛选后的比赛数量
    async getFilteredMatchCount(filters) {
      // 模拟API调用
      return Math.floor(Math.random() * 100) + 10;
    },

    // 重置筛选器
    resetFilters() {
      this.setData({
        filters: {
          eventType: '',
          status: '',
          region: '',
          player: '',
          timeRange: 'all',
          startDate: '',
          endDate: ''
        },
        regionSuggestions: [],
        playerSuggestions: []
      });
      this.updateFilteredCount();
    },

    // 应用筛选
    applyFilters() {
      this.triggerEvent('filterchange', {
        filters: this.data.filters,
        count: this.data.filteredCount
      });
      this.closeFilter();
    },

    // 关闭筛选器
    closeFilter() {
      this.triggerEvent('close');
    },

    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
});
