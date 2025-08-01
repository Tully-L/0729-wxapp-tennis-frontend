// matchStatusController.js - 比赛状态管理控制器
const matchStatusService = require('../services/matchStatusService');
const Match = require('../models/Match');
const { validationResult } = require('express-validator');

class MatchStatusController {
  // 更新比赛状态
  async updateMatchStatus(req, res) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '请求参数错误',
          errors: errors.array()
        });
      }

      const { matchId } = req.params;
      const { status, reason, force = false } = req.body;
      const userId = req.user?.id;

      // 更新状态
      const result = await matchStatusService.updateMatchStatus(matchId, status, {
        userId,
        reason,
        force
      });

      res.json({
        success: true,
        message: '状态更新成功',
        data: result
      });
    } catch (error) {
      console.error('更新比赛状态失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '状态更新失败'
      });
    }
  }

  // 获取比赛状态历史
  async getMatchStatusHistory(req, res) {
    try {
      const { matchId } = req.params;
      
      const match = await Match.findById(matchId).select('statusHistory');
      if (!match) {
        return res.status(404).json({
          success: false,
          message: '比赛不存在'
        });
      }

      res.json({
        success: true,
        data: match.statusHistory || []
      });
    } catch (error) {
      console.error('获取状态历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取状态历史失败'
      });
    }
  }

  // 批量更新比赛状态
  async batchUpdateStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '请求参数错误',
          errors: errors.array()
        });
      }

      const { matchIds, status, reason, force = false } = req.body;
      const userId = req.user?.id;

      const results = await matchStatusService.batchUpdateStatus(matchIds, status, {
        userId,
        reason,
        force
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      res.json({
        success: true,
        message: `批量更新完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
        data: {
          updated: successCount,
          failed: failCount,
          results: results
        }
      });
    } catch (error) {
      console.error('批量更新状态失败:', error);
      res.status(500).json({
        success: false,
        message: '批量更新失败'
      });
    }
  }

  // 获取状态统计
  async getStatusStatistics(req, res) {
    try {
      const { eventId, organizerId, dateRange } = req.query;
      
      // 构建筛选条件
      const filters = {};
      if (eventId) filters.eventId = eventId;
      if (organizerId) filters['organizer.id'] = organizerId;
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        filters.scheduledTime = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const statistics = await matchStatusService.getStatusStatistics(filters);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('获取状态统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取状态统计失败'
      });
    }
  }

  // 获取可用的状态转换
  async getAvailableTransitions(req, res) {
    try {
      const { matchId } = req.params;
      
      const match = await Match.findById(matchId);
      if (!match) {
        return res.status(404).json({
          success: false,
          message: '比赛不存在'
        });
      }

      const currentStatus = match.status;
      const availableTransitions = matchStatusService.statusTransitions[currentStatus] || [];

      res.json({
        success: true,
        data: {
          currentStatus: currentStatus,
          availableTransitions: availableTransitions.map(status => ({
            status: status,
            displayText: matchStatusService.getStatusDisplayText(status),
            icon: matchStatusService.getStatusIcon(status),
            class: matchStatusService.getStatusClass(status)
          }))
        }
      });
    } catch (error) {
      console.error('获取可用状态转换失败:', error);
      res.status(500).json({
        success: false,
        message: '获取可用状态转换失败'
      });
    }
  }

  // 自动状态管理（定时任务接口）
  async autoUpdateStatuses(req, res) {
    try {
      // 只允许管理员或系统调用
      if (req.user?.role !== 'admin' && req.headers['x-system-key'] !== process.env.SYSTEM_KEY) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      await matchStatusService.autoUpdateStatuses();

      res.json({
        success: true,
        message: '自动状态更新完成'
      });
    } catch (error) {
      console.error('自动状态更新失败:', error);
      res.status(500).json({
        success: false,
        message: '自动状态更新失败'
      });
    }
  }

  // 获取状态配置信息
  async getStatusConfig(req, res) {
    try {
      const statusConfig = {
        transitions: matchStatusService.statusTransitions,
        priority: matchStatusService.statusPriority,
        displayConfig: Object.keys(matchStatusService.statusTransitions).reduce((acc, status) => {
          acc[status] = {
            displayText: matchStatusService.getStatusDisplayText(status),
            icon: matchStatusService.getStatusIcon(status),
            class: matchStatusService.getStatusClass(status)
          };
          return acc;
        }, {})
      };

      res.json({
        success: true,
        data: statusConfig
      });
    } catch (error) {
      console.error('获取状态配置失败:', error);
      res.status(500).json({
        success: false,
        message: '获取状态配置失败'
      });
    }
  }

  // 强制更新状态（管理员功能）
  async forceUpdateStatus(req, res) {
    try {
      // 只允许管理员调用
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，只有管理员可以强制更新状态'
        });
      }

      const { matchId } = req.params;
      const { status, reason } = req.body;
      const userId = req.user.id;

      const result = await matchStatusService.updateMatchStatus(matchId, status, {
        userId,
        reason: reason || '管理员强制更新',
        force: true
      });

      res.json({
        success: true,
        message: '强制状态更新成功',
        data: result
      });
    } catch (error) {
      console.error('强制更新状态失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '强制状态更新失败'
      });
    }
  }

  // 重置比赛状态（管理员功能）
  async resetMatchStatus(req, res) {
    try {
      // 只允许管理员调用
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，只有管理员可以重置状态'
        });
      }

      const { matchId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const result = await matchStatusService.updateMatchStatus(matchId, '报名中', {
        userId,
        reason: reason || '管理员重置状态',
        force: true
      });

      res.json({
        success: true,
        message: '比赛状态重置成功',
        data: result
      });
    } catch (error) {
      console.error('重置比赛状态失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '重置比赛状态失败'
      });
    }
  }
}

module.exports = new MatchStatusController();
