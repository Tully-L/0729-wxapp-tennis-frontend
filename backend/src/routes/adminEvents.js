const express = require('express');
const Event = require('../models/Event');
const { adminAuth, auditLog } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route   GET /api/admin/events
 * @desc    Get paginated list of events with filtering
 * @access  Private (Admin)
 */
router.get('/', adminAuth, auditLog('view_events'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      category = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Build query
    const query = { is_deleted: false };

    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with pagination
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query)
    ]);

    // Add participant counts for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        try {
          const participantCount = await event.getCurrentParticipantCount?.() || 0;
          return {
            ...event,
            participantCount,
            registrationRate: event.max_participants 
              ? Math.round((participantCount / event.max_participants) * 100)
              : null
          };
        } catch (error) {
          return {
            ...event,
            participantCount: 0,
            registrationRate: null
          };
        }
      })
    );

    res.json({
      success: true,
      message: 'Events retrieved successfully',
      data: eventsWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EVENTS_ERROR',
        message: 'Failed to retrieve events.'
      }
    });
  }
});

/**
 * @route   GET /api/admin/events/:id
 * @desc    Get detailed event information
 * @access  Private (Admin)
 */
router.get('/:id', adminAuth, auditLog('view_event_detail'), async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found.'
        }
      });
    }

    // Get event statistics
    let eventStats = {};
    try {
      eventStats = await event.getEventStats();
    } catch (error) {
      console.log('Event stats not available:', error.message);
      eventStats = {
        participantCount: 0,
        registrationRate: '0%'
      };
    }

    res.json({
      success: true,
      message: 'Event details retrieved successfully',
      data: {
        event: event.toObject(),
        statistics: eventStats
      }
    });

  } catch (error) {
    console.error('Get event detail error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EVENT_ERROR',
        message: 'Failed to retrieve event details.'
      }
    });
  }
});

/**
 * @route   POST /api/admin/events
 * @desc    Create new event
 * @access  Private (Admin)
 */
router.post('/', adminAuth, auditLog('create_event'), async (req, res) => {
  try {
    const {
      title,
      category,
      start_time,
      end_time,
      location,
      description,
      max_participants,
      status = 'draft',
      ext_info = {}
    } = req.body;

    // Validate required fields
    if (!title || !category || !start_time || !end_time || !location) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Title, category, start time, end time, and location are required.'
        }
      });
    }

    // Validate dates
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Invalid date format for start_time or end_time.'
        }
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'End time must be after start time.'
        }
      });
    }

    // Create event
    const event = new Event({
      title: title.trim(),
      category,
      start_time: startDate,
      end_time: endDate,
      location: location.trim(),
      description: description?.trim(),
      max_participants: max_participants ? Math.max(0, parseInt(max_participants)) : null,
      status,
      ext_info: {
        ...ext_info,
        createdBy: req.user._id,
        createdByEmail: req.user.email
      }
    });

    await event.save();

    console.log(`📅 Event created by ${req.user.email}:`, {
      eventId: event._id,
      title: event.title,
      category: event.category
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: event.toObject()
      }
    });

  } catch (error) {
    console.error('Create event error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event data.',
          details: Object.values(error.errors).map(err => err.message)
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_EVENT_ERROR',
        message: 'Failed to create event.'
      }
    });
  }
});

/**
 * @route   PUT /api/admin/events/:id
 * @desc    Update event information
 * @access  Private (Admin)
 */
