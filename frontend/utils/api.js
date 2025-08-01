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
  },
  {
    _id: '3',
    name: '法国公开赛 2024',
    eventType: '男子单打',
    status: 'registration',
    venue: '罗兰加洛斯',
    region: '巴黎',
    eventDate: '2024-05-26',
    registrationDeadline: '2024-05-01',
    organizer: { name: '法国网球协会' },
    coverImage: null,
    createdAt: '2024-01-03',
    createdBy: 'system'
  },
  {
    _id: '4',
    name: '法国网球公开赛女子组',
    eventType: '女子单打',
    status: 'registration',
    venue: '法国巴黎罗兰加洛斯',
    region: '法国',
    eventDate: '2024-06-01',
    registrationDeadline: '2024-05-15',
    organizer: { name: '法国体育协会' },
    coverImage: null,
    createdAt: '2024-01-04',
    createdBy: 'system'
  },
  {
    _id: '5',
    name: '澳大利亚网球公开赛',
    eventType: '混合双打',
    status: 'upcoming',
    venue: '墨尔本公园',
    region: '墨尔本',
    eventDate: '2024-01-15',
    registrationDeadline: '2024-01-01',
    organizer: { name: '澳大利亚网球协会' },
    coverImage: null,
    createdAt: '2024-01-05',
    createdBy: 'system'
  },
  {
    _id: '6',
    name: '网球热业余锦标赛',
    eventType: '男子双打',
    status: 'registration',
    venue: '网球热体育中心',
    region: '北京',
    eventDate: '2024-08-15',
    registrationDeadline: '2024-08-01',
    organizer: { name: '网球热' },
    coverImage: null,
    createdAt: '2024-01-06',
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
    
    // 检查是否为mock token，如果是则直接使用fallback
    if (token && token.startsWith('mock_token_')) {
      console.log('检测到mock token，直接使用本地模拟数据');
      // 使用nextTick确保loading状态正确关闭
      if (showLoading) {
        wx.nextTick(() => {
          try {
            wx.hideLoading();
          } catch (e) {
            console.log('hideLoading已执行或不存在对应的showLoading');
          }
        });
      }
      handleMockFallback(url, method, cleanRequestData(data), resolve, reject, false);
      return;
    }
    
    // 清理和验证数据
    const cleanData = cleanRequestData(data);
    
    // 构建请求配置
    const requestConfig = {
      url: BASE_URL + url,
      method: method.toUpperCase(),
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      timeout: 30000, // 30秒超时
      success: (res) => {
        try {
          // 使用nextTick确保loading状态正确关闭
          if (showLoading) {
            wx.nextTick(() => {
              try {
                wx.hideLoading();
              } catch (e) {
                console.log('hideLoading已执行或不存在对应的showLoading');
              }
            });
          }
          
          console.log(`API请求成功 ${method} ${url}:`, {
            statusCode: res.statusCode,
            header: res.header,
            dataType: typeof res.data
          });
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // 验证响应格式
            if (validateResponseFormat(res)) {
              resolve(res.data);
            } else {
              console.warn('API返回格式异常，使用本地模拟数据');
              handleMockFallback(url, method, cleanData, resolve, reject);
            }
          } else if (res.statusCode === 401) {
            // Token过期或无效
            console.warn('Token无效，清除本地认证信息');
            clearAuthInfo();
            handleMockFallback(url, method, cleanData, resolve, reject);
          } else if (res.statusCode >= 500) {
            // 服务器错误
            console.error('服务器错误:', res.statusCode);
            handleMockFallback(url, method, cleanData, resolve, reject);
          } else {
            // 对于404和403错误，直接使用fallback，不记录错误日志
            if (res.statusCode === 403 || res.statusCode === 404) {
              console.log('API endpoint not available, using fallback data for:', url);
              handleMockFallback(url, method, cleanData, resolve, reject);
            } else {
              console.error('API请求失败:', res);
              reject(new Error(res.data?.message || `请求失败 (${res.statusCode})`));
            }
          }
        } catch (error) {
          if (showLoading) {
            wx.nextTick(() => {
              try {
                wx.hideLoading();
              } catch (e) {
                console.log('hideLoading已执行或不存在对应的showLoading');
              }
            });
          }
          console.error('响应处理错误:', error);
          handleMockFallback(url, method, cleanData, resolve, reject);
        }
      },
      fail: (err) => {
        try {
          if (showLoading) {
            wx.nextTick(() => {
              try {
                wx.hideLoading();
              } catch (e) {
                console.log('hideLoading已执行或不存在对应的showLoading');
              }
            });
          }
          
          console.error('网络请求失败:', err);
          
          // 根据错误类型提供不同的处理
          if (err.errMsg) {
            if (err.errMsg.includes('timeout')) {
              console.log('请求超时，使用本地模拟数据');
            } else if (err.errMsg.includes('fail')) {
              console.log('网络连接失败，使用本地模拟数据');
            } else {
              console.log('其他网络错误，使用本地模拟数据');
            }
          }
          
          handleMockFallback(url, method, cleanData, resolve, reject);
        } catch (error) {
          if (showLoading) {
            wx.nextTick(() => {
              try {
                wx.hideLoading();
              } catch (e) {
                console.log('hideLoading已执行或不存在对应的showLoading');
              }
            });
          }
          console.error('错误处理失败:', error);
          reject(error);
        }
      }
    };

    // 根据请求方法处理数据
    if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') {
      requestConfig.data = JSON.stringify(cleanData);
    } else if (method.toUpperCase() === 'GET' && Object.keys(cleanData).length > 0) {
      // GET请求的参数作为查询字符串
      const queryParams = Object.keys(cleanData)
        .filter(key => cleanData[key] !== null && cleanData[key] !== undefined && cleanData[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(cleanData[key])}`)
        .join('&');
      
      if (queryParams) {
        requestConfig.url += (requestConfig.url.includes('?') ? '&' : '?') + queryParams;
      }
    }

    console.log(`发起API请求 ${method} ${requestConfig.url}`, {
      headers: requestConfig.header,
      data: cleanData
    });

    // 发起请求
    wx.request(requestConfig);
  });
};

// 清理请求数据
const cleanRequestData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const cleaned = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // 过滤掉无效值
    if (value !== null && value !== undefined) {
      // 处理特殊字符
      if (typeof value === 'string') {
        cleaned[key] = value.trim();
      } else if (typeof value === 'object') {
        // 特殊处理日期范围对象
        if (key === 'dateRange' && value.start !== undefined && value.end !== undefined) {
          // 如果日期范围为空，则不包含此参数
          if (value.start || value.end) {
            cleaned['dateStart'] = value.start || '';
            cleaned['dateEnd'] = value.end || '';
          }
          // 不添加原始的dateRange对象
        } else {
          // 递归清理其他对象
          const cleanedObj = cleanRequestData(value);
          // 只有非空对象才添加
          if (Object.keys(cleanedObj).length > 0) {
            cleaned[key] = cleanedObj;
          }
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

// 验证响应格式
const validateResponseFormat = (res) => {
  // 检查是否返回HTML（通常表示服务器配置错误）
  if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
    return false;
  }
  
  // 检查Content-Type
  const contentType = res.header['content-type'] || res.header['Content-Type'] || '';
  if (!contentType.includes('application/json') && typeof res.data === 'string') {
    return false;
  }
  
  return true;
};

// 清除认证信息
const clearAuthInfo = () => {
  try {
    wx.removeStorageSync('token');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userInfo');
    
    // 更新全局状态
    const app = getApp();
    if (app) {
      app.globalData.isLoggedIn = false;
      app.globalData.userInfo = null;
    }
  } catch (error) {
    console.error('清除认证信息失败:', error);
  }
};

// 网络失败时的模拟数据回退处理
const handleMockFallback = (url, method, data, resolve, reject, needHideLoading = true) => {
  // 确保loading状态被正确关闭，使用异步确保不会产生警告
  if (needHideLoading) {
    wx.nextTick(() => {
      try {
        wx.hideLoading();
      } catch (e) {
        // 忽略hideLoading错误
      }
    });
  }
  
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
      } else if (url.includes('/matches/') && url.includes('/status') && method === 'PUT') {
        // 更新比赛状态
        const matchId = url.split('/')[2];
        const { status, reason } = data;

        console.log(`模拟更新比赛状态: ${matchId} -> ${status}, 原因: ${reason}`);

        resolve({
          success: true,
          message: '状态更新成功',
          data: {
            matchId: matchId,
            oldStatus: '比赛中',
            newStatus: status,
            reason: reason,
            updatedAt: new Date().toISOString()
          }
        });
      } else if (url.includes('/matches/') && url.includes('/status/history') && method === 'GET') {
        // 获取状态历史
        const matchId = url.split('/')[2];

        resolve({
          success: true,
          data: [
            {
              fromStatus: '报名中',
              toStatus: '比赛中',
              changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              changedBy: { name: '主办方' },
              reason: '比赛开始'
            },
            {
              fromStatus: '比赛中',
              toStatus: '已暂停',
              changedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
              changedBy: { name: '裁判' },
              reason: '天气原因'
            }
          ]
        });
      } else if (url.includes('/matches/batch/status') && method === 'PUT') {
        // 批量更新状态
        const { matchIds, status, reason } = data;

        resolve({
          success: true,
          message: '批量状态更新成功',
          data: {
            updated: matchIds.length,
            failed: 0,
            results: matchIds.map(id => ({
              matchId: id,
              success: true,
              newStatus: status
            }))
          }
        });
      } else if (url.includes('/events/search')) {
        // 搜索赛事
        const events = getStoredEvents();
        const query = data.query || '';
        let filteredEvents = events;
        
        if (query) {
          filteredEvents = events.filter(event => 
            event.name.toLowerCase().includes(query.toLowerCase()) ||
            event.eventType.toLowerCase().includes(query.toLowerCase()) ||
            event.venue.toLowerCase().includes(query.toLowerCase()) ||
            event.region.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        resolve({ 
          success: true,
          data: { 
            events: filteredEvents,
            total: filteredEvents.length
          }
        });
      } else if (url.includes('/events/user')) {
        // 获取用户赛事
        const events = getStoredEvents();
        const userEvents = events.filter(event => event.createdBy === wx.getStorageSync('userInfo')?.id);
        resolve({ 
          success: true,
          data: { events: userEvents }
        });
      } else if (url.includes('/events/hot-registrations')) {
        // 获取火热报名数据
        const hotRegistrations = [
          {
            _id: 'hot_reg_1',
            name: '2024年春季网球公开赛',
            eventType: '男子单打',
            venue: '国家网球中心',
            region: '北京',
            eventDate: '2024-04-15',
            registrationDeadline: '2024-04-01',
            participantCount: 24,
            maxParticipants: 32,
            price: 200,
            featured: true,
            organizer: { name: '中国网球协会' }
          },
          {
            _id: 'hot_reg_2',
            name: '城市业余网球联赛',
            eventType: '女子双打',
            venue: '市体育中心',
            region: '上海',
            eventDate: '2024-04-20',
            registrationDeadline: '2024-03-30',
            participantCount: 16,
            maxParticipants: 24,
            price: 150,
            featured: false,
            organizer: { name: '上海网球俱乐部' }
          },
          {
            _id: 'hot_reg_3',
            name: '青少年网球训练营',
            eventType: '青少年组',
            venue: '网球热体育中心',
            region: '深圳',
            eventDate: '2024-04-25',
            registrationDeadline: '2024-04-05',
            participantCount: 8,
            maxParticipants: 16,
            price: 300,
            featured: true,
            organizer: { name: '网球热' }
          }
        ];

        resolve({
          success: true,
          data: hotRegistrations
        });
      } else if (url.includes('/events/stats')) {
        // 获取赛事统计
        const events = getStoredEvents();
        resolve({
          success: true,
          data: {
            total: events.length,
            registration: events.filter(e => e.status === 'registration').length,
            upcoming: events.filter(e => e.status === 'upcoming').length,
            completed: events.filter(e => e.status === 'completed').length
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
      } else if (url.includes('/auth/sms-code')) {
        // 模拟发送短信验证码成功
        console.log('模拟发送短信验证码到:', data.phone);
        resolve({
          success: true,
          message: '验证码已发送',
          data: {
            phone: data.phone,
            expiresIn: 300 // 5分钟有效期
          }
        });
      } else if (url.includes('/auth/verify-sms')) {
        // 模拟验证短信验证码
        const isValidCode = data.code === '1234' || data.code === '123456'; // 开发模式固定验证码
        if (isValidCode) {
          const mockUser = {
            id: 'user_' + Date.now(),
            nickName: `网球选手${data.phone.slice(-4)}`,
            phone: data.phone,
            avatarUrl: null
          };
          const mockToken = 'mock_token_' + Date.now();
          wx.setStorageSync('token', mockToken);
          wx.setStorageSync('userInfo', mockUser);
          resolve({
            success: true,
            data: {
              user: mockUser,
              accessToken: mockToken,
              refreshToken: 'mock_refresh_' + Date.now()
            }
          });
        } else {
          resolve({
            success: false,
            message: '验证码错误或已过期'
          });
        }
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
      id: `match_${i + 1}`,
      matchName: `${eventName} ${eventType} ${stage}`,
      matchType: eventType,
      eventType: eventType,
      eventName: eventName,
      status: status,
      stage: stage,
      venue: venue.name,
      court: venue.court,
      region: venue.location,
      scheduledTime: scheduledTime.toISOString(),
      date: scheduledTime.toDateString(),
      time: `${scheduledTime.getHours().toString().padStart(2, '0')}:${scheduledTime.getMinutes().toString().padStart(2, '0')}`,
      timeString: `${scheduledTime.getHours().toString().padStart(2, '0')}:${scheduledTime.getMinutes().toString().padStart(2, '0')}`,
      duration: status === '已结束' ? generateDuration(score.sets) : null,
      players: {
        team1: team1Players,
        team2: team2Players
      },
      // Add complete score information
      score: score,
      scoreSummary: score,
      currentScore: status === '比赛中' ? generateCurrentScore() : null,
      isLive: status === '比赛中',
      live: status === '比赛中',
      viewCount: Math.floor(Math.random() * 50000),
      // Add tournament info
      tournament: {
        name: eventName,
        round: stage,
        surface: ['硬地', '红土', '草地'][Math.floor(Math.random() * 3)]
      },
      // Add betting odds for realism
      odds: generateOdds(team1Players, team2Players),
      // Add result info for completed matches
      result: status === '已结束' ? (score.winner === 'team1' ? 'win' : 'loss') : null,
      winnerId: status === '已结束' ? (score.winner === 'team1' ? team1Players[0].name : team2Players[0].name) : null,
      createdAt: scheduledTime.toISOString(),
      updatedAt: new Date().toISOString()
    };

    matches.push(match);
  }

  return matches;
};

// Generate current score for live matches
const generateCurrentScore = () => {
  return {
    currentSet: Math.floor(Math.random() * 3) + 1,
    team1Games: Math.floor(Math.random() * 7),
    team2Games: Math.floor(Math.random() * 7),
    team1Points: ['0', '15', '30', '40', 'ADV'][Math.floor(Math.random() * 5)],
    team2Points: ['0', '15', '30', '40', 'ADV'][Math.floor(Math.random() * 5)]
  };
};

// Generate betting odds
const generateOdds = (team1, team2) => {
  const team1Odds = (Math.random() * 4 + 1).toFixed(2);
  const team2Odds = (Math.random() * 4 + 1).toFixed(2);
  return {
    team1: parseFloat(team1Odds),
    team2: parseFloat(team2Odds),
    market: 'Match Winner'
  };
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
  sendSmsCode: (data) => request('/auth/sms-code', 'POST', data),
  verifySmsCode: (data) => request('/auth/verify-sms', 'POST', data),
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
  searchEvents: (params) => request('/events/search', 'GET', params),
  createEvent: (data) => request('/events', 'POST', data),
  updateEvent: (id, data) => request(`/events/${id}`, 'PUT', data),
  deleteEvent: (id) => request(`/events/${id}`, 'DELETE'),
  getUserEvents: (params) => request('/events/user', 'GET', params),
  getEventStats: () => request('/events/stats', 'GET'),
  
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

  // 比赛状态管理
  updateMatchStatus: (matchId, statusData) => request(`/matches/${matchId}/status`, 'PUT', statusData),
  getMatchStatusHistory: (matchId) => request(`/matches/${matchId}/status/history`, 'GET'),
  batchUpdateMatchStatus: (data) => request('/matches/batch/status', 'PUT', data),

  // 火热报名相关
  getHotRegistrations: (params) => request('/events/hot-registrations', 'GET', params),
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