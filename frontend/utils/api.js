// API request utility
const app = getApp();

// API配置 - 支持本地开发和生产环境
const API_CONFIG = {
  // 生产环境API地址 (Render部署后的真实地址)
  production: 'https://zero729-wxapp-tennis.onrender.com/api',
  // 本地开发API地址
  development: 'http://localhost:8080/api'
};

// 使用生产环境 - Render服务已部署完成
const BASE_URL = API_CONFIG.production;

// 调试信息 - 在控制台显示当前使用的API地址
console.log('🚀 Tennis Heat API配置:');
console.log('📍 当前API地址:', BASE_URL);
console.log('🌍 环境模式: 生产环境 (Render云端)');

// 如果需要在开发时切换到本地环境，请取消下面的注释：
// const BASE_URL = (() => {
//   const systemInfo = wx.getSystemInfoSync();
//   const isDevTool = systemInfo.platform === 'devtools';
//   return isDevTool ? API_CONFIG.development : API_CONFIG.production;
// })();

// Mock data for development
const mockMatches = [
  {
    _id: '1',
    eventType: '男子单打',
    stage: '决赛',
    status: 'completed',
    venue: '中央球场',
    duration: '2h15',
    organizer: { name: '温布尔登网球俱乐部' },
    players: [
      { name: '费德勒', ranking: 1, avatar: null },
      { name: '纳达尔', ranking: 2, avatar: null }
    ],
    sets: [
      { setNumber: 1, score: { team1: 6, team2: 4 } },
      { setNumber: 2, score: { team1: 4, team2: 6 } },
      { setNumber: 3, score: { team1: 6, team2: 2 } }
    ]
  },
  {
    _id: '2',
    eventType: '女子双打',
    stage: '半决赛',
    status: 'ongoing',
    venue: '1号球场',
    duration: '1h45',
    organizer: { name: '美国网球协会' },
    players: [
      { name: '小威廉姆斯', ranking: 1, avatar: null },
      { name: '大威廉姆斯', ranking: 2, avatar: null }
    ],
    sets: [
      { setNumber: 1, score: { team1: 6, team2: 3 } },
      { setNumber: 2, score: { team1: 5, team2: 4 } }
    ]
  },
  {
    _id: '3',
    eventType: '混合双打',
    stage: '四分之一决赛',
    status: 'upcoming',
    venue: '2号球场',
    duration: null,
    organizer: { name: '网球热' },
    players: [
      { name: '穆雷', ranking: 3, avatar: null },
      { name: '莎拉波娃', ranking: 4, avatar: null }
    ],
    sets: []
  }
];

// 初始化默认赛事数据
const defaultEvents = [
  {
    _id: '1',
    name: '温布尔登锦标赛 2024',
    eventType: '男子单打',
    status: 'registration',
    venue: '全英俱乐部',
    region: '伦敦',
    eventDate: '2024-07-01',
    registrationDeadline: '2024-06-15',
    organizer: { name: '温布尔登网球俱乐部' },
    coverImage: null,
    createdAt: '2024-01-01',
    createdBy: 'system'
  },
  {
    _id: '2',
    name: '美国公开赛 2024',
    eventType: '女子单打',
    status: 'upcoming',
    venue: 'USTA比利·简·金',
    region: '纽约',
    eventDate: '2024-08-26',
    registrationDeadline: '2024-08-01',
    organizer: { name: '美国网球协会' },
    coverImage: null,
    createdAt: '2024-01-02',
    createdBy: 'system'
  }
];

// 获取存储的赛事数据，如果没有则使用默认数据
const getStoredEvents = () => {
  const storedEvents = wx.getStorageSync('events');
  if (storedEvents && storedEvents.length > 0) {
    return storedEvents;
  } else {
    // 首次使用，保存默认数据
    wx.setStorageSync('events', defaultEvents);
    return defaultEvents;
  }
};

// 保存赛事数据到本地存储
const saveEventsToStorage = (events) => {
  wx.setStorageSync('events', events);
};