router.put('/:id', adminAuth, auditLog('update_event'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      start_time,
      end_time,
      location,
      description,
      max_participants,
      status,
      ext_info
    } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found.'
        }
      });
    }

    // Store original values for audit
    const originalValues = {
      title: event.title,
      category: event.category,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      status: event.status,
      max_participants: event.max_participants
    };

    // Validate status transitions if status is being changed
    if (status && status !== event.status) {
      try {
        // This will throw an error if transition is invalid
        await event.updateStatus(status, `Updated by admin: ${req.user.email}`);
      } catch (statusError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: statusError.message
          }
        });
      }
    }

    // Validate dates if they're being changed
    if (start_time || end_time) {
      const newStartTime = start_time ? new Date(start_time) : event.start_time;
      const newEndTime = end_time ? new Date(end_time) : event.end_time;

      if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: 'Invalid date format.'
          }
        });
      }

      if (newEndTime <= newStartTime) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'End time must be after start time.'
          }
        });
      }

      event.start_time = newStartTime;
      event.end_time = newEndTime;
    }

    // Update other fields
    if (title !== undefined) event.title = title.trim();
    if (category !== undefined) event.category = category;
    if (location !== undefined) event.location = location.trim();
    if (description !== undefined) event.description = description?.trim();
    if (max_participants !== undefined) {
      event.max_participants = max_participants ? Math.max(0, parseInt(max_participants)) : null;
    }
    if (ext_info !== undefined) {
      event.ext_info = {
        ...event.ext_info,
        ...ext_info,
        lastModifiedBy: req.user._id,
        lastModifiedByEmail: req.user.email,
        lastModifiedAt: new Date()
      };
    }

    await event.save();

    // Log the changes
    const changes = {};
    Object.keys(originalValues).forEach(key => {
      if (JSON.stringify(originalValues[key]) !== JSON.stringify(event[key])) {
        changes[key] = {
          from: originalValues[key],
          to: event[key]
        };
      }
    });

    console.log(`📅 Event updated by ${req.user.email}:`, {
      eventId: id,
      changes: changes
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event: event.toObject(),
        changes: changes
      }
    });

  } catch (error) {
    console.error('Update event error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event data.',
          details: Object.values(error.errors).map(err => err.message)
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_EVENT_ERROR',
        message: 'Failed to update event.'
      }
    });
  }
});

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Delete event (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', adminAuth, auditLog('delete_event'), async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found.'
        }
      });
    }

    // Check if event has active participants
    let participantCount = 0;
    try {
      participantCount = await event.getCurrentParticipantCount();
    } catch (error) {
      console.log('Could not get participant count:', error.message);
    }

    if (participantCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_HAS_PARTICIPANTS',
          message: `Cannot delete event with ${participantCount} active participants. Cancel the event instead.`,
          participantCount: participantCount
        }
      });
    }

    // Perform soft delete
    await event.softDelete();

    console.log(`🗑️ Event deleted by ${req.user.email}:`, {
      eventId: id,
      title: event.title,
      category: event.category
    });

    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: {
        deletedEvent: {
          id: event._id,
          title: event.title,
          category: event.category
        }
      }
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_EVENT_ERROR',
        message: 'Failed to delete event.'
      }
    });
  }
});

/**
 * @route   GET /api/admin/events/:id/participants
 * @desc    Get event participants
 * @access  Private (Admin)
 */
router.get('/:id/participants', adminAuth, auditLog('view_event_participants'), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found.'
        }
      });
    }

    // This would require UserEventRelation model which might not exist yet
    // For now, return mock data structure
    const participants = [];
    const registrationStats = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    };

    res.json({
      success: true,
      message: 'Event participants retrieved successfully',
      data: {
        event: {
          id: event._id,
          title: event.title,
          max_participants: event.max_participants
        },
        participants: participants,
        statistics: registrationStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: participants.length,
          pages: Math.ceil(participants.length / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get event participants error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PARTICIPANTS_ERROR',
        message: 'Failed to retrieve event participants.'
      }
    });
  }
});

/**
 * @route   PUT /api/admin/events/:id/status
 * @desc    Update event status with validation
 * @access  Private (Admin)
 */
router.put('/:id/status', adminAuth, auditLog('update_event_status'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_STATUS',
          message: 'Status is required.'
        }
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found.'
        }
      });
    }

    const oldStatus = event.status;

    try {
      await event.updateStatus(status, reason || `Status updated by admin: ${req.user.email}`);
    } catch (statusError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: statusError.message
        }
      });
    }

    console.log(`🔄 Event status changed by ${req.user.email}:`, {
      eventId: id,
      title: event.title,
      from: oldStatus,
      to: status,
      reason: reason
    });

    res.json({
      success: true,
      message: `Event status updated to ${status}`,
      data: {
        event: {
          id: event._id,
          title: event.title,
          status: event.status
        },
        statusChange: {
          from: oldStatus,
          to: status,
          reason: reason
        }
      }
    });

  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STATUS_ERROR',
        message: 'Failed to update event status.'
      }
    });
  }
});

module.exports = router;