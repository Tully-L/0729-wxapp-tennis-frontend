// matchStatus.js - 比赛状态管理路由
const express = require('express');
const { body, param, query } = require('express-validator');
const matchStatusController = require('../controllers/matchStatusController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 验证中间件
const validateMatchId = [
  param('matchId')
    .isMongoId()
    .withMessage('无效的比赛ID')
];

const validateStatusUpdate = [
  body('status')
    .isIn(['报名中', '比赛中', '已暂停', '已结束', '已取消'])
    .withMessage('无效的状态值'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('原因不能超过200个字符'),
  body('force')
    .optional()
    .isBoolean()
    .withMessage('force参数必须是布尔值')
];

const validateBatchUpdate = [
  body('matchIds')
    .isArray({ min: 1 })
    .withMessage('matchIds必须是非空数组'),
  body('matchIds.*')
    .isMongoId()
    .withMessage('无效的比赛ID'),
  body('status')
    .isIn(['报名中', '比赛中', '已暂停', '已结束', '已取消'])
    .withMessage('无效的状态值'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('原因不能超过200个字符'),
  body('force')
    .optional()
    .isBoolean()
    .withMessage('force参数必须是布尔值')
];

// 更新比赛状态
router.put(
  '/:matchId/status',
  authenticateToken,
  validateMatchId,
  validateStatusUpdate,
  matchStatusController.updateMatchStatus
);

// 获取比赛状态历史
router.get(
  '/:matchId/status/history',
  authenticateToken,
  validateMatchId,
  matchStatusController.getMatchStatusHistory
);

// 批量更新比赛状态
router.put(
  '/batch/status',
  authenticateToken,
  validateBatchUpdate,
  matchStatusController.batchUpdateStatus
);

// 获取状态统计
router.get(
  '/status/statistics',
  authenticateToken,
  [
    query('eventId')
      .optional()
      .isMongoId()
      .withMessage('无效的赛事ID'),
    query('organizerId')
      .optional()
      .isMongoId()
      .withMessage('无效的主办方ID'),
    query('dateRange')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/)
      .withMessage('日期范围格式错误，应为YYYY-MM-DD,YYYY-MM-DD')
  ],
  matchStatusController.getStatusStatistics
);

// 获取可用的状态转换
router.get(
  '/:matchId/status/transitions',
  authenticateToken,
  validateMatchId,
  matchStatusController.getAvailableTransitions
);

// 自动状态管理（定时任务接口）
router.post(
  '/status/auto-update',
  matchStatusController.autoUpdateStatuses
);

// 获取状态配置信息
router.get(
  '/status/config',
  authenticateToken,
  matchStatusController.getStatusConfig
);

// 管理员功能：强制更新状态
router.put(
  '/:matchId/status/force',
  authenticateToken,
  requireRole('admin'),
  validateMatchId,
  [
    body('status')
      .isIn(['报名中', '比赛中', '已暂停', '已结束', '已取消'])
      .withMessage('无效的状态值'),
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .withMessage('原因不能超过200个字符')
  ],
  matchStatusController.forceUpdateStatus
);

// 管理员功能：重置比赛状态
router.post(
  '/:matchId/status/reset',
  authenticateToken,
  requireRole('admin'),
  validateMatchId,
  [
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .withMessage('原因不能超过200个字符')
  ],
  matchStatusController.resetMatchStatus
);

module.exports = router;
