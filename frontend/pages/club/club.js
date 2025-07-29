// club.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    clubId: '',
    club: null,
    loading: true,
    error: false,
    
    // User info
    userInfo: null,
    isLoggedIn: false,
    isMember: false,
    
    // Members data
    members: [],
    membersLoading: false,
    
    // Leaderboard data
    leaderboard: [],
    leaderboardLoading: false,
    
    // Tab navigation
    activeTab: 0,
    tabs: ['俱乐部信息', '成员列表', '积分排行']
  },
  
  onLoad: function(options) {
    if (options.id) {
      this.setData({
        clubId: options.id
      });
      
      this.loadClubDetail();
    } else {
      this.setData({
        loading: false,
        error: true
      });
      
      wx.showToast({
        title: '俱乐部ID无效',
        icon: 'none'
      });
    }
    
    // 检查登录状态
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    });
  },
  
  // 加载俱乐部详情
  loadClubDetail: function() {
    this.setData({ loading: true });
    
    // 模拟俱乐部数据
    const mockClub = {
      id: this.data.clubId,
      name: 'LT・JIMMY 俱乐部',
      description: '专业的网球俱乐部，致力于为网球爱好者提供优质的训练和比赛环境。我们拥有专业的教练团队和完善的设施。',
      logo: null,
      memberCount: 156,
      foundedDate: '2020-03-15',
      location: '北京市朝阳区',
      facilities: ['室内球场 x 4', '室外球场 x 6', '更衣室', '休息区', '专业教练'],
      achievements: ['2023年北京市业余网球联赛冠军', '2022年朝阳区网球公开赛亚军'],
      contactInfo: {
        phone: '010-12345678',
        email: 'info@ltjimmy.com',
        address: '北京市朝阳区网球路123号'
      }
    };
    
    setTimeout(() => {
      this.setData({
        club: mockClub,
        loading: false,
        isMember: Math.random() > 0.5 // 随机模拟是否为成员
      });
    }, 1000);
  },
  
  // 加载成员列表
  loadMembers: function() {
    if (this.data.membersLoading) return;
    
    this.setData({ membersLoading: true });
    
    // 模拟成员数据
    const mockMembers = [
      {
        id: '1',
        nickname: '网球达人',
        avatar: null,
        joinDate: '2023-01-15',
        level: '高级',
        points: 2800
      },
      {
        id: '2',
        nickname: '球场新星',
        avatar: null,
        joinDate: '2023-03-20',
        level: '中级',
        points: 1950
      },
      {
        id: '3',
        nickname: '网球爱好者',
        avatar: null,
        joinDate: '2023-05-10',
        level: '初级',
        points: 1200
      }
    ];
    
    setTimeout(() => {
      this.setData({
        members: mockMembers,
        membersLoading: false
      });
    }, 800);
  },
  
  // 加载积分排行榜
  loadLeaderboard: function() {
    if (this.data.leaderboardLoading) return;
    
    this.setData({ leaderboardLoading: true });
    
    // 模拟排行榜数据
    const mockLeaderboard = [
      {
        rank: 1,
        id: '1',
        nickname: '网球王者',
        avatar: null,
        points: 3500,
        wins: 28,
        matches: 35
      },
      {
        rank: 2,
        id: '2',
        nickname: '球场霸主',
        avatar: null,
        points: 3200,
        wins: 25,
        matches: 32
      },
      {
        rank: 3,
        id: '3',
        nickname: '网球高手',
        avatar: null,
        points: 2900,
        wins: 22,
        matches: 30
      }
    ];
    
    setTimeout(() => {
      this.setData({
        leaderboard: mockLeaderboard,
        leaderboardLoading: false
      });
    }, 800);
  },
  
  // 切换标签
  switchTab: function(e) {
    const index = e.currentTarget.dataset.index;
    
    if (index !== this.data.activeTab) {
      this.setData({
        activeTab: index
      });
      
      // 根据标签加载对应数据
      if (index === 1 && this.data.members.length === 0) {
        this.loadMembers();
      } else if (index === 2 && this.data.leaderboard.length === 0) {
        this.loadLeaderboard();
      }
    }
  },
  
  // 加入俱乐部
  joinClub: function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        auth.goToLogin();
      }, 1500);
      return;
    }
    
    wx.showModal({
      title: '加入俱乐部',
      content: `确定要加入 ${this.data.club.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '加入中...',
            mask: true
          });
          
          setTimeout(() => {
            wx.hideLoading();
            this.setData({
              isMember: true,
              'club.memberCount': this.data.club.memberCount + 1
            });
            
            wx.showToast({
              title: '加入成功',
              icon: 'success'
            });
          }, 2000);
        }
      }
    });
  },
  
  // 退出俱乐部
  leaveClub: function() {
    wx.showModal({
      title: '退出俱乐部',
      content: `确定要退出 ${this.data.club.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '退出中...',
            mask: true
          });
          
          setTimeout(() => {
            wx.hideLoading();
            this.setData({
              isMember: false,
              'club.memberCount': this.data.club.memberCount - 1
            });
            
            wx.showToast({
              title: '已退出俱乐部',
              icon: 'success'
            });
          }, 2000);
        }
      }
    });
  },
  
  // 联系俱乐部
  contactClub: function() {
    const phone = this.data.club.contactInfo.phone;
    wx.showModal({
      title: '联系俱乐部',
      content: `电话：${phone}`,
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: (err) => {
              console.error('拨打电话失败:', err);
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },
  
  // 返回
  goBack: function() {
    wx.navigateBack();
  },
  
  // 分享
  onShareAppMessage: function() {
    return {
      title: this.data.club ? `${this.data.club.name} - 网球俱乐部` : '网球俱乐部',
      path: `/pages/club/club?id=${this.data.clubId}`
    };
  }
});