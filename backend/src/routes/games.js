const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { auth } = require('../middleware/auth');

// 获取比赛的所有盘
router.get('/matches/:matchId/sets', auth, gameController.getMatchSets);

// 获取盘的所有局
router.get('/sets/:setId/games', auth, gameController.getSetGames);

// 获取比赛的详细比分
router.get('/matches/:matchId/detailed-score', auth, gameController.getDetailedScore);

// 创建新的盘
router.post('/matches/:matchId/sets', auth, gameController.createSet);

// 创建新的局
router.post('/sets/:setId/games', auth, gameController.createGame);

// 更新局比分
router.put('/games/:gameId/score', auth, gameController.updateGameScore);

module.exports = router;