// Request method for real API calls
const request = (url, method = 'GET', data = {}, showLoading = true) => {
  return new Promise((resolve, reject) => {
    if (showLoading) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }

    // 获取用户token
    const token = wx.getStorageSync('token');
    
    // 构建请求配置
    const requestConfig = {
      url: BASE_URL + url,
      method: method,
      header: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      success: (res) => {
        try {
          if (showLoading) {
            wx.hideLoading();
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Check if response is JSON
            if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
              console.warn('API返回HTML而非JSON，可能服务器配置错误，使用本地模拟数据');
              handleMockFallback(url, method, data, resolve, reject);
              return;
            }
            resolve(res.data);
          } else {
            console.error('API Error:', res);
            reject(new Error(res.data?.message || '请求失败'));
          }
        } catch (error) {
          if (showLoading) {
            wx.hideLoading();
          }
          console.error('Success handler error:', error);
          reject(error);
        }
      },
      fail: (err) => {
        try {
          if (showLoading) {
            wx.hideLoading();
          }
          
          console.error('Network Error:', err);
          
          // 如果网络请求失败，回退到本地模拟数据
          console.log('网络请求失败，使用本地模拟数据');
          handleMockFallback(url, method, data, resolve, reject);
        } catch (error) {
          if (showLoading) {
            wx.hideLoading();
          }
          console.error('Fail handler error:', error);
          reject(error);
        }
      }
    };

    // 如果是POST/PUT请求，添加数据
    if (method === 'POST' || method === 'PUT') {
      requestConfig.data = data;
    } else if (method === 'GET' && Object.keys(data).length > 0) {
      // GET请求的参数作为查询字符串
      const queryString = Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');
      requestConfig.url += `?${queryString}`;
    }

    // 发起请求
    wx.request(requestConfig);
  });
};

