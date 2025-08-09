<template>
  <el-dialog
    v-model="visible"
    title="Batch Operations"
    width="600px"
    :before-close="handleClose"
  >
    <div class="batch-info">
      <el-alert
        :title="`${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          Choose an action to apply to all selected users.
        </template>
      </el-alert>
      
      <div class="selected-users">
        <div class="users-preview">
          <div 
            class="user-item" 
            v-for="user in previewUsers" 
            :key="user._id || user.id"
          >
            <el-avatar :size="24" :src="user.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="user-name">{{ user.nickname || 'Unknown' }}</span>
          </div>
          <div class="more-indicator" v-if="selectedUsers.length > 5">
            +{{ selectedUsers.length - 5 }} more
          </div>
        </div>
      </div>
    </div>
    
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="Action" prop="action">
        <el-select
          v-model="formData.action"
          placeholder="Select action"
          :disabled="loading"
          style="width: 100%"
          @change="handleActionChange"
        >
          <el-option label="Update Status" value="updateStatus" />
          <el-option label="Update Role" value="updateRole" />
          <el-option label="Delete Users" value="delete" />
          <el-option label="Export Data" value="export" />
        </el-select>
      </el-form-item>
      
      <!-- Status Update -->
      <el-form-item 
        label="New Status" 
        prop="status" 
        v-if="formData.action === 'updateStatus'"
      >
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          :disabled="loading"
          style="width: 100%"
        >
          <el-option label="Active" value="active" />
          <el-option label="Banned" value="banned" />
          <el-option label="Pending" value="pending" />
        </el-select>
      </el-form-item>
      
      <!-- Role Update -->
      <el-form-item 
        label="New Role" 
        prop="role" 
        v-if="formData.action === 'updateRole'"
      >
        <el-select
          v-model="formData.role"
          placeholder="Select role"
          :disabled="loading"
          style="width: 100%"
        >
          <el-option label="User" value="user" />
          <el-option label="Admin" value="admin" />
          <el-option label="Super Admin" value="super_admin" v-if="canAssignSuperAdmin" />
        </el-select>
      </el-form-item>
      
      <!-- Export Format -->
      <el-form-item 
        label="Export Format" 
        prop="exportFormat" 
        v-if="formData.action === 'export'"
      >
        <el-select
          v-model="formData.exportFormat"
          placeholder="Select format"
          :disabled="loading"
          style="width: 100%"
        >
          <el-option label="CSV" value="csv" />
          <el-option label="Excel" value="xlsx" />
          <el-option label="JSON" value="json" />
        </el-select>
      </el-form-item>
      
      <!-- Confirmation for destructive actions -->
      <el-form-item v-if="isDestructiveAction">
        <el-alert
          title="Warning"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            This action cannot be undone. Please confirm you want to proceed.
          </template>
        </el-alert>
        
        <el-checkbox v-model="formData.confirmed" style="margin-top: 12px">
          I understand this action cannot be undone
        </el-checkbox>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          Cancel
        </el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit" 
          :loading="loading"
          :disabled="isDestructiveAction && !formData.confirmed"
        >
          {{ getActionButtonText() }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { batchUpdateUsers, batchDeleteUsers, exportUsers } from '@/api/users'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const { isSuperAdmin } = useAuth()

const visible = ref(false)
const loading = ref(false)
const formRef = ref()

const canAssignSuperAdmin = computed(() => isSuperAdmin.value)
const previewUsers = computed(() => props.selectedUsers.slice(0, 5))
const isDestructiveAction = computed(() => formData.action === 'delete')

const formData = reactive({
  action: '',
  status: '',
  role: '',
  exportFormat: 'csv',
  confirmed: false
})

const formRules = {
  action: [
    { required: true, message: 'Please select an action', trigger: 'change' }
  ],
  status: [
    { required: true, message: 'Please select status', trigger: 'change' }
  ],
  role: [
    { required: true, message: 'Please select role', trigger: 'change' }
  ],
  exportFormat: [
    { required: true, message: 'Please select format', trigger: 'change' }
  ]
}

// Watch for dialog visibility changes
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    resetForm()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const resetForm = () => {
  formData.action = ''
  formData.status = ''
  formData.role = ''
  formData.exportFormat = 'csv'
  formData.confirmed = false
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const handleActionChange = () => {
  formData.confirmed = false
}

const getActionButtonText = () => {
  switch (formData.action) {
    case 'updateStatus':
      return 'Update Status'
    case 'updateRole':
      return 'Update Role'
    case 'delete':
      return 'Delete Users'
    case 'export':
      return 'Export Data'
    default:
      return 'Execute'
  }
}

const handleSubmit = async () => {
  if (!formRef.value || props.selectedUsers.length === 0) return
  
  try {
    await formRef.value.validate()
    
    // Additional confirmation for destructive actions
    if (isDestructiveAction.value) {
      await ElMessageBox.confirm(
        `Are you sure you want to delete ${props.selectedUsers.length} user${props.selectedUsers.length > 1 ? 's' : ''}?`,
        'Confirm Deletion',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'error'
        }
      )
    }
    
    loading.value = true
    
    const userIds = props.selectedUsers.map(user => user._id || user.id)
    let response
    
    switch (formData.action) {
      case 'updateStatus':
        response = await batchUpdateUsers(userIds, { status: formData.status })
        break
        
      case 'updateRole':
        response = await batchUpdateUsers(userIds, { role: formData.role })
        break
        
      case 'delete':
        response = await batchDeleteUsers(userIds)
        break
        
      case 'export':
        response = await exportUsers({
          userIds,
          format: formData.exportFormat
        })
        // Handle export differently
        if (response.success) {
          ElMessage.success('Export completed successfully')
          handleClose()
          return
        }
        break
        
      default:
        throw new Error('Invalid action selected')
    }
    
    if (response.success) {
      const actionName = {
        updateStatus: 'Status updated',
        updateRole: 'Role updated',
        delete: 'Users deleted'
      }[formData.action]
      
      ElMessage.success(`${actionName} successfully`)
      emit('success')
      handleClose()
    } else {
      throw new Error(response.error?.message || 'Batch operation failed')
    }
  } catch (error) {
    if (error !== 'cancel' && error.name !== 'ElFormValidateError') {
      console.error('Batch operation error:', error)
      ElMessage.error(error.message || 'Batch operation failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.batch-info {
  margin-bottom: 24px;
}

.selected-users {
  margin-top: 16px;
}

.users-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--bg-color);
  border-radius: var(--border-radius-small);
  font-size: 12px;
}

.user-name {
  color: var(--text-color);
}

.more-indicator {
  padding: 4px 8px;
  background: var(--primary-lighter);
  color: var(--primary-color);
  border-radius: var(--border-radius-small);
  font-size: 12px;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-alert) {
  margin-bottom: 0;
}
</style>