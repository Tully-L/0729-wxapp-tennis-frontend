const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const { adminAuth, auditLog } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route   GET /api/admin/stats/overview
 * @desc    Get system overview statistics
 * @access  Private (Admin)
 */
router.get('/overview', adminAuth, auditLog('GET_OVERVIEW_STATS'), async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments({ is_deleted: { $ne: true } });
    const activeUsers = await User.countDocuments({ 
      status: 'active', 
      is_deleted: { $ne: true } 
    });
    
    // Get event statistics
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ 
      status: { $in: ['published', 'ongoing'] } 
    });
    
    // Get monthly statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      created_at: { $gte: currentMonth },
      is_deleted: { $ne: true }
    });
    
    const eventsThisMonth = await Event.countDocuments({
      created_at: { $gte: currentMonth }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalEvents,
        activeEvents,
        newUsersThisMonth,
        eventsThisMonth
      }
    });

  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to get overview statistics'
      }
    });
  }
});

/**
 * @route   GET /api/admin/stats/users
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
router.get('/users', adminAuth, auditLog('GET_USER_STATS'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default: // month
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // User growth data (simplified)
    const userGrowth = [];
    const usersByLevel = [
      { level: 'Beginner', count: await User.countDocuments({ 'ext_info.level': 'beginner' }) },
      { level: 'Intermediate', count: await User.countDocuments({ 'ext_info.level': 'intermediate' }) },
      { level: 'Advanced', count: await User.countDocuments({ 'ext_info.level': 'advanced' }) }
    ];
    
    const activeUsersTrend = [];

    res.json({
      success: true,
      data: {
        userGrowth,
        usersByLevel,
        activeUsersTrend
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_STATS_ERROR',
        message: 'Failed to get user statistics'
      }
    });
  }
});

/**
 * @route   GET /api/admin/stats/events
 * @desc    Get event statistics
 * @access  Private (Admin)
 */
router.get('/events', adminAuth, auditLog('GET_EVENT_STATS'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Events by category
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Events by status
    const eventsByStatus = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);
    
    const participationTrends = [];

    res.json({
      success: true,
      data: {
        eventsByCategory,
        eventsByStatus,
        participationTrends
      }
    });

  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EVENT_STATS_ERROR',
        message: 'Failed to get event statistics'
      }
    });
  }
});

/**
 * @route   GET /api/admin/stats/activity
 * @desc    Get recent activity
 * @access  Private (Admin)
 */
router.get('/activity', adminAuth, auditLog('GET_RECENT_ACTIVITY'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent users (last 7 days)
    const recentUsers = await User.find({
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      is_deleted: { $ne: true }
    })
    .sort({ created_at: -1 })
    .limit(5)
    .select('nickname created_at');
    
    // Get recent events (last 7 days)
    const recentEvents = await Event.find({
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ created_at: -1 })
    .limit(5)
    .select('title created_at');
    
    // Combine and format activities
    const activities = [];
    
    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user._id}`,
        title: '新用户注册',
        description: `用户 "${user.nickname}" 加入了平台`,
        timestamp: user.created_at,
        type: 'user'
      });
    });
    
    recentEvents.forEach(event => {
      activities.push({
        id: `event_${event._id}`,
        title: '赛事创建',
        description: `新赛事 "${event.title}" 已创建`,
        timestamp: event.created_at,
        type: 'event'
      });
    });
    
    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedActivities
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTIVITY_ERROR',
        message: 'Failed to get recent activity'
      }
    });
  }
});

module.exports = router;