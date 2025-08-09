<template>
  <div class="admin-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="copyright">
          © {{ currentYear }} Tennis Heat Admin System. All rights reserved.
        </span>
      </div>
      <div class="footer-right">
        <span class="version">v{{ appVersion }}</span>
        <el-divider direction="vertical" />
        <el-link type="primary" :underline="false" @click="showAbout">
          About
        </el-link>
        <el-divider direction="vertical" />
        <el-link type="primary" :underline="false" @click="showSupport">
          Support
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

const currentYear = computed(() => new Date().getFullYear())
const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || '1.0.0')

const showAbout = () => {
  ElMessage.info('Tennis Heat Admin System - Built with Vue 3 & Element Plus')
}

const showSupport = () => {
  ElMessage.info('For support, please contact the development team')
}
</script>

<style scoped>
.admin-footer {
  height: 50px;
  background: var(--bg-color-light);
  border-top: 1px solid var(--border-color-lighter);
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 12px;
  color: var(--text-color-lighter);
}

.footer-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copyright {
  font-size: 12px;
}

.version {
  font-size: 12px;
  color: var(--text-color-lighter);
}

@media (max-width: 768px) {
  .admin-footer {
    padding: 0 16px;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 4px;
  }
  
  .footer-left,
  .footer-right {
    font-size: 11px;
  }
}
</style>