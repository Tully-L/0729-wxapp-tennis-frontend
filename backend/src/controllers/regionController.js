// regionController.js - 地区搜索控制器
const Match = require('../models/Match');

// 搜索地区
const searchRegions = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 1) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // 使用聚合查询获取地区统计
    const regions = await Match.aggregate([
      {
        $match: {
          region: { $regex: query, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$region',
          matchCount: { $sum: 1 },
          lastMatch: { $max: '$createdAt' }
        }
      },
      {
        $sort: { matchCount: -1, lastMatch: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    // 格式化结果
    const formattedRegions = regions.map((region, index) => ({
      id: `region_${index}`,
      name: region._id,
      type: getRegionType(region._id),
      fullPath: getFullPath(region._id),
      matchCount: region.matchCount
    }));
    
    res.json({
      success: true,
      data: formattedRegions
    });
  } catch (error) {
    next(error);
  }
};

// 获取热门地区
const getHotRegions = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    
    // 获取比赛数量最多的地区
    const hotRegions = await Match.aggregate([
      {
        $group: {
          _id: '$region',
          matchCount: { $sum: 1 },
          lastMatch: { $max: '$createdAt' }
        }
      },
      {
        $sort: { matchCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    // 格式化结果
    const formattedRegions = hotRegions.map((region, index) => ({
      id: `hot_${index}`,
      name: region._id,
      type: getRegionType(region._id),
      matchCount: region.matchCount
    }));
    
    res.json({
      success: true,
      data: formattedRegions
    });
  } catch (error) {
    next(error);
  }
};

// 获取地区统计
const getRegionStats = async (req, res, next) => {
  try {
    const stats = await Match.aggregate([
      {
        $group: {
          _id: null,
          totalRegions: { $addToSet: '$region' },
          totalMatches: { $sum: 1 }
        }
      },
      {
        $project: {
          totalRegions: { $size: '$totalRegions' },
          totalMatches: 1
        }
      }
    ]);
    
    const regionDistribution = await Match.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalRegions: 0, totalMatches: 0 },
        distribution: regionDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// 辅助函数：判断地区类型
function getRegionType(regionName) {
  if (!regionName) return 'unknown';
  
  if (regionName.includes('省')) return 'province';
  if (regionName.includes('市')) return 'city';
  if (regionName.includes('区') || regionName.includes('县')) return 'district';
  
  // 根据长度判断
  if (regionName.length <= 3) return 'city';
  if (regionName.length <= 5) return 'district';
  
  return 'city';
}

// 辅助函数：获取完整路径
function getFullPath(regionName) {
  if (!regionName) return '';
  
  // 这里可以根据实际需求实现更复杂的路径解析
  // 现在简单返回地区名称
  return regionName;
}

// 地区名称标准化
const normalizeRegionName = (regionName) => {
  if (!regionName) return '';
  
  // 移除常见的后缀
  return regionName
    .replace(/市$/, '')
    .replace(/省$/, '')
    .replace(/区$/, '')
    .replace(/县$/, '')
    .trim();
};

// 获取地区建议（基于已有数据）
const getRegionSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 1) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // 获取所有唯一的地区名称
    const regions = await Match.distinct('region');
    
    // 过滤和排序
    const suggestions = regions
      .filter(region => region && region.includes(query))
      .map(region => ({
        id: region,
        name: region,
        type: getRegionType(region),
        fullPath: getFullPath(region)
      }))
      .slice(0, 10);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchRegions,
  getHotRegions,
  getRegionStats,
  getRegionSuggestions,
  normalizeRegionName
};
