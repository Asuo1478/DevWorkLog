import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoginView from '@/views/LoginView.vue'
import WorkSummaryView from '@/views/WorkSummaryView.vue'
import DailyLogView from '@/views/DailyLogView.vue'
import TeamGoalsView from '@/views/TeamGoalsView.vue'
import WorkPlanningView from '@/views/WorkPlanningView.vue'
import ProjectResourceBoardView from '@/views/ProjectResourceBoardView.vue'
import RiskWarningCenterView from '@/views/RiskWarningCenterView.vue'
import EmployeeView from '@/views/EmployeeView.vue'
import ProfileView from '@/views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
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
          component: WorkSummaryView,
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
          component: DailyLogView,
          meta: { requiresAuth: true }
        },
        {
          path: 'team-goals',
          name: 'team-goals',
          component: TeamGoalsView,
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'work-planning',
          name: 'work-planning',
          component: WorkPlanningView,
          meta: { requiresAuth: true }
        },
        {
          path: 'project-resource-board',
          name: 'project-resource-board',
          component: ProjectResourceBoardView,
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'risk-warning-center',
          name: 'risk-warning-center',
          component: RiskWarningCenterView,
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'employees',
          name: 'employees',
          component: EmployeeView,
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isAuthenticated = !!authStore.user.id
  const isAdmin = authStore.isAdmin

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }

  if (to.name === 'login' && isAuthenticated) {
    return '/logs/daily'
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    return '/logs/daily'
  }
})

export default router
