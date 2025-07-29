const errorHandler = (err, req, res, next) => {
  // 记录错误详情
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  let error = { ...err };
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Data validation failed',
      code: 'VALIDATION_ERROR',
      errors: messages,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      success: false,
      message: `${field} '${value}' already exists`,
      code: 'DUPLICATE_KEY_ERROR',
      field: field,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID_FORMAT',
      path: err.path,
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED',
      expiredAt: err.expiredAt,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'NotBeforeError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token not active yet',
      code: 'TOKEN_NOT_ACTIVE',
      timestamp: new Date().toISOString()
    });
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error. Please try again later.',
      code: 'DATABASE_CONNECTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Request timeout
  if (err.code === 'ETIMEDOUT') {
    return res.status(408).json({
      success: false,
      message: 'Request timeout',
      code: 'REQUEST_TIMEOUT',
      timestamp: new Date().toISOString()
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      code: 'FILE_TOO_LARGE',
      limit: err.limit,
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE',
      timestamp: new Date().toISOString()
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter,
      timestamp: new Date().toISOString()
    });
  }

  // WeChat API errors
  if (err.name === 'WeChatAPIError') {
    return res.status(502).json({
      success: false,
      message: 'WeChat service error',
      code: 'WECHAT_API_ERROR',
      wechatError: err.wechatError,
      timestamp: new Date().toISOString()
    });
  }

  // Payment errors
  if (err.name === 'PaymentError') {
    return res.status(402).json({
      success: false,
      message: err.message || 'Payment processing failed',
      code: 'PAYMENT_ERROR',
      paymentCode: err.paymentCode,
      timestamp: new Date().toISOString()
    });
  }

  // Business logic errors
  if (err.name === 'BusinessError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code || 'BUSINESS_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // 在生产环境中不暴露详细的错误信息
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500 
      ? 'Something went wrong. Please try again later.' 
      : message,
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // 在开发环境中添加更多调试信息
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = {
      name: err.name,
      originalMessage: err.message
    };
  }

  res.status(statusCode).json(response);
};

// 创建自定义错误类
class BusinessError extends Error {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
  }
}

class WeChatAPIError extends Error {
  constructor(message, wechatError) {
    super(message);
    this.name = 'WeChatAPIError';
    this.wechatError = wechatError;
  }
}

class PaymentError extends Error {
  constructor(message, paymentCode) {
    super(message);
    this.name = 'PaymentError';
    this.paymentCode = paymentCode;
  }
}

module.exports = errorHandler;
module.exports.BusinessError = BusinessError;
module.exports.WeChatAPIError = WeChatAPIError;
module.exports.PaymentError = PaymentError; 