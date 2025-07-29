const Event = require('../models/Event');
const User = require('../models/User');
const { getChineseEventType, getEnglishEventType } = require('../utils/eventTypeMapping');

// 模拟赛事数据
const mockEvents = [
  {
    _id: '1',
    name: '温布尔登锦标赛 2024',
    eventType: '男子单打',
    status: 'registration',
    venue: '全英俱乐部',
    region: '伦敦',
    eventDate: '2024-07-01',
    registrationDeadline: '2024-06-15',
    organizer: { 
      name: '温布尔登网球俱乐部',
      id: { nickname: '温布尔登俱乐部', avatar: null }
    },
    coverImage: null,
    description: '世界顶级网球赛事',
    maxParticipants: 128,
    currentParticipants: 64,
    registrationFee: 500,
    participants: [],
    matches: [],
    tags: ['大满贯', '草地'],
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    name: '美国公开赛 2024',
    eventType: '女子单打',
    status: 'upcoming',
    venue: 'USTA比利·简·金',
    region: '纽约',
    eventDate: '2024-08-26',
    registrationDeadline: '2024-08-01',
    organizer: { 
      name: '美国网球协会',
      id: { nickname: '美国网球协会', avatar: null }
    },
    coverImage: null,
    description: '美网公开赛',
    maxParticipants: 128,
    currentParticipants: 32,
    registrationFee: 400,
    participants: [],
    matches: [],
    tags: ['大满贯', '硬地'],
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 获取赛事列表
const getEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      eventType, 
      region,
      search 
    } = req.query;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // MongoDB未连接，使用模拟数据
      console.log('Using mock data for events');
      
      let filteredEvents = mockEvents.filter(event => event.isPublic);
      
      if (status) filteredEvents = filteredEvents.filter(e => e.status === status);
      if (eventType) filteredEvents = filteredEvents.filter(e => e.eventType === eventType);
      if (region) filteredEvents = filteredEvents.filter(e => e.region === region);
      if (search) {
        filteredEvents = filteredEvents.filter(e => 
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedEvents = filteredEvents.slice(skip, skip + parseInt(limit));

      return res.json({
        success: true,
        data: paginatedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredEvents.length,
          pages: Math.ceil(filteredEvents.length / parseInt(limit))
        }
      });
    }

    // MongoDB已连接，使用真实数据
    const query = { isPublic: true };
    
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(query)
      .populate('organizer.id', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    // 转换返回数据，添加英文ID供前端使用
    const transformedEvents = events.map(event => ({
      ...event.toObject(),
      eventTypeId: getEnglishEventType(event.eventType), // 添加英文ID
      eventTypeName: event.eventType // 中文显示名
    }));

    res.json({
      success: true,
      data: transformedEvents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events'
    });
  }
};

// 获取赛事详情
const getEventDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // MongoDB未连接，使用模拟数据
      console.log('Using mock data for event detail');
      
      const event = mockEvents.find(e => e._id === id);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      return res.json({
        success: true,
        data: event
      });
    }

    // MongoDB已连接，使用真实数据
    const event = await Event.findById(id)
      .populate('organizer.id', 'nickname avatar')
      .populate('participants.user', 'nickname avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event detail'
    });
  }
};

