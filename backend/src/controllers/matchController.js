const Match = require('../models/Match');
const User = require('../models/User');
const Event = require('../models/Event');
const { BusinessError } = require('../middleware/errorHandler');
const { generateMockMatches, groupMatchesByDate, formatDateDisplay, formatTimeDisplay } = require('../utils/mockTennisData');

// 获取比赛列表 - 增强版本
const getMatches = async (req, res, next) => {
  try {
    const { 
      status, 
      eventType, 
      page = 1, 
      limit = 10,
      player,
      region,
      dateRange,
      isLive,
      organizer,
      sortBy = 'scheduledTime',
      sortOrder = 'desc',
      minViewCount,
      playerRanking,
      intensity
    } = req.query;

    console.log('获取比赛列表请求参数:', { status, eventType, page, limit, player, region, isLive });

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    console.log('MongoDB连接状态:', mongoose.connection.readyState);
    console.log('连接状态说明: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');

    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB未连接，使用模拟数据');
      
      // 生成模拟比赛数据
      let allMatches = generateMockMatches(50);
      
      // 应用筛选条件
      if (status) {
        const statusMap = {
          'ongoing': '比赛中',
          'completed': '已结束', 
          'upcoming': '报名中'
        };
        const chineseStatus = statusMap[status] || status;
        allMatches = allMatches.filter(match => match.status === chineseStatus);
      }
      
      if (eventType) {
        // 支持中文和英文eventType筛选
        allMatches = allMatches.filter(match =>
          match.eventType === eventType ||
          match.eventTypeId === eventType ||
          match.gender === eventType ||
          match.format === eventType
        );
      }
      
      if (player) {
        allMatches = allMatches.filter(match => 
          match.players.team1.some(p => p.name.includes(player)) ||
          match.players.team2.some(p => p.name.includes(player))
        );
      }
      
      if (region) {
        allMatches = allMatches.filter(match => match.region.includes(region));
      }
      
      if (isLive !== undefined) {
        allMatches = allMatches.filter(match => match.isLive === (isLive === 'true'));
      }
      
      if (minViewCount) {
        allMatches = allMatches.filter(match => match.viewCount >= parseInt(minViewCount));
      }
      
      if (playerRanking) {
        allMatches = allMatches.filter(match => 
          match.players.team1.some(p => p.ranking <= parseInt(playerRanking)) ||
          match.players.team2.some(p => p.ranking <= parseInt(playerRanking))
        );
      }
      
      // 分页处理
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedMatches = allMatches.slice(skip, skip + parseInt(limit));
      
      // 按日期分组
      const groupedMatches = groupMatchesByDate(paginatedMatches);
      
      // 转换为前端需要的格式
      const formattedData = Object.keys(groupedMatches).map(date => ({
        date: date,
        dateDisplay: formatDateDisplay(date),
        matches: groupedMatches[date].map(match => ({
          ...match,
          timeDisplay: formatTimeDisplay(match.scheduledTime),
          scoreString: match.score.sets.map(set => {
            let scoreStr = `${set.team1Score} ${set.team2Score}`;
            if (set.tiebreak.played) {
              const winnerScore = set.team1Score > set.team2Score ? set.tiebreak.team1Score : set.tiebreak.team2Score;
              scoreStr += ` (${winnerScore})`;
            }
            return scoreStr;
          }).join(' '),
          winnerTeam: match.score.winner,
          matchStats: {
            spectatorCount: match.spectators?.length || 0,
            viewCount: match.viewCount || 0,
            duration: match.duration,
            intensity: calculateMockIntensity(match)
          }
        }))
      }));
      
      return res.json({
        success: true,
        data: formattedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allMatches.length,
          pages: Math.ceil(allMatches.length / parseInt(limit))
        }
      });
    }

    // MongoDB已连接，使用增强的查询方法
    const filters = {
      status,
      eventType,
      region,
      player,
      organizer,
      isLive: isLive !== undefined ? isLive === 'true' : undefined
    };
    
    // 处理日期范围
    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        filters.dateRange = range;
      } catch (e) {
        console.warn('日期范围解析失败:', dateRange);
      }
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1,
      populate: true
    };
    
    // 如果有高级筛选条件，使用高级搜索
    if (minViewCount || playerRanking || intensity) {
      const searchParams = {
        eventType,
        status,
        region,
        dateRange: filters.dateRange,
        playerRanking: playerRanking ? parseInt(playerRanking) : undefined,
        minViewCount: minViewCount ? parseInt(minViewCount) : undefined,
        intensity
      };
      
      const searchResult = await Match.advancedSearch(searchParams, options);
      
      // 为每个比赛添加统计信息
      const enhancedMatches = searchResult.matches.map(match => ({
        ...match,
        scoreSummary: match.score ? {
          sets: match.score.sets || [],
          winner: match.score.winner,
          isCompleted: match.status === '已结束'
        } : { sets: [], winner: null, isCompleted: false },
        matchStats: {
          spectatorCount: match.spectators?.length || 0,
          viewCount: match.viewCount || 0,
          duration: match.duration,
          intensity: match.calculatedIntensity || 'low'
        }
      }));
      
      return res.json({
        success: true,
        data: enhancedMatches,
        pagination: searchResult.pagination,
        searchParams: searchResult.searchParams
      });
    }
    
    // 构建查询条件
    const query = {};

    // 应用筛选条件
    if (filters.status) query.status = filters.status;

    // 赛事类型筛选 - 支持多种筛选方式
    if (filters.eventType) {
      query.$or = [
        { eventType: filters.eventType },
        { eventTypeId: filters.eventType },
        { gender: filters.eventType },
        { format: filters.eventType }
      ];
    }

    if (filters.region) query.region = new RegExp(filters.region, 'i');
    if (filters.isLive !== undefined) query.isLive = filters.isLive;
    if (filters.organizer) query['organizer.id'] = filters.organizer;

    // 日期范围筛选
    if (filters.dateRange) {
      if (filters.dateRange.start || filters.dateRange.end) {
        query.scheduledTime = {};
        if (filters.dateRange.start) query.scheduledTime.$gte = new Date(filters.dateRange.start);
        if (filters.dateRange.end) query.scheduledTime.$lte = new Date(filters.dateRange.end);
      }
    }

    // 选手筛选
    if (filters.player) {
      query.$or = [
        { 'players.team1.name': new RegExp(filters.player, 'i') },
        { 'players.team2.name': new RegExp(filters.player, 'i') }
      ];
    }

    console.log('MongoDB查询条件:', JSON.stringify(query, null, 2));

    const skip = (options.page - 1) * options.limit;

    // 使用直接查询方法
    const matches = await Match.find(query)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip(skip)
      .limit(options.limit)
      .populate('eventId', 'name eventType venue')
      .populate('organizer.id', 'nickname avatar');

    const total = await Match.countDocuments(query);

    // 更新每个比赛的状态（基于时间）并添加统计信息
    const enhancedMatches = [];
    for (let match of matches) {
      // 更新状态
      match.updateStatusBasedOnTime();
      await match.save();

      // 添加统计信息
      enhancedMatches.push({
        ...match.toObject(),
        scoreSummary: match.getScoreSummary(),
        matchStats: match.getMatchStats()
      });
    }

    res.json({
      success: true,
      data: enhancedMatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// 辅助函数：计算模拟数据的比赛强度
const calculateMockIntensity = (match) => {
  if (!match.score.sets || match.score.sets.length === 0) return 'low';
  
  let intensityScore = 0;
  
  match.score.sets.forEach(set => {
    const scoreDiff = Math.abs(set.team1Score - set.team2Score);
    const totalGames = set.team1Score + set.team2Score;
    
    if (scoreDiff <= 1) intensityScore += 3;
    else if (scoreDiff <= 2) intensityScore += 2;
    else intensityScore += 1;
    
    if (totalGames >= 12) intensityScore += 3;
    else if (totalGames >= 10) intensityScore += 2;
    else intensityScore += 1;
    
    if (set.tiebreak && set.tiebreak.played) {
      intensityScore += 2;
    }
  });
  
  const avgIntensity = intensityScore / match.score.sets.length;
  
  if (avgIntensity >= 7) return 'high';
  else if (avgIntensity >= 5) return 'medium';
  else return 'low';
};

// 获取比赛详情 - 增强版本
const getMatchDetail = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?._id;

    const match = await Match.findById(matchId)
      .populate('eventId', 'name eventType venue region eventDate')
      .populate('organizer.id', 'nickname avatar region')
      .populate('spectators', 'nickname avatar');

    if (!match) {
      throw new BusinessError('比赛不存在', 'MATCH_NOT_FOUND');
    }

    // 更新状态（基于时间）
    match.updateStatusBasedOnTime();

    // 增加浏览量
    match.viewCount += 1;
    await match.save();

    // 构建增强的比赛详情
    const matchDetail = {
      ...match.toObject(),
      scoreSummary: match.getScoreSummary(),
      matchStats: match.getMatchStats(),
      userRelation: {
        isSpectator: userId ? match.spectators.some(s => s._id.toString() === userId.toString()) : false,
        isOrganizer: userId ? match.organizer.id.toString() === userId.toString() : false,
        canUpdateScore: userId ? (
          match.organizer.id.toString() === userId.toString() ||
          match.players.team1.some(p => p.userId?.toString() === userId.toString()) ||
          match.players.team2.some(p => p.userId?.toString() === userId.toString())
        ) : false
      }
    };

    res.json({
      success: true,
      data: matchDetail
    });
  } catch (error) {
    next(error);
  }
};

