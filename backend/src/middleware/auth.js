const { verifyToken, extractTokenFromHeader, isTokenExpiringSoon } = require('../utils/jwt');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = verifyToken(token);
    
    // 检查令牌类型
    if (decoded.type !== 'access') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token type. Access token required.',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await user.save();

    req.user = user;
    req.token = token;
    
    // 检查令牌是否即将过期，如果是，在响应头中添加提示
    if (isTokenExpiringSoon(token)) {
      res.set('X-Token-Expiring-Soon', 'true');
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    let message = 'Authentication failed.';
    let code = 'AUTH_FAILED';
    
    if (error.message === 'Token has expired') {
      message = 'Token has expired.';
      code = 'TOKEN_EXPIRED';
    } else if (error.message === 'Invalid token') {
      message = 'Invalid token.';
      code = 'INVALID_TOKEN';
    }
    
    res.status(401).json({ 
      success: false, 
      message,
      code
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      
      // 只处理访问令牌
      if (decoded.type === 'access') {
        const user = await User.findById(decoded.userId);
        
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
          
          // 更新最后登录时间（可选认证时不强制更新）
          user.lastLoginAt = new Date();
          user.save().catch(err => console.error('Error updating lastLoginAt:', err));
        }
      }
    }
    
    next();
  } catch (error) {
    // 对于可选认证，我们忽略错误并继续
    console.log('Optional auth failed (ignored):', error.message);
    next();
  }
};

module.exports = { auth, optionalAuth }; 