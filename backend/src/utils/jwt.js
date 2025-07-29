const jwt = require('jsonwebtoken');

// 生成访问令牌
const generateToken = (userId, expiresIn = null) => {
  const payload = { 
    userId,
    type: 'access',
    iat: Math.floor(Date.now() / 1000)
  };
  
  const options = {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// 生成刷新令牌
const generateRefreshToken = (userId) => {
  const payload = { 
    userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  const options = {
    expiresIn: '30d' // 刷新令牌有效期更长
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// 验证令牌
const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查令牌类型
    if (!decoded.type) {
      decoded.type = 'access'; // 向后兼容
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active');
    } else {
      throw error;
    }
  }
};

// 从请求头中提取令牌
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// 检查令牌是否即将过期（在30分钟内过期）
const isTokenExpiringSoon = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }
    
    const expirationTime = decoded.exp * 1000; // 转换为毫秒
    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000; // 30分钟的毫秒数
    
    return (expirationTime - currentTime) < thirtyMinutes;
  } catch (error) {
    return false;
  }
};

// 生成令牌对（访问令牌和刷新令牌）
const generateTokenPair = (userId) => {
  return {
    accessToken: generateToken(userId),
    refreshToken: generateRefreshToken(userId),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  isTokenExpiringSoon,
  generateTokenPair
}; 