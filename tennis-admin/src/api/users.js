import { get, post, put, del } from './request'

/**
 * User management API
 */

// Get user list with pagination and filters
export const getUserList = (params = {}) => {
  return get('/admin/users', params)
}

// Get user details by ID
export const getUserDetail = (id) => {
  return get(`/admin/users/${id}`)
}

// Create new user
export const createUser = (userData) => {
  return post('/admin/users', userData)
}

// Update user information
export const updateUser = (id, userData) => {
  return put(`/admin/users/${id}`, userData)
}

// Delete user
export const deleteUser = (id) => {
  return del(`/admin/users/${id}`)
}

// Update user status (active/banned)
export const updateUserStatus = (id, status) => {
  return put(`/admin/users/${id}/status`, { status })
}

// Reset user password
export const resetUserPassword = (id, newPassword) => {
  return put(`/admin/users/${id}/password`, { password: newPassword })
}

// Get user statistics
export const getUserStats = (params = {}) => {
  return get('/admin/stats/users', params)
}

// Export users data
export const exportUsers = (params = {}) => {
  return get('/admin/users/export', params)
}

// Batch operations
export const batchUpdateUsers = (userIds, updates) => {
  return put('/admin/users/batch', { userIds, updates })
}

export const batchDeleteUsers = (userIds) => {
  return del('/admin/users/batch', { userIds })
}