<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="page-title">管理面板</h1>
      <p class="page-description">欢迎使用网球热管理系统</p>
    </div>
    
    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-change positive">
            <el-icon><ArrowUp /></el-icon>
            本月新增 {{ stats.newUsersThisMonth || 0 }} 人
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalEvents || 0 }}</div>
          <div class="stat-label">总赛事数</div>
          <div class="stat-change positive">
            <el-icon><ArrowUp /></el-icon>
            本月新增 {{ stats.eventsThisMonth || 0 }} 场
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeUsers || 0 }}</div>
          <div class="stat-label">活跃用户</div>
          <div class="stat-change">
            <el-icon><Minus /></el-icon>
            最近30天
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeEvents || 0 }}</div>
          <div class="stat-label">进行中赛事</div>
          <div class="stat-change">
            <el-icon><Minus /></el-icon>
            当前进行中
          </div>
        </div>
      </div>
    </div>
    
    <!-- Charts Section -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>用户增长趋势</h3>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            @change="updateCharts"
          />
        </div>
        <div class="chart-container">
          <div class="chart-placeholder">
            <el-icon class="chart-icon"><TrendCharts /></el-icon>
            <p>用户增长图表将在此显示</p>
          </div>
        </div>
      </div>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3>赛事分类</h3>
        </div>
        <div class="chart-container">
          <div class="chart-placeholder">
            <el-icon class="chart-icon"><PieChart /></el-icon>
            <p>赛事分类图表将在此显示</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="activity-section">
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">最近活动</h3>
          <el-button type="primary" size="small" @click="refreshActivity">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <div class="activity-list">
          <div v-if="loading" class="loading-container">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载活动...</span>
          </div>
          <div v-else-if="activities.length === 0" class="empty-state">
            <el-icon class="empty-state-icon"><DocumentRemove /></el-icon>
            <div class="empty-state-text">暂无最近活动</div>
            <div class="empty-state-description">用户与系统交互时，活动将在此显示</div>
          </div>
          <div v-else class="activity-item" v-for="activity in activities" :key="activity.id">
            <div class="activity-icon">
              <el-icon v-if="activity.type === 'user'"><User /></el-icon>
              <el-icon v-else-if="activity.type === 'event'"><Calendar /></el-icon>
              <el-icon v-else><Bell /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getOverviewStats, getRecentActivity } from '@/api/stats'

const loading = ref(false)
const dateRange = ref([])

const stats = reactive({
  totalUsers: 0,
  activeUsers: 0,
  totalEvents: 0,
  activeEvents: 0,
  newUsersThisMonth: 0,
  eventsThisMonth: 0
})

const activities = ref([])

const loadStats = async () => {
  try {
    const response = await getOverviewStats()
    
    if (response.success) {
      const data = response.data
      stats.totalUsers = data.totalUsers || 0
      stats.activeUsers = data.activeUsers || 0
      stats.totalEvents = data.totalEvents || 0
      stats.activeEvents = data.activeEvents || 0
      stats.newUsersThisMonth = data.newUsersThisMonth || 0
      stats.eventsThisMonth = data.eventsThisMonth || 0
    } else {
      throw new Error(response.error?.message || '加载统计数据失败')
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败，请检查网络连接')
  }
}

const loadRecentActivity = async () => {
  loading.value = true
  try {
    const response = await getRecentActivity()
    
    if (response.success) {
      activities.value = response.data || []
    } else {
      throw new Error(response.error?.message || '加载最近活动失败')
    }
  } catch (error) {
    console.error('加载最近活动失败:', error)
    activities.value = []
    ElMessage.error('加载最近活动失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

const updateCharts = () => {
  ElMessage.info('图表更新功能将使用 ECharts 实现')
  // Reload stats when date range changes
  loadStats()
}

const refreshActivity = () => {
  loadRecentActivity()
}

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadStats()
  loadRecentActivity()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  color: var(--text-color-light);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--bg-color-light);
  border-radius: var(--border-radius-large);
  padding: 24px;
  box-shadow: var(--box-shadow-light);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-color-light);
  margin-bottom: 8px;
}

.stat-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: var(--success-color);
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.chart-card {
  background: var(--bg-color-light);
  border-radius: var(--border-radius-large);
  padding: 24px;
  box-shadow: var(--box-shadow-light);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.chart-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: var(--text-color-lighter);
}

.chart-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.activity-section {
  margin-bottom: 32px;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color-lighter);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-color);
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
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .chart-card {
    padding: 20px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>