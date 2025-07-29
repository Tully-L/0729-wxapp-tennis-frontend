// 前端网球比赛模拟数据

// 选手数据池
const playerPool = {
  '男子单打': [
    { name: '德约科维奇', ranking: 1, avatar: null, country: '塞尔维亚' },
    { name: '纳达尔', ranking: 2, avatar: null, country: '西班牙' },
    { name: '费德勒', ranking: 3, avatar: null, country: '瑞士' },
    { name: '梅德韦杰夫', ranking: 4, avatar: null, country: '俄罗斯' },
    { name: '兹维列夫', ranking: 5, avatar: null, country: '德国' },
    { name: '卢布列夫', ranking: 6, avatar: null, country: '俄罗斯' },
    { name: '贝雷蒂尼', ranking: 7, avatar: null, country: '意大利' },
    { name: '胡尔卡奇', ranking: 8, avatar: null, country: '波兰' },
    { name: '阿利亚西姆', ranking: 9, avatar: null, country: '加拿大' },
    { name: '辛纳', ranking: 10, avatar: null, country: '意大利' },
    { name: '沙波瓦洛夫', ranking: 11, avatar: null, country: '加拿大' },
    { name: '诺里', ranking: 12, avatar: null, country: '英国' },
    { name: '张之臻', ranking: 45, avatar: null, country: '中国' },
    { name: '商竣程', ranking: 67, avatar: null, country: '中国' }
  ],
  '女子单打': [
    { name: '斯瓦泰克', ranking: 1, avatar: null, country: '波兰' },
    { name: '萨巴伦卡', ranking: 2, avatar: null, country: '白俄罗斯' },
    { name: '加芙', ranking: 3, avatar: null, country: '美国' },
    { name: '萨卡里', ranking: 4, avatar: null, country: '希腊' },
    { name: '贾贝尔', ranking: 5, avatar: null, country: '突尼斯' },
    { name: '里巴金娜', ranking: 6, avatar: null, country: '哈萨克斯坦' },
    { name: '普利斯科娃', ranking: 7, avatar: null, country: '捷克' },
    { name: '穆古鲁扎', ranking: 8, avatar: null, country: '西班牙' },
    { name: '奥斯塔彭科', ranking: 9, avatar: null, country: '拉脱维亚' },
    { name: '克雷吉茨科娃', ranking: 10, avatar: null, country: '捷克' },
    { name: '王蔷', ranking: 23, avatar: null, country: '中国' },
    { name: '郑钦文', ranking: 28, avatar: null, country: '中国' },
    { name: '朱琳', ranking: 35, avatar: null, country: '中国' },
    { name: '张帅', ranking: 42, avatar: null, country: '中国' }
  ],
  '男子双打': [
    { name: '库伯特', ranking: 1, avatar: null, country: '克罗地亚' },
    { name: '梅洛', ranking: 2, avatar: null, country: '巴西' },
    { name: '格拉诺勒斯', ranking: 3, avatar: null, country: '西班牙' },
    { name: '泽巴洛斯', ranking: 4, avatar: null, country: '阿根廷' },
    { name: '拉姆', ranking: 5, avatar: null, country: '美国' },
    { name: '萨利斯伯里', ranking: 6, avatar: null, country: '英国' },
    { name: '阿雷瓦洛', ranking: 7, avatar: null, country: '萨尔瓦多' },
    { name: '罗杰-瓦塞林', ranking: 8, avatar: null, country: '法国' }
  ],
  '女子双打': [
    { name: '克雷吉茨科娃', ranking: 1, avatar: null, country: '捷克' },
    { name: '西尼亚科娃', ranking: 2, avatar: null, country: '捷克' },
    { name: '梅尔滕斯', ranking: 3, avatar: null, country: '比利时' },
    { name: '萨巴伦卡', ranking: 4, avatar: null, country: '白俄罗斯' },
    { name: '徐一璠', ranking: 5, avatar: null, country: '中国' },
    { name: '杨钊煊', ranking: 6, avatar: null, country: '中国' },
    { name: '张帅', ranking: 7, avatar: null, country: '中国' },
    { name: '王蔷', ranking: 8, avatar: null, country: '中国' }
  ],
  '混合双打': [
    { name: '德约科维奇', ranking: 1, avatar: null, country: '塞尔维亚' },
    { name: '斯瓦泰克', ranking: 1, avatar: null, country: '波兰' },
    { name: '纳达尔', ranking: 2, avatar: null, country: '西班牙' },
    { name: '萨巴伦卡', ranking: 2, avatar: null, country: '白俄罗斯' },
    { name: '费德勒', ranking: 3, avatar: null, country: '瑞士' },
    { name: '加芙', ranking: 3, avatar: null, country: '美国' },
    { name: '梅德韦杰夫', ranking: 4, avatar: null, country: '俄罗斯' },
    { name: '萨卡里', ranking: 4, avatar: null, country: '希腊' }
  ]
};

