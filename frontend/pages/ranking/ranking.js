// 球员排名页面
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 筛选条件
    genderFilter: 'all',
    typeFilter: 'single',
    searchKeyword: '',
    
    // 球员排名页面专用数据
    
    // 模拟球员排名数据
    playerRankList: [
      { id: 1, rank: 1, avatar: "/images/icon/我的222icon.png", name: "稀罕", level: "5.9级", updateTime: "6月28日", score: 2850, gender: 'male', type: 'single' },
      { id: 2, rank: 2, avatar: "/images/icon/我的222icon.png", name: "郑彦劼", level: "5.6级", updateTime: "3月25日", score: 2720, gender: 'male', type: 'single' },
      { id: 3, rank: 3, avatar: "/images/icon/我的222icon.png", name: "陆鹏宇", level: "5.6级", updateTime: "3月25日", score: 2680, gender: 'male', type: 'single' },
      { id: 4, rank: 4, avatar: "/images/icon/我的222icon.png", name: "李小花", level: "5.2级", updateTime: "6月15日", score: 2450, gender: 'female', type: 'single' },
      { id: 5, rank: 5, avatar: "/images/icon/我的222icon.png", name: "王大明", level: "5.0级", updateTime: "6月20日", score: 2380, gender: 'male', type: 'double' },
      { id: 6, rank: 6, avatar: "/images/icon/我的222icon.png", name: "张美丽", level: "4.8级", updateTime: "6月22日", score: 2250, gender: 'female', type: 'double' },
      { id: 7, rank: 7, avatar: "/images/icon/我的222icon.png", name: "刘强", level: "4.6级", updateTime: "6月18日", score: 2180, gender: 'male', type: 'single' },
      { id: 8, rank: 8, avatar: "/images/icon/我的222icon.png", name: "赵雅琪", level: "4.5级", updateTime: "6月25日", score: 2120, gender: 'female', type: 'single' },
    ],

    // 过滤后的数据
    filteredPlayerList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '球员排名'
    });
    
    // 初始化数据
    this.filterData();
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
    this.loadRankingData();
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
      title: 'LJ网球社 - 球员排名',
      path: '/pages/ranking/ranking',
      imageUrl: '/images/icon/我的222icon.png'
    };
  },

  /**
   * 按性别筛选
   */
  filterByGender: function(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      genderFilter: gender
    });
    this.filterData();
  },

  /**
   * 按类型筛选（单打/双打）
   */
  filterByType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      typeFilter: type
    });
    this.filterData();
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    this.filterData();
  },

  // ETA相关方法已移至积分榜页面

  /**
   * 过滤球员数据
   */
  filterData: function() {
    let filtered = this.data.playerRankList;
    
    // 按性别筛选
    if (this.data.genderFilter !== 'all') {
      filtered = filtered.filter(player => player.gender === this.data.genderFilter);
    }
    
    // 按类型筛选
    filtered = filtered.filter(player => player.type === this.data.typeFilter);
    
    // 按搜索关键词筛选
    if (this.data.searchKeyword.trim()) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(keyword) ||
        player.level.toLowerCase().includes(keyword)
      );
    }
    
    this.setData({
      filteredPlayerList: filtered
    });
  },

  // ETA数据过滤方法已移至积分榜页面

  /**
   * 跳转到球员详情
   */
  goToPlayerDetail: function(e) {
    const playerId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '球员详情',
      content: `查看球员ID: ${playerId} 的详细信息`,
      showCancel: false,
      confirmText: '了解更多',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 加载排名数据
   */
  loadRankingData: function() {
    // 模拟网络请求
    wx.showLoading({
      title: '加载中...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      this.filterData();
    }, 500);
  }
});
