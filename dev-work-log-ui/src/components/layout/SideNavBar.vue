<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isActive = (path) => {
  if (path === '/logs') {
    return route.path === '/logs'
  }

  return route.path.startsWith(path)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="h-screen w-64 fixed left-0 top-0 bg-[#f5f3f3] dark:bg-slate-900 flex flex-col p-4 space-y-2 z-50">
    <div class="mb-8 px-2 flex items-center space-x-3">
      <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary shadow-sm">
        <span class="material-symbols-outlined">architecture</span>
      </div>
      <div>
        <h1 class="font-manrope font-bold text-[#00488d] dark:text-blue-400 text-lg leading-tight">研发工作登记</h1>
        <p class="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Enterprise Edition</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1">
      <router-link
        to="/work-planning"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/work-planning')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">event_note</span>
        <span class="font-manrope text-sm tracking-tight">工作规划</span>
      </router-link>

      <router-link
        to="/logs/daily"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/logs/daily')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">edit_note</span>
        <span class="font-manrope text-sm tracking-tight">工作执行</span>
      </router-link>

      <router-link
        to="/work-summary"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/work-summary') || isActive('/dashboard') || isActive('/logs')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">dashboard</span>
        <span class="font-manrope text-sm tracking-tight">工作复盘</span>
      </router-link>

      <router-link
        to="/team-goals"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/team-goals')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">target</span>
        <span class="font-manrope text-sm tracking-tight">团队目标管理</span>
      </router-link>

      <router-link
        to="/project-resource-board"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/project-resource-board')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">monitoring</span>
        <span class="font-manrope text-sm tracking-tight">项目资源看板</span>
      </router-link>

      <router-link
        to="/risk-warning-center"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/risk-warning-center')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">warning</span>
        <span class="font-manrope text-sm tracking-tight">风险预警中心</span>
      </router-link>

      <router-link
        v-if="authStore.isAdmin"
        to="/employees"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/employees')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">group</span>
        <span class="font-manrope text-sm tracking-tight">账号管理</span>
      </router-link>
    </nav>

    <div class="pt-4 border-t border-outline-variant/20 space-y-1">
      <router-link
        to="/profile"
        :class="[
          'rounded-lg flex items-center space-x-3 px-4 py-3 transition-transform duration-200 hover:translate-x-1',
          isActive('/profile')
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800'
        ]"
      >
        <span class="material-symbols-outlined text-sm">person</span>
        <span class="font-manrope text-sm tracking-tight">个人中心</span>
      </router-link>

      <button
        @click="handleLogout"
        class="w-full text-slate-600 dark:text-slate-400 hover:text-error hover:bg-error-container/50 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-3 px-4 py-3 transition-transform duration-200 hover:translate-x-1"
      >
        <span class="material-symbols-outlined text-sm">logout</span>
        <span class="font-manrope text-sm tracking-tight">安全退出</span>
      </button>
    </div>
  </aside>
</template>
