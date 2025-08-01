// match-status.js - 比赛状态管理组件
const { API } = require('../../utils/api');

Component({
  properties: {
    // 比赛数据
    match: {
      type: Object,
      value: {}
    },
    
    // 当前状态
    currentStatus: {
      type: String,
      value: '报名中'
    },
    
    // 是否可以管理状态
    canManageStatus: {
      type: Boolean,
      value: false
    },
    
    // 是否显示时间信息
    showTimeInfo: {
      type: Boolean,
      value: true
    },
    
    // 是否显示历史记录
    showHistory: {
      type: Boolean,
      value: false
    },
    
    // 状态历史
    statusHistory: {
      type: Array,
      value: []
    }
  },

  data: {
    // 内部状态
    updating: false,
    showConfirmModal: false,
    historyExpanded: false,
    reasonText: '',
    
    // 待执行的操作
    pendingAction: null,
    
    // 状态配置
    statusConfig: {
      '报名中': {
        displayText: '报名中',
        icon: '📝',
        class: 'status-registration',
        timeLabel: '报名截止',
        canStart: true
      },
      '比赛中': {
        displayText: '进行中',
        icon: '🎾',
        class: 'status-ongoing',
        timeLabel: '开始时间',
        isLive: true
      },
      '已暂停': {
        displayText: '已暂停',
        icon: '⏸️',
        class: 'status-paused',
        timeLabel: '暂停时间'
      },
      '已结束': {
        displayText: '已结束',
        icon: '🏆',
        class: 'status-completed',
        timeLabel: '结束时间'
      },
      '已取消': {
        displayText: '已取消',
        icon: '❌',
        class: 'status-cancelled',
        timeLabel: '取消时间'
      }
    }
  },

  computed: {
    canStart() {
      const { match } = this.data;
      return match.players?.team1?.length > 0 && match.players?.team2?.length > 0;
    },
    
    canReopen() {
      const { match } = this.data;
      return match.organizer && this.data.canManageStatus;
    }
  },

  methods: {
    // 获取状态显示文本
    getStatusDisplayText(status) {
      return this.data.statusConfig[status]?.displayText || status;
    },

    // 获取状态图标
    getStatusIcon(status) {
      return this.data.statusConfig[status]?.icon || '❓';
    },

    // 获取状态样式类
    getStatusClass(status) {
      return this.data.statusConfig[status]?.class || 'status-unknown';
    },

    // 获取时间标签
    getTimeLabel(status) {
      return this.data.statusConfig[status]?.timeLabel || '时间';
    },

    // 获取时间值
    getTimeValue(status) {
      const { match } = this.data;
      if (!match) return '';

      switch (status) {
        case '报名中':
          return this.formatTime(match.registrationDeadline);
        case '比赛中':
          return this.formatTime(match.startTime);
        case '已暂停':
          return this.formatTime(match.pausedAt);
        case '已结束':
          return this.formatTime(match.endTime);
        case '已取消':
          return this.formatTime(match.cancelledAt);
        default:
          return '';
      }
    },

    // 开始比赛
    startMatch() {
      this.showActionConfirm({
        type: 'start',
        title: '开始比赛',
        message: '确定要开始这场比赛吗？',
        needReason: false,
        newStatus: '比赛中'
      });
    },

    // 暂停比赛
    pauseMatch() {
      this.showActionConfirm({
        type: 'pause',
        title: '暂停比赛',
        message: '确定要暂停这场比赛吗？',
        needReason: true,
        newStatus: '已暂停'
      });
    },

    // 恢复比赛
    resumeMatch() {
      this.showActionConfirm({
        type: 'resume',
        title: '恢复比赛',
        message: '确定要恢复这场比赛吗？',
        needReason: false,
        newStatus: '比赛中'
      });
    },

    // 结束比赛
    endMatch() {
      this.showActionConfirm({
        type: 'end',
        title: '结束比赛',
        message: '确定要结束这场比赛吗？比赛结束后将无法继续更新比分。',
        needReason: false,
        newStatus: '已结束'
      });
    },

    // 取消比赛
    cancelMatch() {
      this.showActionConfirm({
        type: 'cancel',
        title: '取消比赛',
        message: '确定要取消这场比赛吗？取消后可以重新开放报名。',
        needReason: true,
        newStatus: '已取消'
      });
    },

    // 重新开放报名
    reopenRegistration() {
      this.showActionConfirm({
        type: 'reopen',
        title: '重新开放报名',
        message: '确定要重新开放这场比赛的报名吗？',
        needReason: false,
        newStatus: '报名中'
      });
    },

    // 显示操作确认对话框
    showActionConfirm(action) {
      this.setData({
        pendingAction: action,
        showConfirmModal: true,
        reasonText: ''
      });
    },

    // 隐藏确认对话框
    hideConfirmModal() {
      this.setData({
        showConfirmModal: false,
        pendingAction: null,
        reasonText: ''
      });
    },

    // 确认执行操作
    async confirmAction() {
      const { pendingAction, reasonText } = this.data;
      if (!pendingAction) return;

      this.setData({ updating: true });

      try {
        await this.updateMatchStatus(pendingAction.newStatus, reasonText);
        
        wx.showToast({
          title: `${pendingAction.title}成功`,
          icon: 'success'
        });

        this.hideConfirmModal();
        
        // 触发状态更新事件
        this.triggerEvent('statusupdated', {
          oldStatus: this.data.currentStatus,
          newStatus: pendingAction.newStatus,
          reason: reasonText
        });

      } catch (error) {
        console.error('状态更新失败:', error);
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        });
      } finally {
        this.setData({ updating: false });
      }
    },

    // 更新比赛状态
    async updateMatchStatus(newStatus, reason) {
      const { match } = this.data;
      if (!match._id) {
        throw new Error('比赛ID不存在');
      }

      const response = await API.updateMatchStatus(match._id, {
        status: newStatus,
        reason: reason
      });

      if (!response.success) {
        throw new Error(response.message || '状态更新失败');
      }

      return response.data;
    },

    // 原因输入处理
    onReasonInput(e) {
      this.setData({
        reasonText: e.detail.value
      });
    },

    // 切换历史记录显示
    toggleHistory() {
      this.setData({
        historyExpanded: !this.data.historyExpanded
      });
    },

    // 格式化时间
    formatTime(dateTime) {
      if (!dateTime) return '';
      
      const date = new Date(dateTime);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diffDays === 1) {
        return '昨天 ' + date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  },

  observers: {
    'currentStatus': function(newStatus) {
      console.log('比赛状态变更:', newStatus);
    }
  },

  lifetimes: {
    attached() {
      console.log('比赛状态管理组件已加载');
    }
  }
});