// 创建比赛
const createMatch = async (req, res) => {
  try {
    const {
      eventId,
      eventType,
      stage,
      venue,
      startTime,
      players,
      notes
    } = req.body;

    const userId = req.user.id;

    // 验证用户权限
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查用户是否为赛事组织者
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有赛事组织者可以创建比赛'
      });
    }

    // 获取组织者信息
    const organizer = await User.findById(userId);

    const match = new Match({
      eventId,
      eventType,
      stage,
      venue,
      startTime: startTime ? new Date(startTime) : null,
      players,
      organizer: {
        name: organizer.name,
        id: organizer._id
      },
      notes
    });

    await match.save();

    res.status(201).json({
      success: true,
      message: '比赛创建成功',
      data: match
    });
  } catch (error) {
    console.error('创建比赛失败:', error);
    res.status(500).json({
      success: false,
      message: '创建比赛失败',
      error: error.message
    });
  }
};

// 更新比分 - 增强版本
const updateScore = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { setNumber, team1Score, team2Score, tiebreak } = req.body;

    // 验证输入参数
    if (!setNumber || team1Score === undefined || team2Score === undefined) {
      throw new BusinessError('缺少必要的比分参数', 'MISSING_SCORE_PARAMS');
    }

    const match = await Match.findById(matchId);
    if (!match) {
      throw new BusinessError('比赛不存在', 'MATCH_NOT_FOUND');
    }

    // 验证权限 - 只有组织者或参与者可以更新比分
    const userId = req.user._id;
    const isOrganizer = match.organizer.id.toString() === userId.toString();
    const isPlayer = match.players.team1.some(p => p.userId?.toString() === userId.toString()) ||
                     match.players.team2.some(p => p.userId?.toString() === userId.toString());

    if (!isOrganizer && !isPlayer) {
      throw new BusinessError('没有权限更新比分', 'NO_PERMISSION');
    }

    // 使用增强的比分更新方法
    await match.updateScore(setNumber, team1Score, team2Score, tiebreak);

    // 重新获取更新后的比赛数据
    const updatedMatch = await Match.findById(matchId)
      .populate('eventId', 'name eventType')
      .populate('organizer.id', 'nickname avatar');

    // 构建响应数据
    const responseData = {
      ...updatedMatch.toObject(),
      scoreSummary: updatedMatch.getScoreSummary(),
      matchStats: updatedMatch.getMatchStats()
    };

    // 发送WebSocket更新
    if (req.app.locals.socketService) {
      req.app.locals.socketService.sendScoreUpdate(matchId, {
        setNumber,
        team1Score,
        team2Score,
        tiebreak,
        scoreSummary: updatedMatch.getScoreSummary(),
        isCompleted: updatedMatch.status === '已结束'
      });
    }

    res.json({
      success: true,
      message: '比分更新成功',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

// 开始比赛
const startMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: '比赛不存在'
      });
    }

    // 验证权限
    const userId = req.user.id;
    if (match.organizer.id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有组织者可以开始比赛'
      });
    }

    await match.startMatch();

    // 发送WebSocket更新
    if (req.app.locals.socketService) {
      req.app.locals.socketService.sendMatchStatusUpdate(matchId, '比赛中');
    }

    res.json({
      success: true,
      message: '比赛已开始',
      data: match
    });
  } catch (error) {
    console.error('开始比赛失败:', error);
    res.status(500).json({
      success: false,
      message: '开始比赛失败',
      error: error.message
    });
  }
};

