const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { adminAuth, adminRateLimit, resetRateLimit, auditLog } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login with email and password
 * @access  Public (but rate limited)
 */
router.post('/login', adminRateLimit, auditLog('ADMIN_LOGIN'), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required.'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.'
        }
      });
    }

    // Find admin user by email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: { $in: ['admin', 'super_admin'] }
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive. Please contact system administrator.'
        }
      });
    }

    // Check if account is deleted
    if (user.is_deleted) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DELETED',
          message: 'Account has been deleted. Please contact system administrator.'
        }
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const lockTime = Math.ceil((user.account_locked_until - Date.now()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account is locked due to multiple failed login attempts. Try again in ${lockTime} minutes.`,
          lockTime: lockTime
        }
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Reset rate limiting for this IP
    resetRateLimit(req);

    // Generate JWT tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      nickname: user.nickname
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      { id: user._id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Longer-lived refresh token
    );

    // Update last login time
    user.last_login = new Date();
    await user.save();

    // Log successful login
    console.log(`✅ Admin login successful: ${user.email} (${user.role}) from IP ${req.ip}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: user.getAdminProfile(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
          tokenType: 'Bearer'
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'An error occurred during login. Please try again.'
      }
    });
  }
});

/**
 * @route   POST /api/auth/admin/refresh
 * @desc    Refresh admin access token using refresh token
 * @access  Public (with valid refresh token)
 */
router.post('/refresh', auditLog('TOKEN_REFRESH'), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required.'
        }
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'Refresh token has expired. Please login again.'
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token. Please login again.'
          }
        });
      }
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type. Please login again.'
        }
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found. Please login again.'
        }
      });
    }

    // Check if user is still admin and active
    if (!user.isAdmin() || user.status !== 'active' || user.is_deleted) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_REVOKED',
          message: 'Admin access has been revoked. Please contact system administrator.'
        }
      });
    }

    // Generate new access token
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      nickname: user.nickname
    };

    const newAccessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'An error occurred during token refresh. Please try again.'
      }
    });
  }
});

/**
 * @route   POST /api/auth/admin/logout
 * @desc    Admin logout (invalidate tokens)
 * @access  Private (Admin)
 */
router.post('/logout', adminAuth, auditLog('ADMIN_LOGOUT'), async (req, res) => {
  try {
    // In a production environment, you would:
    // 1. Add the token to a blacklist/revocation list
    // 2. Store blacklisted tokens in Redis with expiration
    // 3. Check blacklist in the auth middleware
    
    // For now, we'll just log the logout
    console.log(`🚪 Admin logout: ${req.user.email} (${req.user.role}) from IP ${req.ip}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'An error occurred during logout.'
      }
    });
  }
});

/**
 * @route   GET /api/auth/admin/profile
 * @desc    Get current admin profile
 * @access  Private (Admin)
 */
router.get('/profile', adminAuth, auditLog('GET_ADMIN_PROFILE'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        admin: req.user.getAdminProfile()
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'An error occurred while fetching profile.'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/admin/profile
 * @desc    Update admin profile
 * @access  Private (Admin)
 */
router.put('/profile', adminAuth, auditLog('UPDATE_ADMIN_PROFILE'), async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const user = req.user;

    // Validate input
    if (nickname && (typeof nickname !== 'string' || nickname.trim().length < 2)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NICKNAME',
          message: 'Nickname must be at least 2 characters long.'
        }
      });
    }

    // Update allowed fields
    if (nickname) {
      user.nickname = nickname.trim();
    }
    
    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: user.getAdminProfile()
      }
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'An error occurred while updating profile.'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/admin/change-password
 * @desc    Change admin password
 * @access  Private (Admin)
 */
router.put('/change-password', adminAuth, auditLog('CHANGE_PASSWORD'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORDS',
          message: 'Current password and new password are required.'
        }
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must be at least 6 characters long.'
        }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect.'
        }
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log(`🔐 Password changed for admin: ${user.email} from IP ${req.ip}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_ERROR',
        message: 'An error occurred while changing password.'
      }
    });
  }
});

/**
 * @route   GET /api/auth/admin/verify
 * @desc    Verify admin token validity
 * @access  Private (Admin)
 */
router.get('/verify', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      admin: req.user.getAdminProfile(),
      tokenValid: true
    }
  });
});

module.exports = router;