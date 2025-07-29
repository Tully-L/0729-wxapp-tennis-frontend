const User = require('../models/User');
const { generateTokenPair, verifyToken } = require('../utils/jwt');
const { WeChatAPIError, BusinessError } = require('../middleware/errorHandler');
const axios = require('axios');

// 微信登录
const wechatLogin = async (req, res, next) => {
  try {
    // 检查数据库连接
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not established. Please ensure MongoDB is running and connected.'
      });
    }

    const { code, userInfo } = req.body;

    // 验证必需参数
    if (!code) {
      throw new BusinessError('微信授权码不能为空', 'MISSING_CODE');
    }

    // 验证环境变量
    if (!process.env.WECHAT_APPID || !process.env.WECHAT_SECRET) {
      throw new BusinessError('微信小程序配置不完整', 'WECHAT_CONFIG_MISSING');
    }

    // 获取微信 openid 和 session_key
    const wechatResponse = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`,
      { timeout: 10000 }
    );

    if (wechatResponse.data.errcode) {
      throw new WeChatAPIError(
        `微信登录失败: ${wechatResponse.data.errmsg}`,
        wechatResponse.data
      );
    }

    const { openid, unionid, session_key } = wechatResponse.data;

    if (!openid) {
      throw new WeChatAPIError('未获取到用户openid', wechatResponse.data);
    }

    // 查找或创建用户
    let user = await User.findOne({ openid });
    let isNewUser = false;

    if (!user) {
      // 创建新用户
      isNewUser = true;
      user = new User({
        openid,
        unionid,
        nickname: userInfo?.nickName || `网球选手${Date.now().toString().slice(-4)}`,
        avatar: userInfo?.avatarUrl || null,
        gender: userInfo?.gender === 1 ? 'male' : userInfo?.gender === 2 ? 'female' : 'unknown'
      });
      
      console.log(`🆕 Creating new user: ${user.nickname} (${openid})`);
    } else {
      // 更新现有用户信息
      if (userInfo?.nickName) user.nickname = userInfo.nickName;
      if (userInfo?.avatarUrl) user.avatar = userInfo.avatarUrl;
      if (userInfo?.gender) {
        user.gender = userInfo.gender === 1 ? 'male' : userInfo.gender === 2 ? 'female' : 'unknown';
      }
      user.lastLoginAt = new Date();
      
      console.log(`🔄 Updating existing user: ${user.nickname} (${openid})`);
    }

    await user.save();

    // 生成令牌对
    const tokens = generateTokenPair(user._id);

    // 获取用户等级信息
    const userLevel = user.getUserLevel();

    res.json({
      success: true,
      message: isNewUser ? '注册成功' : '登录成功',
      data: {
        ...tokens,
        user: {
          id: user._id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          gender: user.gender,
          region: user.region,
          stats: user.stats,
          level: userLevel,
          isNewUser,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户信息
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('clubs', 'name logo region')
      .select('-openid -unionid'); // 不返回敏感信息

    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 获取用户等级和比赛历史
    const userLevel = user.getUserLevel();
    const matchHistory = await user.getMatchHistory();

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        level: userLevel,
        recentMatches: matchHistory.slice(0, 5) // 只返回最近5场比赛
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
const updateUserProfile = async (req, res, next) => {
  try {
    const { nickname, phone, email, region } = req.body;
    
    // 验证输入数据
    if (nickname && nickname.trim().length < 2) {
      throw new BusinessError('昵称至少需要2个字符', 'INVALID_NICKNAME');
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BusinessError('邮箱格式不正确', 'INVALID_EMAIL');
    }
    
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      throw new BusinessError('手机号格式不正确', 'INVALID_PHONE');
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 检查昵称是否已被其他用户使用
    if (nickname && nickname !== user.nickname) {
      const existingUser = await User.findOne({ 
        nickname: nickname.trim(), 
        _id: { $ne: user._id } 
      });
      if (existingUser) {
        throw new BusinessError('昵称已被使用', 'NICKNAME_TAKEN');
      }
      user.nickname = nickname.trim();
    }
    
    if (phone) user.phone = phone;
    if (email) user.email = email.toLowerCase();
    if (region) user.region = region.trim();
    
    await user.save();

    // 获取更新后的用户等级
    const userLevel = user.getUserLevel();

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        ...user.toObject(),
        level: userLevel
      }
    });
  } catch (error) {
    next(error);
  }
};

// 刷新令牌
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BusinessError('刷新令牌不能为空', 'MISSING_REFRESH_TOKEN');
    }

    // 验证刷新令牌
    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new BusinessError('无效的刷新令牌类型', 'INVALID_REFRESH_TOKEN');
    }

    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new BusinessError('用户不存在或已被停用', 'USER_NOT_FOUND');
    }

    // 生成新的令牌对
    const tokens = generateTokenPair(user._id);

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户统计数据
const getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 获取详细统计信息
    const detailedStats = await user.getDetailedStats();
    const achievements = user.getAchievements();

    res.json({
      success: true,
      data: {
        ...detailedStats,
        achievements,
        totalClubs: user.clubs.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取排行榜
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, type = 'points' } = req.query;
    
    let sortField;
    switch (type) {
      case 'points':
        sortField = { 'stats.etaPoints': -1 };
        break;
      case 'wins':
        sortField = { 'stats.wins': -1 };
        break;
      case 'participation':
        sortField = { 'stats.participationCount': -1 };
        break;
      default:
        sortField = { 'stats.etaPoints': -1 };
    }

    const users = await User.find({ isActive: true })
      .sort(sortField)
      .limit(parseInt(limit))
      .select('nickname avatar stats region createdAt');

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user.toObject(),
      level: user.getUserLevel()
    }));

    res.json({
      success: true,
      data: {
        type,
        leaderboard
      }
    });
  } catch (error) {
    next(error);
  }
};

// 搜索用户
const searchUsers = async (req, res, next) => {
  try {
    const { query, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      throw new BusinessError('搜索关键词至少需要2个字符', 'INVALID_SEARCH_QUERY');
    }

    const users = await User.searchUsers(query.trim(), parseInt(limit));
    
    const results = users.map(user => ({
      ...user.toObject(),
      level: user.getUserLevel()
    }));

    res.json({
      success: true,
      data: {
        query: query.trim(),
        count: results.length,
        users: results
      }
    });
  } catch (error) {
    next(error);
  }
};

// 停用账户
const deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: '账户已停用'
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户比赛记录
const getUserMatches = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    const Match = require('../models/Match');
    
    // 构建查询条件
    const query = {
      $or: [
        { 'players.userId': user._id },
        { 'organizer.id': user._id }
      ]
    };
    
    if (status) {
      query.status = status;
    }

    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('eventId', 'name eventType')
      .select('eventType stage status venue startTime endTime players score sets winner');

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户成就
const getUserAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    const achievements = user.getAchievements();
    const level = user.getUserLevel();

    res.json({
      success: true,
      data: {
        achievements,
        level,
        stats: user.stats,
        progress: {
          nextLevelPoints: getNextLevelPoints(user.stats.etaPoints),
          currentLevelProgress: getCurrentLevelProgress(user.stats.etaPoints)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取系统统计概览
const getSystemStats = async (req, res, next) => {
  try {
    const overallStats = await User.getOverallStats();
    
    res.json({
      success: true,
      data: overallStats
    });
  } catch (error) {
    next(error);
  }
};

// 验证用户权限
const checkUserPermission = async (req, res, next) => {
  try {
    const { permission } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    const hasPermission = user.hasPermission(permission);
    const level = user.getUserLevel();

    res.json({
      success: true,
      data: {
        permission,
        hasPermission,
        userLevel: level,
        allPermissions: getUserPermissions(level.level)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户活跃度
const updateUserActivity = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    await user.updateActivity();

    res.json({
      success: true,
      message: '活跃度已更新',
      data: {
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户详细比赛历史
const getUserDetailedMatches = async (req, res, next) => {
  try {
    const { 
      limit = 10, 
      status, 
      eventType, 
      startDate, 
      endDate 
    } = req.query;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    const matches = await user.getMatchHistory({
      limit: parseInt(limit),
      status,
      eventType,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        matches,
        filters: {
          status,
          eventType,
          startDate,
          endDate
        },
        count: matches.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// 辅助函数：获取下一等级所需积分
const getNextLevelPoints = (currentPoints) => {
  if (currentPoints < 50) return 50;
  if (currentPoints < 200) return 200;
  if (currentPoints < 500) return 500;
  if (currentPoints < 1000) return 1000;
  return 2000; // 传奇等级
};

// 辅助函数：获取当前等级进度
const getCurrentLevelProgress = (currentPoints) => {
  let currentLevel = 0;
  let nextLevel = 50;
  
  if (currentPoints >= 1000) {
    currentLevel = 1000;
    nextLevel = 2000;
  } else if (currentPoints >= 500) {
    currentLevel = 500;
    nextLevel = 1000;
  } else if (currentPoints >= 200) {
    currentLevel = 200;
    nextLevel = 500;
  } else if (currentPoints >= 50) {
    currentLevel = 50;
    nextLevel = 200;
  }
  
  const progress = ((currentPoints - currentLevel) / (nextLevel - currentLevel)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

// 辅助函数：获取用户权限列表
const getUserPermissions = (level) => {
  const permissions = {
    'Rookie': ['view_matches', 'join_events'],
    'Beginner': ['view_matches', 'join_events', 'create_private_events'],
    'Intermediate': ['view_matches', 'join_events', 'create_private_events', 'organize_matches'],
    'Advanced': ['view_matches', 'join_events', 'create_private_events', 'organize_matches', 'moderate_events'],
    'Professional': ['view_matches', 'join_events', 'create_private_events', 'organize_matches', 'moderate_events', 'admin_functions']
  };
  
  return permissions[level] || permissions['Rookie'];
};

module.exports = {
  wechatLogin,
  getUserProfile,
  updateUserProfile,
  refreshToken,
  getUserStats,
  getLeaderboard,
  searchUsers,
  deactivateAccount,
  getUserMatches,
  getUserAchievements,
  getSystemStats,
  checkUserPermission,
  updateUserActivity,
  getUserDetailedMatches
}; 