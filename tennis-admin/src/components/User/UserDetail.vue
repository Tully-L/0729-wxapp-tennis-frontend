<template>
  <el-dialog
    v-model="visible"
    :title="`User Details - ${user?.nickname || 'Unknown'}`"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Loading user details...</span>
    </div>
    
    <div v-else-if="user" class="user-detail">
      <!-- User Basic Info -->
      <div class="detail-section">
        <h3 class="section-title">Basic Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Avatar</div>
            <div class="info-value">
              <el-avatar :size="60" :src="user.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Nickname</div>
            <div class="info-value">{{ user.nickname || 'N/A' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">{{ user.email || 'N/A' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Role</div>
            <div class="info-value">
              <el-tag :type="getRoleTagType(user.role)" size="small">
                {{ getRoleLabel(user.role) }}
              </el-tag>
            </div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <el-tag :type="getStatusTagType(user.status)" size="small">
                {{ getStatusLabel(user.status) }}
              </el-tag>
            </div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Total Points</div>
            <div class="info-value">{{ formatNumber(user.total_points || 0) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Account Information -->
      <div class="detail-section">
        <h3 class="section-title">Account Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Registration Date</div>
            <div class="info-value">{{ formatDate(user.created_at) }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Last Login</div>
            <div class="info-value">{{ user.last_login ? formatDate(user.last_login) : 'Never' }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Login Attempts</div>
            <div class="info-value">{{ user.login_attempts || 0 }}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Account Locked</div>
            <div class="info-value">
              <el-tag :type="user.account_locked_until && new Date(user.account_locked_until) > new Date() ? 'danger' : 'success'" size="small">
                {{ user.account_locked_until && new Date(user.account_locked_until) > new Date() ? 'Yes' : 'No' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Statistics -->
      <div class="detail-section" v-if="userStats">
        <h3 class="section-title">Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ userStats.eventsParticipated || 0 }}</div>
            <div class="stat-label">Events Participated</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{{ userStats.eventsWon || 0 }}</div>
            <div class="stat-label">Events Won</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{{ userStats.totalMatches || 0 }}</div>
            <div class="stat-label">Total Matches</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{{ userStats.winRate || 0 }}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="detail-section" v-if="recentActivity.length > 0">
        <h3 class="section-title">Recent Activity</h3>
        <div class="activity-list">
          <div class="activity-item" v-for="activity in recentActivity" :key="activity.id">
            <div class="activity-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <el-icon class="empty-state-icon"><User /></el-icon>
      <div class="empty-state-text">User not found</div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Close</el-button>
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          Edit User
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserDetail } from '@/api/users'
import { formatDate, formatRelativeTime, formatNumber } from '@/utils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'edit'])

const visible = ref(false)
const loading = ref(false)
const user = ref(null)
const userStats = ref(null)
const recentActivity = ref([])

// Watch for dialog visibility changes
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.userId) {
    loadUserDetail()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const loadUserDetail = async () => {
  if (!props.userId) return
  
  loading.value = true
  try {
    const response = await getUserDetail(props.userId)
    
    if (response.success) {
      user.value = response.data.user
      userStats.value = response.data.stats
      recentActivity.value = response.data.recentActivity || []
    } else {
      throw new Error(response.error?.message || 'Failed to load user details')
    }
  } catch (error) {
    console.error('Failed to load user detail:', error)
    ElMessage.error(error.message || 'Failed to load user details')
    user.value = null
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  user.value = null
  userStats.value = null
  recentActivity.value = []
}

const handleEdit = () => {
  if (user.value) {
    emit('edit', user.value)
    handleClose()
  }
}

const getRoleTagType = (role) => {
  const types = {
    'super_admin': 'danger',
    'admin': 'warning',
    'user': 'info'
  }
  return types[role] || 'info'
}

const getRoleLabel = (role) => {
  const labels = {
    'super_admin': 'Super Admin',
    'admin': 'Admin',
    'user': 'User'
  }
  return labels[role] || 'User'
}

const getStatusTagType = (status) => {
  const types = {
    'active': 'success',
    'banned': 'danger',
    'pending': 'warning'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    'active': 'Active',
    'banned': 'Banned',
    'pending': 'Pending'
  }
  return labels[status] || 'Unknown'
}
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: var(--text-color-light);
}

.user-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-color-lighter);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--bg-color);
  border-radius: var(--border-radius);
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border-color-lighter);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-color-lighter);
}

.activity-list {
  max-height: 200px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-lighter);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.activity-description {
  font-size: 13px;
  color: var(--text-color-light);
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: var(--text-color-lighter);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-color-lighter);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>