// 创建赛事
const createEvent = async (req, res) => {
  try {
    const {
      name,
      eventType,
      venue,
      region,
      eventDate,
      registrationDeadline,
      description,
      maxParticipants,
      registrationFee,
      tags
    } = req.body;

    // 验证必填字段
    if (!name || !eventType || !venue || !region || !eventDate || !registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // 将前端传来的英文ID转换为中文（用于数据库存储）
    const chineseEventType = getChineseEventType(eventType);

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // MongoDB未连接，返回模拟响应
      console.log('Using mock response for create event');
      
      const mockEvent = {
        _id: Date.now().toString(),
        name,
        eventType,
        venue,
        region,
        eventDate: new Date(eventDate),
        registrationDeadline: new Date(registrationDeadline),
        description,
        maxParticipants: maxParticipants || 0,
        registrationFee: registrationFee || 0,
        tags: tags || [],
        organizer: {
          name: req.user?.nickname || '测试用户',
          id: req.user?._id || 'user123'
        },
        status: 'registration',
        currentParticipants: 0,
        participants: [],
        matches: [],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return res.status(201).json({
        success: true,
        data: mockEvent
      });
    }

    // MongoDB已连接，使用真实数据
    const event = new Event({
      name,
      eventType: chineseEventType, // 使用转换后的中文事件类型
      venue,
      region,
      eventDate: new Date(eventDate),
      registrationDeadline: new Date(registrationDeadline),
      description,
      maxParticipants: maxParticipants || 0,
      registrationFee: registrationFee || 0,
      tags: tags || [],
      organizer: {
        name: req.user.nickname,
        id: req.user._id
      }
    });

    await event.save();

    // 转换返回数据，添加英文ID供前端使用
    const responseData = {
      ...event.toObject(),
      eventTypeId: getEnglishEventType(event.eventType), // 添加英文ID
      eventTypeName: event.eventType // 中文显示名
    };

    res.status(201).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Create event error:', error);
    
    // 提供更详细的错误信息
    let message = 'Failed to create event';
    let details = error.message;
    
    if (error.name === 'ValidationError') {
      message = 'Validation failed';
      details = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.code === 11000) {
      message = 'Duplicate entry';
      details = 'Event with this information already exists';
    }
    
    res.status(500).json({
      success: false,
      message,
      details,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 更新赛事
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // 检查权限（只有组织者可以更新）
    if (event.organizer.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // 更新字段
    Object.keys(updateData).forEach(key => {
      if (key === 'eventDate' || key === 'registrationDeadline') {
        event[key] = new Date(updateData[key]);
      } else if (key !== 'organizer' && key !== '_id') {
        event[key] = updateData[key];
      }
    });

    await event.save();

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
};

// 删除赛事
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // 检查权限
    if (event.organizer.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    await Event.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
};

// 报名赛事
const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.canRegister()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for this event'
      });
    }

    // 检查是否已经报名
    const existingParticipant = event.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // 添加参与者
    event.participants.push({
      user: req.user._id,
      paymentStatus: paymentId ? 'paid' : 'pending',
      paymentId
    });

    event.currentParticipants += 1;
    await event.save();

    res.json({
      success: true,
      message: 'Registered successfully',
      data: event
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event'
    });
  }
};

// 取消报名
const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const participantIndex = event.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Not registered for this event'
      });
    }

    event.participants.splice(participantIndex, 1);
    event.currentParticipants -= 1;
    await event.save();

    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration'
    });
  }
};

