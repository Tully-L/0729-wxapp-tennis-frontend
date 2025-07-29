// 检查登录状态
const checkLogin = () => {
  const token = wx.getStorageSync('token');
  return !!token;
};

// 获取用户信息
const getUserInfo = () => {
  return wx.getStorageSync('userInfo') || null;
};

// 获取token
const getToken = () => {
  return wx.getStorageSync('token') || null;
};

// 登录
const login = (userInfo) => {
  const token = 'mock_token_' + Date.now();
  wx.setStorageSync('token', token);
  wx.setStorageSync('userInfo', userInfo);
  return token;
};

// 退出登录
const logout = () => {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
};

// 跳转到登录页面
const goToLogin = () => {
  wx.navigateTo({
    url: '/pages/login/login'
  });
};

module.exports = {
  checkLogin,
  getUserInfo,
  getToken,
  login,
  logout,
  goToLogin
}; 