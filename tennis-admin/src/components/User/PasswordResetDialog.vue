<template>
  <el-dialog
    v-model="visible"
    title="Reset User Password"
    width="500px"
    :before-close="handleClose"
  >
    <div class="reset-info">
      <div class="user-info">
        <el-avatar :size="40" :src="user?.avatar">
          <el-icon><User /></el-icon>
        </el-avatar>
        <div class="user-details">
          <div class="user-name">{{ user?.nickname || 'Unknown User' }}</div>
          <div class="user-email">{{ user?.email || 'No email' }}</div>
        </div>
      </div>
      
      <el-alert
        title="Password Reset"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          This will reset the user's password. The user will need to use the new password to log in.
        </template>
      </el-alert>
    </div>
    
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="New Password" prop="newPassword">
        <el-input
          v-model="formData.newPassword"
          type="password"
          placeholder="Enter new password"
          :disabled="loading"
          show-password
        />
      </el-form-item>
      
      <el-form-item label="Confirm Password" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="Confirm new password"
          :disabled="loading"
          show-password
        />
      </el-form-item>
      
      <el-form-item label="Send Notification">
        <el-switch
          v-model="formData.sendNotification"
          :disabled="loading"
        />
        <div class="form-help">
          Send email notification to user about password change
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          Cancel
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          Reset Password
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resetUserPassword } from '@/api/users'
import { validatePassword } from '@/utils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref()

const formData = reactive({
  newPassword: '',
  confirmPassword: '',
  sendNotification: true
})

const formRules = {
  newPassword: [
    { required: true, message: 'Please enter new password', trigger: 'blur' },
    { validator: validatePasswordStrength, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm password', trigger: 'blur' },
    { validator: validatePasswordMatch, trigger: 'blur' }
  ]
}

// Custom validators
function validatePasswordStrength(rule, value, callback) {
  if (!value) {
    callback(new Error('Password is required'))
    return
  }
  
  const validation = validatePassword(value)
  if (!validation.isValid) {
    callback(new Error(validation.feedback.join(', ')))
  } else {
    callback()
  }
}

function validatePasswordMatch(rule, value, callback) {
  if (!value) {
    callback(new Error('Please confirm password'))
    return
  }
  
  if (value !== formData.newPassword) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
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
  formData.newPassword = ''
  formData.confirmPassword = ''
  formData.sendNotification = true
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value || !props.user) return
  
  try {
    await formRef.value.validate()
    
    // Additional confirmation
    await ElMessageBox.confirm(
      `Are you sure you want to reset the password for "${props.user.nickname}"?`,
      'Confirm Password Reset',
      {
        confirmButtonText: 'Reset Password',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    const response = await resetUserPassword(props.user._id || props.user.id, {
      password: formData.newPassword,
      sendNotification: formData.sendNotification
    })
    
    if (response.success) {
      ElMessage.success('Password reset successfully')
      emit('success')
      handleClose()
    } else {
      throw new Error(response.error?.message || 'Failed to reset password')
    }
  } catch (error) {
    if (error !== 'cancel' && error.name !== 'ElFormValidateError') {
      console.error('Reset password error:', error)
      ElMessage.error(error.message || 'Failed to reset password')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-info {
  margin-bottom: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-color);
  border-radius: var(--border-radius);
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 2px;
}

.user-email {
  font-size: 14px;
  color: var(--text-color-light);
}

.form-help {
  font-size: 12px;
  color: var(--text-color-lighter);
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>