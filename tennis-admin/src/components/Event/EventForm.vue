<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Edit Event' : 'Create Event'"
    width="800px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      @submit.prevent="handleSubmit"
    >
      <!-- Basic Information -->
      <div class="form-section">
        <h3 class="section-title">Basic Information</h3>
        
        <el-form-item label="Event Title" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="Enter event title"
            :disabled="loading"
          />
        </el-form-item>
        
        <el-form-item label="Category" prop="category">
          <el-select
            v-model="formData.category"
            placeholder="Select event category"
            :disabled="loading"
            style="width: 100%"
          >
            <el-option label="Tournament" value="tournament" />
            <el-option label="Training" value="training" />
            <el-option label="Social" value="social" />
            <el-option label="Competition" value="competition" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Status" prop="status">
          <el-select
            v-model="formData.status"
            placeholder="Select event status"
            :disabled="loading"
            style="width: 100%"
          >
            <el-option label="Draft" value="draft" />
            <el-option label="Published" value="published" />
            <el-option label="Ongoing" value="ongoing" />
            <el-option label="Ended" value="ended" />
            <el-option label="Canceled" value="canceled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Description" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="Enter event description"
            :disabled="loading"
          />
        </el-form-item>
      </div>
      
      <!-- Date and Time -->
      <div class="form-section">
        <h3 class="section-title">Date and Time</h3>
        
        <el-form-item label="Start Date & Time" prop="start_time">
          <el-date-picker
            v-model="formData.start_time"
            type="datetime"
            placeholder="Select start date and time"
            :disabled="loading"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="End Date & Time" prop="end_time">
          <el-date-picker
            v-model="formData.end_time"
            type="datetime"
            placeholder="Select end date and time"
            :disabled="loading"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </div>
      
      <!-- Location and Capacity -->
      <div class="form-section">
        <h3 class="section-title">Location and Capacity</h3>
        
        <el-form-item label="Location" prop="location">
          <el-input
            v-model="formData.location"
            placeholder="Enter event location"
            :disabled="loading"
          />
        </el-form-item>
        
        <el-form-item label="Max Participants" prop="max_participants">
          <el-input-number
            v-model="formData.max_participants"
            :min="1"
            :max="9999"
            :disabled="loading"
            style="width: 100%"
          />
          <div class="form-help">
            Maximum number of participants allowed (leave empty for unlimited)
          </div>
        </el-form-item>
      </div>
      
      <!-- Registration Settings -->
      <div class="form-section">
        <h3 class="section-title">Registration Settings</h3>
        
        <el-form-item label="Registration Fee">
          <el-input-number
            v-model="formData.registration_fee"
            :min="0"
            :precision="2"
            :disabled="loading"
            style="width: 100%"
          />
          <div class="form-help">
            Registration fee (0 for free events)
          </div>
        </el-form-item>
        
        <el-form-item label="Registration Deadline">
          <el-date-picker
            v-model="formData.registration_deadline"
            type="datetime"
            placeholder="Select registration deadline"
            :disabled="loading"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="Auto Approve">
          <el-switch
            v-model="formData.auto_approve"
            :disabled="loading"
          />
          <div class="form-help">
            Automatically approve participant registrations
          </div>
        </el-form-item>
      </div>
      
      <!-- Additional Settings -->
      <div class="form-section">
        <h3 class="section-title">Additional Settings</h3>
        
        <el-form-item label="Tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            placeholder="Add tags"
            :disabled="loading"
            style="width: 100%"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Public Event">
          <el-switch
            v-model="formData.is_public"
            :disabled="loading"
          />
          <div class="form-help">
            Make this event visible to all users
          </div>
        </el-form-item>
        
        <el-form-item label="Featured Event">
          <el-switch
            v-model="formData.is_featured"
            :disabled="loading"
          />
          <div class="form-help">
            Feature this event on the homepage
          </div>
        </el-form-item>
      </div>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          Cancel
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? 'Update Event' : 'Create Event' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createEvent, updateEvent } from '@/api/events'

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

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref()

const isEdit = computed(() => !!props.event)

const commonTags = [
  'Beginner Friendly',
  'Advanced',
  'Singles',
  'Doubles',
  'Mixed Doubles',
  'Youth',
  'Senior',
  'Championship',
  'League',
  'Clinic'
]

