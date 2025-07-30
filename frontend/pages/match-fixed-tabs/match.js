// Match Page with Fixed Tabs - 比赛页面
const API = require('../../utils/api');
const auth = require('../../utils/auth');
const { notification } = require('../../utils/notification');

Page({
    data: {
        // Match Tab System
        activeMatchTab: 'all-matches',
        matchTabs: [
            { id: 'all-matches', name: '全部比赛', icon: '📋', badge: 0 },
            { id: 'live-matches', name: '直播', icon: '🔴', badge: 0 },
            { id: 'my-matches', name: '我的比赛', icon: '👤', badge: 0, requiresAuth: true },
            { id: 'tournament-bracket', name: '对阵表', icon: '🏆', badge: 0 },
            { id: 'statistics', name: '统计', icon: '📊', badge: 0, requiresAuth: true }
        ],

        // Match Tab Data
        matchTabData: {
            allMatches: {
                matches: [],
                loading: false,
                hasMore: true,
                currentPage: 1,
                scrollTop: 0
            },
            liveMatches: {
                matches: [],
                loading: false,
                lastUpdated: null,
                autoRefresh: true
            },
            myMatches: {
                matches: [],
                loading: false,
                type: 'all', // all, playing, watching
                hasMore: true,
                currentPage: 1
            },
            tournamentBracket: {
                tournaments: [],
                selectedTournament: null,
                loading: false
            },
            statistics: {
                matchStats: {},
                performanceData: [],
                recentMatches: [],
                loading: false
            }
        },

        // Match Filters
        matchFilters: {
            status: '', // '', 'upcoming', 'live', 'completed'
            matchType: '',
            venue: ''
        },

        // Loading and Error States
        matchLoading: false,
        matchError: '',

        // User Info
        userInfo: null,
        isLoggedIn: false,

        // Tournament Data
        tournaments: [],
        selectedTournamentIndex: 0,
        selectedTournament: null,

        // Statistics Data
        matchStats: {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            ranking: null
        },
        performanceData: [],
        recentMatches: [],
        statsPeriod: '30d',

        // Live Match Updates
        liveUpdateTimer: null,
        liveUpdateInterval: 30000 // 30 seconds
    },

    onLoad: function () {
        // Check login status
        const isLoggedIn = auth.checkLogin();
        const userInfo = auth.getUserInfo();

        this.setData({
            userInfo: userInfo,
            isLoggedIn: isLoggedIn
        });

        // Initialize match tab system
        this.initMatchTabSystem();

        // Initialize touch gestures
        this.initTouchGestures();

        // Load initial tab data
        this.loadMatchTabData(this.data.activeMatchTab);

        // Start live updates if on live tab
        if (this.data.activeMatchTab === 'live-matches') {
            this.startLiveUpdates();
        }
    },

    onUnload: function () {
        // Clean up live updates
        this.stopLiveUpdates();
    },

    // Match Tab System Methods
    initMatchTabSystem: function () {
        const tabs = this.data.matchTabs.map(tab => {
            if (tab.requiresAuth && !this.data.isLoggedIn) {
                return { ...tab, disabled: true };
            }
            return tab;
        });

        this.setData({ matchTabs: tabs });

        // Initialize scroll positions
        this.scrollPositions = {};
        this.data.matchTabs.forEach(tab => {
            this.scrollPositions[tab.id] = 0;
        });
    },

    onMatchTabChange: function (e) {
        const { activeTab, previousTab } = e.detail;

        // Save current scroll position
        if (previousTab) {
            this.saveScrollPosition(previousTab);
        }

        // Stop live updates if leaving live tab
        if (previousTab === 'live-matches') {
            this.stopLiveUpdates();
        }

        // Switch to new tab
        this.setData({ activeMatchTab: activeTab });

        // Load tab data if needed
        this.loadMatchTabData(activeTab);

        // Start live updates if entering live tab
        if (activeTab === 'live-matches') {
            this.startLiveUpdates();
        }

        // Restore scroll position
        setTimeout(() => {
            this.restoreScrollPosition(activeTab);
        }, 100);
    },

    loadMatchTabData: function (tabId) {
        switch (tabId) {
            case 'all-matches':
                this.loadAllMatches();
                break;
            case 'live-matches':
                this.loadLiveMatches();
                break;
            case 'my-matches':
                this.loadMyMatches();
                break;
            case 'tournament-bracket':
                this.loadTournamentBracket();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
        }
    },

    // All Matches Tab Methods
    loadAllMatches: function () {
        const tabData = this.data.matchTabData.allMatches;
        if (tabData.matches.length === 0 && !tabData.loading) {
            this.setData({
                'matchTabData.allMatches.loading': true,
                matchLoading: true
            });

            const params = {
                page: 1,
                pageSize: 20,
                ...this.data.matchFilters
            };

            API.getMatches(params)
                .then(res => {
                    if (res.success) {
                        // Generate mock data for demonstration
                        const mockMatches = this.generateMockMatches(20);

                        this.setData({
                            'matchTabData.allMatches.matches': mockMatches,
                            'matchTabData.allMatches.hasMore': true,
                            'matchTabData.allMatches.loading': false,
                            'matchTabData.allMatches.currentPage': 1,
                            matchLoading: false
                        });
                    } else {
                        this.setData({
                            'matchTabData.allMatches.loading': false,
                            matchLoading: false,
                            matchError: res.message || '加载比赛失败'
                        });
                    }
                })
                .catch(err => {
                    console.error('Failed to load matches:', err);

                    // Use mock data on error
                    const mockMatches = this.generateMockMatches(20);
                    this.setData({
                        'matchTabData.allMatches.matches': mockMatches,
                        'matchTabData.allMatches.loading': false,
                        matchLoading: false
                    });
                });
        }
    },

    generateMockMatches: function (count) {
        const statuses = ['upcoming', 'live', 'completed'];
        const venues = ['中央球场', '1号球场', '2号球场', '3号球场'];
        const matchTypes = ['单打', '双打', '混双'];
        const players = [
            { nickname: '张三', ranking: 15, avatar: '/images/default-avatar.svg' },
            { nickname: '李四', ranking: 23, avatar: '/images/default-avatar.svg' },
            { nickname: '王五', ranking: 8, avatar: '/images/default-avatar.svg' },
            { nickname: '赵六', ranking: 42, avatar: '/images/default-avatar.svg' },
            { nickname: '钱七', ranking: 31, avatar: '/images/default-avatar.svg' },
            { nickname: '孙八', ranking: 19, avatar: '/images/default-avatar.svg' }
        ];

        const matches = [];
        for (let i = 0; i < count; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const player1 = players[Math.floor(Math.random() * players.length)];
            let player2 = players[Math.floor(Math.random() * players.length)];
            while (player2.nickname === player1.nickname) {
                player2 = players[Math.floor(Math.random() * players.length)];
            }

            const match = {
                _id: 'match_' + i,
                matchName: `${matchTypes[Math.floor(Math.random() * matchTypes.length)]}比赛 #${i + 1}`,
                status: status,
                startTime: status === 'live' ? '进行中' : '2024-01-' + String(15 + i).padStart(2, '0') + ' 14:00',
                venue: venues[Math.floor(Math.random() * venues.length)],
                matchType: matchTypes[Math.floor(Math.random() * matchTypes.length)],
                participants: [
                    {
                        player: player1,
                        score: status === 'completed' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 7),
                        isWinner: status === 'completed' ? Math.random() > 0.5 : false
                    },
                    {
                        player: player2,
                        score: status === 'completed' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 7),
                        isWinner: false
                    }
                ],
                spectators: Array.from({ length: Math.floor(Math.random() * 20) }, (_, idx) => ({ userId: { _id: 'user_' + idx } })),
                canInteract: true
            };

            // Ensure only one winner
            if (status === 'completed' && match.participants[0].isWinner) {
                match.participants[1].isWinner = false;
            } else if (status === 'completed' && !match.participants[0].isWinner) {
                match.participants[1].isWinner = true;
            }

            matches.push(match);
        }

        return matches;
    },

    filterMatches: function (e) {
        const { type, value } = e.currentTarget.dataset;

        this.setData({
            [`matchFilters.${type}`]: value,
            'matchTabData.allMatches.matches': [],
            'matchTabData.allMatches.currentPage': 1,
            'matchTabData.allMatches.hasMore': true
        });

        this.loadAllMatches();
    },

    loadMoreMatches: function () {
        const tabData = this.data.matchTabData.allMatches;
        if (tabData.loading || !tabData.hasMore) return;

        this.setData({
            'matchTabData.allMatches.loading': true
        });

        // Simulate loading more matches
        setTimeout(() => {
            const newMatches = this.generateMockMatches(10);
            this.setData({
                'matchTabData.allMatches.matches': [...tabData.matches, ...newMatches],
                'matchTabData.allMatches.hasMore': tabData.matches.length < 50,
                'matchTabData.allMatches.loading': false,
                'matchTabData.allMatches.currentPage': tabData.currentPage + 1
            });
        }, 1000);
    },

    // Live Matches Tab Methods
    loadLiveMatches: function () {
        this.setData({
            'matchTabData.liveMatches.loading': true,
            matchLoading: true
        });

        // Generate mock live matches
        setTimeout(() => {
            const liveMatches = this.generateMockMatches(5).filter(match => match.status === 'live');

            // Add live-specific data
            liveMatches.forEach(match => {
                match.participants[0].currentScore = Math.floor(Math.random() * 7);
                match.participants[1].currentScore = Math.floor(Math.random() * 7);
                match.participants[0].setScores = ['6', '4', '2'];
                match.participants[1].setScores = ['4', '6', '1'];
                match.elapsedTime = Math.floor(Math.random() * 120) + 30 + ' 分钟';
                match.liveViewers = Math.floor(Math.random() * 500) + 50;
            });

            this.setData({
                'matchTabData.liveMatches.matches': liveMatches,
                'matchTabData.liveMatches.loading': false,
                'matchTabData.liveMatches.lastUpdated': new Date().toLocaleTimeString(),
                matchLoading: false
            });

            // Update live matches badge
            this.updateMatchTabBadge('live-matches', liveMatches.length);
        }, 800);
    },

    startLiveUpdates: function () {
        if (this.liveUpdateTimer) {
            clearInterval(this.liveUpdateTimer);
        }

        this.liveUpdateTimer = setInterval(() => {
            if (this.data.activeMatchTab === 'live-matches' &&
                this.data.matchTabData.liveMatches.autoRefresh) {
                this.loadLiveMatches();
            }
        }, this.data.liveUpdateInterval);
    },

    stopLiveUpdates: function () {
        if (this.liveUpdateTimer) {
            clearInterval(this.liveUpdateTimer);
            this.liveUpdateTimer = null;
        }
    },

    refreshLiveMatches: function () {
        this.loadLiveMatches();

        // Haptic feedback
        wx.vibrateShort({
            type: 'light'
        });

        notification.showSuccess('已刷新直播比赛');
    },

    // My Matches Tab Methods
    loadMyMatches: function () {
        if (!this.data.isLoggedIn) {
            notification.showWarning('请先登录查看我的比赛');
            return;
        }

        const tabData = this.data.matchTabData.myMatches;

        this.setData({
            'matchTabData.myMatches.loading': true,
            matchLoading: true
        });

        // Generate mock my matches
        setTimeout(() => {
            const myMatches = this.generateMockMatches(8).map(match => ({
                ...match,
                userRole: Math.random() > 0.3 ? 'player' : 'spectator',
                userResult: match.status === 'completed' ? (Math.random() > 0.5 ? 'win' : 'lose') : null,
                finalScore: match.status === 'completed' ? '6-4, 3-6, 6-2' : null
            }));

            this.setData({
                'matchTabData.myMatches.matches': myMatches,
                'matchTabData.myMatches.loading': false,
                'matchTabData.myMatches.hasMore': false,
                matchLoading: false
            });
        }, 600);
    },

    switchMyMatchType: function (e) {
        const type = e.currentTarget.dataset.type;
        this.setData({
            'matchTabData.myMatches.type': type,
            'matchTabData.myMatches.matches': [],
            'matchTabData.myMatches.currentPage': 1,
            'matchTabData.myMatches.hasMore': true
        });
        this.loadMyMatches();
    },

    // Tournament Bracket Tab Methods
    loadTournamentBracket: function () {
        this.setData({
            'matchTabData.tournamentBracket.loading': true,
            matchLoading: true
        });

        // Generate mock tournament data
        setTimeout(() => {
            const tournaments = [
                {
                    name: '春季网球锦标赛',
                    currentStage: '半决赛',
                    progress: 75,
                    rounds: [
                        {
                            name: '第一轮',
                            date: '2024-01-15',
                            matches: this.generateMockMatches(4)
                        },
                        {
                            name: '四分之一决赛',
                            date: '2024-01-18',
                            matches: this.generateMockMatches(2)
                        },
                        {
                            name: '半决赛',
                            date: '2024-01-20',
                            matches: this.generateMockMatches(1)
                        }
                    ]
                },
                {
                    name: '夏季公开赛',
                    currentStage: '第一轮',
                    progress: 25,
                    rounds: [
                        {
                            name: '第一轮',
                            date: '2024-02-01',
                            matches: this.generateMockMatches(8)
                        }
                    ]
                }
            ];

            this.setData({
                'matchTabData.tournamentBracket.tournaments': tournaments,
                tournaments: tournaments,
                'matchTabData.tournamentBracket.loading': false,
                matchLoading: false,
                selectedTournamentIndex: 0,
                selectedTournament: tournaments[0]
            });
        }, 700);
    },

    onTournamentChange: function (e) {
        const index = e.detail.value;
        const tournament = this.data.tournaments[index];

        this.setData({
            selectedTournamentIndex: index,
            selectedTournament: tournament
        });
    },

    // Statistics Tab Methods
    loadStatistics: function () {
        if (!this.data.isLoggedIn) {
            notification.showWarning('请先登录查看统计数据');
            return;
        }

        this.setData({
            'matchTabData.statistics.loading': true,
            matchLoading: true
        });

        // Generate mock statistics
        setTimeout(() => {
            const matchStats = {
                totalMatches: 45,
                wins: 28,
                losses: 17,
                winRate: 62,
                ranking: 15
            };

            const performanceData = [
                { date: '1/15', winPercentage: 60, losePercentage: 40 },
                { date: '1/16', winPercentage: 75, losePercentage: 25 },
                { date: '1/17', winPercentage: 50, losePercentage: 50 },
                { date: '1/18', winPercentage: 80, losePercentage: 20 },
                { date: '1/19', winPercentage: 65, losePercentage: 35 },
                { date: '1/20', winPercentage: 70, losePercentage: 30 },
                { date: '1/21', winPercentage: 55, losePercentage: 45 }
            ];

            const recentMatches = [
                { _id: 'recent1', userResult: 'win', opponentName: '张三', date: '1/20', score: '6-4, 6-2' },
                { _id: 'recent2', userResult: 'lose', opponentName: '李四', date: '1/18', score: '4-6, 3-6' },
                { _id: 'recent3', userResult: 'win', opponentName: '王五', date: '1/15', score: '6-3, 7-5' },
                { _id: 'recent4', userResult: 'win', opponentName: '赵六', date: '1/12', score: '6-2, 6-1' },
                { _id: 'recent5', userResult: 'lose', opponentName: '钱七', date: '1/10', score: '5-7, 4-6' }
            ];

            this.setData({
                matchStats: matchStats,
                performanceData: performanceData,
                recentMatches: recentMatches,
                'matchTabData.statistics.matchStats': matchStats,
                'matchTabData.statistics.performanceData': performanceData,
                'matchTabData.statistics.recentMatches': recentMatches,
                'matchTabData.statistics.loading': false,
                matchLoading: false
            });
        }, 900);
    },

    changeStatsPeriod: function (e) {
        const period = e.currentTarget.dataset.period;
        this.setData({
            statsPeriod: period
        });

        // Reload performance data with new period
        this.loadStatistics();
    },

    // Navigation Methods
    goToMatchDetail: function (e) {
        const matchId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/match/detail?id=${matchId}`
        });
    },

    goToLiveMatch: function (e) {
        const matchId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/match/live?id=${matchId}`
        });
    },

    goToCreateMatch: function () {
        wx.navigateTo({
            url: '/pages/match/create'
        });
    },

    // Action Methods
    prepareForMatch: function (e) {
        const matchId = e.currentTarget.dataset.id;
        notification.showInfo('准备比赛功能开发中...');
    },

    watchLiveMatch: function (e) {
        const matchId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/match/live?id=${matchId}`
        });
    },

    shareMatch: function (e) {
        const matchId = e.currentTarget.dataset.id;
        const match = this.findMatchById(matchId);

        if (match) {
            wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
            });

            notification.showSuccess('分享成功');
        }
    },

    findMatchesToJoin: function () {
        this.setData({
            activeMatchTab: 'all-matches'
        });
        this.loadMatchTabData('all-matches');
    },

    viewAllHistory: function () {
        wx.navigateTo({
            url: '/pages/match/history'
        });
    },

    // Utility Methods
    findMatchById: function (matchId) {
        // Search in all tab data
        const allTabs = ['allMatches', 'liveMatches', 'myMatches'];

        for (const tabKey of allTabs) {
            const matches = this.data.matchTabData[tabKey].matches || [];
            const match = matches.find(m => m._id === matchId);
            if (match) return match;
        }

        return null;
    },

    updateMatchTabBadge: function (tabId, count) {
        const tabs = [...this.data.matchTabs];
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            tab.badge = count;
            this.setData({ matchTabs: tabs });
        }
    },

    // Touch Gesture Methods
    initTouchGestures: function () {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.maxVerticalDistance = 100;
    },

    onTouchStart: function (e) {
        if (e.touches && e.touches.length > 0) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }
    },

    onTouchMove: function (e) {
        if (e.touches && e.touches.length > 0) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            const deltaX = Math.abs(currentX - this.touchStartX);
            const deltaY = Math.abs(currentY - this.touchStartY);

            if (deltaX > deltaY && deltaX > 20) {
                e.preventDefault();
            }
        }
    },

    onTouchEnd: function (e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;

            this.handleSwipeGesture();
        }
    },

    handleSwipeGesture: function () {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);

        if (Math.abs(deltaX) > this.minSwipeDistance && deltaY < this.maxVerticalDistance) {
            const currentTabIndex = this.data.matchTabs.findIndex(tab => tab.id === this.data.activeMatchTab);
            let newTabIndex;

            if (deltaX > 0) {
                newTabIndex = currentTabIndex > 0 ? currentTabIndex - 1 : this.data.matchTabs.length - 1;
            } else {
                newTabIndex = currentTabIndex < this.data.matchTabs.length - 1 ? currentTabIndex + 1 : 0;
            }

            const newTab = this.data.matchTabs[newTabIndex];

            if (!newTab.disabled) {
                wx.vibrateShort({ type: 'light' });
                this.switchToMatchTab(newTab.id);
            }
        }
    },

    switchToMatchTab: function (tabId) {
        if (tabId === this.data.activeMatchTab) return;

        const previousTab = this.data.activeMatchTab;
        this.saveScrollPosition(previousTab);

        this.setData({ activeMatchTab: tabId });
        this.loadMatchTabData(tabId);

        setTimeout(() => {
            this.restoreScrollPosition(tabId);
        }, 100);
    },

    saveScrollPosition: function (tabId) {
        wx.createSelectorQuery()
            .selectViewport()
            .scrollOffset()
            .exec((res) => {
                if (res[0]) {
                    this.scrollPositions[tabId] = res[0].scrollTop;
                }
            });
    },

    restoreScrollPosition: function (tabId) {
        const scrollTop = this.scrollPositions[tabId] || 0;
        if (scrollTop > 0) {
            wx.pageScrollTo({
                scrollTop: scrollTop,
                duration: 300
            });
        }
    },

    // Tab Content Event Handlers
    onMatchTabContentChange: function (e) {
        const { activeTab, previousTab } = e.detail;
        console.log('Match tab content changed:', activeTab, previousTab);
    },

    onMatchTabLazyLoad: function (e) {
        const { tabId } = e.detail;
        console.log('Lazy loading match tab:', tabId);
        this.loadMatchTabData(tabId);
    },

    onMatchTabRetry: function (e) {
        const { activeTab } = e.detail;
        console.log('Retrying match tab:', activeTab);
        this.setData({ matchError: '' });
        this.loadMatchTabData(activeTab);
    },

    // Share App Message
    onShareAppMessage: function () {
        return {
            title: '网球比赛 - 精彩对决',
            path: '/pages/match-fixed-tabs/match',
            imageUrl: '/images/tennis-ball.svg'
        };
    },

    // Page Lifecycle
    onShow: function () {
        // Refresh current tab data
        this.loadMatchTabData(this.data.activeMatchTab);

        // Restart live updates if on live tab
        if (this.data.activeMatchTab === 'live-matches') {
            this.startLiveUpdates();
        }
    },

    onHide: function () {
        // Stop live updates when page is hidden
        this.stopLiveUpdates();
    },

    onPullDownRefresh: function () {
        // Refresh current tab data
        this.loadMatchTabData(this.data.activeMatchTab);

        setTimeout(() => {
            wx.stopPullDownRefresh();
        }, 1000);
    }
});