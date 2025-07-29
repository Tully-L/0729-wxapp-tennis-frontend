// 中文编码处理中间件

// 确保请求体中的中文字符正确编码
const ensureUtf8Encoding = (req, res, next) => {
  // 如果请求体存在且包含中文字符，确保正确编码
  if (req.body && typeof req.body === 'object') {
    req.body = processObjectEncoding(req.body);
  }
  
  // 设置响应头确保中文正确显示
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  next();
};

// 递归处理对象中的中文编码
const processObjectEncoding = (obj) => {
  if (typeof obj === 'string') {
    // 如果字符串包含乱码，尝试修复
    if (obj.includes('?') && obj.length > 0) {
      return obj; // 暂时返回原值，避免进一步损坏
    }
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map(processObjectEncoding);
  } else if (obj && typeof obj === 'object') {
    const processed = {};
    for (const [key, value] of Object.entries(obj)) {
      processed[key] = processObjectEncoding(value);
    }
    return processed;
  }
  return obj;
};

// 检查字符串是否包含中文字符
const containsChinese = (str) => {
  return /[\u4e00-\u9fff]/.test(str);
};

// 验证UTF-8编码
const isValidUtf8 = (str) => {
  try {
    return str === decodeURIComponent(encodeURIComponent(str));
  } catch (e) {
    return false;
  }
};

module.exports = {
  ensureUtf8Encoding,
  processObjectEncoding,
  containsChinese,
  isValidUtf8
};