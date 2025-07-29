// API request utility
const app = getApp();

// Base API URL
const BASE_URL = 'https://api.tennisheat.com';

// Mock data for development
const mockMatches = [
  {
    _id: '1',
    eventType: '男子单打',
    stage: '决赛',
    status: 'completed',
    venue: '中央球场',
    duration: '2h15',
    organizer: { name: '温布尔登网球俱乐部' },
    players: [
      { name: '费德勒', ranking: 1, avatar: null },
      { name: '纳达尔', ranking: 2, avatar: null }
    ],
    sets: [
      { setNumber: 1, score: { team1: 6, team2: 4 } },
      { setNumber: 2, score: { team1: 4, team2: 6 } },
      { setNumber: 3, score: { team1: 6, team2: 2 } }
    ]
  },
  {
    _id: '2',
    eventType: '女子双打',
    stage: '半决赛',
    status: 'ongoing',
    venue: '1号球场',
    duration: '1h45',
    organizer: { name: '美国网球协会' },
    players: [
      { name: '小威廉姆斯', ranking: 1, avatar: null },
      { name: '大威廉姆斯', ranking: 2, avatar: null }
    ],
    sets: [
      { setNumber: 1, score: { team1: 6, team2: 3 } },
      { setNumber: 2, score: { team1: 5, team2: 4 } }
    ]
  },
  {
    _id: '3',
    eventType: '混合双打',
    stage: '四分之一决赛',
    status: 'upcoming',
    venue: '2号球场',
    duration: null,
    organizer: { name: '网球热' },
    players: [
      { name: '穆雷', ranking: 3, avatar: null },
      { name: '莎拉波娃', ranking: 4, avatar: null }
    ],
    sets: []
  }
];

const mockEvents = [
  {
    _id: '1',
    name: '温布尔登锦标赛 2024',
    eventType: '男子单打',
    status: 'registration',
    venue: '全英俱乐部',
    region: '伦敦',
    eventDate: '2024-07-01',
    registrationDeadline: '2024-06-15',
    organizer: { name: '温布尔登网球俱乐部' },
    coverImage: null
  },
  {
    _id: '2',
    name: '美国公开赛 2024',
    eventType: '女子单打',
    status: 'upcoming',
    venue: 'USTA比利·简·金',
    region: '纽约',
    eventDate: '2024-08-26',
    registrationDeadline: '2024-08-01',
    organizer: { name: '美国网球协会' },
    coverImage: null
  }
];

// Request method with mock data
const request = (url, method, data = {}, showLoading = true) => {
  return new Promise((resolve, reject) => {
    if (showLoading) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }
    
    // Simulate API delay
    setTimeout(() => {
      if (showLoading) {
        wx.hideLoading();
      }
      
      // Mock API responses
      if (url.includes('/matches')) {
        resolve({ data: mockMatches });
      } else if (url.includes('/events')) {
        resolve({ data: mockEvents });
      } else if (url.includes('/users/')) {
        resolve({
          id: 'user123',
          nickname: '网球选手',
          avatar: null,
          stats: {
            participationCount: 15,
            wins: 10,
            losses: 5,
            winRate: '67%',
            etaPoints: 2500
          }
        });
      } else {
        resolve({ data: [] });
      }
    }, 1000);
  });
};

// API endpoints
const API = {
  // Auth
  login: (data) => request('/auth/login', 'POST', data),
  register: (data) => request('/auth/register', 'POST', data),
  
  // Events
  getEvents: (params) => request('/events', 'GET', params),
  getEventDetail: (id) => request(`/events/${id}`, 'GET'),
  createEvent: (data) => request('/events', 'POST', data),
  updateEvent: (id, data) => request(`/events/${id}`, 'PUT', data),
  deleteEvent: (id) => request(`/events/${id}`, 'DELETE'),
  
  // Matches
  getMatches: (params) => request('/matches', 'GET', params),
  getMatchDetail: (id) => {
    // Return mock match detail
    const match = mockMatches.find(m => m._id === id);
    return Promise.resolve(match || mockMatches[0]);
  },
  createMatch: (data) => request('/matches', 'POST', data),
  updateMatch: (id, data) => request(`/matches/${id}`, 'PUT', data),
  deleteMatch: (id) => request(`/matches/${id}`, 'DELETE'),
  
  // Users
  getUserProfile: (id) => request(`/users/${id}`, 'GET'),
  updateUserProfile: (id, data) => request(`/users/${id}`, 'PUT', data),
  getUserMatches: (id, params) => request(`/users/${id}/matches`, 'GET', params),
  
  // Clubs
  getClubs: () => Promise.resolve({ data: [
    { id: '1', name: 'LT・JIMMY 俱乐部', points: 3000, logo: null },
    { id: '2', name: '网球专业俱乐部', points: 2500, logo: null }
  ]}),
  getClubDetail: (id) => request(`/clubs/${id}`, 'GET'),
  getClubMembers: (id) => request(`/clubs/${id}/members`, 'GET'),
  getClubLeaderboard: (id) => request(`/clubs/${id}/leaderboard`, 'GET'),
  
  // Registration
  registerForEvent: (eventId, data) => request(`/events/${eventId}/register`, 'POST', data),
  cancelRegistration: (eventId) => request(`/events/${eventId}/register`, 'DELETE')
};

module.exports = {
  request,
  API
}; 