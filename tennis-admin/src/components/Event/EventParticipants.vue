<template>
  <el-dialog
    v-model="visible"
    :title="`Event Participants - ${event?.title || 'Unknown Event'}`"
    width="900px"
    :before-close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Loading participants...</span>
    </div>
    
    <div v-else class="participants-content">
      <!-- Event Info -->
      <div class="event-info">
        <div class="event-summary">
          <div class="summary-item">
            <div class="summary-label">Total Registered</div>
            <div class="summary-value">{{ participants.length }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Approved</div>
            <div class="summary-value approved">{{ approvedCount }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Pending</div>
            <div class="summary-value pending">{{ pendingCount }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Rejected</div>
            <div class="summary-value rejected">{{ rejectedCount }}</div>
          </div>
          <div class="summary-item" v-if="event?.max_participants">
            <div class="summary-label">Capacity</div>
            <div class="summary-value">{{ approvedCount }}/{{ event.max_participants }}</div>
          </div>
        </div>
      </div>
      
      <!-- Filters and Actions -->
      <div class="participants-header">
        <div class="header-filters">
          <el-input
            v-model="searchQuery"
            placeholder="Search participants..."
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
            placeholder="Status"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="All Status" value="" />
            <el-option label="Approved" value="approved" />
            <el-option label="Pending" value="pending" />
            <el-option label="Rejected" value="rejected" />
          </el-select>
        </div>
        
        <div class="header-actions">
          <el-button 
            size="small" 
            @click="showBatchActions = true"
            :disabled="selectedParticipants.length === 0"
          >
            <el-icon><Operation /></el-icon>
            Batch Actions ({{ selectedParticipants.length }})
          </el-button>
          <el-button size="small" @click="exportParticipants">
            <el-icon><Download /></el-icon>
            Export
          </el-button>
          <el-button size="small" @click="refreshParticipants">
            <el-icon><Refresh /></el-icon>
            Refresh
          </el-button>
        </div>
      </div>
      
      <!-- Participants Table -->
      <el-table
        :data="filteredParticipants"
        v-loading="tableLoading"
        @selection-change="handleSelectionChange"
        class="participants-table"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="user.avatar" label="Avatar" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.user?.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="user.nickname" label="Participant" min-width="150">
          <template #default="{ row }">
            <div class="participant-info">
              <div class="participant-name">{{ row.user?.nickname || 'Unknown' }}</div>
              <div class="participant-email">{{ row.user?.email || 'No email' }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="Status" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="registered_at" label="Registered" width="140">
          <template #default="{ row }">
            {{ formatDate(row.registered_at) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="payment_status" label="Payment" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getPaymentTagType(row.payment_status)"
              size="small"
              v-if="event?.registration_fee > 0"
            >
              {{ getPaymentLabel(row.payment_status) }}
            </el-tag>
            <span v-else class="text-muted">Free</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="checked_in" label="Check-in" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.checked_in"
              @change="handleCheckInChange(row)"
              :disabled="row.status !== 'approved'"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              @click="updateParticipantStatus(row, 'approved')"
              v-if="row.status === 'pending'"
            >
              Approve
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="updateParticipantStatus(row, 'rejected')"
              v-if="row.status === 'pending'"
            >
              Reject
            </el-button>
            <el-button
              size="small"
              @click="viewParticipantDetail(row)"
            >
              View
            </el-button>
            <el-dropdown @command="(command) => handleParticipantAction(command, row)">
              <el-button size="small">
                More<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="message">
                    Send Message
                  </el-dropdown-item>
                  <el-dropdown-item command="remove" divided>
                    Remove Participant
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Empty State -->
      <div v-if="filteredParticipants.length === 0 && !tableLoading" class="empty-state">
        <el-icon class="empty-state-icon"><UserFilled /></el-icon>
        <div class="empty-state-text">No participants found</div>
        <div class="empty-state-description">
          {{ searchQuery || statusFilter ? 'Try adjusting your filters' : 'No one has registered for this event yet' }}
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Close</el-button>
      </div>
    </template>
    
    <!-- Batch Actions Dialog -->
    <el-dialog
      v-model="showBatchActions"
      title="Batch Actions"
      width="500px"
    >
      <div class="batch-actions-content">
        <el-alert
          :title="`${selectedParticipants.length} participant${selectedParticipants.length > 1 ? 's' : ''} selected`"
          type="info"
          :closable="false"
          show-icon
        />
        
        <el-form :model="batchForm" label-width="120px" style="margin-top: 20px;">
          <el-form-item label="Action">
            <el-select v-model="batchForm.action" placeholder="Select action" style="width: 100%">
              <el-option label="Approve All" value="approve" />
              <el-option label="Reject All" value="reject" />
              <el-option label="Check In All" value="checkin" />
              <el-option label="Send Message" value="message" />
              <el-option label="Remove All" value="remove" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Message" v-if="batchForm.action === 'message'">
            <el-input
              v-model="batchForm.message"
              type="textarea"
              :rows="3"
              placeholder="Enter message to send"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showBatchActions = false">Cancel</el-button>
          <el-button type="primary" @click="executeBatchAction" :loading="batchLoading">
            Execute
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEventParticipants } from '@/api/events'
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
const tableLoading = ref(false)
const batchLoading = ref(false)
const showBatchActions = ref(false)

const participants = ref([])
const selectedParticipants = ref([])
const searchQuery = ref('')
const statusFilter = ref('')

const batchForm = reactive({
  action: '',
  message: ''
})

// Computed properties
const approvedCount = computed(() => 
  participants.value.filter(p => p.status === 'approved').length
)

const pendingCount = computed(() => 
  participants.value.filter(p => p.status === 'pending').length
)

const rejectedCount = computed(() => 
  participants.value.filter(p => p.status === 'rejected').length
)

const filteredParticipants = computed(() => {
  let filtered = participants.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.user?.nickname?.toLowerCase().includes(query) ||
      p.user?.email?.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(p => p.status === statusFilter.value)
  }
  
  return filtered
})

// Watch for dialog visibility changes
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.event) {
    loadParticipants()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const loadParticipants = async () => {
  if (!props.event) return
  
  loading.value = true
  try {
    const response = await getEventParticipants(props.event._id || props.event.id)
    
    if (response.success) {
      participants.value = response.data.participants || []
    } else {
      throw new Error(response.error?.message || 'Failed to load participants')
    }
  } catch (error) {
    console.error('Failed to load participants:', error)
    ElMessage.error(error.message || 'Failed to load participants')
    participants.value = []
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  participants.value = []
  selectedParticipants.value = []
  searchQuery.value = ''
  statusFilter.value = ''
}

const handleSearch = () => {
  // Filtering is handled by computed property
}

const handleFilter = () => {
  // Filtering is handled by computed property
}

const handleSelectionChange = (selection) => {
  selectedParticipants.value = selection
}

const refreshParticipants = () => {
  loadParticipants()
}

const exportParticipants = () => {
  ElMessage.info('Export functionality will be implemented')
}

const updateParticipantStatus = async (participant, status) => {
  try {
    // TODO: Call API to update participant status
    participant.status = status
    ElMessage.success(`Participant ${status} successfully`)
  } catch (error) {
    console.error('Update participant status error:', error)
    ElMessage.error('Failed to update participant status')
  }
}

const handleCheckInChange = async (participant) => {
  try {
    // TODO: Call API to update check-in status
    ElMessage.success(`Check-in ${participant.checked_in ? 'completed' : 'cancelled'}`)
  } catch (error) {
    console.error('Update check-in error:', error)
    ElMessage.error('Failed to update check-in status')
    participant.checked_in = !participant.checked_in // Revert on error
  }
}

const viewParticipantDetail = (participant) => {
  ElMessage.info(`View participant: ${participant.user?.nickname}`)
}

const handleParticipantAction = async (command, participant) => {
  switch (command) {
    case 'message':
      ElMessage.info('Send message functionality will be implemented')
      break
    case 'remove':
      try {
        await ElMessageBox.confirm(
          `Remove "${participant.user?.nickname}" from this event?`,
          'Confirm Removal',
          {
            confirmButtonText: 'Remove',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )
        
        // TODO: Call API to remove participant
        const index = participants.value.findIndex(p => p.id === participant.id)
        if (index > -1) {
          participants.value.splice(index, 1)
        }
        ElMessage.success('Participant removed successfully')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('Failed to remove participant')
        }
      }
      break
  }
}

const executeBatchAction = async () => {
  if (!batchForm.action || selectedParticipants.value.length === 0) return
  
  batchLoading.value = true
  try {
    // TODO: Implement batch actions
    switch (batchForm.action) {
      case 'approve':
        selectedParticipants.value.forEach(p => p.status = 'approved')
        ElMessage.success('Participants approved successfully')
        break
      case 'reject':
        selectedParticipants.value.forEach(p => p.status = 'rejected')
        ElMessage.success('Participants rejected successfully')
        break
      case 'checkin':
        selectedParticipants.value.forEach(p => p.checked_in = true)
        ElMessage.success('Participants checked in successfully')
        break
      case 'message':
        ElMessage.success('Messages sent successfully')
        break
      case 'remove':
        selectedParticipants.value.forEach(p => {
          const index = participants.value.findIndex(item => item.id === p.id)
          if (index > -1) {
            participants.value.splice(index, 1)
          }
        })
        ElMessage.success('Participants removed successfully')
        break
    }
    
    showBatchActions.value = false
    selectedParticipants.value = []
    batchForm.action = ''
    batchForm.message = ''
  } catch (error) {
    console.error('Batch action error:', error)
    ElMessage.error('Batch action failed')
  } finally {
    batchLoading.value = false
  }
}

const getStatusTagType = (status) => {
  const types = {
    'approved': 'success',
    'pending': 'warning',
    'rejected': 'danger'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    'approved': 'Approved',
    'pending': 'Pending',
    'rejected': 'Rejected'
  }
  return labels[status] || 'Unknown'
}

const getPaymentTagType = (status) => {
  const types = {
    'paid': 'success',
    'pending': 'warning',
    'failed': 'danger'
  }
  return types[status] || 'info'
}

const getPaymentLabel = (status) => {
  const labels = {
    'paid': 'Paid',
    'pending': 'Pending',
    'failed': 'Failed'
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

.participants-content {
  max-height: 600px;
  overflow-y: auto;
}

.event-info {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--bg-color);
  border-radius: var(--border-radius);
}

.event-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: var(--text-color-lighter);
  margin-bottom: 4px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
}

.summary-value.approved {
  color: var(--success-color);
}

.summary-value.pending {
  color: var(--warning-color);
}

.summary-value.rejected {
  color: var(--danger-color);
}

.participants-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 250px;
}

.filter-select {
  width: 120px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.participants-table {
  margin-bottom: 20px;
}

.participant-info {
  display: flex;
  flex-direction: column;
}

.participant-name {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.participant-email {
  font-size: 12px;
  color: var(--text-color-lighter);
}

.text-muted {
  color: var(--text-color-lighter);
  font-size: 12px;
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
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 14px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.batch-actions-content {
  padding: 0;
}

@media (max-width: 768px) {
  .participants-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-filters {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .event-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>