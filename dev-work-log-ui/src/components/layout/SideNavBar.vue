<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const isActive = (path) => {
  // Simple check for exact match or starts with for nested routes
  if (path === '/logs') {
    return route.path === '/logs'
  }
  return route.path.startsWith(path)
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
        to="/dashboard"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/dashboard') 
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1' 
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">dashboard</span>
        <span class="font-manrope text-sm tracking-tight">汇总看板</span>
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
        <span class="font-manrope text-sm tracking-tight">工作登记</span>
      </router-link>

      <router-link 
        to="/logs"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-transform duration-200',
          isActive('/logs') 
            ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1' 
            : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800 hover:translate-x-1'
        ]"
      >
        <span class="material-symbols-outlined">description</span>
        <span class="font-manrope text-sm tracking-tight">工作日志</span>
      </router-link>

      <router-link 
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
      <router-link to="/profile" :class="[
        'rounded-lg flex items-center space-x-3 px-4 py-3 transition-transform duration-200 hover:translate-x-1',
        isActive('/profile') 
          ? 'bg-white dark:bg-slate-800 text-[#00488d] dark:text-blue-400 font-semibold shadow-sm translate-x-1' 
          : 'text-slate-600 dark:text-slate-400 hover:text-[#00488d] hover:bg-[#dbdad9] dark:hover:bg-slate-800'
      ]">
        <span class="material-symbols-outlined text-sm">person</span>
        <span class="font-manrope text-sm tracking-tight">个人中心</span>
      </router-link>
      <router-link to="/login" class="text-slate-600 dark:text-slate-400 hover:text-error hover:bg-error-container/50 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-3 px-4 py-3 transition-transform duration-200 hover:translate-x-1">
        <span class="material-symbols-outlined text-sm">logout</span>
        <span class="font-manrope text-sm tracking-tight">安全退出</span>
      </router-link>
    </div>
  </aside>
</template>
