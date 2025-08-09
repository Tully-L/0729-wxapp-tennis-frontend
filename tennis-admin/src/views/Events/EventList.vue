<template>
  <div class="event-list">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">赛事管理</h1>
        <p class="page-description">管理所有网球赛事</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateEvent">
          <el-icon><Plus /></el-icon>
          创建赛事
        </el-button>
      </div>
    </div>
    
    <!-- Search and Filters -->
    <div class="admin-card">
      <div class="search-section">
        <div class="search-row">
          <el-input
            v-model="searchQuery"
            placeholder="按标题、地点搜索..."
            clearable
            @input="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select
            v-model="statusFilter"
            placeholder="状态"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="全部状态" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已结束" value="ended" />
            <el-option label="已取消" value="canceled" />
          </el-select>
          
          <el-select
            v-model="categoryFilter"
            placeholder="分类"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="全部分类" value="" />
            <el-option label="锦标赛" value="tournament" />
            <el-option label="训练" value="training" />
            <el-option label="社交" value="social" />
            <el-option label="比赛" value="competition" />
          </el-select>
          
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleFilter"
            class="date-picker"
          />
          
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- Event Cards -->
    <div class="events-grid">
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在加载赛事...</span>
      </div>
      
      <div v-else-if="events.length === 0" class="empty-state">
        <el-icon class="empty-state-icon"><Calendar /></el-icon>
        <div class="empty-state-text">未找到赛事</div>
        <div class="empty-state-description">
          {{ searchQuery || statusFilter || categoryFilter ? '尝试调整筛选条件' : '创建您的第一个赛事开始使用' }}
        </div>
        <el-button v-if="!searchQuery && !statusFilter && !categoryFilter" type="primary" @click="showCreateEvent">
          <el-icon><Plus /></el-icon>
          创建赛事
        </el-button>
      </div>
      
      <div v-else class="event-card" v-for="event in events" :key="event._id">
        <div class="event-header">
          <div class="event-status">
            <el-tag :type="getStatusTagType(event.status)" size="small">
              {{ getStatusLabel(event.status) }}
            </el-tag>
          </div>
          <div class="event-actions">
            <el-dropdown @command="(command) => handleEventAction(command, event)">
              <el-button size="small" text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view">查看详情</el-dropdown-item>
                  <el-dropdown-item command="edit">编辑赛事</el-dropdown-item>
                  <el-dropdown-item command="participants">查看参与者</el-dropdown-item>
                  <el-dropdown-item command="analytics">查看分析</el-dropdown-item>
                  <el-dropdown-item divided command="duplicate">复制</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div class="event-content">
          <h3 class="event-title">{{ event.title }}</h3>
          <div class="event-meta">
            <div class="meta-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatEventDate(event.start_time, event.end_time) }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Location /></el-icon>
              <span>{{ event.location || 'TBD' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Tag /></el-icon>
              <span>{{ getCategoryLabel(event.category) }}</span>
            </div>
          </div>
          
          <div class="event-description">
            {{ event.description || '暂无描述' }}
          </div>
          
          <div class="event-stats">
            <div class="stat-item">
              <span class="stat-label">参与者</span>
              <span class="stat-value">{{ event.participant_count || 0 }}/{{ event.max_participants || '∞' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">报名数</span>
              <span class="stat-value">{{ event.registration_count || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="event-footer">
          <div class="event-progress">
            <el-progress
              :percentage="getParticipationPercentage(event)"
              :stroke-width="6"
              :show-text="false"
              :color="getProgressColor(event)"
            />
            <span class="progress-text">
              {{ getParticipationPercentage(event) }}% 已满
            </span>
          </div>
          
          <div class="event-buttons">
            <el-button size="small" @click="viewEvent(event)">
              查看
            </el-button>
            <el-button size="small" type="primary" @click="editEvent(event)">
              编辑
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div v-if="events.length > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[12, 24, 48]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
    
    <!-- Event Form Dialog -->
    <EventForm
      v-model="showEventForm"
      :event="editingEvent"
      @success="handleEventFormSuccess"
    />
    
    <!-- Event Participants Dialog -->
    <EventParticipants
      v-model="showEventParticipants"
      :event="selectedEvent"
    />
    
    <!-- Event Analytics Dialog -->
    <EventAnalytics
      v-model="showEventAnalytics"
      :event="selectedEvent"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, View, More, Calendar, Location, User, Tag, MoreFilled, Refresh, Loading } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getEventList, deleteEvent, duplicateEvent } from '@/api/events'
import { useTable } from '@/composables/useTable'
import EventForm from '@/components/Event/EventForm.vue'
import EventParticipants from '@/components/Event/EventParticipants.vue'
import EventAnalytics from '@/components/Event/EventAnalytics.vue'

// Use table composable for data management
const {
  loading,
  data: events,
  pagination,
  searchQuery,
  loadData: loadEvents,
  handlePageChange,
  handleSizeChange,
  handleSearch,
  exportData
} = useTable({
  fetchData: getEventList,
  defaultPageSize: 12
})

// Filters
const statusFilter = ref('')
const categoryFilter = ref('')
const dateRange = ref([])

// Dialog states
const showEventForm = ref(false)
const showEventParticipants = ref(false)
const showEventAnalytics = ref(false)
const editingEvent = ref(null)
const selectedEvent = ref(null)

// Handle filter changes
const handleFilter = () => {
  const filters = {}
  if (statusFilter.value) filters.status = statusFilter.value
  if (categoryFilter.value) filters.category = categoryFilter.value
  if (dateRange.value && dateRange.value.length === 2) {
    filters.startDate = dateRange.value[0]
    filters.endDate = dateRange.value[1]
  }
  
  loadEvents(filters)
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
  dateRange.value = []
  loadEvents()
}

const showCreateEvent = () => {
  editingEvent.value = null
  showEventForm.value = true
}

const viewEvent = (event) => {
  ElMessage.info(`View event: ${event.title}`)
}

const editEvent = (event) => {
  editingEvent.value = event
  showEventForm.value = true
}

const handleEventFormSuccess = () => {
  loadEvents()
}

const handleEventAction = async (command, event) => {
  switch (command) {
    case 'view':
      viewEvent(event)
      break
    case 'edit':
      editEvent(event)
      break
    case 'participants':
      selectedEvent.value = event
      showEventParticipants.value = true
      break
    case 'analytics':
      selectedEvent.value = event
      showEventAnalytics.value = true
      break
    case 'duplicate':
      try {
        const response = await duplicateEvent(event._id || event.id, {
          title: `${event.title} (Copy)`
        })
        if (response.success) {
          ElMessage.success('Event duplicated successfully')
          loadEvents()
        } else {
          throw new Error(response.error?.message || 'Failed to duplicate event')
        }
      } catch (error) {
        console.error('Duplicate event error:', error)
        ElMessage.error(error.message || 'Failed to duplicate event')
      }
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          'This will permanently delete the event. Continue?',
          'Warning',
          {
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            type: 'error'
          }
        )
        
        const response = await deleteEvent(event._id || event.id)
        if (response.success) {
          ElMessage.success('Event deleted successfully')
          loadEvents()
        } else {
          throw new Error(response.error?.message || 'Failed to delete event')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Delete event error:', error)
          ElMessage.error(error.message || 'Failed to delete event')
        }
      }
      break
  }
}

const getStatusTagType = (status) => {
  const types = {
    'draft': 'info',
    'published': 'success',
    'ongoing': 'warning',
    'ended': '',
    'canceled': 'danger'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    'draft': '草稿',
    'published': '已发布',
    'ongoing': '进行中',
    'ended': '已结束',
    'canceled': '已取消'
  }
  return labels[status] || '未知'
}

const getCategoryLabel = (category) => {
  const labels = {
    'tournament': '锦标赛',
    'training': '训练',
    'social': '社交',
    'competition': '比赛'
  }
  return labels[category] || '其他'
}

const formatEventDate = (startTime, endTime) => {
  const start = dayjs(startTime)
  const end = dayjs(endTime)
  
  if (start.isSame(end, 'day')) {
    return `${start.format('MMM DD, YYYY')} ${start.format('HH:mm')}-${end.format('HH:mm')}`
  } else {
    return `${start.format('MMM DD')} - ${end.format('MMM DD, YYYY')}`
  }
}

const getParticipationPercentage = (event) => {
  if (!event.max_participants) return 0
  return Math.round((event.participant_count / event.max_participants) * 100)
}

const getProgressColor = (event) => {
  const percentage = getParticipationPercentage(event)
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.event-list {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  flex: 1;
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

.header-right {
  display: flex;
  gap: 12px;
}

.search-section {
  padding: 20px;
}

.search-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  width: 140px;
}

.date-picker {
  width: 240px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.event-card {
  background: var(--bg-color-light);
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-light);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.event-content {
  padding: 20px;
}

.event-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color-light);
}

.meta-item .el-icon {
  font-size: 16px;
  color: var(--text-color-lighter);
}

.event-description {
  font-size: 14px;
  color: var(--text-color-light);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-color-lighter);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.event-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-progress {
  flex: 1;
  margin-right: 16px;
}

.progress-text {
  font-size: 12px;
  color: var(--text-color-lighter);
  margin-top: 4px;
  display: block;
}

.event-buttons {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .filter-select,
  .date-picker {
    width: 100%;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .event-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .event-progress {
    margin-right: 0;
  }
}
</style>