<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-title">Page Not Found</div>
      <div class="error-description">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          Go to Dashboard
        </el-button>
        <el-button @click="goBack">
          <el-icon><Back /></el-icon>
          Go Back
        </el-button>
      </div>
    </div>
    <div class="not-found-illustration">
      <el-icon class="illustration-icon"><QuestionFilled /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
}

.error-description {
  font-size: 16px;
  color: var(--text-color-light);
  line-height: 1.6;
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.not-found-illustration {
  margin-left: 40px;
}

.illustration-icon {
  font-size: 200px;
  color: var(--text-color-lighter);
  opacity: 0.3;
}

@media (max-width: 768px) {
  .not-found {
    flex-direction: column;
    text-align: center;
  }
  
  .not-found-illustration {
    margin-left: 0;
    margin-top: 20px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-description {
    font-size: 14px;
  }
  
  .illustration-icon {
    font-size: 120px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>