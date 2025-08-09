import { get } from './request'

/**
 * Statistics API
 */

// Get overview statistics
export const getOverviewStats = () => {
  return get('/admin/stats/overview')
}

// Get user statistics
export const getUserStats = (params = {}) => {
  return get('/admin/stats/users', params)
}

// Get event statistics
export const getEventStats = (params = {}) => {
  return get('/admin/stats/events', params)
}

// Get dashboard data
export const getDashboardData = (params = {}) => {
  return get('/admin/stats/dashboard', params)
}

// Get recent activity
export const getRecentActivity = (params = {}) => {
  return get('/admin/stats/activity', params)
}

// Get system health
export const getSystemHealth = () => {
  return get('/admin/stats/health')
}