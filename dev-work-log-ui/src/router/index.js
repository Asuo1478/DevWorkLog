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
          redirect: '/logs/daily'
        },
        {
          path: 'work-summary',
          name: 'work-summary',
          component: () => import('@/views/WorkSummaryView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'dashboard',
          redirect: '/work-summary?tab=dashboard',
          meta: { requiresAuth: true }
        },
        {
          path: 'logs',
          redirect: '/work-summary?tab=log-summary',
          meta: { requiresAuth: true }
        },
        {
          path: 'logs/daily',
          name: 'daily-log',
          component: () => import('@/views/DailyLogView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'team-goals',
          name: 'team-goals',
          component: () => import('@/views/TeamGoalsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'work-planning',
          name: 'work-planning',
          component: () => import('@/views/WorkPlanningView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'project-resource-board',
          name: 'project-resource-board',
          component: () => import('@/views/ProjectResourceBoardView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'risk-warning-center',
          name: 'risk-warning-center',
          component: () => import('@/views/RiskWarningCenterView.vue'),
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
    // If user is already logged in and tries to access login page, redirect to daily log
    next('/logs/daily')
  } else if (to.meta.requiresAdmin && !isAdmin) {
    // If route requires admin and user is not admin, redirect to daily log
    next('/logs/daily')
  } else {
    // Otherwise, proceed
    next()
  }
})

export default router
