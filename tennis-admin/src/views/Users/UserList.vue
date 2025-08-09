<template>
  <div class="user-list">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">用户管理</h1>
        <p class="page-description">管理所有注册用户</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateUser">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
      </div>
    </div>
    
    <!-- Search and Filters -->
    <div class="admin-card">
      <div class="search-section">
        <div class="search-row">
          <el-input
            v-model="searchQuery"
            placeholder="按昵称、邮箱搜索..."
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
            placeholder="状态"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="全部状态" value="" />
            <el-option label="活跃" value="active" />
            <el-option label="已封禁" value="banned" />
          </el-select>
          
          <el-select
            v-model="roleFilter"
            placeholder="角色"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="全部角色" value="" />
            <el-option label="用户" value="user" />
            <el-option label="管理员" value="admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
          
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            Reset
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- User Table -->
    <div class="admin-card">
      <div class="table-header">
        <div class="table-title">
          <span>用户 ({{ pagination.total }})</span>
        </div>
        <div class="table-actions">
          <el-button 
            size="small" 
            @click="showBatchActions = true"
            :disabled="selectedUsers.length === 0"
          >
            <el-icon><Operation /></el-icon>
            批量操作 ({{ selectedUsers.length }})
          </el-button>
          <el-button size="small" @click="exportUsers">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button size="small" @click="refreshUsers">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="users"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
        class="user-table"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="nickname" label="昵称" min-width="120">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.nickname || '无' }}</div>
              <div class="user-email">{{ row.email || '无邮箱' }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getRoleTagType(row.role)"
              size="small"
            >
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="total_points" label="积分" width="100" sortable />
        
        <el-table-column prop="created_at" label="注册时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="last_login" label="最后登录" width="120">
          <template #default="{ row }">
            {{ row.last_login ? formatDate(row.last_login) : '从未' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewUser(row)"
            >
              查看
            </el-button>
            <el-button
              size="small"
              @click="editUser(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleUserAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :command="`status-${row.status === 'active' ? 'banned' : 'active'}`"
                  >
                    {{ row.status === 'active' ? '封禁用户' : '激活用户' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="reset-password">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    删除用户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- User Detail Dialog -->
    <UserDetail
      v-model="showUserDetail"
      :user-id="selectedUserId"
      @edit="handleEditFromDetail"
    />
    
    <!-- User Form Dialog -->
    <UserForm
      v-model="showUserForm"
      :user="editingUser"
      @success="handleUserFormSuccess"
    />
    
    <!-- Password Reset Dialog -->
    <PasswordResetDialog
      v-model="showPasswordReset"
      :user="resetPasswordUser"
      @success="handleUserFormSuccess"
    />
    
    <!-- Batch Actions Dialog -->
    <BatchActionsDialog
      v-model="showBatchActions"
      :selected-users="selectedUsers"
      @success="handleUserFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getUserList, updateUserStatus, deleteUser } from '@/api/users'
import { useTable } from '@/composables/useTable'
import UserDetail from '@/components/User/UserDetail.vue'
import UserForm from '@/components/User/UserForm.vue'
import PasswordResetDialog from '@/components/User/PasswordResetDialog.vue'
import BatchActionsDialog from '@/components/User/BatchActionsDialog.vue'

// Use table composable for data management
const {
  loading,
  data: users,
  selectedRows: selectedUsers,
  pagination,
  searchQuery,
  loadData: loadUsers,
  refresh: refreshUsers,
  handlePageChange,
  handleSizeChange,
  handleSearch,
  handleSelectionChange,
  exportData
} = useTable({
  fetchData: getUserList,
  defaultPageSize: 20
})

// Filters
const statusFilter = ref('')
const roleFilter = ref('')

// Handle filter changes
const handleFilter = () => {
  const filters = {}
  if (statusFilter.value) filters.status = statusFilter.value
  if (roleFilter.value) filters.role = roleFilter.value
  
  loadUsers(filters)
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  loadUsers()
}

const exportUsers = () => {
  exportData('csv', 'users')
}

const showCreateUser = () => {
  editingUser.value = null
  showUserForm.value = true
}

// Dialog states
const showUserDetail = ref(false)
const showUserForm = ref(false)
const showPasswordReset = ref(false)
const showBatchActions = ref(false)
const selectedUserId = ref('')
const editingUser = ref(null)
const resetPasswordUser = ref(null)

const viewUser = (user) => {
  selectedUserId.value = user._id || user.id
  showUserDetail.value = true
}

const editUser = (user) => {
  editingUser.value = user
  showUserForm.value = true
}

const handleEditFromDetail = (user) => {
  editingUser.value = user
  showUserForm.value = true
}

const handleUserFormSuccess = () => {
  loadUsers()
}

const handleUserAction = async (command, user) => {
  const [action, value] = command.split('-')
  
  switch (action) {
    case 'status':
      try {
        await ElMessageBox.confirm(
          `确定要${value === 'active' ? '激活' : '封禁'}此用户吗？`,
          '确认操作',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await updateUserStatus(user._id || user.id, value)
        if (response.success) {
          ElMessage.success(`用户${value === 'active' ? '激活' : '封禁'}成功`)
          loadUsers()
        } else {
          throw new Error(response.error?.message || 'Failed to update user status')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Update user status error:', error)
          ElMessage.error(error.message || 'Failed to update user status')
        }
      }
      break
      
    case 'reset':
      resetPasswordUser.value = user
      showPasswordReset.value = true
      break
      
    case 'delete':
      try {
        await ElMessageBox.confirm(
          '这将永久删除该用户。是否继续？',
          '警告',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'error'
          }
        )
        
        const response = await deleteUser(user._id || user.id)
        if (response.success) {
          ElMessage.success('用户删除成功')
          loadUsers()
        } else {
          throw new Error(response.error?.message || 'Failed to delete user')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Delete user error:', error)
          ElMessage.error(error.message || 'Failed to delete user')
        }
      }
      break
  }
}

const getRoleTagType = (role) => {
  const types = {
    'super_admin': 'danger',
    'admin': 'warning',
    'user': 'info'
  }
  return types[role] || 'info'
}

const getRoleLabel = (role) => {
  const labels = {
    'super_admin': '超级管理员',
    'admin': '管理员',
    'user': '用户'
  }
  return labels[role] || '用户'
}

const getStatusTagType = (status) => {
  const types = {
    'active': 'success',
    'banned': 'danger'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    'active': '活跃',
    'banned': '已封禁'
  }
  return labels[status] || '未知'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-list {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  color: var(--text-color-light);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-section {
  padding: 20px;
}

.search-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  width: 120px;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.user-table {
  margin: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.user-email {
  font-size: 12px;
  color: var(--text-color-lighter);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  border-top: 1px solid var(--border-color-lighter);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .user-table {
    margin: 10px;
  }
}
</style>