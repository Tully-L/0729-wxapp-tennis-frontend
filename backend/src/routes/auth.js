const express = require('express');
const router = express.Router();
const {
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
  getSystemStats
} = require('../controllers/authController');
const { auth, optionalAuth } = require('../middleware/auth');

// 微信登录
router.post('/login', wechatLogin);

// 开发模式登录（仅开发环境）
router.post('/dev-login', async (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode'
    });
  }
  
  try {
    // 检查数据库连接
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not established. Please ensure MongoDB is running and connected.'
      });
    }

    const { phone, nickname } = req.body;
    const User = require('../models/User');
    const { generateTokenPair } = require('../utils/jwt');
    
    // 查找或创建开发用户
    let user = await User.findOne({ phone: phone || '13800138000' });
    
    if (!user) {
      // 创建新的开发用户
      user = new User({
        openid: 'dev_openid_' + Date.now(),
        nickname: nickname || '开发用户',
        phone: phone || '13800138000',
        avatar: null,
        isActive: true,
        stats: {
          participationCount: 0,
          wins: 0,
          losses: 0,
          etaPoints: 1000
        }
      });
      
      await user.save();
    }
    
    // 生成JWT token
    const { accessToken, refreshToken } = generateTokenPair(user._id);
    
    res.json({
      success: true,
      message: '开发模式登录成功',
      data: {
        user: {
          id: user._id,
          openid: user.openid,
          nickname: user.nickname,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.createdAt,
          stats: user.stats
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// 刷新令牌
router.post('/refresh', refreshToken);

// 获取用户信息
router.get('/profile', auth, getUserProfile);

// 更新用户信息
router.put('/profile', auth, updateUserProfile);

// 获取用户统计数据
router.get('/stats', auth, getUserStats);

// 获取用户赛事记录
router.get('/events', auth, getUserEvents);

// 获取用户积分记录
router.get('/points', auth, getUserPointsHistory);

// 停用账户
router.delete('/account', auth, deactivateAccount);

// 获取排行榜（可选认证）
router.get('/leaderboard', optionalAuth, getLeaderboard);

// 搜索用户（需要认证）
router.get('/search', auth, searchUsers);

// 获取系统统计概览（可选认证）
router.get('/system-stats', optionalAuth, getSystemStats);

module.exports = router; 