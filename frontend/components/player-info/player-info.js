// player-info.js - 选手信息组件
Component({
  properties: {
    // 比赛格式：singles（单打）或 doubles（双打）
    format: {
      type: String,
      value: 'singles'
    },
    
    // 布局模式：default, compact, avatar-list
    layout: {
      type: String,
      value: 'default'
    },
    
    // 单打选手信息
    player: {
      type: Object,
      value: {}
    },
    
    // 双打选手信息（数组）
    players: {
      type: Array,
      value: []
    },
    
    // 是否显示统计信息
    showStats: {
      type: Boolean,
      value: false
    },
    
    // 是否显示排名
    showRanking: {
      type: Boolean,
      value: true
    },
    
    // 双打组合统计
    teamStats: {
      type: Object,
      value: null
    }
  },

  data: {
    // 组件内部数据
  },

  lifetimes: {
    attached() {
      this.validateProps();
    }
  },

  observers: {
    'format, player, players': function(format, player, players) {
      this.validateProps();
    }
  },

  methods: {
    // 验证属性
    validateProps() {
      const { format, player, players } = this.properties;
      
      if (format === 'singles' && (!player || !player.name)) {
        console.warn('PlayerInfo: 单打模式需要提供有效的player对象');
      }
      
      if (format === 'doubles' && (!players || players.length === 0)) {
        console.warn('PlayerInfo: 双打模式需要提供有效的players数组');
      }
    },

    // 选手点击事件
    onPlayerTap(e) {
      const player = e.currentTarget.dataset.player;
      this.triggerEvent('playertap', {
        player: player,
        format: this.properties.format
      });
    },

    // 获取选手头像
    getPlayerAvatar(player) {
      return player.avatar || '/images/default-avatar.png';
    },

    // 格式化排名显示
    formatRanking(ranking) {
      if (!ranking) return '';
      return `#${ranking}`;
    },

    // 格式化胜率显示
    formatWinRate(winRate) {
      if (winRate === null || winRate === undefined) return 'N/A';
      return `${winRate}%`;
    },

    // 获取选手国家标识
    getCountryFlag(country) {
      const countryFlags = {
        '中国': '🇨🇳',
        '美国': '🇺🇸',
        '英国': '🇬🇧',
        '法国': '🇫🇷',
        '德国': '🇩🇪',
        '日本': '🇯🇵',
        '韩国': '🇰🇷',
        '澳大利亚': '🇦🇺',
        '西班牙': '🇪🇸',
        '意大利': '🇮🇹'
      };
      
      return countryFlags[country] || '';
    },

    // 计算双打组合平均排名
    getDoublesAverageRanking(players) {
      if (!players || players.length === 0) return null;
      
      const rankings = players
        .map(p => p.ranking)
        .filter(r => r !== null && r !== undefined);
      
      if (rankings.length === 0) return null;
      
      const average = rankings.reduce((sum, rank) => sum + rank, 0) / rankings.length;
      return Math.round(average);
    },

    // 获取选手简短信息
    getPlayerSummary(player) {
      const parts = [];
      
      if (player.country) {
        const flag = this.getCountryFlag(player.country);
        parts.push(flag ? `${flag} ${player.country}` : player.country);
      }
      
      if (player.age) {
        parts.push(`${player.age}岁`);
      }
      
      if (player.ranking) {
        parts.push(`排名#${player.ranking}`);
      }
      
      return parts.join(' • ');
    },

    // 获取双打组合名称
    getDoublesTeamName(players) {
      if (!players || players.length === 0) return '';
      return players.map(p => p.name).join(' / ');
    },

    // 检查是否有完整的选手信息
    hasCompletePlayerInfo(player) {
      return player && player.name && (player.avatar || player.country || player.ranking);
    },

    // 获取选手状态颜色
    getPlayerStatusColor(player) {
      if (!player.status) return '';
      
      const statusColors = {
        'active': '#4CAF50',
        'injured': '#FF9800',
        'retired': '#9E9E9E'
      };
      
      return statusColors[player.status] || '';
    },

    // 格式化比赛统计
    formatMatchStats(stats) {
      if (!stats) return null;
      
      return {
        winRate: stats.wins && stats.total ? 
          Math.round((stats.wins / stats.total) * 100) : null,
        matchCount: stats.total || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0
      };
    }
  }
});
