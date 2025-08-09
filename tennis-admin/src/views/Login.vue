<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon size="48" color="var(--primary-color)">
            <Trophy />
          </el-icon>
        </div>
        <h1 class="title">网球管理系统</h1>
        <p class="subtitle">网球热管理平台</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            type="email"
            placeholder="管理员邮箱"
            size="large"
            :prefix-icon="User"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            :disabled="loading"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe" :disabled="loading">
            记住我
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p class="demo-info">
          <el-icon><InfoFilled /></el-icon>
          演示账号: admin@tennis.com / tennis2024
        </p>
      </div>
    </div>
    
    <div class="login-bg">
      <div class="bg-pattern"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Trophy, InfoFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// Form validation rules
const loginRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少需要6个字符', trigger: 'blur' }
  ]
}

// Wake up server function
const wakeUpServer = async () => {
  try {
    // Send a simple health check request to wake up the server
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    await fetch(import.meta.env.VITE_API_BASE_URL.replace('/api', '') + '/health', {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
  } catch (error) {
    // Ignore errors, this is just to wake up the server
    console.log('Wake up call sent to server')
  }
}

// Handle login
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    // Validate form
    await loginFormRef.value.validate()
    
    loading.value = true
    
    // Step 1: Wake up the server
    const wakeUpMessage = ElMessage({
      message: '正在唤醒服务器...',
      type: 'info',
      duration: 0,
      showClose: false
    })
    
    await wakeUpServer()
    wakeUpMessage.close()
    
    // Step 2: Wait a moment for server to fully start
    const startingMessage = ElMessage({
      message: '服务器启动中，请耐心等待一会儿，马上就好...',
      type: 'warning',
      duration: 0,
      showClose: false
    })
    
    // Wait 5 seconds for server to start (increased for better reliability)
    await new Promise(resolve => setTimeout(resolve, 5000))
    startingMessage.close()
    
    // Step 3: Attempt login
    const loginMessage = ElMessage({
      message: '正在登录...',
      type: 'info',
      duration: 0,
      showClose: false
    })
    
    const response = await authStore.login({
      email: loginForm.email,
      password: loginForm.password
    })
    
    loginMessage.close()
    
    if (response.success) {
      ElMessage.success('登录成功！')
      
      // Redirect to dashboard
      const redirect = router.currentRoute.value.query.redirect || '/dashboard'
      router.push(redirect)
    }
    
  } catch (error) {
    console.error('Login error:', error)
    
    // Show appropriate error message
    let errorMessage = '登录失败'
    
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message
    } else if (error.message && !error.message.includes('timeout')) {
      errorMessage = error.message
    }
    
    ElMessage.error(errorMessage)
    
    // Clear password on error
    loginForm.password = ''
    
  } finally {
    loading.value = false
  }
}

// Auto-fill demo credentials
const fillDemoCredentials = () => {
  loginForm.email = 'admin@tennis.com'
  loginForm.password = 'tennis2024'
}

// Initialize
onMounted(() => {
  // Auto-fill demo credentials for development
  if (import.meta.env.DEV) {
    fillDemoCredentials()
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  background-size: 400px 400px;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: var(--text-color-light);
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--border-color-lighter);
}

.demo-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color-light);
  background: rgba(10, 74, 57, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin: 0;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-card {
    margin: 20px;
    padding: 24px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .subtitle {
    font-size: 14px;
  }
}

/* Loading state */
.login-form :deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: var(--bg-color);
}

.login-form :deep(.el-button.is-loading) {
  pointer-events: none;
}

/* Focus states */
.login-form :deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

/* Error states */
.login-form :deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--danger-color) inset;
}
</style>