const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const { adminAuth, auditLog } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route   GET /api/admin/stats/overview
 * @desc    Get system-wide statistics for dashboard
 * @access  Private (Admin)
 */
router.get('/overview', adminAuth, auditLog('view_overview_stats'), async (req, res) => {
  try {
    // Get basic counts
    const [
      totalUsers,
      activeUsers,
      totalEvents,
      activeEvents,
      publishedEvents,
      ongoingEvents
    ] = await Promise.all([
      User.countDocuments({ is_deleted: false }),
      User.countDocuments({ status: 'active', is_deleted: false }),
      Event.countDocuments({ is_deleted: false }),
      Event.countDocuments({ status: { $in: ['published', 'ongoing'] }, is_deleted: false }),
      Event.countDocuments({ status: 'published', is_deleted: false }),
      Event.countDocuments({ status: 'ongoing', is_deleted: false })
    ]);

    // Get monthly statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      newUsersThisMonth,
      newUsersLastMonth,
      newEventsThisMonth,
      newEventsLastMonth
    ] = await Promise.all([
      User.countDocuments({
        is_deleted: false,
        created_at: { $gte: startOfMonth }
      }),
      User.countDocuments({
        is_deleted: false,
        created_at: { $gte: startOfLastMonth, $lt: startOfMonth }
      }),
      Event.countDocuments({
        is_deleted: false,
        created_at: { $gte: startOfMonth }
      }),
      Event.countDocuments({
        is_deleted: false,
        created_at: { $gte: startOfLastMonth, $lt: startOfMonth }
      })
    ]);

    // Calculate growth rates
    const userGrowthRate = newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : newUsersThisMonth > 0 ? 100 : 0;

    const eventGrowthRate = newEventsLastMonth > 0
      ? Math.round(((newEventsThisMonth - newEventsLastMonth) / newEventsLastMonth) * 100)
      : newEventsThisMonth > 0 ? 100 : 0;

    const overview = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growthRate: userGrowthRate,
        activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      events: {
        total: totalEvents,
        active: activeEvents,
        published: publishedEvents,
        ongoing: ongoingEvents,
        newThisMonth: newEventsThisMonth,
        growthRate: eventGrowthRate
      },
      system: {
        uptime: Math.floor(process.uptime()),
        timestamp: new Date(),
        version: '1.0.0'
      }
    };

    res.json({
      success: true,
      message: 'Overview statistics retrieved successfully',
      data: overview
    });

  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to retrieve overview statistics.'
      }
    });
  }
});

/**
 * @route   GET /api/admin/stats/users
 * @desc    Get user statistics with growth trends
 * @access  Private (Admin)
 */
router.get('/users', adminAuth, auditLog('view_user_stats'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Get detailed user statistics
    const userStats = await User.getUserStatistics();

    // Get user growth data for charts
    const now = new Date();
    let startDate;
    let groupBy;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dayOfYear: '$created_at' };
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = { $month: '$created_at' };
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = { $dayOfMonth: '$created_at' };
    }

    const userGrowthData = await User.aggregate([
      {
        $match: {
          is_deleted: false,
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get user level distribution
    const levelDistribution = await User.aggregate([
      { $match: { is_deleted: false } },
      {
        $addFields: {
          level: {
            $switch: {
              branches: [
                { case: { $gte: ['$total_points', 1000] }, then: 'Professional' },
                { case: { $gte: ['$total_points', 500] }, then: 'Advanced' },
                { case: { $gte: ['$total_points', 200] }, then: 'Intermediate' },
                { case: { $gte: ['$total_points', 50] }, then: 'Beginner' }
              ],
              default: 'Rookie'
            }
          }
        }
      },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        overview: userStats,
        growth: userGrowthData,
        levelDistribution: levelDistribution,
        period: period
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_STATS_ERROR',
        message: 'Failed to retrieve user statistics.'
      }
    });
  }
});

/**
 * @route   GET /api/admin/stats/events
 * @desc    Get event statistics and trends
 * @access  Private (Admin)
 */
router.get('/events', adminAuth, auditLog('view_event_stats'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Get event statistics by status
    const eventsByStatus = await Event.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get events by category
    const eventsByCategory = await Event.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get event creation trends
    const now = new Date();
    let startDate;
    let groupBy;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dayOfYear: '$created_at' };
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = { $month: '$created_at' };
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = { $dayOfMonth: '$created_at' };
    }

    const eventCreationTrends = await Event.aggregate([
      {
        $match: {
          is_deleted: false,
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get upcoming events count
    const upcomingEvents = await Event.countDocuments({
      is_deleted: false,
      status: 'published',
      start_time: { $gt: new Date() }
    });

    res.json({
      success: true,
      message: 'Event statistics retrieved successfully',
      data: {
        byStatus: eventsByStatus,
        byCategory: eventsByCategory,
        creationTrends: eventCreationTrends,
        upcomingEvents: upcomingEvents,
        period: period
      }
    });

  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EVENT_STATS_ERROR',
        message: 'Failed to retrieve event statistics.'
      }
    });
  }
});

/**
 * @route   GET /api/admin/stats/activity
 * @desc    Get recent system activity
 * @access  Private (Admin)
 */
router.get('/activity', adminAuth, auditLog('view_activity_stats'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent users (last 7 days)
    const recentUsers = await User.find({
      is_deleted: false,
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .select('nickname email created_at status role');

    // Get recent events (last 7 days)
    const recentEvents = await Event.find({
      is_deleted: false,
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .select('title category status created_at start_time');

    // Get active users (logged in last 24 hours)
    const activeUsers = await User.find({
      is_deleted: false,
      last_login: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ last_login: -1 })
    .limit(parseInt(limit))
    .select('nickname email last_login role');

    res.json({
      success: true,
      message: 'Activity statistics retrieved successfully',
      data: {
        recentUsers: recentUsers,
        recentEvents: recentEvents,
        activeUsers: activeUsers,
        summary: {
          newUsersLast7Days: recentUsers.length,
          newEventsLast7Days: recentEvents.length,
          activeUsersLast24Hours: activeUsers.length
        }
      }
    });

  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTIVITY_STATS_ERROR',
        message: 'Failed to retrieve activity statistics.'
      }
    });
  }
});

module.exports = router;