// pages/order/order.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 筛选弹窗显示状态
    showOrderTypeFilter: false,
    showOrderStatusFilter: false,
    
    // 当前选中的筛选条件
    selectedOrderType: 'all',
    selectedOrderStatus: 'all',
    
    // 订单列表（当前为空状态）
    orders: [],
    
    // 加载状态
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '订单'
    });
    
    // 加载订单数据
    this.loadOrders();
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 显示订单类型筛选
   */
  onOrderTypeFilter() {
    this.setData({
      showOrderTypeFilter: true
    });
  },

  /**
   * 显示订单状态筛选
   */
  onOrderStatusFilter() {
    this.setData({
      showOrderStatusFilter: true
    });
  },

  /**
   * 隐藏订单类型筛选
   */
  hideOrderTypeFilter() {
    this.setData({
      showOrderTypeFilter: false
    });
  },

  /**
   * 隐藏订单状态筛选
   */
  hideOrderStatusFilter() {
    this.setData({
      showOrderStatusFilter: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击弹窗内容区域时关闭弹窗
  },

  /**
   * 选择订单类型
   */
  selectOrderType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedOrderType: type,
      showOrderTypeFilter: false
    });
    
    // 重新加载订单数据
    this.loadOrders();
  },

  /**
   * 选择订单状态
   */
  selectOrderStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      selectedOrderStatus: status,
      showOrderStatusFilter: false
    });
    
    // 重新加载订单数据
    this.loadOrders();
  },



  /**
   * 加载订单数据
   */
  loadOrders() {
    this.setData({
      loading: true
    });

    // 模拟API调用
    setTimeout(() => {
      // 这里应该调用实际的API获取订单数据
      // 当前返回空数组模拟无订单状态
      this.setData({
        orders: [],
        loading: false
      });
    }, 500);
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadOrders();
    wx.stopPullDownRefresh();
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    // 如果有更多数据，可以在这里加载
    console.log('到达底部，加载更多订单');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: 'LJ网球社 - 我的订单',
      path: '/pages/order/order',
      imageUrl: '/images/icon/logo.png'
    };
  }
});
