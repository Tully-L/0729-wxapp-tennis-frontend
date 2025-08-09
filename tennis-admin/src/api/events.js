import { get, post, put, del } from './request'

/**
 * Event management API
 */

// Get event list with pagination and filters
export const getEventList = (params = {}) => {
  return get('/admin/events', params)
}

// Get event details by ID
export const getEventDetail = (id) => {
  return get(`/admin/events/${id}`)
}

// Create new event
export const createEvent = (eventData) => {
  return post('/admin/events', eventData)
}

// Update event information
export const updateEvent = (id, eventData) => {
  return put(`/admin/events/${id}`, eventData)
}

// Delete event
export const deleteEvent = (id) => {
  return del(`/admin/events/${id}`)
}

// Get event participants
export const getEventParticipants = (id, params = {}) => {
  return get(`/admin/events/${id}/participants`, params)
}

// Update event status
export const updateEventStatus = (id, status) => {
  return put(`/admin/events/${id}/status`, { status })
}

// Duplicate event
export const duplicateEvent = (id, eventData = {}) => {
  return post(`/admin/events/${id}/duplicate`, eventData)
}

// Get event statistics
export const getEventStats = (params = {}) => {
  return get('/admin/stats/events', params)
}

// Export events data
export const exportEvents = (params = {}) => {
  return get('/admin/events/export', params)
}

// Batch operations
export const batchUpdateEvents = (eventIds, updates) => {
  return put('/admin/events/batch', { eventIds, updates })
}

export const batchDeleteEvents = (eventIds) => {
  return del('/admin/events/batch', { eventIds })
}