// 品牌赛事页面
Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchKeyword: '',
    events: [
      {
        id: 1,
        title: '运动纪杯网球积分系列赛',
        description: '运动纪杯大湾区网球积分系列赛，是由鸣世科技主办，面向全国网球爱好者开放的大众类体育赛事，为响应国家全民健身号召，创新性的将数字AI科技与网球赛事结合，在大湾区范围内持续举办业余网球比赛。',
        image: '/images/logo.png',
        brand: '运动纪',
        category: '积分赛'
      },
      {
        id: 2,
        title: '泰尼斯杯',
        description: '泰尼斯杯双打白银赛是泰尼斯俱乐部面向各水平选手推出的双打比赛，于每周二、周六在福田区香蜜湖规律举办，旨在为不同水平阶段选手提供比赛交流、球技进步的平台。',
        image: '/images/logo.png',
        brand: '泰尼斯',
        category: '双打赛'
      },
      {
        id: 3,
        title: '龙华杯挑战赛',
        description: '龙华区网球协会双打挑战赛黄金赛是深圳市龙华区网球协会主办，面向广大网球爱好者的双打比赛，赛事包含周赛、季赛、总决赛三种类型，周赛时间为每周二晚，季赛2-3月一次，总决赛每年一次。',
        image: '/images/logo.png',
        brand: '龙华区网协',
        category: '挑战赛'
      },
      {
        id: 4,
        title: '景田郑洁杯外卡赛',
        description: '景田杯网球积分赛由郑洁（深圳）国际网球俱乐部承办，俱乐部由郑洁女士（两届大满贯网球冠军）于2018年发起成立，是一家集全国高水平运动员选拔、培训、参赛为一体的组织。',
        image: '/images/logo.png',
        brand: '郑洁俱乐部',
        category: '外卡赛'
      },
      {
        id: 5,
        title: '京花网球系列赛',
        description: '京花网球俱乐部是近年来用金银铜比赛模式的首创者，单双打比赛累计参赛选手数百人，好评如潮，现与ETA鸣世网球联盟强强联合，开设【京花杯网球积分赛】，让更多网球爱好者能够加入其中。',
        image: '/images/logo.png',
        brand: '京花俱乐部',
        category: '系列赛'
      },
      {
        id: 6,
        title: 'LJ网球社月度挑战赛',
        description: 'LJ网球社月度挑战赛是专为社员打造的高品质赛事，每月定期举办，采用瑞士轮赛制，确保每位参赛者都能获得充分的比赛机会。赛事设置多个级别，满足不同水平球员的需求。',
        image: '/images/logo.png',
        brand: 'LJ网球社',
        category: '月度赛'
      },
      {
        id: 7,
        title: '青少年网球培训营',
        description: '专为6-18岁青少年设计的网球培训项目，由专业教练团队执教，采用国际先进的教学理念和训练方法，培养青少年的网球技能和体育精神，为未来的网球之路奠定坚实基础。',
        image: '/images/logo.png',
        brand: 'LJ网球社',
        category: '培训营'
      },
      {
        id: 8,
        title: '企业网球联赛',
        description: '面向企业团体的网球联赛，旨在促进企业间的体育交流与合作。赛事采用团体赛形式，包含男单、女单、男双、女双、混双等多个项目，为企业员工提供展示才华的舞台。',
        image: '/images/logo.png',
        brand: 'LJ网球社',
        category: '企业赛'
      }
    ],
    filteredEvents: [],
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '品牌赛事'
    });
    
    // 初始化显示所有赛事
    this.setData({
      filteredEvents: this.data.events
    });
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
    this.loadEvents();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 可以在这里实现分页加载
    console.log('触底加载更多');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'LJ网球社 - 品牌赛事',
      path: '/pages/brand-events/brand-events',
      imageUrl: '/images/logo.png'
    };
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    // 实时搜索
    this.performSearch(keyword);
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm: function(e) {
    const keyword = e.detail.value || this.data.searchKeyword;
    this.performSearch(keyword);
  },

  /**
   * 执行搜索
   */
  performSearch: function(keyword) {
    if (!keyword.trim()) {
      // 如果搜索关键词为空，显示所有赛事
      this.setData({
        filteredEvents: this.data.events
      });
      return;
    }

    // 根据关键词过滤赛事
    const filtered = this.data.events.filter(event => {
      return event.title.toLowerCase().includes(keyword.toLowerCase()) ||
             event.brand.toLowerCase().includes(keyword.toLowerCase()) ||
             event.category.toLowerCase().includes(keyword.toLowerCase()) ||
             event.description.toLowerCase().includes(keyword.toLowerCase());
    });

    this.setData({
      filteredEvents: filtered
    });
  },

  /**
   * 跳转到赛事详情
   */
  goToEventDetail: function(e) {
    const eventId = e.currentTarget.dataset.id;
    const event = this.data.events.find(item => item.id == eventId);
    
    if (event) {
      // 这里可以跳转到具体的赛事详情页
      wx.showModal({
        title: event.title,
        content: `品牌：${event.brand}\n类型：${event.category}\n\n${event.description}`,
        showCancel: false,
        confirmText: '了解更多',
        success: (res) => {
          if (res.confirm) {
            // 可以跳转到更详细的页面
            wx.showToast({
              title: '功能开发中',
              icon: 'none'
            });
          }
        }
      });
    }
  },

  /**
   * 加载赛事数据
   */
  loadEvents: function() {
    this.setData({
      isLoading: true
    });
    
    // 模拟网络请求
    setTimeout(() => {
      this.setData({
        isLoading: false,
        filteredEvents: this.data.events
      });
    }, 500);
  }
});
