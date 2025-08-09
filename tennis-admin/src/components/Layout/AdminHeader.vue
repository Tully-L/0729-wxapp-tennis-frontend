<template>
  <div class="admin-header">
    <div class="header-left">
      <div class="logo">
        <el-icon class="logo-icon"><TrophyBase /></el-icon>
        <span class="logo-text">网球管理系统</span>
      </div>
    </div>
    
    <div class="header-right">
      <!-- Notifications -->
      <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="header-item">
        <el-button text @click="showNotifications">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>
      
      <!-- User Profile Dropdown -->
      <el-dropdown @command="handleCommand" class="header-item">
        <div class="user-profile">
          <el-avatar :size="32" :src="adminInfo?.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="username">{{ adminName }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const notificationCount = ref(0)

const adminInfo = computed(() => authStore.adminInfo)
const adminName = computed(() => authStore.adminName)

const showNotifications = () => {
  ElMessage.info('通知功能即将推出！')
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料页面即将推出！')
      break
    case 'settings':
      ElMessage.info('设置页面即将推出！')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '确认退出',
          {
            confirmButtonText: '退出',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await authStore.logout()
        router.push('/login')
        ElMessage.success('退出登录成功')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Logout error:', error)
          ElMessage.error('退出登录失败')
        }
      }
      break
  }
}
</script>

<style scoped>
.admin-header {
  height: 60px;
  background: var(--bg-color-light);
  border-bottom: 1px solid var(--border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: var(--box-shadow-light);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
}

.logo-icon {
  font-size: 28px;
  margin-right: 8px;
}

.logo-text {
  font-family: 'Arial', sans-serif;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-item {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.user-profile:hover {
  background-color: var(--bg-color);
}

.username {
  font-size: 14px;
  color: var(--text-color);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: var(--text-color-lighter);
  transition: transform 0.3s ease;
}

.user-profile:hover .dropdown-icon {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .admin-header {
    padding: 0 16px;
  }
  
  .logo-text {
    display: none;
  }
  
  .username {
    display: none;
  }
}
</style>