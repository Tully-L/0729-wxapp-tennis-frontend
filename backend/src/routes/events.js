const express = require('express');
const router = express.Router();
const { 
  getEvents, 
  getEventDetail, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  searchEvents,
  getEventStats,
  updateEventStatus,
  batchUpdateEvents,
  getUserEvents,
  updatePaymentStatus,
  getEventParticipants
} = require('../controllers/eventController');
const { auth, optionalAuth } = require('../middleware/auth');

// 获取赛事列表（可选认证）
router.get('/', optionalAuth, getEvents);

// 获取赛事详情（可选认证）
router.get('/:id', optionalAuth, getEventDetail);

// 创建赛事（需要认证）
router.post('/', auth, createEvent);

// 更新赛事（需要认证）
router.put('/:id', auth, updateEvent);

// 删除赛事（需要认证）
router.delete('/:id', auth, deleteEvent);

// 报名赛事（需要认证）
router.post('/:id/register', auth, registerForEvent);

// 取消报名（需要认证）
router.delete('/:id/register', auth, cancelRegistration);

// 搜索赛事（可选认证）
router.get('/search/events', optionalAuth, searchEvents);

// 获取赛事统计（需要认证）
router.get('/stats/overview', auth, getEventStats);

// 更新赛事状态（需要认证）
router.put('/:id/status', auth, updateEventStatus);

// 批量操作赛事（需要认证）
router.post('/batch/update', auth, batchUpdateEvents);

// 获取用户的赛事（需要认证）
router.get('/user/events', auth, getUserEvents);

// 更新支付状态（需要认证）
router.put('/:id/payment', auth, updatePaymentStatus);

// 获取赛事参与者列表（需要认证）
router.get('/:id/participants', auth, getEventParticipants);

module.exports = router; 