// 网络失败时的模拟数据回退处理
const handleMockFallback = (url, method, data, resolve, reject) => {
  setTimeout(() => {
    try {
      // Mock API responses as fallback
      if (url.includes('/matches')) {
        // 生成完整的网球比赛模拟数据
        const allMatches = generateTennisMatches(50);
        
        // 应用筛选条件
        let filteredMatches = allMatches;
        
        if (data.status) {
          const statusMap = {
            'ongoing': '比赛中',
            'completed': '已结束', 
            'upcoming': '报名中'
          };
          const chineseStatus = statusMap[data.status] || data.status;
          filteredMatches = filteredMatches.filter(match => match.status === chineseStatus);
        }
        
        if (data.eventType) {
          filteredMatches = filteredMatches.filter(match => match.eventType === data.eventType);
        }
        
        if (data.player) {
          filteredMatches = filteredMatches.filter(match => 
            match.players.team1.some(p => p.name.includes(data.player)) ||
            match.players.team2.some(p => p.name.includes(data.player))
          );
        }
        
        if (data.region) {
          filteredMatches = filteredMatches.filter(match => match.region.includes(data.region));
        }
        
        // 分页处理
        const page = parseInt(data.page) || 1;
        const pageSize = parseInt(data.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const paginatedMatches = filteredMatches.slice(skip, skip + pageSize);
        
        // 按日期分组并格式化
        const groupedData = groupTennisMatchesByDate(paginatedMatches);
        
        resolve({ 
          data: groupedData,
          pagination: {
            page: page,
            limit: pageSize,
            total: filteredMatches.length,
            pages: Math.ceil(filteredMatches.length / pageSize)
          }
        });
      } else if (url.includes('/events') && method === 'GET') {
        // 获取赛事列表
        const events = getStoredEvents();
        resolve({ data: events });
      } else if (url.includes('/events') && method === 'POST') {
        // 创建新赛事
        const events = getStoredEvents();
        const newEvent = {
          _id: Date.now().toString(),
          ...data,
          status: 'registration',
          organizer: { name: wx.getStorageSync('userInfo')?.nickName || '用户' },
          coverImage: null,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: wx.getStorageSync('userInfo')?.id || 'user'
        };
        events.push(newEvent);
        saveEventsToStorage(events);
        resolve({ data: newEvent });
      } else if (url.includes('/users/')) {
        resolve({
          data: {
            id: 'user123',
            nickname: '网球选手',
            avatar: null,
            stats: {
              participationCount: 15,
              wins: 10,
              losses: 5,
              winRate: '67%',
              etaPoints: 2500
            }
          }
        });
      } else if (url.includes('/auth/login') || url.includes('/auth/dev-login')) {
        // 模拟登录成功
        const mockUser = {
          id: 'user_' + Date.now(),
          nickName: '网球选手',
          phone: data.phone || '',
          avatarUrl: null
        };
        wx.setStorageSync('token', 'mock_token_' + Date.now());
        wx.setStorageSync('userInfo', mockUser);
        resolve({ 
          data: { 
            user: mockUser, 
            accessToken: wx.getStorageSync('token')
          } 
        });
      } else {
        resolve({ data: [] });
      }
    } catch (error) {
      reject(error);
    }
  }, 500);
};

// 网球比赛模拟数据生成函数
const generateTennisMatches = (count = 30) => {
  const playerPool = {
    '男子单打': [
      { name: '德约科维奇', ranking: 1, avatar: null },
      { name: '纳达尔', ranking: 2, avatar: null },
      { name: '费德勒', ranking: 3, avatar: null },
      { name: '梅德韦杰夫', ranking: 4, avatar: null },
      { name: '兹维列夫', ranking: 5, avatar: null },
      { name: '卢布列夫', ranking: 6, avatar: null },
      { name: '贝雷蒂尼', ranking: 7, avatar: null },
      { name: '胡尔卡奇', ranking: 8, avatar: null },
      { name: '张之臻', ranking: 45, avatar: null },
      { name: '商竣程', ranking: 67, avatar: null }
    ],
    '女子单打': [
      { name: '斯瓦泰克', ranking: 1, avatar: null },
      { name: '萨巴伦卡', ranking: 2, avatar: null },
      { name: '加芙', ranking: 3, avatar: null },
      { name: '萨卡里', ranking: 4, avatar: null },
      { name: '贾贝尔', ranking: 5, avatar: null },
      { name: '里巴金娜', ranking: 6, avatar: null },
      { name: '王蔷', ranking: 23, avatar: null },
      { name: '郑钦文', ranking: 28, avatar: null },
      { name: '朱琳', ranking: 35, avatar: null },
      { name: '张帅', ranking: 42, avatar: null }
    ],
    '男子双打': [
      { name: '库伯特', ranking: 1, avatar: null },
      { name: '梅洛', ranking: 2, avatar: null },
      { name: '格拉诺勒斯', ranking: 3, avatar: null },
      { name: '泽巴洛斯', ranking: 4, avatar: null }
    ],
    '女子双打': [
      { name: '克雷吉茨科娃', ranking: 1, avatar: null },
      { name: '西尼亚科娃', ranking: 2, avatar: null },
      { name: '徐一璠', ranking: 5, avatar: null },
      { name: '杨钊煊', ranking: 6, avatar: null }
    ],
    '混合双打': [
      { name: '德约科维奇', ranking: 1, avatar: null },
      { name: '斯瓦泰克', ranking: 1, avatar: null },
      { name: '纳达尔', ranking: 2, avatar: null },
      { name: '萨巴伦卡', ranking: 2, avatar: null }
    ]
  };

  const venues = [
    { name: '菲利普·夏蒂埃球场', court: '中央球场', location: '法国巴黎' },
    { name: '温布尔登中央球场', court: '中央球场', location: '英国伦敦' },
    { name: '亚瑟·阿什球场', court: '中央球场', location: '美国纽约' },
    { name: '罗德·拉沃尔球场', court: '中央球场', location: '澳大利亚墨尔本' },
    { name: '钻石球场', court: '中央球场', location: '中国上海' },
    { name: '国家网球中心', court: '中央球场', location: '中国北京' }
  ];

  const eventNames = [
    '法国网球公开赛', '温布尔登网球锦标赛', '美国网球公开赛', '澳大利亚网球公开赛',
    '上海大师赛', '中国网球公开赛', '马德里大师赛', '罗马大师赛'
  ];

  const stages = ['资格赛', '第一轮', '第二轮', '第三轮', '16强', '8强', '4强', '半决赛', '决赛'];
  const eventTypes = ['男子单打', '女子单打', '男子双打', '女子双打', '混合双打'];
  const statuses = ['已结束', '比赛中', '报名中'];

  const matches = [];

  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];

    // 选择选手
    let team1Players, team2Players;
    
    // 确保该赛事类型有对应的选手池
    let availablePlayers = playerPool[eventType];
    if (!availablePlayers || !Array.isArray(availablePlayers)) {
      console.warn(`No player pool found for eventType: ${eventType}, using 男子单打 as fallback`);
      const fallbackPlayers = playerPool['男子单打'] || [];
      if (fallbackPlayers.length === 0) {
        console.error('No fallback players available');
        continue; // Skip this match generation
      }
      availablePlayers = fallbackPlayers;
    }
    
    if (eventType.includes('双打')) {
      const players = [...availablePlayers];
      team1Players = [
        players.splice(Math.floor(Math.random() * players.length), 1)[0],
        players.splice(Math.floor(Math.random() * players.length), 1)[0]
      ];
      team2Players = [
        players.splice(Math.floor(Math.random() * players.length), 1)[0],
        players.splice(Math.floor(Math.random() * players.length), 1)[0]
      ];
    } else {
      const players = [...availablePlayers];
      team1Players = [players.splice(Math.floor(Math.random() * players.length), 1)[0]];
      team2Players = [players.splice(Math.floor(Math.random() * players.length), 1)[0]];
    }

    // 生成比分
    let score = { sets: [], winner: null };
    if (status === '已结束') {
      score = generateCompletedScore();
    } else if (status === '比赛中') {
      const completedSets = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < completedSets; j++) {
        score.sets.push(generateSetScore(j + 1));
      }
    }

    // 生成时间
    const scheduledTime = new Date();
    scheduledTime.setDate(scheduledTime.getDate() + Math.floor(Math.random() * 10) - 7);
    scheduledTime.setHours(Math.floor(Math.random() * 12) + 8);
    scheduledTime.setMinutes(Math.floor(Math.random() * 4) * 15);

    const match = {
      _id: `match_${i + 1}`,
      matchName: `${eventName} ${eventType} ${stage}`,
      eventType: eventType,
      eventName: eventName,
      status: status,
      stage: stage,
      venue: venue.name,
      court: venue.court,
      region: venue.location,
      scheduledTime: scheduledTime,
      timeString: `${scheduledTime.getHours().toString().padStart(2, '0')}:${scheduledTime.getMinutes().toString().padStart(2, '0')}`,
      duration: status === '已结束' ? generateDuration(score.sets) : null,
      players: {
        team1: team1Players,
        team2: team2Players
      },
      score: score,
      isLive: status === '比赛中',
      viewCount: Math.floor(Math.random() * 50000),
      createdAt: scheduledTime
    };

    matches.push(match);
  }

  return matches;
};