// 搜索赛事 - 增强版
const searchEvents = async (req, res) => {
  try {
    const { 
      query = '', 
      page = 1, 
      limit = 20,
      status,
      eventType,
      region,
      dateRange,
      sortBy = 'eventDate',
      sortOrder = 'asc'
    } = req.query;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB未连接，使用模拟搜索数据');
      
      let filteredEvents = mockEvents.filter(event => {
        let matches = true;
        
        if (query) {
          matches = matches && (
            event.name.toLowerCase().includes(query.toLowerCase()) ||
            event.description.toLowerCase().includes(query.toLowerCase()) ||
            event.venue.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        if (status) matches = matches && event.status === status;
        if (eventType) matches = matches && event.eventType === eventType;
        if (region) matches = matches && event.region.includes(region);
        
        return matches;
      });
      
      // 排序
      filteredEvents.sort((a, b) => {
        const aVal = a[sortBy] || a.eventDate;
        const bVal = b[sortBy] || b.eventDate;
        return sortOrder === 'desc' ? 
          new Date(bVal) - new Date(aVal) : 
          new Date(aVal) - new Date(bVal);
      });
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedEvents = filteredEvents.slice(skip, skip + parseInt(limit));
      
      return res.json({
        success: true,
        data: {
          events: paginatedEvents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredEvents.length,
            pages: Math.ceil(filteredEvents.length / parseInt(limit))
          }
        }
      });
    }

    // MongoDB已连接，使用真实搜索
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      status,
      eventType: eventType ? getChineseEventType(eventType) : undefined,
      region,
      dateRange: dateRange ? JSON.parse(dateRange) : undefined
    };

    const result = await Event.searchEvents(query, options);
    
    // 转换返回数据
    const transformedEvents = result.events.map(event => ({
      ...event.toObject(),
      eventTypeId: getEnglishEventType(event.eventType),
      eventTypeName: event.eventType
    }));

    res.json({
      success: true,
      data: {
        events: transformedEvents,
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('搜索赛事失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索赛事失败',
      error: error.message
    });
  }
};

// 获取赛事统计
const getEventStats = async (req, res) => {
  try {
    const { organizerId, dateRange } = req.query;
    
    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB未连接，返回模拟统计数据');
      
      const mockStats = {
        total: mockEvents.length,
        byStatus: [
          { _id: 'registration', count: 1 },
          { _id: 'upcoming', count: 1 }
        ],
        byType: [
          { _id: '男子单打', count: 1 },
          { _id: '女子单打', count: 1 }
        ],
        totalParticipants: 96,
        totalRevenue: 38400
      };
      
      return res.json({
        success: true,
        data: mockStats
      });
    }

    const filters = {};
    
    if (organizerId) {
      filters['organizer.id'] = organizerId;
    }
    
    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        if (range.start) filters.eventDate = { $gte: new Date(range.start) };
        if (range.end) {
          filters.eventDate = filters.eventDate || {};
          filters.eventDate.$lte = new Date(range.end);
        }
      } catch (e) {
        console.warn('日期范围解析失败:', dateRange);
      }
    }

    const stats = await Event.getEventStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取赛事统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取赛事统计失败',
      error: error.message
    });
  }
};

// 更新赛事状态
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '缺少状态参数'
      });
    }

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: '数据库不可用'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查权限
    if (event.organizer.id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 更新状态
    await event.updateStatus(status, reason);

    res.json({
      success: true,
      message: '赛事状态更新成功',
      data: {
        id: event._id,
        status: event.status,
        statusReason: event.statusReason,
        statusUpdatedAt: event.statusUpdatedAt
      }
    });
  } catch (error) {
    console.error('更新赛事状态失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新赛事状态失败'
    });
  }
};

