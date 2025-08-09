import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
const Login = () => import('@/views/Login.vue')
const Layout = () => import('@/components/Layout/AdminLayout.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const UserList = () => import('@/views/Users/UserList.vue')
const EventList = () => import('@/views/Events/EventList.vue')
const NotFound = () => import('@/views/NotFound.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login - Tennis Admin',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: Layout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: 'Dashboard - Tennis Admin',
          icon: 'DataAnalysis'
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: UserList,
        meta: {
          title: 'User Management - Tennis Admin',
          icon: 'User'
        }
      },
      {
        path: 'events',
        name: 'Events',
        component: EventList,
        meta: {
          title: 'Event Management - Tennis Admin',
          icon: 'Calendar'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: 'Page Not Found - Tennis Admin'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // Check authentication
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isLoggedIn) {
      // Try to restore session from localStorage
      const token = localStorage.getItem('admin_token')
      if (token) {
        try {
          await authStore.verifyToken()
          next()
        } catch (error) {
          console.error('Token verification failed:', error)
          next('/login')
        }
      } else {
        next('/login')
      }
    } else {
      next()
    }
  } else {
    // Public route
    if (to.name === 'Login' && authStore.isLoggedIn) {
      // Redirect to dashboard if already logged in
      next('/dashboard')
    } else {
      next()
    }
  }
})

// After navigation
router.afterEach((to, from) => {
  // You can add analytics tracking here
  console.log(`Navigated from ${from.path} to ${to.path}`)
})

export default router