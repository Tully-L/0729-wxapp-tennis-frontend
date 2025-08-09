/**
 * Application constants
 */

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user'
}

// User status
export const USER_STATUS = {
  ACTIVE: 'active',
  BANNED: 'banned',
  PENDING: 'pending'
}

// Event status
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  ENDED: 'ended',
  CANCELED: 'canceled'
}

// Event categories
export const EVENT_CATEGORIES = {
  TOURNAMENT: 'tournament',
  TRAINING: 'training',
  SOCIAL: 'social',
  COMPETITION: 'competition'
}

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  ADMIN_LOGIN: '/auth/admin/login',
  ADMIN_LOGOUT: '/auth/admin/logout',
  ADMIN_REFRESH: '/auth/admin/refresh',
  ADMIN_VERIFY: '/auth/admin/verify',
  ADMIN_PROFILE: '/auth/admin/profile',
  CHANGE_PASSWORD: '/auth/admin/change-password',
  
  // Users
  USERS_LIST: '/admin/users',
  USER_DETAIL: '/admin/users/:id',
  USER_UPDATE: '/admin/users/:id',
  USER_DELETE: '/admin/users/:id',
  USER_STATUS: '/admin/users/:id/status',
  
  // Events
  EVENTS_LIST: '/admin/events',
  EVENT_CREATE: '/admin/events',
  EVENT_DETAIL: '/admin/events/:id',
  EVENT_UPDATE: '/admin/events/:id',
  EVENT_DELETE: '/admin/events/:id',
  EVENT_PARTICIPANTS: '/admin/events/:id/participants',
  
  // Statistics
  STATS_OVERVIEW: '/admin/stats/overview',
  STATS_USERS: '/admin/stats/users',
  STATS_EVENTS: '/admin/stats/events'
}

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
}

// Date formats
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_DATETIME: 'MMM DD, YYYY HH:mm'
}

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
}

// Form validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 50
}

// Local storage keys
export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'admin_token',
  ADMIN_REFRESH_TOKEN: 'admin_refresh_token',
  ADMIN_INFO: 'admin_info',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  THEME: 'theme',
  LANGUAGE: 'language'
}

// Theme colors
export const THEME_COLORS = {
  PRIMARY: '#0A4A39',
  PRIMARY_LIGHT: '#1a5a49',
  PRIMARY_DARK: '#003329',
  SUCCESS: '#67c23a',
  WARNING: '#e6a23c',
  DANGER: '#f56c6c',
  INFO: '#909399'
}

// Chart colors
export const CHART_COLORS = [
  '#0A4A39',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#1a5a49',
  '#85ce61',
  '#ebb563',
  '#f78989',
  '#a6a9ad'
]

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED'
}

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  SAVE_SUCCESS: 'Saved successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
  CREATE_SUCCESS: 'Created successfully!'
}

// Error messages
export const ERROR_MESSAGES = {
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
}

// Menu items
export const MENU_ITEMS = [
  {
    key: 'dashboard',
    path: '/dashboard',
    title: 'Dashboard',
    icon: 'DataAnalysis',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
  },
  {
    key: 'users',
    path: '/users',
    title: 'User Management',
    icon: 'User',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
  },
  {
    key: 'events',
    path: '/events',
    title: 'Event Management',
    icon: 'Calendar',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
  },
  {
    key: 'statistics',
    title: 'Statistics',
    icon: 'PieChart',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    children: [
      {
        key: 'stats-users',
        path: '/stats/users',
        title: 'User Stats',
        icon: 'UserFilled'
      },
      {
        key: 'stats-events',
        path: '/stats/events',
        title: 'Event Stats',
        icon: 'TrendCharts'
      }
    ]
  },
  {
    key: 'system',
    title: 'System',
    icon: 'Setting',
    roles: [USER_ROLES.SUPER_ADMIN],
    children: [
      {
        key: 'system-settings',
        path: '/system/settings',
        title: 'Settings',
        icon: 'Tools'
      },
      {
        key: 'system-logs',
        path: '/system/logs',
        title: 'Audit Logs',
        icon: 'Document'
      }
    ]
  }
]

// Table column widths
export const TABLE_COLUMNS = {
  SELECTION: 55,
  AVATAR: 80,
  STATUS: 100,
  ROLE: 100,
  DATE: 120,
  ACTIONS: 200
}

// Export/Import formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  JSON: 'json',
  PDF: 'pdf'
}

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
}

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}

// Responsive breakpoints
export const BREAKPOINTS = {
  XS: 480,
  SM: 768,
  MD: 992,
  LG: 1200,
  XL: 1920
}

// Animation durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
}

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  MODAL: 2000,
  NOTIFICATION: 3000,
  TOOLTIP: 4000
}