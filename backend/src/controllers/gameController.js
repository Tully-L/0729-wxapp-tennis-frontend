const Game = require('../models/Game');
const Set = require('../models/Set');
const Match = require('../models/Match');
const { BusinessError } = require('../middleware/errorHandler');

// 获取比赛的所有盘
const getMatchSets = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    
    const sets = await Set.find({ matchId })
      .sort({ setNumber: 1 })
      .populate({
        path: 'games',
        options: { sort: { gameNumber: 1 } }
      });
    
    res.json({
      success: true,
      data: sets
    });
  } catch (error) {
    next(error);
  }
};

// 获取盘的所有局
const getSetGames = async (req, res, next) => {
  try {
    const { setId } = req.params;
    
    const games = await Game.find({ setId })
      .sort({ gameNumber: 1 });
    
    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    next(error);
  }
};

// 创建新的盘
const createSet = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { setNumber } = req.body;
    
    const match = await Match.findById(matchId);
    if (!match) {
      throw new BusinessError('比赛不存在', 'MATCH_NOT_FOUND');
    }
    
    // 检查权限
    const userId = req.user._id.toString();
    if (match.organizer.id.toString() !== userId) {
      throw new BusinessError('只有组织者可以创建新盘', 'PERMISSION_DENIED');
    }
    
    const newSet = new Set({
      matchId,
      setNumber: setNumber || (await Set.countDocuments({ matchId }) + 1),
      status: '进行中'
    });
    
    await newSet.save();
    
    // 更新比赛的sets数组
    match.sets.push(newSet._id);
    await match.save();
    
    res.json({
      success: true,
      data: newSet,
      message: '新盘创建成功'
    });
  } catch (error) {
    next(error);
  }
};

// 创建新的局
const createGame = async (req, res, next) => {
  try {
    const { setId } = req.params;
    const { gameNumber, server } = req.body;
    
    const set = await Set.findById(setId).populate('matchId');
    if (!set) {
      throw new BusinessError('盘不存在', 'SET_NOT_FOUND');
    }
    
    // 检查权限
    const userId = req.user._id.toString();
    if (set.matchId.organizer.id.toString() !== userId) {
      throw new BusinessError('只有组织者可以创建新局', 'PERMISSION_DENIED');
    }
    
    const newGame = new Game({
      setId,
      matchId: set.matchId._id,
      gameNumber: gameNumber || (await Game.countDocuments({ setId }) + 1),
      server: server || 'team1',
      status: '进行中'
    });
    
    await newGame.save();
    
    res.json({
      success: true,
      data: newGame,
      message: '新局创建成功'
    });
  } catch (error) {
    next(error);
  }
};

// 更新局比分
const updateGameScore = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { winner, pointType } = req.body;
    
    const game = await Game.findById(gameId)
      .populate({
        path: 'setId',
        populate: { path: 'matchId' }
      });
    
    if (!game) {
      throw new BusinessError('局不存在', 'GAME_NOT_FOUND');
    }
    
    // 检查权限
    const userId = req.user._id.toString();
    const match = game.setId.matchId;
    if (match.organizer.id.toString() !== userId) {
      throw new BusinessError('只有组织者可以更新比分', 'PERMISSION_DENIED');
    }
    
    // 添加得分
    await game.addPoint(winner, pointType);
    
    // 如果局结束，更新盘比分
    if (game.status === '已结束') {
      const set = game.setId;
      if (winner === 'team1') {
        set.score.team1 += 1;
      } else {
        set.score.team2 += 1;
      }
      
      // 检查盘是否结束
      if (set.score.team1 >= 6 || set.score.team2 >= 6) {
        const scoreDiff = Math.abs(set.score.team1 - set.score.team2);
        if (scoreDiff >= 2 || (set.score.team1 === 7 || set.score.team2 === 7)) {
          set.status = '已结束';
          set.winner = set.score.team1 > set.score.team2 ? 'team1' : 'team2';
        } else if (set.score.team1 === 6 && set.score.team2 === 6) {
          // 需要抢七
          set.tiebreak.played = true;
        }
      }
      
      await set.save();
      
      // 更新比赛的scoreSummary
      await match.updateScoreSummary();
    }
    
    res.json({
      success: true,
      data: game,
      message: '比分更新成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取比赛的详细比分
const getDetailedScore = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId)
      .populate({
        path: 'sets',
        populate: {
          path: 'games',
          options: { sort: { gameNumber: 1 } }
        },
        options: { sort: { setNumber: 1 } }
      });
    
    if (!match) {
      throw new BusinessError('比赛不存在', 'MATCH_NOT_FOUND');
    }
    
    const detailedScore = {
      matchId: match._id,
      status: match.status,
      sets: match.sets.map(set => ({
        setNumber: set.setNumber,
        status: set.status,
        score: set.score,
        tiebreak: set.tiebreak,
        games: set.games || []
      })),
      currentGame: match.scoreSummary?.currentGame || null,
      winner: match.scoreSummary?.winner || null
    };
    
    res.json({
      success: true,
      data: detailedScore
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatchSets,
  getSetGames,
  createSet,
  createGame,
  updateGameScore,
  getDetailedScore
};
