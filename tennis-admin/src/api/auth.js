import { post, get } from './request'

/**
 * Admin authentication API
 */

// Admin login
export const adminLogin = (credentials) => {
  return post('/auth/admin/login', credentials)
}

// Admin logout
export const adminLogout = () => {
  return post('/auth/admin/logout')
}

// Refresh token
export const refreshToken = (refreshToken) => {
  return post('/auth/admin/refresh', { refreshToken })
}

// Verify token
export const verifyToken = () => {
  return get('/auth/admin/verify')
}

// Get admin profile
export const getAdminProfile = () => {
  return get('/auth/admin/profile')
}

// Change password
export const changePassword = (passwordData) => {
  return post('/auth/admin/change-password', passwordData)
}