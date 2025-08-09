import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Retry configuration
const MAX_RETRIES = 2
const RETRY_DELAY = 2000 // 2 seconds

// Create axios instance
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://zero729-wxapp-tennis.onrender.com/api',
  timeout: 30000, // Increased timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    // Add auth token to requests
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime
    console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
    
    // Return response data directly
    return response.data
  },
  async (error) => {
    const authStore = useAuthStore()
    const { response, config } = error
    
    // Calculate request duration
    const duration = config?.metadata ? new Date() - config.metadata.startTime : 0
    console.error(`API Error: ${config?.method?.toUpperCase()} ${config?.url} - ${duration}ms`, error)
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          if (data?.error?.code === 'TOKEN_EXPIRED' && authStore.refreshToken) {
            try {
              // Try to refresh token
              await authStore.refreshAuthToken()
              
              // Retry original request with new token
              config.headers.Authorization = `Bearer ${authStore.token}`
              return request(config)
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError)
              // Redirect to login
              await authStore.logout()
              router.push('/login')
              ElMessage.error('Session expired. Please login again.')
            }
          } else {
            // Invalid credentials or other auth error
            if (router.currentRoute.value.path !== '/login') {
              await authStore.logout()
              router.push('/login')
              ElMessage.error(data?.error?.message || 'Authentication failed')
            }
          }
          break
          
        case 403:
          // Forbidden - insufficient permissions
          ElMessage.error(data?.error?.message || 'Access denied. Insufficient permissions.')
          break
          
        case 404:
          // Not found
          ElMessage.error(data?.error?.message || 'Resource not found')
          break
          
        case 422:
          // Validation error
          if (data?.error?.details && Array.isArray(data.error.details)) {
            // Show validation errors
            const errorMessages = data.error.details.join('\n')
            ElMessage.error(errorMessages)
          } else {
            ElMessage.error(data?.error?.message || 'Validation failed')
          }
          break
          
        case 429:
          // Rate limit exceeded
          const retryAfter = data?.error?.retryAfter || 'a few minutes'
          ElMessage.warning(`Too many requests. Please try again in ${retryAfter}.`)
          break
          
        case 500:
          // Server error
          ElMessage.error(data?.error?.message || 'Server error occurred')
          break
          
        default:
          // Other errors
          ElMessage.error(data?.error?.message || `Request failed with status ${status}`)
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error - could be due to cold start
      const retryCount = config.__retryCount || 0
      
      if (retryCount < MAX_RETRIES) {
        config.__retryCount = retryCount + 1
        
        // Show different messages based on retry attempt
        if (retryCount === 0) {
          ElMessage.warning('Server is starting up, retrying...')
        } else {
          ElMessage.warning(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}...`)
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        
        // Retry the request
        return request(config)
      } else {
        // Max retries reached
        if (config.url?.includes('/auth/admin/login')) {
          ElMessage.error('Server is taking longer than expected to start. Please try again in a few minutes.')
        } else {
          ElMessage.error('Request timeout after multiple attempts. Please check your connection and try again.')
        }
      }
    } else if (error.message === 'Network Error') {
      // Network error
      ElMessage.error('Network error. Please check your connection.')
    } else {
      // Other errors
      ElMessage.error(error.message || 'An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)

// Request helpers
export const get = (url, params = {}) => {
  return request({
    method: 'GET',
    url,
    params
  })
}

export const post = (url, data = {}) => {
  return request({
    method: 'POST',
    url,
    data
  })
}

export const put = (url, data = {}) => {
  return request({
    method: 'PUT',
    url,
    data
  })
}

export const del = (url, data = {}) => {
  return request({
    method: 'DELETE',
    url,
    data
  })
}

// Confirm dialog helper for destructive actions
export const confirmAction = (message, title = 'Confirm Action', type = 'warning') => {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    type
  })
}

export default request