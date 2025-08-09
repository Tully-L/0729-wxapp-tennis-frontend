<template>
  <div class="admin-sidebar" :class="{ collapsed }">
    <div class="sidebar-toggle" @click="$emit('toggle')">
      <el-icon><Expand v-if="collapsed" /><Fold v-else /></el-icon>
    </div>
    
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      :unique-opened="true"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/dashboard">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>管理面板</template>
      </el-menu-item>
      
      <el-menu-item index="/users">
        <el-icon><User /></el-icon>
        <template #title>用户管理</template>
      </el-menu-item>
      
      <el-menu-item index="/events">
        <el-icon><Calendar /></el-icon>
        <template #title>赛事管理</template>
      </el-menu-item>
      
      <el-sub-menu index="statistics">
        <template #title>
          <el-icon><PieChart /></el-icon>
          <span>统计数据</span>
        </template>
        <el-menu-item index="/stats/users">
          <el-icon><UserFilled /></el-icon>
          <template #title>用户统计</template>
        </el-menu-item>
        <el-menu-item index="/stats/events">
          <el-icon><TrendCharts /></el-icon>
          <template #title>赛事统计</template>
        </el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="system" v-if="isSuperAdmin">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </template>
        <el-menu-item index="/system/settings">
          <el-icon><Tools /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
        <el-menu-item index="/system/logs">
          <el-icon><Document /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])

const route = useRoute()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const isSuperAdmin = computed(() => authStore.isSuperAdmin)
</script>

<style scoped>
.admin-sidebar {
  width: 250px;
  height: 100%;
  background: var(--bg-color-light);
  border-right: 1px solid var(--border-color-lighter);
  position: fixed;
  left: 0;
  top: 60px;
  z-index: 999;
  transition: width 0.3s ease;
  overflow: hidden;
}

.admin-sidebar.collapsed {
  width: 64px;
}

.sidebar-toggle {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color-lighter);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.sidebar-toggle:hover {
  background-color: var(--bg-color);
}

.sidebar-menu {
  border: none;
  height: calc(100vh - 100px);
  overflow-y: auto;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 250px;
}

/* Custom menu item styles */
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  padding-left: 20px !important;
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(10, 74, 57, 0.1);
  color: var(--primary-color);
  border-right: 3px solid var(--primary-color);
}

:deep(.el-menu-item:hover) {
  background-color: rgba(10, 74, 57, 0.05);
  color: var(--primary-color);
}

:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  padding-left: 20px !important;
}

:deep(.el-sub-menu__title:hover) {
  background-color: rgba(10, 74, 57, 0.05);
  color: var(--primary-color);
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 40px !important;
  background-color: #fafafa;
}

:deep(.el-sub-menu .el-menu-item:hover) {
  background-color: rgba(10, 74, 57, 0.05);
}

/* Collapsed state styles */
:deep(.el-menu--collapse .el-menu-item) {
  padding-left: 20px !important;
}

:deep(.el-menu--collapse .el-sub-menu__title) {
  padding-left: 20px !important;
}

@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .admin-sidebar:not(.collapsed) {
    transform: translateX(0);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
}
</style>