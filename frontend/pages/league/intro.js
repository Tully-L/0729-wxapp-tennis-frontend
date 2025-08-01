// 联盟介绍页面
Page({
  /**
   * 页面的初始数据
   */
  data: {
    leagueInfo: {
      name: 'LJ网球联盟',
      slogan: '专业 · 热情 · 卓越',
      description: 'LJ网球联盟成立于2020年，是一个致力于推广网球运动、培养网球人才的专业体育组织。',
      stats: {
        players: '500+',
        courts: '50+',
        events: '200+',
        satisfaction: '98%'
      },
      contact: {
        phone: '400-888-9999',
        email: 'info@ljtennis.com',
        address: '广州市天河区体育中心'
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '联盟介绍'
    });
    
    // 加载联盟信息
    this.loadLeagueInfo();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadLeagueInfo();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'LJ网球联盟 - 专业网球运动平台',
      path: '/pages/league/intro',
      imageUrl: '../../images/icon/logo.png'
    };
  },

  /**
   * 加载联盟信息
   */
  loadLeagueInfo: function() {
    // 这里可以从服务器加载联盟信息
    // 目前使用静态数据
    console.log('联盟信息加载完成');
  },

  /**
   * 拨打联系电话
   */
  makePhoneCall: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.leagueInfo.contact.phone,
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.error('拨打电话失败:', err);
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 复制邮箱地址
   */
  copyEmail: function() {
    wx.setClipboardData({
      data: this.data.leagueInfo.contact.email,
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 查看地址位置
   */
  viewLocation: function() {
    // 这里可以打开地图查看位置
    wx.showToast({
      title: '地图功能开发中',
      icon: 'none'
    });
  },

  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
});
