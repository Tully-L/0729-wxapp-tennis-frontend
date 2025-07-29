const axios = require('axios');

// 获取微信小程序 access_token
const getAccessToken = async () => {
  try {
    const response = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_SECRET}`
    );
    
    if (response.data.access_token) {
      return response.data.access_token;
    } else {
      throw new Error('Failed to get access token');
    }
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// 发送统一服务消息
const sendUniformMessage = async (openid, templateId, data, page = 'pages/index/index') => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      {
        touser: openid,
        template_id: templateId,
        page,
        data
      }
    );
    
    if (response.data.errcode === 0) {
      return { success: true };
    } else {
      throw new Error(`WeChat API error: ${response.data.errmsg}`);
    }
  } catch (error) {
    console.error('Error sending uniform message:', error);
    throw error;
  }
};

// 发送比赛开始通知
const sendMatchStartNotification = async (openid, matchData) => {
  const data = {
    thing1: { value: matchData.name }, // 比赛名称
    time2: { value: matchData.startTime }, // 开始时间
    thing3: { value: matchData.venue }, // 比赛场地
    thing4: { value: matchData.stage } // 比赛阶段
  };
  
  return sendUniformMessage(openid, process.env.WECHAT_TEMPLATE_ID, data, 'pages/detail/detail?id=' + matchData._id);
};

// 发送比分更新通知
const sendScoreUpdateNotification = async (openid, matchData) => {
  const data = {
    thing1: { value: matchData.name }, // 比赛名称
    thing2: { value: `${matchData.score.team1}-${matchData.score.team2}` }, // 当前比分
    time3: { value: new Date().toLocaleString() }, // 更新时间
    thing4: { value: matchData.status } // 比赛状态
  };
  
  return sendUniformMessage(openid, process.env.WECHAT_TEMPLATE_ID, data, 'pages/detail/detail?id=' + matchData._id);
};

module.exports = {
  getAccessToken,
  sendUniformMessage,
  sendMatchStartNotification,
  sendScoreUpdateNotification
}; 