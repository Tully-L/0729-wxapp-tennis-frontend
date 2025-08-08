const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Admin Authentication Middleware
 * Verifies JWT tokens and ensures user has admin privileges
 */

// Rate limiting store for login attempts (in production, use Redis)
const loginAttempts = new Map();

// Clean up old login attempts every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.lastAttempt < oneHourAgo) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);

/**
 * Rate limiting middleware for admin login attempts
 */
const adminRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!loginAttempts.has(clientIP)) {
    loginAttempts.set(clientIP, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now
    });
    return next();
  }

  const attempts = loginAttempts.get(clientIP);
  
  // Reset counter if window has passed
  if (now - attempts.firstAttempt > windowMs) {
    loginAttempts.set(clientIP, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now
    });
    return next();
  }

  // Check if max attempts exceeded
  if (attempts.count >= maxAttempts) {
    const timeLeft = Math.ceil((windowMs - (now - attempts.firstAttempt)) / 1000 / 60);
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many login attempts. Please try again in ${timeLeft} minutes.`,
        retryAfter: timeLeft
      }
    });
  }

  // Increment attempt count
  attempts.count++;
  attempts.lastAttempt = now;
  loginAttempts.set(clientIP, attempts);

  next();
};

/**
 * Reset rate limit on successful login
 */
const resetRateLimit = (req) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  loginAttempts.delete(clientIP);
};

/**
 * Main admin authentication middleware
 */
const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access denied. No token provided.'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Access denied. Invalid token format.'
        }
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired. Please login again.'
          }
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token. Please login again.'
          }
        });
      } else {
        throw jwtError;
      }
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found. Please login again.'
        }
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive. Please contact administrator.'
        }
      });
    }

    // Check if user is deleted
    if (user.is_deleted) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DELETED',
          message: 'Account has been deleted. Please contact administrator.'
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

    // Check if user has admin privileges
    if (!user.isAdmin()) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized admin access attempt by user ${user._id} (${user.email || user.nickname}) from IP ${req.ip}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Access denied. Admin privileges required.'
        }
      });
    }

    // Add user to request object
    req.user = user;
    req.adminLevel = user.role; // 'admin' or 'super_admin'

    // Log successful admin access (optional, for audit purposes)
    console.log(`Admin access granted to ${user.email || user.nickname} (${user.role}) from IP ${req.ip}`);

    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error occurred.'
      }
    });
  }
};

/**
 * Super admin only middleware
 */
const superAdminAuth = async (req, res, next) => {
  try {
    // First run regular admin auth
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    // Check if user is super admin
    if (!req.user || !req.user.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUPER_ADMIN_REQUIRED',
          message: 'Access denied. Super admin privileges required.'
        }
      });
    }
    
    next();
  } catch (error) {
    // If adminAuth failed, the response was already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error occurred.'
        }
      });
    }
  }
};

/**
 * Role-based authorization middleware factory
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required.'
        }
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}, your role: ${userRole}`
        }
      });
    }

    next();
  };
};

/**
 * IP whitelist middleware (optional, for extra security)
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No IP restriction if list is empty
    }

    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn(`Blocked admin access from unauthorized IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Access denied from this IP address.'
        }
      });
    }

    next();
  };
};

/**
 * Audit logging middleware
 */
const auditLog = (action) => {
  return (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the admin action
      const logData = {
        timestamp: new Date(),
        adminId: req.user?._id,
        adminEmail: req.user?.email,
        adminRole: req.user?.role,
        action: action,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: data?.success !== false,
        error: data?.error?.code || null
      };

      // In production, save to database or external logging service
      console.log('Admin Action Log:', JSON.stringify(logData, null, 2));

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  adminAuth,
  superAdminAuth,
  requireRole,
  adminRateLimit,
  resetRateLimit,
  ipWhitelist,
  auditLog
};