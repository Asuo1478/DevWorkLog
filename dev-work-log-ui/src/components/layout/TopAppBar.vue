<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const isWorkSummaryPage = computed(() => (
  route.path === '/work-summary' || route.path === '/dashboard' || route.path === '/logs'
))

const workSummaryTabs = [
  {
    key: 'dashboard',
    label: '工作看板',
    description: '实时掌握研发工时投入、产品工时分布、周工作时长...'
  },
  {
    key: 'log-summary',
    label: '汇总导出',
    description: '工作日志汇总导出综合查询。'
  }
]

const activeWorkSummaryTab = computed(() => {
  const tab = route.query.tab
  return tab === 'log-summary' ? 'log-summary' : 'dashboard'
})

const switchWorkSummaryTab = (tab) => {
  router.replace({
    path: '/work-summary',
    query: { tab }
  })
}

const pageTitle = computed(() => {
  const map = {
    '/logs/daily': '每日工作登记',
    '/team-goals': '团队目标管理',
    '/work-planning': '工作规划',
    '/project-resource-board': '项目资源看板',
    '/risk-warning-center': '风险预警中心',
    '/employees': '账号管理',
    '/profile': '个人中心'
  }

  return map[route.path] || '研发计划与执行管理系统'
})

const pageSubtitle = computed(() => {
  const map = {
    '/logs/daily': '为卓越研发进行精准记录，以清晰结构承接每日执行信息。',
    '/team-goals': '围绕目标分类与月度资源配置，统一管理团队目标与协同节奏。',
    '/work-planning': '聚焦周计划与项目管理，形成从规划到执行的闭环。',
    '/project-resource-board': '统一查看目标、项目与资源投入分布，辅助资源协调。',
    '/risk-warning-center': '集中查看目标偏差、项目异常与资源风险，支持及时处置。',
    '/employees': '管理团队成员账号、角色与状态信息。',
    '/profile': '查看个人资料并维护账号安全设置。'
  }

  return map[route.path] || ''
})
</script>

<template>
  <header class="w-full sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-surface-container/50 shadow-sm">
    <div class="flex items-center gap-8 min-w-0">
      <template v-if="isWorkSummaryPage">
        <div class="flex items-center min-w-0">
          <div class="inline-flex items-stretch rounded-md bg-surface-container-low border border-outline-variant/10 shadow-sm overflow-hidden">
            <button
              v-for="tab in workSummaryTabs"
              :key="tab.key"
              @click="switchWorkSummaryTab(tab.key)"
              :class="[
                'text-left transition-all px-6 py-3 min-w-[300px] border-t-[3px]',
                activeWorkSummaryTab === tab.key
                  ? 'bg-white border-t-primary'
                  : 'bg-surface-container-low border-t-transparent hover:bg-surface-container'
              ]"
            >
              <h2
                :class="[
                  'font-manrope text-base font-bold tracking-tight leading-none',
                  activeWorkSummaryTab === tab.key ? 'text-primary' : 'text-on-surface'
                ]"
              >
                {{ tab.label }}
              </h2>
              <p
                :class="[
                  'text-xs mt-1.5 whitespace-nowrap',
                  activeWorkSummaryTab === tab.key ? 'text-on-surface-variant/80' : 'text-on-surface-variant/65'
                ]"
              >
                {{ tab.description }}
              </p>
            </button>
          </div>
        </div>
      </template>

      <div v-else>
        <h2 class="font-manrope text-2xl font-bold text-primary tracking-tight">{{ pageTitle }}</h2>
        <p v-if="pageSubtitle" class="text-sm text-on-surface-variant/70 mt-0.5">{{ pageSubtitle }}</p>
      </div>
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
  </header>
</template>
