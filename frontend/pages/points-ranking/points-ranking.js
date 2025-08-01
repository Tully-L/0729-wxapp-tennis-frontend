// 积分榜页面
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 筛选条件
    currentTab: 'single',
    periodFilter: 'recent52',
    searchKeyword: '',
    hasMore: true,
    
    // 积分榜前三名数据
    podiumList: [
      { id: 101, name: "卡卡", score: "11861", level: "6.0级", avatar: "/images/icon/我的222icon.png" },
      { id: 102, name: "123", score: "11655", level: "5.8级", avatar: "/images/icon/我的222icon.png" },
      { id: 103, name: "马润涛", score: "8883", level: "5.6级", avatar: "/images/icon/我的222icon.png" },
    ],
    
    // 积分榜排名数据
    pointsRankList: [
      { id: 101, rank: 1, avatar: "/images/icon/我的222icon.png", name: "卡卡", score: "11861", level: "6.0级" },
      { id: 102, rank: 2, avatar: "/images/icon/我的222icon.png", name: "123", score: "11655", level: "5.8级" },
      { id: 103, rank: 3, avatar: "/images/icon/我的222icon.png", name: "马润涛", score: "8883", level: "5.6级" },
      { id: 104, rank: 4, avatar: "/images/icon/我的222icon.png", name: "X.J", score: "7609", level: "5.4级" },
      { id: 105, rank: 5, avatar: "/images/icon/我的222icon.png", name: "诚诚", score: "7009", level: "5.2级" },
      { id: 106, rank: 6, avatar: "/images/icon/我的222icon.png", name: "Will", score: "5869", level: "5.0级" },
      { id: 107, rank: 7, avatar: "/images/icon/我的222icon.png", name: "唐智灵", score: "5097", level: "4.8级" },
      { id: 108, rank: 8, avatar: "/images/icon/我的222icon.png", name: "李明", score: "4856", level: "4.6级" },
      { id: 109, rank: 9, avatar: "/images/icon/我的222icon.png", name: "王芳", score: "4623", level: "4.4级" },
      { id: 110, rank: 10, avatar: "/images/icon/我的222icon.png", name: "张伟", score: "4401", level: "4.2级" },
      { id: 111, rank: 11, avatar: "/images/icon/我的222icon.png", name: "刘强", score: "4201", level: "4.0级" },
      { id: 112, rank: 12, avatar: "/images/icon/我的222icon.png", name: "赵雅琪", score: "4089", level: "3.8级" },
      { id: 113, rank: 13, avatar: "/images/icon/我的222icon.png", name: "孙小明", score: "3956", level: "3.6级" },
      { id: 114, rank: 14, avatar: "/images/icon/我的222icon.png", name: "周美丽", score: "3823", level: "3.4级" },
      { id: 115, rank: 15, avatar: "/images/icon/我的222icon.png", name: "吴大伟", score: "3690", level: "3.2级" },
    ],
    
    // 过滤后的数据
    filteredPointsList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '积分榜'
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
    this.loadPointsData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMore) {
      this.loadMore();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'LJ网球社 - 积分榜',
      path: '/pages/points-ranking/points-ranking',
      imageUrl: '/images/icon/我的222icon.png'
    };
  },

  /**
   * 切换单打/双打tab
   */
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    
    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    // 重新加载数据
    this.filterData();
  },

  /**
   * 按周期筛选
   */
  filterByPeriod: function(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({
      periodFilter: period
    });
    this.filterData();
  },

  /**
   * 显示周期选择器
   */
  showPeriodPicker: function() {
    wx.showActionSheet({
      itemList: ["最近4周", "最近12周", "最近26周", "最近52周", "全部时间"],
      success: (res) => {
        const periods = ['recent4', 'recent12', 'recent26', 'recent52', 'all'];
        this.setData({
          periodFilter: periods[res.tapIndex]
        });
        this.filterData();
        
        wx.showToast({
          title: `已切换到${["最近4周", "最近12周", "最近26周", "最近52周", "全部时间"][res.tapIndex]}`,
          icon: 'success',
          duration: 1500
        });
      }
    });
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

  /**
   * 过滤积分数据
   */
  filterData: function() {
    let filtered = this.data.pointsRankList;
    
    // 按搜索关键词筛选
    if (this.data.searchKeyword.trim()) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(keyword) ||
        player.level.toLowerCase().includes(keyword)
      );
    }
    
    // 这里可以根据currentTab和periodFilter进一步筛选数据
    // 目前使用相同数据，实际应用中可以调用不同的API
    
    this.setData({
      filteredPointsList: filtered
    });
  },

  /**
   * 跳转到球员详情
   */
  goToPlayerDetail: function(e) {
    const playerId = e.currentTarget.dataset.id;
    const player = this.data.pointsRankList.find(p => p.id == playerId);
    
    if (player) {
      wx.showModal({
        title: player.name,
        content: `排名：第${player.rank}名\n积分：${player.score}分\n等级：${player.level}`,
        showCancel: false,
        confirmText: '查看详情',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '球员详情页开发中',
              icon: 'none'
            });
          }
        }
      });
    }
  },

  /**
   * 加载更多数据
   */
  loadMore: function() {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 模拟网络请求
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟没有更多数据
      this.setData({
        hasMore: false
      });
      
      wx.showToast({
        title: '已加载全部数据',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 加载积分数据
   */
  loadPointsData: function() {
    wx.showLoading({
      title: '刷新中...'
    });
    
    // 模拟网络请求
    setTimeout(() => {
      wx.hideLoading();
      this.filterData();
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }, 500);
  }
});