// 批量操作赛事
const batchUpdateEvents = async (req, res) => {
  try {
    const { eventIds, action, data } = req.body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的赛事ID列表'
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        message: '请指定操作类型'
      });
    }

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB未连接，返回模拟批量操作结果');
      
      const results = eventIds.map(eventId => ({
        eventId,
        success: Math.random() > 0.1, // 90%成功率
        message: Math.random() > 0.1 ? '操作成功' : '操作失败：模拟错误'
      }));
      
      return res.json({
        success: true,
        message: `批量${action}完成`,
        data: {
          results,
          summary: {
            total: eventIds.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        }
      });
    }

    const results = [];
    const errors = [];

    for (const eventId of eventIds) {
      try {
        const event = await Event.findById(eventId);
        if (!event) {
          errors.push({ eventId, error: '赛事不存在' });
          continue;
        }

        // 检查权限
        if (event.organizer.id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
          errors.push({ eventId, error: '权限不足' });
          continue;
        }

        let result;
        switch (action) {
          case 'updateStatus':
            await event.updateStatus(data.status, data.reason);
            result = { eventId, success: true, message: '状态更新成功' };
            break;

          case 'delete':
            if (event.status !== 'registration') {
              errors.push({ eventId, error: '只能删除报名中的赛事' });
              continue;
            }
            await Event.findByIdAndDelete(eventId);
            result = { eventId, success: true, message: '删除成功' };
            break;

          case 'cancel':
            await event.updateStatus('cancelled', data.reason || '批量取消');
            result = { eventId, success: true, message: '取消成功' };
            break;

          default:
            errors.push({ eventId, error: '不支持的操作类型' });
            continue;
        }

        results.push(result);
      } catch (error) {
        errors.push({ eventId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `批量${action}完成，成功: ${results.length}，失败: ${errors.length}`,
      data: {
        results,
        errors,
        summary: {
          total: eventIds.length,
          success: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    console.error('批量操作赛事失败:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
};

// 获取用户的赛事
const getUserEvents = async (req, res) => {
  try {
    const { 
      type = 'all', // all, organized, participated
      page = 1, 
      limit = 20,
      status 
    } = req.query;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB未连接，返回模拟用户赛事数据');
      
      const userEvents = mockEvents.map(event => ({
        ...event,
        userRole: Math.random() > 0.5 ? 'organizer' : 'participant',
        registrationStatus: 'paid'
      }));
      
      return res.json({
        success: true,
        data: {
          events: userEvents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: userEvents.length,
            pages: Math.ceil(userEvents.length / parseInt(limit))
          }
        }
      });
    }

    const userId = req.user._id;
    const filters = {};
    
    if (status) {
      filters.status = status;
    }

    let query;
    switch (type) {
      case 'organized':
        query = Event.find({ ...filters, 'organizer.id': userId });
        break;
      case 'participated':
        query = Event.find({ ...filters, 'participants.user': userId });
        break;
      default:
        query = Event.find({
          ...filters,
          $or: [
            { 'organizer.id': userId },
            { 'participants.user': userId }
          ]
        });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await query
      .populate('organizer.id', 'nickname avatar')
      .populate('participants.user', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query.getQuery());

    // 添加用户角色信息
    const eventsWithRole = events.map(event => {
      const eventObj = event.toObject();
      const isOrganizer = event.organizer.id.toString() === userId.toString();
      const participant = event.participants.find(p => p.user._id.toString() === userId.toString());
      
      return {
        ...eventObj,
        userRole: isOrganizer ? 'organizer' : 'participant',
        registrationStatus: participant ? participant.paymentStatus : null,
        eventTypeId: getEnglishEventType(event.eventType),
        eventTypeName: event.eventType
      };
    });

    res.json({
      success: true,
      data: {
        events: eventsWithRole,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取用户赛事失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户赛事失败',
      error: error.message
    });
  }
};

// 更新支付状态
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, status, paymentId } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: '数据库不可用'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查权限（只有组织者或管理员可以更新支付状态）
    if (event.organizer.id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 更新支付状态
    await event.updatePaymentStatus(userId, status, paymentId);

    res.json({
      success: true,
      message: '支付状态更新成功',
      data: {
        eventId: event._id,
        userId,
        paymentStatus: status,
        paymentId
      }
    });
  } catch (error) {
    console.error('更新支付状态失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新支付状态失败'
    });
  }
};

// 获取赛事参与者列表
const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, paymentStatus } = req.query;

    // 检查MongoDB连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: '数据库不可用'
      });
    }

    const event = await Event.findById(id)
      .populate('participants.user', 'nickname avatar email phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查权限（只有组织者或管理员可以查看参与者列表）
    if (event.organizer.id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    let participants = event.participants;

    // 按支付状态筛选
    if (paymentStatus) {
      participants = participants.filter(p => p.paymentStatus === paymentStatus);
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedParticipants = participants.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        participants: paginatedParticipants,
        stats: event.getParticipantStats(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: participants.length,
          pages: Math.ceil(participants.length / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取参与者列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取参与者列表失败',
      error: error.message
    });
  }
};

module.exports = {
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
}; 