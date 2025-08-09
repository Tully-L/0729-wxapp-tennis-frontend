/**
 * Authentication composable
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  // Computed properties
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const adminInfo = computed(() => authStore.adminInfo)
  const isAdmin = computed(() => authStore.isAdmin)
  const isSuperAdmin = computed(() => authStore.isSuperAdmin)
  const adminName = computed(() => authStore.adminName)
  const adminEmail = computed(() => authStore.adminEmail)
  const adminRole = computed(() => authStore.adminRole)
  const loading = computed(() => authStore.loading)

  // Methods
  const login = async (credentials) => {
    try {
      const response = await authStore.login(credentials)
      ElMessage.success('Login successful!')
      return response
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed'
      ElMessage.error(errorMessage)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authStore.logout()
      router.push('/login')
      ElMessage.success('Logout successful!')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      router.push('/login')
      ElMessage.warning('Logged out locally')
    }
  }

  const checkPermission = (permission) => {
    return authStore.checkPermission(permission)
  }

  const requireAuth = () => {
    if (!isLoggedIn.value) {
      router.push('/login')
      return false
    }
    return true
  }

  const requireRole = (requiredRole) => {
    if (!isLoggedIn.value) {
      router.push('/login')
      return false
    }

    const roleHierarchy = {
      'user': 1,
      'admin': 2,
      'super_admin': 3
    }

    const userLevel = roleHierarchy[adminRole.value] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    if (userLevel < requiredLevel) {
      ElMessage.error('Insufficient permissions')
      return false
    }

    return true
  }

  const refreshToken = async () => {
    try {
      await authStore.refreshAuthToken()
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
      return false
    }
  }

  const updateProfile = (profileData) => {
    authStore.updateAdminInfo(profileData)
  }

  return {
    // State
    isLoggedIn,
    adminInfo,
    isAdmin,
    isSuperAdmin,
    adminName,
    adminEmail,
    adminRole,
    loading,

    // Methods
    login,
    logout,
    checkPermission,
    requireAuth,
    requireRole,
    refreshToken,
    updateProfile
  }
}