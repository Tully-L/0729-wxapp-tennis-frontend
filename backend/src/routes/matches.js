const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { auth, optionalAuth } = require('../middleware/auth');

// 获取比赛列表（可选认证）
router.get('/', optionalAuth, matchController.getMatches);

// 获取比赛统计概览（可选认证）
router.get('/stats', optionalAuth, matchController.getMatchStats);

// 获取实时比赛列表（可选认证）
router.get('/live', optionalAuth, matchController.getLiveMatches);

// 搜索比赛（可选认证）
router.get('/search', optionalAuth, matchController.searchMatches);

// 高级搜索比赛（可选认证）
router.get('/advanced-search', optionalAuth, matchController.advancedSearchMatches);

// 获取推荐比赛（需要认证）
router.get('/recommendations', auth, matchController.getRecommendedMatches);

// 获取用户相关的比赛（需要认证）
router.get('/user/matches', auth, matchController.getUserMatches);

// 导出比赛数据（需要认证）
router.get('/export', auth, matchController.exportMatchData);

// 获取比赛详情（可选认证）
router.get('/:matchId', optionalAuth, matchController.getMatchDetail);

// 获取比赛时间线（可选认证）
router.get('/:matchId/timeline', optionalAuth, matchController.getMatchTimeline);

// 创建比赛（需要认证）
router.post('/', auth, matchController.createMatch);

// 批量操作比赛（需要认证）
router.post('/batch', auth, matchController.batchUpdateMatches);

// 更新比分（需要认证）
router.put('/:matchId/score', auth, matchController.updateScore);

// 开始比赛（需要认证）
router.put('/:matchId/start', auth, matchController.startMatch);

// 结束比赛（需要认证）
router.put('/:matchId/end', auth, matchController.endMatch);

// 添加观众（需要认证）
router.post('/:matchId/spectators', auth, matchController.addSpectator);

// 移除观众（需要认证）
router.delete('/:matchId/spectators', auth, matchController.removeSpectator);

module.exports = router; 