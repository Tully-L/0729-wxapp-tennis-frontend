// time-picker.js - 时间选择器组件
Component({
  properties: {
    // 是否显示选择器
    visible: {
      type: Boolean,
      value: false
    },
    
    // 是否显示时间段选择
    showTimeRange: {
      type: Boolean,
      value: false
    },
    
    // 是否显示数字时间表达
    showDigitalTime: {
      type: Boolean,
      value: true
    },
    
    // 初始开始日期
    defaultStartDate: {
      type: String,
      value: ''
    },
    
    // 初始结束日期
    defaultEndDate: {
      type: String,
      value: ''
    },
    
    // 最小日期
    minDate: {
      type: String,
      value: ''
    },
    
    // 最大日期
    maxDate: {
      type: String,
      value: ''
    }
  },

  data: {
    startDate: '',
    endDate: '',
    selectedQuick: '',
    selectedTimeRange: '',
    selectedPreset: '',
    digitalTime: {
      days: 0,
      hours: 0
    },
    
    // 快速选择选项
    quickOptions: [
      { id: 'today', name: '今天' },
      { id: 'tomorrow', name: '明天' },
      { id: 'this_week', name: '本周' },
      { id: 'next_week', name: '下周' },
      { id: 'this_month', name: '本月' },
      { id: 'next_month', name: '下月' }
    ],
    
    // 时间段选项
    timeRanges: [
      { id: 'morning', name: '上午', time: '06:00-12:00' },
      { id: 'afternoon', name: '下午', time: '12:00-18:00' },
      { id: 'evening', name: '晚上', time: '18:00-22:00' },
      { id: 'night', name: '深夜', time: '22:00-06:00' }
    ],
    
    // 预设范围
    presetRanges: [
      { id: 'recent_7', name: '最近7天', description: '过去一周的比赛' },
      { id: 'recent_30', name: '最近30天', description: '过去一个月的比赛' },
      { id: 'next_7', name: '未来7天', description: '即将到来的比赛' },
      { id: 'next_30', name: '未来30天', description: '下个月的比赛' }
    ]
  },

  lifetimes: {
    attached() {
      this.initializeDates();
    }
  },

  observers: {
    'visible': function(visible) {
      if (visible) {
        this.initializeDates();
      }
    },
    
    'defaultStartDate, defaultEndDate': function(startDate, endDate) {
      if (startDate || endDate) {
        this.setData({
          startDate: startDate || this.data.startDate,
          endDate: endDate || this.data.endDate
        });
      }
    }
  },

  methods: {
    // 初始化日期
    initializeDates() {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const maxDate = new Date(today);
      maxDate.setFullYear(today.getFullYear() + 1);
      
      this.setData({
        startDate: this.properties.defaultStartDate || this.formatDate(today),
        endDate: this.properties.defaultEndDate || this.formatDate(tomorrow),
        minDate: this.properties.minDate || this.formatDate(today),
        maxDate: this.properties.maxDate || this.formatDate(maxDate)
      });
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return '';
      if (typeof date === 'string') return date;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // 格式化显示日期
    formatDisplayDate(dateStr) {
      if (!dateStr) return '请选择日期';
      
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

    // 遮罩点击
    onMaskTap() {
      this.onCancel();
    },

    // 阻止触摸穿透
    preventTouchMove() {
      return false;
    },

    // 取消
    onCancel() {
      this.triggerEvent('cancel');
    },

    // 确认
    onConfirm() {
      const result = {
        startDate: this.data.startDate,
        endDate: this.data.endDate,
        timeRange: this.data.selectedTimeRange,
        digitalTime: this.data.digitalTime,
        preset: this.data.selectedPreset,
        quick: this.data.selectedQuick
      };
      
      this.triggerEvent('confirm', result);
    },

    // 重置
    onReset() {
      this.setData({
        selectedQuick: '',
        selectedTimeRange: '',
        selectedPreset: '',
        digitalTime: { days: 0, hours: 0 }
      });
      this.initializeDates();
    },

    // 快速选择
    onQuickSelect(e) {
      const option = e.currentTarget.dataset.option;
      const dates = this.getDatesByQuickOption(option.id);
      
      this.setData({
        selectedQuick: option.id,
        startDate: dates.startDate,
        endDate: dates.endDate,
        selectedPreset: '',
        digitalTime: { days: 0, hours: 0 }
      });
    },

    // 根据快速选项获取日期
    getDatesByQuickOption(optionId) {
      const today = new Date();
      let startDate = new Date(today);
      let endDate = new Date(today);
      
      switch (optionId) {
        case 'today':
          break;
        case 'tomorrow':
          startDate.setDate(today.getDate() + 1);
          endDate.setDate(today.getDate() + 1);
          break;
        case 'this_week':
          startDate.setDate(today.getDate() - today.getDay());
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'next_week':
          startDate.setDate(today.getDate() - today.getDay() + 7);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'this_month':
          startDate.setDate(1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case 'next_month':
          startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          break;
      }
      
      return {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate)
      };
    },

    // 开始日期变化
    onStartDateChange(e) {
      const startDate = e.detail.value;
      this.setData({
        startDate: startDate,
        selectedQuick: '',
        selectedPreset: ''
      });
      
      // 如果开始日期晚于结束日期，自动调整结束日期
      if (startDate > this.data.endDate) {
        this.setData({ endDate: startDate });
      }
    },

    // 结束日期变化
    onEndDateChange(e) {
      const endDate = e.detail.value;
      this.setData({
        endDate: endDate,
        selectedQuick: '',
        selectedPreset: ''
      });
    },

    // 时间段选择
    onTimeRangeSelect(e) {
      const range = e.currentTarget.dataset.range;
      this.setData({
        selectedTimeRange: this.data.selectedTimeRange === range.id ? '' : range.id
      });
    },

    // 数字天数输入
    onDigitalDaysInput(e) {
      const days = parseInt(e.detail.value) || 0;
      this.setData({
        'digitalTime.days': days,
        selectedQuick: '',
        selectedPreset: ''
      });
      this.updateDatesByDigitalTime();
    },

    // 数字小时输入
    onDigitalHoursInput(e) {
      const hours = parseInt(e.detail.value) || 0;
      this.setData({
        'digitalTime.hours': hours,
        selectedQuick: '',
        selectedPreset: ''
      });
      this.updateDatesByDigitalTime();
    },

    // 根据数字时间更新日期
    updateDatesByDigitalTime() {
      const { days, hours } = this.data.digitalTime;
      if (days === 0 && hours === 0) return;
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + days);
      endDate.setHours(startDate.getHours() + hours);
      
      this.setData({
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate)
      });
    },

    // 预设选择
    onPresetSelect(e) {
      const preset = e.currentTarget.dataset.preset;
      const dates = this.getDatesByPreset(preset.id);
      
      this.setData({
        selectedPreset: preset.id,
        startDate: dates.startDate,
        endDate: dates.endDate,
        selectedQuick: '',
        digitalTime: { days: 0, hours: 0 }
      });
    },

    // 根据预设获取日期
    getDatesByPreset(presetId) {
      const today = new Date();
      let startDate = new Date(today);
      let endDate = new Date(today);
      
      switch (presetId) {
        case 'recent_7':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'recent_30':
          startDate.setDate(today.getDate() - 30);
          break;
        case 'next_7':
          endDate.setDate(today.getDate() + 7);
          break;
        case 'next_30':
          endDate.setDate(today.getDate() + 30);
          break;
      }
      
      return {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate)
      };
    },

    // 获取数字时间预览
    getDigitalPreview() {
      const { days, hours } = this.data.digitalTime;
      if (days === 0 && hours === 0) {
        return '请输入天数或小时数';
      }
      
      let preview = '';
      if (days > 0) preview += `${days}天`;
      if (hours > 0) preview += `${hours}小时`;
      preview += '内的比赛';
      
      return preview;
    },

    // 获取选择信息
    getSelectedInfo() {
      const { startDate, endDate, selectedQuick, selectedPreset, digitalTime } = this.data;
      
      if (selectedQuick) {
        const option = this.data.quickOptions.find(opt => opt.id === selectedQuick);
        return option ? option.name : '';
      }
      
      if (selectedPreset) {
        const preset = this.data.presetRanges.find(p => p.id === selectedPreset);
        return preset ? preset.name : '';
      }
      
      if (digitalTime.days > 0 || digitalTime.hours > 0) {
        return this.getDigitalPreview();
      }
      
      if (startDate && endDate) {
        return `${this.formatDisplayDate(startDate)} 至 ${this.formatDisplayDate(endDate)}`;
      }
      
      return '请选择时间范围';
    }
  }
});
