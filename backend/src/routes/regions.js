const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { optionalAuth } = require('../middleware/auth');

// 搜索地区（可选认证）
router.get('/search', optionalAuth, regionController.searchRegions);

// 获取热门地区（可选认证）
router.get('/hot', optionalAuth, regionController.getHotRegions);

// 获取地区统计（可选认证）
router.get('/stats', optionalAuth, regionController.getRegionStats);

// 获取地区建议（可选认证）
router.get('/suggestions', optionalAuth, regionController.getRegionSuggestions);

module.exports = router;
