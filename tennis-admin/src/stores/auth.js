import { defineStore } from 'pinia'
import { adminLogin, adminLogout, verifyToken, refreshToken } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('admin_token'),
    refreshToken: localStorage.getItem('admin_refresh_token'),
    adminInfo: JSON.parse(localStorage.getItem('admin_info') || 'null'),
    isLoggedIn: false,
    permissions: [],
    loading: false
  }),
  
  getters: {
    isAdmin: (state) => state.adminInfo?.role === 'admin' || state.adminInfo?.role === 'super_admin',
    isSuperAdmin: (state) => state.adminInfo?.role === 'super_admin',
    adminName: (state) => state.adminInfo?.nickname || state.adminInfo?.email || 'Admin',
    adminEmail: (state) => state.adminInfo?.email || '',
    adminRole: (state) => state.adminInfo?.role || 'user'
  },
  
  actions: {
    async login(credentials) {
      this.loading = true
      try {
        const response = await adminLogin(credentials)
        
        if (response.success) {
          const { admin, tokens } = response.data
          
          // Store tokens and admin info
          this.token = tokens.accessToken
          this.refreshToken = tokens.refreshToken
          this.adminInfo = admin
          this.isLoggedIn = true
          
          // Persist to localStorage
          localStorage.setItem('admin_token', tokens.accessToken)
          localStorage.setItem('admin_refresh_token', tokens.refreshToken)
          localStorage.setItem('admin_info', JSON.stringify(admin))
          
          return response
        } else {
          throw new Error(response.error?.message || 'Login failed')
        }
      } catch (error) {
        console.error('Login error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      this.loading = true
      try {
        // Call logout API
        if (this.token) {
          await adminLogout()
        }
      } catch (error) {
        console.error('Logout API error:', error)
        // Continue with local logout even if API fails
      } finally {
        // Clear local state
        this.token = null
        this.refreshToken = null
        this.adminInfo = null
        this.isLoggedIn = false
        this.permissions = []
        
        // Clear localStorage
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('admin_info')
        
        this.loading = false
      }
    },
    
    async verifyToken() {
      if (!this.token) {
        throw new Error('No token available')
      }
      
      try {
        const response = await verifyToken()
        
        if (response.success) {
          this.adminInfo = response.data.admin
          this.isLoggedIn = true
          
          // Update localStorage
          localStorage.setItem('admin_info', JSON.stringify(response.data.admin))
          
          return response
        } else {
          throw new Error('Token verification failed')
        }
      } catch (error) {
        console.error('Token verification error:', error)
        // Clear invalid token
        await this.logout()
        throw error
      }
    },
    
    async refreshAuthToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }
      
      try {
        const response = await refreshToken(this.refreshToken)
        
        if (response.success) {
          const { accessToken } = response.data
          
          // Update tokens and keep existing admin info
          this.token = accessToken
          this.isLoggedIn = true
          
          // Update localStorage
          localStorage.setItem('admin_token', accessToken)
          
          return response
        } else {
          throw new Error('Token refresh failed')
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        // Clear invalid tokens
        await this.logout()
        throw error
      }
    },
    
    checkPermission(permission) {
      if (this.isSuperAdmin) {
        return true // Super admin has all permissions
      }
      
      return this.permissions.includes(permission)
    },
    
    updateAdminInfo(adminInfo) {
      this.adminInfo = { ...this.adminInfo, ...adminInfo }
      localStorage.setItem('admin_info', JSON.stringify(this.adminInfo))
    },
    
    // Initialize auth state from localStorage
    initializeAuth() {
      const token = localStorage.getItem('admin_token')
      const refreshToken = localStorage.getItem('admin_refresh_token')
      const adminInfo = localStorage.getItem('admin_info')
      
      if (token && adminInfo) {
        this.token = token
        this.refreshToken = refreshToken
        this.adminInfo = JSON.parse(adminInfo)
        this.isLoggedIn = true
        
        // Verify token validity
        this.verifyToken().catch(() => {
          // Token is invalid, will be cleared by verifyToken
        })
      }
    }
  }
})