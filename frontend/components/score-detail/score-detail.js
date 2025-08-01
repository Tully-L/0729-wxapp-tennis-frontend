// score-detail.js - 详细比分显示组件
Component({
  properties: {
    // 比赛数据
    match: {
      type: Object,
      value: {}
    },
    
    // 比分摘要
    scoreSummary: {
      type: Object,
      value: null
    },
    
    // 比赛统计
    matchStats: {
      type: Object,
      value: null
    },
    
    // 当前局比分（进行中的比赛）
    currentGameScore: {
      type: Object,
      value: null
    },
    
    // 显示模式：full（完整）、compact（紧凑）
    displayMode: {
      type: String,
      value: 'full'
    }
  },

  data: {
    // 组件内部状态
  },

  methods: {
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        '报名中': '报名中',
        '比赛中': '进行中',
        '已结束': '已结束',
        'ongoing': '进行中',
        'completed': '已结束',
        'upcoming': '即将开始',
        'registration': '报名中'
      };
      return statusMap[status] || status;
    },

    // 获取队伍标签
    getTeamLabel(teamKey) {
      const { match } = this.data;
      if (!match.players || !match.players[teamKey]) return '';
      
      const team = match.players[teamKey];
      if (team.length === 1) {
        return '单打选手';
      } else if (team.length === 2) {
        return '双打组合';
      }
      return '选手';
    },

    // 获取队伍显示名称
    getTeamDisplayName(teamKey) {
      const { match } = this.data;
      if (!match.players || !match.players[teamKey]) return '';
      
      const team = match.players[teamKey];
      if (team.length === 1) {
        return team[0].name;
      } else if (team.length === 2) {
        return `${team[0].name} / ${team[1].name}`;
      }
      return '未知选手';
    },

    // 获取获胜盘数
    getSetsWon(teamKey) {
      const { scoreSummary } = this.data;
      if (!scoreSummary || !scoreSummary.sets) return 0;
      
      let setsWon = 0;
      scoreSummary.sets.forEach(set => {
        if (teamKey === 'team1' && set.team1Score > set.team2Score) {
          setsWon++;
        } else if (teamKey === 'team2' && set.team2Score > set.team1Score) {
          setsWon++;
        }
      });
      
      return setsWon;
    },

    // 格式化局分（网球计分规则）
    formatGameScore(points) {
      const scoreMap = {
        0: '0',
        1: '15',
        2: '30',
        3: '40'
      };
      
      if (points >= 4) {
        return 'A'; // Advantage
      }
      
      return scoreMap[points] || points.toString();
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '';
      
      const date = new Date(dateTime);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const matchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const timeStr = date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      if (matchDate.getTime() === today.getTime()) {
        return `今天 ${timeStr}`;
      } else if (matchDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
        return `明天 ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric'
        });
        return `${dateStr} ${timeStr}`;
      }
    },

    // 获取强度文本
    getIntensityText(intensity) {
      const intensityMap = {
        'low': '低强度',
        'medium': '中强度',
        'high': '高强度'
      };
      return intensityMap[intensity] || intensity;
    },

    // 处理比分点击事件
    onScoreClick(e) {
      const { setNumber } = e.currentTarget.dataset;
      this.triggerEvent('scoreclick', {
        setNumber: setNumber,
        match: this.data.match
      });
    },

    // 处理选手点击事件
    onPlayerClick(e) {
      const { teamKey, playerIndex } = e.currentTarget.dataset;
      const { match } = this.data;
      
      if (match.players && match.players[teamKey] && match.players[teamKey][playerIndex]) {
        const player = match.players[teamKey][playerIndex];
        this.triggerEvent('playerclick', {
          player: player,
          teamKey: teamKey,
          playerIndex: playerIndex
        });
      }
    }
  },

  observers: {
    'match, scoreSummary': function(match, scoreSummary) {
      // 当比赛数据或比分摘要变化时，可以进行一些计算或处理
      if (match && scoreSummary) {
        console.log('比分详情组件数据更新:', {
          matchId: match._id,
          status: match.status,
          setsCount: scoreSummary.sets?.length || 0
        });
      }
    }
  },

  lifetimes: {
    attached() {
      console.log('比分详情组件已加载');
    },

    detached() {
      console.log('比分详情组件已卸载');
    }
  }
});
