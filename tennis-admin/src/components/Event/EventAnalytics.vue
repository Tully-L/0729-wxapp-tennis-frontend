<template>
  <el-dialog
    v-model="visible"
    :title="`Event Analytics - ${event?.title || 'Unknown Event'}`"
    width="1000px"
    :before-close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Loading analytics...</span>
    </div>
    
    <div v-else class="analytics-content">
      <!-- Key Metrics -->
      <div class="metrics-section">
        <h3 class="section-title">Key Performance Indicators</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ analytics.totalRegistrations || 0 }}</div>
              <div class="metric-label">Total Registrations</div>
              <div class="metric-change positive" v-if="analytics.registrationGrowth > 0">
                <el-icon><ArrowUp /></el-icon>
                +{{ analytics.registrationGrowth }}% vs last event
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ analytics.approvedParticipants || 0 }}</div>
              <div class="metric-label">Approved Participants</div>
              <div class="metric-change">
                {{ getApprovalRate() }}% approval rate
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ analytics.checkedInCount || 0 }}</div>
              <div class="metric-label">Checked In</div>
              <div class="metric-change">
                {{ getCheckInRate() }}% attendance rate
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">${{ analytics.totalRevenue || 0 }}</div>
              <div class="metric-label">Total Revenue</div>
              <div class="metric-change">
                ${{ analytics.averageRevenue || 0 }} per participant
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Registration Timeline -->
      <div class="chart-section">
        <h3 class="section-title">Registration Timeline</h3>
        <div class="chart-container">
          <div class="chart-placeholder">
            <el-icon class="chart-icon"><TrendCharts /></el-icon>
            <p>Registration timeline chart will be displayed here</p>
            <p class="chart-description">Shows daily registration counts leading up to the event</p>
          </div>
        </div>
      </div>
      
      <!-- Participant Demographics -->
      <div class="demographics-section">
        <h3 class="section-title">Participant Demographics</h3>
        <div class="demographics-grid">
          <div class="demo-chart">
            <h4>Age Distribution</h4>
            <div class="chart-placeholder small">
              <el-icon class="chart-icon"><PieChart /></el-icon>
              <p>Age distribution chart</p>
            </div>
          </div>
          
          <div class="demo-chart">
            <h4>Skill Level</h4>
            <div class="chart-placeholder small">
              <el-icon class="chart-icon"><DataAnalysis /></el-icon>
              <p>Skill level distribution</p>
            </div>
          </div>
          
          <div class="demo-chart">
            <h4>Registration Source</h4>
            <div class="chart-placeholder small">
              <el-icon class="chart-icon"><Connection /></el-icon>
              <p>Registration source breakdown</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Feedback Summary -->
      <div class="feedback-section" v-if="analytics.feedback && analytics.feedback.length > 0">
        <h3 class="section-title">Participant Feedback</h3>
        <div class="feedback-summary">
          <div class="rating-overview">
            <div class="overall-rating">
              <div class="rating-value">{{ analytics.averageRating || 0 }}</div>
              <div class="rating-stars">
                <el-rate
                  :model-value="analytics.averageRating || 0"
                  disabled
                  show-score
                  text-color="#ff9900"
                />
              </div>
              <div class="rating-count">Based on {{ analytics.feedbackCount || 0 }} reviews</div>
            </div>
            
            <div class="rating-breakdown">
              <div class="rating-item" v-for="(count, rating) in analytics.ratingBreakdown" :key="rating">
                <span class="rating-label">{{ rating }} stars</span>
                <div class="rating-bar">
                  <div 
                    class="rating-fill" 
                    :style="{ width: getRatingPercentage(count) + '%' }"
                  ></div>
                </div>
                <span class="rating-count">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recent Feedback -->
        <div class="recent-feedback">
          <h4>Recent Comments</h4>
          <div class="feedback-list">
            <div 
              class="feedback-item" 
              v-for="feedback in analytics.recentFeedback" 
              :key="feedback.id"
            >
              <div class="feedback-header">
                <div class="feedback-user">
                  <el-avatar :size="24" :src="feedback.user?.avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span class="user-name">{{ feedback.user?.nickname || 'Anonymous' }}</span>
                </div>
                <div class="feedback-rating">
                  <el-rate :model-value="feedback.rating" disabled size="small" />
                </div>
              </div>
              <div class="feedback-comment">{{ feedback.comment }}</div>
              <div class="feedback-date">{{ formatDate(feedback.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Export Options -->
      <div class="export-section">
        <h3 class="section-title">Export Report</h3>
        <div class="export-options">
          <el-button @click="exportReport('pdf')">
            <el-icon><Document /></el-icon>
            Export PDF Report
          </el-button>
          <el-button @click="exportReport('excel')">
            <el-icon><Download /></el-icon>
            Export Excel Data
          </el-button>
          <el-button @click="exportReport('csv')">
            <el-icon><Files /></el-icon>
            Export CSV Data
          </el-button>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Close</el-button>
        <el-button type="primary" @click="refreshAnalytics">
          <el-icon><Refresh /></el-icon>
          Refresh Data
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getEventStats } from '@/api/stats'
import { formatDate } from '@/utils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  event: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const loading = ref(false)

const analytics = reactive({
  totalRegistrations: 0,
  approvedParticipants: 0,
  checkedInCount: 0,
  totalRevenue: 0,
  averageRevenue: 0,
  registrationGrowth: 0,
  averageRating: 0,
  feedbackCount: 0,
  ratingBreakdown: {},
  recentFeedback: [],
  feedback: []
})

// Watch for dialog visibility changes
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.event) {
    loadAnalytics()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const loadAnalytics = async () => {
  if (!props.event) return
  
  loading.value = true
  try {
    const response = await getEventStats({
      eventId: props.event._id || props.event.id
    })
    
    if (response.success) {
      Object.assign(analytics, response.data)
    } else {
      throw new Error(response.error?.message || 'Failed to load analytics')
    }
  } catch (error) {
    console.error('Failed to load analytics:', error)
    // Use mock data for demonstration
    Object.assign(analytics, {
      totalRegistrations: 156,
      approvedParticipants: 142,
      checkedInCount: 128,
      totalRevenue: 7800,
      averageRevenue: 50,
      registrationGrowth: 15,
      averageRating: 4.3,
      feedbackCount: 89,
      ratingBreakdown: {
        5: 45,
        4: 28,
        3: 12,
        2: 3,
        1: 1
      },
      recentFeedback: [
        {
          id: 1,
          user: { nickname: '张三', avatar: '' },
          rating: 5,
          comment: 'Excellent event! Well organized and great competition.',
          created_at: new Date('2024-02-01')
        },
        {
          id: 2,
          user: { nickname: '李四', avatar: '' },
          rating: 4,
          comment: 'Good event overall, but could use better facilities.',
          created_at: new Date('2024-02-02')
        }
      ]
    })
    ElMessage.warning('Using demo analytics data - API connection failed')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  Object.assign(analytics, {
    totalRegistrations: 0,
    approvedParticipants: 0,
    checkedInCount: 0,
    totalRevenue: 0,
    averageRevenue: 0,
    registrationGrowth: 0,
    averageRating: 0,
    feedbackCount: 0,
    ratingBreakdown: {},
    recentFeedback: [],
    feedback: []
  })
}

const refreshAnalytics = () => {
  loadAnalytics()
}

const getApprovalRate = () => {
  if (analytics.totalRegistrations === 0) return 0
  return Math.round((analytics.approvedParticipants / analytics.totalRegistrations) * 100)
}

const getCheckInRate = () => {
  if (analytics.approvedParticipants === 0) return 0
  return Math.round((analytics.checkedInCount / analytics.approvedParticipants) * 100)
}

const getRatingPercentage = (count) => {
  if (analytics.feedbackCount === 0) return 0
  return Math.round((count / analytics.feedbackCount) * 100)
}

const exportReport = (format) => {
  ElMessage.info(`Exporting ${format.toUpperCase()} report...`)
  // TODO: Implement actual export functionality
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

.analytics-content {
  max-height: 700px;
  overflow-y: auto;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 20px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.metrics-section {
  margin-bottom: 32px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.metric-card {
  background: var(--bg-color-light);
  border-radius: var(--border-radius-large);
  padding: 24px;
  box-shadow: var(--box-shadow-light);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow);
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: var(--text-color-light);
  margin-bottom: 8px;
}

.metric-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-color-lighter);
}

.metric-change.positive {
  color: var(--success-color);
}

.chart-section {
  margin-bottom: 32px;
}

.chart-container {
  height: 300px;
  background: var(--bg-color-light);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color-lighter);
}

.chart-placeholder {
  text-align: center;
  color: var(--text-color-lighter);
}

.chart-placeholder.small {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.chart-description {
  font-size: 12px;
  margin-top: 8px;
}

.demographics-section {
  margin-bottom: 32px;
}

.demographics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.demo-chart {
  background: var(--bg-color-light);
  border-radius: var(--border-radius);
  padding: 20px;
  border: 1px solid var(--border-color-lighter);
}

.demo-chart h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px 0;
}

.feedback-section {
  margin-bottom: 32px;
}

.feedback-summary {
  background: var(--bg-color-light);
  border-radius: var(--border-radius);
  padding: 24px;
  margin-bottom: 20px;
}

.rating-overview {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  align-items: center;
}

.overall-rating {
  text-align: center;
}

.rating-value {
  font-size: 48px;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 8px;
}

.rating-count {
  font-size: 12px;
  color: var(--text-color-lighter);
  margin-top: 8px;
}

.rating-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-item {
  display: grid;
  grid-template-columns: 60px 1fr 30px;
  gap: 12px;
  align-items: center;
}

.rating-label {
  font-size: 12px;
  color: var(--text-color-light);
}

.rating-bar {
  height: 8px;
  background: var(--border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}

.rating-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.recent-feedback h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px 0;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-item {
  background: var(--bg-color);
  border-radius: var(--border-radius);
  padding: 16px;
  border: 1px solid var(--border-color-lighter);
}

.feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.feedback-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.feedback-comment {
  font-size: 14px;
  color: var(--text-color-light);
  line-height: 1.5;
  margin-bottom: 8px;
}

.feedback-date {
  font-size: 12px;
  color: var(--text-color-lighter);
}

.export-section {
  margin-bottom: 0;
}

.export-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .demographics-grid {
    grid-template-columns: 1fr;
  }
  
  .rating-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .export-options {
    flex-direction: column;
  }
}
</style>