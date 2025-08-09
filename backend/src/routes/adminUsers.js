const express = require('express');
const User = require('../models/User');
const { adminAuth, auditLog, requireRole } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated list of users with search and filtering
 * @access  Private (Admin)
 */
router.get('/', adminAuth, auditLog('GET_USERS'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      role = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

    // Get users with pagination
    const result = await User.getUsersWithPagination({
      page: pageNum,
      limit: limitNum,
      search,
      status,
      role,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.users,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USERS_ERROR',
        message: 'An error occurred while retrieving users.'
      }
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get detailed user information with statistics
 * @access  Private (Admin)
 */
router.get('/:id', adminAuth, auditLog('GET_USER_DETAIL'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format.'
        }
      });
    }

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    // Get user level and achievements
    const userLevel = user.getUserLevel();
    const achievements = user.getAchievements();

    // Get user statistics (you can extend this based on your needs)
    const userStats = {
      totalPoints: user.total_points,
      level: userLevel,
      achievements: achievements,
      accountAge: Math.floor((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24)), // days
      lastActivity: user.updated_at,
      isActive: user.status === 'active' && !user.is_deleted
    };

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          email: user.email,
          role: user.role,
          status: user.status,
          total_points: user.total_points,
          is_deleted: user.is_deleted,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
          ext_info: user.ext_info
        },
        statistics: userStats
      }
    });

  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_DETAIL_ERROR',
        message: 'An error occurred while retrieving user details.'
      }
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user information
 * @access  Private (Admin)
 */
router.put('/:id', adminAuth, auditLog('UPDATE_USER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, status, total_points, role, ext_info } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format.'
        }
      });
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    // Validate input data
    if (nickname && (typeof nickname !== 'string' || nickname.trim().length < 2)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NICKNAME',
          message: 'Nickname must be at least 2 characters long.'
        }
      });
    }

    if (status && !['active', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either "active" or "banned".'
        }
      });
    }

    if (total_points !== undefined && (typeof total_points !== 'number' || total_points < 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_POINTS',
          message: 'Total points must be a non-negative number.'
        }
      });
    }

    if (role && !['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be one of: user, admin, super_admin.'
        }
      });
    }

    // Check if trying to modify another admin (only super_admin can do this)
    if (user.isAdmin() && !req.user.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Only super administrators can modify admin accounts.'
        }
      });
    }

    // Store original values for audit log
    const originalValues = {
      nickname: user.nickname,
      status: user.status,
      total_points: user.total_points,
      role: user.role
    };

    // Update user fields
    if (nickname) user.nickname = nickname.trim();
    if (status) user.status = status;
    if (total_points !== undefined) user.total_points = total_points;
    if (role) user.role = role;
    if (ext_info && typeof ext_info === 'object') {
      user.ext_info = { ...user.ext_info, ...ext_info };
    }

    await user.save();

    // Log the changes
    const changes = {};
    Object.keys(originalValues).forEach(key => {
      if (originalValues[key] !== user[key]) {
        changes[key] = { from: originalValues[key], to: user[key] };
      }
    });

    console.log(`👤 User updated by admin ${req.user.email}:`, {
      userId: user._id,
      changes: changes
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          email: user.email,
          role: user.role,
          status: user.status,
          total_points: user.total_points,
          is_deleted: user.is_deleted,
          created_at: user.created_at,
          updated_at: user.updated_at,
          ext_info: user.ext_info
        },
        changes: changes
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_USER_ERROR',
        message: 'An error occurred while updating user.'
      }
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Soft delete user
 * @access  Private (Admin)
 */
router.delete('/:id', adminAuth, auditLog('DELETE_USER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format.'
        }
      });
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    // Check if user is already deleted
    if (user.is_deleted) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_ALREADY_DELETED',
          message: 'User is already deleted.'
        }
      });
    }

    // Prevent deleting admin accounts (only super_admin can delete admins)
    if (user.isAdmin() && !req.user.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Only super administrators can delete admin accounts.'
        }
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'You cannot delete your own account.'
        }
      });
    }

    // Perform soft delete
    await user.softDelete();

    console.log(`🗑️ User soft deleted by admin ${req.user.email}:`, {
      userId: user._id,
      userEmail: user.email,
      userNickname: user.nickname
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        userId: user._id,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_USER_ERROR',
        message: 'An error occurred while deleting user.'
      }
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (active/banned)
 * @access  Private (Admin)
 */
router.put('/:id/status', adminAuth, auditLog('UPDATE_USER_STATUS'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format.'
        }
      });
    }

    // Validate status
    if (!status || !['active', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either "active" or "banned".'
        }
      });
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    // Check if user is deleted
    if (user.is_deleted) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_DELETED',
          message: 'Cannot modify status of deleted user.'
        }
      });
    }

    // Check if trying to modify admin status (only super_admin can do this)
    if (user.isAdmin() && !req.user.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Only super administrators can modify admin account status.'
        }
      });
    }

    // Prevent self-status modification to banned
    if (user._id.toString() === req.user._id.toString() && status === 'banned') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BAN_SELF',
          message: 'You cannot ban your own account.'
        }
      });
    }

    const oldStatus = user.status;
    user.status = status;

    // Add reason to ext_info if provided
    if (reason) {
      user.ext_info = {
        ...user.ext_info,
        statusChangeReason: reason,
        statusChangedBy: req.user._id,
        statusChangedAt: new Date()
      };
    }

    await user.save();

    console.log(`🔄 User status changed by admin ${req.user.email}:`, {
      userId: user._id,
      userEmail: user.email,
      oldStatus: oldStatus,
      newStatus: status,
      reason: reason
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          email: user.email,
          status: user.status,
          updated_at: user.updated_at
        },
        statusChange: {
          from: oldStatus,
          to: status,
          reason: reason,
          changedBy: req.user.nickname,
          changedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STATUS_ERROR',
        message: 'An error occurred while updating user status.'
      }
    });
  }
});

/**
 * @route   POST /api/admin/users/:id/restore
 * @desc    Restore soft deleted user
 * @access  Private (Super Admin only)
 */
router.post('/:id/restore', adminAuth, requireRole('super_admin'), auditLog('RESTORE_USER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format.'
        }
      });
    }

    // Find user (including deleted ones)
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    // Check if user is actually deleted
    if (!user.is_deleted) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_NOT_DELETED',
          message: 'User is not deleted.'
        }
      });
    }

    // Restore user
    await user.restore();

    console.log(`♻️ User restored by super admin ${req.user.email}:`, {
      userId: user._id,
      userEmail: user.email,
      userNickname: user.nickname
    });

    res.json({
      success: true,
      message: 'User restored successfully',
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          email: user.email,
          status: user.status,
          is_deleted: user.is_deleted,
          updated_at: user.updated_at
        },
        restoredAt: new Date()
      }
    });

  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESTORE_USER_ERROR',
        message: 'An error occurred while restoring user.'
      }
    });
  }
});

/**
 * @route   GET /api/admin/users/statistics/overview
 * @desc    Get user statistics overview
 * @access  Private (Admin)
 */
router.get('/statistics/overview', adminAuth, auditLog('GET_USER_STATISTICS'), async (req, res) => {
  try {
    const statistics = await User.getUserStatistics();

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        statistics: statistics,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATISTICS_ERROR',
        message: 'An error occurred while retrieving user statistics.'
      }
    });
  }
});

module.exports = router;