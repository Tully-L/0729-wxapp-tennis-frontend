const Event = require('../models/Event');
const User = require('../models/User');
const UserEventRelation = require('../models/UserEventRelation');
const PointsRecord = require('../models/PointsRecord');
const { BusinessError } = require('../middleware/errorHandler');

// 数据格式适配函数 - 确保返回的数据格式与前端期望完全一致
const formatEventForFrontend = (event, participantCount = 0, isRegistered = false) => {
  const eventObj = event.toObject ? event.toObject() : event;

  return {
    _id: eventObj._id,
    // 兼容新旧字段名
    title: eventObj.title,
    name: eventObj.title, // 兼容旧版本前端
    category: eventObj.category,
    eventType: eventObj.ext_info?.eventType || eventObj.category, // 兼容前端显示
    status: eventObj.status,
    location: eventObj.location,
    venue: eventObj.location, // 兼容旧版本
    region: eventObj.ext_info?.region || '', // 兼容前端显示
    start_time: eventObj.start_time,
    end_time: eventObj.end_time,
    eventDate: eventObj.start_time ? eventObj.start_time.toISOString().split('T')[0] : null, // 兼容前端日期显示
    max_participants: eventObj.max_participants,
    maxParticipants: eventObj.max_participants, // 兼容旧版本
    currentParticipants: participantCount,
    current_participants: participantCount, // 兼容后端返回
    description: eventObj.description,
    ext_info: eventObj.ext_info || {},
    organizer: eventObj.ext_info?.organizer || { name: 'Tennis Heat' },
    registrationFee: eventObj.ext_info?.registrationFee || 0,
    registrationDeadline: eventObj.ext_info?.registrationDeadline || null,
    surface: eventObj.ext_info?.surface || null,
    prizePool: eventObj.ext_info?.prizePool || null,
    isRegistered: isRegistered,
    can_register: eventObj.can_register !== undefined ? eventObj.can_register : true,
    created_at: eventObj.created_at,
    updated_at: eventObj.updated_at,
    created_by: eventObj.created_by
  };
};