// 场地数据
const venues = [
  { name: '菲利普·夏蒂埃球场', court: '中央球场', location: '法国巴黎' },
  { name: '苏珊·朗格伦球场', court: '1号球场', location: '法国巴黎' },
  { name: '西蒙娜·马修球场', court: '2号球场', location: '法国巴黎' },
  { name: '温布尔登中央球场', court: '中央球场', location: '英国伦敦' },
  { name: '温布尔登1号球场', court: '1号球场', location: '英国伦敦' },
  { name: '亚瑟·阿什球场', court: '中央球场', location: '美国纽约' },
  { name: '路易·阿姆斯特朗球场', court: '1号球场', location: '美国纽约' },
  { name: '罗德·拉沃尔球场', court: '中央球场', location: '澳大利亚墨尔本' },
  { name: '玛格丽特·考特球场', court: '1号球场', location: '澳大利亚墨尔本' },
  { name: '钻石球场', court: '中央球场', location: '中国上海' },
  { name: '莲花球场', court: '1号球场', location: '中国上海' },
  { name: '国家网球中心', court: '中央球场', location: '中国北京' }
];

// 地区数据
const regions = [
  '法国巴黎', '英国伦敦', '美国纽约', '澳大利亚墨尔本',
  '中国北京', '中国上海', '西班牙马德里', '意大利罗马',
  '德国汉堡', '加拿大蒙特利尔', '美国迈阿密', '印第安维尔斯',
  '摩纳哥蒙特卡洛', '奥地利维也纳', '瑞士巴塞尔', '荷兰鹿特丹'
];

// 比赛阶段
const stages = ['资格赛', '第一轮', '第二轮', '第三轮', '16强', '8强', '4强', '半决赛', '决赛'];

// 赛事名称
const eventNames = [
  '法国网球公开赛', '温布尔登网球锦标赛', '美国网球公开赛', '澳大利亚网球公开赛',
  '上海大师赛', '中国网球公开赛', '马德里大师赛', '罗马大师赛',
  '印第安维尔斯大师赛', '迈阿密大师赛', '蒙特卡洛大师赛', '汉堡公开赛',
  'ATP总决赛', 'WTA总决赛', '戴维斯杯', '联合会杯'
];

// 生成随机比分（已结束的比赛）
const generateCompletedScore = (bestOf = 3) => {
  const sets = [];
  let team1Sets = 0;
  let team2Sets = 0;
  const setsToWin = Math.ceil(bestOf / 2);
  
  while (team1Sets < setsToWin && team2Sets < setsToWin) {
    const set = generateSetScore();
    sets.push(set);
    
    if (set.team1Score > set.team2Score) {
      team1Sets++;
    } else {
      team2Sets++;
    }
  }
  
  return {
    sets: sets,
    winner: team1Sets > team2Sets ? 'team1' : 'team2'
  };
};

