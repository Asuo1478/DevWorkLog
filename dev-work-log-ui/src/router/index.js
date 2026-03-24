import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'logs',
          name: 'logs',
          component: () => import('@/views/LogSummaryView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'logs/daily',
          name: 'daily-log',
          component: () => import('@/views/DailyLogView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/views/EmployeeView.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = !!authStore.user.id
  const isAdmin = authStore.isAdmin

  if (to.meta.requiresAuth && !isAuthenticated) {
    // If route requires auth and user is not logged in, redirect to login
    next('/login')
  } else if (to.name === 'login' && isAuthenticated) {
    // If user is already logged in and tries to access login page, redirect to dashboard
    next('/dashboard')
  } else if (to.meta.requiresAdmin && !isAdmin) {
    // If route requires admin and user is not admin, redirect to dashboard
    next('/dashboard')
  } else {
    // Otherwise, proceed
    next()
  }
})

export default router