const defaultFormData = {
  title: '',
  category: 'tournament',
  status: 'draft',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  max_participants: null,
  registration_fee: 0,
  registration_deadline: '',
  auto_approve: true,
  tags: [],
  is_public: true,
  is_featured: false
}

const formData = reactive({ ...defaultFormData })

// Form validation rules
const formRules = {
  title: [
    { required: true, message: 'Please enter event title', trigger: 'blur' },
    { min: 3, max: 100, message: 'Title must be 3-100 characters', trigger: 'blur' }
  ],
  category: [
    { required: true, message: 'Please select category', trigger: 'change' }
  ],
  status: [
    { required: true, message: 'Please select status', trigger: 'change' }
  ],
  description: [
    { required: true, message: 'Please enter description', trigger: 'blur' },
    { min: 10, max: 1000, message: 'Description must be 10-1000 characters', trigger: 'blur' }
  ],
  start_time: [
    { required: true, message: 'Please select start time', trigger: 'change' },
    { validator: validateStartTime, trigger: 'change' }
  ],
  end_time: [
    { required: true, message: 'Please select end time', trigger: 'change' },
    { validator: validateEndTime, trigger: 'change' }
  ],
  location: [
    { required: true, message: 'Please enter location', trigger: 'blur' }
  ],
  max_participants: [
    { type: 'number', min: 1, message: 'Must be at least 1 participant', trigger: 'blur' }
  ]
}

// Custom validators
function validateStartTime(rule, value, callback) {
  if (!value) {
    callback(new Error('Start time is required'))
    return
  }
  
  const startTime = new Date(value)
  const now = new Date()
  
  if (startTime <= now) {
    callback(new Error('Start time must be in the future'))
  } else {
    callback()
  }
}

function validateEndTime(rule, value, callback) {
  if (!value) {
    callback(new Error('End time is required'))
    return
  }
  
  if (!formData.start_time) {
    callback()
    return
  }
  
  const startTime = new Date(formData.start_time)
  const endTime = new Date(value)
  
  if (endTime <= startTime) {
    callback(new Error('End time must be after start time'))
  } else {
    callback()
  }
}

// Watch for dialog visibility changes
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    resetForm()
    if (props.event) {
      populateForm(props.event)
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

const populateForm = (event) => {
  formData.title = event.title || ''
  formData.category = event.category || 'tournament'
  formData.status = event.status || 'draft'
  formData.description = event.description || ''
  formData.start_time = event.start_time || ''
  formData.end_time = event.end_time || ''
  formData.location = event.location || ''
  formData.max_participants = event.max_participants || null
  formData.registration_fee = event.registration_fee || 0
  formData.registration_deadline = event.registration_deadline || ''
  formData.auto_approve = event.auto_approve !== false
  formData.tags = event.tags || []
  formData.is_public = event.is_public !== false
  formData.is_featured = event.is_featured || false
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
      title: formData.title,
      category: formData.category,
      status: formData.status,
      description: formData.description,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      max_participants: formData.max_participants,
      registration_fee: formData.registration_fee,
      registration_deadline: formData.registration_deadline,
      auto_approve: formData.auto_approve,
      tags: formData.tags,
      is_public: formData.is_public,
      is_featured: formData.is_featured
    }
    
    let response
    if (isEdit.value) {
      response = await updateEvent(props.event._id || props.event.id, submitData)
    } else {
      response = await createEvent(submitData)
    }
    
    if (response.success) {
      ElMessage.success(`Event ${isEdit.value ? 'updated' : 'created'} successfully`)
      emit('success', response.data)
      handleClose()
    } else {
      throw new Error(response.error?.message || `Failed to ${isEdit.value ? 'update' : 'create'} event`)
    }
  } catch (error) {
    if (error.name !== 'ElFormValidateError') {
      console.error('Submit event error:', error)
      ElMessage.error(error.message || `Failed to ${isEdit.value ? 'update' : 'create'} event`)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 20px 0;
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

:deep(.el-date-picker) {
  width: 100%;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

@media (max-width: 768px) {
  .form-section {
    margin-bottom: 24px;
    padding-bottom: 16px;
  }
  
  .section-title {
    font-size: 14px;
    margin-bottom: 16px;
  }
}
</style>