<template>
  <div class="admin-layout">
    <AdminHeader />
    <div class="admin-main">
      <AdminSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
      <div class="admin-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
        <AdminFooter />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AdminHeader from './AdminHeader.vue'
import AdminSidebar from './AdminSidebar.vue'
import AdminFooter from './AdminFooter.vue'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Handle responsive sidebar
const handleResize = () => {
  if (window.innerWidth <= 768) {
    sidebarCollapsed.value = true
  } else {
    sidebarCollapsed.value = false
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  overflow: hidden;
}

.admin-content.sidebar-collapsed {
  margin-left: 64px;
}

.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--bg-color);
}

@media (max-width: 768px) {
  .admin-content {
    margin-left: 0;
  }
  
  .admin-content.sidebar-collapsed {
    margin-left: 0;
  }
  
  .content-wrapper {
    padding: 16px;
  }
}
</style>