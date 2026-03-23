<script setup>
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()

const pageTitle = computed(() => {
  const map = {
    '/dashboard': '汇总看板',
    '/logs': '工作日志汇总',
    '/logs/daily': '研发工作登记',
    '/employees': '账号管理',
    '/profile': '个人中心'
  }
  return map[route.path] || '研发工作登记系统'
})

const pageSubtitle = computed(() => {
  const map = {
    '/dashboard': '实时掌握研发资源投入与项目进度',
    '/logs': '研发效能数据与日志综合查询',
    '/logs/daily': '为卓越研发进行精准记录，每日贡献打卡',
    '/employees': '管理团队成员身份、角色及实时状态',
    '/profile': '查看个人基本资料与管理账号安全设置'
  }
  return map[route.path] || ''
})
</script>

<template>
  <header class="w-full sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-surface-container/50 shadow-sm">
    <div class="flex items-center gap-4">
      <div>
        <h2 class="font-manrope text-2xl font-bold text-primary tracking-tight">{{ pageTitle }}</h2>
        <p v-if="pageSubtitle" class="text-sm text-on-surface-variant/70 mt-0.5">{{ pageSubtitle }}</p>
      </div>
    </div>
    
    <div class="flex items-center space-x-6">
      <div class="relative hidden lg:block">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
        <input 
          class="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 w-64 focus:ring-2 focus:ring-primary/20 text-sm transition-all text-on-surface outline-none" 
          placeholder="全局搜索..." 
          type="text"
        />
      </div>
      <div class="flex items-center space-x-3">
        <button class="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative active:scale-95">
          <span class="material-symbols-outlined">notifications</span>
          <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface-bright"></span>
        </button>
        <button class="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95">
          <span class="material-symbols-outlined">help_outline</span>
        </button>
        <div class="h-8 w-px bg-surface-dim opacity-50 mx-1"></div>
        <div :class="`w-9 h-9 rounded-full ring-2 ring-primary/10 shadow-sm overflow-hidden flex items-center justify-center font-bold bg-${authStore.user.theme_color}-fixed text-${authStore.user.theme_color}`">
          <template v-if="authStore.user.avatar">
            <img 
              :alt="authStore.user.name + ' avatar'" 
              class="w-full h-full object-cover" 
              :src="authStore.user.avatar"
            />
          </template>
          <template v-else>
            {{ authStore.user.avatarChar }}
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