// 生成已完成比赛的比分
const generateCompletedScore = () => {
  const sets = [];
  let team1Sets = 0;
  let team2Sets = 0;
  const setsToWin = 2; // 3盘2胜

  while (team1Sets < setsToWin && team2Sets < setsToWin) {
    const set = generateSetScore(sets.length + 1);
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
const generateSetScore = (setNumber) => {
  const scenarios = [
    { team1: 6, team2: 4 },
    { team1: 6, team2: 3 },
    { team1: 6, team2: 2 },
    { team1: 6, team2: 1 },
    { team1: 4, team2: 6 },
    { team1: 3, team2: 6 },
    { team1: 2, team2: 6 },
    { team1: 1, team2: 6 },
    { team1: 7, team2: 5 },
    { team1: 5, team2: 7 },
    { team1: 7, team2: 6, tiebreak: { played: true, team1Score: 7, team2Score: 5 } },
    { team1: 6, team2: 7, tiebreak: { played: true, team1Score: 5, team2Score: 7 } }
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  return {
    setNumber: setNumber,
    team1Score: scenario.team1,
    team2Score: scenario.team2,
    tiebreak: scenario.tiebreak || { played: false, team1Score: 0, team2Score: 0 }
  };
};

// 生成比赛持续时间
const generateDuration = (sets) => {
  const baseTime = 45;
  const totalTime = baseTime * sets.length + Math.floor(Math.random() * 30);
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
};

// 按日期分组比赛
const groupTennisMatchesByDate = (matches) => {
  const grouped = {};

  matches.forEach(match => {
    const date = new Date(match.scheduledTime);
    const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(match);
  });

  // 按日期排序
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
  const result = sortedDates.map(date => ({
    date: date,
    dateDisplay: formatDateDisplay(date),
    matches: grouped[date].map(match => ({
      ...match,
      scoreString: generateScoreString(match.score.sets),
      winnerTeam: match.score.winner
    }))
  }));

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

  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }

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

// Add a global error handler
const handleApiError = (err) => {
  console.error('API Request Error:', err);
  wx.showToast({
    title: '网络请求失败',
    icon: 'none',
    duration: 2000
  });
};

// API endpoints
const API = {
  // Auth - Enhanced Authentication System
  login: (data) => request('/auth/login', 'POST', data),
  devLogin: (data) => request('/auth/dev-login', 'POST', data),
  refreshToken: (data) => request('/auth/refresh', 'POST', data),
  getUserProfile: () => request('/auth/profile', 'GET'),
  updateUserProfile: (data) => request('/auth/profile', 'PUT', data),
  getUserStats: () => request('/auth/stats', 'GET'),
  getUserAchievements: () => request('/auth/achievements', 'GET'),
  getUserMatches: (params) => request('/auth/matches', 'GET', params),
  getUserDetailedMatches: (params) => request('/auth/matches/detailed', 'GET', params),
  getLeaderboard: (params) => request('/auth/leaderboard', 'GET', params),
  searchUsers: (params) => request('/auth/search', 'GET', params),
  checkUserPermission: (permission) => request(`/auth/permission/${permission}`, 'GET'),
  updateUserActivity: () => request('/auth/activity', 'POST'),
  getSystemStats: () => request('/auth/system-stats', 'GET'),
  deactivateAccount: () => request('/auth/account', 'DELETE'),
  
  // Events
  getEvents: (params) => request('/events', 'GET', params),
  getEventDetail: (id) => request(`/events/${id}`, 'GET'),
  createEvent: (data) => request('/events', 'POST', data),
  updateEvent: (id, data) => request(`/events/${id}`, 'PUT', data),
  deleteEvent: (id) => request(`/events/${id}`, 'DELETE'),
  
  // Matches - Enhanced Match Management System
  getMatches: (params) => request('/matches', 'GET', params),
  getMatchDetail: (id) => {
    // Return mock match detail with enhanced data
    const match = mockMatches.find(m => m._id === id);
    if (match) {
      // Add enhanced match data
      return Promise.resolve({
        ...match,
        matchStats: {
          spectatorCount: Math.floor(Math.random() * 100),
          viewCount: Math.floor(Math.random() * 1000),
          duration: match.duration || '2h15m'
        },
        spectators: [],
        userRelation: {
          isSpectator: false,
          isOrganizer: false,
          canUpdateScore: false
        },
        scoreSummary: match.score || { sets: [], winner: null },
        isLive: match.status === 'ongoing'
      });
    }
    return Promise.resolve(mockMatches[0]);
  },
  getMatchStats: (params) => request('/matches/stats', 'GET', params),
  getLiveMatches: (params) => request('/matches/live', 'GET', params),
  searchMatches: (params) => request('/matches/search', 'GET', params),
  getUserMatches: (params) => request('/matches/user/matches', 'GET', params),
  createMatch: (data) => request('/matches', 'POST', data),
  updateMatch: (id, data) => request(`/matches/${id}`, 'PUT', data),
  updateMatchScore: (matchId, data) => request(`/matches/${matchId}/score`, 'PUT', data),
  startMatch: (matchId) => request(`/matches/${matchId}/start`, 'PUT'),
  endMatch: (matchId) => request(`/matches/${matchId}/end`, 'PUT'),
  addSpectator: (matchId) => request(`/matches/${matchId}/spectators`, 'POST'),
  removeSpectator: (matchId) => request(`/matches/${matchId}/spectators`, 'DELETE'),
  deleteMatch: (id) => request(`/matches/${id}`, 'DELETE'),
  
  // Users
  getUserProfile: (id) => request(`/users/${id}`, 'GET'),
  updateUserProfile: (id, data) => request(`/users/${id}`, 'PUT', data),
  getUserMatches: (id, params) => request(`/users/${id}/matches`, 'GET', params),
  
  // Clubs
  getClubs: () => Promise.resolve({ data: [
    { id: '1', name: 'LT・JIMMY 俱乐部', points: 3000, logo: null },
    { id: '2', name: '网球专业俱乐部', points: 2500, logo: null }
  ]}),
  getClubDetail: (id) => request(`/clubs/${id}`, 'GET'),
  getClubMembers: (id) => request(`/clubs/${id}/members`, 'GET'),
  getClubLeaderboard: (id) => request(`/clubs/${id}/leaderboard`, 'GET'),
  
  // Registration
  registerForEvent: (eventId, data) => request(`/events/${eventId}/register`, 'POST', data),
  cancelRegistration: (eventId) => request(`/events/${eventId}/register`, 'DELETE'),

  // Popular Events - 获取热门赛事
  getPopularEvents: (params) => {
    // 生成模拟热门赛事数据
    return new Promise((resolve) => {
      const popularEvents = [
        {
          _id: 'popular_1',
          name: '2024年温布尔登网球锦标赛',
          eventType: '男子单打',
          status: 'registration',
          venue: '全英俱乐部',
          region: '英国伦敦',
          eventDate: '2024-07-01',
          registrationDeadline: '2024-06-15',
          participantCount: 128,
          maxParticipants: 128,
          registrationFee: 500,
          prizePool: 50000,
          organizer: { name: '温布尔登网球俱乐部', id: 'org_1' },
          coverImage: null,
          popularity: 95,
          tags: ['大满贯', '草地', '传统']
        },
        {
          _id: 'popular_2',
          name: '上海网球大师赛',
          eventType: '男子单打',
          status: 'upcoming',
          venue: '旗忠森林体育城',
          region: '中国上海',
          eventDate: '2024-10-05',
          registrationDeadline: '2024-09-15',
          participantCount: 56,
          maxParticipants: 64,
          registrationFee: 300,
          prizePool: 30000,
          organizer: { name: '上海体育局', id: 'org_2' },  
          coverImage: null,
          popularity: 88,
          tags: ['大师赛', '硬地', '亚洲']
        },
        {
          _id: 'popular_3',
          name: '中国网球公开赛',
          eventType: '女子单打',
          status: 'registration',
          venue: '国家网球中心',
          region: '中国北京',
          eventDate: '2024-09-25',
          registrationDeadline: '2024-09-05',
          participantCount: 32,
          maxParticipants: 64,
          registrationFee: 200,
          prizePool: 25000,
          organizer: { name: '中国网球协会', id: 'org_3' },
          coverImage: null,
          popularity: 82,
          tags: ['WTA', '硬地', '中国']
        },
        {
          _id: 'popular_4',
          name: '法国网球公开赛',
          eventType: '混合双打',
          status: 'upcoming',
          venue: '罗兰·加洛斯',
          region: '法国巴黎',
          eventDate: '2024-05-27',
          registrationDeadline: '2024-05-10',
          participantCount: 24,
          maxParticipants: 32,
          registrationFee: 400,
          prizePool: 20000,
          organizer: { name: '法国网球联合会', id: 'org_4' },
          coverImage: null,
          popularity: 79,
          tags: ['大满贯', '红土', '双打']
        },
        {
          _id: 'popular_5',
          name: '澳大利亚网球公开赛',
          eventType: '青少年组',
          status: 'registration',
          venue: '墨尔本公园',
          region: '澳大利亚墨尔本',
          eventDate: '2024-01-15',
          registrationDeadline: '2023-12-20',
          participantCount: 16,
          maxParticipants: 32,
          registrationFee: 150,
          prizePool: 10000,
          organizer: { name: '澳大利亚网球协会', id: 'org_5' },
          coverImage: null,
          popularity: 75,
          tags: ['大满贯', '硬地', '青少年']
        }
      ];

      // 按照热门度排序
      const sortedEvents = popularEvents.sort((a, b) => b.popularity - a.popularity);
      
      // 应用分页参数
      const limit = params?.limit || 10;
      const offset = params?.offset || 0;
      const paginatedEvents = sortedEvents.slice(offset, offset + limit);

      resolve({
        data: paginatedEvents,
        total: popularEvents.length,
        hasMore: offset + limit < popularEvents.length
      });
    });
  }
};

// WebSocket connection (mock for now)
const connectWebSocket = (url, onMessageCallback, onCloseCallback) => {
  console.log(`Attempting to connect WebSocket to: ${url}`);
  
  // Simulate WebSocket connection and message receiving
  const mockWebSocket = {
    send: (data) => {
      console.log('Mock WebSocket sending:', data);
    },
    close: () => {
      console.log('Mock WebSocket closed.');
      if (onCloseCallback) {
        onCloseCallback();
      }
    }
  };

  // Simulate receiving a message after a delay
  setTimeout(() => {
    const mockScoreUpdate = {
      type: 'score_update',
      matchId: '1', // Assuming matchId 1 for now
      newScore: {
        setNumber: 2,
        score: { team1: 6, team2: 5 },
        tiebreak: { played: true, team1: 7, team2: 5 }
      }
    };
    console.log('Mock WebSocket received:', mockScoreUpdate);
    if (onMessageCallback) {
      onMessageCallback(mockScoreUpdate);
    }
  }, 5000); // Simulate 5 seconds delay for first update

  return mockWebSocket;
};

module.exports = {
  request,
  API,
  connectWebSocket
}; 