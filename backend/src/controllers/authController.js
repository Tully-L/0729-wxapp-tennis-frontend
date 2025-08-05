const User = require('../models/User');
const UserAuth = require('../models/UserAuth');
const { generateTokenPair, verifyToken } = require('../utils/jwt');
const { WeChatAPIError, BusinessError } = require('../middleware/errorHandler');
const axios = require('axios');
const crypto = require('crypto');

// 微信数据解密函数
const decryptWeChatData = (encryptedData, iv, sessionKey) => {
  try {
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encryptedDataBuffer, null, 'utf8');
    decrypted += decipher.final('utf8');

    const decryptedData = JSON.parse(decrypted);

    // 验证水印
    if (decryptedData.watermark && decryptedData.watermark.appid !== process.env.WECHAT_APPID) {
      throw new Error('水印验证失败');
    }

    return decryptedData;
  } catch (error) {
    throw new Error(`解密失败: ${error.message}`);
  }
};

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

    const { code, userInfo, encryptedData, iv, loginType } = req.body;

    // 验证必需参数
    if (!code) {
      throw new BusinessError('微信授权码不能为空', 'MISSING_CODE');
    }

    // 验证环境变量 - 支持多种命名方式
    const wechatAppId = process.env.WECHAT_APPID || process.env.WECHAT_APP_ID;
    const wechatSecret = process.env.WECHAT_SECRET || process.env.WECHAT_APP_SECRET;

    if (!wechatAppId || !wechatSecret) {
      console.error('微信配置检查:', {
        WECHAT_APPID: !!process.env.WECHAT_APPID,
        WECHAT_APP_ID: !!process.env.WECHAT_APP_ID,
        WECHAT_SECRET: !!process.env.WECHAT_SECRET,
        WECHAT_APP_SECRET: !!process.env.WECHAT_APP_SECRET
      });
      throw new BusinessError('微信小程序配置不完整', 'WECHAT_CONFIG_MISSING');
    }

    // 获取微信 openid 和 session_key
    const wechatResponse = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${wechatAppId}&secret=${wechatSecret}&js_code=${code}&grant_type=authorization_code`,
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

    // 解密手机号（如果提供了加密数据）
    let phoneNumber = null;
    if (encryptedData && iv && session_key) {
      try {
        phoneNumber = decryptWeChatData(encryptedData, iv, session_key);
        console.log('解密手机号成功:', phoneNumber);
      } catch (error) {
        console.warn('解密手机号失败:', error.message);
        // 不抛出错误，允许继续登录
      }
    }

    // 查找或创建用户
    let userAuth = await UserAuth.findUserByAuth('wechat', openid);
    let user;
    let isNewUser = false;

    if (!userAuth) {
      // 创建新用户
      isNewUser = true;
      const extInfo = {
        gender: userInfo?.gender === 1 ? 'male' : userInfo?.gender === 2 ? 'female' : 'unknown'
      };

      // 如果解密到手机号，添加到扩展信息中
      if (phoneNumber && phoneNumber.phoneNumber) {
        extInfo.phone = phoneNumber.phoneNumber;
        extInfo.countryCode = phoneNumber.countryCode || '86';
      }

      user = new User({
        nickname: userInfo?.nickName || `网球选手${Date.now().toString().slice(-4)}`,
        avatar: userInfo?.avatarUrl || null,
        total_points: 0,
        status: 'active',
        ext_info: extInfo,
        is_deleted: false
      });

      await user.save();

      // 创建微信认证记录
      await UserAuth.addAuthForUser(user._id, 'wechat', openid, true);

      // 如果有unionid，也添加记录
      if (unionid) {
        try {
          await UserAuth.addAuthForUser(user._id, 'wechat', unionid, false);
        } catch (error) {
          console.warn(`⚠️ Failed to add unionid auth: ${error.message}`);
        }
      }

      console.log(`🆕 Creating new user: ${user.nickname} (${openid})`);
    } else {
      // 更新现有用户信息
      user = userAuth.user_id;
      if (userInfo?.nickName) user.nickname = userInfo.nickName;
      if (userInfo?.avatarUrl) user.avatar = userInfo.avatarUrl;
      if (userInfo?.gender) {
        user.ext_info = user.ext_info || {};
        user.ext_info.gender = userInfo.gender === 1 ? 'male' : userInfo.gender === 2 ? 'female' : 'unknown';
      }

      await user.save();
      console.log(`🔄 Updating existing user: ${user.nickname} (${openid})`);
    }

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
          nickname: user.nickname,
          avatar: user.avatar,
          total_points: user.total_points,
          status: user.status,
          level: userLevel,
          isNewUser,
          ext_info: user.ext_info
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
    const user = await User.findById(req.user._id);

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 获取用户等级
    const userLevel = user.getUserLevel();

    // 获取用户认证信息
    const userAuths = await UserAuth.getUserAuths(user._id);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        level: userLevel,
        auths: userAuths.map(auth => ({
          type: auth.auth_type,
          isPrimary: auth.is_primary,
          createdAt: auth.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
const updateUserProfile = async (req, res, next) => {
  try {
    const { nickname, avatar, phone, email, region, bio, gender, signature, backgroundImage } = req.body;

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

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 检查昵称是否已被其他用户使用
    if (nickname && nickname !== user.nickname) {
      const existingUser = await User.findOne({
        nickname: nickname.trim(),
        _id: { $ne: user._id },
        is_deleted: false
      });
      if (existingUser) {
        throw new BusinessError('昵称已被使用', 'NICKNAME_TAKEN');
      }
      user.nickname = nickname.trim();
    }

    // 更新基本信息
    if (avatar) user.avatar = avatar;

    // 更新扩展信息
    user.ext_info = user.ext_info || {};
    if (phone) user.ext_info.phone = phone;
    if (email) user.ext_info.email = email.toLowerCase();
    if (region) user.ext_info.region = region.trim();
    if (bio !== undefined) user.ext_info.bio = bio ? bio.trim() : null;
    if (gender) user.ext_info.gender = gender;
    if (signature !== undefined) user.ext_info.signature = signature ? signature.trim() : null;
    if (backgroundImage) user.ext_info.backgroundImage = backgroundImage;

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
    if (!user || user.is_deleted || user.status !== 'active') {
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

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 获取用户等级
    const userLevel = user.getUserLevel();

    // 获取用户参与的赛事统计
    const UserEventRelation = require('../models/UserEventRelation');
    const eventStats = await UserEventRelation.aggregate([
      { $match: { user_id: user._id, is_deleted: false } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          approvedEvents: {
            $sum: { $cond: [{ $eq: ['$signup_status', 'approved'] }, 1, 0] }
          },
          checkedInEvents: {
            $sum: { $cond: ['$is_signin', 1, 0] }
          },
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    const stats = eventStats[0] || {
      totalEvents: 0,
      approvedEvents: 0,
      checkedInEvents: 0,
      totalPoints: 0
    };

    // 计算胜负统计（简化版本，实际应根据业务逻辑计算）
    const wins = Math.floor(stats.checkedInEvents * 0.6); // 假设60%胜率
    const losses = stats.checkedInEvents - wins;
    const winRate = stats.checkedInEvents > 0 ?
      ((wins / stats.checkedInEvents) * 100).toFixed(0) + '%' : '0%';

    // 计算账户年龄（天数）
    const accountAge = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));

    // 格式化为前端期望的格式
    const formattedStats = {
      basic: {
        participationCount: stats.approvedEvents || 0,
        wins: wins,
        losses: losses,
        winRate: winRate,
        totalPoints: user.total_points // 注意：使用totalPoints，不是etaPoints
      },
      level: {
        name: userLevel.name || '新手',
        level: userLevel.level || 1
      },
      accountAge: accountAge,
      monthlyActivity: Math.min(stats.approvedEvents, 10), // 限制在10以内
      status: user.status,
      // 兼容前端用户页面的字段
      mDou: user.total_points, // M豆等于积分
      coupons: Math.floor(user.total_points / 500), // 根据积分计算优惠券数量
      events: stats.approvedEvents, // 我的赛事数量
      memberLevel: userLevel.name || 'VIP' // 会员等级
    };

    res.json({
      success: true,
      data: formattedStats
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
        sortField = { total_points: -1 };
        break;
      default:
        sortField = { total_points: -1 };
    }

    const users = await User.find({
      status: 'active',
      is_deleted: false
    })
      .sort(sortField)
      .limit(parseInt(limit))
      .select('nickname avatar total_points ext_info created_at');

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      total_points: user.total_points,
      region: user.ext_info?.region,
      level: user.getUserLevel(),
      created_at: user.created_at
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

    const searchQuery = query.trim();
    const users = await User.find({
      $and: [
        { status: 'active', is_deleted: false },
        {
          $or: [
            { nickname: { $regex: searchQuery, $options: 'i' } },
            { 'ext_info.phone': { $regex: searchQuery, $options: 'i' } },
            { 'ext_info.email': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .limit(parseInt(limit))
    .select('nickname avatar total_points ext_info created_at');

    const results = users.map(user => ({
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      total_points: user.total_points,
      region: user.ext_info?.region,
      level: user.getUserLevel(),
      created_at: user.created_at
    }));

    res.json({
      success: true,
      data: {
        query: searchQuery,
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

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    await user.softDelete();

    res.json({
      success: true,
      message: '账户已停用'
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户赛事记录
const getUserEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const user = await User.findById(req.user._id);

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    const UserEventRelation = require('../models/UserEventRelation');
    const Event = require('../models/Event');

    // 构建查询条件
    const query = {
      user_id: user._id,
      is_deleted: false
    };

    if (status) {
      query.signup_status = status;
    }

    const relations = await UserEventRelation.find(query)
      .sort({ signup_time: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('event_id', 'title category start_time end_time location status');

    const total = await UserEventRelation.countDocuments(query);

    res.json({
      success: true,
      data: {
        events: relations.map(relation => ({
          relation_id: relation._id,
          event: relation.event_id,
          signup_status: relation.signup_status,
          signup_time: relation.signup_time,
          is_signin: relation.is_signin,
          signin_time: relation.signin_time,
          points: relation.points,
          rank: relation.rank
        })),
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

// 获取用户积分记录
const getUserPointsHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id);

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    const PointsRecord = require('../models/PointsRecord');

    const records = await PointsRecord.getUserPointsHistory(
      user._id,
      parseInt(page),
      parseInt(limit)
    );

    const level = user.getUserLevel();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          total_points: user.total_points,
          level
        },
        records,
        progress: {
          nextLevelPoints: getNextLevelPoints(user.total_points),
          currentLevelProgress: getCurrentLevelProgress(user.total_points)
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
    const totalUsers = await User.countDocuments({ is_deleted: false });
    const activeUsers = await User.countDocuments({ status: 'active', is_deleted: false });

    const Event = require('../models/Event');
    const totalEvents = await Event.countDocuments({ is_deleted: false });
    const activeEvents = await Event.countDocuments({
      status: { $in: ['published', 'ongoing'] },
      is_deleted: false
    });

    const UserEventRelation = require('../models/UserEventRelation');
    const totalParticipations = await UserEventRelation.countDocuments({ is_deleted: false });

    const PointsRecord = require('../models/PointsRecord');
    const totalPointsAwarded = await PointsRecord.aggregate([
      { $match: { amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        events: {
          total: totalEvents,
          active: activeEvents
        },
        participations: totalParticipations,
        totalPointsAwarded: totalPointsAwarded[0]?.total || 0
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

// 获取用户成就
const getUserAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 基于用户数据生成成就
    const achievements = [];

    // 登录成就
    if (user.created_at) {
      achievements.push({
        id: 'first_login',
        name: '初来乍到',
        description: '完成首次登录',
        icon: '🎉',
        unlocked: true,
        unlockedAt: user.created_at
      });
    }

    // 积分成就
    if (user.total_points >= 100) {
      achievements.push({
        id: 'points_100',
        name: '积分达人',
        description: '累计获得100积分',
        icon: '⭐',
        unlocked: true,
        unlockedAt: user.updated_at
      });
    }

    if (user.total_points >= 500) {
      achievements.push({
        id: 'points_500',
        name: '积分大师',
        description: '累计获得500积分',
        icon: '🏆',
        unlocked: true,
        unlockedAt: user.updated_at
      });
    }

    res.json({
      success: true,
      data: {
        achievements,
        total: achievements.length,
        unlocked: achievements.filter(a => a.unlocked).length
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

    if (!user || user.is_deleted) {
      throw new BusinessError('用户不存在', 'USER_NOT_FOUND');
    }

    // 更新最后活跃时间
    user.lastLoginAt = new Date();

    // 更新扩展信息中的活跃度数据
    if (!user.ext_info) {
      user.ext_info = {};
    }

    if (!user.ext_info.activity) {
      user.ext_info.activity = {
        lastActive: new Date(),
        dailyLogins: 1,
        weeklyLogins: 1,
        monthlyLogins: 1
      };
    } else {
      user.ext_info.activity.lastActive = new Date();
      user.ext_info.activity.dailyLogins = (user.ext_info.activity.dailyLogins || 0) + 1;
    }

    await user.save();

    res.json({
      success: true,
      message: '活跃度更新成功',
      data: {
        lastActive: user.ext_info.activity.lastActive,
        dailyLogins: user.ext_info.activity.dailyLogins
      }
    });
  } catch (error) {
    next(error);
  }
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
  getUserEvents,
  getUserPointsHistory,
  getSystemStats,
  getUserAchievements,
  updateUserActivity
};