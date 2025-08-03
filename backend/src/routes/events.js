const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventDetail,
  createEvent,
  registerForEvent,
  updateEventStatus,
  checkinEvent,
  getEventParticipants
} = require('../controllers/eventController');
const { auth, optionalAuth } = require('../middleware/auth');

// 获取赛事列表（可选认证）
router.get('/', optionalAuth, getEvents);

// 获取赛事详情（可选认证）
router.get('/:id', optionalAuth, getEventDetail);

// 创建赛事（需要认证）
router.post('/', auth, createEvent);

// 报名赛事（需要认证）
router.post('/:id/register', auth, registerForEvent);

// 更新赛事状态（需要认证）
router.put('/:id/status', auth, updateEventStatus);

// 签到赛事（需要认证）
router.post('/:id/checkin', auth, checkinEvent);

// 获取赛事参与者列表（需要认证）
router.get('/:id/participants', auth, getEventParticipants);

module.exports = router; 