// 生成单盘比分
const generateSetScore = () => {
  const scenarios = [
    // 正常比分
    { team1: 6, team2: 4 },
    { team1: 6, team2: 3 },
    { team1: 6, team2: 2 },
    { team1: 6, team2: 1 },
    { team1: 6, team2: 0 },
    { team1: 4, team2: 6 },
    { team1: 3, team2: 6 },
    { team1: 2, team2: 6 },
    { team1: 1, team2: 6 },
    { team1: 0, team2: 6 },
    // 7-5 比分
    { team1: 7, team2: 5 },
    { team1: 5, team2: 7 },
    // 抢七比分 6-6后的抢七
    { team1: 7, team2: 6, tiebreak: { played: true, team1Score: 7, team2Score: 5 } },
    { team1: 6, team2: 7, tiebreak: { played: true, team1Score: 5, team2Score: 7 } },
    { team1: 7, team2: 6, tiebreak: { played: true, team1Score: 7, team2Score: 3 } },
    { team1: 6, team2: 7, tiebreak: { played: true, team1Score: 4, team2Score: 7 } },
    { team1: 7, team2: 6, tiebreak: { played: true, team1Score: 10, team2Score: 8 } },
    { team1: 6, team2: 7, tiebreak: { played: true, team1Score: 6, team2Score: 8 } }
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  return {
    setNumber: 1, // 会在使用时设置正确的盘数
    team1Score: scenario.team1,
    team2Score: scenario.team2,
    tiebreak: scenario.tiebreak || { played: false, team1Score: 0, team2Score: 0 }
  };
};

// 生成比赛持续时间
const generateDuration = (sets) => {
  const baseTime = 45; // 每盘基础时间45分钟
  const totalSets = sets.length;
  const totalTime = baseTime * totalSets + Math.floor(Math.random() * 30); // 加上随机时间
  
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  
  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
};

// 生成时间字符串（纯数字格式）
const generateTimeString = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 生成模拟比赛数据
const generateMockMatches = (count = 30) => {
  const matches = [];
  const eventTypes = ['男子单打', '女子单打', '男子双打', '女子双打', '混合双打'];
  const statuses = ['已结束', '比赛中', '报名中'];
  const matchFormats = ['3盘制', '5盘制'];
  
  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const matchFormat = matchFormats[Math.floor(Math.random() * matchFormats.length)];
    const bestOf = matchFormat === '5盘制' ? 5 : 3;
    const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];
    
    // 选择选手
    let team1Players, team2Players;
    if (eventType.includes('双打')) {
      // 双打需要两个选手
      const players = [...playerPool[eventType]];
      team1Players = [
        players.splice(Math.floor(Math.random() * players.length), 1)[0],
        players.splice(Math.floor(Math.random() * players.length), 1)[0]
      ];
      team2Players = [
        players.splice(Math.floor(Math.random() * players.length), 1)[0],
        players.splice(Math.floor(Math.random() * players.length), 1)[0]
      ];
    } else {
      // 单打只需要一个选手
      const players = [...playerPool[eventType]];
      team1Players = [players.splice(Math.floor(Math.random() * players.length), 1)[0]];
      team2Players = [players.splice(Math.floor(Math.random() * players.length), 1)[0]];
    }
    
    // 生成比分
    let score = { sets: [], winner: null };
    if (status === '已结束') {
      score = generateCompletedScore(bestOf);
      // 为每盘设置正确的盘数
      score.sets.forEach((set, index) => {
        set.setNumber = index + 1;
      });
    } else if (status === '比赛中') {
      // 进行中的比赛，生成部分比分
      const completedSets = Math.floor(Math.random() * 2) + 1; // 1-2盘已完成
      for (let j = 0; j < completedSets; j++) {
        const set = generateSetScore();
        set.setNumber = j + 1;
        score.sets.push(set);
      }
    }
    
    // 生成时间（过去7天到未来3天）
    const scheduledTime = new Date();
    scheduledTime.setDate(scheduledTime.getDate() + Math.floor(Math.random() * 10) - 7);
    scheduledTime.setHours(Math.floor(Math.random() * 12) + 8); // 8-20点
    scheduledTime.setMinutes(Math.floor(Math.random() * 4) * 15); // 整点或15分钟间隔
    
    const match = {
      _id: `match_${i + 1}`,
      matchName: `${eventName} ${eventType} ${stage}`,
      eventId: `event_${Math.floor(Math.random() * 5) + 1}`,
      eventType: eventType,
      eventName: eventName,
      status: status,
      stage: stage,
      venue: venue.name,
      court: venue.court,
      region: venue.location,
      scheduledTime: scheduledTime,
      timeString: generateTimeString(scheduledTime),
      startTime: status !== '报名中' ? new Date(scheduledTime.getTime() + 30 * 60000) : null,
      endTime: status === '已结束' ? new Date(scheduledTime.getTime() + 2 * 3600000) : null,
      duration: status === '已结束' ? generateDuration(score.sets) : null,
      players: {
        team1: team1Players,
        team2: team2Players
      },
      matchFormat: matchFormat,
      bestOf: bestOf,
      score: score,
      statistics: {
        totalGames: score.sets.reduce((total, set) => total + set.team1Score + set.team2Score, 0),
        aces: {
          team1: Math.floor(Math.random() * 10),
          team2: Math.floor(Math.random() * 10)
        },
        doubleFaults: {
          team1: Math.floor(Math.random() * 5),
          team2: Math.floor(Math.random() * 5)
        },
        firstServePercentage: {
          team1: Math.floor(Math.random() * 30) + 60, // 60-90%
          team2: Math.floor(Math.random() * 30) + 60
        }
      },
      organizer: {
        name: '国际网球联合会',
        id: null
      },
      spectators: [],
      viewCount: Math.floor(Math.random() * 50000),
      isLive: status === '比赛中',
      isPublic: true,
      tags: [eventType, stage, venue.location.split(' ')[0]],
      notes: null,
      createdAt: scheduledTime,
      updatedAt: scheduledTime
    };
    
    matches.push(match);
  }
  
  return matches;
};

// 按日期分组比赛
const groupMatchesByDate = (matches) => {
  const grouped = {};
  
  matches.forEach(match => {
    const date = new Date(match.scheduledTime);
    const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(match);
  });
  
  // 按日期排序，最新的在前面
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
  const result = {};
  sortedDates.forEach(date => {
    result[date] = grouped[date].sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  });
  
  return result;
};

// 格式化日期显示
const formatDateDisplay = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 检查是否是今天、明天或昨天
  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  
  // 其他日期显示格式：星期X, 月 日 年
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${weekday}, ${month} ${day} ${year}`;
};

// 生成比分字符串
const generateScoreString = (sets) => {
  if (!sets || sets.length === 0) return '';
  
  return sets.map(set => {
    let scoreStr = `${set.team1Score} ${set.team2Score}`;
    if (set.tiebreak && set.tiebreak.played) {
      const winnerScore = set.team1Score > set.team2Score ? set.tiebreak.team1Score : set.tiebreak.team2Score;
      scoreStr += ` (${winnerScore})`;
    }
    return scoreStr;
  }).join(' ');
};

module.exports = {
  generateMockMatches,
  groupMatchesByDate,
  formatDateDisplay,
  generateScoreString,
  playerPool,
  venues,
  regions,
  stages,
  eventNames
};