// 结束比赛
const endMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: '比赛不存在'
      });
    }

    // 验证权限
    const userId = req.user.id;
    if (match.organizer.id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有组织者可以结束比赛'
      });
    }

    await match.endMatch();

    // 发送WebSocket更新
    if (req.app.locals.socketService) {
      req.app.locals.socketService.sendMatchStatusUpdate(matchId, '已结束');
    }

    res.json({
      success: true,
      message: '比赛已结束',
      data: match
    });
  } catch (error) {
    console.error('结束比赛失败:', error);
    res.status(500).json({
      success: false,
      message: '结束比赛失败',
      error: error.message
    });
  }
};

// 添加观众 - 增强版本
const addSpectator = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findById(matchId);
    if (!match) {
      throw new BusinessError('比赛不存在', 'MATCH_NOT_FOUND');
    }

    // 检查是否已经是观众
    if (match.spectators.includes(userId)) {
      throw new BusinessError('您已经是这场比赛的观众', 'ALREADY_SPECTATOR');
    }

    // 使用模型方法添加观众
    await match.addSpectator(userId);

    // 发送WebSocket更新
    if (req.app.locals.socketService) {
      req.app.locals.socketService.sendSpectatorUpdate(matchId, {
        action: 'join',
        userId: userId,
        spectatorCount: match.spectators.length
      });
    }

    res.json({
      success: true,
      message: '成功加入观众',
      data: {
        matchId: match._id,
        spectatorCount: match.spectators.length,
        viewCount: match.viewCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// 移除观众 - 增强版本
const removeSpectator = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findById(matchId);
    if (!match) {
      throw new BusinessError('比赛不存在', 'MATCH_NOT_FOUND');
    }

    // 检查是否是观众
    if (!match.spectators.includes(userId)) {
      throw new BusinessError('您不是这场比赛的观众', 'NOT_SPECTATOR');
    }

    // 使用模型方法移除观众
    await match.removeSpectator(userId);

    // 发送WebSocket更新
    if (req.app.locals.socketService) {
      req.app.locals.socketService.sendSpectatorUpdate(matchId, {
        action: 'leave',
        userId: userId,
        spectatorCount: match.spectators.length
      });
    }

    res.json({
      success: true,
      message: '成功退出观众',
      data: {
        matchId: match._id,
        spectatorCount: match.spectators.length,
        viewCount: match.viewCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取比赛统计概览
const getMatchStats = async (req, res, next) => {
  try {
    const { 
      status,
      eventType,
      region,
      dateRange
    } = req.query;

    // 构建筛选条件
    const filters = {};
    if (status) filters.status = status;
    if (eventType) filters.eventType = eventType;
    if (region) filters.region = new RegExp(region, 'i');
    
    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        if (range.start || range.end) {
          filters.scheduledTime = {};
          if (range.start) filters.scheduledTime.$gte = new Date(range.start);
          if (range.end) filters.scheduledTime.$lte = new Date(range.end);
        }
      } catch (e) {
        console.warn('日期范围解析失败:', dateRange);
      }
    }

    // 获取统计数据
    const stats = await Match.getMatchStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// 获取实时比赛列表
const getLiveMatches = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    console.log('查询实时比赛，limit:', limit);

    const liveMatches = await Match.find({ isLive: true })
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .populate('eventId', 'name eventType venue')
      .populate('organizer.id', 'nickname avatar');

    console.log('找到的实时比赛数量:', liveMatches.length);

    // 为每个比赛添加实时统计信息
    const enhancedMatches = liveMatches.map(match => ({
      ...match.toObject(),
      scoreSummary: match.getScoreSummary(),
      matchStats: match.getMatchStats()
    }));

    res.json({
      success: true,
      data: enhancedMatches
    });
  } catch (error) {
    next(error);
  }
};

// 搜索比赛
const searchMatches = async (req, res, next) => {
  try {
    const { 
      query,
      page = 1,
      limit = 10
    } = req.query;

    if (!query || query.trim().length < 2) {
      throw new BusinessError('搜索关键词至少需要2个字符', 'INVALID_SEARCH_QUERY');
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const filters = {
      $or: [
        { matchName: searchRegex },
        { venue: searchRegex },
        { region: searchRegex },
        { 'players.team1.name': searchRegex },
        { 'players.team2.name': searchRegex },
        { 'organizer.name': searchRegex }
      ]
    };

    const matches = await Match.findWithFilters(
      filters,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: 'scheduledTime',
        sortOrder: -1,
        populate: true
      }
    );

    const total = await Match.countDocuments(filters);

    // 为每个比赛添加统计信息
    const enhancedMatches = matches.map(match => ({
      ...match.toObject(),
      scoreSummary: match.getScoreSummary(),
      matchStats: match.getMatchStats()
    }));

    res.json({
      success: true,
      data: {
        matches: enhancedMatches,
        query: query.trim(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户相关的比赛
const getUserMatches = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { 
      type = 'all', // all, organized, participated, spectated
      status,
      page = 1,
      limit = 10
    } = req.query;

    let filters = {};

    // 根据类型构建查询条件
    switch (type) {
      case 'organized':
        filters['organizer.id'] = userId;
        break;
      case 'participated':
        filters.$or = [
          { 'players.team1.userId': userId },
          { 'players.team2.userId': userId }
        ];
        break;
      case 'spectated':
        filters.spectators = userId;
        break;
      case 'all':
      default:
        filters.$or = [
          { 'organizer.id': userId },
          { 'players.team1.userId': userId },
          { 'players.team2.userId': userId },
          { spectators: userId }
        ];
        break;
    }

    // 添加状态筛选
    if (status) {
      filters.status = status;
    }

    const matches = await Match.findWithFilters(
      filters,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: 'scheduledTime',
        sortOrder: -1,
        populate: true
      }
    );

    const total = await Match.countDocuments(filters);

    // 为每个比赛添加用户关系和统计信息
    const enhancedMatches = matches.map(match => ({
      ...match.toObject(),
      scoreSummary: match.getScoreSummary(),
      matchStats: match.getMatchStats(),
      userRelation: {
        isOrganizer: match.organizer.id.toString() === userId.toString(),
        isPlayer: match.players.team1.some(p => p.userId?.toString() === userId.toString()) ||
                  match.players.team2.some(p => p.userId?.toString() === userId.toString()),
        isSpectator: match.spectators.includes(userId)
      }
    }));

    res.json({
      success: true,
      data: {
        matches: enhancedMatches,
        type,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取推荐比赛
const getRecommendedMatches = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const recommendations = await Match.getRecommendedMatches(userId, { limit: parseInt(limit) });

    // 为每个推荐比赛添加统计信息
    const enhancedRecommendations = recommendations.matches.map(match => ({
      ...match.toObject(),
      scoreSummary: match.getScoreSummary(),
      matchStats: match.getMatchStats()
    }));

    res.json({
      success: true,
      data: {
        matches: enhancedRecommendations,
        preferences: recommendations.preferences,
        total: recommendations.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// 高级搜索比赛
const advancedSearchMatches = async (req, res, next) => {
  try {
    const {
      query,
      eventType,
      status,
      region,
      dateRange,
      playerRanking,
      minViewCount,
      hasLiveStream,
      intensity,
      page = 1,
      limit = 10,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    const searchParams = {
      query,
      eventType,
      status,
      region,
      dateRange: dateRange ? JSON.parse(dateRange) : undefined,
      playerRanking: playerRanking ? parseInt(playerRanking) : undefined,
      minViewCount: minViewCount ? parseInt(minViewCount) : undefined,
      hasLiveStream: hasLiveStream === 'true',
      intensity
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    const searchResult = await Match.advancedSearch(searchParams, options);

    // 为每个搜索结果添加统计信息
    const enhancedMatches = searchResult.matches.map(match => ({
      ...match,
      scoreSummary: match.score ? {
        sets: match.score.sets || [],
        winner: match.score.winner,
        isCompleted: match.status === '已结束'
      } : { sets: [], winner: null, isCompleted: false },
      matchStats: {
        spectatorCount: match.spectators?.length || 0,
        viewCount: match.viewCount || 0,
        duration: match.duration,
        intensity: match.calculatedIntensity || 'low',
        relevanceScore: match.relevanceScore || 0
      }
    }));

    res.json({
      success: true,
      data: {
        matches: enhancedMatches,
        pagination: searchResult.pagination,
        searchParams: searchResult.searchParams
      }
    });
  } catch (error) {
    next(error);
  }
};

// 批量操作比赛
const batchUpdateMatches = async (req, res, next) => {
  try {
    const { matchIds, operation, data } = req.body;
    const userId = req.user._id;

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      throw new BusinessError('请提供有效的比赛ID列表', 'INVALID_MATCH_IDS');
    }

    if (!operation) {
      throw new BusinessError('请指定操作类型', 'MISSING_OPERATION');
    }

    const results = [];
    const errors = [];

    for (const matchId of matchIds) {
      try {
        const match = await Match.findById(matchId);
        if (!match) {
          errors.push({ matchId, error: '比赛不存在' });
          continue;
        }

        // 验证权限
        const isOrganizer = match.organizer.id.toString() === userId.toString();
        if (!isOrganizer) {
          errors.push({ matchId, error: '没有权限操作此比赛' });
          continue;
        }

        let result;
        switch (operation) {
          case 'start':
            if (match.canStart()) {
              await match.startMatch();
              result = { matchId, status: 'started' };
            } else {
              errors.push({ matchId, error: '比赛无法开始' });
              continue;
            }
            break;

          case 'end':
            if (match.status === '比赛中') {
              await match.endMatch(data?.winner);
              result = { matchId, status: 'ended' };
            } else {
              errors.push({ matchId, error: '只能结束进行中的比赛' });
              continue;
            }
            break;

          case 'update':
            if (data) {
              Object.assign(match, data);
              await match.save();
              result = { matchId, status: 'updated' };
            } else {
              errors.push({ matchId, error: '缺少更新数据' });
              continue;
            }
            break;

          case 'delete':
            await Match.findByIdAndDelete(matchId);
            result = { matchId, status: 'deleted' };
            break;

          default:
            errors.push({ matchId, error: '不支持的操作类型' });
            continue;
        }

        results.push(result);
      } catch (error) {
        errors.push({ matchId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `批量操作完成，成功: ${results.length}，失败: ${errors.length}`,
      data: {
        results,
        errors,
        summary: {
          total: matchIds.length,
          success: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取比赛时间线
const getMatchTimeline = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate('eventId', 'name eventType')
      .populate('organizer.id', 'nickname avatar');

    if (!match) {
      throw new BusinessError('比赛不存在', 'MATCH_NOT_FOUND');
    }

    // 构建比赛时间线
    const timeline = [];

    // 比赛创建
    timeline.push({
      type: 'created',
      timestamp: match.createdAt,
      title: '比赛创建',
      description: `${match.organizer.name} 创建了比赛`,
      icon: '📅'
    });

    // 比赛开始
    if (match.startTime) {
      timeline.push({
        type: 'started',
        timestamp: match.startTime,
        title: '比赛开始',
        description: '比赛正式开始',
        icon: '🎾'
      });
    }

    // 比分更新
    match.score.sets.forEach((set, index) => {
      if (set.team1Score > 0 || set.team2Score > 0) {
        timeline.push({
          type: 'score_update',
          timestamp: new Date(match.startTime.getTime() + (index + 1) * 45 * 60000), // 估算时间
          title: `第${set.setNumber}盘结束`,
          description: `比分: ${set.team1Score}-${set.team2Score}${set.tiebreak.played ? ` (抢七: ${set.tiebreak.team1Score}-${set.tiebreak.team2Score})` : ''}`,
          icon: '🏆',
          data: {
            setNumber: set.setNumber,
            score: `${set.team1Score}-${set.team2Score}`,
            tiebreak: set.tiebreak.played ? `${set.tiebreak.team1Score}-${set.tiebreak.team2Score}` : null
          }
        });
      }
    });

    // 比赛结束
    if (match.endTime) {
      const winner = match.score.winner === 'team1' ? 
        match.players.team1.map(p => p.name).join('/') : 
        match.players.team2.map(p => p.name).join('/');

      timeline.push({
        type: 'ended',
        timestamp: match.endTime,
        title: '比赛结束',
        description: `${winner} 获胜`,
        icon: '🏅',
        data: {
          winner: match.score.winner,
          duration: match.duration
        }
      });
    }

    // 按时间排序
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: {
        match: {
          _id: match._id,
          matchName: match.matchName,
          eventType: match.eventType,
          status: match.status
        },
        timeline,
        summary: {
          totalEvents: timeline.length,
          duration: match.duration,
          isCompleted: match.status === '已结束'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 导出比赛数据
const exportMatchData = async (req, res, next) => {
  try {
    const { 
      format = 'json', // json, csv, excel
      filters = {},
      fields = []
    } = req.query;

    // 解析筛选条件
    let parsedFilters = {};
    try {
      parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
    } catch (e) {
      parsedFilters = {};
    }

    // 解析字段列表
    let selectedFields = [];
    try {
      selectedFields = typeof fields === 'string' ? JSON.parse(fields) : fields;
    } catch (e) {
      selectedFields = [];
    }

    // 获取比赛数据
    const matches = await Match.findWithFilters(parsedFilters, {
      limit: 1000, // 限制导出数量
      populate: true
    });

    // 处理数据格式
    const processedData = matches.map(match => {
      const baseData = {
        id: match._id,
        matchName: match.matchName,
        eventType: match.eventType,
        status: match.status,
        stage: match.stage,
        venue: match.venue,
        region: match.region,
        scheduledTime: match.scheduledTime,
        startTime: match.startTime,
        endTime: match.endTime,
        duration: match.duration,
        team1Players: match.players.team1.map(p => p.name).join(', '),
        team2Players: match.players.team2.map(p => p.name).join(', '),
        scoreString: match.scoreString,
        winner: match.score.winner,
        spectatorCount: match.spectators.length,
        viewCount: match.viewCount,
        organizer: match.organizer.name,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt
      };

      // 如果指定了字段，只返回指定字段
      if (selectedFields.length > 0) {
        const filteredData = {};
        selectedFields.forEach(field => {
          if (baseData.hasOwnProperty(field)) {
            filteredData[field] = baseData[field];
          }
        });
        return filteredData;
      }

      return baseData;
    });

    // 根据格式返回数据
    switch (format.toLowerCase()) {
      case 'csv':
        // 简单的CSV格式（实际项目中建议使用专门的CSV库）
        if (processedData.length === 0) {
          return res.json({ success: false, message: '没有数据可导出' });
        }

        const headers = Object.keys(processedData[0]).join(',');
        const csvData = processedData.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          ).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=matches.csv');
        res.send(headers + '\n' + csvData);
        break;

      case 'json':
      default:
        res.json({
          success: true,
          data: {
            matches: processedData,
            exportInfo: {
              format,
              totalRecords: processedData.length,
              exportTime: new Date(),
              filters: parsedFilters,
              fields: selectedFields
            }
          }
        });
        break;
    }
  } catch (error) {
    next(error);
  }
};

// 获取赛事分类统计
const getEventTypeStats = async (req, res, next) => {
  try {
    const { region, status } = req.query;

    // 构建基础查询条件
    const baseQuery = {};
    if (region) baseQuery.region = new RegExp(region, 'i');
    if (status) baseQuery.status = status;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 1) {
      // 返回模拟统计数据
      const mockStats = {
        mens_singles: { count: 45, name: '男子单打', icon: '🎾' },
        womens_singles: { count: 38, name: '女子单打', icon: '🎾' },
        mens_doubles: { count: 22, name: '男子双打', icon: '👥' },
        womens_doubles: { count: 18, name: '女子双打', icon: '👥' },
        mixed_doubles: { count: 15, name: '混合双打', icon: '👫' }
      };

      return res.json({
        success: true,
        data: mockStats
      });
    }

    // 使用聚合查询获取统计数据
    const stats = await Match.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$eventTypeId',
          count: { $sum: 1 },
          eventType: { $first: '$eventType' }
        }
      }
    ]);

    // 格式化统计结果
    const eventTypeMapping = {
      mens_singles: { name: '男子单打', icon: '🎾' },
      womens_singles: { name: '女子单打', icon: '🎾' },
      mens_doubles: { name: '男子双打', icon: '👥' },
      womens_doubles: { name: '女子双打', icon: '👥' },
      mixed_doubles: { name: '混合双打', icon: '👫' }
    };

    const formattedStats = {};
    Object.keys(eventTypeMapping).forEach(key => {
      const stat = stats.find(s => s._id === key);
      formattedStats[key] = {
        count: stat ? stat.count : 0,
        name: eventTypeMapping[key].name,
        icon: eventTypeMapping[key].icon
      };
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatchDetail,
  createMatch,
  updateScore,
  startMatch,
  endMatch,
  addSpectator,
  removeSpectator,
  getMatchStats,
  getLiveMatches,
  searchMatches,
  getUserMatches,
  getRecommendedMatches,
  advancedSearchMatches,
  batchUpdateMatches,
  getMatchTimeline,
  exportMatchData,
  getEventTypeStats
};