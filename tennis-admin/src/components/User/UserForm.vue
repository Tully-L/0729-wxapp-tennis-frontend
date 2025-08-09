<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Edit User' : 'Create User'"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <!-- Avatar Upload -->
      <el-form-item label="Avatar">
        <div class="avatar-upload">
          <el-avatar :size="80" :src="formData.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="upload-actions">
            <el-button size="small" @click="handleAvatarUpload">
              <el-icon><Upload /></el-icon>
              Upload
            </el-button>
            <el-button size="small" @click="formData.avatar = ''" v-if="formData.avatar">
              <el-icon><Delete /></el-icon>
              Remove
            </el-button>
          </div>
        </div>
      </el-form-item>
      
      <!-- Basic Information -->
      <el-form-item label="Nickname" prop="nickname">
        <el-input
          v-model="formData.nickname"
          placeholder="Enter user nickname"
          :disabled="loading"
        />
      </el-form-item>
      
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="Enter user email"
          :disabled="loading || isEdit"
        />
        <div class="form-help" v-if="isEdit">
          Email cannot be changed after creation
        </div>
      </el-form-item>
      
      <!-- Password (only for new users) -->
      <el-form-item label="Password" prop="password" v-if="!isEdit">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="Enter password"
          :disabled="loading"
          show-password
        />
      </el-form-item>
      
      <el-form-item label="Confirm Password" prop="confirmPassword" v-if="!isEdit">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="Confirm password"
          :disabled="loading"
          show-password
        />
      </el-form-item>
      
      <!-- Role -->
      <el-form-item label="Role" prop="role">
        <el-select
          v-model="formData.role"
          placeholder="Select user role"
          :disabled="loading"
          style="width: 100%"
        >
          <el-option label="User" value="user" />
          <el-option label="Admin" value="admin" />
          <el-option label="Super Admin" value="super_admin" v-if="canAssignSuperAdmin" />
        </el-select>
      </el-form-item>
      
      <!-- Status -->
      <el-form-item label="Status" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="Select user status"
          :disabled="loading"
          style="width: 100%"
        >
          <el-option label="Active" value="active" />
          <el-option label="Banned" value="banned" />
          <el-option label="Pending" value="pending" />
        </el-select>
      </el-form-item>
      
      <!-- Points (only for edit) -->
      <el-form-item label="Total Points" prop="total_points" v-if="isEdit">
        <el-input-number
          v-model="formData.total_points"
          :min="0"
          :max="999999"
          :disabled="loading"
          style="width: 100%"
        />
      </el-form-item>
      
      <!-- Additional Information -->
      <el-form-item label="Notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="Additional notes about this user"
          :disabled="loading"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          Cancel
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? 'Update User' : 'Create User' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createUser, updateUser } from '@/api/users'
import { useAuth } from '@/composables/useAuth'
import { isValidEmail, validatePassword } from '@/utils'

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

const { isSuperAdmin } = useAuth()

const visible = ref(false)
const loading = ref(false)
const formRef = ref()

const isEdit = computed(() => !!props.user)
const canAssignSuperAdmin = computed(() => isSuperAdmin.value)

const defaultFormData = {
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
  status: 'active',
  total_points: 0,
  avatar: '',
  notes: ''
}

const formData = reactive({ ...defaultFormData })

// Form validation rules
const formRules = {
  nickname: [
    { required: true, message: 'Please enter nickname', trigger: 'blur' },
    { min: 2, max: 50, message: 'Nickname must be 2-50 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter email', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }
  ],
  password: [
    { required: !isEdit.value, message: 'Please enter password', trigger: 'blur' },
    { validator: validatePasswordStrength, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: !isEdit.value, message: 'Please confirm password', trigger: 'blur' },
    { validator: validatePasswordMatch, trigger: 'blur' }
  ],
  role: [
    { required: true, message: 'Please select role', trigger: 'change' }
  ],
  status: [
    { required: true, message: 'Please select status', trigger: 'change' }
  ],
  total_points: [
    { type: 'number', min: 0, message: 'Points must be non-negative', trigger: 'blur' }
  ]
}

// Custom validators
function validateEmail(rule, value, callback) {
  if (!value) {
    callback()
    return
  }
  
  if (!isValidEmail(value)) {
    callback(new Error('Please enter a valid email address'))
  } else {
    callback()
  }
}

function validatePasswordStrength(rule, value, callback) {
  if (!isEdit.value && !value) {
    callback(new Error('Password is required'))
    return
  }
  
  if (!value) {
    callback()
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
  if (!isEdit.value && !value) {
    callback(new Error('Please confirm password'))
    return
  }
  
  if (!value) {
    callback()
    return
  }
  
  if (value !== formData.password) {
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
    if (props.user) {
      populateForm(props.user)
    }
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const resetForm = () => {
  Object.assign(formData, defaultFormData)
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const populateForm = (user) => {
  formData.nickname = user.nickname || ''
  formData.email = user.email || ''
  formData.role = user.role || 'user'
  formData.status = user.status || 'active'
  formData.total_points = user.total_points || 0
  formData.avatar = user.avatar || ''
  formData.notes = user.notes || ''
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    const submitData = {
      nickname: formData.nickname,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      avatar: formData.avatar,
      notes: formData.notes
    }
    
    if (isEdit.value) {
      submitData.total_points = formData.total_points
    } else {
      submitData.password = formData.password
    }
    
    let response
    if (isEdit.value) {
      response = await updateUser(props.user._id || props.user.id, submitData)
    } else {
      response = await createUser(submitData)
    }
    
    if (response.success) {
      ElMessage.success(`User ${isEdit.value ? 'updated' : 'created'} successfully`)
      emit('success', response.data)
      handleClose()
    } else {
      throw new Error(response.error?.message || `Failed to ${isEdit.value ? 'update' : 'create'} user`)
    }
  } catch (error) {
    if (error.name !== 'ElFormValidateError') {
      console.error('Submit user error:', error)
      ElMessage.error(error.message || `Failed to ${isEdit.value ? 'update' : 'create'} user`)
    }
  } finally {
    loading.value = false
  }
}

const handleAvatarUpload = () => {
  // TODO: Implement avatar upload functionality
  ElMessage.info('Avatar upload functionality will be implemented')
}
</script>

<style scoped>
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>