// 获取赛事列表
const getEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件
    const query = { is_deleted: false };

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.start_time = {};
      if (startDate) query.start_time.$gte = new Date(startDate);
      if (endDate) query.start_time.$lte = new Date(endDate);
    }

    const events = await Event.find(query)
      .sort({ start_time: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('title category start_time end_time location status max_participants description ext_info created_at');

    const total = await Event.countDocuments(query);

    // 获取当前用户ID（如果已登录）
    const currentUserId = req.user?.id;

    // 获取每个赛事的参与者数量和用户报名状态
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const participantCount = await UserEventRelation.countDocuments({
          event_id: event._id,
          signup_status: 'approved',
          is_deleted: false
        });

        let isRegistered = false;
        if (currentUserId) {
          const registration = await UserEventRelation.findOne({
            user_id: currentUserId,
            event_id: event._id,
            is_deleted: false
          });
          isRegistered = !!registration;
        }

        // 使用格式化函数确保数据格式与前端期望一致
        return formatEventForFrontend(event, participantCount, isRegistered);
      })
    );

    res.json({
      success: true,
      data: {
        events: eventsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          status,
          category,
          search,
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取赛事详情
const getEventDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event || event.is_deleted) {
      throw new BusinessError('赛事不存在', 'EVENT_NOT_FOUND');
    }

    // 获取赛事统计信息
    const stats = await event.getEventStats();

    // 获取参与者列表（仅显示已批准的）
    const participants = await UserEventRelation.find({
      event_id: event._id,
      signup_status: 'approved',
      is_deleted: false
    })
    .populate('user_id', 'nickname avatar total_points')
    .sort({ signup_time: 1 })
    .limit(50); // 限制显示数量

    // 检查当前用户是否已报名
    const currentUserId = req.user?.id;
    let isRegistered = false;
    if (currentUserId) {
      const registration = await UserEventRelation.findOne({
        user_id: currentUserId,
        event_id: event._id,
        is_deleted: false
      });
      isRegistered = !!registration;
    }

    // 使用格式化函数确保数据格式与前端期望一致
    const formattedEvent = formatEventForFrontend(event, participants.length, isRegistered);

    res.json({
      success: true,
      data: {
        ...formattedEvent,
        stats,
        participants: participants.map(p => ({
          user: p.user_id,
          signup_time: p.signup_time,
          is_signin: p.is_signin,
          points: p.points,
          rank: p.rank
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// 创建赛事
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      category,
      start_time,
      end_time,
      location,
      description,
      max_participants,
      ext_info
    } = req.body;

    // 验证必需字段
    if (!title || !category || !start_time || !location) {
      throw new BusinessError('标题、分类、开始时间和地点为必填项', 'MISSING_REQUIRED_FIELDS');
    }

    // 验证时间
    const startTime = new Date(start_time);
    const endTime = end_time ? new Date(end_time) : new Date(startTime.getTime() + 4 * 60 * 60 * 1000);

    if (startTime <= new Date()) {
      throw new BusinessError('开始时间必须晚于当前时间', 'INVALID_START_TIME');
    }

    if (endTime <= startTime) {
      throw new BusinessError('结束时间必须晚于开始时间', 'INVALID_END_TIME');
    }

    const event = new Event({
      title: title.trim(),
      category,
      start_time: startTime,
      end_time: endTime,
      location: location.trim(),
      description: description?.trim(),
      max_participants: max_participants > 0 ? max_participants : null,
      status: 'draft',
      ext_info: ext_info || {},
      is_deleted: false
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: '赛事创建成功',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// 报名参加赛事
const registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);

    if (!event || event.is_deleted) {
      throw new BusinessError('赛事不存在', 'EVENT_NOT_FOUND');
    }

    if (!event.canRegister()) {
      throw new BusinessError('赛事不可报名', 'REGISTRATION_NOT_AVAILABLE');
    }

    // 检查是否已经报名
    const existingRelation = await UserEventRelation.findOne({
      user_id: userId,
      event_id: event._id,
      is_deleted: false
    });

    if (existingRelation) {
      throw new BusinessError('您已经报名了此赛事', 'ALREADY_REGISTERED');
    }

    // 检查是否达到最大参与人数
    if (event.max_participants) {
      const currentCount = await UserEventRelation.countDocuments({
        event_id: event._id,
        signup_status: 'approved',
        is_deleted: false
      });

      if (currentCount >= event.max_participants) {
        throw new BusinessError('赛事报名人数已满', 'EVENT_FULL');
      }
    }

    // 创建用户-赛事关联记录
    const relation = new UserEventRelation({
      user_id: userId,
      event_id: event._id,
      signup_time: new Date(),
      signup_status: 'pending', // 默认待审核
      points: 0,
      points_type: [],
      is_signin: false,
      is_deleted: false
    });

    await relation.save();

    res.status(201).json({
      success: true,
      message: '报名成功，等待审核',
      data: {
        relation_id: relation._id,
        signup_status: relation.signup_status,
        signup_time: relation.signup_time
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新赛事状态
const updateEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const event = await Event.findById(id);

    if (!event || event.is_deleted) {
      throw new BusinessError('赛事不存在', 'EVENT_NOT_FOUND');
    }

    // 验证状态转换
    const validTransitions = {
      'draft': ['published', 'canceled'],
      'published': ['ongoing', 'canceled'],
      'ongoing': ['ended'],
      'ended': [],
      'canceled': []
    };

    if (!validTransitions[event.status].includes(status)) {
      throw new BusinessError(`无法从${event.status}状态转换到${status}状态`, 'INVALID_STATUS_TRANSITION');
    }

    await event.updateStatus(status);

    res.json({
      success: true,
      message: '赛事状态更新成功',
      data: {
        id: event._id,
        status: event.status,
        updated_at: event.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// 签到赛事
const checkinEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);

    if (!event || event.is_deleted) {
      throw new BusinessError('赛事不存在', 'EVENT_NOT_FOUND');
    }

    if (event.status !== 'ongoing') {
      throw new BusinessError('赛事未开始，无法签到', 'EVENT_NOT_ONGOING');
    }

    const relation = await UserEventRelation.findOne({
      user_id: userId,
      event_id: event._id,
      signup_status: 'approved',
      is_deleted: false
    });

    if (!relation) {
      throw new BusinessError('您未报名此赛事或报名未通过审核', 'NOT_REGISTERED');
    }

    if (relation.is_signin) {
      throw new BusinessError('您已经签到过了', 'ALREADY_CHECKED_IN');
    }

    // 执行签到
    await relation.signIn('manual');

    // 给予签到积分
    await PointsRecord.createRecord(
      userId,
      event._id,
      relation._id,
      5, // 签到基础积分
      '赛事签到'
    );

    res.json({
      success: true,
      message: '签到成功',
      data: {
        signin_time: relation.signin_time,
        points_earned: 5
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取赛事参与者列表
const getEventParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const event = await Event.findById(id);

    if (!event || event.is_deleted) {
      throw new BusinessError('赛事不存在', 'EVENT_NOT_FOUND');
    }

    const query = {
      event_id: event._id,
      is_deleted: false
    };

    if (status) {
      query.signup_status = status;
    }

    const participants = await UserEventRelation.find(query)
      .populate('user_id', 'nickname avatar total_points')
      .sort({ signup_time: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await UserEventRelation.countDocuments(query);

    res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          status: event.status
        },
        participants: participants.map(p => ({
          relation_id: p._id,
          user: p.user_id,
          signup_status: p.signup_status,
          signup_time: p.signup_time,
          is_signin: p.is_signin,
          signin_time: p.signin_time,
          points: p.points,
          rank: p.rank
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
// 获取赛事统计
const getEventStats = async (req, res, next) => {
  try {
    const Event = require('../models/Event');

    // 获取总体统计
    const totalEvents = await Event.countDocuments({ is_deleted: false });
    const registrationEvents = await Event.countDocuments({
      status: 'published',
      is_deleted: false
    });
    const upcomingEvents = await Event.countDocuments({
      status: 'upcoming',
      is_deleted: false
    });
    const completedEvents = await Event.countDocuments({
      status: 'completed',
      is_deleted: false
    });

    res.json({
      success: true,
      data: {
        total: totalEvents,
        registration: registrationEvents,
        upcoming: upcomingEvents,
        completed: completedEvents
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventDetail,
  createEvent,
  registerForEvent,
  updateEventStatus,
  checkinEvent,
  getEventParticipants,
  getEventStats
};